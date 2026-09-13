/**
 * Pure Mathematical Technical Indicators Implementation
 * 
 * Includes SMA, EMA (cold-start mitigated with SMA warm-up),
 * RSI(14) Wilder's smoothed (with flat-series defense),
 * MACD line/signal/histogram, Bollinger Bands (20, sample std dev N-1),
 * ATR(14) Wilder's smoothed with previous close gap defense,
 * Intraday session-resetting VWAP, and OBV (On-Balance Volume).
 * 
 * Completely deterministic and numerically guarded against NaN / division by zero.
 */

import { isFiniteNumber, safeDivide } from './financeMath';

export interface OHLCVBar {
  open?: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
  timestamp?: string | number | Date;
}

/**
 * Calculates Simple Moving Average (SMA)
 */
export function calculateSMA(prices: number[], period: number, offset: number = 0): number {
  if (!prices || prices.length === 0 || period <= 0) return 0;
  const end = Math.max(0, prices.length - offset);
  const start = Math.max(0, end - period);
  const slice = prices.slice(start, end);
  if (slice.length === 0) return prices[prices.length - 1] || 0;
  const sum = slice.reduce((acc, val) => acc + (isFiniteNumber(val) ? val : 0), 0);
  return safeDivide(sum, slice.length, 0);
}

/**
 * Calculates Exponential Moving Average (EMA) with SMA initialization warmup
 * to prevent cold-start distortion across early bars.
 */
export function calculateEMA(prices: number[], period: number): number[] {
  if (!prices || prices.length === 0 || period <= 0) return [];
  const k = 2 / (period + 1);
  const emaArr: number[] = [];

  // Warmup with progressive SMA until period bars are accumulated
  let runningSum = 0;
  for (let i = 0; i < prices.length; i++) {
    const p = isFiniteNumber(prices[i]) ? prices[i] : 0;
    runningSum += p;

    if (i < period - 1) {
      // Progressive SMA for initial bars
      emaArr.push(runningSum / (i + 1));
    } else if (i === period - 1) {
      // First canonical EMA seed: exact SMA over initial N periods
      const initialSma = runningSum / period;
      emaArr.push(initialSma);
    } else {
      // Standard recursive exponential smoothing
      const prevEma = emaArr[i - 1];
      const val = p * k + prevEma * (1 - k);
      emaArr.push(val);
    }
  }
  return emaArr;
}

/**
 * Calculates Relative Strength Index (RSI) using Wilder's Exponential Smoothing (RMA, alpha = 1/N).
 * Guarded against flat series (returns 50.0) and zero-loss division (returns 100.0).
 */
export function calculateRSI(prices: number[], period: number = 14): number {
  if (!prices || prices.length <= period) return 50.0;

  let gains = 0;
  let losses = 0;

  // First period initial simple average
  for (let i = 1; i <= period; i++) {
    const diff = prices[i] - prices[i - 1];
    if (diff > 0) {
      gains += diff;
    } else if (diff < 0) {
      losses -= diff;
    }
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  // Wilder's smoothing (alpha = 1 / period)
  for (let i = period + 1; i < prices.length; i++) {
    const diff = prices[i] - prices[i - 1];
    if (diff > 0) {
      avgGain = (avgGain * (period - 1) + diff) / period;
      avgLoss = (avgLoss * (period - 1)) / period;
    } else if (diff < 0) {
      avgGain = (avgGain * (period - 1)) / period;
      avgLoss = (avgLoss * (period - 1) - diff) / period;
    } else {
      // Zero diff (unchanged price): decay both
      avgGain = (avgGain * (period - 1)) / period;
      avgLoss = (avgLoss * (period - 1)) / period;
    }
  }

  // Edge Case 1: Stagnant / Flat price series -> Exactly 50.0 Neutral
  if (avgGain === 0 && avgLoss === 0) {
    return 50.0;
  }

  // Edge Case 2: Monotonically increasing (zero losses) -> Exactly 100.0
  if (avgLoss === 0) {
    return 100.0;
  }

  // Edge Case 3: Monotonically decreasing (zero gains) -> Exactly 0.0
  if (avgGain === 0) {
    return 0.0;
  }

  const rs = avgGain / avgLoss;
  const rsi = 100.0 - 100.0 / (1.0 + rs);
  return Math.round(rsi * 100) / 100;
}

export interface BollingerBands {
  middle: number;
  upper: number;
  lower: number;
  bandwidthPct: number;
}

/**
 * Calculates Bollinger Bands with Bessel's correction (sample variance N-1)
 */
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

  // Sample standard deviation with N-1 degrees of freedom
  const n = slice.length;
  let variance = 0;
  if (n > 1) {
    variance = slice.reduce((acc, val) => acc + Math.pow(val - sma, 2), 0) / (n - 1);
  }
  const stdDev = Math.sqrt(Math.max(0, variance));

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

/**
 * Calculates Moving Average Convergence Divergence (MACD)
 * Histogram = MACD Line - Signal Line
 */
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

/**
 * Calculates Average True Range (ATR) with Wilder's RMA smoothing.
 * Properly incorporates previous close gaps and handles initial bar defenses.
 */
export function calculateATR(bars: OHLCVBar[], period: number = 14): number {
  if (!bars || bars.length === 0 || period <= 0) return 0.0;
  if (bars.length === 1) {
    return Math.max(0, bars[0].high - bars[0].low);
  }

  // Calculate True Range for each bar
  const trueRanges: number[] = [];
  for (let i = 0; i < bars.length; i++) {
    const high = bars[i].high;
    const low = bars[i].low;
    if (i === 0) {
      trueRanges.push(Math.max(0, high - low));
    } else {
      const prevClose = bars[i - 1].close;
      const tr = Math.max(
        high - low,
        Math.abs(high - prevClose),
        Math.abs(low - prevClose)
      );
      trueRanges.push(tr);
    }
  }

  if (trueRanges.length < period) {
    const sum = trueRanges.reduce((a, b) => a + b, 0);
    return Math.round((sum / trueRanges.length) * 1000) / 1000;
  }

  // Initial ATR: Simple Average over the first `period` bars
  let atr = trueRanges.slice(0, period).reduce((a, b) => a + b, 0) / period;

  // Wilder's Smoothing for subsequent bars
  for (let i = period; i < trueRanges.length; i++) {
    atr = (atr * (period - 1) + trueRanges[i]) / period;
  }

  return Math.round(atr * 1000) / 1000;
}

/**
 * Calculates Intraday Volume-Weighted Average Price (VWAP)
 * Resets cumulative metrics whenever a new session date is encountered.
 */
export function calculateVWAP(bars: OHLCVBar[]): number[] {
  if (!bars || bars.length === 0) return [];

  const vwapSeries: number[] = [];
  let cumVolume = 0;
  let cumTypicalVolume = 0;
  let lastSessionDate = '';

  for (let i = 0; i < bars.length; i++) {
    const bar = bars[i];
    const high = isFiniteNumber(bar.high) ? bar.high : bar.close;
    const low = isFiniteNumber(bar.low) ? bar.low : bar.close;
    const close = isFiniteNumber(bar.close) ? bar.close : 0;
    const volume = isFiniteNumber(bar.volume) && (bar.volume ?? 0) > 0 ? bar.volume! : 0;

    // Session date determination
    let sessionDate = '';
    if (bar.timestamp) {
      const d = new Date(bar.timestamp);
      sessionDate = isNaN(d.getTime()) ? String(bar.timestamp).slice(0, 10) : d.toISOString().slice(0, 10);
    }

    // Reset accumulators on new session
    if (sessionDate && sessionDate !== lastSessionDate && lastSessionDate !== '') {
      cumVolume = 0;
      cumTypicalVolume = 0;
    }
    if (sessionDate) {
      lastSessionDate = sessionDate;
    }

    const typicalPrice = (high + low + close) / 3.0;
    cumVolume += volume;
    cumTypicalVolume += typicalPrice * volume;

    if (cumVolume > 0) {
      vwapSeries.push(Math.round((cumTypicalVolume / cumVolume) * 100) / 100);
    } else {
      vwapSeries.push(Math.round(typicalPrice * 100) / 100);
    }
  }

  return vwapSeries;
}

/**
 * Calculates On-Balance Volume (OBV)
 * Maintains volume unchanged when current close matches previous close (Close_t = Close_{t-1}).
 */
export function calculateOBV(bars: { close: number; volume: number }[]): number[] {
  if (!bars || bars.length === 0) return [];

  const obvSeries: number[] = [];
  let currentObv = 0;
  obvSeries.push(currentObv);

  for (let i = 1; i < bars.length; i++) {
    const currClose = bars[i].close;
    const prevClose = bars[i - 1].close;
    const vol = isFiniteNumber(bars[i].volume) ? bars[i].volume : 0;

    if (currClose > prevClose) {
      currentObv += vol;
    } else if (currClose < prevClose) {
      currentObv -= vol;
    }
    // If currClose === prevClose: currentObv remains unchanged
    obvSeries.push(currentObv);
  }

  return obvSeries;
}
