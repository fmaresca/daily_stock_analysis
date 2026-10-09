/**
 * Comprehensive Mocked API Contract Test Suite
 * ==============================================
 * Verifies all 31 endpoints in docs/FUNCTIONALITY_REGISTRY.md (A001 - A031):
 * - Correct status codes on valid inputs
 * - Auth rejection (401/403, never 500) for unauthenticated/unauthorized calls on protected routes
 * - Validation errors (400) on malformed inputs
 * - Safe JSON response schemas and fail-closed security guarantees
 *
 * All external dependencies (D1, KV, Resend, LLM providers, Market APIs) are mocked.
 * Zero real secrets or live network keys used.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

// Global cache stub for Cloudflare Edge environment in Node
if (!globalThis.caches) {
  globalThis.caches = {
    default: {
      match: async () => null,
      put: async () => {},
    },
  };
}

// Reusable mock D1 Database
function createMockDb(overrides = {}) {
  return {
    prepare: (query) => {
      return {
        bind: (...args) => ({
          run: async () => overrides.run ? overrides.run(query, args) : { success: true },
          first: async () => overrides.first ? overrides.first(query, args) : null,
          all: async () => overrides.all ? overrides.all(query, args) : { results: [] },
        }),
        run: async () => overrides.run ? overrides.run(query, []) : { success: true },
        first: async () => overrides.first ? overrides.first(query, []) : null,
        all: async () => overrides.all ? overrides.all(query, []) : { results: [] },
      };
    },
    batch: async (statements) => {
      return statements.map(() => ({ results: [] }));
    },
  };
}

const mockEnv = {
  ENVIRONMENT: 'test',
  SESSION_SECRET: 'test_mock_secret_key_with_at_least_32_characters_for_hmac!',
  DB: createMockDb(),
};

test('API Contracts: A001 - POST /api/auth/login', async () => {
  const loginModule = await import('../functions/api/auth/login.js');
  
  // 1. Missing credentials -> 400
  const reqEmpty = new Request('http://localhost/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  const resEmpty = await loginModule.onRequestPost({ request: reqEmpty, env: mockEnv });
  assert.strictEqual(resEmpty.status, 400, 'Empty login body should return 400');

  // 2. Invalid credentials -> 401
  const reqBad = new Request('http://localhost/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'unknown@example.com', password: 'wrongpassword' }),
  });
  const resBad = await loginModule.onRequestPost({ request: reqBad, env: mockEnv });
  assert.strictEqual(resBad.status, 401, 'Invalid credentials should return 401');
});

test('API Contracts: A002 - POST /api/auth/logout', async () => {
  const logoutModule = await import('../functions/api/auth/logout.js');
  const req = new Request('http://localhost/api/auth/logout', { method: 'POST' });
  const res = await logoutModule.onRequestPost({ request: req, env: mockEnv });
  assert.strictEqual(res.status, 200, 'Logout must return 200 OK');
  const body = await res.json();
  assert.strictEqual(body.success, true);
  const setCookie = res.headers.get('Set-Cookie');
  assert.ok(setCookie && setCookie.includes('Max-Age=0'), 'Must clear session cookie');
});

test('API Contracts: A003 - GET /api/auth/session', async () => {
  const sessionModule = await import('../functions/api/auth/session.js');
  // Unauthenticated -> 200 with authenticated: false (safe SPA session probe)
  const reqUnauth = new Request('http://localhost/api/auth/session', { method: 'GET' });
  const resUnauth = await sessionModule.onRequestGet({ request: reqUnauth, env: mockEnv });
  assert.strictEqual(resUnauth.status, 200, 'Unauthenticated session probe returns 200');
  const body = await resUnauth.json();
  assert.strictEqual(body.authenticated, false);
  assert.strictEqual(body.user, null);
});

test('API Contracts: A004 - POST /api/auth/request-access', async () => {
  const reqAccessModule = await import('../functions/api/auth/request-access.js');
  // 1. Invalid email -> 400
  const reqBad = new Request('http://localhost/api/auth/request-access', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'invalid-email', name: 'Test' }),
  });
  const resBad = await reqAccessModule.onRequestPost({ request: reqBad, env: mockEnv });
  assert.strictEqual(resBad.status, 400, 'Malformed email should return 400');

  // 2. Valid email -> 200
  const reqGood = new Request('http://localhost/api/auth/request-access', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'newuser@example.com', name: 'John Doe', organization: 'Fund' }),
  });
  const resGood = await reqAccessModule.onRequestPost({ request: reqGood, env: mockEnv });
  assert.strictEqual(resGood.status, 200, 'Valid request-access should return 200');
});

test('API Contracts: A005 - POST /api/auth/reset-password', async () => {
  const resetModule = await import('../functions/api/auth/reset-password.js');
  // 1. Invalid email -> 400
  const reqBad = new Request('http://localhost/api/auth/reset-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'not-an-email' }),
  });
  const resBad = await resetModule.onRequestPost({ request: reqBad, env: mockEnv });
  assert.strictEqual(resBad.status, 400, 'Invalid email should return 400');

  // 2. Valid email -> 200 anti-enumeration response
  const reqGood = new Request('http://localhost/api/auth/reset-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'someone@example.com' }),
  });
  const resGood = await resetModule.onRequestPost({ request: reqGood, env: mockEnv });
  assert.strictEqual(resGood.status, 200, 'Reset request must return 200');
  const body = await resGood.json();
  assert.strictEqual(body.success, true);
});

test('API Contracts: A006 - POST /api/auth/reset-password/confirm', async () => {
  const confirmModule = await import('../functions/api/auth/reset-password/confirm.js');
  // Missing token/password -> 400
  const reqBad = new Request('http://localhost/api/auth/reset-password/confirm', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: '', new_password: '' }),
  });
  const resBad = await confirmModule.onRequestPost({ request: reqBad, env: mockEnv });
  assert.strictEqual(resBad.status, 400, 'Empty token or password should return 400');
});

test('API Contracts: A007 - POST /api/auth/change-password', async () => {
  const changeModule = await import('../functions/api/auth/change-password.js');
  const req = new Request('http://localhost/api/auth/change-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ current_password: 'old', new_password: 'new' }),
  });
  const res = await changeModule.onRequestPost({ request: req, env: mockEnv });
  assert.strictEqual(res.status, 401, 'Unauthenticated change-password must return 401');
});

test('API Contracts: A008 - POST /api/user/change-password', async () => {
  const userChangeModule = await import('../functions/api/user/change-password.js');
  const req = new Request('http://localhost/api/user/change-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ currentPassword: 'old', newPassword: 'new' }),
  });
  const res = await userChangeModule.onRequestPost({ request: req, env: mockEnv });
  assert.strictEqual(res.status, 401, 'Unauthenticated user change-password must return 401');
});

test('API Contracts: A009 - GET/POST /api/user/data', async () => {
  const userDataModule = await import('../functions/api/user/data.js');
  const reqGet = new Request('http://localhost/api/user/data', { method: 'GET' });
  const resGet = await userDataModule.onRequestGet({ request: reqGet, env: mockEnv });
  assert.strictEqual(resGet.status, 401, 'Unauthenticated user data GET must return 401');

  const reqPost = new Request('http://localhost/api/user/data', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'sync' }),
  });
  const resPost = await userDataModule.onRequestPost({ request: reqPost, env: mockEnv });
  assert.strictEqual(resPost.status, 401, 'Unauthenticated user data POST must return 401');
});

test('API Contracts: A010 - GET/POST /api/user/digest-preferences', async () => {
  const digestPrefModule = await import('../functions/api/user/digest-preferences.js');
  const reqGet = new Request('http://localhost/api/user/digest-preferences', { method: 'GET' });
  const resGet = await digestPrefModule.onRequest({ request: reqGet, env: mockEnv });
  assert.strictEqual(resGet.status, 401, 'Unauthenticated digest preferences GET must return 401');
});

test('API Contracts: A011 - GET /api/admin/users', async () => {
  const adminUsersModule = await import('../functions/api/admin/users.js');
  const req = new Request('http://localhost/api/admin/users', { method: 'GET' });
  const res = await adminUsersModule.onRequestGet({ request: req, env: mockEnv });
  assert.strictEqual(res.status, 401, 'Unauthenticated admin users GET must return 401');
});

test('API Contracts: A012 - POST /api/admin/users/create', async () => {
  const createModule = await import('../functions/api/admin/users/create.js');
  const req = new Request('http://localhost/api/admin/users/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'new@example.com', role: 'client' }),
  });
  const res = await createModule.onRequestPost({ request: req, env: mockEnv });
  assert.strictEqual(res.status, 401, 'Unauthenticated admin create user must return 401');
});

test('API Contracts: A013 - POST /api/admin/users/toggle-status', async () => {
  const toggleModule = await import('../functions/api/admin/users/toggle-status.js');
  const req = new Request('http://localhost/api/admin/users/toggle-status', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: 'u123', isActive: false }),
  });
  const res = await toggleModule.onRequestPost({ request: req, env: mockEnv });
  assert.strictEqual(res.status, 401, 'Unauthenticated admin toggle-status must return 401');
});

test('API Contracts: A014 - POST /api/admin/users/reset-password', async () => {
  const resetModule = await import('../functions/api/admin/users/reset-password.js');
  const req = new Request('http://localhost/api/admin/users/reset-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: 'u123' }),
  });
  const res = await resetModule.onRequestPost({ request: req, env: mockEnv });
  assert.strictEqual(res.status, 401, 'Unauthenticated admin reset-password must return 401');
});

test('API Contracts: A015 - GET /api/admin/diagnostics', async () => {
  const diagModule = await import('../functions/api/admin/diagnostics.js');
  const req = new Request('http://localhost/api/admin/diagnostics', { method: 'GET' });
  const res = await diagModule.onRequestGet({ request: req, env: mockEnv });
  assert.strictEqual(res.status, 401, 'Unauthenticated admin diagnostics must return 401');
});

test('API Contracts: A016 - GET/POST /api/admin/inquiries', async () => {
  const inqModule = await import('../functions/api/admin/inquiries.js');
  
  // 1. GET inquiries list without admin auth -> 401
  const reqGet = new Request('http://localhost/api/admin/inquiries', { method: 'GET' });
  const resGet = await inqModule.onRequestGet({ request: reqGet, env: mockEnv });
  assert.strictEqual(resGet.status, 401, 'Unauthenticated inquiries GET must return 401');

  // 2. POST inquiry submission (public access request form) -> 200
  const reqPost = new Request('http://localhost/api/admin/inquiries', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      requestType: 'New Account',
      name: 'Tester',
      email: 'test@example.com',
      note: 'Please provide demo access',
    }),
  });
  const resPost = await inqModule.onRequestPost({ request: reqPost, env: mockEnv });
  assert.strictEqual(resPost.status, 200, 'POST inquiry submission should succeed');
});

test('API Contracts: A017 - GET/POST /api/admin/llm-chain-test', async () => {
  const chainModule = await import('../functions/api/admin/llm-chain-test.js');
  const req = new Request('http://localhost/api/admin/llm-chain-test', { method: 'GET' });
  const res = await chainModule.onRequestGet({ request: req, env: mockEnv });
  assert.strictEqual(res.status, 401, 'Unauthenticated LLM chain test must return 401');
});

test('API Contracts: A018 - GET/POST /api/admin/settings', async () => {
  const settingsModule = await import('../functions/api/admin/settings.js');
  const reqGet = new Request('http://localhost/api/admin/settings', { method: 'GET' });
  const resGet = await settingsModule.onRequestGet({ request: reqGet, env: mockEnv });
  assert.strictEqual(resGet.status, 401, 'Unauthenticated admin settings GET must return 401');

  const reqPost = new Request('http://localhost/api/admin/settings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key: 'test', value: 'val' }),
  });
  const resPost = await settingsModule.onRequestPost({ request: reqPost, env: mockEnv });
  assert.strictEqual(resPost.status, 401, 'Unauthenticated admin settings POST must return 401');
});

test('API Contracts: A019 - GET /api/market-price', async () => {
  const priceModule = await import('../functions/api/market-price.js');
  // 1. Missing symbol -> 400
  const reqNoSym = new Request('http://localhost/api/market-price', { method: 'GET' });
  const resNoSym = await priceModule.onRequest({ request: reqNoSym, env: mockEnv });
  assert.strictEqual(resNoSym.status, 400, 'Missing symbol parameter must return 400');

  // 2. Mocked fetch for valid symbol -> 200 with spotPrice
  const origFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    return new Response(JSON.stringify({
      chart: {
        result: [{
          meta: { regularMarketPrice: 150.0, previousClose: 148.0 },
          indicators: { quote: [{ close: [145, 148, 150], volume: [1000, 2000, 3000] }] },
        }],
      },
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  };

  try {
    const reqSym = new Request('http://localhost/api/market-price?symbol=AAPL', { method: 'GET' });
    const resSym = await priceModule.onRequest({ request: reqSym, env: mockEnv });
    assert.strictEqual(resSym.status, 200, 'Valid symbol quote must return 200');
    const body = await resSym.json();
    assert.strictEqual(body.symbol, 'AAPL');
    assert.ok(typeof body.spotPrice === 'number', 'spotPrice must be a number');
  } finally {
    globalThis.fetch = origFetch;
  }
});

test('API Contracts: A020 - GET /api/market-recap', async () => {
  const recapModule = await import('../functions/api/market-recap.js');
  const req = new Request('http://localhost/api/market-recap', { method: 'GET' });
  const res = await recapModule.onRequest({ request: req, env: mockEnv });
  assert.strictEqual(res.status, 200, 'Market recap must return 200');
  const body = await res.json();
  assert.ok(body.indices, 'Recap must include major indices');
  assert.ok(body.sectors, 'Recap must include sector breakdown');
});

test('API Contracts: A021 - GET /api/market-sentiment', async () => {
  const sentModule = await import('../functions/api/market-sentiment.js');
  // 1. Invalid symbol -> 400
  const reqBad = new Request('http://localhost/api/market-sentiment?symbol=TOOLONGSYMBOL', { method: 'GET' });
  const resBad = await sentModule.onRequest({ request: reqBad, env: mockEnv });
  assert.strictEqual(resBad.status, 400, 'Invalid symbol must return 400');

  // 2. Valid symbol (unconfigured Adanos key -> graceful fallback 200 with configured: false)
  const reqGood = new Request('http://localhost/api/market-sentiment?symbol=NVDA', { method: 'GET' });
  const resGood = await sentModule.onRequest({ request: reqGood, env: mockEnv });
  assert.strictEqual(resGood.status, 200, 'Market sentiment must gracefully return 200');
  const body = await resGood.json();
  assert.strictEqual(body.configured, false);
  assert.strictEqual(body.sentiment, null);
});

test('API Contracts: A022 - GET /api/economic-calendar', async () => {
  const econModule = await import('../functions/api/economic-calendar.js');
  const req = new Request('http://localhost/api/economic-calendar', { method: 'GET' });
  const res = await econModule.onRequestGet({ request: req, env: mockEnv });
  assert.strictEqual(res.status, 200, 'Economic calendar must return 200');
  const body = await res.json();
  assert.ok(Array.isArray(body.indicators), 'Economic calendar must return indicators array');
});

test('API Contracts: A023 - GET /api/news/[ticker]', async () => {
  const newsModule = await import('../functions/api/news/[ticker].js');
  // 1. Missing ticker -> 400
  const reqNoTicker = new Request('http://localhost/api/news/', { method: 'GET' });
  const resNoTicker = await newsModule.onRequest({ request: reqNoTicker, params: { ticker: '' }, env: mockEnv });
  assert.strictEqual(resNoTicker.status, 400, 'Missing ticker must return 400');

  // 2. Valid ticker (all fetch sources mock-empty) -> 200
  const origFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response('<?xml version="1.0"?><rss></rss>', { status: 200 });

  try {
    const reqTicker = new Request('http://localhost/api/news/AAPL', { method: 'GET' });
    const resTicker = await newsModule.onRequest({
      request: reqTicker,
      params: { ticker: 'AAPL' },
      env: mockEnv,
      waitUntil: () => {},
    });
    assert.strictEqual(resTicker.status, 200, 'Valid ticker news must return 200');
    const body = await resTicker.json();
    assert.strictEqual(body.ticker, 'AAPL');
    assert.ok(Array.isArray(body.items), 'items must be an array');
  } finally {
    globalThis.fetch = origFetch;
  }
});

test('API Contracts: A024 - POST /api/analyze-options', async () => {
  const analyzeModule = await import('../functions/api/analyze-options.js');
  // 1. Missing LLM key -> 500 configuration message
  const reqNoKey = new Request('http://localhost/api/analyze-options', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ screenerData: 'AAPL,230,0.20' }),
  });
  const resNoKey = await analyzeModule.onRequestPost({ request: reqNoKey, env: {} });
  assert.strictEqual(resNoKey.status, 500, 'Missing LLM key must return 500 configuration guide');

  // 2. Key provided but empty data -> 400
  const reqEmpty = new Request('http://localhost/api/analyze-options', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ screenerData: '' }),
  });
  const resEmpty = await analyzeModule.onRequestPost({ request: reqEmpty, env: { GEMINI_API_KEY: 'mock' } });
  assert.strictEqual(resEmpty.status, 400, 'Empty screener payload must return 400');
});

test('API Contracts: A025 - GET /api/covered-calls', async () => {
  const ccModule = await import('../functions/api/covered-calls.js');
  const req = new Request('http://localhost/api/covered-calls?ticker=AAPL', { method: 'GET' });
  const res = await ccModule.onRequestGet({ request: req, env: mockEnv });
  assert.strictEqual(res.status, 200, 'Covered calls endpoint must return 200');
  const body = await res.json();
  assert.strictEqual(body.underlying.ticker, 'AAPL');
  assert.ok(Array.isArray(body.candidates), 'Must return candidates array');
});

test('API Contracts: A026 - GET/POST /api/options/journal', async () => {
  const journalModule = await import('../functions/api/options/journal.js');
  const req = new Request('http://localhost/api/options/journal', { method: 'GET' });
  const res = await journalModule.onRequest({ request: req, env: mockEnv });
  assert.strictEqual(res.status, 200, 'Journal endpoint in test mode must return 200');
  const body = await res.json();
  assert.ok(Array.isArray(body.entries), 'Must return journal entries');
});

test('API Contracts: A027 - POST /api/v1/options/screeners/barchart/analyze-watchlist', async () => {
  const barchartModule = await import('../functions/api/v1/options/screeners/barchart/analyze-watchlist.js');
  const req = new Request('http://localhost/api/v1/options/screeners/barchart/analyze-watchlist', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ symbols: ['NVDA', 'AAPL'] }),
  });
  const res = await barchartModule.onRequest({ request: req, env: mockEnv });
  assert.strictEqual(res.status, 200, 'Barchart screener must return 200');
  const body = await res.json();
  assert.ok(Array.isArray(body.records), 'Records must be an array');
});

test('API Contracts: A028 - GET /api/v1/options/tradier/status', async () => {
  const tradierModule = await import('../functions/api/v1/options/tradier/status.js');
  const req = new Request('http://localhost/api/v1/options/tradier/status', { method: 'GET' });
  const res = await tradierModule.onRequest({ request: req, env: mockEnv });
  assert.strictEqual(res.status, 200, 'Tradier status check must return 200');
  const body = await res.json();
  assert.ok(typeof body.connected === 'boolean', 'Connected status must be boolean');
});

test('API Contracts: A029 - POST /api/agent/chat', async () => {
  const agentModule = await import('../functions/api/agent/chat.js');
  const req = new Request('http://localhost/api/agent/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'Analyze NVDA' }),
  });
  const res = await agentModule.onRequest({ request: req, env: mockEnv });
  assert.strictEqual(res.status, 401, 'Unauthenticated agent chat must return 401');
});

test('API Contracts: A030 - POST /api/bot/discord', async () => {
  const discordModule = await import('../functions/api/bot/discord.js');
  // 1. GET status -> 200
  const reqGet = new Request('http://localhost/api/bot/discord', { method: 'GET' });
  const resGet = await discordModule.onRequestGet({ request: reqGet, env: mockEnv });
  assert.strictEqual(resGet.status, 200, 'Discord status probe must return 200');

  // 2. POST with missing / bad signature -> 401
  const reqPost = new Request('http://localhost/api/bot/discord', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 1 }),
  });
  const resPost = await discordModule.onRequestPost({ request: reqPost, env: { DISCORD_PUBLIC_KEY: '00'.repeat(32) } });
  assert.strictEqual(resPost.status, 401, 'Bad signature on Discord POST must return 401');
});

test('API Contracts: A031 - GET /api/version', async () => {
  const versionModule = await import('../functions/api/version.js');
  const req = new Request('http://localhost/api/version', { method: 'GET' });
  const res = await versionModule.onRequestGet({ request: req, env: mockEnv });
  assert.strictEqual(res.status, 200, 'Version endpoint must return 200');
  const body = await res.json();
  assert.strictEqual(body.app, 'DeltaHarvest Institutional');
  assert.ok(body.version, 'Must return app version');
});
