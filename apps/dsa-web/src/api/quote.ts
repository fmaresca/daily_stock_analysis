import apiClient from './index';
import { toCamelCase } from './utils';
import type { LiveQuote, CandleData } from '../types/marketData';

export interface FetchedPriceHistory {
  stockCode: string;
  stockName?: string | null;
  candles: CandleData[];
}

/**
 * Fetch a live real-time quote for a single stock code.
 * Calls GET /api/v1/stocks/{code}/quote.
 * Returns null if the backend returns 404 (ticker not found) or any error.
 */
export async function fetchLiveQuote(stockCode: string): Promise<LiveQuote | null> {
  try {
    const response = await apiClient.get<Record<string, unknown>>(
      `/api/v1/stocks/${encodeURIComponent(stockCode)}/quote`,
      { timeout: 15_000 },
    );
    const raw = toCamelCase<{
      stockCode?: string;
      stockName?: string;
      currentPrice?: number;
      change?: number;
      changePercent?: number;
      volume?: number;
      open?: number;
      high?: number;
      low?: number;
      prevClose?: number;
      updateTime?: string;
    }>(response.data);

    const price = raw.currentPrice ?? 0;
    if (price <= 0) {
      return null;
    }

    return {
      stockCode: raw.stockCode ?? stockCode,
      stockName: raw.stockName ?? null,
      currentPrice: price,
      change: raw.change ?? null,
      changePct: raw.changePercent ?? null,
      volume: raw.volume ?? null,
      open: raw.open ?? null,
      high: raw.high ?? null,
      low: raw.low ?? null,
      prevClose: raw.prevClose ?? null,
      updatedAt: raw.updateTime ?? new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

/**
 * Fetch 30-day daily OHLCV history for a single stock code.
 * Calls GET /api/v1/stocks/{code}/history?period=daily&days=50.
 * Returns empty candles array on error.
 */
export async function fetchPriceHistory(
  stockCode: string,
  days = 50,
): Promise<FetchedPriceHistory> {
  try {
    const response = await apiClient.get<Record<string, unknown>>(
      `/api/v1/stocks/${encodeURIComponent(stockCode)}/history`,
      {
        params: { period: 'daily', days },
        timeout: 20_000,
      },
    );

    const raw = toCamelCase<{
      stockCode?: string;
      stockName?: string;
      data?: Array<{
        date?: string;
        open?: number;
        high?: number;
        low?: number;
        close?: number;
        volume?: number;
      }>;
    }>(response.data);

    const candles: CandleData[] = (raw.data ?? [])
      .filter((d) => d.date && (d.close ?? 0) > 0)
      .map((d) => ({
        time: d.date!,
        open: d.open ?? d.close ?? 0,
        high: d.high ?? d.close ?? 0,
        low: d.low ?? d.close ?? 0,
        close: d.close ?? 0,
        volume: d.volume,
      }))
      .sort((a, b) => a.time.localeCompare(b.time));

    return {
      stockCode: raw.stockCode ?? stockCode,
      stockName: raw.stockName ?? null,
      candles,
    };
  } catch {
    return { stockCode, candles: [] };
  }
}
