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
  rho: number;
  d1: number;
  d2: number;
}

/**
 * Standard Black-Scholes option pricing model with full Greeks.
 * Guaranteed deterministic outputs with safe numerical boundaries.
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
  const safeDte = Math.max(0.5, isFiniteNumber(dte) ? dte : 30);
  const T = safeDte / 365.0;
  const sigma = Math.max(0.01, (isFiniteNumber(volatilityPct) ? volatilityPct : 30) / 100.0);
  const safeRate = isFiniteNumber(rate) ? rate : 0.045;
  const safeDiv = isFiniteNumber(dividendYield) ? dividendYield : 0.012;

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

  const callPrice = Math.max(0.01, safeSpot * expYield * nd1 - safeStrike * expRate * nd2);
  const putPrice = Math.max(0.01, safeStrike * expRate * nNegD2 - safeSpot * expYield * nNegD1);

  const callDelta = clamp(expYield * nd1, 0, 1);
  const putDelta = clamp(expYield * (nd1 - 1.0), -1, 0);

  const gamma = Math.max(0, safeDivide(expYield * pdfD1, safeSpot * sigma * sqrtT, 0));

  const term1 = -safeDivide(safeSpot * expYield * pdfD1 * sigma, 2.0 * sqrtT, 0);
  const callTheta = (term1 - safeRate * safeStrike * expRate * nd2 + safeDiv * safeSpot * expYield * nd1) / 365.0;
  const putTheta = (term1 + safeRate * safeStrike * expRate * nNegD2 - safeDiv * safeSpot * expYield * nNegD1) / 365.0;

  const vega = Math.max(0, (safeSpot * expYield * pdfD1 * sqrtT) / 100.0);
  const rho = (safeStrike * T * expRate * nd2) / 100.0;

  return {
    callPrice: roundToDecimals(callPrice, 4),
    putPrice: roundToDecimals(putPrice, 4),
    callDelta: roundToDecimals(callDelta, 4),
    putDelta: roundToDecimals(putDelta, 4),
    gamma: roundToDecimals(gamma, 5),
    callTheta: roundToDecimals(callTheta, 4),
    putTheta: roundToDecimals(putTheta, 4),
    vega: roundToDecimals(vega, 4),
    rho: roundToDecimals(rho, 4),
    d1: roundToDecimals(d1, 4),
    d2: roundToDecimals(d2, 4),
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
