# DeltaHarvest System Architecture & Lifecycle Blueprint

**Architecture Type:** Cloudflare Pages Full-Stack Edge Application (React + Vite SPA on Cloudflare Pages Functions)  
**Specification:** Deep Code, Middleware, and Architecture Audit Pack (Prompt 1)  
**Date:** 2026-10-09  

---

## 1. Request Lifecycle Maps

Below are end-to-end traces for seven representative execution flows through DeltaHarvest, tracking the request from browser arrival through edge middleware, route handlers, shared modules, persistence (D1/KV), external APIs, and response synthesis.

### Path 1: `POST /api/auth/login`
```
Browser / Client
  │ (credentials: { email, password })
  ▼
Cloudflare Edge Middleware (functions/_middleware.js)
  │ Matches allowlist: pathname === "/api/auth/login"
  ▼
Route Handler (functions/api/auth/login.js)
  │
  ├─► getClientIp(request) (functions/api/_rate_limit.js)
  ├─► checkRateLimit(env, `login:ip:${clientIp}`, 5, 60) -> RATE_LIMIT_KV or memory map
  ├─► checkRateLimit(env, `login:email:${cleanEmail}`, 5, 900) -> RATE_LIMIT_KV or memory map
  │
  ├─► getUserByEmail(env, cleanEmail) (functions/api/_auth_utils.js)
  │     └─► D1 Query: SELECT * FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1
  │
  ├─► verifyPassword(password, user.password_salt, user.password_hash)
  │     └─► WebCrypto: crypto.subtle.importKey + deriveBits (PBKDF2 SHA-256, 100k iters)
  │     └─► Constant-time timingSafeEqual hex comparison
  │
  ├─► requireSessionSecret(env) -> reads env.SESSION_SECRET
  ├─► createSessionToken(user, secret)
  │     └─► Mints HMAC-SHA256 JWT { sub: user.id, email, role, tv: token_version, exp }
  │
  ├─► buildSessionCookie(token)
  │     └─► __Host-dh_session=...; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=604800
  │
  ├─► updateLastLogin(env, user.id) -> UPDATE users SET last_login_at = ? WHERE id = ?
  │
  ▼
HTTP 200 Response + Set-Cookie Header:
  { success: true, user: { id, email, role, display_name, must_change_password } }
```

---

### Path 2: `GET /api/admin/diagnostics` (Unauthenticated)
```
Browser / Attacker / Scanner
  │ GET /api/admin/diagnostics (No cookie, no session)
  ▼
Cloudflare Edge Middleware (functions/_middleware.js)
  │ Checks static bypass -> false
  │ Checks allowlist -> false
  │ Parses cookie -> None
  │ Inspects secret -> Valid
  │ isAuthenticated -> false
  │ Matches pathname.startsWith("/api/admin")
  ▼
Edge Middleware Early Return (Short-circuit before handler execution)
  │ Status: 401 Unauthorized
  │ Headers: Content-Type: application/json
  │ Body: { "error": "Unauthorized" }
  │ (If invalid token present, appends Set-Cookie clearing __Host-dh_session)
```
*(Defense-in-depth: In the event middleware were bypassed, the handler `functions/api/admin/diagnostics.js` executes `authenticateRequest(context, ["admin"])` on line 13, returning a second 401 gate).*

---

### Path 3: `POST /api/agent/chat` (Tool-Call Multi-Step Loop)
```
Authenticated User (Browser)
  │ POST /api/agent/chat { sessionId, message: "What is AAPL spot and pre-flight score?" }
  ▼
Cloudflare Edge Middleware (functions/_middleware.js)
  │ Not in allowlist, not starting with /api/admin or /api/user -> Falls through
  ▼
Route Handler (functions/api/agent/chat.js)
  │
  ├─► authenticateRequest(context) (functions/api/_auth_utils.js)
  │     └─► Extracts JWT, verifies HMAC-SHA256, queries D1 users, validates active + token_version
  │
  ├─► checkRateLimit(env, `agent:chat:user:${user.id}`, 30, 60)
  │
  ├─► getOrCreateSession(env, sessionId, user.id) (functions/api/agent/_agent_db.js)
  │     └─► D1: SELECT * FROM agent_chat_sessions WHERE id = ? AND user_id = ?
  ├─► appendMessage(env, sessionId, 'user', message, user.id)
  │     └─► D1: INSERT INTO agent_chat_messages (id, session_id, user_id, role, content, ...)
  │
  ├─► loadHistory(env, sessionId, user.id, 10)
  │
  ├─► dispatchLlmChat(messages, tools, env) (functions/api/_llm.js)
  │     └─► Evaluates active provider (Gemini -> Groq -> OpenAI -> Anthropic -> OpenRouter -> DeepSeek -> Mistral)
  │     └─► Model requests tool call: getMarketPriceAndTechnicals(symbol: "AAPL")
  │
  ├─► executeToolCall("getMarketPriceAndTechnicals", { symbol: "AAPL" }, env)
  │     (functions/api/agent/_agent_tools.js)
  │     └─► Calls Tradier API / Yahoo Finance edge proxy -> parses NBBO quotes + indicators
  │
  ├─► Feeds tool result back to LLM context
  ├─► Model completes response with quantitative synthesis and recommendation
  │
  ├─► appendMessage(env, sessionId, 'assistant', replyText, user.id)
  │     └─► D1: INSERT INTO agent_chat_messages ...
  │
  ▼
HTTP 200 Response:
  { sessionId, message: { role: 'assistant', content: "..." }, toolsUsed: [...] }
```

---

### Path 4: `GET /api/market-sentiment?ticker=AAPL`
```
Public Visitor or Client Component
  │ GET /api/market-sentiment?ticker=AAPL
  ▼
Cloudflare Edge Middleware (functions/_middleware.js)
  │ Falls through to handler
  ▼
Route Handler (functions/api/market-sentiment.js)
  │
  ├─► Validates ticker regex / format: ^[A-Z0-9.\-]{1,10}$
  ├─► Rate limit: 60 req / min / IP (via in-memory sliding window map)
  │
  ├─► Checks Cache:
  │     ├─ Tier 1: In-memory isolate cache (TTL 300s)
  │     └─ Tier 2: Cloudflare KV (env.RATE_LIMIT_KV or cache binding)
  │
  ├─► If Cache Miss:
  │     └─► Fetch external API: https://api.adanos.org/v1/sentiment?ticker=AAPL
  │     └─► Timeout: AbortSignal (6000ms)
  │     └─► Normalizes sentiment score (-1.0 to +1.0), headlines, and catalyst count
  │     └─► Stores in Edge Cache (300s TTL)
  │
  ▼
HTTP 200 Response:
  { symbol: "AAPL", sentimentScore: 0.62, sentimentLabel: "BULLISH", headlines: [...] }
```

---

### Path 5: `POST /api/auth/reset-password` & `POST /api/auth/reset-password/confirm`

**Step A: Reset Initiation**
```
Public Client (Forgot Password Screen)
  │ POST /api/auth/reset-password { email: "trader@firm.com" }
  ▼
Cloudflare Edge Middleware
  │ Matches allowlist: pathname.startsWith("/api/auth/reset-password")
  ▼
Route Handler (functions/api/auth/reset-password.js)
  │
  ├─► Rate Limit: 20 req/hr per IP, 5 req/hr per email
  ├─► getUserByEmail(env, email) -> D1: SELECT * FROM users WHERE email = ?
  │     (If user not found, returns generic 200 to prevent account enumeration)
  │
  ├─► generateSecureRandomToken(32) -> WebCrypto getRandomValues (hex)
  ├─► hashTokenSha256(rawToken) -> SHA-256 hex hash
  │
  ├─► storePasswordResetToken(env, userId, tokenHash, expiresAt)
  │     └─► D1: INSERT INTO password_reset_tokens (token_hash, user_id, expires_at, used)
  │
  ├─► Dispatches email via Resend API (https://api.resend.com/emails)
  │     └─► Reset link: https://domain/login?reset_token=<rawToken>
  │
  ▼
HTTP 200 Response:
  { success: true, message: "If an account exists for that email, a reset link has been sent." }
```

**Step B: Token Confirmation & Password Rotation**
```
Client with Token Link
  │ POST /api/auth/reset-password/confirm { token, newPassword, confirmPassword }
  ▼
Cloudflare Edge Middleware -> Matches allowlist
  ▼
Route Handler (functions/api/auth/reset-password/confirm.js)
  │
  ├─► Rate Limit: 15 attempts / 15 min per IP
  ├─► hashTokenSha256(token) -> lookup token_hash
  ├─► consumePasswordResetToken(env, tokenHash)
  │     └─► D1: SELECT * FROM password_reset_tokens WHERE token_hash = ? AND used = 0 AND expires_at > now
  │     └─► D1: UPDATE password_reset_tokens SET used = 1 WHERE token_hash = ?
  │     (Atomic single-use token consumption)
  │
  ├─► hashPassword(newPassword, newSalt) -> PBKDF2 SHA-256 (100,000 iterations)
  ├─► updateUserPassword(env, userId, hash, salt)
  │     └─► D1: UPDATE users SET password_hash = ?, password_salt = ?, token_version = token_version + 1, ...
  │     (Bumping token_version automatically revokes all existing sessions)
  │
  ▼
HTTP 200 Response:
  { success: true, message: "Password updated successfully. Please sign in with your new password." }
```

---

### Path 6: `GET /api/user/data`
```
Authenticated User (Browser Dashboard / Portfolio View)
  │ GET /api/user/data (Cookie: __Host-dh_session=...)
  ▼
Cloudflare Edge Middleware (functions/_middleware.js)
  │ Matches branch: pathname.startsWith("/api/user")
  │ Validates JWT signature + checks D1 user is_active + matches token_version
  │ Authenticated: context.next()
  ▼
Route Handler (functions/api/user/data.js)
  │
  ├─► authenticateRequest(context) (In-handler defense-in-depth)
  │     └─► Extract user.id = "usr_123"
  │
  ├─► D1 Batch Query (Single edge round trip):
  │     ├─ SELECT * FROM user_portfolios WHERE user_id = 'usr_123'
  │     ├─ SELECT * FROM user_trades WHERE user_id = 'usr_123' ORDER BY entry_date DESC
  │     └─ SELECT * FROM user_watchlists WHERE user_id = 'usr_123' ORDER BY created_at ASC
  │
  ▼
HTTP 200 Response:
  { success: true, userId: "usr_123", portfolio: {...}, trades: [...], watchlists: [...] }
```

---

### Path 7: Morning Digest Scheduled Job (`/api/scheduled/morning-digest`)
```
Cloudflare Cron Trigger / External Scheduler (GitHub Actions morning-digest.yml)
  │ POST /api/scheduled/morning-digest
  │ Headers: Authorization: Bearer <CRON_SECRET>
  ▼
Cloudflare Edge Middleware -> Fall-through
  ▼
Route Handler (functions/api/scheduled/morning-digest.js)
  │
  ├─► 1. Gate: Verifies token === env.CRON_SECRET (or admin session via authenticateRequest)
  │     (If CRON_SECRET unset or token invalid -> fails closed with 401)
  │
  ├─► 2. Calendar Check: isUsMarketTradingDay(now)
  │     └─► Checks weekday + NYSE/Nasdaq federal holidays (New Year's, Juneteenth, Jul 4, Christmas)
  │     └─► If weekend / holiday and not forced -> returns 200 { skipped: true }
  │
  ├─► 3. Macro Market Synthesis: getDailyMarketRecap() (functions/api/_market_recap_core.js)
  │     └─► Scrapes / caches SPY, QQQ, DIA, IWM, S&P 11 sectors, VIX, US 10Y Yield
  │
  ├─► 4. Query Opted-In Users:
  │     └─► D1: SELECT user_id, email, discord_webhook_url FROM morning_digest_preferences WHERE opted_in = 1
  │
  ├─► 5. User Fan-Out Loop:
  │     for user in optedInUsers:
  │       ├─ Query user watchlists (D1 WHERE user_id = user.user_id)
  │       ├─ Hydrate ticker quotes & technicals (RSI14, SMA20 buffer, pre-flight score)
  │       ├─ Compose responsive HTML email
  │       ├─ Dispatch email via Resend API (https://api.resend.com/emails) (with 1 retry)
  │       └─ If user has Discord webhook -> POST webhook embed
  │
  ├─► 6. Telemetry Logging:
  │     └─► D1: INSERT INTO morning_digest_logs (id, run_at, status, recipient_count, details, ...)
  │
  ▼
HTTP 200 Response:
  { success: true, sent: 12, errors: 0, asOf: "..." }
```

---

## 2. Shared-Module Dependency Graph

The shared server logic is concentrated in 7 load-bearing modules located in `functions/api/`:

```
               ┌────────────────────────────────────────────────────────┐
               │              Edge Middleware (_middleware.js)          │
               └───────────────────────────┬────────────────────────────┘
                                           │ imports
                                           ▼
┌───────────────────────────────────────────────────────────────────────────────────────────┐
│                                 functions/api/_auth_utils.js                              │
│  Contracts:                                                                               │
│  - parseSessionCookie(req), verifySessionToken(token, secret), createSessionToken(u, sec) │
│  - hashPassword(pwd, salt), verifyPassword(pwd, salt, hash), generateRandomSalt()         │
│  - authenticateRequest(context, allowedRoles)                                             │
│  - getUserByEmail(env, e), getUserById(env, id), getAllUsers(env)                          │
│  - storePasswordResetToken(env, uid, h, exp), consumePasswordResetToken(env, h)           │
│  - getAdminNotificationEmail(env), setAdminNotificationEmail(env, email)                  │
│  Bindings: env.DB, env.SESSION_SECRET, env.ADMIN_NOTIFICATION_EMAIL                        │
│  Type: Mixed (Pure WebCrypto crypto functions + I/O D1 database operations)               │
└─────────────────────┬─────────────────────────────────────────────┬───────────────────────┘
                      │                                             │
         imported by: │                                imported by: │
                      ▼                                             ▼
 ┌──────────────────────────────┐              ┌────────────────────────────────────────────┐
 │  functions/api/_rate_limit.js│              │          functions/api/_llm.js             │
 │  Contracts:                  │              │  Contracts:                                │
 │  - getClientIp(request)      │              │  - dispatchLlmChat(messages, tools, env)   │
 │  - checkRateLimit(env, key,  │              │  - getFallbackSlots(env)                   │
 │                   limit, win)│              │  - testFallbackSlot(env, slot)             │
 │  - buildRateLimitResponse()  │              │  - sanitizeLlmError(err)                   │
 │  Bindings: env.RATE_LIMIT_KV │              │  Bindings: env.DB (system_settings),       │
 │  Type: I/O (KV sliding-win   │              │            LLM API Keys (slots 1..9)       │
 │        with memory fallback) │              │  Type: I/O (Multi-provider HTTPS failover) │
 └──────────────────────────────┘              └─────────────────────┬──────────────────────┘
                                                                     │
                                                        imported by: │
                                                                     ▼
                                               ┌────────────────────────────────────────────┐
                                               │         functions/api/agent/chat.js        │
                                               └───────┬────────────────────────────┬───────┘
                                                       │                            │
                                          imports from:│               imports from:│
                                                       ▼                            ▼
                                    ┌──────────────────────┐    ┌───────────────────────────┐
                                    │ agent/_agent_db.js   │    │ agent/_agent_tools.js     │
                                    │ Contracts:           │    │ Contracts:                │
                                    │ - getOrCreateSession │    │ - getMarketPriceAndTech   │
                                    │ - appendMessage      │    │ - getOptionsPreFlight     │
                                    │ - loadHistory        │    │ - getMacroCalendarSummary │
                                    │ Bindings: env.DB     │    │ - getSectorRotationCatalyst│
                                    │ Type: I/O (D1)       │    │ Bindings: env.DB, Tradier │
                                    └──────────────────────┘    │ Type: I/O + Pure Playbooks│
                                                                └─────────────┬─────────────┘
                                                                              │ imports
                                                                              ▼
                                                                ┌───────────────────────────┐
                                                                │ agent/_playbooks.js       │
                                                                │ Contracts:                │
                                                                │ - OPTION_STRATEGY_PLAYBOOK│
                                                                │ - INSTITUTIONAL_RULES     │
                                                                │ Type: Pure Static Data    │
                                                                └───────────────────────────┘
```

### Module Downstream Import Map:
1. **`_auth_utils.js`**:
   - Consumers: `functions/_middleware.js`, `admin/diagnostics.js`, `admin/inquiries.js`, `admin/llm-chain-test.js`, `admin/settings.js`, `admin/users.js`, `admin/users/create.js`, `admin/users/reset-password.js`, `admin/users/toggle-status.js`, `agent/chat.js`, `auth/change-password.js`, `auth/login.js`, `auth/logout.js`, `auth/request-access.js`, `auth/reset-password.js`, `auth/reset-password/confirm.js`, `auth/session.js`, `options/journal.js`, `scheduled/morning-digest.js`, `user/change-password.js`, `user/data.js`, `user/digest-preferences.js`.
2. **`_rate_limit.js`**:
   - Consumers: `auth/login.js`, `auth/request-access.js`, `auth/reset-password.js`, `auth/reset-password/confirm.js`, `v1/options/tradier/status.js`.
3. **`_llm.js`**:
   - Consumers: `analyze-options.js`, `admin/diagnostics.js`, `admin/llm-chain-test.js`, `agent/chat.js`.
4. **`_market_recap_core.js`**:
   - Consumers: `market-recap.js`, `bot/discord.js`, `scheduled/morning-digest.js`.
5. **`agent/_agent_db.js`**:
   - Consumers: `agent/chat.js`.
6. **`agent/_agent_tools.js`**:
   - Consumers: `agent/chat.js`, `bot/discord.js`, `scheduled/morning-digest.js`.
7. **`agent/_playbooks.js`**:
   - Consumers: `agent/_agent_tools.js`.

---

## 3. Frontend State Map & Data Flow

### 3.1 `AuthContext` (`web/src/context/AuthContext.tsx`)
- **Mount & Refresh (`refreshSession`)**:
  - Executes on initial mount via `GET /api/auth/session` with `credentials: 'same-origin'` and `AbortController` (4000ms timeout).
  - Normalizes server user record into `{ id, email, role: 'ADMIN' | 'CLIENT', displayName, must_change_password }`.
  - On 401, 500, or network timeout: Fails closed (`setUser(null)`).
- **Expiry Handling**:
  - Session cookie (`__Host-dh_session`) has 7-day TTL (`Max-Age=604800`) and is flagged `HttpOnly; Secure; SameSite=Lax`.
  - When the cookie expires, any subsequent API request receives 401.
- **Tenant Isolation Purge (`purgeTenantBrowserStorage`)**:
  - Automatically clears `sessionStorage` and cleans up sensitive tenant keys in `localStorage` upon logout or upon logging in as a different tenant.

### 3.2 View Switching (`AuthenticatedTerminal.tsx` & `useAppNavigation.ts`)
- The application uses a single-page state-driven routing architecture with URL synchronization:
  - Canonical URL path is read from `window.location.pathname` and normalized in `useAppNavigation.ts`.
  - Navigation updates state and reflects canonical paths using `window.history.pushState` / `window.history.replaceState`.
- **Primary Trees**:
  - `WORKFLOW` (`/ritual/*`): Multi-step options trading workflow (Schwab upload -> Cash ledger -> Holdings covered calls -> Macro calendar -> Cascading screener -> Executive report -> Broker staging).
  - `OPTIONS` (`/options/*`): Interactive charts, multi-leg spreads, backtesting, volatility skew, options income analyzer.
  - `EQUITIES` (`/equities/*`): Fundamental health, weekly screeners.
  - `DASHBOARD` (`/dashboard`): Portfolio overview, quick links, user telemetry.
  - `ADMIN_USERS` (`/admin/users`): Tenant directory, role management, password resets.
  - `AGENT_CHAT` (`/agent`): Interactive AI strategy execution partner.
  - `MARKET_RECAP` (`/recap`): US market indices and sector momentum table.

---

### 3.3 Frontend `fetch(` Call Sites to Backend Mapping

| Caller File (`web/src/...`) | Endpoint URL | HTTP Method | Auth Mode | Expected Response Shape |
| :--- | :--- | :--- | :--- | :--- |
| `context/AuthContext.tsx` | `/api/auth/session` | `GET` | Cookie | `{ authenticated: boolean, user?: AuthUser }` |
| `context/AuthContext.tsx` | `/api/auth/login` | `POST` | None | `{ success: boolean, user?: AuthUser, error?: string }` |
| `context/AuthContext.tsx` | `/api/auth/logout` | `POST` | Cookie | `{ success: boolean }` |
| `context/AuthContext.tsx` | `/api/user/change-password` | `POST` | Cookie | `{ success: boolean, message?: string }` |
| `components/auth/LoginView.tsx` | `/api/auth/reset-password` | `POST` | None | `{ success: boolean, message: string }` |
| `components/auth/LoginView.tsx` | `/api/auth/reset-password/confirm` | `POST` | None | `{ success: boolean, message: string }` |
| `components/auth/LoginView.tsx` | `/api/admin/inquiries` | `POST` | None | `{ success: boolean, message: string }` |
| `components/auth/AdminUsersView.tsx` | `/api/admin/users` | `GET` | Cookie (Admin) | `{ success: boolean, users: User[] }` |
| `components/auth/AdminUsersView.tsx` | `/api/admin/users/create` | `POST` | Cookie (Admin) | `{ success: boolean, user: User }` |
| `components/auth/AdminUsersView.tsx` | `/api/admin/users/reset-password` | `POST` | Cookie (Admin) | `{ success: boolean, temporaryPassword?: string }` |
| `components/auth/AdminUsersView.tsx` | `/api/admin/users/toggle-status` | `POST` | Cookie (Admin) | `{ success: boolean, user: User }` |
| `components/auth/AdminUsersView.tsx` | `/api/admin/settings` | `GET` / `POST` | Cookie (Admin) | `{ success: boolean, adminNotificationEmail: string }` |
| `components/auth/AdminUsersView.tsx` | `/api/admin/inquiries` | `GET` | Cookie (Admin) | `{ success: boolean, inquiries: [...] }` |
| `components/auth/UserDashboardView.tsx` | `/api/user/digest-preferences` | `GET` / `POST` | Cookie | `{ opted_in: boolean, discord_webhook_url?: string }` |
| `components/auth/UserDashboardView.tsx` | `/api/user/data` | `GET` / `POST` / `DELETE`| Cookie | `{ success: boolean, portfolio: {}, trades: [], watchlists: [] }` |
| `components/agent/StrategyAgentChatView.tsx`| `/api/agent/chat` | `GET` / `POST` | Cookie | `{ sessionId: string, message: { role, content }, toolsUsed: [] }` |
| `components/agent/StrategyAgentChatView.tsx`| `/api/options/journal` | `GET` | Cookie | `{ trades: [...] }` |
| `components/market/MarketRecapSection.tsx` | `/api/market-recap` | `GET` | None | `{ timestamp, indices: [...], sectors: [...] }` |
| `components/EconomicCalendarView.tsx` | `/api/economic-calendar` | `GET` | None | `{ indicators: [...], source: string }` |
| `components/CompanyNewsFeed.tsx` | `/api/news/:ticker` | `GET` | None | `{ ticker, articles: [...] }` |
| `components/TickerAuditModal.tsx` | `/api/market-sentiment?symbol=X` | `GET` | None | `{ symbol, sentimentScore, sentimentLabel, ... }` |
| `components/OptionsIncomeAnalyzer.tsx` | `/api/analyze-options` | `POST` | None | `{ analysis: string, recommendations: [...] }` |
| `components/PortfolioOverlayScanner.tsx` | `/api/covered-calls?params` | `GET` | None | `{ symbol, strikes: [...] }` |
| `components/WeeklyStockScreenersView.tsx`| `/api/v1/options/screeners/barchart/analyze-watchlist` | `POST` | None | `{ records: [...], total_count: number }` |
| `components/TradierSettingsModal.tsx` | `/api/v1/options/tradier/status` | `GET` / `POST` | None | `{ status, configured, connected, server_provisioned }` |
| `utils/liveMarketFetcher.ts` | `/api/market-price?symbol=X` | `GET` | None | `{ symbol, spotPrice, sma20, rsi14, ... }` |

---

### 3.4 LocalStorage Inventory & Privacy Audit

| Key | Contents / Payload | Sensitive / PII? | Purged on Logout? | Notes |
| :--- | :--- | :--- | :--- | :--- |
| `deltaharvest_last_active_user_id` | User UUID string | Low | Yes | Used to detect tenant account switches |
| `deltaharvest_portfolio_book` | Serialized JSON array of positions | High (Financial) | Yes | User portfolio positions imported from broker |
| `deltaharvest_capital_ledger` | Cash balance & capital ledger entries | High (Financial) | Yes | Total cash, allocations, distributions |
| `deltaharvest_tax_ledger` | Realized gains, losses, carryforwards | High (Financial) | Yes | YTD short/long-term capital tax records |
| `deltaharvest_watchlist_groups` | Custom ticker watchlist groups | Medium | Yes | User-curated symbols and notes |
| `deltaharvest_active_group_id` | ID string of active watchlist group | Low | Yes | Active group selector |
| `deltaharvest_valuation_tickers` | Array of tickers for valuation view | Low | Yes | Ticker symbols |
| `deltaharvest_auto_sync_settings` | Settings for live market auto-sync | Low | Yes | Interval & toggle flags |
| `deltaharvest_submitted_orders` | Staged broker option orders | High (Trading) | Yes | Broker order ticket staging cache |
| `tradier_api_key` | User-provided Tradier API token | Critical (Secret) | Yes | Stored only if client overrides server provision |
| `tradier_enabled` | Boolean flag | Low | Yes | Provider toggle |
| `tradier_use_sandbox` | Boolean flag | Low | Yes | Sandbox toggle |
| `tradier_server_provisioned` | Boolean flag | Low | Yes | Indicates zero-knowledge edge key in use |
| `schwab_app_key` / `schwab_app_secret`| Legacy client keys | Critical | Purged | Purged on boot by `SchwabSettingsModal` |
| `deltaharvest_theme` | `'dark' \| 'light'` | None | No | UI theme preference |
| `deltaharvest_harvest_target_delta` | Numeric string (e.g. `'0.15'`) | Low | No | Target delta setting |
| `deltaharvest_screener_chooser_open`| `'true' \| 'false'` | None | No | UI accordion state |
| `deltaharvest_ytd_reconciliation_confirmed`| `'true' \| 'false'` | Low | No | Weekend workflow checklist verification flag |
| `deltaharvest_earnings_cache` | Cached earnings release dates JSON | Low | No | Public earnings dates cache |
| `deltaharvest_live_payload` | Cached market quotes JSON | Low | No | Ephemeral market snapshot |
| `deltaharvest_last_live_fetch` | ISO timestamp string | Low | No | Market refresh throttle timestamp |
