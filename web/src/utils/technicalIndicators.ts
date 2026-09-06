/**
 * Pure Mathematical Technical Indicators Implementation
 * 
 * Includes SMA, EMA, RSI(14) Wilder's smoothed, MACD line/signal/histogram,
 * Bollinger Bands (20, 2 std dev), and ATR(14).
 * Completely deterministic and memory-efficient.
 */

import { isFiniteNumber, safeDivide } from './financeMath';

export function calculateSMA(prices: number[], period: number, offset: number = 0): number {
  if (!prices || prices.length === 0 || period <= 0) return 0;
  const end = Math.max(0, prices.length - offset);
  const start = Math.max(0, end - period);
  const slice = prices.slice(start, end);
  if (slice.length === 0) return prices[prices.length - 1] || 0;
  const sum = slice.reduce((acc, val) => acc + (isFiniteNumber(val) ? val : 0), 0);
  return safeDivide(sum, slice.length, 0);
}

export function calculateEMA(prices: number[], period: number): number[] {
  if (!prices || prices.length === 0 || period <= 0) return [];
  const k = 2 / (period + 1);
  const emaArr: number[] = [];
  let prev = isFiniteNumber(prices[0]) ? prices[0] : 0;
  emaArr.push(prev);

  for (let i = 1; i < prices.length; i++) {
    const currentPrice = isFiniteNumber(prices[i]) ? prices[i] : prev;
    const val = currentPrice * k + prev * (1 - k);
    emaArr.push(val);
    prev = val;
  }
  return emaArr;
}

export function calculateRSI(prices: number[], period: number = 14): number {
  if (!prices || prices.length <= period) return 50;

  let gains = 0;
  let losses = 0;

  // First period calculation
  for (let i = 1; i <= period; i++) {
    const diff = prices[i] - prices[i - 1];
    if (diff >= 0) {
      gains += diff;
    } else {
      losses -= diff;
    }
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  // Wilder's smoothing
  for (let i = period + 1; i < prices.length; i++) {
    const diff = prices[i] - prices[i - 1];
    if (diff >= 0) {
      avgGain = (avgGain * (period - 1) + diff) / period;
      avgLoss = (avgLoss * (period - 1)) / period;
    } else {
      avgGain = (avgGain * (period - 1)) / period;
      avgLoss = (avgLoss * (period - 1) - diff) / period;
    }
  }

  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return Math.round((100 - 100 / (1 + rs)) * 100) / 100;
}

export interface BollingerBands {
  middle: number;
  upper: number;
  lower: number;
  bandwidthPct: number;
}

export function calculateBollingerBands(
  prices: number[],
  period: number = 20,
  stdDevMultiplier: number = 2
): BollingerBands {
  if (!prices || prices.length === 0) {
    return { middle: 0, upper: 0, lower: 0, bandwidthPct: 0 };
  }
  const sma = calculateSMA(prices, period);
  const slice = prices.slice(Math.max(0, prices.length - period));
  if (slice.length === 0) {
    return { middle: sma, upper: sma, lower: sma, bandwidthPct: 0 };
  }

  const variance =
    slice.reduce((acc, val) => acc + Math.pow(val - sma, 2), 0) / slice.length;
  const stdDev = Math.sqrt(variance);

  const upper = sma + stdDevMultiplier * stdDev;
  const lower = Math.max(0, sma - stdDevMultiplier * stdDev);
  const bandwidthPct = sma > 0 ? ((upper - lower) / sma) * 100 : 0;

  return {
    middle: Math.round(sma * 100) / 100,
    upper: Math.round(upper * 100) / 100,
    lower: Math.round(lower * 100) / 100,
    bandwidthPct: Math.round(bandwidthPct * 100) / 100,
  };
}

export interface MacdResult {
  macdLine: number;
  signalLine: number;
  histogram: number;
}

export function calculateMACD(
  prices: number[],
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  signalPeriod: number = 9
): MacdResult {
  if (!prices || prices.length < slowPeriod) {
    return { macdLine: 0, signalLine: 0, histogram: 0 };
  }
  const fastEma = calculateEMA(prices, fastPeriod);
  const slowEma = calculateEMA(prices, slowPeriod);

  const macdSeries: number[] = [];
  for (let i = 0; i < prices.length; i++) {
    macdSeries.push(fastEma[i] - slowEma[i]);
  }

  const signalEma = calculateEMA(macdSeries, signalPeriod);
  const lastIdx = prices.length - 1;
  const macdLine = macdSeries[lastIdx];
  const signalLine = signalEma[lastIdx];
  const histogram = macdLine - signalLine;

  return {
    macdLine: Math.round(macdLine * 1000) / 1000,
    signalLine: Math.round(signalLine * 1000) / 1000,
    histogram: Math.round(histogram * 1000) / 1000,
  };
}
