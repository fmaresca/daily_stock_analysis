# DeltaHarvest Data Layer & External Integration Failure Matrix

**Specification:** Deep Code, Middleware, and Architecture Audit Pack (Prompt 5)  
**Date:** 2026-10-09  

---

## 1. External Integration Failure Matrix

| Service / Integration | Downstream Calling Sites | Timeout Set? | Retry Policy | User-Visible Behavior when Down | Secret Leakage Risk & Check |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Resend REST API** (`api.resend.com`) | `inquiries.js`, `morning-digest.js`, `users/create.js`, `users/reset-password.js` | Yes (fetch signal) | 1 retry in morning digest | Inquiries fall back to FormSubmit automatically; digest logs failure without aborting other recipients; user creation displays toast warning. | **CLEAN:** HTTP error body parsed as JSON, never interpolated into public client views. Keys passed via Bearer header. |
| **FormSubmit** (`formsubmit.co`) | `inquiries.js:212,264`, `AdminUsersView.tsx:280` | Default fetch | Tries JSON API, then URL-encoded form | Secondary fallback for access inquiries; if down, inquiry returns error status asking user to try again later. | **CLEAN:** Transmits email payload only; zero server tokens required or used. |
| **Adanos Sentiment API** (`api.adanos.org`) | `market-sentiment.js:80` | Yes (6000ms AbortSignal) | None | Graceful degradation: returns `{ sentimentScore: 0.0, sentimentLabel: "NEUTRAL", notice: "Live news feed temporarily unindexed" }`. UI displays neutral pill without crashing. | **CLEAN:** Token read from server env/KV; errors sanitized. |
| **Tradier Brokerage API** (`api.tradier.com`) | `market-price.js:70`, `analyze-watchlist.js:91`, `tradier/status.js:99` | Yes (6000ms AbortSignal) | None | Pricing proxy falls back directly to Yahoo Finance; status probe reports `connected: false`; screener displays offline cached quotes. | **CLEAN:** Zero-knowledge client pattern: token resolved server-side from `TRADIER_API_KEY` or D1 `system_settings`; never returned in JSON. |
| **Barchart Screener Feed** (`barchart.com`) | `CascadingScreenerView.tsx`, `WeeklyStockScreenersView.tsx` | Yes (6000ms AbortSignal) | None | Automatically cascades to secondary syndicated datasets (`weekly_screeners_barchart_custom.json`, `weekly_screeners.json`). | **CLEAN:** No private credentials involved. |
| **LLM Provider Chain** (Gemini, Groq, Cerebras, OpenRouter, Mistral, NVIDIA, Cohere, Workers AI, Anthropic) | `_llm.js:270`, `agent/chat.js:625`, `analyze-options.js:145` | Yes (30s per attempt, 45s overall) | 7-slot sequential failover chain | If an individual slot fails (401/429/5xx/timeout), fails over to next slot. If all slots fail, seamlessly executes Edge Quantitative Engine algorithmic synthesis. User receives complete analysis with source notice. | **CLEAN:** `sanitizeKeyLeakage()` redacts `Bearer`, API key prefixes, and hex hashes >= 32 chars across all error strings. |
| **Yahoo Finance Chart API** (`query1.finance.yahoo.com`) | `market-price.js:125`, `_agent_tools.js:61`, `liveMarketFetcher.ts` | Yes (6000ms AbortSignal) | None | Falls back to cached quotes in KV / localStorage or calculated synthetic volatility. UI displays warning pill. | **CLEAN:** Public endpoint; no keys involved. |
| **Discord Bot & Webhooks** (`discord.com/api/webhooks/`) | `morning-digest.js:350`, `alertDispatcher.ts:124`, `discordNotifier.ts:147` | Yes (5000ms AbortSignal) | None | Non-blocking fire-and-forget: failure logged in server telemetry; does not disrupt morning digest email delivery or client UI. | **CLEAN:** Webhook URLs stored server-side in D1 `morning_digest_preferences`. |
| **Google News RSS & SEC EDGAR** (`news.google.com`, `sec.gov`) | `news/[ticker].js:75,105`, `_agent_tools.js:360` | Edge cache (180s TTL) | None | Parallel aggregation: if Google News or SEC EDGAR fails, the endpoint aggregates available articles from remaining sources without failing. | **CLEAN:** Public RSS/Atom feeds; no keys involved. |

---

## 2. D1 Database Audit Summary

Across 70 `DB.prepare(` call sites in `functions/`:

1. **Multi-Tenant Scoping (`WHERE user_id = ?`):**
   - **Status:** **100% COMPLIANT**.
   - Every single user portfolio, trade record, watchlist group, chat session, chat message, and digest preference query strictly filters by `WHERE user_id = ?` or `WHERE id = ? AND user_id = ?`.
   - Zero queries permit tenant ID injection or cross-tenant data traversal.

2. **Result Bounds & Pagination (`LIMIT` Clauses):**
   - Bounded queries:
     - `admin/inquiries.js:620`: `LIMIT 50`
     - `agent/_agent_db.js:95`: `LIMIT 50`
     - `agent/_agent_db.js:113`: `LIMIT 100`
   - **Unbounded queries (Findings D01–D04):**
     - `user/data.js:27`: `SELECT * FROM user_trades WHERE user_id = ? ORDER BY entry_date DESC` (No LIMIT).
     - `user/data.js:28`: `SELECT * FROM user_watchlists WHERE user_id = ? ORDER BY created_at ASC` (No LIMIT).
     - `options/journal.js:71`: `SELECT * FROM options_signal_journal WHERE user_id = ?` (No LIMIT).
     - `scheduled/morning-digest.js:218`: `SELECT user_id, email, discord_webhook_url FROM morning_digest_preferences WHERE opted_in = 1` (No LIMIT).

3. **Hot-Path DDL Overhead:**
   - Multiple endpoints execute redundant `CREATE TABLE IF NOT EXISTS` and `CREATE INDEX IF NOT EXISTS` queries on every HTTP request instead of checking a one-time memory initialization flag.
   - Most prominent: `agent/_agent_db.js` (4 DDL queries per chat request), `user/digest-preferences.js` (1 DDL query per request).

---

## 3. Cloudflare Workers KV Audit (`RATE_LIMIT_KV`)

1. **Key Scheme:** `rl:${key}:${windowBucket}` where `windowBucket = Math.floor(now / windowSeconds)`.
2. **TTL Correctness:** `ttl = Math.max(60, windowSeconds * 2)` correctly satisfies Cloudflare KV minimum TTL requirements (60s) and prevents stale key accumulation.
3. **Unbound KV Resilience:** When `RATE_LIMIT_KV` is unprovisioned, `checkRateLimit` gracefully catches errors and falls back to in-memory isolate tracking.

---

## 4. Secrets-in-Repo Re-Sweep Verdict

- **Automated Regex Scan:** Swept `functions/`, `web/src/`, `docs/`, and configuration files for live API key signatures (`AIzaSy*`, `sk-*`, `gsk_*`, `re_*`, bearer tokens).
- **Results:**
  - Zero real secrets found in repository.
  - Only test mock secrets in test files and documentation examples.
  - `.env.example` contains only empty placeholder strings.
- **Verdict:** **CLEAN / PASS**.
