import { useState, useEffect, useCallback, useRef } from 'react';
import { OptionsDataPayload, TickerMeta, OptionOpportunity } from '../types/options';
import { fetchClientSideLiveMarketData } from '../utils/liveMarketFetcher';
import { evaluateAndDispatchAlerts } from '../utils/alertDispatcher';
import {
  loadAutoSyncSettings,
  saveAutoSyncSettings,
  isUsMarketOpen,
  AutoSyncCadence,
} from '../utils/marketHoursAndAutoSync';

export function useOptionsData(currentWatchlistSymbols: string[]) {
  const [dataPayload, setDataPayload] = useState<OptionsDataPayload | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRecalculating, setIsRecalculating] = useState<boolean>(false);
  const [dataSource, setDataSource] = useState<string>('Local JSON');
  const [lastLiveFetchTime, setLastLiveFetchTime] = useState<string>(() => {
    return typeof localStorage !== 'undefined'
      ? localStorage.getItem('deltaharvest_last_live_fetch') || ''
      : '';
  });

  // Auto-Sync & Rate Limit Safety State
  const [autoSyncSettings, setAutoSyncSettings] = useState(() => loadAutoSyncSettings());
  const [autoSyncCountdown, setAutoSyncCountdown] = useState<number>(autoSyncSettings.intervalSeconds);
  const [isThrottled, setIsThrottled] = useState<boolean>(false);
  const [isMarketOpen, setIsMarketOpen] = useState<boolean>(() => isUsMarketOpen());

  // Ref to always access latest symbols and dataPayload in timers without tearing down intervals
  const watchlistSymbolsRef = useRef(currentWatchlistSymbols);
  watchlistSymbolsRef.current = currentWatchlistSymbols;

  const dataPayloadRef = useRef(dataPayload);
  dataPayloadRef.current = dataPayload;

  // 1. Fetch initial or refreshed data
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    let loaded = false;

    // 0. Priority: Restore locally cached live market snapshot if present
    try {
      const savedPayloadStr = localStorage.getItem('deltaharvest_live_payload');
      if (savedPayloadStr) {
        const savedPayload: OptionsDataPayload = JSON.parse(savedPayloadStr);
        if (savedPayload && Array.isArray(savedPayload.tickers) && savedPayload.tickers.length > 0) {
          const hasStaleDefaults = savedPayload.tickers.some(
            (t) => t.spot_price === 100 && t.avg_volume_30 === 1000000 && t.sma_20 === 100
          );
          if (!hasStaleDefaults) {
            setDataPayload(savedPayload);
            setDataSource('Live Market Feed');
            const savedTime = localStorage.getItem('deltaharvest_last_live_fetch');
            if (savedTime) setLastLiveFetchTime(savedTime);
            loaded = true;
          } else {
            console.warn('[DeltaHarvest] Purged stale cached payload containing defaulted placeholder values');
            try {
              localStorage.removeItem('deltaharvest_live_payload');
            } catch {}
          }
        }
      }
    } catch (e) {
      console.warn('Failed to parse cached live payload from storage', e);
    }

    // 1. Primary: Attempt live FastAPI backend endpoint (if available)
    if (!loaded) {
      try {
        const res = await fetch('/api/v1/options/snapshot');
        const contentType = res.headers.get('content-type') || '';
        if (res.ok && contentType.includes('application/json')) {
          const json: OptionsDataPayload = await res.json();
          if (json.tickers && json.tickers.length > 0) {
            setDataPayload(json);
            setDataSource('FastAPI Live Engine');
            loaded = true;
          }
        }
      } catch {
        // Backend not running / static host - continue to local fallback
      }
    }

    // 2. Fallback: Local public JSON path
    if (!loaded) {
      try {
        const res = await fetch('./data/options_data.json?t=' + Date.now());
        const contentType = res.headers.get('content-type') || '';
        if (res.ok && contentType.includes('application/json')) {
          const json: OptionsDataPayload = await res.json();
          if (json.tickers && json.tickers.length > 0) {
            setDataPayload(json);
            setDataSource('Local JSON');
            loaded = true;
          }
        }
      } catch (e) {
        console.warn('Local ./data/options_data.json failed:', e);
      }
    }

    // 3. Fallback: Absolute public root /data/options_data.json
    if (!loaded) {
      try {
        const res = await fetch('/data/options_data.json');
        const contentType = res.headers.get('content-type') || '';
        if (res.ok && contentType.includes('application/json')) {
          const json: OptionsDataPayload = await res.json();
          if (json.tickers && json.tickers.length > 0) {
            setDataPayload(json);
            setDataSource('Root /data');
            loaded = true;
          }
        }
      } catch (e) {
        console.warn('Root /data/options_data.json failed:', e);
      }
    }

    // 4. Fallback: GitHub Raw
    if (!loaded) {
      try {
        const res = await fetch(
          'https://raw.githubusercontent.com/fmaresca/daily_stock_analysis/main/web/public/data/options_data.json'
        );
        if (res.ok) {
          const json: OptionsDataPayload = await res.json();
          setDataPayload(json);
          setDataSource('GitHub Raw');
        }
      } catch (e) {
        console.error('All data loading attempts failed:', e);
      }
    }
    setIsLoading(false);
  }, []);

  // 2. Live on-demand recalculation
  const handleLiveRecalculate = useCallback(async (tickersToRecalc?: string[]) => {
    setIsRecalculating(true);
    const targetTickers =
      tickersToRecalc && tickersToRecalc.length > 0
        ? tickersToRecalc
        : watchlistSymbolsRef.current;

    let success = false;

    // 1. Primary: Attempt FastAPI backend calculation
    try {
      const res = await fetch('/api/v1/options/recalculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tickers: targetTickers, enrich: false }),
      });

      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const json: OptionsDataPayload = await res.json();
        if (json.tickers && json.tickers.length > 0) {
          const incomingTickers = json.tickers;
          const incomingOpps = json.opportunities || [];
          setDataPayload((prev) => {
            if (!prev || !prev.tickers) return json;
            const tickerMap = new Map<string, TickerMeta>();
            prev.tickers.forEach((t) => tickerMap.set(t.symbol, t));
            incomingTickers.forEach((t) => tickerMap.set(t.symbol, t));

            const oppMap = new Map<string, OptionOpportunity>();
            (prev.opportunities || []).forEach((o) => {
              const k = o.id || `${o.strategy}_${o.symbol}_${o.strike}`;
              oppMap.set(k, o);
            });
            incomingOpps.forEach((o) => {
              const k = o.id || `${o.strategy}_${o.symbol}_${o.strike}`;
              oppMap.set(k, o);
            });

            return {
              ...json,
              tickers: Array.from(tickerMap.values()),
              opportunities: Array.from(oppMap.values()),
            };
          });
          setDataSource('FastAPI Live Engine');
          success = true;
        }
      }
    } catch {
      // Backend not running, execute client-side engine
    }

    // 2. Fallback: Client-Side Real-Time Market Engine
    if (!success) {
      try {
        const livePayload = await fetchClientSideLiveMarketData(dataPayloadRef.current, targetTickers);
        if (livePayload.tickers && livePayload.tickers.length > 0) {
          setDataPayload(livePayload);
          setDataSource('Live Market Feed');
          try {
            const hasDefaulted = livePayload.tickers.some(
              (t) => t.spot_price === 100 && t.avg_volume_30 === 1000000 && t.sma_20 === 100
            );
            if (!hasDefaulted) {
              localStorage.setItem('deltaharvest_live_payload', JSON.stringify(livePayload));
            }
          } catch (storageErr) {
            console.warn('Failed to persist live payload', storageErr);
          }
          success = true;
        }
      } catch (clientErr) {
        console.warn('Client-side live fetch exception, falling back to cached snapshot:', clientErr);
        await fetchData();
      }
    }

    if (success) {
      const nowIso = new Date().toISOString();
      setLastLiveFetchTime(nowIso);
      try {
        localStorage.setItem('deltaharvest_last_live_fetch', nowIso);
      } catch (e) {
        console.warn('Failed to save last live fetch time', e);
      }

      setTimeout(() => {
        const currentTickers = dataPayloadRef.current?.tickers || [];
        const currentOpps = dataPayloadRef.current?.opportunities || [];
        evaluateAndDispatchAlerts(currentTickers, currentOpps).catch((err) => {
          console.warn('Alert evaluation failed:', err);
        });
      }, 500);
    }

    setIsRecalculating(false);
  }, [fetchData]);

  // Auto-sync intervals handler
  const handleAutoSyncIntervalChange = useCallback((intervalSeconds: AutoSyncCadence) => {
    setAutoSyncSettings((prev) => {
      const updated = { ...prev, intervalSeconds };
      saveAutoSyncSettings(updated);
      return updated;
    });
    setAutoSyncCountdown(intervalSeconds);
    if (intervalSeconds > 0) {
      setIsThrottled(false);
    }
  }, []);

  const handleToggleMarketHoursOnly = useCallback(() => {
    setAutoSyncSettings((prev) => {
      const updated = { ...prev, marketHoursOnly: !prev.marketHoursOnly };
      saveAutoSyncSettings(updated);
      return updated;
    });
  }, []);

  // Background auto-sync countdown loop
  useEffect(() => {
    const timer = setInterval(() => {
      const marketOpen = isUsMarketOpen();
      setIsMarketOpen(marketOpen);

      if (autoSyncSettings.intervalSeconds <= 0 || isThrottled) {
        return;
      }

      if (autoSyncSettings.marketHoursOnly && !marketOpen) {
        return;
      }

      if (isLoading || isRecalculating) {
        return;
      }

      setAutoSyncCountdown((prev) => {
        if (prev <= 1) {
          handleLiveRecalculate(watchlistSymbolsRef.current);
          return autoSyncSettings.intervalSeconds;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [autoSyncSettings, isThrottled, isLoading, isRecalculating, handleLiveRecalculate]);

  // Initial load
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Optional WebSocket listener (skipped on static CDN)
  useEffect(() => {
    const hostname = window.location.hostname;
    const isStaticCDN =
      hostname.endsWith('pages.dev') ||
      hostname.endsWith('github.io') ||
      hostname.endsWith('netlify.app') ||
      hostname.endsWith('vercel.app');

    if (isStaticCDN) return;

    let ws: WebSocket | null = null;
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/api/v1/ws/stream`;
      ws = new WebSocket(wsUrl);

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'SNAPSHOT_UPDATE' && msg.payload) {
            setDataPayload(msg.payload);
            setDataSource('WebSocket Stream');
          }
        } catch (err) {
          console.warn('[WebSocket] Error parsing stream message:', err);
        }
      };
    } catch {
      // Ignore if WebSocket connection is not supported in current environment
    }

    return () => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, []);

  return {
    dataPayload,
    setDataPayload,
    isLoading,
    isRecalculating,
    dataSource,
    lastLiveFetchTime,
    fetchData,
    handleLiveRecalculate,
    autoSyncSettings,
    autoSyncCountdown,
    handleAutoSyncIntervalChange,
    handleToggleMarketHoursOnly,
    isMarketOpen,
    isThrottled,
  };
}
