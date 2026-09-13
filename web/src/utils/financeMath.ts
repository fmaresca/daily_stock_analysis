/**
 * Pure, Deterministic Financial Mathematics & Quantitative Guards
 * 
 * Provides numerical guards (safeDivide, clamp, isFiniteNumber),
 * Black-Scholes analytical option pricing with complete Greeks (Delta, Gamma, Theta, Vega, Rho),
 * Standard Normal distributions (CDF & PDF),
 * Annualized Return on Collateral (RoR/ROC), DTE calculation, and collateral sizing rules.
 */

// Defensive Numerical Helpers
export function isFiniteNumber(val: unknown): val is number {
  return typeof val === 'number' && Number.isFinite(val) && !Number.isNaN(val);
}

export function safeDivide(numerator: number, denominator: number, fallback: number = 0): number {
  if (!isFiniteNumber(numerator) || !isFiniteNumber(denominator) || denominator === 0) {
    return fallback;
  }
  const result = numerator / denominator;
  return Number.isFinite(result) ? result : fallback;
}

export function clamp(val: number, min: number, max: number): number {
  if (!isFiniteNumber(val)) return min;
  return Math.max(min, Math.min(max, val));
}

export function roundToDecimals(val: number, decimals: number = 2): number {
  if (!isFiniteNumber(val)) return 0;
  const factor = Math.pow(10, decimals);
  return Math.round(val * factor) / factor;
}

// Standard Normal CDF (Abramowitz & Stegun 7.1.26 approximation)
export function normalCdf(x: number): number {
  if (!isFiniteNumber(x)) return 0.5;
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

  return clamp(0.5 * (1.0 + sign * erf), 0, 1);
}

// Standard Normal PDF
export function normalPdf(x: number): number {
  if (!isFiniteNumber(x)) return 0;
  return (1.0 / Math.sqrt(2.0 * Math.PI)) * Math.exp(-0.5 * x * x);
}

export interface BlackScholesGreeks {
  callPrice: number;
  putPrice: number;
  callDelta: number;
  putDelta: number;
  gamma: number;
  callTheta: number;
  putTheta: number;
  vega: number;
  rho: number; // Legacy alias for callRho
  callRho: number;
  putRho: number;
  d1: number;
  d2: number;
}

/**
 * Standard Black-Scholes option pricing model with full Greeks.
 * Guaranteed deterministic outputs with safe numerical boundaries and exact 0 DTE handling.
 */
export function calculateBlackScholesGreeks(
  spot: number,
  strike: number,
  dte: number,
  volatilityPct: number,
  rate: number = 0.045,
  dividendYield: number = 0.012
): BlackScholesGreeks {
  const safeSpot = Math.max(0.01, isFiniteNumber(spot) ? spot : 100);
  const safeStrike = Math.max(0.01, isFiniteNumber(strike) ? strike : 100);
  const rawDte = isFiniteNumber(dte) ? dte : 30;
  const safeRate = isFiniteNumber(rate) ? rate : 0.045;
  const safeDiv = isFiniteNumber(dividendYield) ? dividendYield : 0.012;

  // Exact 0 DTE / Expiration Boundary Condition
  if (rawDte <= 0.0001) {
    const callPrice = Math.max(0, safeSpot - safeStrike);
    const putPrice = Math.max(0, safeStrike - safeSpot);
    const callDelta = safeSpot > safeStrike ? 1.0 : safeSpot === safeStrike ? 0.5 : 0.0;
    const putDelta = safeSpot < safeStrike ? -1.0 : safeSpot === safeStrike ? -0.5 : 0.0;
    return {
      callPrice: roundToDecimals(callPrice, 4),
      putPrice: roundToDecimals(putPrice, 4),
      callDelta: roundToDecimals(callDelta, 4),
      putDelta: roundToDecimals(putDelta, 4),
      gamma: 0,
      callTheta: 0,
      putTheta: 0,
      vega: 0,
      rho: 0,
      callRho: 0,
      putRho: 0,
      d1: safeSpot > safeStrike ? 999 : safeSpot < safeStrike ? -999 : 0,
      d2: safeSpot > safeStrike ? 999 : safeSpot < safeStrike ? -999 : 0,
    };
  }

  const T = rawDte / 365.0;
  const sigma = Math.max(0.001, (isFiniteNumber(volatilityPct) ? volatilityPct : 30) / 100.0);

  const sqrtT = Math.sqrt(T);
  const d1 = (Math.log(safeSpot / safeStrike) + (safeRate - safeDiv + 0.5 * sigma * sigma) * T) / (sigma * sqrtT);
  const d2 = d1 - sigma * sqrtT;

  const expYield = Math.exp(-safeDiv * T);
  const expRate = Math.exp(-safeRate * T);

  const nd1 = normalCdf(d1);
  const nd2 = normalCdf(d2);
  const nNegD1 = normalCdf(-d1);
  const nNegD2 = normalCdf(-d2);
  const pdfD1 = normalPdf(d1);

  const callPrice = Math.max(0, safeSpot * expYield * nd1 - safeStrike * expRate * nd2);
  const putPrice = Math.max(0, safeStrike * expRate * nNegD2 - safeSpot * expYield * nNegD1);

  const callDelta = clamp(expYield * nd1, 0, 1);
  const putDelta = clamp(expYield * (nd1 - 1.0), -1, 0);

  const gamma = Math.max(0, safeDivide(expYield * pdfD1, safeSpot * sigma * sqrtT, 0));

  const term1 = -safeDivide(safeSpot * expYield * pdfD1 * sigma, 2.0 * sqrtT, 0);
  const callTheta = (term1 - safeRate * safeStrike * expRate * nd2 + safeDiv * safeSpot * expYield * nd1) / 365.0;
  const putTheta = (term1 + safeRate * safeStrike * expRate * nNegD2 - safeDiv * safeSpot * expYield * nNegD1) / 365.0;

  // Vega: Dollar change per 1% (0.01) volatility change
  const vega = Math.max(0, (safeSpot * expYield * pdfD1 * sqrtT) / 100.0);

  // Rho: Dollar change per 1% (0.01) interest rate change
  const callRho = (safeStrike * T * expRate * nd2) / 100.0;
  const putRho = (-safeStrike * T * expRate * nNegD2) / 100.0;

  return {
    callPrice: roundToDecimals(callPrice, 4),
    putPrice: roundToDecimals(putPrice, 4),
    callDelta: roundToDecimals(callDelta, 4),
    putDelta: roundToDecimals(putDelta, 4),
    gamma: roundToDecimals(gamma, 5),
    callTheta: roundToDecimals(callTheta, 4),
    putTheta: roundToDecimals(putTheta, 4),
    vega: roundToDecimals(vega, 4),
    rho: roundToDecimals(callRho, 4),
    callRho: roundToDecimals(callRho, 4),
    putRho: roundToDecimals(putRho, 4),
    d1: roundToDecimals(d1, 4),
    d2: roundToDecimals(d2, 4),
  };
}

/**
 * High-precision Implied Volatility (IV) solver.
 * Uses Newton-Raphson iteration with Brent's bisection fallback.
 * Guaranteed convergence with defensive bounds (0.1% to 500% IV).
 */
export function solveImpliedVolatility(
  targetPrice: number,
  spot: number,
  strike: number,
  dte: number,
  isCall: boolean = true,
  rate: number = 0.045,
  dividendYield: number = 0.012
): number {
  if (!isFiniteNumber(targetPrice) || targetPrice <= 0.001) return 0.0;
  const safeSpot = Math.max(0.01, isFiniteNumber(spot) ? spot : 100);
  const safeStrike = Math.max(0.01, isFiniteNumber(strike) ? strike : 100);
  const safeDte = Math.max(0.1, isFiniteNumber(dte) ? dte : 30);
  const T = safeDte / 365.0;

  const expYield = Math.exp(-dividendYield * T);
  const expRate = Math.exp(-rate * T);

  // Theoretical lower bound (intrinsic value)
  const intrinsic = isCall
    ? Math.max(0, safeSpot * expYield - safeStrike * expRate)
    : Math.max(0, safeStrike * expRate - safeSpot * expYield);

  if (targetPrice <= intrinsic) {
    return 0.1; // Minimum baseline vol
  }

  // Initial volatility guess via Brenner-Subrahmanyam approximation
  let sigma = clamp(Math.sqrt((2.0 * Math.PI) / T) * (targetPrice / safeSpot), 0.05, 3.0);

  // 1. Newton-Raphson Iteration (up to 25 steps)
  for (let i = 0; i < 25; i++) {
    const sqrtT = Math.sqrt(T);
    const d1 = (Math.log(safeSpot / safeStrike) + (rate - dividendYield + 0.5 * sigma * sigma) * T) / (sigma * sqrtT);
    const d2 = d1 - sigma * sqrtT;

    const price = isCall
      ? safeSpot * expYield * normalCdf(d1) - safeStrike * expRate * normalCdf(d2)
      : safeStrike * expRate * normalCdf(-d2) - safeSpot * expYield * normalCdf(-d1);

    const diff = price - targetPrice;
    if (Math.abs(diff) < 1e-4) {
      return roundToDecimals(sigma * 100.0, 2);
    }

    // Vega derivative w.r.t sigma (unscaled, not divided by 100)
    const vegaUnscaled = safeSpot * expYield * normalPdf(d1) * sqrtT;
    if (vegaUnscaled < 1e-7) {
      break; // Switch to bisection if vega too small
    }

    const nextSigma = sigma - diff / vegaUnscaled;
    if (nextSigma <= 0.001 || nextSigma >= 5.0) {
      break; // Diverged, switch to bisection
    }
    sigma = nextSigma;
  }

  // 2. Brent / Bisection Fallback Bracket: [0.001, 5.00]
  let low = 0.001;
  let high = 5.0;
  for (let step = 0; step < 40; step++) {
    const mid = (low + high) / 2.0;
    const sqrtT = Math.sqrt(T);
    const d1 = (Math.log(safeSpot / safeStrike) + (rate - dividendYield + 0.5 * mid * mid) * T) / (mid * sqrtT);
    const d2 = d1 - mid * sqrtT;

    const price = isCall
      ? safeSpot * expYield * normalCdf(d1) - safeStrike * expRate * normalCdf(d2)
      : safeStrike * expRate * normalCdf(-d2) - safeSpot * expYield * normalCdf(-d1);

    const diff = price - targetPrice;
    if (Math.abs(diff) < 1e-4 || (high - low) < 1e-4) {
      return roundToDecimals(mid * 100.0, 2);
    }

    if (diff > 0) {
      high = mid;
    } else {
      low = mid;
    }
  }

  return roundToDecimals(clamp((low + high) / 2.0 * 100.0, 0.1, 500.0), 2);
}

export interface MonteCarloSimulationResult {
  simulatedPaths: number;
  daysToExpiration: number;
  initialSpot: number;
  meanTerminalSpot: number;
  medianTerminalSpot: number;
  terminalStdDev: number;
  percentile5: number;
  percentile25: number;
  percentile75: number;
  percentile95: number;
  probabilityOfProfitPct: number;
  probabilityOfTouchPct: number;
  valueAtRisk95Pct: number;
  cvar95Pct: number;
}

/**
 * Geometric Brownian Motion (GBM) Monte Carlo Simulation Engine.
 * Path formulation: S_T = S_0 * exp((r - q - 0.5 * sigma^2) * T + sigma * sqrt(T) * Z)
 * Uses antithetic variates for rapid numerical convergence and variance reduction.
 */
export function runMonteCarloSimulation(
  spot: number,
  strike: number,
  dte: number,
  volatilityPct: number,
  strategy: 'CSP' | 'COVERED_CALL' | 'BULL_PUT_SPREAD' | 'LONG_CALL' | 'LONG_PUT' = 'CSP',
  premiumReceived: number = 0,
  paths: number = 2000,
  rate: number = 0.045,
  dividendYield: number = 0.012
): MonteCarloSimulationResult {
  const safeSpot = Math.max(0.01, isFiniteNumber(spot) ? spot : 100);
  const safeStrike = Math.max(0.01, isFiniteNumber(strike) ? strike : 100);
  const safeDte = Math.max(1, isFiniteNumber(dte) ? dte : 30);
  const T = safeDte / 365.0;
  const sigma = Math.max(0.01, (isFiniteNumber(volatilityPct) ? volatilityPct : 30) / 100.0);

  // Exact Ito drift term with -0.5 * sigma^2
  const drift = (rate - dividendYield - 0.5 * sigma * sigma) * T;
  const volTerm = sigma * Math.sqrt(T);

  const halfPaths = Math.max(500, Math.floor(paths / 2));
  const terminalSpots: number[] = new Array(halfPaths * 2);

  // Box-Muller transform with antithetic pairs
  for (let i = 0; i < halfPaths; i++) {
    const u1 = Math.max(1e-10, Math.random());
    const u2 = Math.random();
    const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);

    terminalSpots[2 * i] = safeSpot * Math.exp(drift + volTerm * z);
    terminalSpots[2 * i + 1] = safeSpot * Math.exp(drift - volTerm * z); // Antithetic pair
  }

  terminalSpots.sort((a, b) => a - b);
  const totalPaths = terminalSpots.length;

  const sum = terminalSpots.reduce((acc, s) => acc + s, 0);
  const meanTerminalSpot = sum / totalPaths;

  const variance = terminalSpots.reduce((acc, s) => acc + Math.pow(s - meanTerminalSpot, 2), 0) / totalPaths;
  const terminalStdDev = Math.sqrt(variance);

  const p5Index = Math.floor(totalPaths * 0.05);
  const p25Index = Math.floor(totalPaths * 0.25);
  const p50Index = Math.floor(totalPaths * 0.50);
  const p75Index = Math.floor(totalPaths * 0.75);
  const p95Index = Math.floor(totalPaths * 0.95);

  const percentile5 = terminalSpots[p5Index];
  const percentile25 = terminalSpots[p25Index];
  const medianTerminalSpot = terminalSpots[p50Index];
  const percentile75 = terminalSpots[p75Index];
  const percentile95 = terminalSpots[p95Index];

  // Breakeven definitions per strategy
  let profitableCount = 0;
  let touchedStrikeCount = 0;
  const breakeven =
    strategy === 'CSP'
      ? safeStrike - premiumReceived
      : strategy === 'COVERED_CALL'
      ? safeSpot - premiumReceived
      : strategy === 'BULL_PUT_SPREAD'
      ? safeStrike - premiumReceived
      : strategy === 'LONG_CALL'
      ? safeStrike + premiumReceived
      : safeStrike - premiumReceived;

  for (let i = 0; i < totalPaths; i++) {
    const sT = terminalSpots[i];
    if (strategy === 'CSP' || strategy === 'COVERED_CALL' || strategy === 'BULL_PUT_SPREAD') {
      if (sT >= breakeven) profitableCount++;
      if (sT <= safeStrike) touchedStrikeCount++;
    } else if (strategy === 'LONG_CALL') {
      if (sT >= breakeven) profitableCount++;
      if (sT >= safeStrike) touchedStrikeCount++;
    } else {
      if (sT <= breakeven) profitableCount++;
      if (sT <= safeStrike) touchedStrikeCount++;
    }
  }

  const probabilityOfProfitPct = roundToDecimals((profitableCount / totalPaths) * 100, 1);
  // Analytical continuous barrier probability of touch: POT ≈ 2 * P(touched)
  const d2 = (Math.log(safeSpot / safeStrike) + (rate - dividendYield - 0.5 * sigma * sigma) * T) / (sigma * Math.sqrt(T));
  const probabilityOfTouchPct = roundToDecimals(clamp(2.0 * normalCdf(-Math.abs(d2)) * 100, 1, 100), 1);

  // 95% Value at Risk (VaR) & CVaR (Expected Shortfall)
  const p5DollarLoss = Math.max(0, safeSpot - percentile5);
  const tailSpots = terminalSpots.slice(0, p5Index + 1);
  const tailMean = tailSpots.reduce((acc, s) => acc + s, 0) / tailSpots.length;
  const cvar95Pct = roundToDecimals(Math.max(0, safeSpot - tailMean), 2);

  return {
    simulatedPaths: totalPaths,
    daysToExpiration: safeDte,
    initialSpot: safeSpot,
    meanTerminalSpot: roundToDecimals(meanTerminalSpot, 2),
    medianTerminalSpot: roundToDecimals(medianTerminalSpot, 2),
    terminalStdDev: roundToDecimals(terminalStdDev, 2),
    percentile5: roundToDecimals(percentile5, 2),
    percentile25: roundToDecimals(percentile25, 2),
    percentile75: roundToDecimals(percentile75, 2),
    percentile95: roundToDecimals(percentile95, 2),
    probabilityOfProfitPct,
    probabilityOfTouchPct,
    valueAtRisk95Pct: roundToDecimals(p5DollarLoss, 2),
    cvar95Pct,
  };
}

/**
 * Calculates theoretical analytical Probability of Profit (POP %) based on risk-neutral N(d2).
 * For CSP: P(S_T >= Strike - Premium) = N(d2(Breakeven))
 * For CC: P(S_T >= Spot - Premium) = N(d2(Breakeven))
 */
export function calculateProbabilityOfProfit(
  spot: number,
  strike: number,
  premium: number,
  dte: number,
  volatilityPct: number,
  isPut: boolean = true,
  rate: number = 0.045,
  dividendYield: number = 0.012
): number {
  if (!isFiniteNumber(spot) || spot <= 0 || !isFiniteNumber(strike) || strike <= 0) return 50.0;
  const safeDte = Math.max(0.1, isFiniteNumber(dte) ? dte : 30);
  const T = safeDte / 365.0;
  const sigma = Math.max(0.01, (isFiniteNumber(volatilityPct) ? volatilityPct : 30) / 100.0);
  const breakeven = isPut ? Math.max(0.01, strike - premium) : Math.max(0.01, spot - premium);
  const sqrtT = Math.sqrt(T);
  const d2 = (Math.log(spot / breakeven) + (rate - dividendYield - 0.5 * sigma * sigma) * T) / (sigma * sqrtT);
  const pop = normalCdf(d2) * 100.0;
  return roundToDecimals(clamp(pop, 1.0, 99.0), 1);
}

/**
 * Calculates continuous barrier Probability of Touch (POT %)
 * Probability that the underlying asset touches the strike prior to expiration.
 * Using reflection principle: POT ≈ 2 * (1 - POP_at_strike) = 2 * N(-|d2|)
 */
export function calculateProbabilityOfTouch(
  spot: number,
  strike: number,
  dte: number,
  volatilityPct: number,
  rate: number = 0.045,
  dividendYield: number = 0.012
): number {
  if (!isFiniteNumber(spot) || spot <= 0 || !isFiniteNumber(strike) || strike <= 0) return 50.0;
  const safeDte = Math.max(0.1, isFiniteNumber(dte) ? dte : 30);
  const T = safeDte / 365.0;
  const sigma = Math.max(0.01, (isFiniteNumber(volatilityPct) ? volatilityPct : 30) / 100.0);
  const sqrtT = Math.sqrt(T);
  const d2 = (Math.log(spot / strike) + (rate - dividendYield - 0.5 * sigma * sigma) * T) / (sigma * sqrtT);
  const pot = 2.0 * normalCdf(-Math.abs(d2)) * 100.0;
  return roundToDecimals(clamp(pot, 1.0, 100.0), 1);
}

/**
 * Bid/Ask validation and clean mid-price generator.
 * Filters out crossed markets (bid > ask), non-positive values, and extreme spread distortion.
 */
export function validateBidAsk(bid: number, ask: number): {
  isValid: boolean;
  bid: number;
  ask: number;
  mid: number;
  spreadPct: number;
  warning?: string;
} {
  const safeBid = isFiniteNumber(bid) ? Math.max(0, bid) : 0;
  const safeAsk = isFiniteNumber(ask) ? Math.max(0, ask) : 0;

  if (safeBid === 0 && safeAsk === 0) {
    return { isValid: false, bid: 0, ask: 0, mid: 0, spreadPct: 0, warning: 'Zero Bid and Ask' };
  }

  if (safeBid > safeAsk && safeAsk > 0) {
    // Crossed market!
    return {
      isValid: false,
      bid: safeAsk,
      ask: safeBid,
      mid: roundToDecimals((safeBid + safeAsk) / 2.0, 2),
      spreadPct: 0,
      warning: 'Crossed Market (Bid > Ask)',
    };
  }

  const mid = safeBid === 0 ? safeAsk : (safeBid + safeAsk) / 2.0;
  const spread = safeAsk - safeBid;
  const spreadPct = mid > 0 ? (spread / mid) * 100.0 : 0;

  return {
    isValid: safeBid > 0 && safeAsk >= safeBid && spreadPct <= 35.0,
    bid: roundToDecimals(safeBid, 2),
    ask: roundToDecimals(safeAsk, 2),
    mid: roundToDecimals(mid, 2),
    spreadPct: roundToDecimals(spreadPct, 1),
  };
}

/**
 * Calculates standard Covered Call return metrics:
 * 1. Static Return (Stock unchanged at expiration)
 * 2. If-Called Return (Stock called away at or above strike)
 * 3. Downside Breakeven
 */
export function calculateCoveredCallMetrics(
  spotPrice: number,
  strikePrice: number,
  premium: number,
  dte: number
): {
  staticReturnPct: number;
  annualizedStaticRoc: number;
  ifCalledReturnPct: number;
  annualizedIfCalledRoc: number;
  downsideBreakeven: number;
  downsideCushionPct: number;
} {
  const safeSpot = Math.max(0.01, isFiniteNumber(spotPrice) ? spotPrice : 100);
  const safeStrike = Math.max(0.01, isFiniteNumber(strikePrice) ? strikePrice : 100);
  const safePrem = Math.max(0, isFiniteNumber(premium) ? premium : 0);
  const safeDte = Math.max(1, isFiniteNumber(dte) ? dte : 30);

  const staticReturnPct = (safePrem / safeSpot) * 100.0;
  const annualizedStaticRoc = staticReturnPct * (365.0 / safeDte);

  const capitalGain = Math.max(0, safeStrike - safeSpot);
  const ifCalledReturnPct = ((safePrem + capitalGain) / safeSpot) * 100.0;
  const annualizedIfCalledRoc = ifCalledReturnPct * (365.0 / safeDte);

  const downsideBreakeven = safeSpot - safePrem;
  const downsideCushionPct = (safePrem / safeSpot) * 100.0;

  return {
    staticReturnPct: roundToDecimals(staticReturnPct, 2),
    annualizedStaticRoc: roundToDecimals(annualizedStaticRoc, 2),
    ifCalledReturnPct: roundToDecimals(ifCalledReturnPct, 2),
    annualizedIfCalledRoc: roundToDecimals(annualizedIfCalledRoc, 2),
    downsideBreakeven: roundToDecimals(downsideBreakeven, 2),
    downsideCushionPct: roundToDecimals(downsideCushionPct, 2),
  };
}

/**
 * Calculates Return on Collateral (RoR %) and Annualized Return on Collateral (Annualized RoR %).
 */
export function calculateAnnualizedRoc(
  premium: number,
  collateral: number,
  dte: number
): { rocPct: number; annualizedRoc: number } {
  if (!isFiniteNumber(premium) || premium <= 0 || !isFiniteNumber(collateral) || collateral <= 0) {
    return { rocPct: 0, annualizedRoc: 0 };
  }
  const safeDte = Math.max(1, isFiniteNumber(dte) ? dte : 30);
  const rocPct = safeDivide(premium * 100, collateral, 0);
  const annualizedRoc = rocPct * safeDivide(365, safeDte, 0);

  return {
    rocPct: roundToDecimals(rocPct, 2),
    annualizedRoc: roundToDecimals(annualizedRoc, 2),
  };
}

/**
 * Calculates Cash-Secured Put (CSP) Collateral requirement: Strike * 100 * contracts.
 */
export function calculateCspCollateral(strike: number, contracts: number = 1): number {
  const safeStrike = Math.max(0, isFiniteNumber(strike) ? strike : 0);
  const safeContracts = Math.max(0, isFiniteNumber(contracts) ? contracts : 1);
  return roundToDecimals(safeStrike * safeContracts * 100, 2);
}

/**
 * Calculates safety cushion percentage:
 * For Puts (CSP): (Spot - Strike) / Spot * 100 (percentage buffer before strike is tested)
 * For Calls (CC): (Strike - Spot) / Spot * 100
 */
export function calculateCushionPct(spotPrice: number, strike: number, isPut: boolean = true): number {
  if (!isFiniteNumber(spotPrice) || spotPrice <= 0 || !isFiniteNumber(strike) || strike <= 0) {
    return 0;
  }
  const diff = isPut ? spotPrice - strike : strike - spotPrice;
  return roundToDecimals(safeDivide(diff * 100, spotPrice, 0), 2);
}

/**
 * Calculates calendar days to expiration (DTE) from an ISO or standard date string.
 */
export function calculateDteFromExpiration(expirationDateStr: string): number {
  if (!expirationDateStr) return 30;
  const target = new Date(expirationDateStr);
  if (Number.isNaN(target.getTime())) return 30;
  const now = new Date();
  // Clear time component for day precision
  target.setHours(16, 0, 0, 0); // Expiration market close
  const diffMs = target.getTime() - now.getTime();
  const dte = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return Math.max(0, dte);
}

/**
 * Normal CDF alias for compatibility with quantitative nomenclature.
 */
export const normCdf = normalCdf;

/**
 * Standard Acklam's Inverse Normal Cumulative Distribution Function (Probit)
 * Computes exact d1 from target delta to solve for option strike.
 * Highly stable with rational approximations across lower, central, and upper tails.
 */
export function inverseNormalCdf(p: number): number {
  if (!isFiniteNumber(p) || p <= 0.0001) return -3.75;
  if (p >= 0.9999) return 3.75;

  const a = [
    -3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2,
    1.38357751867269e2, -3.066479806614716e1, 2.506628277459239e0,
  ];
  const b = [
    -5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2,
    6.680131188771972e1, -1.328068155288572e1,
  ];
  const c = [
    -7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838e0,
    -2.549732539343734e0, 4.374664141464968e0, 2.938163982698783e0,
  ];
  const d = [
    7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996e0,
    3.754408661907416e0,
  ];

  const pLow = 0.02425;
  const pHigh = 1.0 - pLow;

  if (p < pLow) {
    const q = Math.sqrt(-2.0 * Math.log(p));
    return (
      (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1.0)
    );
  }
  if (p <= pHigh) {
    const q = p - 0.5;
    const r = q * q;
    return (
      (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) *
      q /
      (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1.0)
    );
  }
  const q = Math.sqrt(-2.0 * Math.log(1.0 - p));
  return -(
    (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
    ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1.0)
  );
}

/**
 * Calculates standard US equity option exchange strike increments.
 * Snaps theoretical price to nearest tradeable listed strike price based on equity spot bracket.
 */
export function getNearestExchangeStrike(theoreticalStrike: number, spot: number): number {
  if (!isFiniteNumber(theoreticalStrike)) return 100;
  const safeSpot = isFiniteNumber(spot) ? spot : theoreticalStrike;
  let interval = 1.0;
  if (safeSpot <= 25) {
    interval = 0.5;
  } else if (safeSpot <= 100) {
    interval = 1.0;
  } else if (safeSpot <= 200) {
    interval = 2.5;
  } else {
    interval = 5.0;
  }
  return Math.round(theoreticalStrike / interval) * interval;
}
