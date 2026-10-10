# DeltaHarvest Debug Findings & Triage Log

Generated during **Prompt 2 (Static + Contract Test Pass)**.  
Repository: `fmaresca/daily_stock_analysis`  
Date: 2026-10-09

---

## 1. FIXLOG (Prompt 4 Tracking)

| Finding | File(s) changed | Test | Result |
|---------|-----------------|------|--------|
| FAIL 1 (V075): WatchlistManagerModal crash on empty watchlist groups | `web/src/components/WatchlistManagerModal.tsx` | `tests/test_components_smoke.mjs` (empty watchlistGroups mount assertion) | PASS |
| FAIL 2 (V080): BrokerOrderStagingModal crash on undefined PM numbers | `web/src/components/BrokerOrderStagingModal.tsx` | `tests/test_components_smoke.mjs` (undefined PM numbers mount assertion) | PASS |

---

## 2. Static & Contract Test Summary

- **TypeScript compilation & Vite bundle:** `npm run build` in `web/` passed with **0 errors** across 252 modules in 14.80s.
- **Unit & Contract Suite:** 62 tests across `tests/test_web_financial_math.mjs` (including financial math benchmarks, 31 mocked API contract tests, and 6 component smoke suites) passed with **0 failures**.
- **Security Grep Gates:** Passed (Zero hardcoded secrets, no reset tokens in client code, no admin email exposed in client bundles).

---

## 3. Findings & Failures Identified

### FAIL 1: V075 — WatchlistManagerModal Crash on Empty Watchlist Groups

- **Item in Registry:** `V075` | Modal M05 | Watchlist Manager Modal
- **File / Lines:** `web/src/components/WatchlistManagerModal.tsx`: lines 80 and 385
- **Repro Steps:**
  1. Clear user watchlist storage or initialize with empty groups array (`localStorage.setItem('delta_harvest_watchlists', '[]')`).
  2. Open the Watchlist Manager Modal by clicking "Manage Watchlists".
- **Exact Error:**
  ```text
  TypeError: Cannot read properties of undefined (reading 'name')
      at WatchlistManagerModal (WatchlistManagerModal.tsx:385:31)
  ```
- **Root Cause:**
  `const activeGroup = watchlistGroups.find((g) => g.id === activeGroupId) || watchlistGroups[0];`
  When `watchlistGroups` is empty (`[]`), `activeGroup` evaluates to `undefined`.
  At line 385, `{activeGroup.name}` attempts property access on `undefined` without an optional chain (`activeGroup?.name`) or empty-state guard, throwing an uncaught runtime exception that crashes React component tree rendering.
- **Proposed Surgical Fix (Prompt 4):**
  Add defensive fallback or empty state guard in `WatchlistManagerModal.tsx` so that when `watchlistGroups` is empty, an empty group placeholder is rendered or defaulted gracefully rather than attempting property access on `undefined`.

---

### FAIL 2: V080 — BrokerOrderStagingModal Crash on Undefined PM Capital Savings

- **Item in Registry:** `V080` | Modal M10 | Broker Order Staging Modal
- **File / Lines:** `web/src/components/BrokerOrderStagingModal.tsx`: line 375
- **Repro Steps:**
  1. Stage an option trade where `accountType` is set to `'PORTFOLIO_MARGIN'`, but `capitalSavedByPm` is not provided (or evaluates to `undefined`).
  2. Open the Broker Order Staging Modal for that staged order.
- **Exact Error:**
  ```text
  TypeError: Cannot read properties of undefined (reading 'toLocaleString')
      at BrokerOrderStagingModal (BrokerOrderStagingModal.tsx:375:61)
  ```
- **Root Cause:**
  Line 375 directly invokes `.toLocaleString()` on `stagedOrder.capitalSavedByPm`:
  ```tsx
  {stagedOrder.accountType === 'PORTFOLIO_MARGIN' && (
    <span className="...">
      PM Benefit: +${stagedOrder.capitalSavedByPm.toLocaleString()} Cap. Eff.
    </span>
  )}
  ```
  If `capitalSavedByPm` is `undefined`, accessing `.toLocaleString()` throws an unhandled `TypeError` crashing the modal.
- **Proposed Surgical Fix (Prompt 4):**
  Use optional chaining / fallback: `${(stagedOrder.capitalSavedByPm ?? 0).toLocaleString()}` or check `stagedOrder.capitalSavedByPm != null`.

---

## 4. Static Architecture Observations & ORPHAN Endpoints

The following API paths are invoked by specific frontend client components with local fallback handling, but do not have dedicated Cloudflare Pages Functions implementations under `functions/api/`:

| Endpoint Path | Invoking Component | Status / Client Handling |
|---------------|-------------------|--------------------------|
| `/api/v1/options/agent/audit` | `AIAgentAuditModal.tsx` | ORPHAN on CF Pages: Client catches HTTP error and renders mock/local audit log |
| `/api/v1/options/schwab/auth` | `BrokerAccountSetupModal.tsx` | ORPHAN on CF Pages: Client catches HTTP error and renders manual auth instructions |
| `/api/v1/options/schwab/status` | `BrokerAccountSetupModal.tsx` | ORPHAN on CF Pages: Client catches HTTP error and reports disconnected status |
| `/api/v1/options/watchlists/sync` | `WatchlistManagerModal.tsx` | ORPHAN on CF Pages: Client falls back to `localStorage` store seamlessly |
| `/api/v1/options/snapshot` | `OptionsStrategyLab.tsx` | ORPHAN on CF Pages: Client falls back to client-side Black-Scholes engine |
| `/api/v1/options/recalculate` | `OptionsStrategyLab.tsx` | ORPHAN on CF Pages: Client recalculates Greeks directly in browser |

All of these have graceful fallbacks in the frontend and do not break the UI.

---

## 5. Live Click-Through Sweep Summary (Prompt 3)

- **Dev Server Runtime:** Vite server active at `http://localhost:5173/`.
- **Signed-Out Controls Sweep:**
  - `V001` (Login Form Email Input): PASS (accepts input, responsive)
  - `V002` (Login Form Password Input): PASS (masked password entry, responsive)
  - `V003` (Login Submit Button): PASS (dispatches authentication request, fails closed with security error banner when unconfigured)
  - `V004` (Request Access Modal Trigger): PASS (opens modal reliably)
  - `V005` (Request Access Form Submit): PASS (submits access inquiry)
  - `V006` (Forgot Password Modal Trigger): PASS (opens password reset modal reliably)
  - `V007` (Forgot Password Form Submit): PASS (submits password recovery request)
- **Local Dev Server Authentication Note:**
  Running `npm run dev` in `web/` starts the Vite single-page development server without Cloudflare Pages Functions edge bindings. Attempting to log in against the standalone Vite dev server returns a 404 from the dev server, which correctly triggers the fail-closed UI error: *"Authentication failed. Please verify your credentials or contact administrator."* In accordance with strict security requirements, no mock/hardcoded credentials or auto-seeding bypasses were injected.
- **Signed-Out Sweep Conclusion:** Confirmed `signed-out-only` live sweep. All 7 signed-out controls operate cleanly without JS exceptions.

---

## 6. NEEDS-HUMAN Items

None identified. Both FAIL items (`V075` and `V080`) are self-contained frontend UI runtime guards and do not require D1 schema modifications or dependency changes.

---

## 7. Deep Audit Middleware Findings (Prompt 2)

### FAIL M01: `functions/api/admin/inquiries.js` — Unauthenticated Resend Test Bypass
- **Severity:** `CRITICAL`
- **File / Lines:** `functions/api/admin/inquiries.js:445-502`
- **Branch:** On middleware allowlist because `pathname === "/api/admin/inquiries"`.
- **Trigger Condition:** Unauthenticated GET request with `?action=test_resend` or `?test_resend=1`.
- **Expected vs Actual Behavior:**
  - *Expected:* All administrative GET actions require authenticated admin session (`authenticateRequest(context, ["admin"])`).
  - *Actual:* Lines 445–502 execute *before* `authenticateRequest` on line 503. An unauthenticated attacker can dispatch test emails via Resend and receives `{ configured: true, to: adminRecipient, resendResponse: ... }`, leaking the administrator's private email address.
- **Proposed Surgical Fix (Prompt 6):** Move `const auth = await authenticateRequest(context, ["admin"]); if (!auth.authenticated) return auth.response;` to the very top of `onRequestGet` before any action parameter dispatching.

---

### FAIL M02: `functions/api/bot/discord.js` — Signature Verification Fails Open When Key Unconfigured
- **Severity:** `MEDIUM`
- **File / Lines:** `functions/api/bot/discord.js:110-116`
- **Branch:** Fall-through endpoint.
- **Trigger Condition:** `POST /api/bot/discord` when `DISCORD_PUBLIC_KEY` is unset or empty.
- **Expected vs Actual Behavior:**
  - *Expected:* If `DISCORD_PUBLIC_KEY` is required for webhook integrity, missing key should fail closed (500 or 401).
  - *Actual:* If `DISCORD_PUBLIC_KEY` is omitted from Cloudflare environment variables, signature validation is skipped and unauthenticated/spoofed webhook payloads are executed.
- **Proposed Surgical Fix (Prompt 6):** Enforce fail-closed check: if `DISCORD_PUBLIC_KEY` is not provisioned, reject incoming interaction webhooks with 500 "Discord gateway unconfigured".

---

## 8. Deep Code Audit Findings — Shared Server Modules (Prompt 3)

### Exported Functions Contract Inventory:
- `_auth_utils.js` (24 functions): `requireSessionSecret`, `generateRandomSalt`, `hashPassword`, `verifyPassword`, `generateSecureRandomToken`, `hashTokenSha256`, `createSessionToken`, `verifySessionToken`, `buildSessionCookie`, `buildClearSessionCookie`, `parseSessionCookie`, `ensureUsersTables`, `ensurePasswordResetTable`, `storePasswordResetToken`, `consumePasswordResetToken`, `getUserByEmail`, `getUserById`, `getAllUsers`, `createUser`, `updateUserPassword`, `resetUserPasswordAdmin`, `toggleUserStatus`, `updateLastLogin`, `authenticateRequest`, `getAdminNotificationEmail`, `setAdminNotificationEmail`.
- `_rate_limit.js` (3 functions): `getClientIp`, `checkRateLimit`, `buildRateLimitResponse`.
- `_llm.js` (7 functions): `sanitizeKeyLeakage`, `getActiveProviderName`, `resolveGeminiApiKey`, `resolveSlotApiKey`, `getFallbackSlots`, `completeLLM`, `testFallbackSlot`.
- `agent/chat.js` + `_agent_tools.js` (7 functions): `onRequest`, `getMarketPriceAndTechnicals`, `getOptionsPreFlightChecklist`, `getMacroCalendarSummary`, `getSectorRotationCatalysts`, `searchFinancialCatalysts`, `executeAgentTool`.
- `agent/_agent_db.js` (6 functions): `ensureAgentTables`, `getOrCreateSession`, `listUserSessions`, `getSessionMessages`, `saveMessage`, `deleteUserSession`.
- `_market_recap_core.js` (1 function): `getDailyMarketRecap`.

---

### FAIL S01: `functions/api/agent/chat.js` — Non-Admin Client Can Overwrite Global Gemini Key
- **Severity:** `CRITICAL`
- **File / Lines:** `functions/api/agent/chat.js:498-519`
- **Trigger Condition:** Any authenticated non-admin user (`role: 'client'`) sends `POST /api/agent/chat?action=save_key` with `{ apiKey: "..." }`.
- **Expected vs Actual Behavior:**
  - *Expected:* Updating global system settings (`system_settings`) in D1 must be strictly restricted to authenticated administrators (`user.role === 'admin'`).
  - *Actual:* Lines 498–519 only check `url.searchParams.get("action") === "save_key" || body?.action === "save_key"` after basic user authentication. Any authenticated client can overwrite or delete the global `gemini_api_key` for the entire application and all tenants.
- **Proposed Surgical Fix (Prompt 6):** Add an admin role guard: `if (user.role?.toLowerCase() !== 'admin') return new Response(JSON.stringify({ error: "Forbidden: Admin role required to modify global API keys" }), { status: 403, headers: { "Content-Type": "application/json" } });`.

---

### FAIL S02: `functions/api/user/change-password.js` — Password Change Missing Rate Limiting
- **Severity:** `HIGH`
- **File / Lines:** `functions/api/user/change-password.js:18-60`
- **Trigger Condition:** Rapid repetitive POST requests to `/api/user/change-password`.
- **Expected vs Actual Behavior:**
  - *Expected:* Sensitive authentication mutations (especially verifying `currentPassword`) should be rate-limited by IP and user ID to prevent automated brute-forcing.
  - *Actual:* The endpoint imports auth utilities but does NOT invoke `checkRateLimit`. An attacker with a compromised session or brute-force tool can send unlimited password guesses against `currentPassword`.
- **Proposed Surgical Fix (Prompt 6):** Add rate limiting in `user/change-password.js` (max 5 attempts per user per 15 minutes).

---

### FAIL S03: `functions/api/admin/inquiries.js` — Trust of Unverified `X-Forwarded-For` Enables Rate Limit Bypass
- **Severity:** `MEDIUM`
- **File / Lines:** `functions/api/admin/inquiries.js:37-40`
- **Trigger Condition:** Remote caller sends inquiry requests while rotating arbitrary `X-Forwarded-For` header values.
- **Expected vs Actual Behavior:**
  - *Expected:* Client IP resolution should strictly key on `CF-Connecting-IP` via `getClientIp(request)`.
  - *Actual:* Line 39 explicitly checks `request.headers.get("X-Forwarded-For")`. An attacker can spoof IP headers to bypass the burst rate limit (3 req/min) and spam administrator inboxes.
- **Proposed Surgical Fix (Prompt 6):** Replace custom IP extraction in `inquiries.js` with `getClientIp(request)` imported from `../_rate_limit.js`.

---

### FAIL S04: `functions/api/_rate_limit.js` — Unbounded Memory Map Growth
- **Severity:** `MEDIUM`
- **File / Lines:** `functions/api/_rate_limit.js:11,61-73`
- **Trigger Condition:** High volume of requests from distinct IP addresses when `RATE_LIMIT_KV` is unavailable or during local fallback.
- **Expected vs Actual Behavior:**
  - *Expected:* In-memory rate limiting map should have TTL eviction or max size bounds to prevent memory leaks.
  - *Actual:* `memoryStore` is a plain `Map` where entries are only updated or overwritten upon re-access by the same IP. Expired entries are never pruned, causing linear memory growth in long-running edge isolates.
- **Proposed Surgical Fix (Prompt 6):** Add periodic pruning (sweep records where `now >= record.resetAt`) or an LRU bound of 1,000 entries.

---

### FAIL S05: `functions/api/scheduled/morning-digest.js` — Unbounded Query for Opted-In Users
- **Severity:** `LOW`
- **File / Lines:** `functions/api/scheduled/morning-digest.js:219-224`
- **Trigger Condition:** Scheduled cron execution when `morning_digest_preferences` contains large numbers of users.
- **Expected vs Actual Behavior:**
  - *Expected:* Digest batch processing should enforce pagination or a reasonable upper limit per execution (`LIMIT 100`).
  - *Actual:* The query `SELECT user_id, email, discord_webhook_url FROM morning_digest_preferences WHERE opted_in = 1` has no `LIMIT`. A large user base will cause execution to exceed Cloudflare Worker CPU/time limits and fail mid-run.
- **Proposed Surgical Fix (Prompt 6):** Add `LIMIT 100` to the query and log telemetry if additional users remain.

---

### FAIL S06: `functions/api/agent/_agent_db.js` — Redundant Hot-Path DDL Execution
- **Severity:** `LOW`
- **File / Lines:** `functions/api/agent/_agent_db.js:49,72,92,106`
- **Trigger Condition:** Every agent chat message sent or retrieved.
- **Expected vs Actual Behavior:**
  - *Expected:* Schema creation (`CREATE TABLE IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`) should run once per isolate or via migrations.
  - *Actual:* `ensureAgentTables(env)` is called on every single `getOrCreateSession`, `saveMessage`, `getSessionMessages`, and `listUserSessions` call, issuing 4 DDL queries per HTTP request.
- **Proposed Surgical Fix (Prompt 6):** Cache schema initialization flag in memory (`let schemaEnsured = false`) similar to `_auth_utils.js`.


