import { authenticateRequest, getAllUsers } from "../_auth_utils.js";

/**
 * Cloudflare Pages Function: GET /api/admin/users
 * Returns list of all registered tenants (admin-only).
 */
export async function onRequestGet(context) {
  const auth = await authenticateRequest(context, ["admin"]);
  if (!auth.authenticated) return auth.response;

  try {
    const users = await getAllUsers(context.env);
    return new Response(
      JSON.stringify({ success: true, users }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Failed to fetch users:", err);
    return new Response(
      JSON.stringify({ error: "Failed to retrieve user list." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
