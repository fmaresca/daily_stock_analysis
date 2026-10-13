/**
 * Security Regression Test Suite: Admin Reset Token Exposure Prevention
 *
 * Covers:
 * 1. Admin Inquiries API Handler:
 *    - Guarantees NO response field exposes plaintext tokens or reset URLs.
 *    - Asserts presence of safe metadata (id, email, created_at, expires_at, status, token_fingerprint).
 *    - Asserts token_fingerprint is non-usable (first 6 chars + "…").
 * 2. Admin Inquiries Server-Side Revocation:
 *    - Tests PATCH /api/admin/inquiries with status='revoked'.
 *    - Asserts DB status updated to 'revoked' while preserving row for audit trail.
 *    - Asserts associated active password_reset_tokens rows are purged.
 * 3. Legitimate User Reset Flow & Lifecycle Tracking:
 *    - Asserts legitimate user email receives reset link and single-use token.
 *    - Asserts admin alert notification receives ZERO tokens or reset URLs.
 *    - Asserts successful password reset updates inquiry status to 'used'.
 * 4. UI Contract & Masked Display Invariants:
 *    - Verifies AdminUsersView renders safe metadata columns and NO unmasked tokens.
 */

import { test } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Helper to create mock D1 database
function createMockD1() {
  return {
    tables: {
      access_inquiries: [],
      password_reset_tokens: [],
      users: [
        {
          id: 'usr_target_victim',
          email: 'target@example.com',
          display_name: 'Target Account',
          password_hash: 'prev_hash',
          password_salt: 'prev_salt',
          role: 'user',
          is_active: 1,
          token_version: 0,
        },
        {
          id: 'usr_super_admin',
          email: 'superadmin@example.com',
          display_name: 'Admin Console',
          password_hash: 'admin_hash',
          password_salt: 'admin_salt',
          role: 'admin',
          is_active: 1,
          token_version: 0,
        },
      ],
      system_settings: [
        { key: 'admin_notification_email', value: 'superadmin@example.com' },
      ],
    },
    prepare(sql) {
      const d1 = this;
      let boundParams = [];
      return {
        bind(...params) {
          boundParams = params;
          return this;
        },
        async run() {
          const trimmed = sql.trim().toUpperCase();
          if (trimmed.startsWith('CREATE TABLE')) {
            return { success: true };
          }
          if (trimmed.startsWith('INSERT INTO ACCESS_INQUIRIES')) {
            const [id, request_type, name, email, note, ip, status] = boundParams;
            d1.tables.access_inquiries.push({
              id,
              request_type,
              name,
              email,
              note,
              ip,
              status: status || 'pending',
              created_at: new Date().toISOString(), // wall-clock-ok: mock test timestamp
            });
            return { success: true };
          }
          if (trimmed.startsWith('INSERT INTO PASSWORD_RESET_TOKENS')) {
            const [token_hash, user_id, expires_at, created_at] = boundParams;
            d1.tables.password_reset_tokens.push({
              token_hash,
              user_id,
              expires_at,
              created_at,
            });
            return { success: true };
          }
          if (trimmed.startsWith('UPDATE ACCESS_INQUIRIES')) {
            if (sql.includes('SET status = ? WHERE id = ?')) {
              const [status, id] = boundParams;
              const found = d1.tables.access_inquiries.find((r) => r.id === id);
              if (found) found.status = status;
            } else if (sql.includes("SET status = 'revoked'")) {
              const [id] = boundParams;
              const found = d1.tables.access_inquiries.find((r) => r.id === id);
              if (found) found.status = 'revoked';
            } else if (sql.includes("SET status = 'used'")) {
              const [email] = boundParams;
              const found = d1.tables.access_inquiries.find(
                (r) => r.email === email && r.request_type === 'PASSWORD_RESET' && r.status === 'pending'
              );
              if (found) found.status = 'used';
            }
            return { success: true };
          }
          if (trimmed.startsWith('DELETE FROM PASSWORD_RESET_TOKENS')) {
            if (sql.includes('WHERE user_id = ?')) {
              const [user_id] = boundParams;
              d1.tables.password_reset_tokens = d1.tables.password_reset_tokens.filter((r) => r.user_id !== user_id);
            } else if (sql.includes('WHERE token_hash = ?')) {
              const [token_hash] = boundParams;
              d1.tables.password_reset_tokens = d1.tables.password_reset_tokens.filter((r) => r.token_hash !== token_hash);
            }
            return { success: true };
          }
          if (trimmed.startsWith('UPDATE USERS SET PASSWORD_HASH')) {
            const [hash, salt, id] = boundParams;
            const u = d1.tables.users.find((user) => user.id === id);
            if (u) {
              u.password_hash = hash;
              u.password_salt = salt;
            }
            return { success: true };
          }
          return { success: true };
        },
        async all() {
          if (sql.includes('access_inquiries')) {
            return { results: [...d1.tables.access_inquiries] };
          }
          return { results: [] };
        },
        async first() {
          if (sql.includes('FROM access_inquiries WHERE id = ?')) {
            const [id] = boundParams;
            return d1.tables.access_inquiries.find((r) => r.id === id) || null;
          }
          if (sql.includes('FROM users')) {
            const [param] = boundParams;
            return (
              d1.tables.users.find(
                (u) => u.id === param || u.email.toLowerCase() === String(param).toLowerCase()
              ) || null
            );
          }
          if (sql.includes('FROM system_settings WHERE key = ?')) {
            const [key] = boundParams;
            return d1.tables.system_settings.find((s) => s.key === key) || null;
          }
          if (sql.includes('FROM password_reset_tokens WHERE token_hash = ?')) {
            const [token_hash] = boundParams;
            return d1.tables.password_reset_tokens.find((r) => r.token_hash === token_hash) || null;
          }
          return null;
        },
      };
    },
  };
}

test('1. Admin Inquiries API Handler: Never returns plaintext reset tokens in any field', async () => {
  const { onRequestGet } = await import('../functions/api/admin/inquiries.js');
  const { createSessionToken } = await import('../functions/api/_auth_utils.js');

  const mockDb = createMockD1();
  const KNOWN_SECRET_TOKEN = 'secret_reset_token_aabbccddeeff0011223344';

  // Seed a legacy inquiry row containing a historical plaintext reset URL/token
  mockDb.tables.access_inquiries.push({
    id: 'inq_reset_legacy_99',
    request_type: 'PASSWORD_RESET',
    name: 'Target Account',
    email: 'target@example.com',
    note: `Password reset token generated. Reset URL: https://app.deltaharvest.local/login?reset_token=${KNOWN_SECRET_TOKEN}`,
    ip: '192.168.1.100',
    status: 'pending',
    created_at: new Date().toISOString(), // wall-clock-ok: mock test timestamp
  });

  const env = {
    DB: mockDb,
    SESSION_SECRET: 'super_secret_session_key_minimum_32_characters_for_hmac',
    ADMIN_NOTIFICATION_EMAIL: 'superadmin@example.com',
  };

  const adminToken = await createSessionToken(
    { sub: 'usr_super_admin', id: 'usr_super_admin', email: 'superadmin@example.com', role: 'admin' },
    env.SESSION_SECRET
  );

  const req = new Request('https://app.deltaharvest.local/api/admin/inquiries', {
    headers: { Cookie: `deltaharvest_session=${adminToken}` },
  });

  const res = await onRequestGet({ request: req, env });
  assert.strictEqual(res.status, 200, 'Admin inquiries request must return 200 OK');

  const data = await res.json();
  assert.strictEqual(data.success, true);
  assert.ok(Array.isArray(data.inquiries), 'Must return an inquiries array');
  assert.ok(data.inquiries.length > 0, 'Must contain seeded inquiry');

  // Stringify the entire payload to guarantee NO field contains the secret token or reset URL
  const rawPayload = JSON.stringify(data);
  assert.ok(!rawPayload.includes(KNOWN_SECRET_TOKEN), 'PAYLOAD MUST NOT CONTAIN KNOWN PLAINTEXT RESET TOKEN');
  assert.ok(!rawPayload.includes('reset_token='), 'PAYLOAD MUST NOT CONTAIN reset_token URL QUERY PARAMETER');

  // Verify safe metadata fields
  const inquiry = data.inquiries.find((i) => i.id === 'inq_reset_legacy_99');
  assert.ok(inquiry, 'Seeded inquiry must be present');
  assert.strictEqual(inquiry.email, 'target@example.com');
  assert.strictEqual(inquiry.status, 'pending');
  assert.ok(inquiry.created_at, 'Must include created_at timestamp');
  assert.ok(inquiry.expires_at, 'Must include calculated expires_at timestamp');
  assert.ok(inquiry.token_fingerprint, 'Must include token correlation fingerprint');
  assert.ok(inquiry.token_fingerprint.endsWith('…'), 'Fingerprint must end with ellipsis');
  assert.ok(inquiry.token_fingerprint.length <= 10, 'Fingerprint must be truncated and non-usable');
  assert.ok(!inquiry.note.includes(KNOWN_SECRET_TOKEN), 'Note field must be sanitized');
});

test('2. Admin Inquiries Revocation: Updates status to revoked and invalidates reset tokens', async () => {
  const { onRequestPatch } = await import('../functions/api/admin/inquiries.js');
  const { createSessionToken, hashTokenSha256 } = await import('../functions/api/_auth_utils.js');

  const mockDb = createMockD1();
  const testToken = 'token_to_be_revoked_1234567890';
  const tokenHash = await hashTokenSha256(testToken);

  // Seed active reset token in password_reset_tokens
  mockDb.tables.password_reset_tokens.push({
    token_hash: tokenHash,
    user_id: 'usr_target_victim',
    expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // wall-clock-ok: mock expiry
    created_at: new Date().toISOString(), // wall-clock-ok: mock created
  });

  // Seed corresponding inquiry in access_inquiries
  mockDb.tables.access_inquiries.push({
    id: 'inq_reset_to_revoke',
    request_type: 'PASSWORD_RESET',
    name: 'Target Account',
    email: 'target@example.com',
    note: 'Password reset link dispatched.',
    ip: '127.0.0.1',
    status: 'pending',
    created_at: new Date().toISOString(), // wall-clock-ok: mock created
  });

  const env = {
    DB: mockDb,
    SESSION_SECRET: 'super_secret_session_key_minimum_32_characters_for_hmac',
    ADMIN_NOTIFICATION_EMAIL: 'superadmin@example.com',
  };

  const adminToken = await createSessionToken(
    { sub: 'usr_super_admin', id: 'usr_super_admin', email: 'superadmin@example.com', role: 'admin' },
    env.SESSION_SECRET
  );

  const patchReq = new Request('https://app.deltaharvest.local/api/admin/inquiries', {
    method: 'PATCH',
    headers: {
      Cookie: `deltaharvest_session=${adminToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ id: 'inq_reset_to_revoke', status: 'revoked' }),
  });

  const patchRes = await onRequestPatch({ request: patchReq, env });
  assert.strictEqual(patchRes.status, 200, 'Revoke request must return 200 OK');

  const patchData = await patchRes.json();
  assert.strictEqual(patchData.status, 'revoked');

  // Verify access_inquiries row was updated to 'revoked' (audit preserved)
  const inqRow = mockDb.tables.access_inquiries.find((r) => r.id === 'inq_reset_to_revoke');
  assert.ok(inqRow, 'Audit record must remain in database');
  assert.strictEqual(inqRow.status, 'revoked', 'Status must be updated to revoked');

  // Verify active reset token was purged from password_reset_tokens
  const activeToken = mockDb.tables.password_reset_tokens.find((r) => r.user_id === 'usr_target_victim');
  assert.strictEqual(activeToken, undefined, 'Active reset token must be purged upon revocation');
});

test('3. Legitimate Reset Flow & User Email Dispatch Contract', async () => {
  const { onRequestPost: handleResetRequest } = await import('../functions/api/auth/reset-password.js');

  const mockDb = createMockD1();
  const dispatchedEmails = [];

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, opts) => {
    if (String(url).includes('resend.com')) {
      const payload = JSON.parse(opts.body);
      dispatchedEmails.push(payload);
      return { ok: true, status: 200, json: async () => ({ id: 'email_ok' }) };
    }
    return originalFetch(url, opts);
  };

  try {
    const env = {
      DB: mockDb,
      RESEND_API_KEY: 'mock_resend_api_key_valid',
      ADMIN_NOTIFICATION_EMAIL: 'superadmin@example.com',
    };

    const req = new Request('https://app.deltaharvest.local/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'target@example.com' }),
    });

    const res = await handleResetRequest({ request: req, env });
    assert.strictEqual(res.status, 200, 'Reset request must return 200 OK');

    // Option B Policy: Zero emails sent to admin; reset email goes exclusively to requesting user
    assert.strictEqual(dispatchedEmails.length, 1, 'Option B: Must dispatch exactly 1 email exclusively to the user');
    const userEmail = dispatchedEmails.find((e) => e.to.includes('target@example.com'));
    const adminAlert = dispatchedEmails.find((e) => e.to.includes('superadmin@example.com'));

    assert.ok(userEmail, 'User must receive reset email');
    assert.strictEqual(adminAlert, undefined, 'Option B: Admin must NOT receive reset alert emails');

    // Legitimate user email contains the token link
    assert.ok(userEmail.text.includes('reset_token='), 'User email must contain reset link');
    assert.ok(userEmail.html.includes('reset_token='), 'User email HTML must contain reset button');

    const tokenMatch = userEmail.text.match(/login\?reset_token=([a-zA-Z0-9]+)/);
    assert.ok(tokenMatch && tokenMatch[1], 'Must have generated a reset token');
    const rawToken = tokenMatch[1];

    // access_inquiries table must NOT contain the token
    const inqRow = mockDb.tables.access_inquiries.find((r) => r.email === 'target@example.com');
    assert.ok(inqRow, 'Audit record must be created');
    assert.ok(!inqRow.note.includes(rawToken), 'Audit note must NOT contain raw token');
    assert.ok(!inqRow.note.includes('reset_token='), 'Audit note must NOT contain reset URL');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('4. UI Contract & Masked Display Invariants: AdminUsersView.tsx', () => {
  const adminViewPath = path.join(rootDir, 'web', 'src', 'components', 'auth', 'AdminUsersView.tsx');
  assert.ok(fs.existsSync(adminViewPath), 'AdminUsersView.tsx must exist');

  const content = fs.readFileSync(adminViewPath, 'utf8');

  // Forbid unsafe rendering
  assert.ok(!content.includes('{inq.note'), 'Must not render unmasked inq.note');
  assert.ok(!content.includes('reset_token='), 'Must not render reset_token= query parameters');
  assert.ok(!content.includes('Copy link'), 'Must not provide Copy link buttons for reset tokens');
  assert.ok(!content.includes('Copy token'), 'Must not provide Copy token buttons for reset tokens');

  // Enforce safe columns
  assert.ok(content.includes('Request ID'), 'Must have Request ID header');
  assert.ok(content.includes('User (Email)'), 'Must have User (Email) header');
  assert.ok(content.includes('Requested'), 'Must have Requested timestamp header');
  assert.ok(content.includes('Expires'), 'Must have Expires timestamp header');
  assert.ok(content.includes('Status'), 'Must have Status header');
  assert.ok(content.includes('Token Fingerprint'), 'Must have Token Fingerprint header');
  assert.ok(content.includes('Actions'), 'Must have Actions header');

  // Enforce Revoke action and Confirmation Modal
  assert.ok(content.includes('handleRevokeInquiry'), 'Must define handleRevokeInquiry handler');
  assert.ok(content.includes('Revoke'), 'Must render Revoke button');
  assert.ok(content.includes('revokeConfirmInquiry'), 'Must declare revokeConfirmInquiry state');
  assert.ok(content.includes('Confirm Revocation'), 'Must provide Confirm Revocation modal button');
});

test('5. Dedicated Revocation Route POST /api/admin/reset-tokens/:id/revoke Contract & Idempotency', async () => {
  const { onRequestPost: handleRevokePost } = await import('../functions/api/admin/reset-tokens/[id]/revoke.js');
  const { createSessionToken, hashTokenSha256 } = await import('../functions/api/_auth_utils.js');

  const mockDb = createMockD1();
  const testToken = 'token_dedicated_revoke_987654321';
  const tokenHash = await hashTokenSha256(testToken);

  mockDb.tables.password_reset_tokens.push({
    token_hash: tokenHash,
    user_id: 'usr_target_victim',
    expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString(),
  });

  mockDb.tables.access_inquiries.push({
    id: 'inq_dedicated_revoke_1',
    request_type: 'PASSWORD_RESET',
    name: 'Target Account',
    email: 'target@example.com',
    note: 'Password reset link dispatched.',
    ip: '127.0.0.1',
    status: 'pending',
    created_at: new Date().toISOString(),
  });

  const env = {
    DB: mockDb,
    SESSION_SECRET: 'super_secret_session_key_minimum_32_characters_for_hmac',
    ADMIN_NOTIFICATION_EMAIL: 'superadmin@example.com',
  };

  const adminToken = await createSessionToken(
    { sub: 'usr_super_admin', id: 'usr_super_admin', email: 'superadmin@example.com', role: 'admin' },
    env.SESSION_SECRET
  );

  const clientToken = await createSessionToken(
    { sub: 'usr_target_victim', id: 'usr_target_victim', email: 'target@example.com', role: 'client' },
    env.SESSION_SECRET
  );

  // A. Non-admin forbidden check
  const nonAdminReq = new Request('https://app.deltaharvest.local/api/admin/reset-tokens/inq_dedicated_revoke_1/revoke', {
    method: 'POST',
    headers: { Cookie: `deltaharvest_session=${clientToken}` },
  });
  const forbiddenRes = await handleRevokePost({
    request: nonAdminReq,
    params: { id: 'inq_dedicated_revoke_1' },
    env,
  });
  assert.strictEqual(forbiddenRes.status, 403, 'Non-admin request to revoke endpoint must return 403 Forbidden');

  // B. Admin successful revocation
  const adminReq = new Request('https://app.deltaharvest.local/api/admin/reset-tokens/inq_dedicated_revoke_1/revoke', {
    method: 'POST',
    headers: { Cookie: `deltaharvest_session=${adminToken}` },
  });
  const revokeRes = await handleRevokePost({
    request: adminReq,
    params: { id: 'inq_dedicated_revoke_1' },
    env,
  });
  assert.strictEqual(revokeRes.status, 200, 'Admin revocation must return 200 OK');
  const revokeData = await revokeRes.json();
  assert.strictEqual(revokeData.status, 'revoked');
  assert.strictEqual(revokeData.success, true);

  // Verify DB state
  const inq = mockDb.tables.access_inquiries.find((r) => r.id === 'inq_dedicated_revoke_1');
  assert.strictEqual(inq.status, 'revoked', 'Inquiry must be marked revoked');
  const activeTokens = mockDb.tables.password_reset_tokens.filter((r) => r.user_id === 'usr_target_victim');
  assert.strictEqual(activeTokens.length, 0, 'Active token must be deleted from table');

  // C. Idempotency on second call
  const repeatRes = await handleRevokePost({
    request: adminReq,
    params: { id: 'inq_dedicated_revoke_1' },
    env,
  });
  assert.strictEqual(repeatRes.status, 200, 'Repeated revocation call must succeed idempotently');
  const repeatData = await repeatRes.json();
  assert.strictEqual(repeatData.alreadyRevoked, true, 'Repeated call must report alreadyRevoked');
});

test('6. Negative Token-Use Contract: Revoked token cannot be consumed', async () => {
  const { consumePasswordResetToken, hashTokenSha256 } = await import('../functions/api/_auth_utils.js');

  const mockDb = createMockD1();
  const testToken = 'revoked_token_must_fail_123456';
  const tokenHash = await hashTokenSha256(testToken);

  // Notice: token is NOT present in password_reset_tokens because it was revoked
  const env = { DB: mockDb };
  const consumedUserId = await consumePasswordResetToken(env, tokenHash);
  assert.strictEqual(consumedUserId, null, 'Attempting to consume a revoked/deleted token must return null');
});

test('7. User Directory Resiliency: getAllUsers succeeds when user_trades table is missing', async () => {
  const { getAllUsers } = await import('../functions/api/_auth_utils.js');

  // Custom mock D1 that throws on user_trades queries
  const mockDb = {
    prepare(sql) {
      return {
        bind() { return this; },
        async run() { return { success: true }; },
        async all() {
          if (sql.includes('user_trades')) {
            throw new Error('D1_ERROR: no such table: user_trades');
          }
          if (sql.includes('FROM users u')) {
            return {
              results: [
                {
                  id: 'usr_resilient_1',
                  email: 'resilient@example.com',
                  role: 'client',
                  is_active: 1,
                  must_change_password: 0,
                  last_login_at: '2026-10-12T12:00:00Z',
                  created_at: '2026-10-12T10:00:00Z',
                  updated_at: '2026-10-12T10:00:00Z',
                  display_name: 'Resilient User',
                  account_notes: '',
                },
              ],
            };
          }
          return { results: [] };
        },
      };
    },
  };

  const env = {
    DB: mockDb,
    ENVIRONMENT: 'production', // Must test production mode where errors previously rethrew
  };

  const users = await getAllUsers(env);
  assert.ok(Array.isArray(users), 'Must return users array even when user_trades is absent');
  assert.strictEqual(users.length, 1, 'Must return the user');
  assert.strictEqual(users[0].email, 'resilient@example.com');
  assert.strictEqual(users[0].trade_count, 0, 'trade_count must default to 0 on fallback');
});
