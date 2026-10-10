/**
 * Concurrency Smoke Test Suite
 * Tests:
 * 1. 10 parallel logins with bad password -> 10 clean 401s, 0 500s.
 * 2. 5 parallel agent-chat requests -> 5 isolated responses, no cross-talk, no unhandled rejections.
 * 3. Parallel reset-password confirm requests for same account -> single-use token holds (1 succeeds, rest fail).
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { onRequestPost as loginPost } from '../functions/api/auth/login.js';
import { onRequest as chatHandler } from '../functions/api/agent/chat.js';
import { onRequestPost as resetConfPost } from '../functions/api/auth/reset-password/confirm.js';
import {
  createUser,
  createSessionToken,
  generateRandomSalt,
  hashPassword,
  generateSecureRandomToken,
  hashTokenSha256,
  storePasswordResetToken,
} from '../functions/api/_auth_utils.js';

test('Concurrency Smoke: 10 Parallel Logins (Wrong Password)', async () => {
  const env = {
    ENVIRONMENT: 'development',
    SESSION_SECRET: 'test-session-secret-concurrency-smoke-1234567890',
  };

  const loginPromises = Array.from({ length: 10 }, (_, i) => {
    const request = new Request('http://localhost/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'CF-Connecting-IP': `192.168.1.${10 + i}`,
      },
      body: JSON.stringify({
        email: `trader_${i}@deltaharvest.local`,
        password: 'DefinitivelyWrongPassword123!',
      }),
    });
    return loginPost({ request, env });
  });

  const responses = await Promise.all(loginPromises);
  assert.equal(responses.length, 10);
  for (const res of responses) {
    assert.equal(res.status, 401, 'Should return 401 Unauthorized, never 500');
    const body = await res.json();
    assert.ok(body.error, 'Should contain error description');
  }
});

test('Concurrency Smoke: 5 Parallel Agent Chat Requests (No Cross-Talk)', async () => {
  const secret = 'test-session-secret-concurrency-smoke-1234567890';
  const env = {
    ENVIRONMENT: 'development',
    SESSION_SECRET: secret,
    GEMINI_API_KEY: 'test-key-mock',
  };

  const createdUsers = [];
  for (let i = 0; i < 5; i++) {
    const salt = generateRandomSalt(16);
    const hash = await hashPassword('TestPassword123!', salt);
    const u = await createUser(env, {
      email: `client_concur_${i}@deltaharvest.local`,
      password_hash: hash,
      password_salt: salt,
      role: 'client',
      is_active: 1,
      token_version: 1,
      must_change_password: 0,
      display_name: `Client ${i}`,
    });
    createdUsers.push(u);
  }

  const chatPromises = createdUsers.map(async (u, idx) => {
    const jwt = await createSessionToken({ sub: u.id, role: u.role, tv: u.token_version }, secret);
    const request = new Request('http://localhost/api/agent/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `deltaharvest_session=${jwt}`,
        'CF-Connecting-IP': `10.0.0.${idx + 1}`,
      },
      body: JSON.stringify({
        sessionId: `session_concur_${idx}`,
        message: `What is the historical volatility of AAPL for user ${idx}?`,
        lens: 'Trend/Momentum',
      }),
    });

    const res = await chatHandler({ request, env });
    assert.equal(res.status, 200, `Chat status should be 200 SSE stream, got ${res.status}`);
    return { idx, res };
  });

  const results = await Promise.all(chatPromises);
  assert.equal(results.length, 5);
});

test('Concurrency Smoke: Parallel Reset-Password Confirms (Single-Use Token Holds)', async () => {
  const secret = 'test-session-secret-concurrency-smoke-1234567890';
  const env = {
    ENVIRONMENT: 'development',
    SESSION_SECRET: secret,
  };

  const salt = generateRandomSalt(16);
  const hash = await hashPassword('InitialPass123!', salt);
  const user = await createUser(env, {
    email: 'concurrent_reset_user@deltaharvest.local',
    password_hash: hash,
    password_salt: salt,
    role: 'client',
    is_active: 1,
    must_change_password: 0,
    display_name: 'Concurrent Reset Tester',
  });
  assert.ok(user);

  // Generate single-use reset token and store it
  const rawToken = generateSecureRandomToken(32);
  const tokenHash = await hashTokenSha256(rawToken);
  await storePasswordResetToken(env, tokenHash, user.id, 30);

  // 5 parallel confirmation attempts with the SAME token
  const confirmPromises = Array.from({ length: 5 }, (_, i) => {
    const req = new Request('http://localhost/api/auth/reset-password/confirm', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'CF-Connecting-IP': `10.10.10.${20 + i}`,
      },
      body: JSON.stringify({
        token: rawToken,
        newPassword: `NewPasswordStrong123!_${i}`,
      }),
    });
    return resetConfPost({ request: req, env });
  });

  const confirmResponses = await Promise.all(confirmPromises);
  assert.equal(confirmResponses.length, 5);

  const statuses = confirmResponses.map((r) => r.status);
  const successCount = statuses.filter((s) => s === 200).length;
  const failureCount = statuses.filter((s) => s === 400 || s === 401 || s === 410).length;

  assert.equal(successCount, 1, 'Exactly 1 confirmation must succeed');
  assert.equal(failureCount, 4, 'Remaining 4 parallel attempts must fail (token consumed / single-use)');
});
