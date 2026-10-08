import {
  authenticateRequest,
  getUserById,
  verifyPassword,
  generateRandomSalt,
  hashPassword,
  updateUserPassword,
  requireSessionSecret,
  createSessionToken,
  buildSessionCookie,
} from "../_auth_utils.js";

/**
 * Cloudflare Pages Function: POST /api/user/change-password
 * Self-service password change for authenticated users.
 */
export async function onRequestPost(context) {
  const auth = await authenticateRequest(context);
  if (!auth.authenticated) return auth.response;

  try {
    const body = await context.request.json().catch(() => ({}));
    const currentPassword = body.currentPassword || body.oldPassword;
    const { newPassword } = body;

    if (!currentPassword || !newPassword || typeof newPassword !== "string" || newPassword.length < 8) {
      return new Response(
        JSON.stringify({ error: "Current password and a new password (min 8 characters) are required." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const user = await getUserById(context.env, auth.user.id);
    if (!user) {
      return new Response(
        JSON.stringify({ error: "User record not found." }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    const isCurrentValid = await verifyPassword(currentPassword, user.password_salt, user.password_hash);
    if (!isCurrentValid) {
      return new Response(
        JSON.stringify({ error: "Incorrect current password." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (currentPassword === newPassword) {
      return new Response(
        JSON.stringify({ error: "New password cannot be identical to current password." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const saltHex = generateRandomSalt();
    const hashHex = await hashPassword(newPassword, saltHex);

    await updateUserPassword(context.env, auth.user.id, hashHex, saltHex);

    // Re-issue updated session cookie with bumped token_version and must_change_password=0
    let cookieHeader = null;
    try {
      const secret = requireSessionSecret(context.env);
      const updatedUser = await getUserById(context.env, auth.user.id);
      const newTv = updatedUser ? Number(updatedUser.token_version || 0) : (Number(auth.user.token_version || 0) + 1);
      const newToken = await createSessionToken(
        {
          sub: auth.user.id,
          email: auth.user.email,
          role: auth.user.role,
          tv: newTv,
          name: auth.user.display_name,
        },
        secret
      );
      cookieHeader = buildSessionCookie(newToken);
    } catch (tokenErr) {
      console.warn("Notice: Session secret unavailable or token creation skipped:", tokenErr.message);
    }

    const headers = { "Content-Type": "application/json" };
    if (cookieHeader) {
      headers["Set-Cookie"] = cookieHeader;
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Password changed successfully.",
        user: {
          email: auth.user.email,
          role: auth.user.role,
          must_change_password: false,
          display_name: auth.user.display_name,
        },
      }),
      { status: 200, headers }
    );
  } catch (err) {
    console.error("Self password change error:", err);
    return new Response(
      JSON.stringify({ error: "Failed to update password." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

