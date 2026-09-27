import {
  authenticateRequest,
  getAdminNotificationEmail,
  setAdminNotificationEmail,
} from "../_auth_utils.js";

/**
 * Cloudflare Pages Function: GET/POST /api/admin/settings
 * Admin-only endpoint to view and update system settings (e.g. admin notification email).
 * Protected by admin role check; never accessible to non-admin clients.
 */

export async function onRequestGet(context) {
  const auth = await authenticateRequest(context, ["admin"]);
  if (!auth.authenticated) return auth.response;

  const email = await getAdminNotificationEmail(context.env);

  return new Response(
    JSON.stringify({
      success: true,
      adminNotificationEmail: email,
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
}

export async function onRequestPost(context) {
  const auth = await authenticateRequest(context, ["admin"]);
  if (!auth.authenticated) return auth.response;

  try {
    const body = await context.request.json().catch(() => ({}));
    const { adminNotificationEmail } = body;

    if (
      !adminNotificationEmail ||
      typeof adminNotificationEmail !== "string" ||
      !adminNotificationEmail.includes("@")
    ) {
      return new Response(
        JSON.stringify({ error: "A valid email address is required for admin notifications." }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const updated = await setAdminNotificationEmail(context.env, adminNotificationEmail);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Admin notification email updated successfully.",
        adminNotificationEmail: updated,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: `Failed to update admin settings: ${err.message}` }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
