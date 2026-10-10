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

---

## 9. Frontend↔Backend Contract & State Deep-Dive (Prompt 4)

### 9.1 Contract Matrix (Reconciling all 94 `fetch(` call sites in `web/src`)

| Caller Component | Target Endpoint URL | HTTP Method | Expected Shape (Frontend) | Actual Shape (`functions/`) | Contract Verdict |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `AuthContext.tsx:78` | `/api/auth/session` | `GET` | `{ authenticated, user }` | `{ authenticated, user }` | **MATCH** |
| `AuthContext.tsx:109` | `/api/auth/login` | `POST` | `{ success, user, error? }` | `{ success, user }` or 401 | **MATCH** |
| `AuthContext.tsx:151` | `/api/auth/logout` | `POST` | 200 `{ success: true }` | 200 `{ success: true }` | **MATCH** |
| `AuthContext.tsx:173` | `/api/user/change-password` | `POST` | `{ success, error? }` | `{ success, message }` | **MATCH** |
| `LoginView.tsx:158` | `/api/admin/inquiries` | `POST` | `{ success, message? }` | `{ success: true }` | **MATCH** |
| `LoginView.tsx:172` | `/api/auth/reset-password` | `POST` | `{ success, message }` | `{ success, message }` | **MATCH** |
| `LoginView.tsx:206` | `/api/auth/reset-password/confirm` | `POST` | `{ success, message }` | `{ success, message }` | **MATCH** |
| `AdminUsersView.tsx:124` | `/api/admin/users` | `GET` | `{ success, users: [] }` | `{ success, users: [] }` | **MATCH** |
| `AdminUsersView.tsx:174` | `/api/admin/settings` | `GET` | `{ success, adminNotificationEmail }` | `{ success, adminNotificationEmail }` | **MATCH** |
| `AdminUsersView.tsx:192` | `/api/admin/inquiries` | `GET` | `{ success, inquiries: [] }` | `{ success, inquiries: [] }` | **MATCH** |
| `AdminUsersView.tsx:222` | `/api/admin/settings` | `POST` | `{ success, message }` | `{ success, message }` | **MATCH** |
| `AdminUsersView.tsx:256` | `/api/admin/inquiries?action=test_email` | `GET` | `{ success, message? }` | `{ success, message }` | **MATCH** |
| `AdminUsersView.tsx:344` | `/api/admin/users/create` | `POST` | `{ success, user }` | `{ success, user }` | **MATCH** |
| `AdminUsersView.tsx:399` | `/api/admin/users/reset-password` | `POST` | `{ success, temporaryPassword }` | `{ success, temporaryPassword }` | **MATCH** |
| `AdminUsersView.tsx:439` | `/api/admin/users/toggle-status` | `POST` | `{ success, user }` | `{ success, user }` | **MATCH** |
| `UserDashboardView.tsx:58` | `/api/user/digest-preferences` | `GET` | `{ opted_in, email, discord_webhook_url }` | `{ opted_in, email, discord_webhook_url }` | **MATCH** |
| `UserDashboardView.tsx:74` | `/api/user/digest-preferences` | `POST` | `{ success, preferences }` | `{ success, preferences }` | **MATCH** |
| `UserDashboardView.tsx:183` | `/api/user/data` | `GET` | `{ success, portfolio, trades, watchlists }` | `{ success, portfolio, trades, watchlists }` | **MATCH** |
| `UserDashboardView.tsx:212` | `/api/user/data` (trade) | `POST` | `{ success, tradeId }` | `{ success, tradeId }` | **MATCH** |
| `UserDashboardView.tsx:251` | `/api/user/data?type=trade&id=X` | `DELETE` | `{ success, message }` | `{ success, message }` | **MATCH** |
| `UserDashboardView.tsx:269` | `/api/user/data` (watchlist) | `POST` | `{ success, watchlistId }` | `{ success, watchlistId }` | **MATCH** |
| `UserDashboardView.tsx:289` | `/api/user/data?type=watchlist&id=X` | `DELETE` | `{ success, message }` | `{ success, message }` | **MATCH** |
| `StrategyAgentChatView.tsx:101` | `/api/options/journal` | `GET` | `{ trades: [] }` | `{ trades: [] }` | **MATCH** |
| `StrategyAgentChatView.tsx:125` | `/api/agent/chat?action=key_status` | `GET` | `{ configured, provider }` | `{ configured, provider }` | **MATCH** |
| `StrategyAgentChatView.tsx:146` | `/api/agent/chat?action=save_key` | `POST` | `{ success, configured }` | `{ success, configured }` | **MATCH** |
| `StrategyAgentChatView.tsx:194` | `/api/agent/chat` (list sessions) | `GET` | `{ sessions: [] }` | `{ sessions: [] }` | **MATCH** |
| `StrategyAgentChatView.tsx:220` | `/api/agent/chat?sessionId=X` | `GET` | `{ session, messages: [] }` | `{ session, messages: [] }` | **MATCH** |
| `StrategyAgentChatView.tsx:253` | `/api/agent/chat?sessionId=X` | `DELETE` | `{ success, deletedSessionId }` | `{ success, deletedSessionId }` | **MATCH** |
| `StrategyAgentChatView.tsx:306` | `/api/agent/chat` (stream) | `POST` | SSE `text/event-stream` chunks | SSE `data: {...}` stream | **MATCH** |
| `MarketRecapSection.tsx:56` | `/api/market-recap` | `GET` | `{ indices: [], sectors: [] }` | `{ indices: [], sectors: [] }` | **MATCH** |
| `EconomicCalendarView.tsx:148` | `/api/economic-calendar` | `GET` | `{ indicators: [], source }` | `{ indicators: [], source }` | **MATCH** |
| `EconomicCalendarView.tsx:151` | `/api/v1/options/economic-calendar` | `GET` | Fallback URL | 404 on CF Pages (Falls back to static JSON) | **ORPHAN FALLBACK** |
| `CompanyNewsFeed.tsx:97` | `/api/news/:ticker` | `GET` | `{ ticker, articles: [] }` | `{ ticker, articles: [] }` | **MATCH** |
| `NewsCompactFeed.tsx:204` | `/api/news/:ticker` | `GET` | `{ ticker, articles: [] }` | `{ ticker, articles: [] }` | **MATCH** |
| `TickerAuditModal.tsx:205` | `/api/market-sentiment?symbol=X` | `GET` | `{ sentimentScore, ... }` | `{ sentimentScore, ... }` | **MATCH** |
| `OptionsIncomeAnalyzer.tsx:192` | `/api/analyze-options` | `POST` | `{ analysis, recommendations }` | `{ analysis, recommendations }` | **MATCH** |
| `PortfolioOverlayScanner.tsx:47` | `/api/covered-calls?params` | `GET` | `{ strikes: [] }` | `{ strikes: [] }` | **MATCH** |
| `TradierSettingsModal.tsx:58,144` | `/api/v1/options/tradier/status` | `GET`/`POST` | `{ status, configured, connected }` | `{ status, configured, connected }` | **MATCH** |
| `WeeklyStockScreenersView.tsx:229` | `/api/v1/options/screeners/barchart/analyze-watchlist` | `POST` | `{ records: [], total_count }` | `{ records: [], total_count }` | **MATCH** |
| `liveMarketFetcher.ts:118,271` | `/api/market-price?symbol=X` | `GET` | `{ spotPrice, sma20, rsi14 }` | `{ spotPrice, sma20, rsi14 }` | **MATCH** |
| `WatchlistManagerModal.tsx:198` | `/api/v1/options/watchlists/sync` | `POST` | Sync response | 404 on CF Pages (Catches and saves to localStorage) | **ORPHAN FALLBACK** |
| `SchwabSettingsModal.tsx:96` | `/api/v1/options/schwab/auth` | `GET` | Auth status | 404 on CF Pages (Catches and renders instructions) | **ORPHAN FALLBACK** |
| `SchwabSettingsModal.tsx:131` | `/api/v1/options/schwab/status` | `GET` | Status probe | 404 on CF Pages (Catches and reports disconnected) | **ORPHAN FALLBACK** |
| `BrokerOrderStagingModal.tsx:117` | `/api/v1/options/schwab/order` | `POST` | Order ticket | 404 on CF Pages (Catches and renders staging file) | **ORPHAN FALLBACK** |
| `useOptionsData.ts:71` | `/api/v1/options/snapshot` | `GET` | Options snapshot | 404 on CF Pages (Falls back to options_data.json) | **ORPHAN FALLBACK** |
| `useOptionsData.ts:152` | `/api/v1/options/recalculate` | `POST` | Recalculated Greeks | 404 on CF Pages (Recalculates in browser) | **ORPHAN FALLBACK** |
| `multiAgentTradeAuditor.ts:74` | `/api/v1/options/agent/audit` | `POST` | Multi-agent audit | 404 on CF Pages (Falls back to local heuristic rules) | **ORPHAN FALLBACK** |

---

### 9.2 Auth-State Edge Cases (`AuthContext`)
- **Rendering During Session Refresh:** `isLoading: true` shows full-screen loading spinner (`Verifying Security Session & Tenant Authorization...`).
- **401 Mid-Session (Expired Cookie Mid-Work):** App displays error banners / toast notices for individual failing queries. Does NOT redirect immediately because there is no global fetch 401 interceptor; upon next browser reload, edge middleware (302) or `App.tsx` redirects to `/login`.
- **500 on `/api/auth/session` (Unconfigured Server Secret):** `fetch` catches error, calls `setUser(null)`, sets `isLoading: false`, and renders `LoginView` with security error message. **Fails closed properly.**

---

### 9.3 Lazy-Load Failure Modes (`lazyWithRetry` & `App.tsx`)

### FAIL F01: `web/src/App.tsx` — Missing ErrorBoundary Around Root Suspense Chunk
- **Severity:** `MEDIUM`
- **File / Lines:** `web/src/App.tsx:52-62`
- **Condition:** Cloudflare Pages deployment occurs while an active user is browsing; old split chunks are pruned from CDN. Next dynamic import throws `ChunkLoadError`.
- **Expected vs Actual Behavior:**
  - *Expected:* When dynamic chunk loading fails after in-memory retry, an ErrorBoundary catches the error and displays a user-friendly update prompt ("A new version of DeltaHarvest has been deployed. Please reload.").
  - *Actual:* `<Suspense>` in `App.tsx` is NOT wrapped in an `<ErrorBoundary>`. Uncaught chunk import failure crashes React's entire component hierarchy, rendering an unrecoverable blank white screen.
- **Proposed Surgical Fix (Prompt 6):** Wrap `<Suspense fallback={...}>` in `<ErrorBoundary fallback={<DeploymentReloadView />}>`.

---

### 9.4 Five Data-Heavy Views Failure Trace Matrix

| View Component | Empty Response | Malformed Response | Request Timeout | HTTP 500 Response |
| :--- | :--- | :--- | :--- | :--- |
| **Option Chain Matrix** (`OptionChainMatrixView.tsx`) | Displays "No options data available for expiration" | Caught in `try...catch`; falls back to simulated Black-Scholes curve | 6s AbortSignal triggers fallback to cached / synthesized chain | Toast alert displayed; maintains existing view without crash |
| **Options Backtest** (`OptionsBacktestView.tsx`) | Renders empty state chart | Caught in `try...catch`; displays validation warning | Falls back to synthetic volatility walk | Displays warning banner; disables execution button |
| **Tax Alpha Optimizer** (`TaxAlphaOptimizerView.tsx`) | Displays "$0.00 realized loss harvestable" clean empty state | `JSON.parse` fallback returns initial state | N/A (Client data) | N/A (Client data) |
| **Cascading Screener** (`CascadingScreenerView.tsx`) | Cascades to secondary dataset (`weekly_screeners.json`) | Displays error notice badge; retains valid rows | AbortSignal triggers local static dataset load | Renders fallback rows with "Offline Cache" indicator |
| **Strategy Agent Chat** (`StrategyAgentChatView.tsx`) | Returns "Analysis concluded. No further details available." | SSE error event parsed; displays error bubble in chat | 45s timeout triggers Edge Quantitative Fallback | Assistant message bubble displays error notice without crashing |

---

### 9.5 LocalStorage Audit
- **Critical Secrets Stored:** `tradier_api_key` (if user overrides server key), `schwab_app_key` / `schwab_app_secret` (legacy, automatically purged on initialization).
- **Financial Tenant State Stored:** `deltaharvest_portfolio_book`, `deltaharvest_capital_ledger`, `deltaharvest_tax_ledger`, `deltaharvest_watchlist_groups`, `deltaharvest_submitted_orders`.
- **Tenant Isolation Purge Verification:** `purgeTenantBrowserStorage()` correctly clears all financial state and keys when the active user logs out or switches accounts.

---

## 10. Data Layer & Integration Failure Findings (Prompt 5)

### FAIL D01: `functions/api/user/data.js` — Unbounded Queries on User Trades and Watchlists
- **Severity:** `MEDIUM`
- **File / Lines:** `functions/api/user/data.js:27-28`
- **Trigger Condition:** User with high trade volume (>500 trades) loads dashboard or portfolio view.
- **Expected vs Actual Behavior:**
  - *Expected:* Query should enforce reasonable pagination or upper limit (`LIMIT 250` or `LIMIT 500`).
  - *Actual:* `SELECT * FROM user_trades WHERE user_id = ? ORDER BY entry_date DESC` and `SELECT * FROM user_watchlists WHERE user_id = ? ORDER BY created_at ASC` have no `LIMIT` clause.
- **Proposed Surgical Fix (Prompt 6):** Append `LIMIT 250` to `user_trades` and `LIMIT 100` to `user_watchlists`.

---

### FAIL D02: `functions/api/options/journal.js` — Unbounded Query on Signal Journal
- **Severity:** `MEDIUM`
- **File / Lines:** `functions/api/options/journal.js:71`
- **Trigger Condition:** User loads options journal after extensive historical logging.
- **Expected vs Actual Behavior:**
  - *Expected:* Journal query should be capped with `LIMIT 200` to prevent memory blow-up.
  - *Actual:* `SELECT * FROM options_signal_journal WHERE user_id = ? ORDER BY created_at DESC` lacks a `LIMIT` clause.
- **Proposed Surgical Fix (Prompt 6):** Append `LIMIT 200` to the query.

---

### FAIL D03: `functions/api/user/digest-preferences.js` — Redundant Hot-Path DDL Execution
- **Severity:** `LOW`
- **File / Lines:** `functions/api/user/digest-preferences.js:9-25,47`
- **Trigger Condition:** Every request to `GET` or `POST /api/user/digest-preferences`.
- **Expected vs Actual Behavior:**
  - *Expected:* Table creation should run once per isolate via cached initialization flag.
  - *Actual:* `ensurePreferencesTable(env)` executes `CREATE TABLE IF NOT EXISTS morning_digest_preferences` on every request.
- **Proposed Surgical Fix (Prompt 6):** Add memory flag `let preferencesTableEnsured = false;` to guard table creation.




