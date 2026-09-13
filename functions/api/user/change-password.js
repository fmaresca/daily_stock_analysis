import {
  authenticateRequest,
  getUserById,
  verifyPassword,
  generateRandomSalt,
  hashPassword,
  updateUserPassword,
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
    const { currentPassword, newPassword } = body;

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

    const saltHex = generateRandomSalt();
    const hashHex = await hashPassword(newPassword, saltHex);

    await updateUserPassword(context.env, auth.user.id, hashHex, saltHex);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Password changed successfully.",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Self password change error:", err);
    return new Response(
      JSON.stringify({ error: "Failed to update password." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
