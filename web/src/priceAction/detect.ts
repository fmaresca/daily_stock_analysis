/**
 * DeltaHarvest — Al Brooks Price Action Analysis
 * Module: Pattern Detection Engine (priceAction/detect.ts)
 * 
 * Implements pure mathematical functions for bar classification, swing trend legs,
 * trading range detection, and probabilistic setup recognition.
 * 
 * Regulatory Notice:
 * Not Financial Advice. All pattern classifications, setups, levels, and targets
 * produced by this module are probabilistic pattern-recognition heuristics for educational
 * and observational analysis only. Pattern detection is never a trade signal.
 * 
 * Citations:
 * Brooks, Al. "Reading Price Charts Bar by Bar: The Technical Analysis of Price Action for the Serious Trader."
 * John Wiley & Sons, 2009.
 * 
 * Implementation Notes:
 * Evaluated the `candlestick` npm package (cm45t3r/candlestick, MIT). While that package
 * implements classic Japanese patterns (doji, hammer, engulfing), Brooks Price Action requires
 * continuous fractional geometry relative to total bar range (body >= 50%, close in top or bottom third),
 * swing pivot state tracking with delayed non-repainting confirmation, and sequential pullback counting (H1-H4/L1-L4).
 * Reimplementing these mathematical rules natively as pure TypeScript functions guarantees complete type safety,
 * deterministic performance, zero third-party bundle overhead, and precise threshold configurability.
 */

import type { CanonicalBar } from './bars.ts';

export interface PriceActionConfig {
  /** Minimum body-to-range ratio for a trend bar (default: 0.50) */
  trendBodyMinRatio: number;
  /** Close location ratio for bull trend bar (default: 0.67 = upper third) */
  bullCloseThirdRatio: number;
  /** Close location ratio for bear trend bar (default: 0.33 = lower third) */
  bearCloseThirdRatio: number;
  /** Maximum body-to-range ratio for doji / range bar (default: 0.25) */
  dojiBodyMaxRatio: number;
  /** Minimum tail ratio to qualify as rejection signal bar (default: 0.33) */
  tailDominanceRatio: number;

  /** Lookback bars on each side for swing pivot confirmation (default: 2) */
  swingPivotLookback: number;
  /** Minimum bars to establish a trend leg (default: 3) */
  minTrendLegBars: number;
  /** Exponential Moving Average period for dynamic baseline (default: 20) */
  emaPeriod: number;

  /** Minimum consecutive bars to qualify as trading range (default: 5) */
  rangeMinBars: number;
  /** Minimum overlap ratio between adjacent bars (default: 0.50) */
  barOverlapMinRatio: number;
  /** Ratio of bars in window that must exhibit overlap (default: 0.60) */
  rangeOverlapBarPct: number;

  /** Maximum bars in pullback before setup expires (default: 8) */
  maxPullbackBars: number;
  /** Retest tolerance for double top/bottom / MTR (default: 0.015 = 1.5%) */
  mtrExtremeTolerancePct: number;
  /** Follow-through bar minimum strength for breakout confirmation (default: 0.50) */
  breakoutFollowThroughMinPct: number;
}

export const DEFAULT_PRICE_ACTION_CONFIG: PriceActionConfig = {
  trendBodyMinRatio: 0.50,
  bullCloseThirdRatio: 0.67,
  bearCloseThirdRatio: 0.33,
  dojiBodyMaxRatio: 0.25,
  tailDominanceRatio: 0.33,
  swingPivotLookback: 2,
  minTrendLegBars: 3,
  emaPeriod: 20,
  rangeMinBars: 5,
  barOverlapMinRatio: 0.50,
  rangeOverlapBarPct: 0.60,
  maxPullbackBars: 8,
  mtrExtremeTolerancePct: 0.015,
  breakoutFollowThroughMinPct: 0.50,
};

export type BarType =
  | 'BULL_TREND_BAR'
  | 'BEAR_TREND_BAR'
  | 'DOJI_BAR'
  | 'INSIDE_BAR'
  | 'OUTSIDE_BAR'
  | 'NEUTRAL_BAR';

export interface ClassifiedBar {
  index: number;
  bar: CanonicalBar;
  barType: BarType;
  bodyRatio: number;
  closeLocationRatio: number;
  upperTailRatio: number;
  lowerTailRatio: number;
  isInside: boolean;
  isOutside: boolean;
  isBullSignalBar: boolean;
  isBearSignalBar: boolean;
}

export interface SwingPivot {
  index: number;
  type: 'SWING_HIGH' | 'SWING_LOW';
  price: number;
  confirmedAtIndex: number;
}

export interface TrendLeg {
  direction: 'BULL' | 'BEAR';
  startBarIndex: number;
  endBarIndex: number;
  startPrice: number;
  endPrice: number;
  barCount: number;
  netChangePct: number;
  pivots: { index: number; type: 'HH' | 'HL' | 'LH' | 'LL'; price: number }[];
}

export interface TradingRangeBox {
  startBarIndex: number;
  endBarIndex: number;
  top: number;
  bottom: number;
  height: number;
  barCount: number;
  overlapRatio: number;
}

export type SetupType =
  | 'H1'
  | 'H2'
  | 'L1'
  | 'L2'
  | 'BREAKOUT_BULL'
  | 'BREAKOUT_BEAR'
  | 'FAILED_BREAKOUT_REVERSAL'
  | 'MAJOR_TREND_REVERSAL'
  | 'DOUBLE_TOP'
  | 'DOUBLE_BOTTOM';

export interface PriceActionSetup {
  type: SetupType;
  direction: 'BULL' | 'BEAR';
  signalBarIndex: number;
  entryBarIndex: number;
  signalBarDate: string;
  entryPrice: number;
  invalidationLevel: number;
  measuredMoveTarget?: number;
  rationale: string;
  confidenceNote: string;
  parametersUsed: Record<string, number | string | boolean>;
}

export interface DetectionResult {
  classifiedBars: ClassifiedBar[];
  swingPivots: SwingPivot[];
  trendLegs: TrendLeg[];
  tradingRanges: TradingRangeBox[];
  setups: PriceActionSetup[];
  alwaysInState: 'ALWAYS_IN_LONG' | 'ALWAYS_IN_SHORT' | 'NEUTRAL';
  ema20: number[];
}

/**
 * Calculates 20-period Exponential Moving Average over canonical bar closes.
 */
export function calculateEMA(bars: CanonicalBar[], period = 20): number[] {
  if (bars.length === 0) return [];
  const ema: number[] = new Array(bars.length);
  const k = 2 / (period + 1);

  ema[0] = bars[0].close;
  for (let i = 1; i < bars.length; i++) {
    ema[i] = bars[i].close * k + ema[i - 1] * (1 - k);
  }
  return ema;
}

/**
 * 1. Bar Classification: pure function classifying each bar based on configured ratios.
 */
export function classifyBars(
  bars: CanonicalBar[],
  config: PriceActionConfig = DEFAULT_PRICE_ACTION_CONFIG
): ClassifiedBar[] {
  const result: ClassifiedBar[] = [];

  for (let i = 0; i < bars.length; i++) {
    const b = bars[i];
    const prev = i > 0 ? bars[i - 1] : null;
    const range = Math.max(0.0001, b.high - b.low);
    const body = Math.abs(b.close - b.open);
    const bodyRatio = body / range;
    const closeLocationRatio = (b.close - b.low) / range;
    const upperTail = (b.high - Math.max(b.open, b.close)) / range;
    const lowerTail = (Math.min(b.open, b.close) - b.low) / range;

    const isInside = prev !== null && b.high <= prev.high + 1e-6 && b.low >= prev.low - 1e-6;
    const isOutside = prev !== null && b.high >= prev.high - 1e-6 && b.low <= prev.low + 1e-6;

    let barType: BarType = 'NEUTRAL_BAR';

    const isStrongBull = b.close > b.open && bodyRatio >= config.trendBodyMinRatio && closeLocationRatio >= config.bullCloseThirdRatio;
    const isStrongBear = b.close < b.open && bodyRatio >= config.trendBodyMinRatio && closeLocationRatio <= config.bearCloseThirdRatio;
    const isDoji = bodyRatio <= config.dojiBodyMaxRatio || (closeLocationRatio > config.bearCloseThirdRatio && closeLocationRatio < config.bullCloseThirdRatio);

    if (isInside) {
      barType = 'INSIDE_BAR';
    } else if (isOutside && !isStrongBull && !isStrongBear) {
      barType = 'OUTSIDE_BAR';
    } else if (isStrongBull) {
      barType = 'BULL_TREND_BAR';
    } else if (isStrongBear) {
      barType = 'BEAR_TREND_BAR';
    } else if (isDoji) {
      barType = 'DOJI_BAR';
    } else if (isOutside) {
      barType = 'OUTSIDE_BAR';
    }

    const isBullSignalBar =
      barType === 'BULL_TREND_BAR' ||
      (lowerTail >= config.tailDominanceRatio && closeLocationRatio >= 0.50);

    const isBearSignalBar =
      barType === 'BEAR_TREND_BAR' ||
      (upperTail >= config.tailDominanceRatio && closeLocationRatio <= 0.50);

    result.push({
      index: i,
      bar: b,
      barType,
      bodyRatio: Math.round(bodyRatio * 1000) / 1000,
      closeLocationRatio: Math.round(closeLocationRatio * 1000) / 1000,
      upperTailRatio: Math.round(upperTail * 1000) / 1000,
      lowerTailRatio: Math.round(lowerTail * 1000) / 1000,
      isInside,
      isOutside,
      isBullSignalBar,
      isBearSignalBar,
    });
  }

  return result;
}

/**
 * 2. Swing Pivot Detection (Non-Repainting with N-bar delay).
 */
export function detectSwingPivots(
  bars: CanonicalBar[],
  lookback = 2
): SwingPivot[] {
  const pivots: SwingPivot[] = [];
  const n = bars.length;

  for (let i = lookback; i < n - lookback; i++) {
    const cur = bars[i];
    let isHigh = true;
    let isLow = true;

    for (let k = 1; k <= lookback; k++) {
      if (bars[i - k].high >= cur.high || bars[i + k].high >= cur.high) {
        isHigh = false;
      }
      if (bars[i - k].low <= cur.low || bars[i + k].low <= cur.low) {
        isLow = false;
      }
    }

    const confirmedAtIndex = i + lookback;
    if (isHigh) {
      pivots.push({ index: i, type: 'SWING_HIGH', price: cur.high, confirmedAtIndex });
    }
    if (isLow) {
      pivots.push({ index: i, type: 'SWING_LOW', price: cur.low, confirmedAtIndex });
    }
  }

  return pivots.sort((a, b) => a.index - b.index);
}

/**
 * 3. Trend-Leg Detection (HH/HL and LH/LL sequences).
 */
export function detectTrendLegs(
  bars: CanonicalBar[],
  pivots: SwingPivot[],
  minBars = 3
): TrendLeg[] {
  const legs: TrendLeg[] = [];
  if (pivots.length < 2) return legs;

  let currentDirection: 'BULL' | 'BEAR' | null = null;
  let legStartPivot = pivots[0];
  let legPivots: { index: number; type: 'HH' | 'HL' | 'LH' | 'LL'; price: number }[] = [];

  for (let i = 1; i < pivots.length; i++) {
    const prev = pivots[i - 1];
    const curr = pivots[i];

    if (curr.type === 'SWING_HIGH' && prev.type === 'SWING_LOW') {
      const isHH = legPivots.length > 0 && curr.price > legPivots[legPivots.length - 1].price;
      const type = isHH ? 'HH' : 'LH';
      if (currentDirection !== 'BULL') {
        if (currentDirection === 'BEAR' && legPivots.length >= 2) {
          const barCount = prev.index - legStartPivot.index + 1;
          if (barCount >= minBars) {
            legs.push({
              direction: 'BEAR',
              startBarIndex: legStartPivot.index,
              endBarIndex: prev.index,
              startPrice: legStartPivot.price,
              endPrice: prev.price,
              barCount,
              netChangePct: Math.round(((prev.price - legStartPivot.price) / legStartPivot.price) * 10000) / 100,
              pivots: [...legPivots],
            });
          }
        }
        currentDirection = 'BULL';
        legStartPivot = prev;
        legPivots = [{ index: prev.index, type: 'HL', price: prev.price }];
      }
      legPivots.push({ index: curr.index, type, price: curr.price });
    } else if (curr.type === 'SWING_LOW' && prev.type === 'SWING_HIGH') {
      const isLL = legPivots.length > 0 && curr.price < legPivots[legPivots.length - 1].price;
      const type = isLL ? 'LL' : 'HL';
      if (currentDirection !== 'BEAR') {
        if (currentDirection === 'BULL' && legPivots.length >= 2) {
          const barCount = prev.index - legStartPivot.index + 1;
          if (barCount >= minBars) {
            legs.push({
              direction: 'BULL',
              startBarIndex: legStartPivot.index,
              endBarIndex: prev.index,
              startPrice: legStartPivot.price,
              endPrice: prev.price,
              barCount,
              netChangePct: Math.round(((prev.price - legStartPivot.price) / legStartPivot.price) * 10000) / 100,
              pivots: [...legPivots],
            });
          }
        }
        currentDirection = 'BEAR';
        legStartPivot = prev;
        legPivots = [{ index: prev.index, type: 'LH', price: prev.price }];
      }
      legPivots.push({ index: curr.index, type, price: curr.price });
    }
  }

  if (currentDirection && legPivots.length >= 2) {
    const lastPivot = pivots[pivots.length - 1];
    const barCount = lastPivot.index - legStartPivot.index + 1;
    if (barCount >= minBars) {
      legs.push({
        direction: currentDirection,
        startBarIndex: legStartPivot.index,
        endBarIndex: lastPivot.index,
        startPrice: legStartPivot.price,
        endPrice: lastPivot.price,
        barCount,
        netChangePct: Math.round(((lastPivot.price - legStartPivot.price) / legStartPivot.price) * 10000) / 100,
        pivots: [...legPivots],
      });
    }
  }

  return legs;
}

/**
 * 4. Trading-Range Detection (sideways overlap criteria).
 */
export function detectTradingRanges(
  bars: CanonicalBar[],
  config: PriceActionConfig = DEFAULT_PRICE_ACTION_CONFIG
): TradingRangeBox[] {
  const ranges: TradingRangeBox[] = [];
  const minBars = config.rangeMinBars;
  const n = bars.length;
  if (n < minBars) return ranges;

  const overlapFlags: boolean[] = new Array(n).fill(false);
  for (let i = 1; i < n; i++) {
    const prev = bars[i - 1];
    const curr = bars[i];
    const overlap = Math.max(0, Math.min(prev.high, curr.high) - Math.max(prev.low, curr.low));
    const minRange = Math.min(prev.high - prev.low, curr.high - curr.low);
    if (minRange > 0 && overlap / minRange >= config.barOverlapMinRatio) {
      overlapFlags[i] = true;
    }
  }

  let windowStart = 0;
  while (windowStart <= n - minBars) {
    // Initial candidate window
    const initialBars = bars.slice(windowStart, windowStart + minBars);
    const initialOverlapCount = overlapFlags.slice(windowStart + 1, windowStart + minBars).filter(Boolean).length;
    const initialRatio = initialOverlapCount / (minBars - 1);

    if (initialRatio >= config.rangeOverlapBarPct) {
      let establishedTop = Math.max(...initialBars.map((b) => b.high));
      let establishedBottom = Math.min(...initialBars.map((b) => b.low));
      const rangeTolerance = (establishedTop - establishedBottom) * 0.25;

      let windowEnd = windowStart + minBars - 1;

      // Extend range as long as overlap continues AND bar does not break significantly beyond established range
      while (windowEnd + 1 < n) {
        const nextBar = bars[windowEnd + 1];
        const nextOverlap = overlapFlags[windowEnd + 1];

        // If bar breaks cleanly beyond established range top or bottom, it is a breakout/probe
        if (nextBar.high > establishedTop + rangeTolerance || nextBar.low < establishedBottom - rangeTolerance) {
          break;
        }

        if (nextOverlap) {
          windowEnd++;
          establishedTop = Math.max(establishedTop, nextBar.high);
          establishedBottom = Math.min(establishedBottom, nextBar.low);
        } else {
          break;
        }
      }

      const rangeBars = bars.slice(windowStart, windowEnd + 1);
      const top = Math.max(...rangeBars.map((b) => b.high));
      const bottom = Math.min(...rangeBars.map((b) => b.low));
      const height = Math.round((top - bottom) * 100) / 100;

      // Trading range confirmation: both top (resistance) and bottom (support) must be tested at least twice
      const touchesTop = rangeBars.filter((b) => b.high >= top - height * 0.25).length;
      const touchesBottom = rangeBars.filter((b) => b.low <= bottom + height * 0.25).length;

      if (touchesTop >= 2 && touchesBottom >= 2) {
        const overlapCount = overlapFlags.slice(windowStart + 1, windowEnd + 1).filter(Boolean).length;
        const overlapRatio = Math.round((overlapCount / (rangeBars.length - 1)) * 100) / 100;

        ranges.push({
          startBarIndex: windowStart,
          endBarIndex: windowEnd,
          top,
          bottom,
          height,
          barCount: windowEnd - windowStart + 1,
          overlapRatio,
        });

        windowStart = windowEnd + 1;
      } else {
        windowStart++;
      }
    } else {
      windowStart++;
    }
  }

  return ranges;
}

/**
 * 5. Setups Detection: Pullbacks (H1/H2, L1/L2), Breakouts, Failed Breakouts, MTR / Double Tops & Bottoms.
 */
export function detectSetups(
  bars: CanonicalBar[],
  classifiedBars: ClassifiedBar[],
  pivots: SwingPivot[],
  ranges: TradingRangeBox[],
  config: PriceActionConfig = DEFAULT_PRICE_ACTION_CONFIG
): PriceActionSetup[] {
  const setups: PriceActionSetup[] = [];
  const n = bars.length;
  if (n < 5) return setups;

  const ema = calculateEMA(bars, config.emaPeriod);

  function getActiveRange(idx: number): TradingRangeBox | undefined {
    return ranges.find((r) => idx >= r.startBarIndex && idx <= r.endBarIndex);
  }

  let alwaysInState: 'ALWAYS_IN_LONG' | 'ALWAYS_IN_SHORT' | 'NEUTRAL' = 'NEUTRAL';
  let bullPullbackCount = 0;
  let bearPullbackCount = 0;
  let lastBullSwingLow = bars[0].low;
  let lastBearSwingHigh = bars[0].high;

  for (let i = 1; i < n; i++) {
    const cur = bars[i];
    const prev = bars[i - 1];
    const cBar = classifiedBars[i];
    const activeRange = getActiveRange(i);

    // Dynamic Always-In state: flips on strong trend bars closing beyond EMA, or consecutive closes beyond EMA
    if ((cBar.barType === 'BULL_TREND_BAR' && cur.close > ema[i]) || (cur.close > ema[i] && prev.close > ema[i - 1])) {
      alwaysInState = 'ALWAYS_IN_LONG';
    } else if ((cBar.barType === 'BEAR_TREND_BAR' && cur.close < ema[i]) || (cur.close < ema[i] && prev.close < ema[i - 1])) {
      alwaysInState = 'ALWAYS_IN_SHORT';
    }

    // --- SETUP A: Trend Pullback H1 / H2 (Bull) ---
    if (alwaysInState === 'ALWAYS_IN_LONG' && !activeRange) {
      const isPullbackBar = cur.high <= prev.high || cur.low < prev.low;
      if (isPullbackBar) {
        bullPullbackCount++;
        lastBullSwingLow = Math.min(lastBullSwingLow, cur.low);
      } else if (cur.high > prev.high && bullPullbackCount > 0 && bullPullbackCount <= config.maxPullbackBars) {
        const setupType: SetupType = bullPullbackCount === 1 ? 'H1' : 'H2';
        const signalBarIdx = i - 1;
        const signalBar = bars[signalBarIdx];
        const invLevel = Math.round((Math.min(signalBar.low, cur.low) - 0.01) * 100) / 100;
        const leg1Height = Math.max(0.5, signalBar.high - lastBullSwingLow);
        const target = Math.round((cur.close + leg1Height) * 100) / 100;

        setups.push({
          type: setupType,
          direction: 'BULL',
          signalBarIndex: signalBarIdx,
          entryBarIndex: i,
          signalBarDate: signalBar.time,
          entryPrice: cur.close,
          invalidationLevel: invLevel,
          measuredMoveTarget: target,
          rationale: `Bull trend: Pullback made ${bullPullbackCount} counter-trend bar(s), followed by ${setupType} signal bar breaking prior high.`,
          confidenceNote: 'Not financial advice — probabilistic pullback setup. Invalidates below signal bar low.',
          parametersUsed: {
            pullbackCount: bullPullbackCount,
            emaPeriod: config.emaPeriod,
            setupType,
          },
        });

        bullPullbackCount = 0;
      }
    } else {
      bullPullbackCount = 0;
      lastBullSwingLow = cur.low;
    }

    // --- SETUP B: Trend Pullback L1 / L2 (Bear) ---
    if (alwaysInState === 'ALWAYS_IN_SHORT' && !activeRange) {
      const isPullbackBar = cur.low >= prev.low || cur.high > prev.high;
      if (isPullbackBar) {
        bearPullbackCount++;
        lastBearSwingHigh = Math.max(lastBearSwingHigh, cur.high);
      } else if (cur.low < prev.low && bearPullbackCount > 0 && bearPullbackCount <= config.maxPullbackBars) {
        const setupType: SetupType = bearPullbackCount === 1 ? 'L1' : 'L2';
        const signalBarIdx = i - 1;
        const signalBar = bars[signalBarIdx];
        const invLevel = Math.round((Math.max(signalBar.high, cur.high) + 0.01) * 100) / 100;
        const leg1Height = Math.max(0.5, lastBearSwingHigh - signalBar.low);
        const target = Math.round((cur.close - leg1Height) * 100) / 100;

        setups.push({
          type: setupType,
          direction: 'BEAR',
          signalBarIndex: signalBarIdx,
          entryBarIndex: i,
          signalBarDate: signalBar.time,
          entryPrice: cur.close,
          invalidationLevel: invLevel,
          measuredMoveTarget: target,
          rationale: `Bear trend: Pullback made ${bearPullbackCount} counter-trend bar(s), followed by ${setupType} signal bar breaking prior low.`,
          confidenceNote: 'Not financial advice — probabilistic pullback setup. Invalidates above signal bar high.',
          parametersUsed: {
            pullbackCount: bearPullbackCount,
            emaPeriod: config.emaPeriod,
            setupType,
          },
        });

        bearPullbackCount = 0;
      }
    } else {
      bearPullbackCount = 0;
      lastBearSwingHigh = cur.high;
    }

    // --- SETUP C: Trading Range Breakouts & Failed Breakout Reversals ---
    if (activeRange && i === activeRange.endBarIndex) {
      const range = activeRange;
      const breakoutBull = cur.close > range.top && cBar.barType === 'BULL_TREND_BAR';
      const breakoutBear = cur.close < range.bottom && cBar.barType === 'BEAR_TREND_BAR';

      if (breakoutBull) {
        const target = Math.round((range.top + range.height) * 100) / 100;
        setups.push({
          type: 'BREAKOUT_BULL',
          direction: 'BULL',
          signalBarIndex: i,
          entryBarIndex: i,
          signalBarDate: cur.time,
          entryPrice: cur.close,
          invalidationLevel: range.top,
          measuredMoveTarget: target,
          rationale: `Trading range breakout: Bar closed above range top ($${range.top}) with strong bull body.`,
          confidenceNote: 'Not financial advice — range breakouts have ~80% failure rate; watch for immediate follow-through.',
          parametersUsed: { rangeTop: range.top, rangeBottom: range.bottom, rangeHeight: range.height },
        });
      } else if (breakoutBear) {
        const target = Math.round((range.bottom - range.height) * 100) / 100;
        setups.push({
          type: 'BREAKOUT_BEAR',
          direction: 'BEAR',
          signalBarIndex: i,
          entryBarIndex: i,
          signalBarDate: cur.time,
          entryPrice: cur.close,
          invalidationLevel: range.bottom,
          measuredMoveTarget: target,
          rationale: `Trading range breakout: Bar closed below range bottom ($${range.bottom}) with strong bear body.`,
          confidenceNote: 'Not financial advice — range breakouts have ~80% failure rate; watch for immediate follow-through.',
          parametersUsed: { rangeTop: range.top, rangeBottom: range.bottom, rangeHeight: range.height },
        });
      }
    }

    // Failed Breakout Reversal (probed boundary and closed back inside on bar i or i-1)
    for (const r of ranges) {
      if (i >= r.endBarIndex && i <= r.endBarIndex + 3) {
        const probedAboveAndReversed =
          (cur.high > r.top && cur.close <= r.top && cur.close < cur.open) ||
          (prev.high > r.top && cur.close <= r.top && cBar.isBearSignalBar);

        const probedBelowAndReversed =
          (cur.low < r.bottom && cur.close >= r.bottom && cur.close > cur.open) ||
          (prev.low < r.bottom && cur.close >= r.bottom && cBar.isBullSignalBar);

        if (probedAboveAndReversed) {
          setups.push({
            type: 'FAILED_BREAKOUT_REVERSAL',
            direction: 'BEAR',
            signalBarIndex: i,
            entryBarIndex: i,
            signalBarDate: cur.time,
            entryPrice: cur.close,
            invalidationLevel: Math.round((Math.max(cur.high, prev.high) + 0.01) * 100) / 100,
            measuredMoveTarget: r.bottom,
            rationale: `Failed breakout reversal: Price probed above range top ($${r.top}) but closed back inside with bear reversal bar.`,
            confidenceNote: 'Not financial advice — range fade setup targeting opposite side of trading range.',
            parametersUsed: { rangeTop: r.top, rangeBottom: r.bottom },
          });
        } else if (probedBelowAndReversed) {
          setups.push({
            type: 'FAILED_BREAKOUT_REVERSAL',
            direction: 'BULL',
            signalBarIndex: i,
            entryBarIndex: i,
            signalBarDate: cur.time,
            entryPrice: cur.close,
            invalidationLevel: Math.round((Math.min(cur.low, prev.low) - 0.01) * 100) / 100,
            measuredMoveTarget: r.top,
            rationale: `Failed breakout reversal: Price probed below range bottom ($${r.bottom}) but closed back inside with bull reversal bar.`,
            confidenceNote: 'Not financial advice — range fade setup targeting opposite side of trading range.',
            parametersUsed: { rangeTop: r.top, rangeBottom: r.bottom },
          });
        }
      }
    }
  }

  // --- SETUP D: Double Top / Bottom & Major Trend Reversals (MTR) ---
  const recentPivots = pivots.slice(-6);
  for (let p = 1; p < recentPivots.length; p++) {
    const pPrev = recentPivots[p - 1];
    const pCurr = recentPivots[p];

    if (pCurr.type === 'SWING_HIGH' && pPrev.type === 'SWING_HIGH') {
      const diffPct = Math.abs(pCurr.price - pPrev.price) / pPrev.price;
      if (diffPct <= config.mtrExtremeTolerancePct) {
        const signalIdx = pCurr.confirmedAtIndex;
        if (signalIdx < n) {
          setups.push({
            type: 'DOUBLE_TOP',
            direction: 'BEAR',
            signalBarIndex: signalIdx,
            entryBarIndex: signalIdx,
            signalBarDate: bars[signalIdx].time,
            entryPrice: bars[signalIdx].close,
            invalidationLevel: Math.round((Math.max(pCurr.price, pPrev.price) + 0.01) * 100) / 100,
            measuredMoveTarget: Math.round((bars[signalIdx].close - (pCurr.price - bars[signalIdx].close)) * 100) / 100,
            rationale: `Double Top / Bear MTR: Retest of prior swing high at $${pPrev.price.toFixed(2)} within ${(diffPct * 100).toFixed(1)}% tolerance.`,
            confidenceNote: 'Not financial advice — Major Trend Reversal requires confirmation with trendline break.',
            parametersUsed: { pivot1: pPrev.price, pivot2: pCurr.price, tolerance: config.mtrExtremeTolerancePct },
          });
        }
      }
    } else if (pCurr.type === 'SWING_LOW' && pPrev.type === 'SWING_LOW') {
      const diffPct = Math.abs(pCurr.price - pPrev.price) / pPrev.price;
      if (diffPct <= config.mtrExtremeTolerancePct) {
        const signalIdx = pCurr.confirmedAtIndex;
        if (signalIdx < n) {
          setups.push({
            type: 'DOUBLE_BOTTOM',
            direction: 'BULL',
            signalBarIndex: signalIdx,
            entryBarIndex: signalIdx,
            signalBarDate: bars[signalIdx].time,
            entryPrice: bars[signalIdx].close,
            invalidationLevel: Math.round((Math.min(pCurr.price, pPrev.price) - 0.01) * 100) / 100,
            measuredMoveTarget: Math.round((bars[signalIdx].close + (bars[signalIdx].close - pCurr.price)) * 100) / 100,
            rationale: `Double Bottom / Bull MTR: Retest of prior swing low at $${pPrev.price.toFixed(2)} within ${(diffPct * 100).toFixed(1)}% tolerance.`,
            confidenceNote: 'Not financial advice — Major Trend Reversal requires confirmation with trendline break.',
            parametersUsed: { pivot1: pPrev.price, pivot2: pCurr.price, tolerance: config.mtrExtremeTolerancePct },
          });
        }
      }
    }
  }

  return setups;
}

/**
 * Master pure function running the complete Price Action detection suite.
 */
export function runPriceActionDetection(
  bars: CanonicalBar[],
  config: PriceActionConfig = DEFAULT_PRICE_ACTION_CONFIG
): DetectionResult {
  if (!Array.isArray(bars) || bars.length === 0) {
    return {
      classifiedBars: [],
      swingPivots: [],
      trendLegs: [],
      tradingRanges: [],
      setups: [],
      alwaysInState: 'NEUTRAL',
      ema20: [],
    };
  }

  const classifiedBars = classifyBars(bars, config);
  const swingPivots = detectSwingPivots(bars, config.swingPivotLookback);
  const trendLegs = detectTrendLegs(bars, swingPivots, config.minTrendLegBars);
  const tradingRanges = detectTradingRanges(bars, config);
  const setups = detectSetups(bars, classifiedBars, swingPivots, tradingRanges, config);
  const ema20 = calculateEMA(bars, config.emaPeriod);

  const lastBar = bars[bars.length - 1];
  const lastEma = ema20[ema20.length - 1];
  let alwaysInState: 'ALWAYS_IN_LONG' | 'ALWAYS_IN_SHORT' | 'NEUTRAL' = 'NEUTRAL';
  if (lastBar && lastEma) {
    if (lastBar.close > lastEma && trendLegs.length > 0 && trendLegs[trendLegs.length - 1].direction === 'BULL') {
      alwaysInState = 'ALWAYS_IN_LONG';
    } else if (lastBar.close < lastEma && trendLegs.length > 0 && trendLegs[trendLegs.length - 1].direction === 'BEAR') {
      alwaysInState = 'ALWAYS_IN_SHORT';
    }
  }

  return {
    classifiedBars,
    swingPivots,
    trendLegs,
    tradingRanges,
    setups,
    alwaysInState,
    ema20,
  };
}
