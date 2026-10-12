/**
 * Market Regime Classification via Index Proxies (SPX & NDX)
 * ============================================================
 * Brooks Price Action Methodology (Al Brooks, John Wiley & Sons)
 * 
 * Reuses pure trend-leg and trading-range detection from detect.ts
 * over broad market index daily bar series (SPX / NDX, proxied via SPY / QQQ).
 * 
 * Classifies broad market into:
 * 1. Direction: 'BULL' | 'BEAR' | 'RANGE'
 * 2. Phase: e.g. "bull leg 3, extended", "bear leg 1", "range, 22 bars, mid"
 * 3. Agreement: 'AGREE' | 'MIXED' | 'CONFLICT'
 * 
 * Single Clock Authority:
 * Uses web/src/utils/appNow.ts for America/New_York (ET) date anchoring.
 * 
 * Storage Policy:
 * Append-only regime history log (date -> regime). Never rewrites past records.
 * 
 * Disclaimer:
 * Not financial advice — pattern detection and market regime classifications are probabilistic.
 */

import type { CanonicalBar } from './bars.ts';
import {
  detectSwingPivots,
  detectTrendLegs,
  detectTradingRanges,
  calculateEMA,
  DEFAULT_PRICE_ACTION_CONFIG,
  type PriceActionConfig,
} from './detect.ts';
import { now, todayET, nowET, getPartsET } from '../utils/appNow.ts';

export type MarketDirection = 'BULL' | 'BEAR' | 'RANGE';
export type MarketAgreement = 'AGREE' | 'MIXED' | 'CONFLICT';

export interface IndexRegime {
  symbol: string;
  direction: MarketDirection;
  phase: string;
  legNumber: number;
  isExtended: boolean;
  rangeBars?: number;
  rangePosition?: 'top' | 'mid' | 'bottom';
  lastClose: number;
  ema20: number;
  lastBarDate: string;
}

export interface MarketRegime {
  spx: IndexRegime;
  ndx: IndexRegime;
  agreement: MarketAgreement;
  summary: string;
  guidanceNote: string;
  asOfBarDate: string;
  evaluatedAt: string;
  confidenceNote: string;
}

export interface RegimeHistoryEntry {
  date: string;
  regime: MarketRegime;
  recordedAt: string;
}

export const REGIME_HISTORY_STORAGE_KEY = 'deltaharvest_price_action_regime_history';

/**
 * Classifies an index series into { direction, phase } based on swing legs,
 * trading ranges, and 20-EMA relationship.
 */
export function classifyIndexRegime(
  bars: CanonicalBar[],
  symbol = 'SPX',
  config: PriceActionConfig = DEFAULT_PRICE_ACTION_CONFIG
): IndexRegime {
  if (bars.length === 0) {
    return {
      symbol,
      direction: 'RANGE',
      phase: 'range, 0 bars, mid',
      legNumber: 0,
      isExtended: false,
      lastClose: 0,
      ema20: 0,
      lastBarDate: todayET(),
    };
  }

  const lastBar = bars[bars.length - 1];
  const lastIndex = bars.length - 1;
  const ema = calculateEMA(bars, config.emaPeriod);
  const lastEma = ema.length > 0 ? ema[ema.length - 1] : lastBar.close;

  // 1. Detect trading ranges first
  const ranges = detectTradingRanges(bars, config);
  const activeRange = ranges.length > 0 ? ranges[ranges.length - 1] : null;

  // Check if price is actively consolidating within a recent trading range
  // (Recent range covers up to near the end of series, e.g. within 2 bars)
  const isCurrentlyInTradingRange =
    activeRange !== null &&
    activeRange.endBarIndex >= lastIndex - 2 &&
    lastBar.close <= activeRange.top * 1.01 &&
    lastBar.close >= activeRange.bottom * 0.99;

  if (isCurrentlyInTradingRange && activeRange) {
    const rangeHeight = Math.max(0.01, activeRange.top - activeRange.bottom);
    const relPos = (lastBar.close - activeRange.bottom) / rangeHeight;
    const rangePosition: 'top' | 'mid' | 'bottom' =
      relPos >= 0.67 ? 'top' : relPos <= 0.33 ? 'bottom' : 'mid';

    return {
      symbol,
      direction: 'RANGE',
      phase: `range, ${activeRange.barCount} bars, ${rangePosition}`,
      legNumber: 0,
      isExtended: false,
      rangeBars: activeRange.barCount,
      rangePosition,
      lastClose: lastBar.close,
      ema20: lastEma,
      lastBarDate: lastBar.time,
    };
  }

  // 2. Trend-Leg and Swing Analysis
  const pivots = detectSwingPivots(bars, config.swingPivotLookback);
  const legs = detectTrendLegs(bars, pivots, 3);

  if (legs.length > 0) {
    const latestLeg = legs[legs.length - 1];

    if (latestLeg.direction === 'BULL') {
      // Count bull impulses (HH count in current or recent sequence)
      const hhCount = latestLeg.pivots.filter((p) => p.type === 'HH').length;
      const legNumber = Math.max(1, hhCount || 1);
      // Extended if 3 or more legs, or leg length exceeds 15 bars, or price > 4% above 20-EMA
      const emaPcr = lastEma > 0 ? (lastBar.close - lastEma) / lastEma : 0;
      const isExtended = legNumber >= 3 || latestLeg.barCount >= 15 || emaPcr > 0.04;

      return {
        symbol,
        direction: 'BULL',
        phase: `bull leg ${legNumber}${isExtended ? ', extended' : ''}`,
        legNumber,
        isExtended,
        lastClose: lastBar.close,
        ema20: lastEma,
        lastBarDate: lastBar.time,
      };
    } else {
      // BEAR leg
      const llCount = latestLeg.pivots.filter((p) => p.type === 'LL').length;
      const legNumber = Math.max(1, llCount || 1);
      const emaPcr = lastEma > 0 ? (lastEma - lastBar.close) / lastEma : 0;
      const isExtended = legNumber >= 3 || latestLeg.barCount >= 15 || emaPcr > 0.04;

      return {
        symbol,
        direction: 'BEAR',
        phase: `bear leg ${legNumber}${isExtended ? ', extended' : ''}`,
        legNumber,
        isExtended,
        lastClose: lastBar.close,
        ema20: lastEma,
        lastBarDate: lastBar.time,
      };
    }
  }

  // 3. Fallback for few bars / early series: compare against 20-EMA
  if (lastBar.close > lastEma * 1.005) {
    return {
      symbol,
      direction: 'BULL',
      phase: 'bull leg 1',
      legNumber: 1,
      isExtended: false,
      lastClose: lastBar.close,
      ema20: lastEma,
      lastBarDate: lastBar.time,
    };
  } else if (lastBar.close < lastEma * 0.995) {
    return {
      symbol,
      direction: 'BEAR',
      phase: 'bear leg 1',
      legNumber: 1,
      isExtended: false,
      lastClose: lastBar.close,
      ema20: lastEma,
      lastBarDate: lastBar.time,
    };
  } else {
    return {
      symbol,
      direction: 'RANGE',
      phase: `range, ${bars.length} bars, mid`,
      legNumber: 0,
      isExtended: false,
      rangeBars: bars.length,
      rangePosition: 'mid',
      lastClose: lastBar.close,
      ema20: lastEma,
      lastBarDate: lastBar.time,
    };
  }
}

/**
 * Combines SPX and NDX index regimes into a single market regime object.
 * When indexes disagree, reports both plainly with a "mixed — reduce size / wait" note.
 */
export function evaluateMarketRegime(
  spxBars: CanonicalBar[],
  ndxBars: CanonicalBar[],
  options: {
    spxSymbol?: string;
    ndxSymbol?: string;
    config?: PriceActionConfig;
    asOfDate?: string;
  } = {}
): MarketRegime {
  const spxSymbol = options.spxSymbol || 'SPX';
  const ndxSymbol = options.ndxSymbol || 'NDX';
  const config = options.config || DEFAULT_PRICE_ACTION_CONFIG;

  const spx = classifyIndexRegime(spxBars, spxSymbol, config);
  const ndx = classifyIndexRegime(ndxBars, ndxSymbol, config);

  // Determine agreement
  let agreement: MarketAgreement = 'AGREE';
  let guidanceNote = '';

  if (spx.direction === ndx.direction) {
    agreement = 'AGREE';
    if (spx.direction === 'BULL') {
      guidanceNote = 'Both SPX and NDX in bull trend. Long pullback setups (H1/H2) favored.';
    } else if (spx.direction === 'BEAR') {
      guidanceNote = 'Both SPX and NDX in bear trend. Defensive posture and bear setups (L1/L2) favored.';
    } else {
      guidanceNote = 'Both SPX and NDX in trading range. Favor buying support / selling resistance; avoid breakout chasing.';
    }
  } else if (
    (spx.direction === 'BULL' && ndx.direction === 'BEAR') ||
    (spx.direction === 'BEAR' && ndx.direction === 'BULL')
  ) {
    agreement = 'CONFLICT';
    guidanceNote = 'Severe index divergence (SPX vs NDX conflict). Reduce size, sit on hands / hedge; directional bias low.';
  } else {
    // One is trending, other is in a trading range
    agreement = 'MIXED';
    guidanceNote = 'Mixed — reduce size / wait. One index trending while other consolidates; selective setups only.';
  }

  const asOfBarDate = options.asOfDate || spx.lastBarDate || ndx.lastBarDate || todayET();
  const evaluatedAt = now().toISOString();

  // Format concise summary banner string
  const spxLabel = spx.direction === 'BULL' ? 'bull trend' : spx.direction === 'BEAR' ? 'bear trend' : 'trading range';
  const ndxLabel = ndx.direction === 'BULL' ? 'bull trend' : ndx.direction === 'BEAR' ? 'bear trend' : 'trading range';
  const summary = `${spxSymbol}: ${spxLabel} (${spx.phase}) · ${ndxSymbol}: ${ndxLabel} (${ndx.phase}) · ${agreement.toLowerCase()} — as of ${asOfBarDate} close`;

  return {
    spx,
    ndx,
    agreement,
    summary,
    guidanceNote,
    asOfBarDate,
    evaluatedAt,
    confidenceNote: 'Not financial advice — pattern detection and market regime classifications are probabilistic.',
  };
}

/**
 * Retrieves the append-only regime history log from localStorage.
 */
export function getRegimeHistory(): RegimeHistoryEntry[] {
  if (typeof window === 'undefined' || !window.localStorage) {
    return [];
  }
  try {
    const raw = window.localStorage.getItem(REGIME_HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.sort((a, b) => a.date.localeCompare(b.date));
    }
  } catch (err) {
    console.warn('[PriceActionRegime] Failed to read regime history from storage:', err);
  }
  return [];
}

/**
 * Persists a new regime record into the append-only history log.
 * Strict Invariant: Never rewrites past history. If an entry for `date` exists,
 * the existing entry is preserved unchanged.
 */
export function recordRegimeHistory(date: string, regime: MarketRegime): RegimeHistoryEntry[] {
  if (!date || typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return getRegimeHistory();
  }

  const history = getRegimeHistory();
  const existingIndex = history.findIndex((h) => h.date === date);

  // Append-only rule: never overwrite past history
  if (existingIndex >= 0) {
    return history;
  }

  const newEntry: RegimeHistoryEntry = {
    date,
    regime,
    recordedAt: now().toISOString(),
  };

  const updated = [...history, newEntry].sort((a, b) => a.date.localeCompare(b.date));

  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(REGIME_HISTORY_STORAGE_KEY, JSON.stringify(updated));
    } catch (err) {
      console.warn('[PriceActionRegime] Failed to persist regime history to storage:', err);
    }
  }

  return updated;
}

/**
 * Evaluates whether a new post-close regime evaluation is due for the current trading day.
 * Triggered after US market close (4:00 PM ET) using Single Clock Authority.
 */
export function isPostCloseRegimeEvaluationDue(history: RegimeHistoryEntry[] = getRegimeHistory()): boolean {
  const parts = getPartsET(now());
  // Skip weekends (0 = Sunday, 6 = Saturday)
  if (parts.dayOfWeek === 0 || parts.dayOfWeek === 6) {
    return false;
  }

  // After 4:00 PM (16:00) ET
  const isPostClose = parts.hours > 16 || (parts.hours === 16 && parts.minutes >= 0);
  if (!isPostClose) {
    return false;
  }

  const curDate = parts.ymd;
  const alreadyRecorded = history.some((h) => h.date === curDate);
  return !alreadyRecorded;
}
