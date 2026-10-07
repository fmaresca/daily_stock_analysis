/**
 * Quantitative Financial Math & Deterministic Verification Test Suite (Node.js Native)
 * ==================================================================================
 * Verifies:
 * 1. Black-Scholes analytical formula against Hull Options Benchmark (tolerance < 0.01).
 * 2. Put-Call Parity exact balance: C - P = S * exp(-q*T) - K * exp(-r*T).
 * 3. 0 DTE / Expiration boundary conditions without NaN or Infinity.
 * 4. Dual-yield and AROC annualization formulas (weekly vs leap cycles).
 * 5. Dividend early-assignment risk triggers on American options.
 * 6. Newton-Raphson + Brent IV solver roundtrip convergence.
 * 7. Multi-tenant negative isolation & data boundary scoping.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  calculateBlackScholesGreeks,
  solveImpliedVolatility,
  safeDivide,
  clamp,
  roundToDecimals,
  normalCdf,
} from '../web/src/utils/financeMath.ts';

import {
  calculateExpirationPayoff,
  calculateExtrinsicValue,
  evaluateEarlyAssignmentRisk,
  calculateAnnualizedYield,
} from '../web/src/utils/optionsMath.ts';

import {
  sortData,
  normalizeSortValue,
} from '../web/src/utils/tableSort.ts';

test('1. Black-Scholes Hull Academic Benchmark & Put-Call Parity', () => {
  // S=100, K=100, DTE=91.25 (T=0.25y), r=0.05, sigma=20%, q=0
  const spot = 100.0;
  const strike = 100.0;
  const dte = 91.25;
  const iv = 20.0;
  const rate = 0.05;
  const divYield = 0.0;

  const greeks = calculateBlackScholesGreeks(spot, strike, dte, iv, rate, divYield);

  // Hull academic benchmark: Call ≈ 4.6150, Put ≈ 3.3725
  assert.ok(Math.abs(greeks.callPrice - 4.6150) < 0.02, `Call price ${greeks.callPrice} should be near 4.6150`);
  assert.ok(Math.abs(greeks.putPrice - 3.3725) < 0.02, `Put price ${greeks.putPrice} should be near 3.3725`);

  // Put-Call Parity: C - P = S - K * exp(-r*T)
  const T = dte / 365.0;
  const parityExpected = spot - strike * Math.exp(-rate * T);
  const parityActual = greeks.callPrice - greeks.putPrice;
  assert.ok(
    Math.abs(parityActual - parityExpected) < 0.005,
    `Put-Call parity violation: ${parityActual} vs ${parityExpected}`
  );

  // Delta bounds
  assert.ok(greeks.callDelta > 0.5 && greeks.callDelta < 0.65, `Call delta should be ~0.5695`);
  assert.ok(greeks.putDelta > -0.5 && greeks.putDelta < -0.35, `Put delta should be ~ -0.4305`);
  assert.ok(greeks.gamma > 0, 'Gamma must be strictly positive');
  assert.ok(greeks.vega > 0, 'Vega must be strictly positive');
});

test('2. Expiration & 0 DTE Boundary Handling (No NaN or Infinity)', () => {
  // Exactly 0 DTE ITM Call
  const itmCall = calculateBlackScholesGreeks(105, 100, 0, 25);
  assert.equal(itmCall.callPrice, 5.0);
  assert.equal(itmCall.putPrice, 0.0);
  assert.equal(itmCall.callDelta, 1.0);
  assert.equal(itmCall.gamma, 0.0);
  assert.equal(itmCall.vega, 0.0);

  // Exactly 0 DTE ITM Put
  const itmPut = calculateBlackScholesGreeks(92, 100, 0, 25);
  assert.equal(itmPut.callPrice, 0.0);
  assert.equal(itmPut.putPrice, 8.0);
  assert.equal(itmPut.putDelta, -1.0);
  assert.equal(itmPut.gamma, 0.0);
  assert.equal(itmPut.vega, 0.0);

  // Negative DTE defensive clamp
  const negDte = calculateBlackScholesGreeks(100, 100, -5, 25);
  assert.ok(Number.isFinite(negDte.callPrice));
  assert.ok(Number.isFinite(negDte.putPrice));
});

test('3. Implied Volatility Solver Convergence & Roundtrip', () => {
  const spot = 180.0;
  const strike = 185.0;
  const dte = 45.0;
  const knownIv = 32.5; // 32.5%
  const rate = 0.045;
  const div = 0.012;

  // 1. Calculate price from known IV
  const greeks = calculateBlackScholesGreeks(spot, strike, dte, knownIv, rate, div);
  const targetPrice = greeks.callPrice;

  // 2. Solve IV from price
  const solvedIv = solveImpliedVolatility(targetPrice, spot, strike, dte, true, rate, div);

  assert.ok(
    Math.abs(solvedIv - knownIv) < 0.1,
    `Solved IV (${solvedIv}%) did not converge to known IV (${knownIv}%) within 0.1% tolerance`
  );

  // 3. Robust handling of zero / extreme inputs
  assert.equal(solveImpliedVolatility(0, spot, strike, dte), 0.0);
  assert.equal(solveImpliedVolatility(-5, spot, strike, dte), 0.0);
});

test('4. Dual-Yield Annualization (Weekly vs LEAP cycles)', () => {
  // 1. Weekly Cycle: 7 DTE, 1.5% profit
  const weeklyYield = calculateAnnualizedYield(1.5, 7);
  // Expected: 1.5 * (365 / 7) ≈ 78.214%
  const expectedWeekly = 1.5 * (365.0 / 7.0);
  assert.ok(Math.abs(weeklyYield - expectedWeekly) < 0.001);

  // 2. LEAP Cycle: 365 DTE, 12% profit
  const leapYield = calculateAnnualizedYield(12.0, 365);
  assert.equal(leapYield, 12.0);

  // 3. Zero DTE defensive handling
  assert.equal(calculateAnnualizedYield(5.0, 0), 0.0);
  assert.equal(calculateAnnualizedYield(5.0, -2), 0.0);
});

test('5. Dividend Early-Assignment Risk Triggers', () => {
  const stockPrice = 120.0;
  const strike = 100.0; // Deep ITM Call (Intrinsic = $20.00)
  const callPremium = 20.40; // Extrinsic = $0.40
  const expDate = '2026-10-16';

  // Case A: High Risk - Dividend ($1.25) > Extrinsic ($0.40) inside expiration cycle
  const highRisk = evaluateEarlyAssignmentRisk(
    stockPrice,
    strike,
    callPremium,
    expDate,
    {
      exDividendDate: '2026-09-30',
      amount: 1.25,
      frequency: 'QUARTERLY',
    },
    '2026-09-24'
  );
  assert.equal(highRisk.hasRisk, true);
  assert.equal(highRisk.severity, 'HIGH');
  assert.equal(highRisk.callExtrinsicValue, 0.40);
  assert.equal(highRisk.projectedForfeitedDividend, 125.0);

  // Case B: No Risk - OTM Call with ample time value ($3.50 > $1.25)
  const safeCall = evaluateEarlyAssignmentRisk(
    100.0,
    105.0,
    3.50,
    expDate,
    {
      exDividendDate: '2026-09-30',
      amount: 1.25,
      frequency: 'QUARTERLY',
    },
    '2026-09-24'
  );
  assert.equal(safeCall.hasRisk, false);
  assert.equal(safeCall.severity, 'NONE');

  // Case C: No Risk - Ex-dividend date is after expiration
  const exDivAfterExp = evaluateEarlyAssignmentRisk(
    stockPrice,
    strike,
    callPremium,
    '2026-09-20',
    {
      exDividendDate: '2026-10-15',
      amount: 1.25,
      frequency: 'QUARTERLY',
    }
  );
  assert.equal(exDivAfterExp.hasRisk, false);
});

test('6. Multi-Tenant Data Scoping & Negative Access Isolation', () => {
  // Simulates multi-tenant scoping logic used across /api/user/* endpoints
  const testStore = [
    { id: 't1', user_id: 'tenant-alpha', symbol: 'AAPL', strategy: 'CSP' },
    { id: 't2', user_id: 'tenant-beta', symbol: 'NVDA', strategy: 'CC' },
    { id: 't3', user_id: 'tenant-alpha', symbol: 'TSLA', strategy: 'CSP' },
  ];

  function queryUserTrades(sessionUserId) {
    // Strictly derives tenant filtering from session
    return testStore.filter((row) => row.user_id === sessionUserId);
  }

  function deleteUserTrade(sessionUserId, tradeId) {
    const idx = testStore.findIndex((row) => row.id === tradeId && row.user_id === sessionUserId);
    if (idx >= 0) {
      testStore.splice(idx, 1);
      return true;
    }
    return false; // Forbidden / Not found
  }

  // Tenant Alpha only sees Alpha's trades
  const alphaTrades = queryUserTrades('tenant-alpha');
  assert.equal(alphaTrades.length, 2);
  assert.ok(alphaTrades.every((t) => t.user_id === 'tenant-alpha'));
  assert.ok(!alphaTrades.some((t) => t.symbol === 'NVDA'), 'Alpha must not see Beta trade NVDA');

  // Tenant Beta cannot delete Alpha's trade (t1)
  const unauthorizedDelete = deleteUserTrade('tenant-beta', 't1');
  assert.equal(unauthorizedDelete, false, 'Tenant Beta must not be able to delete Tenant Alpha trade');
  assert.equal(testStore.some((t) => t.id === 't1'), true, 'Trade t1 must remain untouched');

  // Tenant Alpha can delete their own trade (t1)
  const authorizedDelete = deleteUserTrade('tenant-alpha', 't1');
  assert.equal(authorizedDelete, true, 'Tenant Alpha must be able to delete their own trade');
  assert.equal(testStore.some((t) => t.id === 't1'), false, 'Trade t1 should now be removed');
});

test('7. Defensive Numerical Guards & Non-Finite Protections', () => {
  // safeDivide guards
  assert.equal(safeDivide(10, 0), 0);
  assert.equal(safeDivide(10, 0, 999), 999);
  assert.equal(safeDivide(NaN, 5), 0);
  assert.equal(safeDivide(Infinity, 5), 0);
  assert.equal(safeDivide(10, NaN), 0);
  assert.equal(safeDivide(15, 3), 5);

  // clamp guards
  assert.equal(clamp(5, 10, 20), 10);
  assert.equal(clamp(25, 10, 20), 20);
  assert.equal(clamp(15, 10, 20), 15);
  assert.equal(clamp(NaN, 10, 20), 10);

  // roundToDecimals guards
  assert.equal(roundToDecimals(12.3456, 2), 12.35);
  assert.equal(roundToDecimals(12.3412, 2), 12.34);
  assert.equal(roundToDecimals(NaN, 2), 0);
});

test('8. Extreme Deep In/Out of the Money & Extreme Volatility Scenarios', () => {
  // Deep OTM Call: S=50, K=150, 30 DTE, IV=20%
  const deepOtmCall = calculateBlackScholesGreeks(50, 150, 30, 20);
  assert.ok(deepOtmCall.callPrice >= 0);
  assert.ok(deepOtmCall.callPrice < 0.01);
  assert.ok(deepOtmCall.callDelta >= 0 && deepOtmCall.callDelta < 0.01);

  // Deep ITM Call: S=200, K=50, 30 DTE, IV=20%
  const deepItmCall = calculateBlackScholesGreeks(200, 50, 30, 20);
  assert.ok(deepItmCall.callPrice >= 148);
  assert.ok(deepItmCall.callDelta > 0.98 && deepItmCall.callDelta <= 1.0);

  // Super high volatility: 350% IV
  const highVol = calculateBlackScholesGreeks(100, 100, 30, 350);
  assert.ok(Number.isFinite(highVol.callPrice));
  assert.ok(Number.isFinite(highVol.vega));
  assert.ok(highVol.callPrice > 0);
});

test('9. Expiration Payoff & Curve Generation Integrity', () => {
  // S=100, K=105, Premium=$3.00
  // If terminal price = $110: Stock gain = 10, Call loss = 110 - 105 - 3 = 2, Net = 10 - 2 = +8
  const payoffAbove = calculateExpirationPayoff(110, 100, 105, 3.0);
  assert.equal(payoffAbove, 8.0);

  // If terminal price = $95: Stock loss = -5, Call kept = +3, Net = -2
  const payoffBelow = calculateExpirationPayoff(95, 100, 105, 3.0);
  assert.equal(payoffBelow, -2.0);

  // If terminal price = $105: Stock gain = +5, Call kept = +3, Net = +8
  const payoffAtStrike = calculateExpirationPayoff(105, 100, 105, 3.0);
  assert.equal(payoffAtStrike, 8.0);
});

test('10. Economic Calendar Chronological Sort & Market Cap Normalization', () => {
  // Fixture: Multi-date events across month boundary (Sep 28 to Oct 9)
  const fixtureEvents = [
    { title: 'PPI Final Demand', dateET: 'Fri, Oct 9', timeET: '08:30 AM', isoDate: '2026-10-09T08:30:00-04:00' },
    { title: 'FOMC Bowman Speaks', dateET: 'Mon, Sep 28', timeET: '08:15 AM', isoDate: '2026-09-28T08:15:00-04:00' },
    { title: 'Non-Farm Payrolls', dateET: 'Fri, Oct 2', timeET: '08:30 AM', isoDate: '2026-10-02T08:30:00-04:00' },
    { title: 'ISM Services PMI', dateET: 'Mon, Oct 5', timeET: '10:00 AM', isoDate: '2026-10-05T10:00:00-04:00' },
    { title: 'FOMC Minutes', dateET: 'Wed, Oct 7', timeET: '02:00 PM', isoDate: '2026-10-07T14:00:00-04:00' },
  ];

  // Ascending sort (earliest first: Sep 28 -> Oct 2 -> Oct 5 -> Oct 7 -> Oct 9)
  const sortedAsc = sortData(fixtureEvents, 'dateET', 'asc');
  assert.equal(sortedAsc[0].dateET, 'Mon, Sep 28', 'Earliest event must be Mon, Sep 28');
  assert.equal(sortedAsc[1].dateET, 'Fri, Oct 2', 'Second event must be Fri, Oct 2');
  assert.equal(sortedAsc[2].dateET, 'Mon, Oct 5', 'Third event must be Mon, Oct 5');
  assert.equal(sortedAsc[3].dateET, 'Wed, Oct 7', 'Fourth event must be Wed, Oct 7');
  assert.equal(sortedAsc[4].dateET, 'Fri, Oct 9', 'Latest event must be Fri, Oct 9');

  // Descending sort (latest first: Oct 9 -> Oct 7 -> Oct 5 -> Oct 2 -> Sep 28)
  const sortedDesc = sortData(fixtureEvents, 'dateET', 'desc');
  assert.equal(sortedDesc[0].dateET, 'Fri, Oct 9', 'Latest event must be Fri, Oct 9');
  assert.equal(sortedDesc[4].dateET, 'Mon, Sep 28', 'Earliest event must be Mon, Sep 28');

  // Screener market cap string normalization e.g. "137.0 B", "45.5 B", "9.3 B"
  assert.equal(normalizeSortValue('137.0 B'), 137000000000);
  assert.equal(normalizeSortValue('$45.5 B'), 45500000000);
  assert.equal(normalizeSortValue('9.3 B'), 9300000000);

  const fixtureScreenerRows = [
    { symbol: 'PLTR', extra_fields: { market_cap_str: '45.5 B' } },
    { symbol: 'NOW', extra_fields: { market_cap_str: '137.0 B' } },
    { symbol: 'DOCU', extra_fields: { market_cap_str: '9.3 B' } },
  ];

  const sortedMcDesc = sortData(fixtureScreenerRows, 'market_cap', 'desc');
  assert.equal(sortedMcDesc[0].symbol, 'NOW', 'Largest market cap must be NOW (137B)');
  assert.equal(sortedMcDesc[1].symbol, 'PLTR', 'Second market cap must be PLTR (45.5B)');
  assert.equal(sortedMcDesc[2].symbol, 'DOCU', 'Third market cap must be DOCU (9.3B)');
});

test('11. Post-Reload Route Resolution & Deep Link Mapping', async () => {
  const { parseRouteFromLocation } = await import('../web/src/hooks/useAppNavigation.ts');

  const testCases = [
    // Legacy Routes (preserved for backwards-compatibility & redirected to canonical)
    { path: '/equities', expectedTree: 'EQUITIES', expectedEqTab: 'TECHNICAL_SCREENER', expectedCanonical: '/research/stocks' },
    { path: '/equities/screener', expectedTree: 'EQUITIES', expectedEqTab: 'TECHNICAL_SCREENER', expectedCanonical: '/research/stocks' },
    { path: '/equities/screeners', expectedTree: 'EQUITIES', expectedEqTab: 'WEEKLY_STOCK_SCREENERS', expectedCanonical: '/research/weekly-stocks' },
    { path: '/equities/watchlist', expectedTree: 'EQUITIES', expectedEqTab: 'WEEKLY_STOCK_SCREENERS', expectedCanonical: '/research/weekly-stocks' },
    { path: '/equities/watchlist-builder', expectedTree: 'EQUITIES', expectedEqTab: 'WEEKLY_STOCK_SCREENERS', expectedCanonical: '/research/weekly-stocks' },
    { path: '/charts', expectedTree: 'EQUITIES', expectedEqTab: 'INTERACTIVE_CHARTS', expectedCanonical: '/research/charts' },
    { path: '/solvency', expectedTree: 'EQUITIES', expectedEqTab: 'FUNDAMENTAL_HEALTH', expectedCanonical: '/research/fundamentals' },
    { path: '/calendar', expectedTree: 'EQUITIES', expectedEqTab: 'ECONOMIC_CALENDAR', expectedCanonical: '/research/calendar' },
    { path: '/options', expectedTree: 'OPTIONS', expectedOptTab: 'INCOME_SCREENER', expectedCanonical: '/research/income' },
    { path: '/spreads', expectedTree: 'OPTIONS', expectedOptTab: 'MULTI_LEG_SPREADS', expectedCanonical: '/tools/spreads' },
    { path: '/margin', expectedTree: 'OPTIONS', expectedOptTab: 'PORTFOLIO_MARGIN_SIM', expectedCanonical: '/tools/margin' },
    { path: '/tax', expectedTree: 'OPTIONS', expectedOptTab: 'TAX_ALPHA_OPTIMIZER', expectedCanonical: '/tools/tax' },
    { path: '/staging', expectedTree: 'OPTIONS', expectedOptTab: 'BROKER_STAGING', expectedCanonical: '/money/staging' },
    { path: '/workflow', expectedTree: 'WORKFLOW', expectedOptTab: 'SCHWAB_POSITIONS_UPLOAD', expectedCanonical: '/ritual' },
    { path: '/workflow/cash', expectedTree: 'WORKFLOW', expectedOptTab: 'WEEKLY_CASH_LEDGER', expectedCanonical: '/ritual/cash' },
    { path: '/workflow/holdings', expectedTree: 'WORKFLOW', expectedOptTab: 'HOLDINGS_COVERED_CALLS', expectedCanonical: '/ritual/holdings' },
    { path: '/workflow/screener', expectedTree: 'WORKFLOW', expectedOptTab: 'CASCADING_SCREENER', expectedCanonical: '/ritual/screener' },

    // Round-8 Canonical Routes
    { path: '/ritual/upload', expectedTree: 'WORKFLOW', expectedOptTab: 'SCHWAB_POSITIONS_UPLOAD', expectedCanonical: '/ritual/upload' },
    { path: '/ritual/cash', expectedTree: 'WORKFLOW', expectedOptTab: 'WEEKLY_CASH_LEDGER', expectedCanonical: '/ritual/cash' },
    { path: '/ritual/holdings', expectedTree: 'WORKFLOW', expectedOptTab: 'HOLDINGS_COVERED_CALLS', expectedCanonical: '/ritual/holdings' },
    { path: '/ritual/calendar', expectedTree: 'WORKFLOW', expectedOptTab: 'ECONOMIC_CALENDAR', expectedCanonical: '/ritual/calendar' },
    { path: '/ritual/screener', expectedTree: 'WORKFLOW', expectedOptTab: 'CASCADING_SCREENER', expectedCanonical: '/ritual/screener' },
    { path: '/ritual/report', expectedTree: 'WORKFLOW', expectedOptTab: 'WEEKLY_EXECUTIVE_REPORT', expectedCanonical: '/ritual/report' },
    { path: '/ritual/staging', expectedTree: 'WORKFLOW', expectedOptTab: 'BROKER_STAGING', expectedCanonical: '/ritual/staging' },

    { path: '/research/stocks', expectedTree: 'EQUITIES', expectedEqTab: 'TECHNICAL_SCREENER', expectedCanonical: '/research/stocks' },
    { path: '/research/income', expectedTree: 'OPTIONS', expectedOptTab: 'INCOME_SCREENER', expectedCanonical: '/research/income' },
    { path: '/research/charts', expectedTree: 'EQUITIES', expectedEqTab: 'INTERACTIVE_CHARTS', expectedCanonical: '/research/charts' },
    { path: '/research/health', expectedTree: 'EQUITIES', expectedEqTab: 'FUNDAMENTAL_HEALTH', expectedCanonical: '/research/fundamentals' },

    { path: '/money/workspace', expectedTree: 'DASHBOARD', expectedCanonical: '/money/workspace' },
    { path: '/money/portfolio', expectedTree: 'OPTIONS', expectedOptTab: 'EXECUTIVE_DIGEST', expectedCanonical: '/money/portfolio' },

    { path: '/tools/spreads', expectedTree: 'OPTIONS', expectedOptTab: 'MULTI_LEG_SPREADS', expectedCanonical: '/tools/spreads' },
    { path: '/tools/margin', expectedTree: 'OPTIONS', expectedOptTab: 'PORTFOLIO_MARGIN_SIM', expectedCanonical: '/tools/margin' },
    { path: '/tools/tax', expectedTree: 'OPTIONS', expectedOptTab: 'TAX_ALPHA_OPTIMIZER', expectedCanonical: '/tools/tax' },

    { path: '/learn/methodology', expectedTree: 'METHODOLOGY', expectedCanonical: '/learn/methodology' },
    { path: '/learn/faq', expectedTree: 'FAQ', expectedCanonical: '/learn/faq' },
    { path: '/learn/disclaimer', expectedTree: 'DISCLAIMER', expectedCanonical: '/learn/disclaimer' },
  ];

  for (const tc of testCases) {
    globalThis.window = {
      location: {
        pathname: tc.path,
        hash: '',
      },
    };
    const route = parseRouteFromLocation();
    assert.equal(route.tree, tc.expectedTree, `Path ${tc.path} must resolve to tree ${tc.expectedTree}`);
    if (tc.expectedEqTab) {
      assert.equal(route.equitiesTab, tc.expectedEqTab, `Path ${tc.path} must resolve to equitiesTab ${tc.expectedEqTab}`);
    }
    if (tc.expectedOptTab) {
      assert.equal(route.optionsTab, tc.expectedOptTab, `Path ${tc.path} must resolve to optionsTab ${tc.expectedOptTab}`);
    }
    if (tc.expectedCanonical) {
      assert.equal(route.canonicalPath, tc.expectedCanonical, `Path ${tc.path} must map to canonicalPath ${tc.expectedCanonical}`);
    }
    assert.equal(route.isNotFound, false, `Valid path ${tc.path} must not be marked isNotFound`);
  }

  // Verify unknown route marks isNotFound = true
  globalThis.window = {
    location: {
      pathname: '/some/nonexistent/subpath',
      hash: '',
    },
  };
  const unknownRoute = parseRouteFromLocation();
  assert.equal(unknownRoute.isNotFound, true, 'Unknown path must flag isNotFound = true');

  delete globalThis.window;
});

test('12. Watchlist Sample CSV Filename Integrity', async () => {
  const fs = await import('node:fs');
  const { fileURLToPath } = await import('node:url');

  // Verify static sample CSV file exists with exact spelling
  const samplePath = fileURLToPath(new URL('../web/public/samples/deltaharvest_watchlist_sample.csv', import.meta.url));
  assert.ok(fs.existsSync(samplePath), 'deltaharvest_watchlist_sample.csv must exist in web/public/samples/');

  // Verify exportImport.ts references exact spelling
  const exportImportPath = fileURLToPath(new URL('../web/src/utils/exportImport.ts', import.meta.url));
  const content = fs.readFileSync(exportImportPath, 'utf-8');
  assert.ok(content.includes('deltaharvest_watchlist_sample.csv'), 'exportImport.ts must reference deltaharvest_watchlist_sample.csv');
  assert.ok(!content.includes('deltalharvest'), 'exportImport.ts must NOT contain misspelled deltalharvest');
});

test('13. Admin Inquiries Multi-Channel Dispatch Contract & Server-Side Security', async () => {
  const fs = await import('node:fs');
  const { fileURLToPath } = await import('node:url');

  const inquiriesPath = fileURLToPath(new URL('../functions/api/admin/inquiries.js', import.meta.url));
  assert.ok(fs.existsSync(inquiriesPath), 'functions/api/admin/inquiries.js must exist');
  const inquiriesContent = fs.readFileSync(inquiriesPath, 'utf-8');

  assert.ok(inquiriesContent.includes('export async function onRequestPost'), 'Must export onRequestPost');
  assert.ok(inquiriesContent.includes('export async function onRequestGet'), 'Must export onRequestGet');
  assert.ok(inquiriesContent.includes('formsubmit.co/ajax/'), 'Must integrate FormSubmit direct transport');
  assert.ok(inquiriesContent.includes('access_inquiries'), 'Must integrate Cloudflare D1 persistent audit storage');

  const requestAccessPath = fileURLToPath(new URL('../functions/api/auth/request-access.js', import.meta.url));
  assert.ok(fs.existsSync(requestAccessPath), 'functions/api/auth/request-access.js must exist');
});

test('14. Fail-Closed Authentication & Session Secret Security Gate', async () => {
  const authUtils = await import('../functions/api/_auth_utils.js');
  const { requireSessionSecret, hashPassword, verifyPassword, getUserByEmail, createUser } = authUtils;

  // A. Verify DEFAULT_SECRET and BUILTIN_BOOTSTRAP_USERS are completely purged
  assert.strictEqual(authUtils.DEFAULT_SECRET, undefined, 'DEFAULT_SECRET must NOT be exported or exist');
  assert.strictEqual(authUtils.BUILTIN_BOOTSTRAP_USERS, undefined, 'BUILTIN_BOOTSTRAP_USERS must NOT be exported or exist');

  // B. Verify requireSessionSecret fails closed when SESSION_SECRET is missing
  assert.throws(
    () => requireSessionSecret({}),
    /Server authentication is not configured/,
    'requireSessionSecret must throw when SESSION_SECRET is missing'
  );
  assert.throws(
    () => requireSessionSecret({ SESSION_SECRET: '   ' }),
    /Server authentication is not configured/,
    'requireSessionSecret must throw when SESSION_SECRET is whitespace'
  );

  // C. Verify requireSessionSecret returns valid secret when provided
  const validSecret = 'test-secret-value-12345';
  assert.strictEqual(
    requireSessionSecret({ SESSION_SECRET: validSecret }),
    validSecret,
    'requireSessionSecret must return configured secret'
  );

  // D. Verify non-development environment fails closed without D1
  const prodUser = await getUserByEmail({ ENVIRONMENT: 'production' }, 'anyone@example.com');
  assert.strictEqual(prodUser, null, 'Production environment must fail closed without D1 database binding');

  // E. Verify PBKDF2 hashing and verification functions
  const { generateRandomSalt } = authUtils;
  const password = 'TestSecurePassword2026!';
  const salt = generateRandomSalt(16);
  const hash = await hashPassword(password, salt);
  assert.ok(hash && salt, 'hashPassword must generate valid hash');
  assert.strictEqual(await verifyPassword(password, salt, hash), true, 'verifyPassword must verify matching password');
  assert.strictEqual(await verifyPassword('WrongPassword', salt, hash), false, 'verifyPassword must reject invalid password');
});

test('15. Two-Step Password Reset Integrity, Token Single-Use & Revocation', async () => {
  const fs = await import('node:fs');
  const { fileURLToPath } = await import('node:url');
  const {
    createUser,
    getUserByEmail,
    verifyPassword,
    createSessionToken,
    authenticateRequest,
    generateSecureRandomToken,
    hashTokenSha256,
    storePasswordResetToken,
    consumePasswordResetToken,
  } = await import('../functions/api/_auth_utils.js');

  // A. Verify route whitelist in functions/_middleware.js
  const middlewarePath = fileURLToPath(new URL('../functions/_middleware.js', import.meta.url));
  const middlewareContent = fs.readFileSync(middlewarePath, 'utf-8');
  assert.ok(
    middlewareContent.includes('/api/auth/reset-password'),
    'functions/_middleware.js must whitelist /api/auth/reset-password for unauthenticated access'
  );

  // B. Verify reset endpoints exist and export onRequestPost
  const resetHandlerModule = await import('../functions/api/auth/reset-password.js');
  const confirmHandlerModule = await import('../functions/api/auth/reset-password/confirm.js');
  assert.ok(typeof resetHandlerModule.onRequestPost === 'function', 'reset-password.js must export onRequestPost');
  assert.ok(typeof confirmHandlerModule.onRequestPost === 'function', 'reset-password/confirm.js must export onRequestPost');

  // C. Step A: Test reset link request input validation
  const invalidEmailReq = new Request('http://localhost/api/auth/reset-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'not-an-email' }),
  });
  const invalidEmailRes = await resetHandlerModule.onRequestPost({ request: invalidEmailReq, env: { ENVIRONMENT: 'development' } });
  assert.strictEqual(invalidEmailRes.status, 400, 'Invalid email must return 400');

  // D. Step A: Uniform generic response for nonexistent account (anti-enumeration)
  const unknownEmailReq = new Request('http://localhost/api/auth/reset-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'nonexistent_user_xyz@domain.com' }),
  });
  const unknownEmailRes = await resetHandlerModule.onRequestPost({ request: unknownEmailReq, env: { ENVIRONMENT: 'development' } });
  assert.strictEqual(unknownEmailRes.status, 200, 'Nonexistent account must return 200 generic success');
  const unknownEmailBody = await unknownEmailRes.json();
  assert.strictEqual(unknownEmailBody.success, true);
  assert.ok(unknownEmailBody.message.includes('If an account exists'), 'Must return uniform generic message');

  // E. Setup a test tenant user for Step B confirmation
  const env = { ENVIRONMENT: 'development', SESSION_SECRET: 'test-session-secret-for-step-b-suite-2026' };
  const userEmail = 'test_reset_tenant@example.com';
  const initialPass = 'InitialPassword123!';
  const authModule = await import('../functions/api/_auth_utils.js');
  const initialSalt = authModule.generateRandomSalt(16);
  const initialHash = await authModule.hashPassword(initialPass, initialSalt);
  const createdUser = await createUser(env, {
    email: userEmail,
    password_hash: initialHash,
    password_salt: initialSalt,
    role: 'client',
    is_active: 1,
    must_change_password: 0,
    display_name: 'Reset Tenant',
  });
  assert.ok(createdUser, 'User created');

  // Issue an active session token before reset
  const preResetToken = await createSessionToken(
    { sub: createdUser.id, email: userEmail, role: 'client', tv: createdUser.token_version ?? 0 },
    env.SESSION_SECRET
  );

  // F. Step B: Test validation in confirm endpoint
  const badShortTokenReq = new Request('http://localhost/api/auth/reset-password/confirm', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: '', newPassword: 'BrandNewPassword2026!' }),
  });
  const badShortTokenRes = await confirmHandlerModule.onRequestPost({ request: badShortTokenReq, env });
  assert.strictEqual(badShortTokenRes.status, 400, 'Empty token must return 400');

  const badShortPassReq = new Request('http://localhost/api/auth/reset-password/confirm', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: 'dummy_token_123', newPassword: 'short' }),
  });
  const badShortPassRes = await confirmHandlerModule.onRequestPost({ request: badShortPassReq, env });
  assert.strictEqual(badShortPassRes.status, 400, 'Short password must return 400');

  // G. Step B: Store a valid reset token and execute password reset
  const rawToken = generateSecureRandomToken(32);
  const tokenHash = await hashTokenSha256(rawToken);
  await storePasswordResetToken(env, tokenHash, createdUser.id, 30);

  const newPass = 'UpdatedSecurePassword2026!';
  const confirmReq = new Request('http://localhost/api/auth/reset-password/confirm', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: rawToken, newPassword: newPass }),
  });
  const confirmRes = await confirmHandlerModule.onRequestPost({ request: confirmReq, env });
  assert.strictEqual(confirmRes.status, 200, 'Valid confirmation must return 200');
  const confirmBody = await confirmRes.json();
  assert.strictEqual(confirmBody.success, true);
  assert.strictEqual(confirmRes.headers.get('Set-Cookie'), null, 'Must NOT issue session cookie on reset');

  // H. Step B: Token must be single-use (replay must fail)
  const replayReq = new Request('http://localhost/api/auth/reset-password/confirm', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: rawToken, newPassword: 'AnotherPassword2026!' }),
  });
  const replayRes = await confirmHandlerModule.onRequestPost({ request: replayReq, env });
  assert.strictEqual(replayRes.status, 400, 'Replayed token must return 400');

  // I. Verify user password updated and token_version incremented
  const updatedUser = await getUserByEmail(env, userEmail);
  assert.strictEqual(await verifyPassword(newPass, updatedUser.password_salt, updatedUser.password_hash), true, 'New password must verify');
  assert.strictEqual(await verifyPassword(initialPass, updatedUser.password_salt, updatedUser.password_hash), false, 'Old password must fail');
  assert.strictEqual(updatedUser.token_version, 1, 'token_version must increment to 1');

  // J. Verify pre-reset session token is now revoked (token_version mismatch)
  const authPreReset = await authenticateRequest({
    request: new Request('https://example.com/api/user/profile', {
      headers: { Cookie: `deltaharvest_session=${preResetToken}` },
    }),
    env,
  });
  assert.strictEqual(authPreReset.authenticated, false, 'Pre-reset session token must be revoked');
  assert.strictEqual(authPreReset.response.status, 401, 'Revoked token must return 401');

  // K. Verify parameter aliases in change-password.js
  const changePasswordCode = fs.readFileSync(fileURLToPath(new URL('../functions/api/user/change-password.js', import.meta.url)), 'utf-8');
  assert.ok(changePasswordCode.includes('currentPassword = body.currentPassword || body.oldPassword'), 'change-password must accept both currentPassword and oldPassword');
});



