import type { DividendSchedule, EarlyAssignmentAnalysis } from '../types/coveredCall.ts';

/**
 * Calculates covered call payoff at a target terminal stock price at expiration.
 * Payoff = (Terminal Price - Stock Price) + Call Premium - Max(0, Terminal Price - Strike)
 */
export function calculateExpirationPayoff(
  terminalStockPrice: number,
  stockPrice: number,
  strike: number,
  premium: number
): number {
  const stockPnL = terminalStockPrice - stockPrice;
  const shortCallPnL = premium - Math.max(0, terminalStockPrice - strike);
  return stockPnL + shortCallPnL;
}

/**
 * Calculates Call Extrinsic Value (Time Value).
 * Extrinsic = Call Premium - Max(0, Stock Price - Strike)
 */
export function calculateExtrinsicValue(
  callPremium: number,
  stockPrice: number,
  strike: number
): number {
  const intrinsicValue = Math.max(0, stockPrice - strike);
  return Math.max(0, callPremium - intrinsicValue);
}

/**
 * Evaluates American Option Early Assignment Risk around Ex-Dividend Dates.
 *
 * Quantitative Rule (Cox-Ross-Rubinstein / Institutional Income Rule):
 * A rational call owner exercises early immediately prior to the Ex-Dividend date IF:
 * 1. The option expiration is ON or AFTER the Ex-Dividend date.
 * 2. The dividend amount > remaining call extrinsic (time) value.
 * 3. The call is in-the-money (ITM) or near-the-money where exercising captures more value than selling.
 */
export function evaluateEarlyAssignmentRisk(
  stockPrice: number,
  strike: number,
  callMidPremium: number,
  expirationDate: string,
  dividend?: DividendSchedule
): EarlyAssignmentAnalysis {
  const extrinsic = calculateExtrinsicValue(callMidPremium, stockPrice, strike);

  if (!dividend || !dividend.exDividendDate) {
    return {
      hasRisk: false,
      severity: 'NONE',
      callExtrinsicValue: Number(extrinsic.toFixed(2)),
      projectedForfeitedDividend: 0,
      reason: 'No upcoming ex-dividend scheduled.',
    };
  }

  const expTime = new Date(expirationDate).getTime();
  const exDivTime = new Date(dividend.exDividendDate).getTime();
  const now = new Date().getTime();

  // Ex-div has already passed or occurs after option expiration
  if (exDivTime <= now || exDivTime > expTime) {
    return {
      hasRisk: false,
      severity: 'NONE',
      exDividendDate: dividend.exDividendDate,
      dividendAmount: dividend.amount,
      callExtrinsicValue: Number(extrinsic.toFixed(2)),
      projectedForfeitedDividend: 0,
      reason: 'Ex-dividend date occurs outside this expiration cycle.',
    };
  }

  const dividendYieldAdvantage = dividend.amount - extrinsic;

  if (dividendYieldAdvantage > 0 && stockPrice >= strike * 0.98) {
    return {
      hasRisk: true,
      severity: 'HIGH',
      exDividendDate: dividend.exDividendDate,
      dividendAmount: dividend.amount,
      callExtrinsicValue: Number(extrinsic.toFixed(2)),
      projectedForfeitedDividend: dividend.amount * 100,
      reason: `Critical Risk: Upcoming dividend ($${dividend.amount.toFixed(2)}) exceeds call time value ($${extrinsic.toFixed(2)}). Rational counterparties will exercise early on the eve of ${dividend.exDividendDate}.`,
    };
  } else if (dividendYieldAdvantage > -0.15 && stockPrice >= strike * 0.95) {
    return {
      hasRisk: true,
      severity: 'LOW',
      exDividendDate: dividend.exDividendDate,
      dividendAmount: dividend.amount,
      callExtrinsicValue: Number(extrinsic.toFixed(2)),
      projectedForfeitedDividend: dividend.amount * 100,
      reason: `Moderate Risk: Time value ($${extrinsic.toFixed(2)}) is narrowly above dividend ($${dividend.amount.toFixed(2)}). Continued stock rise could trigger early assignment.`,
    };
  }

  return {
    hasRisk: false,
    severity: 'NONE',
    exDividendDate: dividend.exDividendDate,
    dividendAmount: dividend.amount,
    callExtrinsicValue: Number(extrinsic.toFixed(2)),
    projectedForfeitedDividend: 0,
    reason: `Time value ($${extrinsic.toFixed(2)}) safely exceeds dividend ($${dividend.amount.toFixed(2)}). Early exercise is uneconomical.`,
  };
}

/**
 * Calculates annualized return on capital given profit percentage and days to expiration.
 */
export function calculateAnnualizedYield(profitPercent: number, dte: number): number {
  if (dte <= 0) return 0;
  return profitPercent * (365 / dte);
}

/**
 * Generates an array of terminal price coordinates for plotting payoff curves.
 */
export function generatePayoffCurvePoints(
  stockPrice: number,
  strikePrice: number,
  premium: number,
  numPoints = 60
): { terminalPrice: number; pnl: number; isProfit: boolean }[] {
  const rangeSpan = Math.max(stockPrice * 0.25, 20);
  const minPrice = Math.floor(stockPrice - rangeSpan);
  const maxPrice = Math.ceil(Math.max(strikePrice + rangeSpan * 0.5, stockPrice + rangeSpan));
  const step = (maxPrice - minPrice) / numPoints;

  const points: { terminalPrice: number; pnl: number; isProfit: boolean }[] = [];
  for (let p = minPrice; p <= maxPrice + 0.0001; p += step) {
    const curPrice = Number(p.toFixed(2));
    const pnlPerShare = calculateExpirationPayoff(curPrice, stockPrice, strikePrice, premium);
    const totalPnl = Number((pnlPerShare * 100).toFixed(1));
    points.push({
      terminalPrice: curPrice,
      pnl: totalPnl,
      isProfit: totalPnl >= 0,
    });
  }

  return points;
}
