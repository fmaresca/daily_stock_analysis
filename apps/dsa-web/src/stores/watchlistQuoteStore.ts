import { create } from 'zustand';
import { fetchLiveQuote, fetchPriceHistory } from '../api/quote';
import type {
  CandleData,
  HydrationStatus,
  TechnicalSnapshot,
  WatchlistQuoteEntry,
} from '../types/marketData';

// ---------------------------------------------------------------------------
// Technical indicator helpers (pure functions, no deps)
// ---------------------------------------------------------------------------

/** Simple EMA over a close-price series (oldest first). */
function computeEMA(closes: number[], period: number): number | null {
  if (closes.length < period) return null;
  const k = 2 / (period + 1);
  let ema = closes.slice(0, period).reduce((s, v) => s + v, 0) / period;
  for (let i = period; i < closes.length; i++) {
    ema = closes[i] * k + ema * (1 - k);
  }
  return +ema.toFixed(4);
}

/** Wilder RSI (14) */
function computeRSI(closes: number[], period = 14): number | null {
  if (closes.length < period + 1) return null;
  let avgGain = 0;
  let avgLoss = 0;

  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) avgGain += diff;
    else avgLoss += Math.abs(diff);
  }
  avgGain /= period;
  avgLoss /= period;

  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    const gain = diff >= 0 ? diff : 0;
    const loss = diff < 0 ? Math.abs(diff) : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
  }

  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return +(100 - 100 / (1 + rs)).toFixed(2);
}

/** Average True Range (14) — requires high/low/close data */
function computeATR(candles: CandleData[], period = 14): number | null {
  if (candles.length < period + 1) return null;
  const trs: number[] = [];
  for (let i = 1; i < candles.length; i++) {
    const high = candles[i].high;
    const low = candles[i].low;
    const prevClose = candles[i - 1].close;
    trs.push(Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose)));
  }
  const atr = trs.slice(-period).reduce((s, v) => s + v, 0) / period;
  return +atr.toFixed(4);
}

function deriveTechnicals(candles: CandleData[]): TechnicalSnapshot {
  const closes = candles.map((c) => c.close);
  const ema20 = computeEMA(closes, 20);
  const ema50 = computeEMA(closes, 50);
  const rsi14 = computeRSI(closes, 14);
  const atr14 = computeATR(candles, 14);
  const lastClose = closes[closes.length - 1] ?? 0;

  let rsiSignal: TechnicalSnapshot['rsiSignal'] = 'neutral';
  if (rsi14 !== null) {
    if (rsi14 < 30) rsiSignal = 'oversold';
    else if (rsi14 > 70) rsiSignal = 'overbought';
  }

  return {
    ema20,
    ema50,
    rsi14,
    atr14,
    aboveEma20: ema20 !== null ? lastClose > ema20 : false,
    aboveEma50: ema50 !== null ? lastClose > ema50 : false,
    rsiSignal,
  };
}

// ---------------------------------------------------------------------------
// TTL – 5 minutes in ms
// ---------------------------------------------------------------------------
const HYDRATION_TTL_MS = 5 * 60 * 1000;

function isStale(entry: WatchlistQuoteEntry): boolean {
  if (entry.status !== 'ready') return true;
  if (!entry.hydratedAt) return true;
  return Date.now() - entry.hydratedAt > HYDRATION_TTL_MS;
}

// ---------------------------------------------------------------------------
// Store shape
// ---------------------------------------------------------------------------
interface WatchlistQuoteState {
  cache: Record<string, WatchlistQuoteEntry>;
  /** Hydrate a single ticker. Skips if already hydrating or fresh. */
  hydrateOne: (stockCode: string) => Promise<void>;
  /** Hydrate all tickers concurrently (max 4 in-flight). */
  hydrateAll: (stockCodes: string[]) => Promise<void>;
  /** Force re-fetch regardless of TTL. */
  invalidate: (stockCode: string) => Promise<void>;
  /** Mark all ready entries as stale so the next hydrateAll re-fetches. */
  invalidateAll: () => void;
}

// ---------------------------------------------------------------------------
// Store implementation
// ---------------------------------------------------------------------------
export const useWatchlistQuoteStore = create<WatchlistQuoteState>()((set, get) => {
  // Track in-flight promises so concurrent callers share the same fetch.
  const inFlight: Record<string, Promise<void>> = {};

  async function _doHydrate(stockCode: string): Promise<void> {
    const key = stockCode.toUpperCase();

    set((s) => ({
      cache: {
        ...s.cache,
        [key]: {
          ...(s.cache[key] ?? { stockCode }),
          stockCode,
          status: 'hydrating' as HydrationStatus,
        },
      },
    }));

    try {
      const [quote, history] = await Promise.all([
        fetchLiveQuote(stockCode),
        fetchPriceHistory(stockCode, 60),
      ]);

      if (!quote) {
        set((s) => ({
          cache: {
            ...s.cache,
            [key]: {
              stockCode,
              status: 'failed',
              error: 'Provider returned no price data',
            },
          },
        }));
        return;
      }

      const technicals = history.candles.length >= 15
        ? deriveTechnicals(history.candles)
        : undefined;

      set((s) => ({
        cache: {
          ...s.cache,
          [key]: {
            stockCode,
            status: 'ready',
            quote,
            technicals,
            candles: history.candles,
            hydratedAt: Date.now(),
            error: undefined,
          },
        },
      }));
    } catch (err) {
      set((s) => ({
        cache: {
          ...s.cache,
          [key]: {
            stockCode,
            status: 'failed',
            error: err instanceof Error ? err.message : 'Unknown error',
          },
        },
      }));
    } finally {
      delete inFlight[key];
    }
  }

  return {
    cache: {},

    hydrateOne: async (stockCode: string): Promise<void> => {
      const key = stockCode.toUpperCase();
      const existing = get().cache[key];

      // Skip if currently hydrating or recently completed (within TTL)
      if (existing?.status === 'hydrating') {
        return inFlight[key] ?? Promise.resolve();
      }
      if (existing && !isStale(existing)) {
        return Promise.resolve();
      }

      // Set pending immediately so the UI can show a spinner right away
      if (!existing || existing.status !== 'hydrating') {
        set((s) => ({
          cache: {
            ...s.cache,
            [key]: {
              ...(s.cache[key] ?? { stockCode }),
              stockCode,
              status: 'pending' as HydrationStatus,
            },
          },
        }));
      }

      // Share in-flight promise
      if (!inFlight[key]) {
        inFlight[key] = _doHydrate(stockCode);
      }
      return inFlight[key];
    },

    hydrateAll: async (stockCodes: string[]): Promise<void> => {
      if (!stockCodes.length) return;

      const state = get();
      const toFetch = stockCodes.filter((code) => {
        const key = code.toUpperCase();
        const entry = state.cache[key];
        return !entry || isStale(entry) || entry.status === 'failed';
      });

      if (!toFetch.length) return;

      const CONCURRENCY = 4;
      let idx = 0;

      const worker = async () => {
        while (idx < toFetch.length) {
          const code = toFetch[idx++];
          if (code) await get().hydrateOne(code);
        }
      };

      await Promise.allSettled(
        Array.from({ length: Math.min(CONCURRENCY, toFetch.length) }, () => worker()),
      );
    },

    invalidate: async (stockCode: string): Promise<void> => {
      const key = stockCode.toUpperCase();
      set((s) => {
        const { [key]: _removed, ...rest } = s.cache;
        return { cache: rest };
      });
      return get().hydrateOne(stockCode);
    },

    invalidateAll: () => {
      set((s) => {
        const updated: Record<string, WatchlistQuoteEntry> = {};
        for (const [k, v] of Object.entries(s.cache)) {
          updated[k] = { ...v, hydratedAt: undefined, status: 'pending' };
        }
        return { cache: updated };
      });
    },
  };
});
