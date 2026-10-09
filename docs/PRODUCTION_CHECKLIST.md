# DeltaHarvest Production Deployment Checklist & Security Pre-Flight Gates

This document defines the mandatory pre-flight checklist, dashboard configuration paths, and operational security requirements for deploying DeltaHarvest to Cloudflare Pages.

---

> [!CAUTION]
> ### THE IRON RULE
> If login breaks after security fixes, the cause is **ALWAYS dashboard configuration** (missing `SESSION_SECRET`, unbound D1 `DB`, unbound `RATE_LIMIT_KV`, or missing seeded admin).  
> **Check the admin diagnostics endpoint (`GET /api/admin/diagnostics`) to verify edge bindings.**  
> **NEVER restore hardcoded secrets, fallback secrets, or bootstrap credentials to fix login.**

---

## 1. Cloudflare Dashboard Configuration Locations

DeltaHarvest runs in a strict **fail-closed** security posture. If critical security bindings or secrets are absent in production, edge authentication endpoints immediately return HTTP 500 with generic errors rather than falling back to insecure defaults.

### A. Session Secret (`SESSION_SECRET`)
- **Dashboard Path:** **Workers & Pages** → **daily-stock-analysis** → **Settings** → **Environment variables** → **Production** (and Preview) → **Add Secret** → Name: `SESSION_SECRET`
- **Requirement:** Cryptographically secure signing key (minimum 32 random bytes, base64 or hex).
- **Generation:**
  ```bash
  openssl rand -base64 32
  ```
- **CLI Alternative:**
  ```bash
  npx wrangler pages secret put SESSION_SECRET
  ```
- **Policy:** **NEVER** define `SESSION_SECRET` in `wrangler.toml`, and **NEVER** commit it to version control or hardcode fallback constants in source.

### B. Cloudflare D1 Database Binding (`DB`)
- **Dashboard Path:** **Workers & Pages** → **daily-stock-analysis** → **Settings** → **Functions** → **D1 database bindings** → **Add binding**:
  - Variable name: `DB` (case-sensitive)
  - D1 database: `deltaharvest-db`
- **`wrangler.toml` Alignment:**
  ```toml
  [[d1_databases]]
  binding = "DB"
  database_name = "deltaharvest-db"
  database_id = "496fc81e-9aef-4e93-b5c4-20d1ee9722ed"
  ```
- **Policy:** In production, user authentication fails closed (HTTP 500) if `DB` is unbound. Hardcoded bootstrap user fallbacks and source-level password hashes are completely prohibited.

### C. Distributed Rate Limiter KV (`RATE_LIMIT_KV`)
- **Dashboard Path:** **Workers & Pages** → **daily-stock-analysis** → **Settings** → **Functions** → **KV namespace bindings** → **Add binding**:
  - Variable name: `RATE_LIMIT_KV` (case-sensitive)
  - KV namespace: `RATE_LIMIT_KV`
- **`wrangler.toml` Alignment:**
  ```toml
  [[kv_namespaces]]
  binding = "RATE_LIMIT_KV"
  id = "5b184cbe2a4449f6a32be470b97c6338"
  ```
- **Purpose:** Persists rate limiting counters across edge worker isolates for `/api/auth/login`, `/api/auth/reset-password*`, and `/api/v1/options/tradier/status`.
- **Fallback:** If `RATE_LIMIT_KV` is unbound, edge isolates use an in-memory sliding window limiter (marked best-effort).

### D. Resend Email Dispatch (`RESEND_API_KEY`)
- **Dashboard Path:** **Workers & Pages** → **daily-stock-analysis** → **Settings** → **Environment variables** → **Add Secret** → Name: `RESEND_API_KEY`
- **Requirement:** Valid Resend API token for transactional emails (two-step password reset tokens and security inquiries).
- **CLI Alternative:**
  ```bash
  npx wrangler pages secret put RESEND_API_KEY
  ```
- **Optional Sender Address:** Set environment variable `EMAIL_FROM`: `DeltaHarvest Security <onboarding@resend.dev>` or your custom verified domain.

### E. Administrator Notification Email (`ADMIN_NOTIFICATION_EMAIL`)
- **Dashboard Path:** **Workers & Pages** → **daily-stock-analysis** → **Settings** → **Environment variables** → **Add variable** → Name: `ADMIN_NOTIFICATION_EMAIL` → Value: `<administrator-email>`
- **No-Silent-Drop Guarantee:** If no admin email is configured, inquiries queue in D1, `/api/admin/diagnostics` flags `admin_email_configured: false`, and nothing is silently lost.
- **Policy:** Never hardcode administrator email addresses or PII in `wrangler.toml` or repository source files.

---

## 2. One-Time Initial Admin Seeding & Password Change

After provisioning the D1 database and configuring secrets, initialize the primary administrator account using the seed script:

```bash
# Execute against production remote D1 database
node scripts/seed-admin.mjs --email admin@deltaharvest.local --remote --db deltaharvest-db
```

### Script Security Invariants:
1. Ensures database schemas (`users`, `user_profiles`, `password_reset_tokens`).
2. Checks if an active administrator account already exists. **REFUSES to run if an administrator already exists.**
3. Generates a cryptographically random 20-character password, hashes it using PBKDF2 (100,000 iterations with 16-byte random salt), and outputs the password **ONCE** to stdout.
4. Marks `must_change_password = 1` so the administrator is forced to update their password upon first sign-in.
5. First sign-in flow:
   - Admin logs in with the 20-character seeded password.
   - The platform detects `must_change_password: true` and automatically routes the administrator to the mandatory password update form (`/api/auth/change-password`).
   - The administrator chooses a strong personal password; `must_change_password` is cleared to `0`, session token version is bumped, and full access is granted.

---

## 3. Edge Diagnostics Endpoint (`GET /api/admin/diagnostics`)

To eliminate guesswork when verifying Cloudflare dashboard configuration, administrators can inspect the live edge bindings:

- **Endpoint:** `GET /api/admin/diagnostics`
- **Access:** Strictly restricted to authenticated administrators (`authenticateRequest(context, ["admin"])`).
- **Response Format (Booleans Only, NEVER Values):**
  ```json
  {
    "secret_configured": true,
    "d1_bound": true,
    "d1_writable": true,
    "rate_limit_kv_bound": true,
    "resend_configured": true,
    "admin_email_configured": true,
    "environment": "production"
  }
  ```
- **Diagnostics Checklist:**
  | Field | Meaning if `false` | Action Required |
  | :--- | :--- | :--- |
  | `secret_configured` | `SESSION_SECRET` is missing or empty | Add `SESSION_SECRET` secret in Pages Settings |
  | `d1_bound` | `DB` binding is missing from Functions | Bind D1 database `deltaharvest-db` as variable `DB` |
  | `d1_writable` | D1 database is read-only or schema locked | Check Cloudflare D1 account limits or billing |
  | `rate_limit_kv_bound` | `RATE_LIMIT_KV` binding is missing | Bind KV namespace `RATE_LIMIT_KV` |
  | `resend_configured` | `RESEND_API_KEY` is not provisioned | Add `RESEND_API_KEY` in Pages Settings (falls back to FormSubmit) |
  | `admin_email_configured` | Notification mailbox is unset | Set `ADMIN_NOTIFICATION_EMAIL` or configure in Admin Directory |

- **Live Email Delivery Test:**
  Administrators can test end-to-end email delivery via:
  `GET /api/admin/inquiries?action=test_email`
  or via the **Send Test Alert Email** button in the Admin User Directory settings.

---

## 4. Post-Deployment Verification Matrix

Run these verification checks against your deployed domain:

| Test Target | Expected Response | Description |
| :--- | :--- | :--- |
| `GET /api/version` | `{ app, version, buildId }` | Clean metadata only; no internal emails or secrets leaked |
| `POST /api/auth/login` (without secrets) | HTTP 500 `{"error":"Server authentication is not configured."}` | Fail-closed secret verification |
| `POST /api/auth/login` (unbound D1) | HTTP 500 `{"error":"User database is not configured."}` | Fail-closed D1 verification |
| `POST /api/auth/reset-password` (without Resend) | HTTP 503 `{"error":"Password reset is temporarily unavailable..."}` | Safe rejection without third-party token leaks |
| `GET /api/admin/diagnostics` (unauthenticated) | HTTP 401 `{"error":"Unauthorized"}` | Diagnostics endpoint protected |
| `GET /admin/users` (unauthenticated) | HTTP 302 to `/login` | Edge middleware route guard enforcement |
| Rapid hits to `/api/v1/options/tradier/status` | HTTP 429 with `Retry-After` header | Rate limiter protection |

---

## 5. Scheduled Morning Digest Push Setup

The platform includes an automated pre-market intelligence digest dispatched every trading day at **6:00 AM Central Time (11:00 UTC)**.

### Configuration Steps

1. **Cloudflare Pages Environment Variables:**
   - In Cloudflare Dashboard → Workers & Pages → `deltaharvest` (or your Pages project) → **Settings** → **Environment Variables**:
     - `CRON_SECRET`: Set to any random secure string (e.g. generated via `openssl rand -hex 32`).
     - `RESEND_API_KEY`: Set to your Resend API key (`re_...`) for HTML email delivery.

2. **GitHub Actions Repository Secrets:**
   - In GitHub Repository → **Settings** → **Secrets and variables** → **Actions**:
     - `APP_URL`: Set to your production domain, e.g. `https://deltaharvest.pages.dev`.
     - `CRON_SECRET`: Set to the identical secret value defined in Cloudflare Pages.

3. **Automation Workflow:**
   - Workflow file: `.github/workflows/morning-digest.yml`
   - Trigger cadence: Monday through Friday at `0 11 * * 1-5` UTC (6:00 AM US Central / 7:00 AM US Eastern).
   - Manual Run: GitHub Repository → **Actions** → **Scheduled Morning Market Digest** → **Run workflow** (select `force: true` to bypass weekend/holiday checks).
   - Alternative Cron: `./scripts/trigger_morning_digest.sh --force` from any external scheduler (crontab, Cloudflare Cron Triggers, etc.).

4. **User Opt-In via Profile:**
   - Each tenant controls their subscription from their **User Dashboard** profile panel (`/profile`).
   - Navigate to the **Morning Intelligence Digest** section.
   - Toggle **Receive Morning Digest** on.
   - Enter/confirm preferred delivery email address.
   - (Optional) Enter a **Discord Webhook URL** for community/channel notifications.
   - Click **Save Preferences**.

5. **Verification & Testing:**
   - **Test Single Email Delivery:**
     ```bash
     curl -X POST "https://deltaharvest.pages.dev/api/scheduled/morning-digest?test_email=your-email@example.com&force=true" \
       -H "Authorization: Bearer <YOUR_CRON_SECRET>"
     ```
   - Admins can also trigger directly while logged into the terminal.
   - Edge route verifies trading day status via CBOE/US market calendar (unless `force=true`).
   - Delivery outcomes and subscriber counts are logged to D1 audit storage.

---

## 6. Interactive Discord Bot & Strategy Search Providers (v3.6)

### A. Discord Interactions Gateway (`DISCORD_PUBLIC_KEY`)
- **Dashboard Path:** **Workers & Pages** → **daily-stock-analysis** → **Settings** → **Environment variables** → **Add Secret** → Name: `DISCORD_PUBLIC_KEY`
- **Source:** From Discord Developer Portal → Application → General Information → **Public Key**.
- **Interactions URL:** In Discord Developer Portal, set **Interactions Endpoint URL** to:
  `https://your-domain.pages.dev/api/bot/discord`
- **Supported Slash Commands:**
  - `/options <symbol>`: Comprehensive options analysis card with 15Δ/22Δ strikes.
  - `/csp <symbol>`: Cash-Secured Put income boundaries & downside cushion.
  - `/cc <symbol>`: Covered Call resistance target & annualized yield.
  - `/checklist <symbol>`: 5-Point Options Pre-Flight Underwriting Scorecard.
  - `/recap`: Macro index and CBOE VIX pulse summary.
- **Verification:** Discord automatically sends a signed PING upon URL entry; Cloudflare Pages responds with PONG via native Ed25519 Web Crypto.

### B. Deep Catalyst Search (`TAVILY_API_KEY` or `BRAVE_API_KEY`)
- **Dashboard Path:** **Workers & Pages** → **daily-stock-analysis** → **Settings** → **Environment variables** → **Add Secret** → Name: `TAVILY_API_KEY` (or `BRAVE_API_KEY`)
- **Purpose:** Enables the Strategy Agent to execute live web queries (`search_financial_catalysts`) for breaking earnings releases, guidance revisions, FDA events, and corporate actions.
- **Fallback:** If neither key is configured, the agent automatically falls back to live Google News RSS headlines and edge quantitative models.

### C. Google Gemini AI Model (`GEMINI_API_KEY`)
- **Dashboard Path:** **Workers & Pages** → **daily-stock-analysis** → **Settings** → **Environment variables** → **Add Secret** → Name: `GEMINI_API_KEY`
- **Active Model:** Google Gemini 3.8 Flash (`gemini-3.8-flash`). (Note: `gemini-2.5-flash` has been deprecated by Google and is automatically aliased to `gemini-3.8-flash`).

---

## 7. Multi-Provider LLM Failover Chain (Numbered Slots 1..7)

DeltaHarvest implements a resilient 7-provider failover chain behind `functions/api/_llm.js`. When the primary Google Gemini model encounters rate limits (HTTP 429), server errors (HTTP 5xx), or network timeouts, execution automatically cascades sequentially across configured fallback slots:

| Slot | Provider | Default Model | Console / Key Generation | Dashboard Secret Name |
| :---: | :--- | :--- | :--- | :--- |
| **1** | **Groq** | `llama-3.3-70b-versatile` | [console.groq.com/keys](https://console.groq.com/keys) | `LLM_FALLBACK_1_API_KEY` |
| **2** | **Cerebras** | `llama-3.3-70b` | [cloud.cerebras.ai](https://cloud.cerebras.ai/) | `LLM_FALLBACK_2_API_KEY` |
| **3** | **OpenRouter** | `openrouter/free` | [openrouter.ai/keys](https://openrouter.ai/keys) | `LLM_FALLBACK_3_API_KEY` |
| **4** | **Mistral** | `mistral-small-latest` | [console.mistral.ai/api-keys](https://console.mistral.ai/api-keys) | `LLM_FALLBACK_4_API_KEY` |
| **5** | **NVIDIA NIM** | `meta/llama-3.3-70b-instruct` | [build.nvidia.com/settings/api-keys](https://build.nvidia.com/settings/api-keys) | `LLM_FALLBACK_5_API_KEY` |
| **6** | **Cloudflare Workers AI** | `@cf/meta/llama-3.1-8b-instruct` | [dash.cloudflare.com/profile/api-tokens](https://dash.cloudflare.com/profile/api-tokens) | `CLOUDFLARE_API_TOKEN` & `CLOUDFLARE_ACCOUNT_ID` |
| **7** | **Cohere** | `command-r-plus` | [dashboard.cohere.com/api-keys](https://dashboard.cohere.com/api-keys) | `LLM_FALLBACK_7_API_KEY` |

### Iron Failover Rules:
1. **Request-Shape Protection (HTTP 400):** If an upstream returns HTTP 400 (Bad Request), the error is surfaced **immediately** to the user. Failover is strictly suppressed because request-shape bugs cannot be resolved by switching providers.
2. **Failover Triggers:** Cascades on HTTP 401, HTTP 429, HTTP 5xx, or network timeouts.
3. **Admin Verification Endpoint:** Authenticated administrators can test configured slots live at:
   `GET /api/admin/llm-chain-test` (returns `[{ slot, provider, model, ok, latencyMs }]` — provider/model names only, zero key leakage).
4. **Diagnostics Endpoint:** `GET /api/admin/diagnostics` reports active chain slots in `llm_chain: ["groq", "cerebras", ...]`.


