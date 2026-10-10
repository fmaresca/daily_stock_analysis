/**
 * Option Chain Matrix & Implied Volatility Surface Generator
 *
 * Implements high-precision Black-Scholes valuation, Greek calculations (Delta, Gamma, Theta, Vega),
 * realistic volatility skews/smirks, and straddle ladder aggregation.
 */

import type { TickerMeta } from '../types/options.ts';
import { now, getPartsET, todayET, isExpiredOption } from './appNow.ts';

export interface OptionContractData {
  symbol: string;
  underlyingSymbol: string;
  strike: number;
  expiration: string;
  dte: number;
  type: 'CALL' | 'PUT';
  bid: number;
  ask: number;
  mid: number;
  last: number;
  volume: number;
  openInterest: number;
  iv: number; // percentage, e.g. 28.5
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  rho: number;
  inTheMoney: boolean;
  intrinsicValue: number;
  extrinsicValue: number;
}

export interface StraddleRow {
  strike: number;
  call: OptionContractData;
  put: OptionContractData;
  inTheMoneyCall: boolean;
  inTheMoneyPut: boolean;
  isNearMoney: boolean;
}

export interface ExpirationGroup {
  expiration: string;
  dte: number;
  formattedDate: string;
  atmIv: number;
}

export interface OptionChainMatrixResult {
  symbol: string;
  spotPrice: number;
  expirations: ExpirationGroup[];
  selectedExpiration: string;
  selectedDte: number;
  rows: StraddleRow[];
  atmIv: number;
  callSkewAvg: number;
  putSkewAvg: number;
  ivSmilePoints: { strike: number; callIv: number; putIv: number }[];
}

// Standard Normal CDF (Abramowitz & Stegun approximation)
function normalCdf(x: number): number {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = x < 0 ? -1 : 1;
  const absX = Math.abs(x) / Math.sqrt(2.0);
  const t = 1.0 / (1.0 + p * absX);
  const erf = 1.0 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-absX * absX);

  return 0.5 * (1.0 + sign * erf);
}

// Standard Normal PDF
function normalPdf(x: number): number {
  return (1.0 / Math.sqrt(2.0 * Math.PI)) * Math.exp(-0.5 * x * x);
}

// Black-Scholes Calculator with full Greeks
export function calculateBlackScholesOption(
  spot: number,
  strike: number,
  dte: number,
  volatilityPct: number,
  rate: number = 0.045, // 4.5% Risk-free rate
  dividendYield: number = 0.012
) {
  const safeDte = Math.max(0.001, dte);
  const T = safeDte / 365.0;
  const sigma = Math.max(0.05, volatilityPct / 100.0);

  const d1 = (Math.log(spot / strike) + (rate - dividendYield + 0.5 * sigma * sigma) * T) / (sigma * Math.sqrt(T));
  const d2 = d1 - sigma * Math.sqrt(T);

  const expYield = Math.exp(-dividendYield * T);
  const expRate = Math.exp(-rate * T);

  // Prices
  const callPrice = Math.max(0.01, spot * expYield * normalCdf(d1) - strike * expRate * normalCdf(d2));
  const putPrice = Math.max(0.01, strike * expRate * normalCdf(-d2) - spot * expYield * normalCdf(-d1));

  // Greeks
  const callDelta = expYield * normalCdf(d1);
  const putDelta = expYield * (normalCdf(d1) - 1.0);

  const gamma = (expYield * normalPdf(d1)) / (spot * sigma * Math.sqrt(T));

  const term1 = -((spot * expYield * normalPdf(d1) * sigma) / (2.0 * Math.sqrt(T)));
  const callTheta = (term1 - rate * strike * expRate * normalCdf(d2) + dividendYield * spot * expYield * normalCdf(d1)) / 365.0;
  const putTheta = (term1 + rate * strike * expRate * normalCdf(-d2) - dividendYield * spot * expYield * normalCdf(-d1)) / 365.0;

  const vega = (spot * expYield * normalPdf(d1) * Math.sqrt(T)) / 100.0; // Per 1% IV change
  const callRho = (strike * T * expRate * normalCdf(d2)) / 100.0;
  const putRho = (-strike * T * expRate * normalCdf(-d2)) / 100.0;

  return {
    callPrice,
    putPrice,
    callDelta,
    putDelta,
    gamma,
    callTheta,
    putTheta,
    vega,
    rho: callRho,
    callRho,
    putRho,
  };
}

// Generate true CBOE calendar Friday expirations (Weekly, Monthly, LEAPS)
// Purges any expired options so dead strikes never render
export function getAvailableExpirations(): ExpirationGroup[] {
  const currentNow = now();
  const curET = getPartsET(currentNow);
  const expirations: ExpirationGroup[] = [];

  // 1. Next 6 Weekly Fridays (skipping today if expired past 4:00 PM ET close)
  for (let w = 0; w <= 5; w++) {
    let daysUntilFriday = (5 - curET.dayOfWeek + 7) % 7;
    if (curET.dayOfWeek === 5 && (curET.hours > 16 || (curET.hours === 16 && (curET.minutes > 0 || curET.seconds > 0)))) {
      daysUntilFriday = 7;
    }
    const daysOffset = daysUntilFriday + w * 7;
    // wall-clock-ok: calendar arithmetic anchored to central authority curET
    const target = new Date(Date.UTC(curET.year, curET.month - 1, curET.day + daysOffset, 12, 0, 0));
    const targetYmd = target.toISOString().split('T')[0];

    // Drop expired contracts
    if (isExpiredOption(targetYmd, currentNow)) {
      continue;
    }

    const curMidnight = Date.UTC(curET.year, curET.month - 1, curET.day);
    const expMidnight = Date.UTC(target.getUTCFullYear(), target.getUTCMonth(), target.getUTCDate());
    const dte = Math.max(0, Math.round((expMidnight - curMidnight) / 86400000));
    const fmt = target.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });

    if (!expirations.some((e) => e.expiration === targetYmd)) {
      expirations.push({
        expiration: targetYmd,
        dte,
        formattedDate: `[Weekly] ${fmt} (${dte}d)`,
        atmIv: 24.0 + (w + 1) * 0.4,
      });
    }
  }

  // 2. Next 3 Monthly 3rd Fridays
  for (let m = 1; m <= 3; m++) {
    // wall-clock-ok: calendar arithmetic anchored to central authority curET
    const targetMonthDate = new Date(Date.UTC(curET.year, curET.month - 1 + m, 1, 12, 0, 0));
    const firstFriOffset = (5 - targetMonthDate.getUTCDay() + 7) % 7;
    // wall-clock-ok: calendar arithmetic anchored to central authority curET
    const thirdFriDate = new Date(Date.UTC(targetMonthDate.getUTCFullYear(), targetMonthDate.getUTCMonth(), 1 + firstFriOffset + 14, 12, 0, 0));
    const iso = thirdFriDate.toISOString().split('T')[0];

    if (!isExpiredOption(iso, currentNow) && !expirations.some((e) => e.expiration === iso)) {
      const curMidnight = Date.UTC(curET.year, curET.month - 1, curET.day);
      const expMidnight = Date.UTC(thirdFriDate.getUTCFullYear(), thirdFriDate.getUTCMonth(), thirdFriDate.getUTCDate());
      const dte = Math.max(0, Math.round((expMidnight - curMidnight) / 86400000));
      const fmt = thirdFriDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });

      expirations.push({
        expiration: iso,
        dte,
        formattedDate: `[Monthly] ${fmt} (${dte}d)`,
        atmIv: 25.5 + m * 0.3,
      });
    }
  }

  // 3. Long-Term LEAPS (January 3rd Friday)
  const leapsYear = curET.month >= 10 ? curET.year + 2 : curET.year + 1;
  // wall-clock-ok: calendar arithmetic anchored to central authority curET
  const jan1 = new Date(Date.UTC(leapsYear, 0, 1, 12, 0, 0));
  const janFirstFriOffset = (5 - jan1.getUTCDay() + 7) % 7;
  // wall-clock-ok: calendar arithmetic anchored to central authority curET
  const leapsThirdFri = new Date(Date.UTC(leapsYear, 0, 1 + janFirstFriOffset + 14, 12, 0, 0));
  const leapsIso = leapsThirdFri.toISOString().split('T')[0];

  if (!isExpiredOption(leapsIso, currentNow) && !expirations.some((e) => e.expiration === leapsIso)) {
    const curMidnight = Date.UTC(curET.year, curET.month - 1, curET.day);
    const expMidnight = Date.UTC(leapsThirdFri.getUTCFullYear(), leapsThirdFri.getUTCMonth(), leapsThirdFri.getUTCDate());
    const leapsDte = Math.max(0, Math.round((expMidnight - curMidnight) / 86400000));
    const leapsFmt = leapsThirdFri.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });

    expirations.push({
      expiration: leapsIso,
      dte: leapsDte,
      formattedDate: `[LEAPS] ${leapsFmt} (${leapsDte}d)`,
      atmIv: 27.0,
    });
  }

  return expirations.sort((a, b) => a.dte - b.dte);
}


// Generate full strike straddle matrix
export function generateOptionChainMatrix(
  ticker: TickerMeta,
  selectedDte: number = 30
): OptionChainMatrixResult {
  const spot = ticker.spot_price > 0 ? ticker.spot_price : 100;
  const baseIv = ticker.iv_rank ? Math.max(15, ticker.iv_rank * 0.4 + 16) : 25;
  const expirations = getAvailableExpirations();

  if (expirations.length === 0) {
    return {
      symbol: ticker.symbol,
      spotPrice: spot,
      selectedExpiration: 'All expirations expired',
      selectedDte: 0,
      expirations: [],
      rows: [],
      ivSmilePoints: [],
      atmIv: baseIv,
      callSkewAvg: baseIv,
      putSkewAvg: baseIv,
    };
  }

  // Select nearest non-expired expiration if requested selectedDte not found
  const selectedExpObj = expirations.find((e) => e.dte === selectedDte) || expirations[0];
  const dte = selectedExpObj.dte;
  const expDateStr = selectedExpObj.expiration;

  // Determine strike step size
  let strikeStep = 1;
  if (spot >= 500) strikeStep = 10;
  else if (spot >= 200) strikeStep = 5;
  else if (spot >= 100) strikeStep = 2.5;
  else if (spot >= 30) strikeStep = 1;
  else strikeStep = 0.5;

  const atmStrike = Math.round(spot / strikeStep) * strikeStep;
  const numSteps = 15; // 15 strikes below, ATM, 15 strikes above (31 total)

  const strikes: number[] = [];
  for (let i = -numSteps; i <= numSteps; i++) {
    const strike = Math.round((atmStrike + i * strikeStep) * 100) / 100;
    if (strike > 0) strikes.push(strike);
  }

  const rows: StraddleRow[] = [];
  const ivSmilePoints: { strike: number; callIv: number; putIv: number }[] = [];

  let callSkewSum = 0;
  let putSkewSum = 0;

  for (const strike of strikes) {
    const moneyness = strike / spot;
    // Volatility Skew: Puts have negative skew (higher IV at lower strikes), Calls flatten
    let putIv = baseIv * (1 + Math.max(-0.25, (1.0 - moneyness) * 0.85));
    let callIv = baseIv * (1 + (moneyness > 1 ? (moneyness - 1.0) * 0.35 : (1.0 - moneyness) * 0.5));

    putIv = Math.round(Math.max(10, Math.min(120, putIv)) * 10) / 10;
    callIv = Math.round(Math.max(10, Math.min(120, callIv)) * 10) / 10;

    ivSmilePoints.push({ strike, callIv, putIv });
    callSkewSum += callIv;
    putSkewSum += putIv;

    // Greek & Price Computation
    const callCalc = calculateBlackScholesOption(spot, strike, dte, callIv);
    const putCalc = calculateBlackScholesOption(spot, strike, dte, putIv);

    const callMid = Math.round(callCalc.callPrice * 100) / 100;
    const putMid = Math.round(putCalc.putPrice * 100) / 100;

    // Spread width based on liquidity tier
    const spreadPct = ticker.liquidity_tier === 'Tier 1' ? 0.02 : ticker.liquidity_tier === 'Tier 2' ? 0.05 : 0.10;
    const callHalfSpread = Math.max(0.01, Math.round(callMid * spreadPct * 100) / 100);
    const putHalfSpread = Math.max(0.01, Math.round(putMid * spreadPct * 100) / 100);

    const isNearMoney = Math.abs(strike - spot) <= strikeStep;

    // Volume & Open Interest estimation
    const distFromAtm = Math.abs(strike - atmStrike) / strikeStep;
    const baseVolume = ticker.liquidity_tier === 'Tier 1' ? 3500 : 800;
    const callVol = Math.max(12, Math.round(baseVolume * Math.exp(-distFromAtm * 0.18)));
    const putVol = Math.max(15, Math.round(baseVolume * 1.2 * Math.exp(-distFromAtm * 0.15)));
    const callOi = callVol * 14;
    const putOi = putVol * 18;

    const callContract: OptionContractData = {
      symbol: `${ticker.symbol} ${expDateStr} C${strike}`,
      underlyingSymbol: ticker.symbol,
      strike,
      expiration: expDateStr,
      dte,
      type: 'CALL',
      bid: Math.max(0.01, Math.round((callMid - callHalfSpread) * 100) / 100),
      ask: Math.round((callMid + callHalfSpread) * 100) / 100,
      mid: callMid,
      last: callMid,
      volume: callVol,
      openInterest: callOi,
      iv: callIv,
      delta: Math.round(callCalc.callDelta * 1000) / 1000,
      gamma: Math.round(callCalc.gamma * 1000) / 1000,
      theta: Math.round(callCalc.callTheta * 100) / 100,
      vega: Math.round(callCalc.vega * 100) / 100,
      rho: Math.round(callCalc.rho * 100) / 100,
      inTheMoney: strike < spot,
      intrinsicValue: Math.max(0, Math.round((spot - strike) * 100) / 100),
      extrinsicValue: Math.round(Math.max(0, callMid - Math.max(0, spot - strike)) * 100) / 100,
    };

    const putContract: OptionContractData = {
      symbol: `${ticker.symbol} ${expDateStr} P${strike}`,
      underlyingSymbol: ticker.symbol,
      strike,
      expiration: expDateStr,
      dte,
      type: 'PUT',
      bid: Math.max(0.01, Math.round((putMid - putHalfSpread) * 100) / 100),
      ask: Math.round((putMid + putHalfSpread) * 100) / 100,
      mid: putMid,
      last: putMid,
      volume: putVol,
      openInterest: putOi,
      iv: putIv,
      delta: Math.round(putCalc.putDelta * 1000) / 1000,
      gamma: Math.round(putCalc.gamma * 1000) / 1000,
      theta: Math.round(putCalc.putTheta * 100) / 100,
      vega: Math.round(putCalc.vega * 100) / 100,
      rho: Math.round(putCalc.putRho * 100) / 100,
      inTheMoney: strike > spot,
      intrinsicValue: Math.max(0, Math.round((strike - spot) * 100) / 100),
      extrinsicValue: Math.round(Math.max(0, putMid - Math.max(0, strike - spot)) * 100) / 100,
    };

    rows.push({
      strike,
      call: callContract,
      put: putContract,
      inTheMoneyCall: callContract.inTheMoney,
      inTheMoneyPut: putContract.inTheMoney,
      isNearMoney,
    });
  }

  return {
    symbol: ticker.symbol,
    spotPrice: spot,
    expirations,
    selectedExpiration: expDateStr,
    selectedDte: dte,
    rows,
    atmIv: baseIv,
    callSkewAvg: Math.round((callSkewSum / strikes.length) * 10) / 10,
    putSkewAvg: Math.round((putSkewSum / strikes.length) * 10) / 10,
    ivSmilePoints,
  };
}
