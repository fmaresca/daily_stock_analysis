/**
 * Cloudflare Pages Function: GET /api/market-recap
 * Edge endpoint delivering daily market recap digest.
 * Cached at edge with ~6h TTL.
 */

import { getDailyMarketRecap } from "./_market_recap_core.js";

export async function onRequest(context) {
  const { request } = context;

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

  try {
    const url = new URL(request.url);
    const forceRefresh = url.searchParams.get("refresh") === "true";
    const recap = await getDailyMarketRecap(forceRefresh);

    return new Response(JSON.stringify(recap), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, s-maxage=21600, stale-while-revalidate=3600",
      },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message || "Failed to generate market recap." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
