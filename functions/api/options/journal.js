/**
 * Cloudflare Pages Function: /api/options/journal
 * 
 * Options Signal Journal & Strike Outcome Tracker.
 * Allows users to track recommended or executed options strikes, monitor cushion, and record expiration outcomes.
 */

import { authenticateRequest } from "../_auth_utils.js";

// In-memory dual-track fallback store when D1 is unbound
const memoryJournal = new Map();

/**
 * Ensures table exists in D1 database.
 */
async function ensureJournalTable(db) {
  if (!db || typeof db.prepare !== "function") return;
  try {
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS options_signal_journal (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        symbol TEXT NOT NULL,
        strategy TEXT NOT NULL,
        spot_price REAL,
        strike REAL,
        expiration TEXT,
        delta REAL,
        cushion_pct REAL,
        premium REAL,
        pop_pct REAL,
        status TEXT DEFAULT 'ACTIVE',
        notes TEXT,
        created_at TEXT NOT NULL,
        resolved_at TEXT
      )
    `).run();
    await db.prepare(`
      CREATE INDEX IF NOT EXISTS idx_journal_user ON options_signal_journal(user_id, status)
    `).run();
  } catch (err) {
    console.warn("[Journal] DB table initialization notice:", err.message);
  }
}

/**
 * Main Request Handler for /api/options/journal
 */
export async function onRequest(context) {
  const { request, env } = context;
  const auth = await authenticateRequest(context);
  let userId = auth.authenticated ? (auth.user?.id || auth.user?.user_id) : null;
  if (!userId) {
    if (!env?.SESSION_SECRET || env?.ENVIRONMENT === "test" || !env?.DB) {
      userId = "default_user";
    } else {
      return auth.response || new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  const url = new URL(request.url);

  // 1. GET: List journal entries
  if (request.method === "GET") {
    if (env?.DB) {
      await ensureJournalTable(env.DB);
      try {
        const { results } = await env.DB.prepare(
          "SELECT * FROM options_signal_journal WHERE user_id = ? ORDER BY created_at DESC LIMIT 100"
        ).bind(userId).all();
        return new Response(JSON.stringify({ entries: results || [] }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      } catch (err) {
        console.warn("[Journal] D1 read error, falling back to memory:", err.message);
      }
    }

    const userEntries = memoryJournal.get(userId) || [];
    return new Response(JSON.stringify({ entries: userEntries }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 2. POST: Add new entry
  if (request.method === "POST") {
    const body = await request.json().catch(() => ({}));
    const symbol = (body.symbol || "").trim().toUpperCase();
    if (!symbol) {
      return new Response(JSON.stringify({ error: "Symbol required" }), { status: 400 });
    }

    const id = `jnl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const entry = {
      id,
      user_id: userId,
      symbol,
      strategy: body.strategy || "CSP",
      spot_price: Number(body.spot_price) || 0,
      strike: Number(body.strike) || 0,
      expiration: body.expiration || "",
      delta: Number(body.delta) || 0,
      cushion_pct: Number(body.cushion_pct) || 0,
      premium: Number(body.premium) || 0,
      pop_pct: Number(body.pop_pct) || 0,
      status: "ACTIVE",
      notes: body.notes || "",
      created_at: now,
      resolved_at: null,
    };

    if (env?.DB) {
      await ensureJournalTable(env.DB);
      try {
        await env.DB.prepare(`
          INSERT INTO options_signal_journal
            (id, user_id, symbol, strategy, spot_price, strike, expiration, delta, cushion_pct, premium, pop_pct, status, notes, created_at, resolved_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          entry.id, entry.user_id, entry.symbol, entry.strategy, entry.spot_price,
          entry.strike, entry.expiration, entry.delta, entry.cushion_pct, entry.premium,
          entry.pop_pct, entry.status, entry.notes, entry.created_at, entry.resolved_at
        ).run();
      } catch (err) {
        console.warn("[Journal] D1 insert notice:", err.message);
      }
    }

    const currentMem = memoryJournal.get(userId) || [];
    memoryJournal.set(userId, [entry, ...currentMem]);

    return new Response(JSON.stringify({ success: true, entry }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 3. PATCH: Update status/notes
  if (request.method === "PATCH") {
    const body = await request.json().catch(() => ({}));
    const id = body.id || url.searchParams.get("id");
    if (!id) {
      return new Response(JSON.stringify({ error: "Entry ID required" }), { status: 400 });
    }

    const status = body.status || "CLOSED";
    const notes = body.notes;
    const resolvedAt = status !== "ACTIVE" ? new Date().toISOString() : null;

    if (env?.DB) {
      await ensureJournalTable(env.DB);
      try {
        await env.DB.prepare(
          "UPDATE options_signal_journal SET status = ?, notes = COALESCE(?, notes), resolved_at = ? WHERE id = ? AND user_id = ?"
        ).bind(status, notes, resolvedAt, id, userId).run();
      } catch (err) {
        console.warn("[Journal] D1 update notice:", err.message);
      }
    }

    const currentMem = memoryJournal.get(userId) || [];
    const updated = currentMem.map((e) => (e.id === id ? { ...e, status, resolved_at: resolvedAt } : e));
    memoryJournal.set(userId, updated);

    return new Response(JSON.stringify({ success: true, id, status }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 4. DELETE: Delete entry
  if (request.method === "DELETE") {
    const id = url.searchParams.get("id");
    if (!id) {
      return new Response(JSON.stringify({ error: "Entry ID required" }), { status: 400 });
    }

    if (env?.DB) {
      await ensureJournalTable(env.DB);
      try {
        await env.DB.prepare("DELETE FROM options_signal_journal WHERE id = ? AND user_id = ?").bind(id, userId).run();
      } catch (err) {
        console.warn("[Journal] D1 delete notice:", err.message);
      }
    }

    const currentMem = memoryJournal.get(userId) || [];
    memoryJournal.set(userId, currentMem.filter((e) => e.id !== id));

    return new Response(JSON.stringify({ success: true, deleted: id }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response("Method Not Allowed", { status: 405 });
}

export const onRequestGet = onRequest;
export const onRequestPost = onRequest;
export const onRequestPatch = onRequest;
export const onRequestDelete = onRequest;
