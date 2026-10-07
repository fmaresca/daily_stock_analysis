import {
  getUserByEmail,
  verifyPassword,
  createSessionToken,
  buildSessionCookie,
  updateLastLogin,
  requireSessionSecret,
} from "../_auth_utils.js";
import {
  getClientIp,
  checkRateLimit,
  buildRateLimitResponse,
} from "../_rate_limit.js";

/**
 * Cloudflare Pages Function: POST /api/auth/login
 * Authenticates user credentials against Cloudflare D1 and sets secure HTTP-only session cookie.
 */
export async function onRequestPost(context) {
  const { request, env } = context;

  const secret = requireSessionSecret(env);

  try {
    const body = await request.json().catch(() => ({}));
    const { email, password } = body;

    if (!email || !password || typeof email !== "string" || typeof password !== "string") {
      return new Response(
        JSON.stringify({ error: "Email and password are required." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const clientIp = getClientIp(request);

    // Rate Limiting (Prompt 5):
    // 10 attempts per IP per 10 minutes (600s)
    const ipLimit = await checkRateLimit(env, `login:ip:${clientIp}`, 10, 600);
    if (!ipLimit.allowed) {
      return buildRateLimitResponse(ipLimit.retryAfter, "Too many login attempts from this IP. Please try again later.");
    }

    // 5 attempts per email per 15 minutes (900s)
    const emailLimit = await checkRateLimit(env, `login:email:${cleanEmail}`, 5, 900);
    if (!emailLimit.allowed) {
      return buildRateLimitResponse(emailLimit.retryAfter, "Too many login attempts for this account. Please try again later.");
    }

    const user = await getUserByEmail(env, cleanEmail);

    if (!user) {
      return new Response(
        JSON.stringify({ error: "Invalid email or password." }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    if (user.is_active !== 1) {
      return new Response(
        JSON.stringify({
          error: "Your account has been suspended or deactivated. Please contact your administrator.",
        }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    let isValid = false;
    if (user.password_salt && user.password_hash) {
      isValid = await verifyPassword(password, user.password_salt, user.password_hash);
    }

    if (!isValid) {
      return new Response(
        JSON.stringify({ error: "Invalid email or password." }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // Generate encrypted JWT session token using required secret
    const token = await createSessionToken(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
        tv: user.token_version ?? 0,
        name: user.display_name || user.email.split("@")[0],
      },
      secret
    );

    // Update last login timestamp in D1
    await updateLastLogin(env, user.id);

    return new Response(
      JSON.stringify({
        success: true,
        user: {
          email: user.email,
          role: user.role,
          must_change_password: user.must_change_password === 1,
          display_name: user.display_name || user.email.split("@")[0],
        },
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Set-Cookie": buildSessionCookie(token),
        },
      }
    );
  } catch (err) {
    console.error("Login edge error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error during authentication." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
