/**
 * Option Chain Matrix & Implied Volatility Surface Generator
 *
 * Implements high-precision Black-Scholes valuation, Greek calculations (Delta, Gamma, Theta, Vega),
 * realistic volatility skews/smirks, and straddle ladder aggregation.
 */

import { TickerMeta } from '../types/options';

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
  const T = Math.max(1, dte) / 365.0;
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
  const rho = (strike * T * expRate * normalCdf(d2)) / 100.0;

  return {
    callPrice,
    putPrice,
    callDelta,
    putDelta,
    gamma,
    callTheta,
    putTheta,
    vega,
    rho,
  };
}

// Generate true CBOE calendar Friday expirations (Weekly, Monthly, LEAPS)
export function getAvailableExpirations(): ExpirationGroup[] {
  const now = new Date();
  const expirations: ExpirationGroup[] = [];

  // 1. Next 4 Weekly Fridays
  for (let w = 1; w <= 4; w++) {
    const d = new Date(now);
    const day = d.getDay();
    const daysUntilFriday = ((5 - day + 7) % 7) || 7;
    d.setDate(d.getDate() + daysUntilFriday + (w - 1) * 7);
    d.setHours(16, 0, 0, 0);

    const diffMs = d.getTime() - now.getTime();
    const dte = Math.max(1, Math.round(diffMs / 86400000));
    const iso = d.toISOString().split('T')[0];
    const fmt = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    expirations.push({
      expiration: iso,
      dte,
      formattedDate: `[Weekly] ${fmt} (${dte}d)`,
      atmIv: 24.0 + w * 0.4,
    });
  }

  // 2. Next 3 Monthly 3rd Fridays
  for (let m = 1; m <= 3; m++) {
    const d = new Date(now.getFullYear(), now.getMonth() + m, 1);
    while (d.getDay() !== 5) {
      d.setDate(d.getDate() + 1);
    }
    d.setDate(d.getDate() + 14);
    d.setHours(16, 0, 0, 0);

    const diffMs = d.getTime() - now.getTime();
    const dte = Math.max(1, Math.round(diffMs / 86400000));
    const iso = d.toISOString().split('T')[0];
    const fmt = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    if (!expirations.some((e) => e.expiration === iso)) {
      expirations.push({
        expiration: iso,
        dte,
        formattedDate: `[Monthly] ${fmt} (${dte}d)`,
        atmIv: 25.5 + m * 0.3,
      });
    }
  }

  // 3. Long-Term LEAPS (January 3rd Friday)
  const leapsYear = now.getMonth() >= 10 ? now.getFullYear() + 2 : now.getFullYear() + 1;
  const leapsDate = new Date(leapsYear, 0, 1);
  while (leapsDate.getDay() !== 5) {
    leapsDate.setDate(leapsDate.getDate() + 1);
  }
  leapsDate.setDate(leapsDate.getDate() + 14);
  const leapsDiff = leapsDate.getTime() - now.getTime();
  const leapsDte = Math.round(leapsDiff / 86400000);
  const leapsIso = leapsDate.toISOString().split('T')[0];
  const leapsFmt = leapsDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  expirations.push({
    expiration: leapsIso,
    dte: leapsDte,
    formattedDate: `[LEAPS] ${leapsFmt} (${leapsDte}d)`,
    atmIv: 27.0,
  });

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

  const selectedExpObj = expirations.find((e) => e.dte === selectedDte) || expirations[3]; // Default ~30d
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
      rho: Math.round(putCalc.rho * 100) / 100,
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
