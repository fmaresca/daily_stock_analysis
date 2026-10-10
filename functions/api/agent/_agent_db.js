/**
 * Database and storage helpers for Conversational Strategy Q&A Agent.
 * Multi-tenant isolation: every query is scoped WHERE user_id = ?.
 * Supports Cloudflare D1 with automatic in-memory fallback for development.
 */

const memorySessions = new Map(); // id -> session
const memoryMessages = new Map(); // id -> message

let agentTablesEnsured = false;

export async function ensureAgentTables(env) {
  if (agentTablesEnsured) return;
  if (env?.DB) {
    try {
      await env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS agent_chat_sessions (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          ticker TEXT,
          lens TEXT,
          title TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        )
      `).run();
      await env.DB.prepare(`
        CREATE INDEX IF NOT EXISTS idx_chat_sessions_user ON agent_chat_sessions(user_id, updated_at DESC)
      `).run();

      await env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS agent_chat_messages (
          id TEXT PRIMARY KEY,
          session_id TEXT NOT NULL,
          user_id TEXT NOT NULL,
          role TEXT NOT NULL,
          content TEXT NOT NULL,
          lens TEXT,
          created_at TEXT NOT NULL
        )
      `).run();
      await env.DB.prepare(`
        CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON agent_chat_messages(session_id, created_at ASC)
      `).run();
      agentTablesEnsured = true;
    } catch (e) {
      console.warn("[AgentDB] ensureAgentTables error:", e);
    }
  }
}

export async function getOrCreateSession(env, userId, sessionId, ticker = "", lens = "Trend/Momentum") {
  await ensureAgentTables(env);
  const now = new Date().toISOString(); // wall-clock-ok: session created timestamp

  if (sessionId) {
    if (env?.DB) {
      const row = await env.DB.prepare(
        "SELECT * FROM agent_chat_sessions WHERE id = ? AND user_id = ?"
      ).bind(sessionId, userId).first();
      if (row) return row;
    } else {
      const mem = memorySessions.get(sessionId);
      if (mem && mem.user_id === userId) return mem;
    }
  }

  const newId = sessionId || `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`; // wall-clock-ok: unique session ID
  const title = ticker ? `Analysis of ${ticker}` : "Strategy Conversation";
  const sessionRecord = {
    id: newId,
    user_id: userId,
    ticker: ticker || "",
    lens: lens || "Trend/Momentum",
    title,
    created_at: now,
    updated_at: now,
  };

  if (env?.DB) {
    try {
      await env.DB.prepare(`
        INSERT INTO agent_chat_sessions (id, user_id, ticker, lens, title, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(newId, userId, ticker || "", lens || "Trend/Momentum", title, now, now).run();
    } catch (e) {
      console.warn("[AgentDB] createSession D1 error:", e);
    }
  }

  memorySessions.set(newId, sessionRecord);
  return sessionRecord;
}

export async function listUserSessions(env, userId) {
  await ensureAgentTables(env);
  if (env?.DB) {
    try {
      const { results } = await env.DB.prepare(
        "SELECT * FROM agent_chat_sessions WHERE user_id = ? ORDER BY updated_at DESC LIMIT 50"
      ).bind(userId).all();
      return results || [];
    } catch (e) {
      console.warn("[AgentDB] listUserSessions D1 error:", e);
    }
  }

  return Array.from(memorySessions.values())
    .filter((s) => s.user_id === userId)
    .sort((a, b) => (b.updated_at > a.updated_at ? 1 : -1));
}

export async function getSessionMessages(env, userId, sessionId) {
  await ensureAgentTables(env);
  if (env?.DB) {
    try {
      const { results } = await env.DB.prepare(
        "SELECT * FROM agent_chat_messages WHERE session_id = ? AND user_id = ? ORDER BY created_at ASC"
      ).bind(sessionId, userId).all();
      return results || [];
    } catch (e) {
      console.warn("[AgentDB] getSessionMessages D1 error:", e);
    }
  }

  return Array.from(memoryMessages.values())
    .filter((m) => m.session_id === sessionId && m.user_id === userId)
    .sort((a, b) => (a.created_at > b.created_at ? 1 : -1));
}

export async function saveMessage(env, userId, sessionId, role, content, lens = "") {
  await ensureAgentTables(env);
  const now = new Date().toISOString(); // wall-clock-ok: message created timestamp
  const id = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`; // wall-clock-ok: unique message ID

  const msg = {
    id,
    session_id: sessionId,
    user_id: userId,
    role,
    content,
    lens: lens || "",
    created_at: now,
  };

  if (env?.DB) {
    try {
      await env.DB.prepare(`
        INSERT INTO agent_chat_messages (id, session_id, user_id, role, content, lens, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(id, sessionId, userId, role, content, lens || "", now).run();

      await env.DB.prepare(`
        UPDATE agent_chat_sessions SET updated_at = ?, lens = CASE WHEN ? != '' THEN ? ELSE lens END WHERE id = ? AND user_id = ?
      `).bind(now, lens || "", lens || "", sessionId, userId).run();
    } catch (e) {
      console.warn("[AgentDB] saveMessage D1 error:", e);
    }
  }

  memoryMessages.set(id, msg);
  const memSession = memorySessions.get(sessionId);
  if (memSession) {
    memSession.updated_at = now;
    if (lens) memSession.lens = lens;
  }

  return msg;
}

export async function deleteUserSession(env, userId, sessionId) {
  await ensureAgentTables(env);
  if (env?.DB) {
    try {
      await env.DB.prepare("DELETE FROM agent_chat_messages WHERE session_id = ? AND user_id = ?")
        .bind(sessionId, userId).run();
      await env.DB.prepare("DELETE FROM agent_chat_sessions WHERE id = ? AND user_id = ?")
        .bind(sessionId, userId).run();
    } catch (e) {
      console.warn("[AgentDB] deleteUserSession D1 error:", e);
    }
  }

  memorySessions.delete(sessionId);
  for (const [id, m] of memoryMessages.entries()) {
    if (m.session_id === sessionId && m.user_id === userId) {
      memoryMessages.delete(id);
    }
  }

  return true;
}
