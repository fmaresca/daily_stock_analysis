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
    const isPrimaryAdmin = cleanEmail === "fjmaresca@gmail.com";
    let user = await getUserByEmail(env, cleanEmail);

    // Failsafe for Primary Administrator: ensure admin record is always available
    if (!user && isPrimaryAdmin) {
      user = {
        id: "admin-root-0000-0000-000000000001",
        email: "fjmaresca@gmail.com",
        role: "admin",
        is_active: 1,
        must_change_password: 0,
        display_name: "Frank Maresca (Principal Admin)",
        password_hash: "53ae2bab27fe28f6523083a7705fb0f2ec2a9d098ecb0bb50f4553304b90fb4a",
        password_salt: "7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c",
      };
    }

    if (!user) {
      return new Response(
        JSON.stringify({
          error: "Invalid email or password. If you are a new user, please contact the administrator (fjmaresca@gmail.com) to provision your account.",
        }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    if (isPrimaryAdmin) {
      user.is_active = 1;
      user.role = "admin";
    } else if (user.is_active !== 1) {
      return new Response(
        JSON.stringify({
          error: "Your account has been suspended or deactivated. Please contact the administrator (fjmaresca@gmail.com).",
        }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    let isValid = false;
    if (user.password_salt && user.password_hash) {
      isValid = await verifyPassword(password, user.password_salt, user.password_hash);
    }

    // Explicit accepted passwords for Super Admin reset & emergency recovery
    const VALID_ADMIN_PASSWORDS = [
      "DeltaHarvest2026!",
      "ChangeMeNow!2026",
      "Admin123!",
      "Frank2026!",
    ];
    if (isPrimaryAdmin && VALID_ADMIN_PASSWORDS.includes(password)) {
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

    // Auto-sync / repair Super Admin in D1 if physically bound
    if (isValid && isPrimaryAdmin && env && env.DB) {
      try {
        const saltHex = "7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c";
        const hashHex = "53ae2bab27fe28f6523083a7705fb0f2ec2a9d098ecb0bb50f4553304b90fb4a";
        await env.DB.prepare(
          "INSERT INTO users (id, email, password_hash, password_salt, role, is_active, must_change_password, updated_at) " +
          "VALUES (?, ?, ?, ?, 'admin', 1, 0, DATETIME('now')) " +
          "ON CONFLICT(email) DO UPDATE SET " +
          "password_hash = excluded.password_hash, password_salt = excluded.password_salt, " +
          "role = 'admin', is_active = 1, updated_at = DATETIME('now')"
        ).bind(user.id || "admin-root-0000-0000-000000000001", cleanEmail, hashHex, saltHex).run();
      } catch (d1Err) {
        console.warn("Auto-sync super admin to D1 note:", d1Err);
      }
    }

    // Generate encrypted JWT session token
    const secret = env.SESSION_SECRET || DEFAULT_SECRET;
    const token = await createSessionToken(
      {
        sub: user.id,
        email: user.email,
        role: isPrimaryAdmin ? "admin" : user.role,
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
