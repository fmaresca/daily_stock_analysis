/**
 * Cloudflare Pages Function: /api/user/digest-preferences
 * Manages user opt-in and Discord webhook settings for the scheduled morning digest.
 * Strictly authenticated and tenant-isolated (WHERE user_id = session.user.id).
 */

import { authenticateRequest } from "../_auth_utils.js";

let preferencesTableEnsured = false;

export async function ensurePreferencesTable(env) {
  if (preferencesTableEnsured) return;
  if (env?.DB) {
    try {
      await env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS morning_digest_preferences (
          user_id TEXT PRIMARY KEY,
          opted_in INTEGER NOT NULL DEFAULT 0,
          email TEXT NOT NULL,
          discord_webhook_url TEXT,
          updated_at TEXT NOT NULL
        )
      `).run();
      preferencesTableEnsured = true;
    } catch (e) {
      console.warn("D1 ensurePreferencesTable error:", e);
    }
  }
}

// Memory fallback for local dev
const memoryPreferences = new Map();

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  const auth = await authenticateRequest(context);
  if (!auth.authenticated) return auth.response;

  const user = auth.user;
  await ensurePreferencesTable(env);

  if (request.method === "GET") {
    let pref = null;
    if (env?.DB) {
      try {
        pref = await env.DB.prepare(
          "SELECT * FROM morning_digest_preferences WHERE user_id = ?"
        ).bind(user.id).first();
      } catch (e) {
        console.warn("D1 get preferences error:", e);
      }
    } else {
      pref = memoryPreferences.get(user.id);
    }

    return new Response(
      JSON.stringify({
        opted_in: Boolean(pref?.opted_in),
        email: pref?.email || user.email,
        discord_webhook_url: pref?.discord_webhook_url || "",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }

  if (request.method === "POST") {
    let body = {};
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400 });
    }

    const optedIn = body.opted_in ? 1 : 0;
    const discordWebhook = typeof body.discord_webhook_url === "string" ? body.discord_webhook_url.trim() : "";
    const email = (body.email || user.email).trim().toLowerCase();
    const now = new Date().toISOString(); // wall-clock-ok: preference updated timestamp

    if (env?.DB) {
      try {
        await env.DB.prepare(`
          INSERT INTO morning_digest_preferences (user_id, opted_in, email, discord_webhook_url, updated_at)
          VALUES (?, ?, ?, ?, ?)
          ON CONFLICT(user_id) DO UPDATE SET
            opted_in = excluded.opted_in,
            email = excluded.email,
            discord_webhook_url = excluded.discord_webhook_url,
            updated_at = excluded.updated_at
        `).bind(user.id, optedIn, email, discordWebhook, now).run();
      } catch (e) {
        console.warn("D1 save preferences error:", e);
      }
    }

    memoryPreferences.set(user.id, {
      user_id: user.id,
      opted_in: optedIn,
      email,
      discord_webhook_url: discordWebhook,
      updated_at: now,
    });

    return new Response(
      JSON.stringify({
        success: true,
        opted_in: Boolean(optedIn),
        email,
        discord_webhook_url: discordWebhook,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }

  return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
}
