/**
 * Live market quote returned from GET /api/v1/stocks/{code}/quote.
 */
export interface LiveQuote {
  stockCode: string;
  stockName?: string | null;
  currentPrice: number;
  change?: number | null;
  changePct?: number | null;
  volume?: number | null;
  open?: number | null;
  high?: number | null;
  low?: number | null;
  prevClose?: number | null;
  updatedAt?: string | null;
}

/**
 * Technical indicator snapshot computed from 30-day OHLCV history.
 */
export interface TechnicalSnapshot {
  ema20?: number | null;
  ema50?: number | null;
  rsi14?: number | null;
  atr14?: number | null;
  aboveEma20: boolean;
  aboveEma50: boolean;
  /** RSI interpretation bucket */
  rsiSignal: 'oversold' | 'neutral' | 'overbought';
}

/**
 * Lifecycle state of a watchlist entry's market data hydration.
 *
 * pending    – added to watchlist but fetch not yet started
 * hydrating  – fetch in flight
 * ready      – live quote + technicals available
 * failed     – all providers returned an error or empty data
 */
export type HydrationStatus = 'pending' | 'hydrating' | 'ready' | 'failed';

/** OHLCV candle — matches tradeSetup.ts CandleData shape */
export interface CandleData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

/**
 * One entry in the watchlist quote cache.
 */
export interface WatchlistQuoteEntry {
  stockCode: string;
  status: HydrationStatus;
  quote?: LiveQuote;
  technicals?: TechnicalSnapshot;
  candles?: CandleData[];
  /** Unix epoch ms when hydration completed */
  hydratedAt?: number;
  error?: string;
}
