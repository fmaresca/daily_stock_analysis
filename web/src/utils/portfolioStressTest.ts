/**
 * Real-Time Portfolio Margin & "What-If" Stress Test Simulator Engine
 *
 * Models aggregate multi-asset derivatives books, stress-tests price shocks (-20% to +20%),
 * volatility surges (+100%), time decay, and compares Reg-T vs Portfolio Margin (TIMS) capital requirements.
 */

import { calculateBlackScholesOption } from './optionChainMatrix';

export type PositionType = 'STOCK' | 'CSP' | 'COVERED_CALL' | 'CREDIT_SPREAD' | 'PMCC' | 'MMF' | 'CASH';

export interface PortfolioPosition {
  id: string;
  symbol: string;
  type: PositionType;
  quantity: number; // e.g. 100 for stock, 1 for 1 contract, or cash amount
  spotPrice: number;
  strike: number;
  strike2?: number; // Long leg for spread/PMCC
  dte: number;
  entryPrice: number;
  currentOptionPrice: number;
  iv: number;
  delta: number;
  theta: number;
  vega: number;
  beta: number; // Beta to SPY
  expiration?: string;
  companyName?: string;
  gainDollar?: number;
  gainPct?: number;
  costBasisTotal?: number;
  marketValueTotal?: number;
  account?: string;
}

export interface StressScenarioResult {
  shockPricePct: number; // e.g. -10%
  shockIvPct: number; // e.g. +25%
  daysPassed: number;
  simulatedPortfolioValue: number;
  projectedPnlDollar: number;
  projectedPnlPct: number;
  totalBetaDelta: number;
  totalDailyTheta: number;
  totalVega: number;
  regTMargin: number;
  portfolioMargin: number;
  capitalReliefPct: number;
}

export interface PnlMatrixCell {
  priceShockPct: number;
  ivShockPct: number;
  pnlDollar: number;
  pnlPct: number;
}

/**
 * Real Institutional Portfolio Book: Living Trust-Options ...609
 * Extracted directly from live Charles Schwab export as of 2026/09/12.
 * Contains all 4 Core Asset Classes:
 * 1. Cash & Money Market Funds: Bank Core Cash ($299,590.53), SNYXX ($202,775.94), SNAXX ($77,341.30) -> $579,707.77 Total Liquid Cash Pool
 * 2. 7 Long Equities: AXTI, BLZE, IONQ, LUNR, NET, RTX, TSLA -> $1,825,855.00 Total Stock Equity
 * 3. 1 Open CSP: PLTR 160.00 P (-10 contracts @ $160 strike, exp 2026-09-18) -> $160,000.00 Collateral Committed (PANW 327.50P expired on 09/11)
 * 4. 6 Active Covered Calls: AXTI 70C, BLZE 17.5C (96.73% profit), IONQ 41C, NET 305C, RTX 205C, TSLA 380C
 * Total Net Liquidation Value: $2,388,228.85
 * Available Cash (before $5k weekly living deduction): $419,707.77
 * True Free Deployable Cash (after $5k weekly living deduction): $414,707.77
 */
export const LIVING_TRUST_OPTIONS_POSITIONS: PortfolioPosition[] = [
  // --- CASH & MONEY MARKET FUNDS (Total Liquid Cash: $579,707.77) ---
  {
    id: 'POS_CASH_CORE',
    symbol: 'Cash & Cash Investments',
    companyName: 'Charles Schwab Bank Deposit Sweep (Liquid Core)',
    type: 'CASH',
    quantity: 299590.53,
    spotPrice: 1.00,
    strike: 0,
    dte: 0,
    entryPrice: 1.00,
    currentOptionPrice: 0,
    iv: 0,
    delta: 0,
    theta: 0,
    vega: 0,
    beta: 0,
    costBasisTotal: 299590.53,
    marketValueTotal: 299590.53,
    gainDollar: 0,
    gainPct: 0,
    account: 'Living Trust-Options ...609',
  },
  {
    id: 'POS_MMF_SNYXX',
    symbol: 'SNYXX',
    companyName: 'Schwab New York Municipal Money Fund Ultra',
    type: 'MMF',
    quantity: 202775.94,
    spotPrice: 1.00,
    strike: 0,
    dte: 0,
    entryPrice: 1.00,
    currentOptionPrice: 0,
    iv: 0,
    delta: 0,
    theta: 0,
    vega: 0,
    beta: 0,
    costBasisTotal: 202775.94,
    marketValueTotal: 202775.94,
    gainDollar: 0,
    gainPct: 0,
    account: 'Living Trust-Options ...609',
  },
  {
    id: 'POS_MMF_SNAXX',
    symbol: 'SNAXX',
    companyName: 'Schwab Prime Advantage Money Fund Ultra',
    type: 'MMF',
    quantity: 77341.30,
    spotPrice: 1.00,
    strike: 0,
    dte: 0,
    entryPrice: 1.00,
    currentOptionPrice: 0,
    iv: 0,
    delta: 0,
    theta: 0,
    vega: 0,
    beta: 0,
    costBasisTotal: 77341.30,
    marketValueTotal: 77341.30,
    gainDollar: 0,
    gainPct: 0,
    account: 'Living Trust-Options ...609',
  },

  // --- CASH-SECURED PUTS (Active Collateral Commitment: $160,000.00 Total) ---
  {
    id: 'POS_PLTR_CSP_160',
    symbol: 'PLTR',
    type: 'CSP',
    quantity: 10, // 10 contracts = $160,000.00 collateral
    spotPrice: 168.50,
    strike: 160.00,
    dte: 6,
    expiration: '2026-09-18',
    entryPrice: 1.593, // Cost basis -$1,593.32 / 1000
    currentOptionPrice: 1.395, // Market value -$1,395.00
    iv: 42,
    delta: -0.24,
    theta: 0.12,
    vega: -0.18,
    beta: 1.45,
    gainDollar: 198.32,
    gainPct: 12.45,
    account: 'Living Trust-Options ...609',
  },

  // --- LONG EQUITIES (Total Stock Value: $1,825,855.00) ---
  {
    id: 'POS_AXTI_STOCK',
    symbol: 'AXTI',
    type: 'STOCK',
    quantity: 1500,
    spotPrice: 64.77,
    strike: 0,
    dte: 0,
    entryPrice: 120.106,
    currentOptionPrice: 0,
    iv: 55,
    delta: 1.0,
    theta: 0,
    vega: 0,
    beta: 1.25,
    costBasisTotal: 180160.13,
    marketValueTotal: 97155.00,
    gainDollar: -83005.13,
    gainPct: -46.07,
    account: 'Living Trust-Options ...609',
  },
  {
    id: 'POS_BLZE_STOCK',
    symbol: 'BLZE',
    type: 'STOCK',
    quantity: 11000,
    spotPrice: 12.40,
    strike: 0,
    dte: 0,
    entryPrice: 17.106,
    currentOptionPrice: 0,
    iv: 48,
    delta: 1.0,
    theta: 0,
    vega: 0,
    beta: 1.10,
    costBasisTotal: 188173.41,
    marketValueTotal: 136400.00,
    gainDollar: -51773.41,
    gainPct: -27.51,
    account: 'Living Trust-Options ...609',
  },
  {
    id: 'POS_IONQ_STOCK',
    symbol: 'IONQ',
    type: 'STOCK',
    quantity: 1500,
    spotPrice: 36.75,
    strike: 0,
    dte: 0,
    entryPrice: 58.876,
    currentOptionPrice: 0,
    iv: 62,
    delta: 1.0,
    theta: 0,
    vega: 0,
    beta: 1.85,
    costBasisTotal: 88315.08,
    marketValueTotal: 55125.00,
    gainDollar: -33190.08,
    gainPct: -37.58,
    account: 'Living Trust-Options ...609',
  },
  {
    id: 'POS_LUNR_STOCK',
    symbol: 'LUNR',
    type: 'STOCK',
    quantity: 5000,
    spotPrice: 14.35,
    strike: 0,
    dte: 0,
    entryPrice: 28.786,
    currentOptionPrice: 0,
    iv: 75,
    delta: 1.0,
    theta: 0,
    vega: 0,
    beta: 1.95,
    costBasisTotal: 143934.00,
    marketValueTotal: 71750.00,
    gainDollar: -72184.00,
    gainPct: -50.15,
    account: 'Living Trust-Options ...609',
  },
  {
    id: 'POS_NET_STOCK',
    symbol: 'NET',
    type: 'STOCK',
    quantity: 1300,
    spotPrice: 306.53,
    strike: 0,
    dte: 0,
    entryPrice: 292.756,
    currentOptionPrice: 0,
    iv: 34,
    delta: 1.0,
    theta: 0,
    vega: 0,
    beta: 1.35,
    costBasisTotal: 380583.72,
    marketValueTotal: 398489.00,
    gainDollar: 17905.28,
    gainPct: 4.70,
    account: 'Living Trust-Options ...609',
  },
  {
    id: 'POS_RTX_STOCK',
    symbol: 'RTX',
    type: 'STOCK',
    quantity: 1700,
    spotPrice: 197.68,
    strike: 0,
    dte: 0,
    entryPrice: 218.946,
    currentOptionPrice: 0,
    iv: 18,
    delta: 1.0,
    theta: 0,
    vega: 0,
    beta: 0.75,
    costBasisTotal: 372209.38,
    marketValueTotal: 336056.00,
    gainDollar: -36153.38,
    gainPct: -9.71,
    account: 'Living Trust-Options ...609',
  },
  {
    id: 'POS_TSLA_STOCK',
    symbol: 'TSLA',
    type: 'STOCK',
    quantity: 2000,
    spotPrice: 365.44,
    strike: 0,
    dte: 0,
    entryPrice: 393.117,
    currentOptionPrice: 0,
    iv: 45,
    delta: 1.0,
    theta: 0,
    vega: 0,
    beta: 1.65,
    costBasisTotal: 786234.08,
    marketValueTotal: 730880.00,
    gainDollar: -55354.08,
    gainPct: -7.04,
    account: 'Living Trust-Options ...609',
  },

  // --- COVERED CALLS (Active Short Calls against Holdings) ---
  {
    id: 'POS_AXTI_CC_70',
    symbol: 'AXTI',
    type: 'COVERED_CALL',
    quantity: 15,
    spotPrice: 64.77,
    strike: 70.00,
    dte: 6,
    expiration: '2026-09-18',
    entryPrice: 7.643,
    currentOptionPrice: 1.6211,
    iv: 58,
    delta: -0.28,
    theta: 0.15,
    vega: -0.12,
    beta: 1.25,
    gainDollar: 9033.11,
    gainPct: 78.79,
    account: 'Living Trust-Options ...609',
  },
  {
    id: 'POS_BLZE_CC_17_5',
    symbol: 'BLZE',
    type: 'COVERED_CALL',
    quantity: 110,
    spotPrice: 12.40,
    strike: 17.50,
    dte: 6,
    expiration: '2026-09-18',
    entryPrice: 0.993,
    currentOptionPrice: 0.0325,
    iv: 50,
    delta: -0.12,
    theta: 0.08,
    vega: -0.10,
    beta: 1.10,
    gainDollar: 10568.95,
    gainPct: 96.73, // 80% profit target hit!
    account: 'Living Trust-Options ...609',
  },
  {
    id: 'POS_IONQ_CC_41',
    symbol: 'IONQ',
    type: 'COVERED_CALL',
    quantity: 15,
    spotPrice: 36.75,
    strike: 41.00,
    dte: 6,
    expiration: '2026-09-18',
    entryPrice: 0.423,
    currentOptionPrice: 0.2808,
    iv: 65,
    delta: -0.22,
    theta: 0.14,
    vega: -0.16,
    beta: 1.85,
    gainDollar: 198.81,
    gainPct: 32.07,
    account: 'Living Trust-Options ...609',
  },
  {
    id: 'POS_NET_CC_305',
    symbol: 'NET',
    type: 'COVERED_CALL',
    quantity: 13,
    spotPrice: 306.53,
    strike: 305.00,
    dte: 6,
    expiration: '2026-09-18',
    entryPrice: 10.553,
    currentOptionPrice: 8.8689,
    iv: 35,
    delta: -0.25,
    theta: 0.22,
    vega: -0.28,
    beta: 1.35,
    gainDollar: 2189.50,
    gainPct: 15.96,
    account: 'Living Trust-Options ...609',
  },
  {
    id: 'POS_RTX_CC_205',
    symbol: 'RTX',
    type: 'COVERED_CALL',
    quantity: 17,
    spotPrice: 197.68,
    strike: 205.00,
    dte: 6,
    expiration: '2026-09-18',
    entryPrice: 0.493,
    currentOptionPrice: 0.37,
    iv: 20,
    delta: -0.19,
    theta: 0.11,
    vega: -0.18,
    beta: 0.75,
    gainDollar: 209.67,
    gainPct: 25.00,
    account: 'Living Trust-Options ...609',
  },
  {
    id: 'POS_TSLA_CC_380',
    symbol: 'TSLA',
    type: 'COVERED_CALL',
    quantity: 20,
    spotPrice: 365.44,
    strike: 380.00,
    dte: 2,
    expiration: '2026-09-14',
    entryPrice: 0.643,
    currentOptionPrice: 0.285,
    iv: 49,
    delta: -0.20,
    theta: 0.38,
    vega: -0.32,
    beta: 1.65,
    gainDollar: 716.66,
    gainPct: 55.70,
    account: 'Living Trust-Options ...609',
  },
];

// Returns real account positions for Living Trust-Options ...609
export function getSamplePortfolioBook(): PortfolioPosition[] {
  return LIVING_TRUST_OPTIONS_POSITIONS;
}

// Calculate individual position value under stress
export function simulatePosition(
  pos: PortfolioPosition,
  priceShockPct: number,
  ivShockPct: number,
  daysPassed: number
): { currentValue: number; simulatedValue: number; delta: number; theta: number; vega: number; regTMargin: number; pmMargin: number } {
  const currentSpot = pos.spotPrice;
  const newSpot = currentSpot * (1 + priceShockPct / 100.0);
  const newIv = Math.max(8, pos.iv * (1 + ivShockPct / 100.0));
  const newDte = Math.max(0, pos.dte - daysPassed);

  let currentValue = 0;
  let simulatedValue = 0;
  let delta = 0;
  let theta = 0;
  let vega = 0;
  let regTMargin = 0;
  let pmMargin = 0;

  if (pos.type === 'CASH' || pos.type === 'MMF') {
    // Cash & Money Market Funds: $1.00 constant NAV, 100% principal preservation, zero market shock risk
    currentValue = pos.marketValueTotal || pos.quantity * (pos.spotPrice || 1.0);
    simulatedValue = currentValue;
    delta = 0;
    theta = 0;
    vega = 0;
    regTMargin = 0; // Does not consume margin, acts as 100% cash collateral backing
    pmMargin = 0;
  } else if (pos.type === 'STOCK') {
    currentValue = pos.quantity * currentSpot;
    simulatedValue = pos.quantity * newSpot;
    delta = pos.quantity * pos.beta;
    regTMargin = currentValue * 0.5; // 50% Reg-T
    pmMargin = currentValue * 0.15; // 15% Portfolio Margin stress band
  } else if (pos.type === 'CSP') {
    // Short Put
    const curCalc = calculateBlackScholesOption(currentSpot, pos.strike, pos.dte, pos.iv);
    const simCalc = calculateBlackScholesOption(newSpot, pos.strike, newDte, newIv);

    currentValue = -pos.currentOptionPrice * 100 * pos.quantity;
    simulatedValue = -simCalc.putPrice * 100 * pos.quantity;

    delta = pos.quantity * curCalc.putDelta * 100 * pos.beta;
    theta = pos.quantity * -curCalc.putTheta * 100;
    vega = pos.quantity * -curCalc.vega * 100;

    // Reg-T: 100% cash secured or 20% underlying
    regTMargin = pos.strike * 100 * pos.quantity;
    // Portfolio Margin: 15% stress loss
    pmMargin = Math.max(currentSpot * 0.15 * 100 * pos.quantity, Math.abs(currentValue));
  } else if (pos.type === 'COVERED_CALL') {
    // Stock + Short Call
    const curCalc = calculateBlackScholesOption(currentSpot, pos.strike, pos.dte, pos.iv);
    const simCalc = calculateBlackScholesOption(newSpot, pos.strike, newDte, newIv);

    currentValue = (currentSpot * 100 - pos.currentOptionPrice * 100) * pos.quantity;
    simulatedValue = (newSpot * 100 - simCalc.callPrice * 100) * pos.quantity;

    delta = pos.quantity * (1.0 - curCalc.callDelta) * 100 * pos.beta;
    theta = pos.quantity * -curCalc.callTheta * 100;
    vega = pos.quantity * -curCalc.vega * 100;

    regTMargin = currentSpot * 100 * pos.quantity;
    pmMargin = currentSpot * 0.15 * 100 * pos.quantity;
  } else if (pos.type === 'CREDIT_SPREAD') {
    // Bull Put Spread
    const strikeLong = pos.strike2 || pos.strike - 10;
    const curShort = calculateBlackScholesOption(currentSpot, pos.strike, pos.dte, pos.iv);
    const curLong = calculateBlackScholesOption(currentSpot, strikeLong, pos.dte, pos.iv);

    const simShort = calculateBlackScholesOption(newSpot, pos.strike, newDte, newIv);
    const simLong = calculateBlackScholesOption(newSpot, strikeLong, newDte, newIv);

    const curNetCredit = curShort.putPrice - curLong.putPrice;
    const simNetCredit = simShort.putPrice - simLong.putPrice;

    currentValue = curNetCredit * 100 * pos.quantity;
    simulatedValue = (curNetCredit - simNetCredit) * 100 * pos.quantity;

    delta = pos.quantity * (curShort.putDelta - curLong.putDelta) * 100 * pos.beta;
    theta = pos.quantity * (curLong.putTheta - curShort.putTheta) * 100;
    vega = pos.quantity * (curLong.vega - curShort.vega) * 100;

    const spreadWidth = Math.abs(pos.strike - strikeLong) * 100;
    regTMargin = spreadWidth * pos.quantity;
    pmMargin = spreadWidth * pos.quantity * 0.70; // Risk-based haircut
  } else if (pos.type === 'PMCC') {
    // Long LEAPS Call + Short OTM Call
    const longStrike = pos.strike;
    const shortStrike = pos.strike2 || pos.strike * 1.2;

    const curLong = calculateBlackScholesOption(currentSpot, longStrike, pos.dte, pos.iv);
    const curShort = calculateBlackScholesOption(currentSpot, shortStrike, 30, pos.iv);

    const simLong = calculateBlackScholesOption(newSpot, longStrike, Math.max(0, pos.dte - daysPassed), newIv);
    const simShort = calculateBlackScholesOption(newSpot, shortStrike, Math.max(0, 30 - daysPassed), newIv);

    const curNetDebit = curLong.callPrice - curShort.callPrice;
    const simNetVal = simLong.callPrice - simShort.callPrice;

    currentValue = curNetDebit * 100 * pos.quantity;
    simulatedValue = simNetVal * 100 * pos.quantity;

    delta = pos.quantity * (curLong.callDelta - curShort.callDelta) * 100 * pos.beta;
    theta = pos.quantity * (curLong.callTheta - curShort.callTheta) * 100;
    vega = pos.quantity * (curLong.vega - curShort.vega) * 100;

    regTMargin = curNetDebit * 100 * pos.quantity;
    pmMargin = curNetDebit * 100 * pos.quantity * 0.65;
  }

  return {
    currentValue,
    simulatedValue,
    delta,
    theta,
    vega,
    regTMargin,
    pmMargin,
  };
}

// Full Portfolio Simulation Run
export function runPortfolioStressTest(
  positions: PortfolioPosition[],
  priceShockPct: number = 0,
  ivShockPct: number = 0,
  daysPassed: number = 0
): StressScenarioResult {
  let totalCurrentVal = 0;
  let totalSimVal = 0;
  let totalBetaDelta = 0;
  let totalDailyTheta = 0;
  let totalVega = 0;
  let totalRegT = 0;
  let totalPM = 0;

  for (const p of positions) {
    const res = simulatePosition(p, priceShockPct, ivShockPct, daysPassed);
    totalCurrentVal += res.currentValue;
    totalSimVal += res.simulatedValue;
    totalBetaDelta += res.delta;
    totalDailyTheta += res.theta;
    totalVega += res.vega;
    totalRegT += res.regTMargin;
    totalPM += res.pmMargin;
  }

  const projectedPnlDollar = Math.round((totalSimVal - totalCurrentVal) * 100) / 100;
  const projectedPnlPct = totalCurrentVal !== 0 ? Math.round((projectedPnlDollar / Math.abs(totalCurrentVal)) * 1000) / 10 : 0;
  const capitalReliefPct = totalRegT > 0 ? Math.round(((totalRegT - totalPM) / totalRegT) * 1000) / 10 : 0;

  return {
    shockPricePct: priceShockPct,
    shockIvPct: ivShockPct,
    daysPassed,
    simulatedPortfolioValue: Math.round(totalSimVal),
    projectedPnlDollar,
    projectedPnlPct,
    totalBetaDelta: Math.round(totalBetaDelta * 10) / 10,
    totalDailyTheta: Math.round(totalDailyTheta * 100) / 100,
    totalVega: Math.round(totalVega * 100) / 100,
    regTMargin: Math.round(totalRegT),
    portfolioMargin: Math.round(totalPM),
    capitalReliefPct,
  };
}

// Generate 2D P&L Stress Grid (-20% to +20% Price x -30% to +100% IV)
export function generatePnlStressMatrix(
  positions: PortfolioPosition[],
  daysPassed: number = 0
): PnlMatrixCell[] {
  const priceShocks = [-20, -15, -10, -5, 0, 5, 10, 15, 20];
  const ivShocks = [-30, 0, 25, 50, 100];
  const matrix: PnlMatrixCell[] = [];

  for (const iv of ivShocks) {
    for (const p of priceShocks) {
      const res = runPortfolioStressTest(positions, p, iv, daysPassed);
      matrix.push({
        priceShockPct: p,
        ivShockPct: iv,
        pnlDollar: res.projectedPnlDollar,
        pnlPct: res.projectedPnlPct,
      });
    }
  }

  return matrix;
}
