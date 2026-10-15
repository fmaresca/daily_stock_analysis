/**
 * Shared Email Delivery Subsystem
 *
 * Provides:
 * 1. sendResendEmail: Resend REST API transport with exponential backoff on transient errors (429, 5xx, network).
 * 2. logEmailDelivery: Append-only D1 audit log (email_delivery_log) for all delivery attempts.
 * 3. getEmailHealth: Telemetry and uptime query over email_delivery_log.
 * 4. timingSafeCompare: Timing-safe cryptographic comparison using SHA-256 hashing.
 */

/**
 * POST to Resend with retry on transient failures.
 * Retries: HTTP 429 and 5xx (up to 3 attempts, 1s/2s backoff).
 * Never retries: other 4xx (permanent — e.g. 401 bad key, 403 account/domain issue).
 * Returns { ok, status, body, attempts }.
 */
export async function sendResendEmail({ apiKey, from, to, subject, text, html, replyTo }) {
  if (!apiKey || typeof apiKey !== "string" || !apiKey.trim()) {
    return {
      ok: false,
      status: 0,
      body: { name: "configuration_error", message: "RESEND_API_KEY is not provisioned or is empty." },
      attempts: 0,
    };
  }

  const maxAttempts = 3;
  let lastStatus = 0;
  let lastBody = {};
  let attemptsMade = 0;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    attemptsMade = attempt;
    let resp;
    try {
      resp = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey.trim()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to: Array.isArray(to) ? to : [to],
          ...(replyTo ? { reply_to: replyTo } : {}),
          subject,
          ...(text ? { text } : {}),
          ...(html ? { html } : {}),
        }),
      });
    } catch (netErr) {
      lastBody = { name: "network_error", message: String(netErr).slice(0, 300) };
      if (attempt === maxAttempts) break;
      await new Promise((r) => setTimeout(r, 1000 * attempt));
      continue;
    }

    lastStatus = resp.status;
    lastBody = await resp.json().catch(() => ({}));
    if (resp.ok) return { ok: true, status: resp.status, body: lastBody, attempts: attempt };

    const retryable = resp.status === 429 || resp.status >= 500;
    if (!retryable || attempt === maxAttempts) break;
    await new Promise((r) => setTimeout(r, 1000 * attempt));
  }

  return { ok: false, status: lastStatus, body: lastBody, attempts: attemptsMade };
}

/**
 * Append-only delivery log in D1. Best-effort: never throws.
 */
export async function logEmailDelivery(env, { endpoint, recipient, channel, httpStatus, attempts, errorName, errorMessage }) {
  if (!env?.DB) return;
  try {
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS email_delivery_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        endpoint TEXT NOT NULL,
        recipient TEXT,
        channel TEXT,
        http_status INTEGER,
        attempts INTEGER,
        error_name TEXT,
        error_message TEXT,
        created_at TEXT NOT NULL DEFAULT (DATETIME('now'))
      )
    `).run();
    await env.DB.prepare(`
      INSERT INTO email_delivery_log (endpoint, recipient, channel, http_status, attempts, error_name, error_message)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      endpoint,
      recipient || null,
      channel || null,
      httpStatus ?? null,
      attempts ?? null,
      errorName || null,
      errorMessage ? String(errorMessage).slice(0, 500) : null
    ).run();
  } catch (e) {
    console.warn("[email] D1 delivery-log write failed:", e);
  }
}

/**
 * Query email delivery health stats from D1 email_delivery_log.
 */
export async function getEmailHealth(env) {
  if (!env?.DB) {
    return {
      healthy: false,
      lastSuccessAt: null,
      lastFailureAt: null,
      recentFailures: 0,
      totalLogged: 0,
      latestStatus: "EMPTY",
      latestAttempt: null,
    };
  }

  try {
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS email_delivery_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        endpoint TEXT NOT NULL,
        recipient TEXT,
        channel TEXT,
        http_status INTEGER,
        attempts INTEGER,
        error_name TEXT,
        error_message TEXT,
        created_at TEXT NOT NULL DEFAULT (DATETIME('now'))
      )
    `).run();

    // 1. Aggregates over past 7 days
    const statsRow = await env.DB.prepare(`
      SELECT
        MAX(CASE WHEN (channel IN ('Resend API', 'MailChannels') OR channel IS NULL) AND http_status >= 200 AND http_status < 300 THEN created_at ELSE NULL END) as last_success_at,
        MAX(CASE WHEN http_status >= 400 OR http_status IS NULL OR http_status = 0 THEN created_at ELSE NULL END) as last_failure_at,
        COUNT(CASE WHEN (http_status >= 400 OR http_status IS NULL OR http_status = 0) THEN 1 ELSE NULL END) as recent_failures,
        COUNT(*) as total_logged
      FROM email_delivery_log
      WHERE created_at >= DATETIME('now', '-7 days')
    `).first().catch(() => null);

    // 2. Latest attempt
    const latestRow = await env.DB.prepare(`
      SELECT http_status, channel, error_name, error_message, created_at
      FROM email_delivery_log
      ORDER BY id DESC
      LIMIT 1
    `).first().catch(() => null);

    const lastSuccessAt = statsRow?.last_success_at || null;
    const lastFailureAt = statsRow?.last_failure_at || null;
    const recentFailures = Number(statsRow?.recent_failures || 0);
    const totalLogged = Number(statsRow?.total_logged || 0);

    let healthy = false;
    if (lastSuccessAt !== null) {
      if (lastFailureAt === null) {
        healthy = true;
      } else {
        healthy = lastSuccessAt > lastFailureAt;
      }
    }

    let latestStatus = "EMPTY";
    if (latestRow) {
      const isSuccess = latestRow.http_status >= 200 && latestRow.http_status < 300;
      latestStatus = isSuccess ? "OK" : "FAILING";
    }

    return {
      healthy,
      lastSuccessAt,
      lastFailureAt,
      recentFailures,
      totalLogged,
      latestStatus,
      latestAttempt: latestRow ? {
        channel: latestRow.channel,
        httpStatus: latestRow.http_status,
        createdAt: latestRow.created_at,
        errorName: latestRow.error_name,
        errorMessage: latestRow.error_message,
      } : null,
    };
  } catch (err) {
    console.warn("[email] getEmailHealth D1 query error:", err);
    return {
      healthy: false,
      lastSuccessAt: null,
      lastFailureAt: null,
      recentFailures: 0,
      totalLogged: 0,
      latestStatus: "EMPTY",
      latestAttempt: null,
    };
  }
}

/**
 * Timing-safe string comparison using SHA-256 digests.
 * Eliminates timing leaks including length variance.
 */
export async function timingSafeCompare(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const enc = new TextEncoder();
  const [hashA, hashB] = await Promise.all([
    crypto.subtle.digest("SHA-256", enc.encode(a)),
    crypto.subtle.digest("SHA-256", enc.encode(b)),
  ]);
  const aView = new Uint8Array(hashA);
  const bView = new Uint8Array(hashB);
  let mismatch = 0;
  for (let i = 0; i < 32; i++) {
    mismatch |= aView[i] ^ bView[i];
  }
  return mismatch === 0;
}
