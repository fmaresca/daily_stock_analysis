import { buildClearSessionCookie } from "../_auth_utils.js";

/**
 * Cloudflare Pages Function: POST /api/auth/logout
 * Clears the session cookie.
 */
export async function onRequestPost() {
  return new Response(
    JSON.stringify({ success: true, message: "Logged out successfully." }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Set-Cookie": buildClearSessionCookie(),
      },
    }
  );
}
