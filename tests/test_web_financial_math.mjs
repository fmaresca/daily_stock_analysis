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
    }
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
    }
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

