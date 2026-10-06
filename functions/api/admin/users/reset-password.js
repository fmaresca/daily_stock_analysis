import {
  authenticateRequest,
  generateRandomSalt,
  hashPassword,
  resetUserPasswordAdmin,
  resetUserPasswordByEmail,
  getUserById,
  getUserByEmail,
} from "../../_auth_utils.js";

/**
 * Cloudflare Pages Function: POST /api/admin/users/reset-password
 * Resets a client's password and issues a temporary key (admin-only).
 */
export async function onRequestPost(context) {
  const auth = await authenticateRequest(context, ["admin"]);
  if (!auth.authenticated) return auth.response;

  try {
    const body = await context.request.json().catch(() => ({}));
    const { userId, email, newPassword, must_change_password = true } = body;

    const targetIdentifier = userId || email;
    if (!targetIdentifier || !newPassword || typeof newPassword !== "string" || newPassword.length < 6) {
      return new Response(
        JSON.stringify({ error: "User identifier (ID or email) and a new password (min 6 characters) are required." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    let targetUser = null;
    if (userId) {
      targetUser = await getUserById(context.env, userId);
    }
    if (!targetUser && (email || userId)) {
      targetUser = await getUserByEmail(context.env, email || userId);
    }

    if (!targetUser) {
      return new Response(
        JSON.stringify({ error: "Target user not found." }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    const saltHex = generateRandomSalt();
    const hashHex = await hashPassword(newPassword, saltHex);

    await resetUserPasswordAdmin(context.env, targetUser.id, hashHex, saltHex, must_change_password);
    await resetUserPasswordByEmail(context.env, targetUser.email, hashHex, saltHex, must_change_password);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Password for ${targetUser.email} has been reset successfully.`,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Admin password reset error:", err);
    return new Response(
      JSON.stringify({ error: "Failed to reset password." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
