import { useCallback, useEffect, useRef, useState } from 'react';
import { systemConfigApi } from '../api/systemConfig';
import { findMatchingStockCode, includesStockCode } from '../utils/stockCode';
import { useWatchlistQuoteStore } from '../stores/watchlistQuoteStore';

export interface UseWatchlistReturn {
  watchlistCodes: string[];
  isLoading: boolean;
  isActioning: boolean;
  actionMessage: string | null;
  isInWatchlist: (stockCode: string) => boolean;
  addToWatchlist: (stockCode: string) => Promise<void>;
  removeFromWatchlist: (stockCode: string) => Promise<void>;
  toggleWatchlist: (stockCode: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useWatchlist(): UseWatchlistReturn {
  const hydrateOne = useWatchlistQuoteStore((s) => s.hydrateOne);
  const hydrateAll = useWatchlistQuoteStore((s) => s.hydrateAll);
  const [codes, setCodes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isActioning, setIsActioning] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const messageTimerRef = useRef<number | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (messageTimerRef.current !== null) {
        window.clearTimeout(messageTimerRef.current);
      }
    };
  }, []);

  const refresh = useCallback(async () => {
    try {
      const result = await systemConfigApi.getWatchlist();
      if (mountedRef.current) {
        setCodes(result);
        // Hydrate all existing watchlist entries so no ticker shows placeholder data
        void hydrateAll(result);
      }
    } catch {
      // keep existing codes
    }
  }, [hydrateAll]);

  useEffect(() => {
    setIsLoading(true);
    void refresh().finally(() => {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    });
  }, [refresh]);

  const showMessage = useCallback((msg: string) => {
    if (messageTimerRef.current !== null) {
      window.clearTimeout(messageTimerRef.current);
    }
    setActionMessage(msg);
    messageTimerRef.current = window.setTimeout(() => {
      if (mountedRef.current) {
        setActionMessage(null);
      }
    }, 3000);
  }, []);

  const isInWatchlist = useCallback(
    (stockCode: string) => includesStockCode(codes, stockCode),
    [codes],
  );

  const addToWatchlist = useCallback(async (stockCode: string) => {
    if (!stockCode || isActioning) return;
    setIsActioning(true);
    try {
      const result = await systemConfigApi.addToWatchlist(stockCode);
      if (mountedRef.current) {
        setCodes(result);
        showMessage(`已加入自选 ${stockCode}`);
        // Immediately trigger market data hydration so the screener never
        // shows the $100.00 placeholder for a freshly-added ticker.
        void hydrateOne(stockCode);
      }
    } catch {
      if (mountedRef.current) showMessage('操作失败');
    } finally {
      if (mountedRef.current) setIsActioning(false);
    }
  }, [isActioning, showMessage, hydrateOne]);

  const removeFromWatchlist = useCallback(async (stockCode: string) => {
    if (!stockCode || isActioning) return;
    setIsActioning(true);
    try {
      const result = await systemConfigApi.removeFromWatchlist(stockCode);
      if (mountedRef.current) {
        setCodes(result);
        showMessage(`已从自选移除 ${stockCode}`);
      }
    } catch {
      if (mountedRef.current) showMessage('操作失败');
    } finally {
      if (mountedRef.current) setIsActioning(false);
    }
  }, [isActioning, showMessage]);

  const toggleWatchlist = useCallback(async (stockCode: string) => {
    const existingStockCode = findMatchingStockCode(codes, stockCode);
    if (existingStockCode) {
      await removeFromWatchlist(existingStockCode);
    } else {
      await addToWatchlist(stockCode);
    }
  }, [codes, removeFromWatchlist, addToWatchlist]);

  return {
    watchlistCodes: codes,
    isLoading,
    isActioning,
    actionMessage,
    isInWatchlist,
    addToWatchlist,
    removeFromWatchlist,
    toggleWatchlist,
    refresh,
  };
}
