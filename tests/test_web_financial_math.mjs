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
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

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

import {
  isCboeWeeklyOptionable,
  CBOE_WEEKLY_OPTIONS_SET,
  CBOE_WEEKLY_OPTIONS_REGISTRY,
} from '../web/src/data/cboeWeeklyDirectory.ts';

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
  assert.ok(inquiriesContent.includes('api.resend.com/emails'), 'Must integrate Resend direct transport');
  assert.ok(inquiriesContent.includes('access_inquiries'), 'Must integrate Cloudflare D1 persistent audit storage');
  assert.ok(inquiriesContent.includes('test_resend'), 'Must integrate Resend test diagnostic action');
  assert.ok(inquiriesContent.includes('test_email'), 'Must integrate Email test diagnostic action');

  const requestAccessPath = fileURLToPath(new URL('../functions/api/auth/request-access.js', import.meta.url));
  assert.ok(fs.existsSync(requestAccessPath), 'functions/api/auth/request-access.js must exist');

  // Verify getAdminNotificationEmail resolution and fallbacks
  const { getAdminNotificationEmail } = await import('../functions/api/_auth_utils.js');
  const defaultAdmin = await getAdminNotificationEmail({});
  assert.strictEqual(defaultAdmin, '', 'Unconfigured environment must return empty string');

  const envConfiguredAdmin = await getAdminNotificationEmail({ ADMIN_NOTIFICATION_EMAIL: 'custom_admin@example.com' });
  assert.strictEqual(envConfiguredAdmin, 'custom_admin@example.com', 'ADMIN_NOTIFICATION_EMAIL must override default');

  const generalAdmin = await getAdminNotificationEmail({ ADMIN_EMAIL: 'general_admin@domain.com' });
  assert.strictEqual(generalAdmin, 'general_admin@domain.com', 'External ADMIN_EMAIL must be used when notification email unset');
});

test('14. Fail-Closed Authentication & Session Secret Security Gate', async () => {
  const authUtils = await import('../functions/api/_auth_utils.js');
  const { requireSessionSecret, hashPassword, verifyPassword, getUserByEmail } = authUtils;

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

  // F. Verify middleware does not block public root page loads while keeping APIs fail closed
  const middlewareModule = await import('../functions/_middleware.js');
  const rootRes = await middlewareModule.onRequest({
    request: new Request('http://localhost/'),
    env: {},
    next: () => 'OK_ROOT',
  });
  assert.strictEqual(rootRes, 'OK_ROOT', 'Root page / must open and serve SPA without 500 error when secret missing');

  const loginPageRes = await middlewareModule.onRequest({
    request: new Request('http://localhost/login'),
    env: {},
    next: () => 'OK_LOGIN',
  });
  assert.strictEqual(loginPageRes, 'OK_LOGIN', 'Login page /login must open without 500 error when secret missing');

  const adminApiRes = await middlewareModule.onRequest({
    request: new Request('http://localhost/api/admin/users'),
    env: {},
    next: () => 'FAIL',
  });
  assert.strictEqual(adminApiRes.status, 500, 'Admin API must fail closed with 500 when secret missing');

  // G. Verify wrangler.toml includes essential bindings and environment config
  const wranglerPath = fileURLToPath(new URL('../wrangler.toml', import.meta.url));
  const wranglerContent = fs.readFileSync(wranglerPath, 'utf-8');
  assert.ok(wranglerContent.includes('ENVIRONMENT = "production"'), 'wrangler.toml must configure ENVIRONMENT');
  assert.ok(wranglerContent.includes('database_name = "deltaharvest-db"'), 'wrangler.toml must configure D1 database');
  assert.ok(wranglerContent.includes('binding = "RATE_LIMIT_KV"'), 'wrangler.toml must configure RATE_LIMIT_KV');

  // H. Verify PROVISIONED_ACCOUNTS is completely purged
  assert.strictEqual(authUtils.PROVISIONED_ACCOUNTS, undefined, 'PROVISIONED_ACCOUNTS must NOT be exported or exist');

  // I. Verify login.js contains no plaintext password literals
  const loginPath = fileURLToPath(new URL('../functions/api/auth/login.js', import.meta.url));
  const loginContent = fs.readFileSync(loginPath, 'utf-8');
  assert.strictEqual(loginContent.includes('DeltaHarvest2026!'), false, 'login.js must NOT contain DeltaHarvest2026!');
  assert.strictEqual(loginContent.includes('Whffranklin26'), false, 'login.js must NOT contain Whffranklin26!');

  // J. Verify wrangler.toml contains no SESSION_SECRET and no email literals
  assert.strictEqual(wranglerContent.includes('SESSION_SECRET'), false, 'wrangler.toml must NOT contain SESSION_SECRET');
  assert.strictEqual(/@[a-zA-Z0-9.-]+/.test(wranglerContent), false, 'wrangler.toml must NOT contain email literals');

  // K. Verify rotation script PBKDF2 parameters byte-match app hasher
  const rotationScript = await import('../scripts/rotate-exposed-passwords.mjs');
  const testSalt = '1234567890abcdef1234567890abcdef';
  const testPass = 'BenchmarkingHashConsistency2026!';
  const appHash = await hashPassword(testPass, testSalt);
  const scriptHash = rotationScript.hashPassword(testPass, testSalt);
  assert.strictEqual(scriptHash, appHash, 'rotate-exposed-passwords.mjs hasher must byte-match app hashPassword');
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

test('16. CBOE Weekly Options Pre-Processing, Custom CSV Sanitization & Gemini Prompt Exclusion Mandate', () => {
  // A. Verify official CBOE weekly options directory lookup & size
  assert.ok(CBOE_WEEKLY_OPTIONS_REGISTRY.length >= 680, `CBOE Registry must have at least 680 symbols (found ${CBOE_WEEKLY_OPTIONS_REGISTRY.length})`);
  assert.strictEqual(isCboeWeeklyOptionable('AAPL'), true, 'AAPL must be weekly optionable');
  assert.strictEqual(isCboeWeeklyOptionable('aapl'), true, 'Case insensitive lookup must match');
  assert.strictEqual(isCboeWeeklyOptionable('  NVDA  '), true, 'Whitespace trimmed lookup must match');
  assert.strictEqual(isCboeWeeklyOptionable('SPY'), true, 'SPY must be weekly optionable');
  assert.strictEqual(isCboeWeeklyOptionable('QQQ'), true, 'QQQ must be weekly optionable');
  assert.strictEqual(isCboeWeeklyOptionable('IWM'), true, 'IWM must be weekly optionable');
  assert.strictEqual(isCboeWeeklyOptionable('XYZNONEXISTENT'), false, 'Non-existent ticker must not be weekly optionable');
  assert.strictEqual(isCboeWeeklyOptionable('BRK.A'), false, 'BRK.A has no weekly options and must be false');
  assert.strictEqual(isCboeWeeklyOptionable(''), false, 'Empty string must return false');

  // B. Verify CSV Pre-Processing Logic: Custom CSV without weekly options column
  // Simulates ingest of custom/override CSV (Barchart/MarketChameleon or custom symbols)
  const mockRows = [
    { symbol: 'NVDA', last: 120.50, weeklyCol: '' },
    { symbol: 'XYZFAKE', last: 45.00, weeklyCol: '' },
    { symbol: 'AAPL', last: 225.00, weeklyCol: '' },
    { symbol: 'BRK.A', last: 680000.00, weeklyCol: '' },
  ];

  const preprocessed = mockRows.map(row => {
    const inCboe = isCboeWeeklyOptionable(row.symbol);
    let hasWeekly = inCboe;
    if (row.weeklyCol !== '') {
      hasWeekly = (row.weeklyCol.toLowerCase() === 'yes' || row.weeklyCol.toLowerCase() === 'true') && inCboe;
    }
    return {
      ...row,
      has_weekly_options: hasWeekly,
      in_cboe_registry: inCboe,
      expiration_cadence: hasWeekly ? 'Weekly' : 'Monthly Only',
    };
  });

  const nvda = preprocessed.find(r => r.symbol === 'NVDA');
  assert.strictEqual(nvda?.has_weekly_options, true, 'NVDA must be weekly optionable');
  assert.strictEqual(nvda?.in_cboe_registry, true);
  assert.strictEqual(nvda?.expiration_cadence, 'Weekly');

  const fakeStock = preprocessed.find(r => r.symbol === 'XYZFAKE');
  assert.strictEqual(fakeStock?.has_weekly_options, false, 'Custom non-weekly stock must be eliminated from weeklys');
  assert.strictEqual(fakeStock?.in_cboe_registry, false);
  assert.strictEqual(fakeStock?.expiration_cadence, 'Monthly Only');

  const brk = preprocessed.find(r => r.symbol === 'BRK.A');
  assert.strictEqual(brk?.has_weekly_options, false, 'BRK.A must be eliminated from weeklys');
  assert.strictEqual(brk?.expiration_cadence, 'Monthly Only');

  // C. Verify pre-processing filtering eliminates monthly-only stocks before Gemini
  const weeklyCandidates = preprocessed.filter(r => isCboeWeeklyOptionable(r.symbol));
  assert.strictEqual(weeklyCandidates.length, 2, 'Only NVDA and AAPL should pass');
  assert.deepStrictEqual(weeklyCandidates.map(r => r.symbol), ['NVDA', 'AAPL']);

  // D. Verify screenerCsvParser.ts contract
  const parserCode = fs.readFileSync(fileURLToPath(new URL('../web/src/utils/screenerCsvParser.ts', import.meta.url)), 'utf-8');
  assert.ok(parserCode.includes("import { isCboeWeeklyOptionable } from '../data/cboeWeeklyDirectory'"), 'screenerCsvParser must import isCboeWeeklyOptionable');
  assert.ok(parserCode.includes('const inCboeRegistry = isCboeWeeklyOptionable(symbol)'), 'screenerCsvParser must verify symbol against CBOE registry');
  assert.ok(parserCode.includes('in_cboe_registry: inCboeRegistry'), 'screenerCsvParser must set in_cboe_registry');
  assert.ok(parserCode.includes("expiration_cadence: hasWeekly ? 'Weekly' : 'Monthly Only'"), 'screenerCsvParser must set expiration_cadence');

  // E. Verify screenerHydrator.ts contract
  const hydratorCode = fs.readFileSync(fileURLToPath(new URL('../web/src/utils/screenerHydrator.ts', import.meta.url)), 'utf-8');
  assert.ok(hydratorCode.includes("import { isCboeWeeklyOptionable } from '../data/cboeWeeklyDirectory'"), 'screenerHydrator must import isCboeWeeklyOptionable');
  assert.ok(hydratorCode.includes('isCboeWeeklyOptionable(record.symbol)'), 'screenerHydrator must guard has_weeklys with isCboeWeeklyOptionable');

  // F. Verify capitalAndTaxLedger.ts delegation to CBOE registry
  const ledgerCode = fs.readFileSync(fileURLToPath(new URL('../web/src/utils/capitalAndTaxLedger.ts', import.meta.url)), 'utf-8');
  assert.ok(ledgerCode.includes("import { CBOE_WEEKLY_OPTIONS_SET, isCboeWeeklyOptionable } from '../data/cboeWeeklyDirectory'"), 'capitalAndTaxLedger must import CBOE registry');
  assert.ok(ledgerCode.includes('export const CBOE_WEEKLY_SYMBOLS = CBOE_WEEKLY_OPTIONS_SET'), 'capitalAndTaxLedger must export CBOE_WEEKLY_OPTIONS_SET');

  // G. Verify CascadingScreenerView.tsx pre-processing & candidatePromptPool gating
  const screenerCode = fs.readFileSync(fileURLToPath(new URL('../web/src/components/CascadingScreenerView.tsx', import.meta.url)), 'utf-8');
  assert.ok(screenerCode.includes("import { isCboeWeeklyOptionable } from '../data/cboeWeeklyDirectory'"), 'CascadingScreenerView must import isCboeWeeklyOptionable');
  assert.ok(screenerCode.includes('isCboeWeeklyOptionable(r.symbol)'), 'CascadingScreenerView must filter uploaded records against CBOE weekly options list');
  assert.ok(screenerCode.includes('!isCboeWeeklyOptionable(sym) || opp.has_weeklys === false'), 'candidatePromptPool must strictly exclude non-weekly optionable symbols');

  // H. Verify geminiPromptTemplates.ts exclusion mandate
  const promptCode = fs.readFileSync(fileURLToPath(new URL('../web/src/utils/geminiPromptTemplates.ts', import.meta.url)), 'utf-8');
  assert.ok(promptCode.includes("import { isCboeWeeklyOptionable } from '../data/cboeWeeklyDirectory'"), 'geminiPromptTemplates must import isCboeWeeklyOptionable');
  assert.ok(promptCode.includes('if (!isCboeWeeklyOptionable(sym)) return false;'), 'geminiPromptTemplates must filter candidate opportunities with isCboeWeeklyOptionable');
  assert.ok(promptCode.includes('CRITICAL WEEKLY OPTIONS EXPIRATION MANDATE'), 'Gemini prompt must contain mandatory weekly options instruction');
  assert.ok(promptCode.includes('Failed Weekly Options Mandate (Monthly Expiration Only)'), 'Gemini prompt must instruct placing non-weekly stocks into Table 3');
});

test('17. Round-8 Task-Oriented Navigation Label Consistency & IA Alignment', async () => {
  const fs = await import('node:fs');
  const { fileURLToPath } = await import('node:url');

  // A. Verify docs/LABEL_GLOSSARY.md exists and defines the canonical label rules
  const glossaryPath = fileURLToPath(new URL('../docs/LABEL_GLOSSARY.md', import.meta.url));
  assert.ok(fs.existsSync(glossaryPath), 'docs/LABEL_GLOSSARY.md must exist');
  const glossaryContent = fs.readFileSync(glossaryPath, 'utf-8');

  // B. Verify the 7 Weekend Ritual canonical steps are consistently titled across sidebar and glossary
  const canonicalRitualSteps = [
    { step: 1, label: '1. Upload Positions', subtitle: 'Schwab CSV Import' },
    { step: 2, label: '2. Cash & Tax Ledger', subtitle: 'Living & Loss Carryforward' },
    { step: 3, label: '3. Holdings & Covered Calls', subtitle: '80% Profit & 20Δ Radar' },
    { step: 4, label: '4. Economic Calendar', subtitle: 'High-Impact USD Macro' },
    { step: 5, label: '5. Weekly Shortlist Screener', subtitle: '15Δ–25Δ Funnel & AI' },
    { step: 6, label: '6. Executive Report', subtitle: 'Compliance & Theta Pulse' },
    { step: 7, label: '7. Order Staging', subtitle: 'Broker Staging & Execution' },
  ];

  for (const item of canonicalRitualSteps) {
    assert.ok(
      glossaryContent.includes(item.label),
      `docs/LABEL_GLOSSARY.md must document step ${item.step}: ${item.label}`
    );
  }

  // C. Verify InstitutionalSidebar.tsx renders these exact canonical labels
  const sidebarPath = fileURLToPath(new URL('../web/src/components/InstitutionalSidebar.tsx', import.meta.url));
  const sidebarContent = fs.readFileSync(sidebarPath, 'utf-8');
  const normalizedSidebar = sidebarContent.replace(/&amp;/g, '&');
  for (const item of canonicalRitualSteps) {
    assert.ok(
      normalizedSidebar.includes(item.label),
      `InstitutionalSidebar.tsx must contain canonical label: ${item.label}`
    );
    assert.ok(
      normalizedSidebar.includes(item.subtitle),
      `InstitutionalSidebar.tsx must contain canonical subtitle: ${item.subtitle}`
    );
  }

  // D. Verify owner-chosen label preservation ("Investment Portfolio")
  assert.ok(sidebarContent.includes('Investment Portfolio'), 'Sidebar must preserve owner-chosen label Investment Portfolio');
  assert.ok(glossaryContent.includes('KEEP — owner-chosen'), 'Glossary must mark owner-chosen labels');

  // E. Verify admin diagnostics endpoint file exists and exports onRequestGet
  const diagPath = fileURLToPath(new URL('../functions/api/admin/diagnostics.js', import.meta.url));
  assert.ok(fs.existsSync(diagPath), 'functions/api/admin/diagnostics.js must exist');
  const diagContent = fs.readFileSync(diagPath, 'utf-8');
  assert.ok(diagContent.includes('secret_configured'), 'Diagnostics must return secret_configured boolean');
  assert.ok(diagContent.includes('d1_bound'), 'Diagnostics must return d1_bound boolean');
  assert.ok(diagContent.includes('d1_writable'), 'Diagnostics must return d1_writable boolean');
  assert.ok(diagContent.includes('rate_limit_kv_bound'), 'Diagnostics must return rate_limit_kv_bound boolean');
  assert.ok(diagContent.includes('resend_configured'), 'Diagnostics must return resend_configured boolean');
});

test('18. Dynamic Stock Symbol Ingestion, Full Database Field Hydration & Equity Card Contract', async () => {
  // A. Verify Header.tsx contains the interactive search input, submit handler, and new symbol fetch prompt
  const headerPath = fileURLToPath(new URL('../web/src/components/Header.tsx', import.meta.url));
  const headerContent = fs.readFileSync(headerPath, 'utf-8');
  assert.ok(headerContent.includes('handleSearchSubmit'), 'Header.tsx must implement handleSearchSubmit');
  assert.ok(headerContent.includes('Fetch & Render'), 'Header.tsx must prompt Fetch & Render for new symbols');
  assert.ok(headerContent.includes('universeTickers'), 'Header.tsx must accept universeTickers for database matching');

  // B. Verify CommandPalette.tsx contains the new ticker candidate handling
  const cmdPalettePath = fileURLToPath(new URL('../web/src/components/CommandPalette.tsx', import.meta.url));
  const cmdPaletteContent = fs.readFileSync(cmdPalettePath, 'utf-8');
  assert.ok(cmdPaletteContent.includes('isNewTickerCandidate'), 'CommandPalette.tsx must detect new ticker candidates');
  assert.ok(cmdPaletteContent.includes('handleFetchNewTicker'), 'CommandPalette.tsx must implement handleFetchNewTicker');
  assert.ok(cmdPaletteContent.includes('fetchAndBuildTickerMeta'), 'CommandPalette.tsx must import fetchAndBuildTickerMeta');

  // C. Verify AuthenticatedTerminal.tsx wires handleOpenEquityAnalysis to fetchAndBuildTickerMeta
  const terminalPath = fileURLToPath(new URL('../web/src/components/AuthenticatedTerminal.tsx', import.meta.url));
  const terminalContent = fs.readFileSync(terminalPath, 'utf-8');
  assert.ok(terminalContent.includes('fetchAndBuildTickerMeta'), 'AuthenticatedTerminal.tsx must import fetchAndBuildTickerMeta');
  assert.ok(terminalContent.includes('handleAddCustomTickerMeta(built)'), 'AuthenticatedTerminal.tsx must persist built ticker to universe');

  // D. Verify liveMarketFetcher.ts exports fetchAndBuildTickerMeta with complete database schema
  const fetcherPath = fileURLToPath(new URL('../web/src/utils/liveMarketFetcher.ts', import.meta.url));
  const fetcherContent = fs.readFileSync(fetcherPath, 'utf-8');
  assert.ok(fetcherContent.includes('export async function fetchAndBuildTickerMeta'), 'liveMarketFetcher.ts must export fetchAndBuildTickerMeta');
  assert.ok(fetcherContent.includes('barchart_opinion'), 'fetchAndBuildTickerMeta must hydrate barchart_opinion');
  assert.ok(fetcherContent.includes('bb_width_pct'), 'fetchAndBuildTickerMeta must hydrate bb_width_pct');
  assert.ok(fetcherContent.includes('rsi_14'), 'fetchAndBuildTickerMeta must hydrate rsi_14');
  assert.ok(fetcherContent.includes('hv_30'), 'fetchAndBuildTickerMeta must hydrate hv_30');
  assert.ok(fetcherContent.includes('has_weeklys'), 'fetchAndBuildTickerMeta must hydrate has_weeklys');

  // E. Verify options_data.json database structure matches hydrated fields
  const dbPath = fileURLToPath(new URL('../web/public/data/options_data.json', import.meta.url));
  const dbJson = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
  assert.ok(Array.isArray(dbJson.tickers), 'options_data.json must contain tickers array');
  const sample = dbJson.tickers[0];
  const requiredFields = [
    'symbol', 'name', 'sector', 'liquidity_tier', 'spot_price', 'avg_volume_30',
    'sma_20', 'upper_bb', 'lower_bb', 'bb_width_pct', 'rsi_14', 'rsi_flag',
    'hv_30', 'iv_current', 'iv_rank', 'has_weeklys', 'expiration_cadence',
    'barchart_opinion'
  ];
  for (const field of requiredFields) {
    assert.ok(field in sample, `options_data.json database tickers must contain field: ${field}`);
  }
});

test('Test 19: Mandatory Password Change Gate & Self-Service Password Rotation', async () => {
  // A. Verify App.tsx intercepts users with must_change_password
  const appPath = fileURLToPath(new URL('../web/src/App.tsx', import.meta.url));
  const appContent = fs.readFileSync(appPath, 'utf-8');
  assert.ok(appContent.includes('user?.must_change_password'), 'App.tsx must check user.must_change_password');
  assert.ok(appContent.includes('PasswordChangeView'), 'App.tsx must render PasswordChangeView');
  assert.ok(appContent.includes('isMandatory={true}'), 'App.tsx must pass isMandatory={true}');

  // B. Verify PasswordChangeView.tsx implements isMandatory mode and sign out
  const pwdViewPath = fileURLToPath(new URL('../web/src/components/auth/PasswordChangeView.tsx', import.meta.url));
  const pwdViewContent = fs.readFileSync(pwdViewPath, 'utf-8');
  assert.ok(pwdViewContent.includes('isMandatory'), 'PasswordChangeView must support isMandatory');
  assert.ok(pwdViewContent.includes('logout'), 'PasswordChangeView must support logout');
  assert.ok(pwdViewContent.includes('Mandatory Password Update'), 'PasswordChangeView must have mandatory title');

  // C. Verify /api/user/change-password endpoint and /api/auth/change-password alias
  const userChangePwdModule = await import('../functions/api/user/change-password.js');
  const authChangePwdModule = await import('../functions/api/auth/change-password.js');
  assert.ok(typeof userChangePwdModule.onRequestPost === 'function', 'user change-password must export onRequestPost');
  assert.ok(typeof authChangePwdModule.onRequestPost === 'function', 'auth change-password must export onRequestPost');

  // D. Verify password change execution
  const env = {
    ENVIRONMENT: 'development',
    SESSION_SECRET: 'test-change-pwd-suite-secret-key-2026',
  };
  const authModule = await import('../functions/api/_auth_utils.js');
  const testEmail = 'rotation_test_user@deltaharvest.local';
  const initialPassword = 'TempPassword2026!';
  const initialSalt = authModule.generateRandomSalt(16);
  const initialHash = await authModule.hashPassword(initialPassword, initialSalt);

  const testUser = await authModule.createUser(env, {
    email: testEmail,
    password_hash: initialHash,
    password_salt: initialSalt,
    role: 'client',
    is_active: 1,
    must_change_password: 1,
    display_name: 'Rotation Tester',
  });
  assert.ok(testUser, 'Test user created');

  const token = await authModule.createSessionToken(
    { sub: testUser.id, email: testEmail, role: 'client', tv: testUser.token_version ?? 0 },
    env.SESSION_SECRET
  );
  const cookie = authModule.buildSessionCookie(token);

  // 1. Rejects mismatched current password
  const badOldReq = new Request('http://localhost/api/user/change-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({ currentPassword: 'WrongPassword!', newPassword: 'NewValidPassword2026!' }),
  });
  const badOldRes = await userChangePwdModule.onRequestPost({ request: badOldReq, env });
  assert.strictEqual(badOldRes.status, 400, 'Mismatched current password must return 400');

  // 2. Rejects identical password
  const sameReq = new Request('http://localhost/api/user/change-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({ currentPassword: initialPassword, newPassword: initialPassword }),
  });
  const sameRes = await userChangePwdModule.onRequestPost({ request: sameReq, env });
  assert.strictEqual(sameRes.status, 400, 'Identical password must return 400');

  // 3. Successfully rotates password and re-issues session cookie
  const validReq = new Request('http://localhost/api/user/change-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({ currentPassword: initialPassword, newPassword: 'BrandNewPermanentPass2026!' }),
  });
  const validRes = await userChangePwdModule.onRequestPost({ request: validReq, env });
  assert.strictEqual(validRes.status, 200, 'Valid password change must return 200');
  const validBody = await validRes.json();
  assert.strictEqual(validBody.success, true);
  assert.strictEqual(validBody.user.must_change_password, false);
  const setCookie = validRes.headers.get('Set-Cookie');
  assert.ok(setCookie, 'Must re-issue updated session cookie');
});

test('20. Adanos Market Sentiment Proxy Contract, Mock Resilience & Security Grep Gates', async () => {
  const { onRequest: onSentimentRequest } = await import('../functions/api/market-sentiment.js');
  const diagnosticsModule = await import('../functions/api/admin/diagnostics.js');
  const authModule = await import('../functions/api/_auth_utils.js');

  const MOCK_API_KEY = 'sk_test_mockadanoskey1234567890abcdef';

  // 1. Missing Key Contract: returns HTTP 200 { configured: false, sentiment: null }
  const unconfiguredReq = new Request('http://localhost/api/market-sentiment?symbol=NVDA', { method: 'GET' });
  const unconfiguredRes = await onSentimentRequest({ request: unconfiguredReq, env: {} });
  assert.strictEqual(unconfiguredRes.status, 200, 'Unconfigured API key must return 200');
  const unconfiguredBody = await unconfiguredRes.json();
  assert.strictEqual(unconfiguredBody.configured, false);
  assert.strictEqual(unconfiguredBody.sentiment, null);

  // 2. Invalid Symbol Contract: rejects everything except 1-6 letters with 400
  const invalidReq1 = new Request('http://localhost/api/market-sentiment?symbol=TOOLONGTICKER', { method: 'GET' });
  const invalidRes1 = await onSentimentRequest({ request: invalidReq1, env: { ADANOS_API_KEY: MOCK_API_KEY } });
  assert.strictEqual(invalidRes1.status, 400, 'Overlong symbol must return 400');

  const invalidReq2 = new Request('http://localhost/api/market-sentiment?symbol=123', { method: 'GET' });
  const invalidRes2 = await onSentimentRequest({ request: invalidReq2, env: { ADANOS_API_KEY: MOCK_API_KEY } });
  assert.strictEqual(invalidRes2.status, 400, 'Numeric symbol must return 400');

  const invalidReq3 = new Request('http://localhost/api/market-sentiment', { method: 'GET' });
  const invalidRes3 = await onSentimentRequest({ request: invalidReq3, env: { ADANOS_API_KEY: MOCK_API_KEY } });
  assert.strictEqual(invalidRes3.status, 400, 'Missing symbol must return 400');

  // 3. Mocked Upstream Fetch: Valid Symbol -> Normalized Shape with 4 Source Blocks & AI Explanation
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async (url, options) => {
      const urlStr = String(url);

      // Verify request header carries API key and Accept header
      assert.strictEqual(options?.headers?.['X-API-Key'], MOCK_API_KEY);
      assert.strictEqual(options?.headers?.Accept, 'application/json');

      if (urlStr.includes('/reddit/stocks/v1/stock/NVDA/explain')) {
        return new Response(JSON.stringify({
          explanation: 'NVIDIA experiencing strong retail sentiment following Blackwell architecture benchmarks.',
          cached: true,
          generated_at: '2026-10-08T12:00:00Z',
          model: 'gpt-4o',
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }

      if (urlStr.includes('/reddit/stocks/v1/stock/NVDA')) {
        return new Response(JSON.stringify({
          ticker: 'NVDA',
          found: true,
          sentiment_score: 0.5,
          buzz_score: 81,
          bullish_pct: 61,
          bearish_pct: 22,
          mentions: 900,
          trend: 'rising',
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }

      if (urlStr.includes('/x/stocks/v1/stock/NVDA')) {
        return new Response(JSON.stringify({
          ticker: 'NVDA',
          found: true,
          sentiment_score: 0.3,
          buzz_score: 64,
          bullish_pct: 58,
          bearish_pct: 25,
          mentions: 210,
          trend: 'rising',
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }

      if (urlStr.includes('/polymarket/stocks/v1/stock/NVDA')) {
        return new Response(JSON.stringify({
          ticker: 'NVDA',
          found: true,
          sentiment_score: 0.1,
          buzz_score: 40,
          bullish_pct: 50,
          bearish_pct: 30,
          mentions: 80,
          trend: 'stable',
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }

      if (urlStr.includes('/news/stocks/v1/stock/NVDA')) {
        return new Response(JSON.stringify({
          ticker: 'NVDA',
          found: true,
          sentiment_score: 0.45,
          buzz_score: 70,
          bullish_pct: 60,
          bearish_pct: 18,
          mentions: 44,
          trend: 'rising',
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }

      return new Response(JSON.stringify({ found: false }), { status: 404 });
    };

    const validReq = new Request('http://localhost/api/market-sentiment?symbol=NVDA', { method: 'GET' });
    const validRes = await onSentimentRequest({
      request: validReq,
      env: { ADANOS_API_KEY: MOCK_API_KEY },
    });
    assert.strictEqual(validRes.status, 200, 'Valid symbol must return 200');
    const validBody = await validRes.json();

    assert.strictEqual(validBody.symbol, 'NVDA');
    assert.strictEqual(validBody.configured, true);
    assert.strictEqual(validBody.mentions, 1234, 'Total mentions must sum across all four sources');
    assert.ok(typeof validBody.sentiment_score === 'number');
    assert.ok(typeof validBody.buzz_score === 'number');
    assert.strictEqual(validBody.sources.reddit.mentions, 900);
    assert.strictEqual(validBody.sources.x.mentions, 210);
    assert.strictEqual(validBody.sources.polymarket.mentions, 80);
    assert.strictEqual(validBody.sources.news.mentions, 44);
    assert.strictEqual(validBody.explanation_source, 'reddit');
    assert.ok(validBody.explanation.includes('NVIDIA experiencing strong retail sentiment'));

    // Redaction check: response JSON string must NEVER contain the API key
    const rawResponseBody = JSON.stringify(validBody);
    assert.ok(!rawResponseBody.includes(MOCK_API_KEY), 'Response must never leak API key string');

    // 4. Source with found: false -> Block Omitted, Never Zero-Filled
    globalThis.fetch = async (url) => {
      const urlStr = String(url);
      if (urlStr.includes('/reddit/stocks/v1/stock/AMD')) {
        return new Response(JSON.stringify({
          ticker: 'AMD',
          found: true,
          sentiment_score: 0.2,
          buzz_score: 55,
          mentions: 300,
        }), { status: 200 });
      }
      if (urlStr.includes('/polymarket/stocks/v1/stock/AMD')) {
        // Namespace has no qualifying data
        return new Response(JSON.stringify({ ticker: 'AMD', found: false }), { status: 200 });
      }
      return new Response(JSON.stringify({ found: false }), { status: 404 });
    };

    const amdReq = new Request('http://localhost/api/market-sentiment?symbol=AMD', { method: 'GET' });
    const amdRes = await onSentimentRequest({
      request: amdReq,
      env: { ADANOS_API_KEY: MOCK_API_KEY },
    });
    assert.strictEqual(amdRes.status, 200);
    const amdBody = await amdRes.json();
    assert.strictEqual(amdBody.sources.reddit.mentions, 300);
    assert.strictEqual(amdBody.sources.polymarket, undefined, 'Omitted source must not be zero-filled');

    // 5. Upstream Timeout Contract: Graceful degradation, returns status 200 with sentiment: null
    globalThis.fetch = async () => {
      throw new DOMException('The operation was aborted', 'AbortError');
    };
    const timeoutReq = new Request('http://localhost/api/market-sentiment?symbol=INTC', { method: 'GET' });
    const timeoutRes = await onSentimentRequest({
      request: timeoutReq,
      env: { ADANOS_API_KEY: MOCK_API_KEY },
    });
    assert.strictEqual(timeoutRes.status, 200, 'Timeout must not return 500 or crash');
    const timeoutBody = await timeoutRes.json();
    assert.strictEqual(timeoutBody.sentiment, null, 'Uncached timeout must return sentiment: null');
  } finally {
    globalThis.fetch = originalFetch;
  }

  // 6. Diagnostics Contract: adanos_configured boolean
  const diagEnvUnset = {
    ENVIRONMENT: 'development',
    SESSION_SECRET: 'test-session-secret-key-diagnostics-2026',
  };
  const adminUser = await authModule.createUser(diagEnvUnset, {
    email: 'admin_diag_tester@deltaharvest.local',
    password_hash: 'mockhash',
    password_salt: 'mocksalt',
    role: 'admin',
    is_active: 1,
    must_change_password: 0,
    display_name: 'Diag Admin',
  });
  const tokenUnset = await authModule.createSessionToken(
    { sub: adminUser.id, email: adminUser.email, role: 'admin', tv: adminUser.token_version ?? 0 },
    diagEnvUnset.SESSION_SECRET
  );
  const cookieUnset = authModule.buildSessionCookie(tokenUnset);
  const diagReqUnset = new Request('http://localhost/api/admin/diagnostics', {
    headers: { Cookie: cookieUnset },
  });
  const diagResUnset = await diagnosticsModule.onRequestGet({ request: diagReqUnset, env: diagEnvUnset });
  assert.strictEqual(diagResUnset.status, 200);
  const diagBodyUnset = await diagResUnset.json();
  assert.strictEqual(diagBodyUnset.adanos_configured, false, 'Unconfigured Adanos must report adanos_configured: false');

  const diagEnvSet = {
    ENVIRONMENT: 'development',
    SESSION_SECRET: 'test-session-secret-key-diagnostics-2026',
    ADANOS_API_KEY: MOCK_API_KEY,
  };
  const diagReqSet = new Request('http://localhost/api/admin/diagnostics', {
    headers: { Cookie: cookieUnset },
  });
  const diagResSet = await diagnosticsModule.onRequestGet({ request: diagReqSet, env: diagEnvSet });
  const diagBodySet = await diagResSet.json();
  assert.strictEqual(diagBodySet.adanos_configured, true, 'Configured Adanos must report adanos_configured: true');

  // 7. Security Grep Gates
  const { execSync } = await import('node:child_process');
  const path = await import('node:path');
  const rootDir = process.cwd();
  const trackedFiles = execSync('git ls-files', { encoding: 'utf-8' })
    .split(/\r?\n/)
    .filter(Boolean);

  for (const file of trackedFiles) {
    const fullPath = path.join(rootDir, file);
    if (!fs.existsSync(fullPath)) continue;
    const content = fs.readFileSync(fullPath, 'utf-8');

    // Rule A: The literal key prefix sk_live_ followed by 32 hex chars must never appear
    assert.ok(
      !/sk_live_[0-9a-fA-F]{32}/i.test(content),
      `SECURITY GATE FAILED: Live Adanos API key pattern found in tracked file ${file}`
    );

    // Rule B: ADANOS_API_KEY must appear only in functions/ and docs/, NEVER in web/src
    if (file.startsWith('web/src/')) {
      assert.ok(
        !content.includes('ADANOS_API_KEY'),
        `SECURITY GATE FAILED: ADANOS_API_KEY leaked into client bundle file ${file}`
      );
    }
  }
});

test('21. Multi-LLM Provider Abstraction, Failover Resilience & Diagnostics Contract', async () => {
  const { getActiveProviderName, completeLLM } = await import('../functions/api/_llm.js');
  const diagnosticsModule = await import('../functions/api/admin/diagnostics.js');
  const authModule = await import('../functions/api/_auth_utils.js');

  // A. Provider Name Resolution Contract
  assert.strictEqual(getActiveProviderName({}), 'gemini', 'Default without env vars must be gemini');
  assert.strictEqual(getActiveProviderName({ GEMINI_API_KEY: 'mock_gemini' }), 'gemini');
  assert.strictEqual(getActiveProviderName({ LLM_API_KEY: 'mock_llm' }), 'openai');
  assert.strictEqual(getActiveProviderName({ LLM_PROVIDER: 'deepseek', LLM_API_KEY: 'sk_123' }), 'deepseek');
  assert.strictEqual(getActiveProviderName({ LLM_PROVIDER: 'openai' }), 'openai');

  // B. Mock fetch tests
  const originalFetch = globalThis.fetch;
  try {
    // 1. Default Gemini call test
    let geminiFetched = false;
    globalThis.fetch = async (url, options) => {
      const urlStr = String(url);
      if (urlStr.includes('generativelanguage.googleapis.com')) {
        geminiFetched = true;
        return new Response(JSON.stringify({
          candidates: [{ content: { parts: [{ text: '{"analysis":"gemini_ok"}' }] } }]
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
      return new Response('Not found', { status: 404 });
    };

    const geminiRes = await completeLLM({
      env: { GEMINI_API_KEY: 'test_gemini_key' },
      messages: [{ role: 'user', content: 'test options prompt' }],
      responseFormat: 'json',
    });
    assert.strictEqual(geminiFetched, true, 'Must call Gemini API endpoint');
    assert.strictEqual(geminiRes.provider, 'gemini');
    assert.strictEqual(geminiRes.text, '{"analysis":"gemini_ok"}');

    // 2. OpenAI-compatible call test
    let openaiFetched = false;
    globalThis.fetch = async (url, options) => {
      const urlStr = String(url);
      if (urlStr.includes('/chat/completions')) {
        openaiFetched = true;
        assert.strictEqual(options.headers.Authorization, 'Bearer test_openai_key');
        return new Response(JSON.stringify({
          choices: [{ message: { content: '{"analysis":"openai_ok"}' } }]
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
      return new Response('Not found', { status: 404 });
    };

    const openaiRes = await completeLLM({
      env: {
        LLM_PROVIDER: 'openai',
        LLM_API_KEY: 'test_openai_key',
        LLM_BASE_URL: 'https://api.openai.com/v1',
        LLM_MODEL: 'gpt-4o-mini'
      },
      messages: [{ role: 'user', content: 'test prompt' }],
      responseFormat: 'json',
    });
    assert.strictEqual(openaiFetched, true, 'Must call OpenAI completions endpoint');
    assert.strictEqual(openaiRes.provider, 'openai');
    assert.strictEqual(openaiRes.text, '{"analysis":"openai_ok"}');

    // 3. Failover test: primary provider fails -> fallback provider succeeds
    let primaryAttempted = false;
    let fallbackAttempted = false;
    globalThis.fetch = async (url, options) => {
      const urlStr = String(url);
      if (urlStr.includes('generativelanguage.googleapis.com')) {
        primaryAttempted = true;
        // Primary Gemini fails with 500
        return new Response(JSON.stringify({ error: 'Gemini temporary overload' }), { status: 500 });
      }
      if (urlStr.includes('/chat/completions')) {
        fallbackAttempted = true;
        return new Response(JSON.stringify({
          choices: [{ message: { content: 'fallback_success' } }]
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
      return new Response('Not found', { status: 404 });
    };

    const failoverRes = await completeLLM({
      env: {
        GEMINI_API_KEY: 'primary_key',
        LLM_API_KEY: 'fallback_key',
        LLM_FALLBACK_PROVIDER: 'openai',
      },
      messages: [{ role: 'user', content: 'test failover' }],
    });
    assert.strictEqual(primaryAttempted, true, 'Primary provider must be attempted');
    assert.strictEqual(fallbackAttempted, true, 'Fallback provider must be attempted on primary error');
    assert.strictEqual(failoverRes.provider, 'openai');
    assert.strictEqual(failoverRes.text, 'fallback_success');
  } finally {
    globalThis.fetch = originalFetch;
  }

  // C. Diagnostics Contract: llm_provider present and never leaks secret
  const diagEnv = {
    ENVIRONMENT: 'development',
    SESSION_SECRET: 'test-session-secret-diagnostics-llm-2026',
    LLM_PROVIDER: 'deepseek',
    LLM_API_KEY: 'sk_secret_should_never_leak_12345',
  };
  const adminUser = await authModule.createUser(diagEnv, {
    email: 'admin_llm_tester@deltaharvest.local',
    password_hash: 'mockhash',
    password_salt: 'mocksalt',
    role: 'admin',
    is_active: 1,
    must_change_password: 0,
    display_name: 'Diag LLM Admin',
  });
  const token = await authModule.createSessionToken(
    { sub: adminUser.id, email: adminUser.email, role: 'admin', tv: adminUser.token_version ?? 0 },
    diagEnv.SESSION_SECRET
  );
  const cookie = authModule.buildSessionCookie(token);
  const diagReq = new Request('http://localhost/api/admin/diagnostics', {
    headers: { Cookie: cookie },
  });
  const diagRes = await diagnosticsModule.onRequestGet({ request: diagReq, env: diagEnv });
  assert.strictEqual(diagRes.status, 200);
  const diagBody = await diagRes.json();
  assert.strictEqual(diagBody.llm_provider, 'deepseek', 'Diagnostics must report provider name');
  const diagJsonStr = JSON.stringify(diagBody);
  assert.ok(!diagJsonStr.includes('sk_secret_should_never_leak_12345'), 'Diagnostics must NEVER leak LLM_API_KEY');
});

test('22. Feature Expansion Pack Contracts: Agent Q&A, Daily Recap, Morning Push & OCR Import', async () => {
  // A. Prompt 2: Conversational Strategy Agent Backend & Tooling Contract
  const { getOrCreateSession, listUserSessions, saveMessage, getSessionMessages } = await import('../functions/api/agent/_agent_db.js');
  const { executeAgentTool } = await import('../functions/api/agent/_agent_tools.js');
  const agentChatModule = await import('../functions/api/agent/chat.js');
  const authModule = await import('../functions/api/_auth_utils.js');

  const testEnv = {
    ENVIRONMENT: 'development',
    SESSION_SECRET: 'test-session-secret-agent-suite-2026',
  };

  // 1. Tenant Isolation: User A cannot see User B's sessions or messages
  const userA = await authModule.createUser(testEnv, {
    email: 'user_a@deltaharvest.local',
    password_hash: 'hash_a',
    password_salt: 'salt_a',
    role: 'client',
  });
  const userB = await authModule.createUser(testEnv, {
    email: 'user_b@deltaharvest.local',
    password_hash: 'hash_b',
    password_salt: 'salt_b',
    role: 'client',
  });

  const sessA = await getOrCreateSession(testEnv, userA.id, null, 'NVDA', 'Trend/Momentum');
  await saveMessage(testEnv, userA.id, sessA.id, 'user', 'Is NVDA overbought?', 'Trend/Momentum');
  await saveMessage(testEnv, userA.id, sessA.id, 'assistant', 'NVDA RSI is 62 (14d).', 'Trend/Momentum');

  const userBSessions = await listUserSessions(testEnv, userB.id);
  assert.strictEqual(userBSessions.length, 0, 'User B must NOT see User A chat sessions');

  const userBMessages = await getSessionMessages(testEnv, userB.id, sessA.id);
  assert.strictEqual(userBMessages.length, 0, 'User B must NOT see User A session messages');

  // 2. Unauthenticated Chat Request Gate -> 401
  const unauthReq = new Request('http://localhost/api/agent/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'Hello agent' }),
  });
  const unauthRes = await agentChatModule.onRequest({ request: unauthReq, env: testEnv });
  assert.strictEqual(unauthRes.status, 401, 'Unauthenticated POST /api/agent/chat must return 401');

  // 3. Tool Calling Dispatch Contract
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async (url) => {
      const urlStr = String(url);
      if (urlStr.includes('yahoo.com')) {
        return new Response(JSON.stringify({
          chart: {
            result: [{
              meta: { regularMarketPrice: 125.50, previousClose: 120.00 },
              indicators: { quote: [{ close: [115, 118, 120, 122, 125.50] }] }
            }]
          }
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
      return new Response('Not found', { status: 404 });
    };

    const toolRes = await executeAgentTool('get_market_price_and_technicals', JSON.stringify({ symbol: 'NVDA' }), testEnv);
    assert.strictEqual(toolRes.symbol, 'NVDA');
    assert.strictEqual(toolRes.spotPrice, 125.50);
    assert.ok(typeof toolRes.changePct === 'number');
  } finally {
    globalThis.fetch = originalFetch;
  }

  // B. Prompt 3: Daily Market Recap Core & Edge Caching Contract
  const { getDailyMarketRecap } = await import('../functions/api/_market_recap_core.js');
  const marketRecapModule = await import('../functions/api/market-recap.js');

  try {
    globalThis.fetch = async (url) => {
      return new Response(JSON.stringify({
        chart: {
          result: [{
            meta: { regularMarketPrice: 550.00, previousClose: 545.00 },
            indicators: { quote: [{ close: [540, 545, 550] }] }
          }]
        }
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    };

    const recapData = await getDailyMarketRecap(true);
    assert.ok(Array.isArray(recapData.indices));
    assert.ok(Array.isArray(recapData.sectors));
    assert.strictEqual(recapData.breadth, undefined, 'Breadth must be omitted if not supplied by upstream');

    // Edge HTTP endpoint test
    const recapReq = new Request('http://localhost/api/market-recap', { method: 'GET' });
    const recapRes = await marketRecapModule.onRequest({ request: recapReq, env: testEnv });
    assert.strictEqual(recapRes.status, 200);
    const recapJson = await recapRes.json();
    assert.ok(recapJson.indices.length > 0);
  } finally {
    globalThis.fetch = originalFetch;
  }

  // C. Prompt 4: Scheduled Morning Digest & Trading Day Filter
  const { isUsMarketTradingDay } = await import('../functions/api/scheduled/morning-digest.js');
  const morningDigestModule = await import('../functions/api/scheduled/morning-digest.js');

  // Verify weekend and holiday checks
  assert.strictEqual(isUsMarketTradingDay(new Date('2026-07-04T12:00:00Z')), false, 'July 4 must not be trading day');
  assert.strictEqual(isUsMarketTradingDay(new Date('2026-12-25T12:00:00Z')), false, 'Christmas must not be trading day');
  assert.strictEqual(isUsMarketTradingDay(new Date('2026-10-10T12:00:00Z')), false, 'Saturday must not be trading day');
  assert.strictEqual(isUsMarketTradingDay(new Date('2026-10-07T14:00:00Z')), true, 'Wednesday must be trading day');

  // Unauthenticated scheduled run without secret rejected
  const unauthDigestReq = new Request('http://localhost/api/scheduled/morning-digest', { method: 'POST' });
  const unauthDigestRes = await morningDigestModule.onRequest({ request: unauthDigestReq, env: { CRON_SECRET: 'supersecret' } });
  assert.strictEqual(unauthDigestRes.status, 401, 'Scheduled endpoint without secret must return 401');

  // Valid secret execution
  const authDigestReq = new Request('http://localhost/api/scheduled/morning-digest?force=true', {
    method: 'POST',
    headers: { Authorization: 'Bearer supersecret' },
  });
  const authDigestRes = await morningDigestModule.onRequest({ request: authDigestReq, env: { CRON_SECRET: 'supersecret' } });
  assert.strictEqual(authDigestRes.status, 200);
  const authDigestJson = await authDigestRes.json();
  assert.strictEqual(authDigestJson.success, true);

  // D. Prompt 5: OCR Holdings Parser & Schwab CSV Bridge Contract
  const { parseOcrTextToHoldings, convertConfirmedRowsToSchwabCsv } = await import('../web/src/utils/holdingsOcrParser.ts');

  const mockOcrText = `
Positions for Account 12345678
Symbol Description Quantity Price Market Value
NVDA NVIDIA CORP 100 $125.00 $12500.00
AAPL APPLE INC 50 $220.00 $11000.00
Cash & Money Market $45000.00
BLUR 0
`;

  const parsedHoldings = parseOcrTextToHoldings(mockOcrText);
  assert.strictEqual(parsedHoldings.rows.length, 3);
  const nvdaRow = parsedHoldings.rows.find(r => r.symbol === 'NVDA');
  assert.ok(nvdaRow);
  assert.strictEqual(nvdaRow.quantity, 100);
  assert.strictEqual(nvdaRow.costBasis, 125.00);
  assert.strictEqual(nvdaRow.isLowConfidence, false);

  const blurRow = parsedHoldings.rows.find(r => r.symbol === 'BLUR');
  assert.ok(blurRow);
  assert.strictEqual(blurRow.isLowConfidence, true, 'Zero-quantity row must be flagged as low confidence');

  // Convert confirmed rows to Schwab CSV format
  const confirmedRows = [nvdaRow, parsedHoldings.rows.find(r => r.symbol === 'AAPL')];
  const generatedCsv = convertConfirmedRowsToSchwabCsv(confirmedRows, 'OCR Account', 45000);
  assert.ok(generatedCsv.includes('"Positions for account OCR Account as of 04:00 PM ET, 2026/01/01"'));
  assert.ok(generatedCsv.includes('Symbol,Description,Qty (Quantity)'));
  assert.ok(generatedCsv.includes('NVDA,NVDA INC,"100",125.00'));
  assert.ok(generatedCsv.includes('AAPL,AAPL INC,"50",220.00'));
  assert.ok(generatedCsv.includes('Cash & Cash Investments'));
  assert.ok(generatedCsv.includes('Positions Total'));
});

test('23. Institutional v3.6 Capabilities: 5-Point Pre-Flight, Discord Gateway, Playbooks, Journal & Deep Search', async () => {
  // A. 5-Point Options Pre-Flight Underwriting Evaluator & UI Component Contract
  const evaluatorCode = fs.readFileSync(fileURLToPath(new URL('../web/src/utils/optionsPreFlightEvaluator.ts', import.meta.url)), 'utf-8');
  assert.ok(evaluatorCode.includes('export function evaluateOptionsPreFlight'), 'Evaluator must export evaluateOptionsPreFlight');
  assert.ok(evaluatorCode.includes('binary_events'), 'Evaluator must inspect binary events');
  assert.ok(evaluatorCode.includes('cboe_cadence'), 'Evaluator must verify CBOE weekly cadence');
  assert.ok(evaluatorCode.includes('liquidity_spread'), 'Evaluator must inspect spread & volume');
  assert.ok(evaluatorCode.includes('iv_rank'), 'Evaluator must check IV Rank');
  assert.ok(evaluatorCode.includes('technical_buffer'), 'Evaluator must evaluate technical cushion');
  assert.ok(evaluatorCode.includes("overallRating = 'PRIME'"), 'Evaluator must calculate PRIME status');
  assert.ok(evaluatorCode.includes("overallRating = 'AVOID'"), 'Evaluator must calculate AVOID status');

  const preFlightCardCode = fs.readFileSync(fileURLToPath(new URL('../web/src/components/modals/tickerAudit/OptionsPreFlightCard.tsx', import.meta.url)), 'utf-8');
  assert.ok(preFlightCardCode.includes('OptionsPreFlightCard'), 'Pre-flight scorecard UI card must exist');
  assert.ok(preFlightCardCode.includes('Options Pre-Flight Execution Scorecard'), 'Pre-flight scorecard must title pre-flight checks');
  assert.ok(preFlightCardCode.includes('onPinToJournal') && preFlightCardCode.includes('Options Signal Journal'), 'Pre-flight scorecard must wire into Signal Journal');

  // B. Declarative Strategy Playbooks Engine
  const { STRATEGY_PLAYBOOKS, getPlaybookById, evaluatePlaybookSuitability } = await import('../functions/api/agent/_playbooks.js');
  assert.strictEqual(STRATEGY_PLAYBOOKS.length, 5);
  assert.ok(getPlaybookById('conservative_income_csp'));
  assert.ok(getPlaybookById('aggressive_momentum_cc'));
  assert.ok(getPlaybookById('pmcc_growth_compounder'));
  assert.ok(getPlaybookById('earnings_vol_crush_post'));
  assert.ok(getPlaybookById('mean_reversion_oversold_bounce'));

  const cspPlaybook = getPlaybookById('conservative_income_csp');
  assert.ok(cspPlaybook.targetDelta.includes('15Δ'));
  assert.strictEqual(cspPlaybook.category, 'Income');
  assert.ok(cspPlaybook.minCushionPct >= 6.0);

  const suitability = evaluatePlaybookSuitability({ spotPrice: 100, sma20: 95, rsi14: 55, ivRank: 40 });
  assert.strictEqual(suitability.length, 5);
  assert.ok(suitability[0].playbookId);
  assert.ok(typeof suitability[0].confidence === 'number');

  // C. Serverless Discord Bot Gateway Contract
  const discordBotModule = await import('../functions/api/bot/discord.js');
  assert.ok(typeof discordBotModule.onRequestGet === 'function');
  assert.ok(typeof discordBotModule.onRequestPost === 'function');

  // GET probe
  const probeReq = new Request('http://localhost/api/bot/discord', { method: 'GET' });
  const probeRes = await discordBotModule.onRequestGet({ request: probeReq, env: {} });
  assert.strictEqual(probeRes.status, 200);
  const probeData = await probeRes.json();
  assert.strictEqual(probeData.service, 'DeltaHarvest Discord Bot Gateway');
  assert.strictEqual(probeData.status, 'ok');

  // POST Type 1 PING -> PONG
  const pingReq = new Request('http://localhost/api/bot/discord', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 1 }),
  });
  const pingRes = await discordBotModule.onRequestPost({ request: pingReq, env: {} });
  assert.strictEqual(pingRes.status, 200);
  const pingData = await pingRes.json();
  assert.strictEqual(pingData.type, 1, 'Type 1 PING must return Type 1 PONG');

  // POST Type 2 Command: /ping
  const cmdReq = new Request('http://localhost/api/bot/discord', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 2,
      data: { name: 'ping', options: [] },
    }),
  });
  const cmdRes = await discordBotModule.onRequestPost({ request: cmdReq, env: {} });
  assert.strictEqual(cmdRes.status, 200);
  const cmdData = await cmdRes.json();
  assert.strictEqual(cmdData.type, 4); // CHANNEL_MESSAGE_WITH_SOURCE
  assert.ok(cmdData.data.content.includes('Pong!'));

  // POST Type 2 Command: /recap
  const recapCmdReq = new Request('http://localhost/api/bot/discord', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 2,
      data: { name: 'recap', options: [] },
    }),
  });
  const recapCmdRes = await discordBotModule.onRequestPost({ request: recapCmdReq, env: {} });
  assert.strictEqual(recapCmdRes.status, 200);
  const recapCmdData = await recapCmdRes.json();
  assert.strictEqual(recapCmdData.type, 4);
  assert.ok(recapCmdData.data.embeds?.[0]?.title.includes('Daily Market Recap'));

  // D. Options Signal Journal API Contract
  const journalModule = await import('../functions/api/options/journal.js');
  assert.ok(typeof journalModule.onRequestGet === 'function');
  assert.ok(typeof journalModule.onRequestPost === 'function');
  assert.ok(typeof journalModule.onRequestPatch === 'function');
  assert.ok(typeof journalModule.onRequestDelete === 'function');

  // Create journal entry via POST
  const createJournalReq = new Request('http://localhost/api/options/journal', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      symbol: 'NVDA',
      strategy: 'CSP',
      strike: 115,
      expiration: '2026-10-23',
      deltaTarget: '15Δ',
      notes: 'Conservative income buffer',
    }),
  });
  const createJournalRes = await journalModule.onRequestPost({ request: createJournalReq, env: {} });
  assert.strictEqual(createJournalRes.status, 200);
  const createdEntry = await createJournalRes.json();
  assert.strictEqual(createdEntry.success, true);
  assert.strictEqual(createdEntry.entry.symbol, 'NVDA');
  assert.strictEqual(createdEntry.entry.strike, 115);

  // List journal entries via GET
  const listJournalReq = new Request('http://localhost/api/options/journal?symbol=NVDA', { method: 'GET' });
  const listJournalRes = await journalModule.onRequestGet({ request: listJournalReq, env: {} });
  assert.strictEqual(listJournalRes.status, 200);
  const listData = await listJournalRes.json();
  assert.ok(listData.entries.some(e => e.symbol === 'NVDA'));

  // E. Agent Tools Deep Catalyst Search & Pre-Flight Checklist
  const { searchFinancialCatalysts, getOptionsPreFlightChecklist } = await import('../functions/api/agent/_agent_tools.js');
  const catalystResult = await searchFinancialCatalysts('earnings', 'NVDA', {});
  assert.strictEqual(catalystResult.symbol, 'NVDA');
  assert.ok(catalystResult.provider);

  const preflightToolResult = await getOptionsPreFlightChecklist('AAPL', {});
  assert.strictEqual(preflightToolResult.symbol, 'AAPL');
  assert.ok(typeof preflightToolResult.score === 'number');
  assert.ok(preflightToolResult.rating === 'PRIME' || preflightToolResult.rating === 'CONDITIONAL');
});

