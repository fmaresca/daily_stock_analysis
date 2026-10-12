# DeltaHarvest Gap Audit Report: Reset Token Follow-Up Fix Pack
**Date:** 2026-10-12  
**Target Build:** dh-fd72de4-20261012155921  
**Scope:** Read-Only Audit of Reset Token Lifecycles, Masking Verification, Revocation Machinery, User Directory Loading, and Admin Notifications.

---

## 1. End-to-End Reset Token Data Path

### A. Token Issuance
- **Entrypoint:** `POST /api/auth/reset-password` ([`functions/api/auth/reset-password.js:21-244`](file:///c:/Frank/DailyStock/functions/api/auth/reset-password.js#L21-L244))
- **Rate Limiting:** IP rate limit is checked for 20 attempts/hour (`_rate_limit.js:40`), and email rate limit is checked for 5 attempts/hour (`_rate_limit.js:46`).
- **Generation:** Cryptographically random 32-byte token generated via Web Crypto API:
  ```javascript
  const plaintextToken = generateSecureRandomToken(32); // functions/api/_auth_utils.js:101-105
  const tokenHash = await hashTokenSha256(plaintextToken); // functions/api/_auth_utils.js:111-120
  ```
- **Plaintext Scope:** `plaintextToken` exists in ephemeral execution memory only long enough to:
  1. Compute its SHA-256 hash `tokenHash`.
  2. Format the user's reset email body and link: `https://<origin>/login?reset_token=${plaintextToken}` ([`reset-password.js:82`](file:///c:/Frank/DailyStock/functions/api/auth/reset-password.js#L82)).
- **Generic HTTP Response:** The endpoint always returns:
  ```json
  { "success": true, "message": "If an account exists for that email, a reset link has been sent." }
  ```
  Zero token data or reset URLs are ever returned to the requesting client.

### B. Token Storage
- **Database Table:** Cloudflare D1 table `password_reset_tokens` ([`functions/api/_auth_utils.js:283-289`](file:///c:/Frank/DailyStock/functions/api/_auth_utils.js#L283-L289)):
  ```sql
  CREATE TABLE IF NOT EXISTS password_reset_tokens (
    token_hash TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (DATETIME('now'))
  )
  ```
- **Storage Function:** `storePasswordResetToken(env, tokenHash, user.id, 30)` ([`functions/api/_auth_utils.js:317-350`](file:///c:/Frank/DailyStock/functions/api/_auth_utils.js#L317-L350)):
  - **What is stored:** ONLY the SHA-256 hash (`token_hash`), never the plaintext token.
  - **Lifetime:** Exactly 30 minutes from issuance:
    `expires_at = new Date(Date.now() + 30 * 60 * 1000).toISOString()`.
  - **Dual-Layer Memory Mirror:** Also stored in `localMemoryResetTokens` Map with automatic eviction of expired entries ([`_auth_utils.js:321-330`](file:///c:/Frank/DailyStock/functions/api/_auth_utils.js#L321-L330)).
- **Audit Table Record:** Simultaneously written to `access_inquiries` table ([`reset-password.js:87-120`](file:///c:/Frank/DailyStock/functions/api/auth/reset-password.js#L87-L120)):
  - Note format: `"Password reset link dispatched directly to registered user. Correlation fingerprint: <6-char-hash>…"`
  - `status: 'pending'`.
  - Zero plaintext tokens or reset URLs are stored in `access_inquiries`.

### C. Consumption / Redemption
- **Endpoint:** `POST /api/auth/reset-password/confirm` ([`functions/api/auth/reset-password/confirm.js:20-112`](file:///c:/Frank/DailyStock/functions/api/auth/reset-password/confirm.js#L20-L112))
- **Consumption Function:** `consumePasswordResetToken(env, tokenHash)` ([`functions/api/_auth_utils.js:352-386`](file:///c:/Frank/DailyStock/functions/api/_auth_utils.js#L352-L386)):
  - Immediately executes `DELETE FROM password_reset_tokens WHERE token_hash = ?` before validating expiry to guarantee single-use.
  - Checks `if (row.expires_at < now) return null;`
  - Increments user's `token_version` to invalidate existing sessions.
  - Updates `access_inquiries` row to `status = 'used'`.

### D. Admin API Response & UI Display
- **Admin Inquiries Endpoint:** `GET /api/admin/inquiries` ([`functions/api/admin/inquiries.js:615-688`](file:///c:/Frank/DailyStock/functions/api/admin/inquiries.js#L615-L688))
- **Admin Console View:** `web/src/components/auth/AdminUsersView.tsx:645-780` (Tab: "Access & Reset Inquiries").
- **Displayed Fields:** Request ID, User Name/Email, Origin IP, Requested Time, Calculated Expiry Time, Status Badge (`pending`, `expired`, `used`, `revoked`), and Truncated Token Fingerprint (`a1b2c3…`).

---

## 2. Confirmation of the Masking Fix

### A. API Endpoints Returning Token Data
We conducted a comprehensive audit of all API endpoints across `functions/api/`:

| Endpoint | Method | Response Payload | Plaintext Token / Reset URL Present? |
|---|---|---|---|
| `/api/auth/reset-password` | POST | Generic confirmation message | **NO** (Zero token returned) |
| `/api/auth/reset-password/confirm` | POST | Success/error message | **NO** (Zero token returned) |
| `/api/admin/inquiries` | GET | Array of sanitized inquiry objects | **NO** (Only 6-char fingerprint + ellipsis) |
| `/api/admin/users` | GET | User directory metadata | **NO** (Zero token fields) |
| `/api/admin/settings` | GET | Admin notification email | **NO** (Zero token fields) |
| `/api/admin/diagnostics` | GET | Boolean subsystem status | **NO** (Zero token fields) |

### B. Serializer Proof
In [`functions/api/admin/inquiries.js:630-677`](file:///c:/Frank/DailyStock/functions/api/admin/inquiries.js#L630-L677):
```javascript
// Plaintext token exposure remediation:
let safeNote = row.note || "";
let tokenFingerprint = null;

if (row.request_type === "PASSWORD_RESET") {
  const tokenMatch = safeNote.match(/reset_token=([a-fA-F0-9]{6})/);
  if (tokenMatch) {
    tokenFingerprint = `${tokenMatch[1]}…`;
  } else {
    const idHash = (row.id || "").replace(/^inq_reset_/, "");
    tokenFingerprint = idHash ? `${idHash.substring(0, 6)}…` : "rst…";
  }
  safeNote = "Password reset link dispatched directly to user email.";
} else if (safeNote.includes("reset_token=")) {
  safeNote = safeNote.replace(/reset_token=[a-zA-Z0-9_\-]+/g, "reset_token=[REDACTED]");
}
```
**Conclusion:** No endpoint outputs a full token or reset URL. The masking fix is sound in code.

---

## 3. Revocation Machinery Audit

### A. Does an API Endpoint Exist to Revoke Reset Tokens?
**YES, but partially unwired and under-audited.**

An inquiry update endpoint exists:
`PATCH /api/admin/inquiries` ([`functions/api/admin/inquiries.js:698-767`](file:///c:/Frank/DailyStock/functions/api/admin/inquiries.js#L698-L767)):
- **Authorization:** Gated with `authenticateRequest(context, ["admin"])`.
- **Payload:** `{ id: string, status: "revoked" }`.
- **Database Operations:**
  1. Updates `access_inquiries`:
     `UPDATE access_inquiries SET status = 'revoked' WHERE id = ?`
  2. Resolves target user: `const targetUser = await getUserByEmail(env, inquiry.email)`.
  3. Deletes active reset tokens:
     `DELETE FROM password_reset_tokens WHERE user_id = ?`

### B. Why Did Live Verification Report "No Revocation Controls in the UI"?
Two distinct issues explain this observation:

1. **Dynamic Expiration Cutoff Hides the Button:**  
   In [`AdminUsersView.tsx:690, 729`](file:///c:/Frank/DailyStock/web/src/components/auth/AdminUsersView.tsx#L690):
   ```tsx
   const isPending = (inq.status || 'pending').toLowerCase() === 'pending';
   ...
   {isPending && (
     <button onClick={() => handleRevokeInquiry(inq.id)}>Revoke</button>
   )}
   ```
   However, `inquiries.js:655-663` dynamically reclassifies inquiries older than 30 minutes:
   ```javascript
   if (computedStatus === "pending" && nowMs > createdMs + 30 * 60 * 1000) {
     computedStatus = "expired";
   }
   ```
   When Frank tested live, all existing inquiries were historical (>30 min old). Their status became `"expired"`, which caused `isPending` to evaluate to `false`, **completely hiding the Revoke button** from view!

2. **Missing Safety and Confirmation UX:**  
   The existing `handleRevokeInquiry` ([`AdminUsersView.tsx:264-288`](file:///c:/Frank/DailyStock/web/src/components/auth/AdminUsersView.tsx#L264-L288)) executes an immediate `fetch` without an explicit user confirmation dialog (`"Revoke this reset token? The user will need to request a new one."`).

3. **Missing Audit Log Entry:**  
   The current PATCH route merely mutates the `access_inquiries` status column and deletes the token row. It does not write an immutable audit log entry documenting *who* revoked it, *when*, *token fingerprint*, and *reason*.

4. **Missing Dedicated Endpoint:**  
   There is no dedicated `POST /api/admin/reset-tokens/:id/revoke` route as specified in Prompt 2.

---

## 4. User Directory Failing Load Root Cause Analysis

### A. Failure Symptoms
In `AdminUsersView.tsx` under the "User Directory & Provisioning" tab:
- Banner error: `"Unable to load user directory from server. Please verify administrator session."`
- Metric: `0 registered users`.

### B. Endpoint Call Trace
1. **Frontend Call:** `AdminUsersView.tsx:179-182` fetches `GET /api/admin/users`:
   ```typescript
   const res = await fetch('/api/admin/users', {
     headers: { 'Accept': 'application/json' },
     credentials: 'same-origin',
   });
   ```
2. **Backend Handler:** `functions/api/admin/users.js:7-24` executes:
   ```javascript
   export async function onRequestGet(context) {
     const auth = await authenticateRequest(context, ["admin"]);
     if (!auth.authenticated) return auth.response;
     try {
       const users = await getAllUsers(context.env);
       return new Response(JSON.stringify({ success: true, users }), ...);
     } catch (err) {
       console.error("Failed to fetch users:", err);
       return new Response(JSON.stringify({ error: "Failed to retrieve user list." }), { status: 500, ... });
     }
   }
   ```
3. **Authentication Check (`authenticateRequest`):**  
   Frank's session is valid and authenticated as `admin` (proven by the fact that `GET /api/admin/inquiries` and `GET /api/admin/settings` succeed with the same cookie). Authentication does NOT fail.

### C. Root Cause: Query Subquery Crash in `getAllUsers`
In [`functions/api/_auth_utils.js:453-460`](file:///c:/Frank/DailyStock/functions/api/_auth_utils.js#L453-L460):
```sql
SELECT u.id, u.email, u.role, u.is_active, u.must_change_password, u.last_login_at, u.created_at, u.updated_at,
       p.display_name, p.account_notes,
       (SELECT COUNT(*) FROM user_trades WHERE user_id = u.id) AS trade_count
FROM users u
LEFT JOIN user_profiles p ON u.id = p.user_id
ORDER BY u.created_at DESC
```
Look closely at:
`(SELECT COUNT(*) FROM user_trades WHERE user_id = u.id) AS trade_count`

1. **Table Missing from Auto-Initialization:**  
   `ensureUsersTables(env)` ([`_auth_utils.js:248-296`](file:///c:/Frank/DailyStock/functions/api/_auth_utils.js#L248-L296)) creates `users`, `user_profiles`, and `password_reset_tokens`. It **does NOT create `user_trades`**.
2. **Crash in Production:**  
   If the remote D1 database was created or initialized without the `user_trades` table (or before trade tables were added), SQLite throws:  
   `D1_ERROR: no such table: user_trades`.
3. **Hard Throw in Non-Dev Mode:**  
   In [`_auth_utils.js:483-488`](file:///c:/Frank/DailyStock/functions/api/_auth_utils.js#L483-L488):
   ```javascript
   catch (err) {
     console.warn("D1 query error in getAllUsers:", err);
     if (env?.ENVIRONMENT !== "development") {
       throw err; // In production, this rethrows and crashes the request!
     }
   }
   ```
4. **Cascade to Frontend Error:**  
   The rethrown error triggers the catch block in `users.js:17`, returning **HTTP 500**. In `AdminUsersView.tsx:213`, `!res.ok` triggers the fallback branch, which renders:
   `"Unable to load user directory from server. Please verify administrator session."`

---

## 5. Admin Token Notification Policy & Trigger Conditions

### A. Current Implementation in `reset-password.js`
In [`functions/api/auth/reset-password.js:149-205`](file:///c:/Frank/DailyStock/functions/api/auth/reset-password.js#L149-L205):
```javascript
// Always send to administrator email to guarantee delivery to administrator
const targetEmails = new Set();
if (adminEmail) targetEmails.add(adminEmail);
targetEmails.add(cleanEmail);

for (const targetEmail of targetEmails) {
  const isAdminNotice = adminEmail && targetEmail.toLowerCase() === adminEmail.toLowerCase() && cleanEmail.toLowerCase() !== adminEmail.toLowerCase();
  ...
  const adminNoticeText = `DeltaHarvest Security Alert:\n\nA password reset was requested for ${cleanEmail}...\nToken correlation fingerprint: ${tokenFingerprint}\n\nFor account security, reset tokens are never transmitted to administrative channels.`;
}
```

### B. Trigger Conditions
1. A password reset is submitted for any valid user email via `POST /api/auth/reset-password`.
2. `RESEND_API_KEY` is present and non-empty.
3. `adminEmail` is resolved from D1 `system_settings` or `ADMIN_NOTIFICATION_EMAIL` env var.
4. **Current Payload Sent to Admin:** A notification email IS sent to `adminEmail` on **every single reset request**. It contains the user's email, timestamp, IP, and a 6-character correlation fingerprint (`a1b2c3…`). It does **NOT** contain a working reset link or plaintext token.
5. **Fallback:** If Resend is unavailable, FormSubmit HTTPS POST is fired to `adminEmail` with identical metadata ([`reset-password.js:208-233`](file:///c:/Frank/DailyStock/functions/api/auth/reset-password.js#L208-L233)).

### C. Policy Decision for Frank
Frank must decide between two architectural policies:

| Option | Policy | Pros | Cons |
|---|---|---|---|
| **Option A (KEEP)** | Keep tokenless administrative security alerts on reset requests. | Admin is alerted in real-time if an unauthorized reset attack occurs on any client account. | Admin receives an email every time any user requests a password reset. |
| **Option B (REMOVE)** | Completely remove admin notification from password reset flow. | Zero emails sent to admin; reset email goes exclusively to the requesting user. | Admin only sees resets by reviewing the Admin Console inquiries tab. |

---

## 6. Regression Tests & CI Coverage

### A. Existing Tests Covering Reset & Masking
1. **`tests/test_admin_reset_token_security.mjs` (4 tests):**
   - Test 1: `GET /api/admin/inquiries` never returns plaintext tokens or URLs; legacy notes are sanitized; fingerprint is truncated.
   - Test 2: `PATCH /api/admin/inquiries` with `status='revoked'` updates inquiry row and deletes active `password_reset_tokens`.
   - Test 3: `POST /api/auth/reset-password` dispatches working link to user, but sends only tokenless alert to admin.
   - Test 4: Static code audit of `AdminUsersView.tsx` forbids `{inq.note}` and `reset_token=` in DOM.
2. **`scripts/check_token_exposure_gate.mjs`:**
   - Static AST/regex gate ran in pre-commit/CI blocking wildcard queries (`SELECT * FROM access_inquiries`), raw token selection, or unmasked DOM rendering.
3. **`tests/test_web_financial_math.mjs` (Test 25):**
   - Asserts FormSubmit dispatches contain no tokens; asserts zero personal email literals in code; asserts no hardcoded credentials.

### B. Gaps in Current Test Suite
- **No Negative Token-Use Test:** No test verifies that submitting a revoked token to `POST /api/auth/reset-password/confirm` returns HTTP 400/401 failure before expiry.
- **No Non-Admin Revocation Test:** No test verifies that calling revocation as a non-admin returns HTTP 403 Forbidden.
- **No Double-Revoke Test:** No test asserts idempotency on repeated revocation calls.
- **No Robust Directory Fallback Test:** No test verifies that `GET /api/admin/users` succeeds when `user_trades` table is missing in D1.

---

## 7. Proposed Fixes per Gap

| Gap | Root Cause | Proposed Surgical Fix | Scope / Target Prompt |
|---|---|---|---|
| **1. Missing Revocation Controls & Confirmation** | Revoke button hidden on expired inquiries; no explicit confirmation modal; no audit trail record. | Add dedicated `POST /api/admin/reset-tokens/:id/revoke` endpoint (and wire existing PATCH); add confirmation dialog in UI; log actor, timestamp, truncated fingerprint, and reason to audit log. | **Prompt 2** |
| **2. User Directory Load Failure (HTTP 500)** | `getAllUsers` executes subquery `(SELECT COUNT(*) FROM user_trades WHERE user_id = u.id)` which hard-crashes when table is missing. | Wrap trade count subquery safely or check table existence; gracefully fallback `trade_count = 0` if `user_trades` table does not exist. Ensure `users` and `user_profiles` schema auto-provisions cleanly. | **Prompt 3** |
| **3. Pre-Fix Exposed Tokens in D1** | Legacy tokens created before the masking patch may still reside in D1 `password_reset_tokens`. | One-shot sweep script/endpoint to delete all tokens created before the fix timestamp; log count and truncated fingerprints. | **Prompt 4** |
| **4. Admin Notification Email Policy** | Reset flow dispatches security alert to admin on every user reset request. | Apply Frank's policy decision (keep tokenless security alert vs. remove admin notification completely from `reset-password.js`). | **Prompt 4** |
| **5. Missing Regression Coverage** | No negative revoke-then-use tests, double-revoke tests, or missing table resilience tests. | Add comprehensive unit and integration tests covering revoke-then-use, double-revoke, non-admin 403, and directory resiliency. | **Prompt 5** |

---

**PAUSE. Awaiting Frank's approval of the gap list and decision on the admin-token-notification policy (KEEP or REMOVE).**
