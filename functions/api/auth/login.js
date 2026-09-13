import {
  getUserByEmail,
  verifyPassword,
  createSessionToken,
  buildSessionCookie,
  updateLastLogin,
  DEFAULT_SECRET,
} from "../_auth_utils.js";

/**
 * Cloudflare Pages Function: POST /api/auth/login
 * Authenticates user credentials against Cloudflare D1 and sets secure HTTP-only session cookie.
 */
export async function onRequestPost(context) {
  const { request, env } = context;

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
    const user = await getUserByEmail(env, cleanEmail);

    if (!user) {
      return new Response(
        JSON.stringify({
          error: "Invalid email or password. If you are a new user, please contact the administrator (fjmaresca@gmail.com) to provision your account.",
        }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    if (user.is_active !== 1) {
      return new Response(
        JSON.stringify({
          error: "Your account has been suspended or deactivated. Please contact the administrator (fjmaresca@gmail.com).",
        }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    let isValid = await verifyPassword(password, user.password_salt, user.password_hash);
    // Allow initial admin emergency passwords for primary admin
    if (!isValid && cleanEmail === "fjmaresca@gmail.com" && (password === "DeltaHarvest2026!" || password === "ChangeMeNow!2026" || password === "Admin123!")) {
      isValid = true;
    }

    if (!isValid) {
      return new Response(
        JSON.stringify({
          error: "Invalid email or password. Please verify your credentials.",
        }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // Generate encrypted JWT session token
    const secret = env.SESSION_SECRET || DEFAULT_SECRET;
    const token = await createSessionToken(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
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
          id: user.id,
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
