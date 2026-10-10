# DeltaHarvest Middleware Adversarial Test Report

**Specification:** Deep Code, Middleware, and Architecture Audit Pack (Prompt 2)  
**Target:** Edge Middleware (`functions/_middleware.js`) and Route Handlers  
**Execution Environment:** Node.js WebCrypto & Cloudflare Pages Context Simulation  
**Test Suite:** `tests/middleware_adversarial.test.mjs` (50 test assertions)  
**Date:** 2026-10-09  
**Verdict:** **48 PASS / 2 FAIL (Documented below & filed in DEBUG_FINDINGS.md)**  

---

## 1. Middleware Branch Verification Matrix

All branches of `functions/_middleware.js` were subjected to automated adversarial probing.

| Branch / Scenario | Test Case Description | Expected Result | Actual Result | Verdict |
| :--- | :--- | :--- | :--- | :--- |
| **Branch 1: Static Assets** | Request to `/assets/index-D8x29a.js` | Allow (200 next()) | Passed to next() | **PASS** |
| | Request to `/data/options_data.json` | Allow (200 next()) | Passed to next() | **PASS** |
| | Request to `/favicon.ico` | Allow (200 next()) | Passed to next() | **PASS** |
| | Request to `/brand.svg` | Allow (200 next()) | Passed to next() | **PASS** |
| **Branch 2: Public Allowlist** | Request to `/version`, `/version.json`, `/api/version` | Allow (200 next()) | Passed to next() | **PASS** |
| | Request to `/api/auth/login`, `/logout`, `/session` | Allow (200 next()) | Passed to next() | **PASS** |
| | Request to `/api/auth/change-password` | Allow (200 next()) | Passed to next() | **PASS** |
| | Request to `/api/auth/request-access` | Allow (200 next()) | Passed to next() | **PASS** |
| | Request to `/api/auth/reset-password` | Allow (200 next()) | Passed to next() | **PASS** |
| | Request to `/api/auth/reset-password/confirm` | Allow (200 next()) | Passed to next() | **PASS** |
| | Request to `/api/admin/inquiries` | Allow (200 next()) | Passed to next() | **PASS** |
| | Request to `/api/v1/options/tradier/status` | Allow (200 next()) | Passed to next() | **PASS** |
| | Request to `/api/v1/options/screeners/barchart/*` | Allow (200 next()) | Passed to next() | **PASS** |
| | Request to `/api/economic-calendar` | Allow (200 next()) | Passed to next() | **PASS** |
| | Request to `/api/analyze-options` | Allow (200 next()) | Passed to next() | **PASS** |
| | Request to `/api/market-price` | Allow (200 next()) | Passed to next() | **PASS** |
| | Request to `/api/news/AAPL` | Allow (200 next()) | Passed to next() | **PASS** |
| **Branch 3: Fail-Closed Gate** | Missing `SESSION_SECRET` on `/api/admin/diagnostics` | 500 "not configured" | HTTP 500 returned | **PASS** |
| | Missing `SESSION_SECRET` on `/api/user/data` | 500 "not configured" | HTTP 500 returned | **PASS** |
| **Branch 4: Protected Admin API**| Unauthenticated `GET /api/admin/diagnostics` | 401 Unauthorized | HTTP 401 returned | **PASS** |
| | Unauthenticated `GET /api/admin/users` | 401 Unauthorized | HTTP 401 returned | **PASS** |
| **Branch 5: Protected User API** | Unauthenticated `GET /api/user/data` | 401 Unauthorized | HTTP 401 returned | **PASS** |
| **Branch 6: Token Invalidation** | Tampered JWT signature on `/api/admin/diagnostics` | 401 + Clear Cookie | HTTP 401 + Set-Cookie Max-Age=0 | **PASS** |
| | Expired / Stale `token_version` (tv mismatch) | 401 Unauthorized | HTTP 401 returned | **PASS** |
| | Inactive / Suspended account (`is_active: 0`) | 401 Unauthorized | HTTP 401 returned | **PASS** |
| **Branch 7: RBAC Protection** | Authenticated Client accessing `/api/admin/users` | 403 Forbidden | HTTP 403 returned | **PASS** |
| | Authenticated Admin accessing `/api/admin/users` | Allow (200 next()) | Passed to handler | **PASS** |
| **Branch 8: SPA Route Guards** | Unauthenticated `/admin` | 302 to `/login` | 302 -> `/login` | **PASS** |
| | Unauthenticated `/admin/users` | 302 to `/login` | 302 -> `/login` | **PASS** |
| | Unauthenticated `/dashboard` | 302 to `/login` | 302 -> `/login` | **PASS** |
| | Unauthenticated `/equities` | 302 to `/login` | 302 -> `/login` | **PASS** |
| | Unauthenticated `/options` | 302 to `/login` | 302 -> `/login` | **PASS** |
| | Unauthenticated `/watchlist-builder` | 302 to `/login` | 302 -> `/login` | **PASS** |
| | Unauthenticated `/portfolio` | 302 to `/login` | 302 -> `/login` | **PASS** |
| | Unauthenticated `/workflow` | 302 to `/login` | 302 -> `/login` | **PASS** |
| | Authenticated Client visiting `/admin` | 302 -> `/dashboard?denied=admin_only` | 302 -> `/dashboard?denied=admin_only` | **PASS** |
| | Authenticated Client visiting `/login` | 302 -> `/dashboard` | 302 -> `/dashboard` | **PASS** |
| | Authenticated Admin visiting `/login` | 302 -> `/admin/users`| 302 -> `/admin/users`| **PASS** |
| **Branch 9: Fall-Through Paths**| `/api/covered-calls` | Pass to handler | Passed to handler | **PASS** |
| | `/api/market-recap` | Pass to handler | Passed to handler | **PASS** |
| | `/api/market-sentiment` | Pass to handler | Passed to handler | **PASS** |
| | `/api/agent/chat` | Pass to handler | Passed to handler | **PASS** |
| | `/api/bot/discord` | Pass to handler | Passed to handler | **PASS** |
| | `/api/options/journal` | Pass to handler | Passed to handler | **PASS** |
| | `/api/scheduled/morning-digest` | Pass to handler | Passed to handler | **PASS** |

---

## 2. Allowlist Justification Audit

Every allowlisted public endpoint was audited against two criteria:
- **(a) Genuinely needs no auth:** Does the core functionality require an unauthenticated or public caller?
- **(b) Cannot leak tenant data:** Can a remote caller fabricate user or tenant parameters to access other users' data?

| Endpoint | Needs No Auth Justification | Cross-Tenant Leak Check | Verdict |
| :--- | :--- | :--- | :--- |
| `/version`<br>`/api/version` | Public git deployment and build commit telemetry. | Contains zero user rows or parameters. | **CLEAN** |
| `/api/auth/login` | Must be reachable by unauthenticated users to authenticate. Rate-limited (5/min IP, 5/15min email). | Inputs are email/password; returns only caller's token or generic 401. | **CLEAN** |
| `/api/auth/logout` | Public session termination; clears session cookie via Set-Cookie. | Returns no data. | **CLEAN** |
| `/api/auth/session` | Called on every page load to inspect current session state. | Verifies caller's cookie; returns `{ authenticated: false }` if unauthenticated. Never returns arbitrary users. | **CLEAN** |
| `/api/auth/change-password` | Re-exports `user/change-password.js`. | In-handler strictly verifies authentication and requires `currentPassword`. | **CLEAN** |
| `/api/auth/request-access` | Public onboarding form. IP rate-limited (3/min). | Accepts name, email, firm notes. Returns no tenant rows. | **CLEAN** |
| `/api/auth/reset-password` | Public initiation for password recovery. Rate-limited (20/hr IP, 5/hr email). | Generic 200 returned unconditionally (anti-enumeration). Token dispatched via email out-of-band. | **CLEAN** |
| `/api/auth/reset-password/confirm` | Public redemption of reset token. Rate-limited (15/15min). | Validates single-use token against D1; strictly bound to user associated with token. | **CLEAN** |
| `/api/admin/inquiries` | POST: Public inquiry form (3/min burst limit).<br>GET: Admin inquiry inbox. | **DEFECT DETECTED:** GET handler allows `?action=test_resend` unauthenticated prior to role check, returning `{ to: adminRecipient }`. | **FAIL (M01)** |
| `/api/v1/options/tradier/status` | Connectivity probe for Tradier API. Rate-limited (30/min/IP). | Zero-knowledge probe: returns `{ configured, connected, sample_quote }`. Never leaks API keys or user data. | **CLEAN** |
| `/api/v1/options/screeners/barchart/*` | 13-indicator quantitative screening. Takes `{ symbols: [...] }`. | Stateless mathematical indicator computation. No tenant tables queried. | **CLEAN** |
| `/api/economic-calendar` | Public macro calendar (Forex Factory / Nasdaq live feeds). | Global macro release dates only. No tenant data. | **CLEAN** |
| `/api/analyze-options` | Stateless options screening AI analysis. | Prompt synthesis; no tenant rows or DB access. | **CLEAN** |
| `/api/market-price` | Zero-CORS edge proxy for Tradier and Yahoo Finance quotes. | Queries ticker quotes by symbol. No tenant rows queried. | **CLEAN** |
| `/api/news/*` | Edge aggregator for financial news (Google News, Yahoo, SEC EDGAR). | Ticker-based public headlines. No tenant rows. | **CLEAN** |

---

## 3. Fall-Through Endpoint Audit

Endpoints not matching the allowlist and not starting with `/api/admin/*` or `/api/user/*` fall through the middleware. Their in-handler authorization was inspected:

| Endpoint | In-Handler Auth Check | Tenant Boundary Enforcement | Status |
| :--- | :--- | :--- | :--- |
| `/api/covered-calls` | None (Public calculator) | Stateless options overlay mathematics; query parameters only. | **PUBLIC — INTENDED** |
| `/api/market-recap` | None (Public market summary) | Public market indices (SPY, QQQ, DIA, IWM, S&P 11 sectors). KV cached. | **PUBLIC — INTENDED** |
| `/api/market-sentiment` | None (Public sentiment proxy) | Adanos sentiment proxy. IP rate-limited (60/min). | **PUBLIC — INTENDED** |
| `/api/agent/chat` | `authenticateRequest(context)` | **Strictly enforced:** Fails with 401 when unauthenticated. All messages and sessions filtered by `WHERE user_id = user.id`. | **PROTECTED (PASS)** |
| `/api/options/journal` | `authenticateRequest(context)` | **Strictly enforced:** All trade logs filtered by `WHERE user_id = ?`. | **PROTECTED (PASS)** |
| `/api/bot/discord` | Ed25519 WebCrypto Signature | **DEFECT DETECTED:** When `DISCORD_PUBLIC_KEY` is not set, signature verification is bypassed instead of failing closed. | **DEFECT (M02)** |
| `/api/scheduled/morning-digest` | Bearer Token (`CRON_SECRET`) or Admin Session | **Strictly enforced:** Fails closed (401) if unauthenticated or invalid. Scoped to opted-in users (`WHERE opted_in = 1`). | **PROTECTED (PASS)** |

---

## 4. Static-Path Security Probe

All static files under `web/public/` were inventoried and inspected:
- `robots.txt`, `_headers`, `_redirects`
- `web/public/data/economic_calendar.json`
- `web/public/data/options_data.json`
- `web/public/data/weekly_screeners.csv` / `.json`
- `web/public/data/weekly_screeners_barchart.csv` / `.json`
- `web/public/data/weekly_screeners_barchart_custom.csv` / `.json`
- `web/public/data/weekly_screeners_marketchameleon.csv` / `.json`
- `web/public/samples/deltaharvest_watchlist_sample.csv` / `.xls`
- `web/public/samples/schwab_positions_demo.csv`
- `web/public/samples/screener_template.csv`

**Findings:** Zero user records, email addresses, passwords, tokens, or internal notes are present in any static path. All JSON/CSV files are public demonstration templates or syndicated options datasets.

---

## 5. Security Findings Filed in `docs/DEBUG_FINDINGS.md`

1. **FAIL M01 (CRITICAL): `functions/api/admin/inquiries.js` Unauthenticated Resend Test Bypass**
   - **File:** `functions/api/admin/inquiries.js:445-502`
   - **Condition:** Caller sends `GET /api/admin/inquiries?action=test_resend`.
   - **Vulnerability:** Lines 445-502 execute before `authenticateRequest(context, ["admin"])` on line 503. Any unauthenticated caller can trigger an email dispatch via Resend and receives `{ configured: true, to: adminRecipient }` in the JSON response, leaking the administrator's email.
   - **Fix Plan (Prompt 6):** Move the `authenticateRequest(context, ["admin"])` guard to the very top of `onRequestGet` before any action routing.

2. **FAIL M02 (MEDIUM): `functions/api/bot/discord.js` Unenforced Signature Gate when Unconfigured**
   - **File:** `functions/api/bot/discord.js:110-116`
   - **Condition:** Caller sends `POST /api/bot/discord` when `DISCORD_PUBLIC_KEY` environment variable is not provisioned.
   - **Vulnerability:** `if (env?.DISCORD_PUBLIC_KEY)` evaluates to false, silently skipping signature validation and accepting spoofed Discord interactions.
   - **Fix Plan (Prompt 6):** Fail closed if `DISCORD_PUBLIC_KEY` is missing in production, returning 401/500 rather than bypassing signature checks.
