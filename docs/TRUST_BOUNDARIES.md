# DeltaHarvest Trust Boundaries & Authorization Blueprint

**Audit Scope:** Cloudflare Pages Functions (`functions/api/`) and Edge Middleware (`functions/_middleware.js`)  
**Specification:** Deep Code, Middleware, and Architecture Audit Pack (Prompt 1)  
**As of:** 2026-10-09  

---

## 1. Edge Middleware Branching Logic (`functions/_middleware.js`)

All incoming requests to the DeltaHarvest Cloudflare Pages deployment pass through `functions/_middleware.js`. The request is evaluated sequentially against four routing branches:

```
                              Incoming HTTP Request
                                       │
                                       ▼
                     [ 1. Static Asset / File Bypass ] ─────────► context.next() (Public Static)
                                       │ (No match)
                                       ▼
                     [ 2. Public API Allowlist Match ] ─────────► context.next() (Public / In-Handler Auth)
                                       │ (No match)
                                       ▼
                     [ 3. Inspect JWT Cookie & D1 User ]
                                       │
                     ┌─────────────────┴─────────────────┐
                     ▼                                   ▼
          Path: /api/admin/*                      Path: /api/user/*
          ├─ Missing secret: 500                  ├─ Missing secret: 500
          ├─ Not auth / revoked: 401              ├─ Not auth / revoked: 401
          ├─ Role != admin: 403                   └─ Active user: context.next()
          └─ Admin: context.next()
                     │
                     ▼
          [ 4. SPA Page Route Guards ]
          ├─ /admin/* -> unauth? 302 /login | non-admin? 302 /dashboard?denied=admin_only
          ├─ /equities*, /options*, /dashboard*, /portfolio*, /workflow* -> unauth? 302 /login
          └─ /login -> authenticated? 302 /dashboard or /admin/users
                     │
                     ▼
          [ 5. Middleware Fall-Through ] ──────────────► context.next() (Must enforce in-handler!)
```

---

## 2. Trust Boundary Matrix

Every file under `functions/api/` is audited below.

| File / Route | Middleware Branch | In-Handler Auth & Mechanism | Tenant Scoping (`WHERE user_id = ?`) | External Services Called | Verdict / Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `analyze-options.js`<br>`/api/analyze-options` | Allowlist (`/api/analyze-options`) | None (Public mathematical AI options screener) | N/A (Stateless inputs) | LLM Provider Chain (`_llm.js`) | `PUBLIC — INTENDED` |
| `covered-calls.js`<br>`/api/covered-calls` | Fall-Through | None (Public options overlay math calculator) | N/A (Stateless query params) | None | `PUBLIC — INTENDED` |
| `economic-calendar.js`<br>`/api/economic-calendar` | Allowlist (`/api/economic-calendar`) | None (Public macroeconomic release schedule) | N/A (No user rows) | Forex Factory RSS, Nasdaq Economic Events API | `PUBLIC — INTENDED` |
| `market-price.js`<br>`/api/market-price` | Allowlist (`/api/market-price`) | None (Public stock/ETF pricing and technical proxy) | N/A (Reads global system settings for Tradier key) | Tradier Quotes API, Yahoo Finance | `PUBLIC — INTENDED` |
| `market-recap.js`<br>`/api/market-recap` | Fall-Through | None (Public macro market indices & sector recap) | N/A (Cached in Cloudflare KV / memory) | Yahoo Finance (SPY, QQQ, DIA, IWM, S&P 11 sectors, VIX, TNX) | `PUBLIC — INTENDED` |
| `market-sentiment.js`<br>`/api/market-sentiment` | Fall-Through | None (Public ticker sentiment proxy; IP rate-limited 60/min) | N/A (Edge KV / memory cache) | Adanos Sentiment API | `PUBLIC — INTENDED` |
| `version.js`<br>`/api/version` | Allowlist (`/api/version`) | None (Public deployment metadata) | N/A | None | `PUBLIC — INTENDED` |
| `admin/diagnostics.js`<br>`/api/admin/diagnostics` | `/api/admin/*` | `authenticateRequest(context, ["admin"])` | System-level health probes (`_d1_health`) | None | `PROTECTED` |
| `admin/inquiries.js`<br>`/api/admin/inquiries` | Allowlist (`/api/admin/inquiries`) | POST: Public inquiry (rate-limited: 3/min burst, 6/10min).<br>GET: Admin auth (`authenticateRequest`), **EXCEPT `?action=test_resend` bypass** | System settings (`ADMIN_NOTIFICATION_EMAIL`) | Resend REST API, FormSubmit | `UNPROTECTED — VERIFY`<br>*(Bug: `test_resend` triggers without auth)* |
| `admin/llm-chain-test.js`<br>`/api/admin/llm-chain-test` | `/api/admin/*` | `authenticateRequest(context, ["admin"])` | System-level LLM configuration test | Configured LLM Providers (slots 1..9) | `PROTECTED` |
| `admin/settings.js`<br>`/api/admin/settings` | `/api/admin/*` | `authenticateRequest(context, ["admin"])` | System settings table (`system_settings`) | None | `PROTECTED` |
| `admin/users.js`<br>`/api/admin/users` | `/api/admin/*` | `authenticateRequest(context, ["admin"])` | Admin tenant directory (`users` table) | None | `PROTECTED` |
| `admin/users/create.js`<br>`/api/admin/users/create` | `/api/admin/*` | `authenticateRequest(context, ["admin"])` | Creates row in `users` | Resend REST API | `PROTECTED` |
| `admin/users/reset-password.js`<br>`/api/admin/users/reset-password` | `/api/admin/*` | `authenticateRequest(context, ["admin"])` | Updates single user in `users` | Resend REST API | `PROTECTED` |
| `admin/users/toggle-status.js`<br>`/api/admin/users/toggle-status` | `/api/admin/*` | `authenticateRequest(context, ["admin"])` | Updates single user in `users` | None | `PROTECTED` |
| `agent/chat.js`<br>`/api/agent/chat` | Fall-Through | `authenticateRequest(context)` (Rate-limited: 30/min/user) | Strictly enforced (`WHERE user_id = user.id`) on all sessions & messages | LLM Provider Chain (`_llm.js`), Tradier / Yahoo via tools | `PROTECTED` |
| `auth/change-password.js`<br>`/api/auth/change-password` | Allowlist (`/api/auth/change-password`) | Re-exports `user/change-password.js` (`authenticateRequest` + verifies old password) | Strictly enforced to caller's user ID | None | `PROTECTED` |
| `auth/login.js`<br>`/api/auth/login` | Allowlist (`/api/auth/login`) | Public credentials verification (PBKDF2 SHA-256). IP limit (5/min), email limit (5/15min) | Scoped to matching user email | None | `PUBLIC — INTENDED` |
| `auth/logout.js`<br>`/api/auth/logout` | Allowlist (`/api/auth/logout`) | Public session clearing (mints expired cookie) | Caller's session cookie | None | `PUBLIC — INTENDED` |
| `auth/request-access.js`<br>`/api/auth/request-access` | Allowlist (`/api/auth/request-access`) | Public access request (IP rate-limited 3/min) | No tenant rows returned | Resend REST API / FormSubmit | `PUBLIC — INTENDED` |
| `auth/reset-password.js`<br>`/api/auth/reset-password` | Allowlist (`/api/auth/reset-password*`) | Public initiation with anti-enumeration. IP limit (20/hr), email limit (5/hr) | Mints single-use SHA-256 token hash bound to user ID (30m expiry) | Resend REST API | `PUBLIC — INTENDED` |
| `auth/reset-password/confirm.js`<br>`/api/auth/reset-password/confirm` | Allowlist (`/api/auth/reset-password*`) | Public token redemption (Rate-limited: 15/15min). Consumes single-use token | Updates password & revokes existing JWTs (`token_version++`) | None | `PUBLIC — INTENDED` |
| `auth/session.js`<br>`/api/auth/session` | Allowlist (`/api/auth/session`) | `authenticateRequest(context)` | Returns caller's sanitized user record only | None | `PUBLIC — INTENDED` |
| `bot/discord.js`<br>`/api/bot/discord` | Fall-Through | Webhook signature verification (Ed25519) when `DISCORD_PUBLIC_KEY` set. **Fails open if unset.** | N/A (Stateless market tools; no user tenant rows) | Tradier Quotes, Yahoo Finance | `PUBLIC — INTENDED`<br>*(Finding: Unset key bypasses signature check)* |
| `news/[ticker].js`<br>`/api/news/:ticker` | Allowlist (`/api/news/*`) | None (Public market headline aggregator; edge cached 5m) | N/A (Stateless ticker lookup) | Google News RSS, Yahoo Finance RSS, SEC EDGAR Atom, MarketChameleon | `PUBLIC — INTENDED` |
| `options/journal.js`<br>`/api/options/journal` | Fall-Through | `authenticateRequest(context)` | Strictly enforced (`WHERE user_id = ?`) on all trades | None | `PROTECTED` |
| `scheduled/morning-digest.js`<br>`/api/scheduled/morning-digest` | Fall-Through | Requires `Authorization: Bearer <CRON_SECRET>` or Admin session | Scoped to opted-in users (`WHERE opted_in = 1`) and their watchlists | Resend REST API, User Discord Webhooks | `PROTECTED` |
| `user/change-password.js`<br>`/api/user/change-password` | `/api/user/*` | `authenticateRequest(context)` + old password check | Strictly enforced to caller's user ID | None | `PROTECTED` |
| `user/data.js`<br>`/api/user/data` | `/api/user/*` | `authenticateRequest(context)` | Strictly enforced (`WHERE user_id = ?` and `WHERE id = ? AND user_id = ?`) | None | `PROTECTED` |
| `user/digest-preferences.js`<br>`/api/user/digest-preferences` | `/api/user/*` | `authenticateRequest(context)` | Strictly enforced (`WHERE user_id = ?`) | None | `PROTECTED` |
| `v1/options/screeners/barchart/analyze-watchlist.js`<br>`/api/v1/options/screeners/barchart/analyze-watchlist` | Allowlist (`/api/v1/options/*`) | None (Public 13-indicator watchlist analysis proxy) | N/A (Reads global system settings for Tradier key) | Tradier Quotes API | `PUBLIC — INTENDED` |
| `v1/options/tradier/status.js`<br>`/api/v1/options/tradier/status` | Allowlist (`/api/v1/options/*`) | None (Zero-knowledge probe; IP rate-limited 30/min; never leaks key) | N/A | Tradier Quotes API (`/markets/quotes?symbols=SPY`) | `PUBLIC — INTENDED` |

---

## 3. High-Risk Findings Summary (For Prompts 2–6)

1. **`functions/api/admin/inquiries.js` (`GET ?action=test_resend`)**:
   - **Branch:** On middleware allowlist because `pathname === "/api/admin/inquiries"`.
   - **Defect:** In `onRequestGet`, lines 445–502 check for `action === "test_resend"` BEFORE invoking `authenticateRequest(context, ["admin"])`.
   - **Impact:** An unauthenticated remote caller can trigger Resend test emails and retrieve `{ configured: true, to: adminRecipient, resendResponse: ... }`, leaking the admin notification email address.
   - **Triage:** `UNPROTECTED — VERIFY` (Filed for Prompt 6 fix).

2. **`functions/api/bot/discord.js` (Signature Bypass when Unconfigured)**:
   - **Branch:** Fall-through.
   - **Defect:** Lines 110–116 check `if (env?.DISCORD_PUBLIC_KEY)`. If the public key is not configured in Cloudflare environment variables, signature verification is silently bypassed rather than failing closed.
   - **Impact:** If `DISCORD_PUBLIC_KEY` is accidentally omitted in production, anyone can forge requests to `/api/bot/discord`.
   - **Triage:** `MEDIUM` finding.
