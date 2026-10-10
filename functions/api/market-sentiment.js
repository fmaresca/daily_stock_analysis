import {
  getClientIp,
  checkRateLimit,
  buildRateLimitResponse,
} from "./_rate_limit.js";

/**
 * Cloudflare Pages Function: GET /api/market-sentiment
 * Secure server-side proxy for the Adanos Market Sentiment API.
 * 
 * Rules:
 * 1. Reads env.ADANOS_API_KEY. Never exposes or logs the key.
 * 2. Validates ?symbol= (1-6 uppercase letters).
 * 3. Degrades gracefully to HTTP 200 { configured: false, sentiment: null } when unconfigured.
 * 4. Fans out in parallel to four stock namespaces: reddit, x, polymarket, news.
 * 5. Fetches AI explanation with fallback (reddit -> x -> news).
 * 6. Implements 15-minute TTL caching in KV with in-memory fallback.
 * 7. On upstream timeout/failure, serves stale cache if available or { configured: true, sentiment: null }.
 */

const BASE_URL = "https://api.adanos.org";
const STOCK_NAMESPACES = ["reddit", "x", "polymarket", "news"];
const EXPLAIN_NAMESPACES = ["reddit", "x", "news"];
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes fresh TTL
const MAX_STALE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours max stale fallback
const UPSTREAM_TIMEOUT_MS = 8000; // 8-second hard timeout

// In-memory cache fallback per edge isolate
const memorySentimentCache = new Map();

export async function onRequest(context) {
  const { request, env } = context;

  // Handle CORS preflight
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  if (request.method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  const url = new URL(request.url);
  const rawSymbol = url.searchParams.get("symbol");

  // Validate symbol: 1-6 ASCII letters
  if (!rawSymbol || typeof rawSymbol !== "string" || !/^[A-Za-z]{1,6}$/.test(rawSymbol.trim())) {
    return new Response(
      JSON.stringify({ error: 'Query parameter "symbol" is required and must be 1 to 6 uppercase letters.' }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
  const symbol = rawSymbol.trim().toUpperCase();

  // If ADANOS_API_KEY is missing, gracefully return unconfigured state (never 500)
  const apiKey = typeof env?.ADANOS_API_KEY === "string" ? env.ADANOS_API_KEY.trim() : "";
  if (!apiKey) {
    return new Response(
      JSON.stringify({ configured: false, sentiment: null }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // Rate Limiting: 60 requests per IP per minute
  const clientIp = getClientIp(request);
  const ipLimit = await checkRateLimit(env, `sentiment:ip:${clientIp}`, 60, 60);
  if (!ipLimit.allowed) {
    return buildRateLimitResponse(ipLimit.retryAfter, "Too many sentiment requests. Please try again later.");
  }

  const now = Date.now(); // wall-clock-ok: cache TTL calculation

  // 1. Check local isolate memory cache
  let cachedEntry = memorySentimentCache.get(symbol);

  // 2. Check KV persistent cache if not in memory
  if (!cachedEntry && env?.RATE_LIMIT_KV) {
    try {
      const kvRaw = await env.RATE_LIMIT_KV.get(`cache:sentiment:${symbol}`);
      if (kvRaw) {
        cachedEntry = JSON.parse(kvRaw);
        if (cachedEntry) {
          memorySentimentCache.set(symbol, cachedEntry);
        }
      }
    } catch {
      // Non-blocking KV retrieval
    }
  }

  // If fresh cache hit (< 15 mins), serve immediately
  if (cachedEntry && cachedEntry.data && (now - cachedEntry.cachedAt < CACHE_TTL_MS)) {
    return new Response(
      JSON.stringify({
        ...cachedEntry.data,
        cached: true,
        asOf: cachedEntry.data.asOf || new Date(cachedEntry.cachedAt).toISOString(), // wall-clock-ok: response timestamp
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=900",
        },
      }
    );
  }

  // 3. Upstream fetch: Fan out in parallel with hard timeout
  const t0 = performance.now();
  const controller = new AbortController();
  const timeoutTimer = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);

  try {
    const stockPromises = STOCK_NAMESPACES.map(async (ns) => {
      try {
        const resp = await fetch(`${BASE_URL}/${ns}/stocks/v1/stock/${encodeURIComponent(symbol)}`, {
          headers: {
            "X-API-Key": apiKey,
            Accept: "application/json",
          },
          signal: controller.signal,
        });

        if (!resp.ok) {
          return { ns, ok: false, status: resp.status };
        }

        const data = await resp.json();
        return { ns, ok: true, status: resp.status, data };
      } catch (err) {
        return { ns, ok: false, error: err.name || "FetchError" };
      }
    });

    const explainPromise = (async () => {
      for (const ns of EXPLAIN_NAMESPACES) {
        try {
          const resp = await fetch(
            `${BASE_URL}/${ns}/stocks/v1/stock/${encodeURIComponent(symbol)}/explain`,
            {
              headers: {
                "X-API-Key": apiKey,
                Accept: "application/json",
              },
              signal: controller.signal,
            }
          );
          if (resp.ok) {
            const data = await resp.json();
            if (data && typeof data.explanation === "string" && data.explanation.trim()) {
              return {
                explanation: data.explanation.trim(),
                explanation_source: ns,
              };
            }
          }
        } catch {
          // Fall through to next namespace
        }
      }
      return { explanation: null, explanation_source: null };
    })();

    const [stockResults, explainResult] = await Promise.all([
      Promise.all(stockPromises),
      explainPromise,
    ]);

    clearTimeout(timeoutTimer);
    const latencyMs = Math.round(performance.now() - t0);

    // Redacted server logging: symbol, upstream status codes, and latency only. Never key material.
    const statusSummary = stockResults.map((r) => `${r.ns}:${r.status || r.error || "ok"}`).join(", ");
    console.log(`[adanos_sentiment] symbol=${symbol} latency=${latencyMs}ms upstream=[${statusSummary}]`);

    // Check if upstream timed out or failed across all endpoints
    const allErrored = stockResults.every((r) => !r.ok && (r.error || r.status >= 500));
    if (allErrored) {
      if (cachedEntry && cachedEntry.data && (now - cachedEntry.cachedAt < MAX_STALE_TTL_MS)) {
        return new Response(
          JSON.stringify({
            ...cachedEntry.data,
            asOf: cachedEntry.data.asOf || new Date(cachedEntry.cachedAt).toISOString(), // wall-clock-ok: response timestamp
            stale: true,
            cached: true,
          }),
          {
            status: 200,
            headers: {
              "Content-Type": "application/json",
              "X-Cache-Status": "STALE",
            },
          }
        );
      }

      return new Response(
        JSON.stringify({
          configured: true,
          symbol,
          sentiment: null,
          error: "Market sentiment upstream service temporarily unavailable",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Parse and normalize sources
    const sources = {};
    let totalMentions = 0;
    let weightedSentimentSum = 0;
    let sentimentCount = 0;
    let weightedBuzzSum = 0;
    let buzzCount = 0;
    let weightedBullishSum = 0;
    let bullishCount = 0;
    let weightedBearishSum = 0;
    let bearishCount = 0;
    let topTrend = null;
    let maxBuzz = -1;

    for (const r of stockResults) {
      if (!r.ok || !r.data || r.data.found === false) {
        // Omit source block when found is false or error occurred (never null-fill with fake zeros)
        continue;
      }

      const d = r.data;
      const srcBlock = {};

      if (typeof d.sentiment_score === "number" && !isNaN(d.sentiment_score)) {
        srcBlock.sentiment_score = Math.round(d.sentiment_score * 100) / 100;
      }
      if (typeof d.buzz_score === "number" && !isNaN(d.buzz_score)) {
        srcBlock.buzz_score = Math.round(d.buzz_score * 10) / 10;
      }
      if (typeof d.mentions === "number" && !isNaN(d.mentions)) {
        srcBlock.mentions = Math.round(d.mentions);
      }
      if (typeof d.bullish_pct === "number" && !isNaN(d.bullish_pct)) {
        srcBlock.bullish_pct = Math.round(d.bullish_pct);
      }
      if (typeof d.bearish_pct === "number" && !isNaN(d.bearish_pct)) {
        srcBlock.bearish_pct = Math.round(d.bearish_pct);
      }
      if (typeof d.trend === "string" && d.trend) {
        srcBlock.trend = d.trend;
      }

      sources[r.ns] = srcBlock;

      const mentions = srcBlock.mentions || 0;
      totalMentions += mentions;

      if (srcBlock.sentiment_score !== undefined) {
        const weight = mentions > 0 ? mentions : 1;
        weightedSentimentSum += srcBlock.sentiment_score * weight;
        sentimentCount += weight;
      }
      if (srcBlock.buzz_score !== undefined) {
        const weight = mentions > 0 ? mentions : 1;
        weightedBuzzSum += srcBlock.buzz_score * weight;
        buzzCount += weight;
        if (srcBlock.buzz_score > maxBuzz) {
          maxBuzz = srcBlock.buzz_score;
          if (srcBlock.trend) topTrend = srcBlock.trend;
        }
      }
      if (srcBlock.bullish_pct !== undefined) {
        const weight = mentions > 0 ? mentions : 1;
        weightedBullishSum += srcBlock.bullish_pct * weight;
        bullishCount += weight;
      }
      if (srcBlock.bearish_pct !== undefined) {
        const weight = mentions > 0 ? mentions : 1;
        weightedBearishSum += srcBlock.bearish_pct * weight;
        bearishCount += weight;
      }
    }

    const hasCoverage = Object.keys(sources).length > 0;

    const normalized = {
      configured: true,
      symbol,
      sentiment_score: hasCoverage && sentimentCount > 0 ? Math.round((weightedSentimentSum / sentimentCount) * 100) / 100 : null,
      buzz_score: hasCoverage && buzzCount > 0 ? Math.round(weightedBuzzSum / buzzCount) : null,
      bullish_pct: hasCoverage && bullishCount > 0 ? Math.round(weightedBullishSum / bullishCount) : null,
      bearish_pct: hasCoverage && bearishCount > 0 ? Math.round(weightedBearishSum / bearishCount) : null,
      mentions: totalMentions,
      trend: topTrend || (hasCoverage ? "stable" : null),
      sources,
      explanation: explainResult.explanation,
      explanation_source: explainResult.explanation_source,
      asOf: new Date().toISOString(), // wall-clock-ok: response timestamp
    };

    // Store into memory cache & KV
    const record = { data: normalized, cachedAt: now };
    memorySentimentCache.set(symbol, record);
    if (env?.RATE_LIMIT_KV) {
      try {
        await env.RATE_LIMIT_KV.put(`cache:sentiment:${symbol}`, JSON.stringify(record), {
          expirationTtl: 86400, // 24 hours to support stale-on-upstream-failure
        });
      } catch {
        // Non-blocking KV save
      }
    }

    return new Response(JSON.stringify(normalized), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=900",
      },
    });
  } catch (upstreamErr) {
    clearTimeout(timeoutTimer);
    console.warn(`[adanos_sentiment_error] symbol=${symbol} error=${upstreamErr?.message || "timeout"}`);

    // Serve stale cache if available within MAX_STALE_TTL_MS
    if (cachedEntry && cachedEntry.data && (now - cachedEntry.cachedAt < MAX_STALE_TTL_MS)) {
      return new Response(
        JSON.stringify({
          ...cachedEntry.data,
          asOf: cachedEntry.data.asOf || new Date(cachedEntry.cachedAt).toISOString(), // wall-clock-ok: response timestamp
          stale: true,
          cached: true,
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "X-Cache-Status": "STALE",
          },
        }
      );
    }

    // Degrade gracefully with sentiment: null
    return new Response(
      JSON.stringify({
        configured: true,
        symbol,
        sentiment: null,
        error: "Market sentiment upstream service temporarily unavailable",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
