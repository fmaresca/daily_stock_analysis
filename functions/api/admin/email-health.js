import { authenticateRequest } from "../_auth_utils.js";
import { getEmailHealth, timingSafeCompare } from "../_email_delivery.js";

/**
 * Cloudflare Pages Function: GET /api/admin/email-health
 *
 * Dual-access endpoint:
 * 1. External monitors (e.g. UptimeRobot):
 *    Requires query param: ?key=<EMAIL_HEALTH_KEY>
 *    Validated timing-safely against env.EMAIL_HEALTH_KEY. Returns 403 on mismatch.
 * 2. Authenticated Admin Console:
 *    Requires admin session cookie.
 *
 * Always returns HTTP 200 on valid authorization with payload:
 * { healthy, lastSuccessAt, lastFailureAt, recentFailures, latestStatus, latestAttempt, totalLogged }
 */
export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const providedKey = url.searchParams.get("key");

  let authorized = false;

  // 1. External Monitor Key Authorization
  if (providedKey) {
    const expectedKey = env?.EMAIL_HEALTH_KEY;
    if (expectedKey && typeof expectedKey === "string" && expectedKey.trim()) {
      authorized = await timingSafeCompare(providedKey.trim(), expectedKey.trim());
    }
    if (!authorized) {
      return new Response(
        JSON.stringify({ error: "Forbidden: invalid or unconfigured EMAIL_HEALTH_KEY" }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }
  } else {
    // 2. Admin Session Cookie Authorization
    const auth = await authenticateRequest(context, ["admin"]);
    if (!auth.authenticated) {
      return auth.response;
    }
    authorized = true;
  }

  // 3. Query telemetry and return HTTP 200
  const healthData = await getEmailHealth(env);
  return new Response(JSON.stringify(healthData), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
