import { authenticateRequest, toggleUserStatus, getUserById } from "../../_auth_utils.js";

/**
 * Cloudflare Pages Function: PATCH /api/admin/users/toggle-status
 * Activates or deactivates a user account (admin-only).
 */
export async function onRequestPatch(context) {
  const auth = await authenticateRequest(context, ["admin"]);
  if (!auth.authenticated) return auth.response;

  try {
    const body = await context.request.json().catch(() => ({}));
    const { userId, isActive } = body;

    if (!userId || typeof isActive !== "boolean") {
      return new Response(
        JSON.stringify({ error: "User ID and boolean isActive status are required." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (userId === auth.user.id) {
      return new Response(
        JSON.stringify({ error: "Security restriction: You cannot deactivate your own primary administrator account." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const targetUser = await getUserById(context.env, userId);
    if (!targetUser) {
      return new Response(
        JSON.stringify({ error: "Target user not found." }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    await toggleUserStatus(context.env, userId, isActive);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Account status for ${targetUser.email} set to ${isActive ? "Active" : "Suspended"}.`,
        is_active: isActive ? 1 : 0,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Toggle status error:", err);
    return new Response(
      JSON.stringify({ error: "Failed to update account status." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
