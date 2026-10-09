import { authenticateRequest } from "../_auth_utils.js";
import { getFallbackSlots, testFallbackSlot } from "../_llm.js";

/**
 * Cloudflare Pages Function: GET /api/admin/llm-chain-test
 * 
 * Attempts one cheap test call per configured numbered fallback slot (1..9).
 * Admin-only: STRICTLY restricted to authenticated administrators.
 * Returns: [{ slot, provider, model, ok, latencyMs, error }]
 * 
 * Iron Rule: Provider and model names only, NEVER keys, tokens, or credentials!
 */
export async function onRequestGet(context) {
  const { env } = context;

  const auth = await authenticateRequest(context, ["admin"]);
  if (!auth.authenticated) {
    return auth.response;
  }

  const slots = getFallbackSlots(env);
  if (!Array.isArray(slots) || slots.length === 0) {
    return new Response(JSON.stringify([]), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  }

  const results = [];
  for (const slot of slots) {
    const slotResult = await testFallbackSlot(env, slot);
    results.push(slotResult);
  }

  return new Response(JSON.stringify(results), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}

export async function onRequest(context) {
  if (context.request.method === "GET") {
    return onRequestGet(context);
  }
  return new Response(JSON.stringify({ error: "Method not allowed" }), {
    status: 405,
    headers: { "Content-Type": "application/json" },
  });
}
