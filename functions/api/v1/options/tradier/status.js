import {
  getClientIp,
  checkRateLimit,
  buildRateLimitResponse,
} from "../../../_rate_limit.js";

/**
 * Cloudflare Pages Function: GET/POST /api/v1/options/tradier/status
 * Verifies Tradier API connectivity without passing tokens in URL query strings.
 * Protected by IP-based rate limiting (30 req / min) to prevent burning paid quota.
 * Same-origin endpoint: does NOT expose wildcard CORS.
 */
export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204 });
  }

  // Rate Limiting (Prompt 5): 30 requests per IP per minute (60s)
  const clientIp = getClientIp(request);
  const ipLimit = await checkRateLimit(env, `tradier:status:ip:${clientIp}`, 30, 60);
  if (!ipLimit.allowed) {
    return buildRateLimitResponse(ipLimit.retryAfter, "Too many Tradier status requests. Please try again later.");
  }

  // 1. Extract token from Authorization header if client provided one
  const authHeader = request.headers.get("Authorization") || "";
  let clientToken = "";
  if (authHeader.startsWith("Bearer ")) {
    clientToken = authHeader.substring(7).trim();
  }

  // Support POST body token if provided via application/json
  if (!clientToken && request.method === "POST") {
    try {
      const body = await request.clone().json().catch(() => ({}));
      if (body && typeof body.token === "string") {
        clientToken = body.token.trim();
      }
    } catch {
      // Ignore body parse errors
    }
  }

  // 2. Fall back to server-side provisioned key (supporting all variable aliases & D1 system_settings)
  let serverKey = (
    env?.TRADIER_API_KEY ||
    env?.TRADIER_API_TOKEN ||
    env?.["TRADIER_API-TOKEN"] ||
    env?.TRADIER_TOKEN ||
    env?.["TRADIER-TOKEN"] ||
    ""
  ).trim();

  if (!serverKey && env?.DB) {
    try {
      const row = await env.DB.prepare(
        "SELECT value FROM system_settings WHERE key = 'tradier_api_key' LIMIT 1"
      ).first();
      if (row && row.value && row.value.trim()) {
        serverKey = row.value.trim();
      }
    } catch {
      // Non-blocking
    }
  }

  const token = clientToken || serverKey;
  const isServerProvisioned = !clientToken && !!serverKey;

  if (!token) {
    return new Response(
      JSON.stringify({
        status: "UNCONFIGURED",
        configured: false,
        connected: false,
        server_provisioned: false,
        message: "Tradier API token not configured. Set TRADIER_API_KEY on server or configure key in settings.",
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }

  // 3. Test token against Tradier API
  const useSandbox = (env.TRADIER_USE_SANDBOX || "").toLowerCase() === "true";
  const baseUrl = useSandbox ? "https://sandbox.tradier.com/v1" : "https://api.tradier.com/v1";

  const t0 = Date.now();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const tradierResp = await fetch(`${baseUrl}/markets/quotes?symbols=SPY&greeks=true`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const elapsed = Date.now() - t0;

    if (tradierResp.ok) {
      const data = await tradierResp.json();
      const quotes = data?.quotes?.quote;
      const quote = Array.isArray(quotes) ? quotes[0] : quotes;

      if (quote && quote.symbol) {
        return new Response(
          JSON.stringify({
            status: "CONNECTED",
            configured: true,
            connected: true,
            server_provisioned: isServerProvisioned,
            latency_ms: elapsed,
            sample_quote: {
              symbol: quote.symbol,
              last: Number(quote.last) || Number(quote.close) || 0,
              bid: Number(quote.bid) || 0,
              ask: Number(quote.ask) || 0,
              volume: Number(quote.volume) || 0,
              change: Number(quote.change) || 0,
            },
            message: isServerProvisioned
              ? "Tradier API is active via server-provisioned environment variables (Zero-Knowledge Client)."
              : "Tradier API is active (Primary Market Data Provider).",
          }),
          {
            status: 200,
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
      }
    }

    return new Response(
      JSON.stringify({
        status: "ERROR",
        configured: true,
        connected: false,
        server_provisioned: isServerProvisioned,
        message: tradierResp.status === 401
          ? "Tradier API rejected the token (HTTP 401 Unauthorized)."
          : `Tradier returned HTTP ${tradierResp.status}. Check API token validity.`,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (err) {
    const elapsed = Date.now() - t0;
    return new Response(
      JSON.stringify({
        status: "ERROR",
        configured: true,
        connected: false,
        server_provisioned: isServerProvisioned,
        latency_ms: elapsed,
        message: err.name === "AbortError" ? "Tradier connection timed out (6s)." : `Tradier ping error: ${err.message}`,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}
