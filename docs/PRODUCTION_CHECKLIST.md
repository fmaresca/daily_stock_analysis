# DeltaHarvest Production Deployment Checklist & Security Pre-Flight Gates

This document defines the mandatory pre-flight checklist and operational security requirements for deploying DeltaHarvest to Cloudflare Pages.

---

## 1. Mandatory Pre-Deploy Gates (Fail-Closed)

DeltaHarvest runs in a strict **fail-closed** security posture. If critical security bindings or secrets are absent in production, edge authentication endpoints immediately return HTTP 500 with generic errors rather than falling back to insecure defaults.

### A. Session Secret (`SESSION_SECRET`)
- **Requirement:** Cryptographically secure HMAC-SHA256 signing key (minimum 32 random bytes).
- **Generation:**
  ```bash
  openssl rand -hex 32
  ```
- **Configuration:**
  - Set via Cloudflare CLI:
    ```bash
    npx wrangler pages secret put SESSION_SECRET
    ```
  - Or via Cloudflare Dashboard: **Pages** → **daily-stock-analysis** → **Settings** → **Environment variables** → **Add Secret** (`SESSION_SECRET`).
- **Policy:** **NEVER** define `SESSION_SECRET` in `wrangler.toml`, and **NEVER** commit it to version control.

### B. Cloudflare D1 Database Binding (`DB`)
- **Requirement:** Active Cloudflare D1 database bound to the Pages Function runtime under the variable name `DB`.
- **Configuration:**
  - Via Cloudflare Dashboard: **Pages** → **daily-stock-analysis** → **Settings** → **Functions** → **D1 database bindings** → Variable name: `DB` → Select your D1 database.
  - Or via `wrangler.toml`:
    ```toml
    [[d1_databases]]
    binding = "DB"
    database_name = "deltaharvest-db"
    database_id = "<YOUR_D1_DATABASE_UUID>"
    ```
- **Policy:** In production, user authentication fails closed (HTTP 500) if `DB` is unbound. Hardcoded bootstrap user fallbacks are disabled in production.

### C. Resend Email Dispatch (`RESEND_API_KEY`)
- **Requirement:** Valid Resend API token for transactional emails (two-step password reset tokens and security inquiries).
- **Configuration:**
  - Set via:
    ```bash
    npx wrangler pages secret put RESEND_API_KEY
    ```
  - Optional sender address via `EMAIL_FROM`: `DeltaHarvest Security <onboarding@resend.dev>` or your custom verified domain.

### D. Distributed Rate Limiter (`RATE_LIMIT_KV`, Optional but Recommended)
- **Requirement:** Cloudflare Workers KV namespace binding named `RATE_LIMIT_KV`.
- **Purpose:** Persists rate limiting counters across edge worker isolates for `/api/auth/login`, `/api/auth/reset-password*`, and `/api/v1/options/tradier/status`.
- **Fallback:** If `RATE_LIMIT_KV` is unbound, edge isolates use an in-memory sliding window limiter (marked best-effort).

---

## 2. One-Time Initial Admin Seeding

After provisioning the D1 database and configuring secrets, initialize the primary administrator account using the seed script:

```bash
# Execute against production remote D1 database
node scripts/seed-admin.mjs --email admin@deltaharvest.local
```

- The script ensures database schemas (`users`, `user_profiles`, `password_reset_tokens`).
- Checks if an active administrator account already exists (refuses to run if one exists).
- Generates a cryptographically random 20-character password, hashes it using PBKDF2 (100,000 iterations), and outputs the password **ONCE** to stdout.
- Marks `must_change_password = 1` so the administrator is forced to update their password upon first sign-in.

---

## 3. Post-Deployment Verification Matrix

Run these verification checks against your deployed domain:

| Test Target | Expected Response | Description |
| :--- | :--- | :--- |
| `GET /api/version` | `{ app, version, buildId }` | Clean metadata only; no internal emails or secrets leaked |
| `POST /api/auth/login` (without secrets) | HTTP 500 `{"error":"Server authentication is not configured."}` | Fail-closed verification |
| `POST /api/auth/reset-password` (arbitrary payload) | HTTP 200 generic message | Cannot directly reset passwords without two-step token flow |
| `GET /admin/users` (unauthenticated) | HTTP 302 to `/login` | Edge middleware route guard enforcement |
| Rapid hits to `/api/v1/options/tradier/status` | HTTP 429 with `Retry-After` header | Rate limiter protection |
