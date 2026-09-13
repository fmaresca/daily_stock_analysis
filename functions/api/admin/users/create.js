import {
  authenticateRequest,
  getUserByEmail,
  generateRandomSalt,
  hashPassword,
  createUser,
} from "../../_auth_utils.js";

/**
 * Cloudflare Pages Function: POST /api/admin/users/create
 * Provisions a new user account with initial or temporary credentials (admin-only).
 */
export async function onRequestPost(context) {
  const auth = await authenticateRequest(context, ["admin"]);
  if (!auth.authenticated) return auth.response;

  try {
    const body = await context.request.json().catch(() => ({}));
    const {
      email,
      password,
      role = "client",
      must_change_password = true,
      display_name = "",
    } = body;

    if (!email || !password || typeof email !== "string" || typeof password !== "string") {
      return new Response(
        JSON.stringify({ error: "Valid email and initial password are required." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail.includes("@") || !cleanEmail.includes(".")) {
      return new Response(
        JSON.stringify({ error: "Invalid email format." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Check if user already exists
    const existing = await getUserByEmail(context.env, cleanEmail);
    if (existing) {
      return new Response(
        JSON.stringify({ error: "A user with this email address already exists." }),
        { status: 409, headers: { "Content-Type": "application/json" } }
      );
    }

    const saltHex = generateRandomSalt();
    const hashHex = await hashPassword(password, saltHex);

    const created = await createUser(context.env, {
      email: cleanEmail,
      password_hash: hashHex,
      password_salt: saltHex,
      role: role === "admin" ? "admin" : "client",
      is_active: 1,
      must_change_password: must_change_password ? 1 : 0,
      display_name: display_name.trim() || cleanEmail.split("@")[0],
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: `Account for ${cleanEmail} created successfully.`,
        user: {
          id: created.id,
          email: created.email,
          role: created.role,
        },
      }),
      { status: 201, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("User creation error:", err);
    return new Response(
      JSON.stringify({ error: "Failed to create new user account." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
