import { authenticateRequest } from "../_auth_utils.js";

/**
 * Cloudflare Pages Function: GET /api/auth/session
 * Returns current authenticated user state or 401.
 */
export async function onRequestGet(context) {
  const auth = await authenticateRequest(context);

  if (!auth.authenticated) {
    return new Response(
      JSON.stringify({ authenticated: false, user: null }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }

  return new Response(
    JSON.stringify({ authenticated: true, user: auth.user }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}
