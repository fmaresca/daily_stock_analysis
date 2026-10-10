/**
 * Real-Time Portfolio Margin & "What-If" Stress Test Simulator Engine
 *
 * Models aggregate multi-asset derivatives books, stress-tests price shocks (-20% to +20%),
 * volatility surges (+100%), time decay, and compares Reg-T vs Portfolio Margin (TIMS) capital requirements.
 */

import { calculateBlackScholesOption } from './optionChainMatrix.ts';
import { isOptionExpired } from './optionExpirationEngine.ts';

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
  taxRegime?: 'section1256' | 'equityOption' | 'unclear';
  regimeBadge?: '§1256' | 'Equity option' | 'Needs review';
  authority?: string;
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
 * Sample Synthetic Institutional Positions (DEMO Only)
 * Used strictly for offline sandbox calculations and demo rendering.
 * Real portfolio data loads per-user from the server after authentication.
 */
export const LIVING_TRUST_OPTIONS_POSITIONS: PortfolioPosition[] = [
  {
    id: 'DEMO_POS_CASH',
    symbol: 'Cash & Cash Investments',
    companyName: 'Institutional Treasury Cash (Demo)',
    type: 'CASH',
    quantity: 100000.00,
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
    costBasisTotal: 100000.00,
    marketValueTotal: 100000.00,
    gainDollar: 0,
    gainPct: 0,
    account: 'DEMO-Portfolio',
  },
];

// Returns sample demo positions
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

  // Expired option contracts are excluded from live P&L, greeks, and margin math
  const isDerivative = pos.type !== 'STOCK' && pos.type !== 'CASH' && pos.type !== 'MMF';
  if (isDerivative && isOptionExpired(pos.expiration, pos.dte)) {
    return {
      currentValue: 0,
      simulatedValue: 0,
      delta: 0,
      theta: 0,
      vega: 0,
      regTMargin: 0,
      pmMargin: 0,
    };
  }

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
    // Short Put (Cash-Secured Put)
    const curCalc = calculateBlackScholesOption(currentSpot, pos.strike, pos.dte, pos.iv);
    const simCalc = calculateBlackScholesOption(newSpot, pos.strike, newDte, newIv);

    currentValue = -pos.currentOptionPrice * 100 * pos.quantity;
    simulatedValue = -simCalc.putPrice * 100 * pos.quantity;

    // Short Put has positive delta exposure (bullish income strategy)
    delta = pos.quantity * Math.abs(curCalc.putDelta) * 100 * pos.beta;
    theta = pos.quantity * -curCalc.putTheta * 100;
    vega = pos.quantity * -curCalc.vega * 100;

    // Reg-T: 100% cash secured (Strike * 100 * contracts)
    regTMargin = pos.strike * 100 * pos.quantity;
    // Portfolio Margin: 15% stress loss
    pmMargin = Math.max(currentSpot * 0.15 * 100 * pos.quantity, Math.abs(currentValue));
  } else if (pos.type === 'COVERED_CALL') {
    // Short Call Option Leg (underlying stock equity is accounted for separately in STOCK positions)
    const curCalc = calculateBlackScholesOption(currentSpot, pos.strike, pos.dte, pos.iv);
    const simCalc = calculateBlackScholesOption(newSpot, pos.strike, newDte, newIv);

    currentValue = -pos.currentOptionPrice * 100 * pos.quantity;
    simulatedValue = -simCalc.callPrice * 100 * pos.quantity;

    // Short Call has negative delta (hedges/reduces underlying stock long delta)
    delta = -pos.quantity * curCalc.callDelta * 100 * pos.beta;
    theta = pos.quantity * -curCalc.callTheta * 100;
    vega = pos.quantity * -curCalc.vega * 100;

    // Covered Call is 100% covered by long shares in account, zero additional naked call margin
    regTMargin = 0;
    pmMargin = 0;
  } else if (pos.type === 'CREDIT_SPREAD') {
    // Bull Put Spread
    const strikeLong = pos.strike2 || pos.strike - 10;
    const curShort = calculateBlackScholesOption(currentSpot, pos.strike, pos.dte, pos.iv);
    const curLong = calculateBlackScholesOption(currentSpot, strikeLong, pos.dte, pos.iv);

    const simShort = calculateBlackScholesOption(newSpot, pos.strike, newDte, newIv);
    const simLong = calculateBlackScholesOption(newSpot, strikeLong, newDte, newIv);

    const curNetValue = -(curShort.putPrice - curLong.putPrice) * 100 * pos.quantity;
    const simNetValue = -(simShort.putPrice - simLong.putPrice) * 100 * pos.quantity;

    currentValue = curNetValue;
    simulatedValue = simNetValue;

    // Bull Put Spread is net bullish (positive delta): short put delta (positive) + long put delta (negative)
    delta = pos.quantity * (Math.abs(curShort.putDelta) - Math.abs(curLong.putDelta)) * 100 * pos.beta;
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
