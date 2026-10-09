import { authenticateRequest, getAdminNotificationEmail } from "../_auth_utils.js";
import { getActiveProviderName, getFallbackSlots } from "../_llm.js";

/**
 * Cloudflare Pages Function: GET /api/admin/diagnostics
 * Returns boolean-only operational health of Cloudflare edge bindings.
 * STRICTLY restricted to authenticated administrators.
 * NEVER leaks secret values, tokens, or sensitive credentials.
 */
export async function onRequestGet(context) {
  const { env } = context;

  const auth = await authenticateRequest(context, ["admin"]);
  if (!auth.authenticated) {
    return auth.response;
  }

  const secretConfigured = Boolean(
    env?.SESSION_SECRET &&
    typeof env.SESSION_SECRET === "string" &&
    env.SESSION_SECRET.trim().length > 0
  );

  const d1Bound = Boolean(env?.DB && typeof env.DB.prepare === "function");

  let d1Writable = false;
  if (d1Bound) {
    try {
      await env.DB.prepare(
        "CREATE TABLE IF NOT EXISTS _d1_health (id INTEGER PRIMARY KEY, ts TEXT)"
      ).run();
      await env.DB.prepare(
        "INSERT INTO _d1_health (id, ts) VALUES (1, ?) ON CONFLICT(id) DO UPDATE SET ts = excluded.ts"
      ).bind(new Date().toISOString()).run();
      d1Writable = true;
    } catch {
      d1Writable = false;
    }
  }

  const rateLimitKvBound = Boolean(
    env?.RATE_LIMIT_KV && typeof env.RATE_LIMIT_KV.get === "function"
  );

  const resendConfigured = Boolean(
    env?.RESEND_API_KEY &&
    typeof env.RESEND_API_KEY === "string" &&
    env.RESEND_API_KEY.trim().length > 0
  );

  const environment =
    typeof env?.ENVIRONMENT === "string" && env.ENVIRONMENT.trim()
      ? env.ENVIRONMENT.trim()
      : "production";

  const adminRecipient = await getAdminNotificationEmail(env);
  const adminEmailConfigured = Boolean(
    adminRecipient &&
    typeof adminRecipient === "string" &&
    adminRecipient.includes("@")
  );

  const adanosConfigured = Boolean(
    env?.ADANOS_API_KEY &&
    typeof env.ADANOS_API_KEY === "string" &&
    env.ADANOS_API_KEY.trim().length > 0
  );

  const llmProvider = getActiveProviderName(env);
  const fallbackSlots = getFallbackSlots(env);
  const llmChain = fallbackSlots.map(s => s.name || s.providerType);

  return new Response(
    JSON.stringify({
      secret_configured: secretConfigured,
      d1_bound: d1Bound,
      d1_writable: d1Writable,
      rate_limit_kv_bound: rateLimitKvBound,
      resend_configured: resendConfigured,
      admin_email_configured: adminEmailConfigured,
      adanos_configured: adanosConfigured,
      llm_provider: llmProvider,
      llm_chain: llmChain,
      environment: environment,
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    }
  );
}
