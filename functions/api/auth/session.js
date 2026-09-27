import { authenticateRequest } from "../_auth_utils.js";

/**
 * Cloudflare Pages Function: GET /api/auth/session
 * Returns current authenticated user state without exposing internal database UUIDs.
 */
export async function onRequestGet(context) {
  const auth = await authenticateRequest(context);

  if (!auth.authenticated) {
    return new Response(
      JSON.stringify({ authenticated: false, user: null }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }

  // Return a session-scoped, display-safe subset — internal database ID stays server-side
  const safeUser = {
    email: auth.user.email,
    role: auth.user.role,
    must_change_password: auth.user.must_change_password,
    display_name: auth.user.display_name,
  };

  return new Response(
    JSON.stringify({ authenticated: true, user: safeUser }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}
