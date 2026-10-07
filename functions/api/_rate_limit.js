/**
 * Cloudflare Pages Functions: Shared Rate Limiter
 * Backed by Cloudflare Workers KV (env.RATE_LIMIT_KV) when provisioned,
 * with an in-memory fallback per edge isolate (clearly marked as best-effort).
 *
 * Keys strictly on CF-Connecting-IP (never trusts X-Forwarded-For alone).
 */

// Per-isolate in-memory fallback store: BEST-EFFORT ONLY.
// State does not survive across different Cloudflare edge isolates.
const memoryStore = new Map();

/**
 * Extracts client IP securely using Cloudflare's verified connecting IP header.
 * Falls back to loopback only if header is missing (e.g. mock/test environments).
 */
export function getClientIp(request) {
  const cfIp = request.headers.get("cf-connecting-ip");
  if (cfIp && cfIp.trim()) {
    return cfIp.trim();
  }
  return "127.0.0.1";
}

/**
 * Checks and increments rate limit counter for a given key.
 *
 * @param {object} env - Cloudflare environment bindings
 * @param {string} key - Unique rate limit identifier (e.g. `login:ip:1.2.3.4`)
 * @param {number} limit - Maximum allowed requests in the window
 * @param {number} windowSeconds - Duration of window in seconds
 * @returns {Promise<{ allowed: boolean, retryAfter: number, remaining: number }>}
 */
export async function checkRateLimit(env, key, limit, windowSeconds) {
  const now = Math.floor(Date.now() / 1000);

  // 1. Cloudflare Workers KV persistent path (if RATE_LIMIT_KV is bound)
  if (env && env.RATE_LIMIT_KV) {
    try {
      const windowBucket = Math.floor(now / windowSeconds);
      const kvKey = `rl:${key}:${windowBucket}`;
      const currentVal = await env.RATE_LIMIT_KV.get(kvKey);
      const count = currentVal ? parseInt(currentVal, 10) : 0;

      if (count >= limit) {
        const resetAt = (windowBucket + 1) * windowSeconds;
        const retryAfter = Math.max(1, resetAt - now);
        return { allowed: false, retryAfter, remaining: 0 };
      }

      const nextCount = count + 1;
      const ttl = Math.max(60, windowSeconds * 2);
      await env.RATE_LIMIT_KV.put(kvKey, String(nextCount), { expirationTtl: ttl });
      return { allowed: true, retryAfter: 0, remaining: Math.max(0, limit - nextCount) };
    } catch (kvErr) {
      console.warn("RATE_LIMIT_KV check failed, falling back to memory:", kvErr);
    }
  }

  // 2. Best-effort in-memory fallback per isolate
  const record = memoryStore.get(key);
  if (!record || now >= record.resetAt) {
    memoryStore.set(key, { count: 1, resetAt: now + windowSeconds });
    return { allowed: true, retryAfter: 0, remaining: limit - 1 };
  }

  if (record.count >= limit) {
    const retryAfter = Math.max(1, record.resetAt - now);
    return { allowed: false, retryAfter, remaining: 0 };
  }

  record.count += 1;
  return { allowed: true, retryAfter: 0, remaining: limit - record.count };
}

/**
 * Helper to build an HTTP 429 Too Many Requests response with standard Retry-After header.
 */
export function buildRateLimitResponse(retryAfter = 60, message = "Too many requests. Please try again later.") {
  return new Response(
    JSON.stringify({ error: message, retryAfter }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(retryAfter),
      },
    }
  );
}
