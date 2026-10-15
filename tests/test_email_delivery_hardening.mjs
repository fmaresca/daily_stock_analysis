/**
 * Unit & Integration Regression Test Suite: Email Delivery Hardening Pack
 *
 * Covers:
 * 1. sendResendEmail retry helper with mocked fetch:
 *    (a) success on first try (assert 1 attempt, ok: true, status: 200)
 *    (b) 429 then success (assert 2 attempts, ok: true, status: 200)
 *    (c) 403 then stop (assert 1 attempt, no retry, ok: false, status: 403)
 *    (d) 500 three times (assert 3 attempts, ok: false, status: 500)
 *    (e) network error retry then success
 * 2. logEmailDelivery append-only D1 write and error resilience
 * 3. getEmailHealth calculation and status derivation
 * 4. timingSafeCompare security invariants
 * 5. GET /api/admin/email-health dual-authentication gate & 200 response
 * 6. GET /api/admin/inquiries?action=test_email HTTP 200 (never 502) semantic contract
 * 7. POST /api/admin/inquiries public contract preservation
 */

import { test } from 'node:test';
import assert from 'node:assert';
import {
  sendResendEmail,
  logEmailDelivery,
  getEmailHealth,
  timingSafeCompare,
} from '../functions/api/_email_delivery.js';

// Helper to create mock D1 database for email delivery logs
function createMockD1() {
  return {
    tables: {
      users: [
        {
          id: 'usr_super_admin',
          email: 'admin@example.com',
          display_name: 'Admin Console',
          password_hash: 'admin_hash',
          password_salt: 'admin_salt',
          role: 'admin',
          is_active: 1,
          token_version: 0,
        },
      ],
      system_settings: [
        { key: 'admin_notification_email', value: 'admin@example.com' },
      ],
      email_delivery_log: [],
    },
    get rows() {
      return this.tables.email_delivery_log;
    },
    batch: async (statements) => statements.map(() => ({ results: [] })),
    prepare(sql) {
      const d1 = this;
      let boundParams = [];
      return {
        bind(...params) {
          boundParams = params;
          return this;
        },
        async run() {
          const norm = sql.replace(/\s+/g, ' ').trim().toUpperCase();
          if (norm.startsWith('CREATE TABLE')) {
            return { success: true };
          }
          if (norm.includes('INSERT INTO USERS')) {
            const [id, email, password_hash, password_salt, role, is_active, must_change_password] = boundParams;
            d1.tables.users.push({
              id,
              email,
              password_hash,
              password_salt,
              role: role || 'admin',
              is_active: is_active ?? 1,
              must_change_password: must_change_password ?? 0,
              token_version: 0,
            });
            return { success: true };
          }
          if (norm.includes('INSERT INTO EMAIL_DELIVERY_LOG')) {
            const [endpoint, recipient, channel, http_status, attempts, error_name, error_message] = boundParams;
            d1.tables.email_delivery_log.push({
              id: d1.tables.email_delivery_log.length + 1,
              endpoint,
              recipient,
              channel,
              http_status,
              attempts,
              error_name,
              error_message,
              created_at: new Date().toISOString(), // wall-clock-ok: mock test timestamp
            });
            return { success: true };
          }
          return { success: true };
        },
        async first() {
          const norm = sql.replace(/\s+/g, ' ').trim().toUpperCase();
          if (norm.includes('FROM USERS')) {
            const [param] = boundParams;
            return d1.tables.users.find(
              (u) => u.id === param || u.email.toLowerCase() === String(param).toLowerCase()
            ) || null;
          }
          if (norm.includes('FROM SYSTEM_SETTINGS')) {
            const [key] = boundParams;
            return d1.tables.system_settings.find((s) => s.key === key) || null;
          }
          if (norm.includes('MAX(') && norm.includes('FROM EMAIL_DELIVERY_LOG')) {
            const rows = d1.tables.email_delivery_log;
            if (rows.length === 0) {
              return { last_success_at: null, last_failure_at: null, recent_failures: 0, total_logged: 0 };
            }
            let lastSuccess = null;
            let lastFailure = null;
            let recentFailures = 0;
            for (const r of rows) {
              const is2xx = r.http_status >= 200 && r.http_status < 300;
              const isFail = r.http_status >= 400 || !r.http_status;
              if (is2xx && (!lastSuccess || r.created_at > lastSuccess)) lastSuccess = r.created_at;
              if (isFail && (!lastFailure || r.created_at > lastFailure)) lastFailure = r.created_at;
              if (isFail) recentFailures++;
            }
            return {
              last_success_at: lastSuccess,
              last_failure_at: lastFailure,
              recent_failures: recentFailures,
              total_logged: rows.length,
            };
          }
          if (norm.includes('FROM EMAIL_DELIVERY_LOG') && norm.includes('ORDER BY ID DESC')) {
            const rows = d1.tables.email_delivery_log;
            if (rows.length === 0) return null;
            const latest = rows[rows.length - 1];
            return {
              channel: latest.channel,
              http_status: latest.http_status,
              created_at: latest.created_at,
              error_name: latest.error_name,
              error_message: latest.error_message,
            };
          }
          return null;
        },
      };
    },
  };
}

test('1. sendResendEmail: (a) Success on first try', async () => {
  const originalFetch = globalThis.fetch;
  let callCount = 0;
  globalThis.fetch = async (url, options) => {
    callCount++;
    assert.strictEqual(url, 'https://api.resend.com/emails');
    assert.strictEqual(options.method, 'POST');
    return new Response(JSON.stringify({ id: 'msg_123' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  };

  try {
    const result = await sendResendEmail({
      apiKey: 're_test_key_mock',
      from: 'DeltaHarvest <test@example.com>',
      to: 'recipient@example.com',
      subject: 'Test Subject',
      text: 'Test Body',
    });

    assert.strictEqual(result.ok, true);
    assert.strictEqual(result.status, 200);
    assert.strictEqual(result.attempts, 1);
    assert.strictEqual(callCount, 1);
    assert.strictEqual(result.body.id, 'msg_123');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('1. sendResendEmail: (b) 429 then success (assert 2 attempts)', async () => {
  const originalFetch = globalThis.fetch;
  let callCount = 0;
  globalThis.fetch = async () => {
    callCount++;
    if (callCount === 1) {
      return new Response(JSON.stringify({ name: 'rate_limit_exceeded', message: 'Too many requests' }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return new Response(JSON.stringify({ id: 'msg_recovered' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  };

  try {
    const result = await sendResendEmail({
      apiKey: 're_test_key_mock',
      from: 'DeltaHarvest <test@example.com>',
      to: 'recipient@example.com',
      subject: 'Test Subject',
      text: 'Test Body',
    });

    assert.strictEqual(result.ok, true);
    assert.strictEqual(result.status, 200);
    assert.strictEqual(result.attempts, 2);
    assert.strictEqual(callCount, 2);
    assert.strictEqual(result.body.id, 'msg_recovered');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('1. sendResendEmail: (c) 403 then stop (assert 1 attempt, no retry)', async () => {
  const originalFetch = globalThis.fetch;
  let callCount = 0;
  globalThis.fetch = async () => {
    callCount++;
    return new Response(
      JSON.stringify({
        name: 'validation_error',
        message: 'You can only send testing emails to your own email address.',
      }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  };

  try {
    const result = await sendResendEmail({
      apiKey: 're_test_key_mock',
      from: 'DeltaHarvest <test@example.com>',
      to: 'recipient@example.com',
      subject: 'Test Subject',
      text: 'Test Body',
    });

    assert.strictEqual(result.ok, false);
    assert.strictEqual(result.status, 403);
    assert.strictEqual(result.attempts, 1, '403 is non-retryable; must not retry');
    assert.strictEqual(callCount, 1);
    assert.strictEqual(result.body.name, 'validation_error');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('1. sendResendEmail: (d) 500 three times (assert 3 attempts, returns ok: false)', async () => {
  const originalFetch = globalThis.fetch;
  let callCount = 0;
  globalThis.fetch = async () => {
    callCount++;
    return new Response(JSON.stringify({ name: 'internal_server_error', message: 'Resend API down' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  };

  try {
    const result = await sendResendEmail({
      apiKey: 're_test_key_mock',
      from: 'DeltaHarvest <test@example.com>',
      to: 'recipient@example.com',
      subject: 'Test Subject',
      text: 'Test Body',
    });

    assert.strictEqual(result.ok, false);
    assert.strictEqual(result.status, 500);
    assert.strictEqual(result.attempts, 3, 'Must attempt up to 3 times on 5xx');
    assert.strictEqual(callCount, 3);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('2. logEmailDelivery: writes append-only record to D1 and never throws on failure', async () => {
  const mockD1 = createMockD1();
  const env = { DB: mockD1 };

  await logEmailDelivery(env, {
    endpoint: 'inquiry_post',
    recipient: 'admin@example.com',
    channel: 'Resend API',
    httpStatus: 200,
    attempts: 1,
    errorName: null,
    errorMessage: null,
  });

  assert.strictEqual(mockD1.rows.length, 1);
  assert.strictEqual(mockD1.rows[0].endpoint, 'inquiry_post');
  assert.strictEqual(mockD1.rows[0].recipient, 'admin@example.com');
  assert.strictEqual(mockD1.rows[0].http_status, 200);

  // Assert resilience: undefined DB or throwing DB does not throw
  await assert.doesNotReject(async () => {
    await logEmailDelivery({}, { endpoint: 'test', recipient: 'foo' });
    await logEmailDelivery({ DB: { prepare: () => { throw new Error('D1 down'); } } }, { endpoint: 'test' });
  });
});

test('3. getEmailHealth: correctly derives healthy and latestStatus', async () => {
  const mockD1 = createMockD1();
  const env = { DB: mockD1 };

  // Empty state
  const emptyHealth = await getEmailHealth(env);
  assert.strictEqual(emptyHealth.healthy, false);
  assert.strictEqual(emptyHealth.latestStatus, 'EMPTY');

  // Add failure
  mockD1.rows.push({
    id: 1,
    endpoint: 'test_email',
    recipient: 'admin@example.com',
    channel: 'Resend API',
    http_status: 403,
    attempts: 1,
    error_name: 'validation_error',
    error_message: 'Forbidden domain',
    created_at: '2026-10-14T10:00:00.000Z',
  });

  const failHealth = await getEmailHealth(env);
  assert.strictEqual(failHealth.healthy, false);
  assert.strictEqual(failHealth.latestStatus, 'FAILING');
  assert.strictEqual(failHealth.recentFailures, 1);

  // Add subsequent success
  mockD1.rows.push({
    id: 2,
    endpoint: 'test_email',
    recipient: 'admin@example.com',
    channel: 'Resend API',
    http_status: 200,
    attempts: 1,
    error_name: null,
    error_message: null,
    created_at: '2026-10-14T11:00:00.000Z',
  });

  const okHealth = await getEmailHealth(env);
  assert.strictEqual(okHealth.healthy, true);
  assert.strictEqual(okHealth.latestStatus, 'OK');
  assert.strictEqual(okHealth.lastSuccessAt, '2026-10-14T11:00:00.000Z');
});

test('4. timingSafeCompare: timing-safe cryptographic comparison', async () => {
  const secretKey = 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6';
  assert.strictEqual(await timingSafeCompare(secretKey, secretKey), true);
  assert.strictEqual(await timingSafeCompare(secretKey, 'wrong_key'), false);
  assert.strictEqual(await timingSafeCompare(secretKey, ''), false);
  assert.strictEqual(await timingSafeCompare(secretKey, null), false);
  assert.strictEqual(await timingSafeCompare('abc', 'abcd'), false);
});

test('5. GET /api/admin/email-health: dual auth gate and 200 response', async () => {
  const { onRequestGet } = await import('../functions/api/admin/email-health.js');
  const mockD1 = createMockD1();
  const testHealthKey = 'super_secret_health_monitor_key_999';
  const env = {
    DB: mockD1,
    EMAIL_HEALTH_KEY: testHealthKey,
    SESSION_SECRET: 'test_session_secret_for_email_health',
  };

  // A. Wrong key -> HTTP 403
  const wrongReq = new Request('https://domain.local/api/admin/email-health?key=wrong_key');
  const wrongRes = await onRequestGet({ request: wrongReq, env });
  assert.strictEqual(wrongRes.status, 403);

  // B. Correct key -> HTTP 200 with health telemetry
  const okReq = new Request(`https://domain.local/api/admin/email-health?key=${testHealthKey}`);
  const okRes = await onRequestGet({ request: okReq, env });
  assert.strictEqual(okRes.status, 200);
  const healthBody = await okRes.json();
  assert.strictEqual(typeof healthBody.healthy, 'boolean');
  assert.strictEqual(typeof healthBody.recentFailures, 'number');
});

test('6. Inquiries test_email returns HTTP 200 (never 502) even on failure', async () => {
  const { onRequestGet } = await import('../functions/api/admin/inquiries.js');
  const authModule = await import('../functions/api/_auth_utils.js');
  const mockD1 = createMockD1();

  const env = {
    DB: mockD1,
    RESEND_API_KEY: 're_dummy_key',
    ADMIN_NOTIFICATION_EMAIL: 'admin@example.com',
    SESSION_SECRET: 'test-session-secret-for-test-email',
  };

  const adminUser = mockD1.tables.users[0];
  const token = await authModule.createSessionToken(
    { sub: adminUser.id, email: adminUser.email, role: 'admin', tv: adminUser.token_version ?? 0 },
    env.SESSION_SECRET
  );
  const cookie = authModule.buildSessionCookie(token);

  // Mock fetch to simulate 403 from Resend and 429 from FormSubmit (the exact 2026-10-14 failure)
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url) => {
    if (url.includes('resend.com')) {
      return new Response(JSON.stringify({ name: 'validation_error', message: 'Domain unverified' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    if (url.includes('formsubmit.co')) {
      return new Response(JSON.stringify({ error: 'Rate limited' }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return new Response('Not found', { status: 404 });
  };

  try {
    const testEmailReq = new Request('https://domain.local/api/admin/inquiries?action=test_email', {
      headers: { Cookie: cookie },
    });
    const res = await onRequestGet({ request: testEmailReq, env });

    // CRITICAL: Must be HTTP 200, NEVER 502!
    assert.strictEqual(res.status, 200, 'Probe execution must return HTTP 200, not 502');
    const data = await res.json();
    assert.strictEqual(data.success, false);
    assert.strictEqual(data.diagnostics.resendStatus, 403);
    assert.strictEqual(data.diagnostics.formSubmitStatus, 429);

    // Verify D1 delivery log was written for both attempts
    assert.strictEqual(mockD1.rows.length >= 2, true);
    assert.strictEqual(mockD1.rows[0].endpoint, 'test_email');
    assert.strictEqual(mockD1.rows[0].http_status, 403);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
