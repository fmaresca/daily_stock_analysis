import { authenticateRequest, toggleUserStatus, getUserById } from "../../_auth_utils.js";

/**
 * Cloudflare Pages Function: POST & PATCH /api/admin/users/toggle-status
 * Activates or deactivates a user account (admin-only).
 */
async function handleToggleStatus(context) {
  const auth = await authenticateRequest(context, ["admin"]);
  if (!auth.authenticated) return auth.response;

  try {
    const body = await context.request.json().catch(() => ({}));
    const { userId } = body;

    if (!userId || typeof userId !== "string") {
      return new Response(
        JSON.stringify({ error: "User ID is required." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (userId === auth.user.id) {
      return new Response(
        JSON.stringify({ error: "Security restriction: You cannot deactivate your own primary administrator account." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    let activeBool = true;
    if (typeof body.isActive === "boolean") {
      activeBool = body.isActive;
    } else if (typeof body.status === "string") {
      activeBool = body.status.toUpperCase() === "ACTIVE";
    } else if (body.is_active !== undefined) {
      activeBool = Number(body.is_active) === 1 || body.is_active === true;
    }

    const targetUser = await getUserById(context.env, userId);
    await toggleUserStatus(context.env, userId, activeBool);

    const userEmail = targetUser?.email || body.email || userId;
    return new Response(
      JSON.stringify({
        success: true,
        userId,
        email: userEmail,
        status: activeBool ? "ACTIVE" : "SUSPENDED",
        is_active: activeBool ? 1 : 0,
        message: `Account status for ${userEmail} set to ${activeBool ? "Active" : "Suspended"}.`,
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

export async function onRequestPost(context) {
  return handleToggleStatus(context);
}

export async function onRequestPatch(context) {
  return handleToggleStatus(context);
}
