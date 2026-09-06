/**
 * Real-Time Portfolio Margin & "What-If" Stress Test Simulator Engine
 *
 * Models aggregate multi-asset derivatives books, stress-tests price shocks (-20% to +20%),
 * volatility surges (+100%), time decay, and compares Reg-T vs Portfolio Margin (TIMS) capital requirements.
 */

import { calculateBlackScholesOption } from './optionChainMatrix';

export type PositionType = 'STOCK' | 'CSP' | 'COVERED_CALL' | 'CREDIT_SPREAD' | 'PMCC';

export interface PortfolioPosition {
  id: string;
  symbol: string;
  type: PositionType;
  quantity: number; // e.g. 100 for stock, 1 for 1 contract
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
 * Extracted directly from live Charles Schwab export as of 2026/09/05.
 * Contains:
 * - 2 Open CSPs: PANW 327.50 P (-3 contracts) and PLTR 165.00 P (-10 contracts)
 * - 7 Long Equities: AXTI, BLZE, IONQ, LUNR, NET, RTX, TSLA
 * - 8 Active Covered Calls: AXTI 70C, BLZE 17.5C (84.9% profit), IONQ 43.5C, LUNR 16.5C, NET 300C, RTX 207.5C, TSLA 370C (09/09), TSLA 375C (09/11, 85.27% profit)
 */
export const LIVING_TRUST_OPTIONS_POSITIONS: PortfolioPosition[] = [
  // --- CASH-SECURED PUTS (Active Collateral Commitments: $263,250.00 Total) ---
  {
    id: 'POS_PANW_CSP_327_5',
    symbol: 'PANW',
    type: 'CSP',
    quantity: 3, // 3 contracts = $98,250.00 collateral
    spotPrice: 335.50,
    strike: 327.50,
    dte: 6,
    expiration: '2026-09-11',
    entryPrice: 6.663, // Cost basis -$1,998.96 / 300
    currentOptionPrice: 5.375, // Market value -$1,612.50
    iv: 28,
    delta: -0.22,
    theta: 0.18,
    vega: -0.25,
    beta: 1.15,
    gainDollar: 386.46,
    gainPct: 19.33,
    account: 'Living Trust-Options ...609',
  },
  {
    id: 'POS_PLTR_CSP_165',
    symbol: 'PLTR',
    type: 'CSP',
    quantity: 10, // 10 contracts = $165,000.00 collateral
    spotPrice: 170.20,
    strike: 165.00,
    dte: 6,
    expiration: '2026-09-11',
    entryPrice: 0.883, // Cost basis -$883.33 / 1000
    currentOptionPrice: 1.01, // Market value -$1,010.00
    iv: 42,
    delta: -0.24,
    theta: 0.12,
    vega: -0.18,
    beta: 1.45,
    gainDollar: -126.67,
    gainPct: -14.34,
    account: 'Living Trust-Options ...609',
  },

  // --- LONG EQUITIES (Total Value: $1,785,894.00) ---
  {
    id: 'POS_AXTI_STOCK',
    symbol: 'AXTI',
    type: 'STOCK',
    quantity: 1500,
    spotPrice: 61.64,
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
    marketValueTotal: 92460.00,
    gainDollar: -87700.13,
    gainPct: -48.68,
    account: 'Living Trust-Options ...609',
  },
  {
    id: 'POS_BLZE_STOCK',
    symbol: 'BLZE',
    type: 'STOCK',
    quantity: 11000,
    spotPrice: 13.455,
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
    marketValueTotal: 148005.00,
    gainDollar: -40168.41,
    gainPct: -21.35,
    account: 'Living Trust-Options ...609',
  },
  {
    id: 'POS_IONQ_STOCK',
    symbol: 'IONQ',
    type: 'STOCK',
    quantity: 1500,
    spotPrice: 39.52,
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
    marketValueTotal: 59280.00,
    gainDollar: -29035.08,
    gainPct: -32.88,
    account: 'Living Trust-Options ...609',
  },
  {
    id: 'POS_LUNR_STOCK',
    symbol: 'LUNR',
    type: 'STOCK',
    quantity: 5000,
    spotPrice: 14.81,
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
    marketValueTotal: 74050.00,
    gainDollar: -69884.00,
    gainPct: -48.55,
    account: 'Living Trust-Options ...609',
  },
  {
    id: 'POS_NET_STOCK',
    symbol: 'NET',
    type: 'STOCK',
    quantity: 1300,
    spotPrice: 278.92,
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
    marketValueTotal: 362596.00,
    gainDollar: -17987.72,
    gainPct: -4.73,
    account: 'Living Trust-Options ...609',
  },
  {
    id: 'POS_RTX_STOCK',
    symbol: 'RTX',
    type: 'STOCK',
    quantity: 1700,
    spotPrice: 200.79,
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
    marketValueTotal: 341343.00,
    gainDollar: -30866.38,
    gainPct: -8.29,
    account: 'Living Trust-Options ...609',
  },
  {
    id: 'POS_TSLA_STOCK',
    symbol: 'TSLA',
    type: 'STOCK',
    quantity: 2000,
    spotPrice: 354.08,
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
    marketValueTotal: 708160.00,
    gainDollar: -78074.08,
    gainPct: -9.93,
    account: 'Living Trust-Options ...609',
  },

  // --- COVERED CALLS (Active Short Calls against Holdings) ---
  {
    id: 'POS_AXTI_CC_70',
    symbol: 'AXTI',
    type: 'COVERED_CALL',
    quantity: 15,
    spotPrice: 61.64,
    strike: 70.00,
    dte: 13,
    expiration: '2026-09-18',
    entryPrice: 7.643,
    currentOptionPrice: 2.25,
    iv: 58,
    delta: -0.28,
    theta: 0.15,
    vega: -0.12,
    beta: 1.25,
    gainDollar: 8089.76,
    gainPct: 70.56,
    account: 'Living Trust-Options ...609',
  },
  {
    id: 'POS_BLZE_CC_17_5',
    symbol: 'BLZE',
    type: 'COVERED_CALL',
    quantity: 110,
    spotPrice: 13.455,
    strike: 17.50,
    dte: 13,
    expiration: '2026-09-18',
    entryPrice: 0.993,
    currentOptionPrice: 0.15,
    iv: 50,
    delta: -0.12,
    theta: 0.08,
    vega: -0.10,
    beta: 1.10,
    gainDollar: 9276.45,
    gainPct: 84.90, // 80% profit target hit!
    account: 'Living Trust-Options ...609',
  },
  {
    id: 'POS_IONQ_CC_43_5',
    symbol: 'IONQ',
    type: 'COVERED_CALL',
    quantity: 15,
    spotPrice: 39.52,
    strike: 43.50,
    dte: 6,
    expiration: '2026-09-11',
    entryPrice: 0.423,
    currentOptionPrice: 0.365,
    iv: 65,
    delta: -0.22,
    theta: 0.14,
    vega: -0.16,
    beta: 1.85,
    gainDollar: 87.51,
    gainPct: 13.78,
    account: 'Living Trust-Options ...609',
  },
  {
    id: 'POS_LUNR_CC_16_5',
    symbol: 'LUNR',
    type: 'COVERED_CALL',
    quantity: 50,
    spotPrice: 14.81,
    strike: 16.50,
    dte: 6,
    expiration: '2026-09-11',
    entryPrice: 0.083,
    currentOptionPrice: 0.13,
    iv: 80,
    delta: -0.25,
    theta: 0.16,
    vega: -0.14,
    beta: 1.95,
    gainDollar: -233.27,
    gainPct: -55.98,
    account: 'Living Trust-Options ...609',
  },
  {
    id: 'POS_NET_CC_300',
    symbol: 'NET',
    type: 'COVERED_CALL',
    quantity: 13,
    spotPrice: 278.92,
    strike: 300.00,
    dte: 6,
    expiration: '2026-09-11',
    entryPrice: 1.593,
    currentOptionPrice: 1.37,
    iv: 35,
    delta: -0.21,
    theta: 0.22,
    vega: -0.28,
    beta: 1.35,
    gainDollar: 290.31,
    gainPct: 14.02,
    account: 'Living Trust-Options ...609',
  },
  {
    id: 'POS_RTX_CC_207_5',
    symbol: 'RTX',
    type: 'COVERED_CALL',
    quantity: 17,
    spotPrice: 200.79,
    strike: 207.50,
    dte: 6,
    expiration: '2026-09-11',
    entryPrice: 0.273,
    currentOptionPrice: 0.27,
    iv: 20,
    delta: -0.19,
    theta: 0.11,
    vega: -0.18,
    beta: 0.75,
    gainDollar: 5.68,
    gainPct: 1.22,
    account: 'Living Trust-Options ...609',
  },
  {
    id: 'POS_TSLA_CC_370_0909',
    symbol: 'TSLA',
    type: 'COVERED_CALL',
    quantity: 20,
    spotPrice: 354.08,
    strike: 370.00,
    dte: 4,
    expiration: '2026-09-09',
    entryPrice: 1.383,
    currentOptionPrice: 1.09,
    iv: 48,
    delta: -0.22,
    theta: 0.35,
    vega: -0.30,
    beta: 1.65,
    gainDollar: 586.63,
    gainPct: 21.20,
    account: 'Living Trust-Options ...609',
  },
  {
    id: 'POS_TSLA_CC_375_0911',
    symbol: 'TSLA',
    type: 'COVERED_CALL',
    quantity: 20,
    spotPrice: 354.08,
    strike: 375.00,
    dte: 6,
    expiration: '2026-09-11',
    entryPrice: 9.943,
    currentOptionPrice: 1.465,
    iv: 49,
    delta: -0.20,
    theta: 0.38,
    vega: -0.32,
    beta: 1.65,
    gainDollar: 16956.25,
    gainPct: 85.27, // 80% profit target hit!
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

  if (pos.type === 'STOCK') {
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
