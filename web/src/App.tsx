import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { KPICards } from './components/KPICards';
import { DualMenuTree } from './components/DualMenuTree';
import { CommandPalette } from './components/CommandPalette';
import { HelpHandbookModal } from './components/HelpHandbookModal';
import { WatchlistManagerModal } from './components/WatchlistManagerModal';
import { ReportQueryModal } from './components/ReportQueryModal';
import { PrimaryScreenerTable } from './components/PrimaryScreenerTable';
import { ScreenerTable } from './components/ScreenerTable';
import { TickerAuditModal } from './components/TickerAuditModal';
import { OptionDetailModal } from './components/OptionDetailModal';
import { IncomeCalculatorModal } from './components/IncomeCalculatorModal';
import { InteractiveChart } from './components/InteractiveChart';
import { MultiLegSpreadTable } from './components/MultiLegSpreadTable';
import { VolatilitySkewRadar } from './components/VolatilitySkewRadar';
import { SchwabSettingsModal } from './components/SchwabSettingsModal';
import { ApiDiagnosticsModal } from './components/ApiDiagnosticsModal';
import { FundamentalHealthTable } from './components/FundamentalHealthTable';
import { OptionsBacktestView } from './components/OptionsBacktestView';
import { ScrollToTopButton } from './components/ScrollToTopButton';
import { BrokerOrderStagingModal } from './components/BrokerOrderStagingModal';
import { BrokerStagingWorkbench } from './components/BrokerStagingWorkbench';
import { ErrorBoundary } from './components/ErrorBoundary';
import {
  stageSingleLegOrder,
  stageMultiLegSpreadOrder,
  StagedBracketOrder,
  AccountType,
  PriceExecutionType,
} from './utils/brokerOrderStaging';
import { generateMultiLegSpreads, generateVolatilitySkew } from './utils/optionsMultiLeg';
import { generateFundamentalHealthData } from './utils/fundamentalSolvency';
import {
  Search,
  RotateCcw,
  ShieldCheck,
  Flame,
  AlertTriangle,
  Star,
  Plus,
  FileSpreadsheet,
  FileText,
  Printer,
  TrendingUp,
  BarChart2,
  Calendar,
  Layers,
} from './components/icons';
import {
  OptionsDataPayload,
  TickerMeta,
  OptionOpportunity,
  MultiLegSpread,
  FilterState,
  MenuTreeType,
  EquitiesTabType,
  OptionsTabType,
  WatchlistGroup,
} from './types/options';
import {
  exportTickersToCSV,
  exportOpportunitiesToCSV,
  exportToExcel,
  triggerPrintReport,
} from './utils/exportImport';
import { fetchClientSideLiveMarketData } from './utils/liveMarketFetcher';
import { SECURITY_INTELLIGENCE_REGISTRY } from './utils/securityIntelligence';

const DEFAULT_UNIVERSE_SYMBOLS = [
  'SPY', 'QQQ', 'IWM', 'NVDA', 'AAPL', 'MSFT', 'AMZN', 'GOOGL', 'TSLA',
  'PLTR', 'IONQ', 'NET', 'RTX', 'JEPI', 'SCHD', 'SPCX', 'CLM', 'CRF', 'ZETA', 'BLZE', 'AXTI',
];

const INITIAL_WATCHLIST_GROUPS: WatchlistGroup[] = [
  {
    id: 'core-universe',
    name: 'Core Universe',
    description: 'Default multi-asset watchlist of ETFs, Mega-Caps, CEFs, and Growth',
    tickers: DEFAULT_UNIVERSE_SYMBOLS,
    isDefault: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'tier-1-liquid',
    name: 'Tier 1 Ultra-Liquid',
    description: 'Tightest penny-wide spreads and institutional depth',
    tickers: ['SPY', 'QQQ', 'NVDA', 'AAPL', 'MSFT', 'AMZN', 'GOOGL', 'TSLA'],
    isDefault: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'high-yield-etfs',
    name: 'Dividend, CEFs & High-Yield',
    description: 'Income ETFs, Closed-End Funds (CEFs), and covered-call vehicles',
    tickers: ['JEPI', 'SCHD', 'SPCX', 'CLM', 'CRF'],
    isDefault: true,
    createdAt: new Date().toISOString(),
  },
];

export const App: React.FC = () => {
  const [dataPayload, setDataPayload] = useState<OptionsDataPayload | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRecalculating, setIsRecalculating] = useState<boolean>(false);
  const [dataSource, setDataSource] = useState<string>('Local JSON');

  // Navigation Tree State
  const [activeTree, setActiveTree] = useState<MenuTreeType>('EQUITIES');
  const [activeEquitiesTab, setActiveEquitiesTab] = useState<EquitiesTabType>('TECHNICAL_SCREENER');
  const [activeOptionsTab, setActiveOptionsTab] = useState<OptionsTabType>('INCOME_SCREENER');
  const [activeChartSymbol, setActiveChartSymbol] = useState<string>('SPY');

  // Interactive Modal States
  const [selectedTicker, setSelectedTicker] = useState<TickerMeta | null>(null);
  const [selectedOpportunity, setSelectedOpportunity] = useState<OptionOpportunity | null>(null);
  const [calculatorOpportunity, setCalculatorOpportunity] = useState<OptionOpportunity | null>(null);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState<boolean>(false);
  const [isWatchlistModalOpen, setIsWatchlistModalOpen] = useState<boolean>(false);
  const [isReportQueryModalOpen, setIsReportQueryModalOpen] = useState<boolean>(false);
  const [isSchwabModalOpen, setIsSchwabModalOpen] = useState<boolean>(false);
  const [isDiagnosticsOpen, setIsDiagnosticsOpen] = useState<boolean>(false);
  const [lastLiveFetchTime, setLastLiveFetchTime] = useState<string>(() => {
    return localStorage.getItem('deltaharvest_last_live_fetch') || '';
  });
  const [stagedOrder, setStagedOrder] = useState<StagedBracketOrder | null>(null);
  const [isStagedModalOpen, setIsStagedModalOpen] = useState<boolean>(false);
  const [activeStagedOpportunity, setActiveStagedOpportunity] = useState<OptionOpportunity | null>(null);
  const [activeStagedSpread, setActiveStagedSpread] = useState<MultiLegSpread | null>(null);

  // Multi-Watchlist persistent state
  const [watchlistGroups, setWatchlistGroups] = useState<WatchlistGroup[]>(() => {
    try {
      const saved = localStorage.getItem('deltaharvest_watchlist_groups');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Failed to load watchlist groups:', e);
    }
    return INITIAL_WATCHLIST_GROUPS;
  });

  const [activeGroupId, setActiveGroupId] = useState<string>(() => {
    return localStorage.getItem('deltaharvest_active_group_id') || 'core-18';
  });

  const [showWatchlistOnly, setShowWatchlistOnly] = useState<boolean>(false);
  const [customTickers, setCustomTickers] = useState<TickerMeta[]>([]);

  // Theme State (Dark / Light Day-Night mode)
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      const saved = localStorage.getItem('deltaharvest_theme');
      if (saved === 'light' || saved === 'dark') return saved;
      if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
        return 'light';
      }
    } catch {
      // fallback to dark
    }
    return 'dark';
  });

  useEffect(() => {
    try {
      localStorage.setItem('deltaharvest_theme', theme);
      if (theme === 'light') {
        document.documentElement.classList.add('light');
        document.documentElement.classList.remove('dark');
      } else {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
      }
    } catch (e) {
      console.warn('Failed to persist theme:', e);
    }
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Sync watchlist groups to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('deltaharvest_watchlist_groups', JSON.stringify(watchlistGroups));
      localStorage.setItem('deltaharvest_active_group_id', activeGroupId);
    } catch (e) {
      console.warn('Failed to save watchlists:', e);
    }
  }, [watchlistGroups, activeGroupId]);

  const activeGroup = useMemo(() => {
    return watchlistGroups.find((g) => g.id === activeGroupId) || watchlistGroups[0];
  }, [watchlistGroups, activeGroupId]);

  const currentWatchlistSymbols = activeGroup?.tickers || DEFAULT_UNIVERSE_SYMBOLS;

  // Filters State
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    onlyHighIvr: false,
    onlyOversold: false,
    onlyEarningsAlert: false,
    weeklyCadence: 'ALL',
    liquidityTier: 'ALL',
    strategy: 'ALL',
    sortBy: 'iv_rank',
    sortOrder: 'desc',
  });

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in an input/textarea
      const activeTag = (document.activeElement?.tagName || '').toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      } else if (e.key === '?') {
        e.preventDefault();
        setIsHelpModalOpen((prev) => !prev);
      } else if (e.key.toLowerCase() === 'w') {
        e.preventDefault();
        setIsWatchlistModalOpen((prev) => !prev);
      } else if (e.key.toLowerCase() === 'r') {
        e.preventDefault();
        setIsReportQueryModalOpen((prev) => !prev);
      } else if (e.key === '1') {
        setActiveTree('EQUITIES');
      } else if (e.key === '2') {
        setActiveTree('OPTIONS');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Data Fetching & Real-Time Sync
  const fetchData = async () => {
    setIsLoading(true);
    let loaded = false;

    // 0. Priority: Restore locally cached live market snapshot if present
    try {
      const savedPayloadStr = localStorage.getItem('deltaharvest_live_payload');
      if (savedPayloadStr) {
        const savedPayload: OptionsDataPayload = JSON.parse(savedPayloadStr);
        if (savedPayload && Array.isArray(savedPayload.tickers) && savedPayload.tickers.length > 0) {
          // Check if any ticker contains defaulted placeholder values ($100 spot, 1M vol, $100 sma)
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
        // Backend not running / static host - continue to local data fallback
      }
    }

    // 1. Fallback: Attempt local public JSON path
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

    // 2. Fallback: Attempt absolute public root /data/options_data.json
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

    // 3. Fallback to GitHub raw
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
  };

  // Live on-demand recalculate for tickers via FastAPI backend or Client-Side Engine
  const handleLiveRecalculate = async (tickersToRecalc?: string[]) => {
    setIsRecalculating(true);
    const targetTickers = tickersToRecalc && tickersToRecalc.length > 0
      ? tickersToRecalc
      : currentWatchlistSymbols;

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
          setDataPayload((prev) => {
            if (!prev || !prev.tickers) return json;
            const tickerMap = new Map<string, TickerMeta>();
            prev.tickers.forEach((t) => tickerMap.set(t.symbol, t));
            json.tickers.forEach((t) => tickerMap.set(t.symbol, t));

            const oppMap = new Map<string, OptionOpportunity>();
            (prev.opportunities || []).forEach((o) => {
              const k = o.id || `${o.strategy}_${o.symbol}_${o.strike}`;
              oppMap.set(k, o);
            });
            (json.opportunities || []).forEach((o) => {
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
          setCustomTickers((prev) =>
            prev.filter((c) => !json.tickers?.some((t) => t.symbol === c.symbol))
          );
          success = true;
        }
      }
    } catch {
      // Backend not running, execute client-side engine
    }

    // 2. Fallback: Client-Side Real-Time Market Engine (for Cloudflare Pages / static hosting)
    if (!success) {
      try {
        const livePayload = await fetchClientSideLiveMarketData(dataPayload, targetTickers);
        if (livePayload.tickers && livePayload.tickers.length > 0) {
          setDataPayload(livePayload);
          setDataSource('Live Market Feed');
          setCustomTickers((prev) =>
            prev.filter((c) => !livePayload.tickers?.some((t) => t.symbol === c.symbol))
          );
          try {
            // Only persist if all tickers have valid non-defaulted prices
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
    }

    setIsRecalculating(false);
  };

  // Real-time WebSocket streaming listener (Active only in backend environments)
  useEffect(() => {
    const hostname = window.location.hostname;
    const isStaticCDN =
      hostname.endsWith('pages.dev') ||
      hostname.endsWith('github.io') ||
      hostname.endsWith('netlify.app') ||
      hostname.endsWith('vercel.app');

    if (isStaticCDN) {
      // Skip WebSocket handshake on static CDN hosting
      return;
    }

    let ws: WebSocket | null = null;
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/api/v1/ws/stream`;
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.info('[WebSocket] Connected to DeltaHarvest Live Stream');
      };

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

      ws.onerror = () => {
        // Silent fallback - WebSocket is optional enhancement
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

  useEffect(() => {
    fetchData();
  }, []);

  // Universe Tickers
  const universeTickers = useMemo(() => {
    const rawTickers = dataPayload?.tickers || [];
    const tickerMap = new Map<string, TickerMeta>();

    rawTickers.forEach((t) => tickerMap.set(t.symbol, t));
    customTickers.forEach((t) => {
      if (!tickerMap.has(t.symbol)) tickerMap.set(t.symbol, t);
    });

    return Array.from(tickerMap.values());
  }, [dataPayload, customTickers]);

  // Staged Order Handlers
  const handleStageOpportunity = (opp: OptionOpportunity) => {
    const meta = universeTickers.find((t) => t.symbol === opp.symbol);
    const staged = stageSingleLegOrder(opp, meta, 1, 'SCHWAB', 'REG_T_MARGIN', 'MIDPOINT');
    setActiveStagedOpportunity(opp);
    setActiveStagedSpread(null);
    setStagedOrder(staged);
    setIsStagedModalOpen(true);
  };

  const handleStageSpread = (spread: MultiLegSpread) => {
    const staged = stageMultiLegSpreadOrder(spread, 1, 'SCHWAB', 'REG_T_MARGIN', 'MIDPOINT');
    setActiveStagedSpread(spread);
    setActiveStagedOpportunity(null);
    setStagedOrder(staged);
    setIsStagedModalOpen(true);
  };

  const handleUpdateStagedQuantity = (qty: number) => {
    if (activeStagedOpportunity) {
      const meta = universeTickers.find((t) => t.symbol === activeStagedOpportunity.symbol);
      const updated = stageSingleLegOrder(
        activeStagedOpportunity,
        meta,
        qty,
        stagedOrder?.broker || 'SCHWAB',
        stagedOrder?.accountType || 'REG_T_MARGIN',
        stagedOrder?.pricingType || 'MIDPOINT'
      );
      setStagedOrder(updated);
    } else if (activeStagedSpread) {
      const updated = stageMultiLegSpreadOrder(
        activeStagedSpread,
        qty,
        stagedOrder?.broker || 'SCHWAB',
        stagedOrder?.accountType || 'REG_T_MARGIN',
        stagedOrder?.pricingType || 'MIDPOINT'
      );
      setStagedOrder(updated);
    }
  };

  const handleUpdateStagedAccountType = (acc: AccountType) => {
    if (activeStagedOpportunity) {
      const meta = universeTickers.find((t) => t.symbol === activeStagedOpportunity.symbol);
      const updated = stageSingleLegOrder(
        activeStagedOpportunity,
        meta,
        stagedOrder?.quantity || 1,
        stagedOrder?.broker || 'SCHWAB',
        acc,
        stagedOrder?.pricingType || 'MIDPOINT'
      );
      setStagedOrder(updated);
    } else if (activeStagedSpread) {
      const updated = stageMultiLegSpreadOrder(
        activeStagedSpread,
        stagedOrder?.quantity || 1,
        stagedOrder?.broker || 'SCHWAB',
        acc,
        stagedOrder?.pricingType || 'MIDPOINT'
      );
      setStagedOrder(updated);
    }
  };

  const handleUpdateStagedPricingType = (pricing: PriceExecutionType) => {
    if (activeStagedOpportunity) {
      const meta = universeTickers.find((t) => t.symbol === activeStagedOpportunity.symbol);
      const updated = stageSingleLegOrder(
        activeStagedOpportunity,
        meta,
        stagedOrder?.quantity || 1,
        stagedOrder?.broker || 'SCHWAB',
        stagedOrder?.accountType || 'REG_T_MARGIN',
        pricing
      );
      setStagedOrder(updated);
    } else if (activeStagedSpread) {
      const updated = stageMultiLegSpreadOrder(
        activeStagedSpread,
        stagedOrder?.quantity || 1,
        stagedOrder?.broker || 'SCHWAB',
        stagedOrder?.accountType || 'REG_T_MARGIN',
        pricing
      );
      setStagedOrder(updated);
    }
  };

  // Derived counts for tabs
  const weeklyCadenceCounts = useMemo(() => {
    let weekly = 0;
    let monthly = 0;
    universeTickers.forEach((t) => {
      if (t.has_weeklys === false) monthly++;
      else weekly++;
    });
    return { all: universeTickers.length, weekly, monthly };
  }, [universeTickers]);

  const highIvrCount = useMemo(() => {
    return universeTickers.filter((t) => t.iv_rank >= 45).length;
  }, [universeTickers]);

  const earningsAlertCount = useMemo(() => {
    return universeTickers.filter((t) => t.earnings_within_7d).length;
  }, [universeTickers]);

  // Filtered Tickers (for Tree 1 & Cadence views)
  const filteredTickers = useMemo(() => {
    return universeTickers.filter((t) => {
      // Watchlist toggle
      if (showWatchlistOnly && !currentWatchlistSymbols.includes(t.symbol)) {
        return false;
      }

      // Search query
      if (filters.search) {
        const q = filters.search.toLowerCase();
        const matchesSymbol = t.symbol.toLowerCase().includes(q);
        const matchesName = t.name.toLowerCase().includes(q);
        const matchesSector = t.sector.toLowerCase().includes(q);
        if (!matchesSymbol && !matchesName && !matchesSector) return false;
      }

      // Sub-tab specific automatic filters for Equities Tree
      if (activeTree === 'EQUITIES') {
        if (activeEquitiesTab === 'VOLATILITY_RISK' && filters.onlyHighIvr === false && t.iv_rank < 30) {
          // Keep focus on volatile symbols when on Volatility tab
        }
      }

      // Quick KPI flags
      if (filters.onlyHighIvr && t.iv_rank < 45) return false;
      if (filters.onlyOversold && (t.rsi_14 ?? 50) >= 35) return false;
      if (filters.onlyNearSupport && t.spot_price > (t.lower_bb ?? 0) * 1.02) return false;
      if (filters.onlyEarningsAlert && !t.earnings_within_7d) return false;

      // Weekly Cadence Quick Filter
      if (filters.weeklyCadence === 'WEEKLY_ONLY' && t.has_weeklys === false) return false;
      if (filters.weeklyCadence === 'MONTHLY_ONLY' && t.has_weeklys !== false) return false;

      // Liquidity Tier
      if (filters.liquidityTier && filters.liquidityTier !== 'ALL') {
        if (!t.liquidity_tier.includes(filters.liquidityTier)) return false;
      }

      return true;
    });
  }, [
    universeTickers,
    currentWatchlistSymbols,
    showWatchlistOnly,
    filters,
    activeTree,
    activeEquitiesTab,
  ]);

  // All Available Opportunities (Combining Static + Dynamic Synthesis for newly added custom/watchlist tickers)
  const allUniverseOpportunities = useMemo(() => {
    const rawOpps = dataPayload?.opportunities || [];
    const oppMap = new Map<string, OptionOpportunity>();

    // Index existing opportunities by unique id
    rawOpps.forEach((o) => {
      const key = o.id || `${o.strategy}_${o.symbol}_${o.strike}`;
      oppMap.set(key, o);
    });

    // Track symbols that have at least one opportunity
    const coveredSymbols = new Set(rawOpps.map((o) => o.symbol));

    // For every ticker in universeTickers (including all custom and imported tickers), ensure CSP and CC exist
    universeTickers.forEach((t) => {
      if (!coveredSymbols.has(t.symbol)) {
        const spot = t.spot_price || 100.0;
        const lowerBb = t.lower_bb || spot * 0.94;
        const upperBb = t.upper_bb || spot * 1.06;
        const iv = t.iv_current || 0.25;
        const dte = t.has_weeklys === false ? t.days_to_nearest_expiration || 20 : 5;
        const expDate = new Date(Date.now() + dte * 86400000).toISOString().split('T')[0];

        const putStrike = Math.max(
          1,
          spot > 100
            ? Math.floor(lowerBb / 5) * 5
            : spot > 20
            ? Math.floor(lowerBb)
            : Math.floor(lowerBb * 2) / 2
        );
        const callStrike = Math.max(
          putStrike + 1,
          spot > 100
            ? Math.ceil(upperBb / 5) * 5
            : spot > 20
            ? Math.ceil(upperBb)
            : Math.ceil(upperBb * 2) / 2
        );

        const ivNorm = iv > 1 ? iv / 100 : iv;
        const putMid = Math.max(
          0.15,
          Math.round(spot * ivNorm * Math.sqrt(dte / 365.0) * 0.18 * 100) / 100
        );
        const callMid = Math.max(
          0.15,
          Math.round(spot * ivNorm * Math.sqrt(dte / 365.0) * 0.18 * 100) / 100
        );

        const putCollateral = putStrike * 100;
        const putPremium = Math.round(putMid * 100);
        const putRoc = Math.round((putPremium / putCollateral) * 1000) / 10;
        const putAnnualized = Math.round((putRoc * (365 / dte)) * 10) / 10;
        const putCushion = Math.round((((spot - putStrike) / spot) * 100) * 10) / 10;

        const callCollateral = spot * 100;
        const callPremium = Math.round(callMid * 100);
        const callRoc = Math.round((callPremium / callCollateral) * 1000) / 10;
        const callAnnualized = Math.round((callRoc * (365 / dte)) * 10) / 10;
        const callUpside = Math.round((((callStrike - spot) / spot) * 100) * 10) / 10;

        const csp: OptionOpportunity = {
          id: `LIVE_CSP_${t.symbol}_${putStrike}`,
          symbol: t.symbol,
          name: t.name,
          category: t.sector,
          sector: t.sector,
          liquidity_tier: t.liquidity_tier,
          strategy: 'CSP',
          strategy_name: 'Cash-Secured Put (0.15-0.20Δ <= Lower BB)',
          expiration: expDate,
          dte,
          current_price: spot,
          strike: putStrike,
          type: 'put',
          bid: Math.round(putMid * 0.95 * 100) / 100,
          ask: Math.round(putMid * 1.05 * 100) / 100,
          mid: putMid,
          collateral_required: putCollateral,
          premium_total: putPremium,
          breakeven: Math.round((putStrike - putMid) * 100) / 100,
          cushion_pct: putCushion,
          roc_pct: putRoc,
          annualized_roc: putAnnualized,
          delta: -0.17,
          abs_delta: 0.17,
          theta: -0.04,
          pop_pct: 83.5,
          iv: Math.round(ivNorm * 1000) / 10,
          iv_rank: t.iv_rank,
          hv_30: t.hv_30,
          sma_20: t.sma_20,
          upper_bb: t.upper_bb,
          lower_bb: t.lower_bb,
          rsi_14: t.rsi_14,
          rsi: t.rsi_14,
          rsi_flag: t.rsi_flag,
          earnings_within_7d: t.earnings_within_7d,
          next_earnings_date: t.next_earnings_date,
          safety_tier: t.iv_rank >= 45 ? 'Optimal Volatility (IVR >= 45)' : 'Standard Volatility',
          tier_color: t.iv_rank >= 45 ? 'emerald' : 'blue',
          tags: ['CUSTOM_TICKER', 'LIVE_SYNTHESIS', 'CSP_HARVEST'],
          rating: Math.min(99, Math.max(60, Math.round(83.5 + (putAnnualized / 2)))),
        };

        const cc: OptionOpportunity = {
          id: `LIVE_CC_${t.symbol}_${callStrike}`,
          symbol: t.symbol,
          name: t.name,
          category: t.sector,
          sector: t.sector,
          liquidity_tier: t.liquidity_tier,
          strategy: 'CC',
          strategy_name: 'Covered Call (0.15-0.20Δ >= Upper BB)',
          expiration: expDate,
          dte,
          current_price: spot,
          strike: callStrike,
          type: 'call',
          bid: Math.round(callMid * 0.95 * 100) / 100,
          ask: Math.round(callMid * 1.05 * 100) / 100,
          mid: callMid,
          collateral_required: callCollateral,
          premium_total: callPremium,
          breakeven: Math.round((spot - callMid) * 100) / 100,
          cushion_pct: callUpside,
          roc_pct: callRoc,
          annualized_roc: callAnnualized,
          delta: 0.18,
          abs_delta: 0.18,
          theta: -0.04,
          pop_pct: 82.0,
          iv: Math.round(ivNorm * 1000) / 10,
          iv_rank: t.iv_rank,
          hv_30: t.hv_30,
          sma_20: t.sma_20,
          upper_bb: t.upper_bb,
          lower_bb: t.lower_bb,
          rsi_14: t.rsi_14,
          rsi: t.rsi_14,
          rsi_flag: t.rsi_flag,
          earnings_within_7d: t.earnings_within_7d,
          next_earnings_date: t.next_earnings_date,
          safety_tier: t.iv_rank >= 45 ? 'Optimal Volatility (IVR >= 45)' : 'Standard Volatility',
          tier_color: t.iv_rank >= 45 ? 'emerald' : 'blue',
          tags: ['CUSTOM_TICKER', 'LIVE_SYNTHESIS', 'CC_HARVEST'],
          rating: Math.min(99, Math.max(60, Math.round(82.0 + (callAnnualized / 2)))),
        };

        oppMap.set(csp.id, csp);
        oppMap.set(cc.id, cc);
      }
    });

    return Array.from(oppMap.values());
  }, [dataPayload?.opportunities, universeTickers]);

  // Filtered Opportunities (for Tree 2 Options Screener)
  const filteredOpportunities = useMemo(() => {
    return allUniverseOpportunities.filter((o) => {
      // Watchlist toggle
      if (showWatchlistOnly && !currentWatchlistSymbols.includes(o.symbol)) {
        return false;
      }

      // Strategy
      if (filters.strategy && filters.strategy !== 'ALL') {
        if (o.strategy !== filters.strategy) return false;
      }

      // Search query
      if (filters.search) {
        const q = filters.search.toLowerCase();
        if (!o.symbol.toLowerCase().includes(q) && !o.name.toLowerCase().includes(q)) {
          return false;
        }
      }

      // Sub-tab specific filters
      if (activeTree === 'OPTIONS') {
        if (activeOptionsTab === 'DELTA_GREEKS') {
          // Sort by Delta/Theta
        }
      }

      // Weekly Cadence Quick Filter
      if (filters.weeklyCadence === 'WEEKLY_ONLY') {
        const tMeta = universeTickers.find((t) => t.symbol === o.symbol);
        if (tMeta && tMeta.has_weeklys === false) return false;
      }
      if (filters.weeklyCadence === 'MONTHLY_ONLY') {
        const tMeta = universeTickers.find((t) => t.symbol === o.symbol);
        if (tMeta && tMeta.has_weeklys !== false) return false;
      }

      // High IVR
      if (filters.onlyHighIvr && o.iv_rank < 45) return false;

      // Earnings Alert
      if (filters.onlyEarningsAlert && !o.earnings_within_7d) return false;

      // Liquidity Tier
      if (filters.liquidityTier && filters.liquidityTier !== 'ALL') {
        if (!o.liquidity_tier?.includes(filters.liquidityTier)) return false;
      }

      return true;
    });
  }, [
    allUniverseOpportunities,
    currentWatchlistSymbols,
    showWatchlistOnly,
    filters,
    activeTree,
    activeOptionsTab,
    universeTickers,
  ]);

  // Synthesized Multi-Leg Spreads (anchored strictly in 0.15 - 0.20 Delta)
  const multiLegSpreads = useMemo(() => {
    return generateMultiLegSpreads(filteredTickers, allUniverseOpportunities);
  }, [filteredTickers, allUniverseOpportunities]);

  // 25-Delta Volatility Skew & Term Structure
  const volatilitySkewData = useMemo(() => {
    return generateVolatilitySkew(filteredTickers);
  }, [filteredTickers]);

  // Fundamental Health, Solvency & SEC Filings Data
  const fundamentalHealthData = useMemo(() => {
    return generateFundamentalHealthData(filteredTickers);
  }, [filteredTickers]);

  // Watchlist Actions
  const handleToggleWatchlist = (symbol: string) => {
    const isPresent = currentWatchlistSymbols.includes(symbol);
    const updated = isPresent
      ? currentWatchlistSymbols.filter((s) => s !== symbol)
      : [...currentWatchlistSymbols, symbol];

    setWatchlistGroups((prev) =>
      prev.map((g) => (g.id === activeGroup.id ? { ...g, tickers: updated } : g))
    );
  };

  const handleCreateWatchlist = (name: string, tickers: string[] = []) => {
    const newGroup: WatchlistGroup = {
      id: 'custom-' + Date.now(),
      name,
      tickers,
      isDefault: false,
      createdAt: new Date().toISOString(),
    };
    setWatchlistGroups((prev) => [...prev, newGroup]);
    setActiveGroupId(newGroup.id);
  };

  const handleDeleteWatchlist = (groupId: string) => {
    setWatchlistGroups((prev) => prev.filter((g) => g.id !== groupId));
    if (activeGroupId === groupId) {
      setActiveGroupId('core-18');
    }
  };

  const handleUpdateGroupTickers = (groupId: string, tickers: string[]) => {
    setWatchlistGroups((prev) =>
      prev.map((g) => (g.id === groupId ? { ...g, tickers } : g))
    );
  };

  const handleAddCustomTickerMeta = (symbol: string) => {
    const cleanSym = symbol.trim().toUpperCase().replace(/[^A-Z0-9.\-_]/g, '');
    if (!cleanSym) return;

    if (!universeTickers.some((t) => t.symbol === cleanSym)) {
      const intel = SECURITY_INTELLIGENCE_REGISTRY[cleanSym];
      const initialSpot = intel?.keySupportPrice && intel?.keyResistancePrice
        ? Math.round(((intel.keySupportPrice + intel.keyResistancePrice) / 2) * 100) / 100
        : intel?.targetPrice ? Math.round(intel.targetPrice * 0.9 * 100) / 100 : 100.0;
      const initialVol = intel?.liquidityScore && intel.liquidityScore >= 95 ? 25000000 : 1000000;
      const initialName = intel?.name || `${cleanSym} Equity`;
      const initialSector = intel?.sector || 'Custom Watchlist';
      const initialTier = intel?.liquidityScore && intel.liquidityScore >= 95 ? 'Tier 1 (Ultra-Liquid)' : 'Tier 2/3 (Moderate)';

      const syntheticMeta: TickerMeta = {
        symbol: cleanSym,
        name: initialName,
        sector: initialSector,
        liquidity_tier: initialTier,
        spot_price: initialSpot,
        avg_volume_30: initialVol,
        sma_20: initialSpot,
        upper_bb: Math.round(initialSpot * 1.05 * 100) / 100,
        lower_bb: Math.round(initialSpot * 0.95 * 100) / 100,
        bb_width_pct: 10.0,
        rsi_14: 50.0,
        rsi_flag: 'NORMAL',
        hv_30: 25.0,
        iv_current: 25.0,
        iv_rank: 30,
        earnings_within_7d: false,
        next_earnings_date: 'N/A',
        has_weeklys: true,
        expiration_cadence: 'Daily / Multi-Weekly',
      };
      setCustomTickers((prev) => {
        if (prev.some((c) => c.symbol === cleanSym)) return prev;
        return [...prev, syntheticMeta];
      });

      // Also ensure it is present in the Core Universe group so it appears in the master list
      setWatchlistGroups((prev) =>
        prev.map((g) => {
          if (g.id === 'core-universe' && !g.tickers.includes(cleanSym)) {
            return { ...g, tickers: [...g.tickers, cleanSym] };
          }
          return g;
        })
      );

      // Automatically trigger live data processing for the newly ingested symbol
      handleLiveRecalculate([cleanSym]);
    }
  };

  // Reset Filters
  const handleResetFilters = () => {
    setFilters({
      search: '',
      onlyHighIvr: false,
      onlyOversold: false,
      onlyEarningsAlert: false,
      weeklyCadence: 'ALL',
      liquidityTier: 'ALL',
      strategy: 'ALL',
      sortBy: 'iv_rank',
      sortOrder: 'desc',
    });
  };

  const handleSort = (column: any) => {
    if (filters.sortBy === column) {
      setFilters((prev) => ({
        ...prev,
        sortOrder: prev.sortOrder === 'asc' ? 'desc' : 'asc',
      }));
    } else {
      setFilters((prev) => ({
        ...prev,
        sortBy: column,
        sortOrder: 'desc',
      }));
    }
  };

  // Quick Exports from Active View
  const handleExportCSV = () => {
    if (activeTree === 'EQUITIES') {
      const exportList = filteredTickers.length > 0 ? filteredTickers : universeTickers;
      exportTickersToCSV(exportList, `deltaharvest_equities_${Date.now()}.csv`);
    } else {
      const exportList = filteredOpportunities.length > 0 ? filteredOpportunities : (dataPayload?.opportunities || []);
      exportOpportunitiesToCSV(exportList, `deltaharvest_options_${Date.now()}.csv`);
    }
  };

  const handleExportExcel = () => {
    const tickersToExport = filteredTickers.length > 0 ? filteredTickers : universeTickers;
    const oppsToExport = filteredOpportunities.length > 0 ? filteredOpportunities : (dataPayload?.opportunities || []);
    exportToExcel(
      {
        tickers: tickersToExport,
        opportunities: oppsToExport,
        summary: dataPayload?.summary || null,
      },
      `deltaharvest_complete_${Date.now()}.xlsx`
    );
  };

  const handleSelectEquitiesTab = (tab: EquitiesTabType) => {
    setActiveEquitiesTab(tab);
    // Reset view-contaminating filters so switching views never leaves the table empty
    if (tab === 'TECHNICAL_SCREENER') {
      setFilters((prev) => ({ ...prev, sortBy: 'symbol', sortOrder: 'asc', onlyHighIvr: false, onlyEarningsAlert: false, onlyOversold: false }));
    } else if (tab === 'TREND_SUPPORT') {
      setFilters((prev) => ({ ...prev, sortBy: 'dist_to_support' as any, sortOrder: 'asc', onlyHighIvr: false, onlyEarningsAlert: false, onlyOversold: false }));
    } else if (tab === 'VOLATILITY_RISK') {
      setFilters((prev) => ({ ...prev, sortBy: 'hv_30', sortOrder: 'desc', onlyHighIvr: false, onlyEarningsAlert: false, onlyOversold: false }));
    } else if (tab === 'EARNINGS_CALENDAR') {
      // In Earnings Calendar, sort by next_earnings_date chronologically rather than hiding non-7d tickers
      setFilters((prev) => ({ ...prev, sortBy: 'next_earnings_date' as any, sortOrder: 'asc', onlyHighIvr: false, onlyEarningsAlert: false, onlyOversold: false }));
    } else if (tab === 'SECTOR_OVERVIEW') {
      setFilters((prev) => ({ ...prev, sortBy: 'sector', sortOrder: 'asc', onlyHighIvr: false, onlyEarningsAlert: false, onlyOversold: false }));
    } else {
      setFilters((prev) => ({ ...prev, onlyHighIvr: false, onlyEarningsAlert: false, onlyOversold: false }));
    }
  };

  const handleSelectOptionsTab = (tab: OptionsTabType) => {
    setActiveOptionsTab(tab);
    // Clean up filters on Options tree switch
    setFilters((prev) => ({ ...prev, onlyHighIvr: false, onlyEarningsAlert: false }));
    if (tab === 'TICKER_AUDIT') {
      const target = selectedTicker || filteredTickers[0] || universeTickers[0];
      if (target) setSelectedTicker(target);
    } else if (tab === 'INCOME_CALCULATOR') {
      const targetOpp = calculatorOpportunity || (dataPayload?.opportunities.length ? dataPayload.opportunities[0] : null);
      if (targetOpp) setCalculatorOpportunity(targetOpp);
    } else if (tab === 'DELTA_GREEKS') {
      setFilters((prev) => ({ ...prev, strategy: 'ALL' }));
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-white">
      {/* Header with Search, Watchlists, Reports, and Help triggers */}
      <Header
        summary={dataPayload?.summary || null}
        lastUpdated={lastLiveFetchTime || dataPayload?.metadata.last_updated || ''}
        totalTickers={universeTickers.length}
        onRefresh={fetchData}
        onLiveRecalculate={() => handleLiveRecalculate(currentWatchlistSymbols)}
        isLoading={isLoading}
        isRecalculating={isRecalculating}
        dataSource={dataSource}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onOpenHelp={() => setIsHelpModalOpen(true)}
        onOpenWatchlists={() => setIsWatchlistModalOpen(true)}
        onOpenReports={() => setIsReportQueryModalOpen(true)}
        onOpenSchwab={() => setIsSchwabModalOpen(true)}
        onOpenDiagnostics={() => setIsDiagnosticsOpen(true)}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Dual Navigation Tree: US Equities Analysis vs Options Engine */}
        <DualMenuTree
          activeTree={activeTree}
          onSelectTree={(tree) => setActiveTree(tree)}
          activeEquitiesTab={activeEquitiesTab}
          onSelectEquitiesTab={handleSelectEquitiesTab}
          activeOptionsTab={activeOptionsTab}
          onSelectOptionsTab={handleSelectOptionsTab}
          totalTickersCount={universeTickers.length}
          weeklyCount={weeklyCadenceCounts.weekly}
          monthlyCount={weeklyCadenceCounts.monthly}
          highIvrCount={highIvrCount}
          earningsAlertCount={earningsAlertCount}
        />

        {/* Breadcrumbs & Quick-Jump Navigation Bar */}
        <div className="glass-panel px-4 py-2.5 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Breadcrumb path */}
          <div className="flex items-center space-x-2 text-slate-400">
            <span className="text-slate-500 font-semibold">📍 Location:</span>
            <button
              onClick={() => setActiveTree('EQUITIES')}
              className={`hover:underline font-semibold ${activeTree === 'EQUITIES' ? 'text-blue-400 font-bold' : 'text-slate-400'
                }`}
            >
              US Equities
            </button>
            <span>/</span>
            <button
              onClick={() => setActiveTree('OPTIONS')}
              className={`hover:underline font-semibold ${activeTree === 'OPTIONS' ? 'text-emerald-400 font-bold' : 'text-slate-400'
                }`}
            >
              Options Yield
            </button>
            <span>/</span>
            <span className="text-white font-bold font-mono">
              {activeTree === 'EQUITIES'
                ? activeEquitiesTab.replace(/_/g, ' ')
                : activeOptionsTab.replace(/_/g, ' ')}
            </span>
          </div>

          {/* Quick-Jump Shortcuts */}
          <div className="flex items-center space-x-2">
            <span className="text-slate-500 text-[11px] hidden md:inline">Jump:</span>
            <button
              onClick={() => setIsCommandPaletteOpen(true)}
              className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-[11px] font-mono flex items-center space-x-1 transition-colors"
            >
              <span>Search</span>
              <kbd className="px-1 py-0.2 bg-slate-800 rounded text-[9px] text-slate-400">Ctrl+K</kbd>
            </button>
            <button
              onClick={() => setIsWatchlistModalOpen(true)}
              className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-amber-400 hover:text-amber-300 text-[11px] font-mono flex items-center space-x-1 transition-colors"
            >
              <span>Watchlist</span>
              <kbd className="px-1 py-0.2 bg-slate-800 rounded text-[9px] text-slate-400">W</kbd>
            </button>
            <button
              onClick={() => setIsReportQueryModalOpen(true)}
              className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-indigo-400 hover:text-indigo-300 text-[11px] font-mono flex items-center space-x-1 transition-colors"
            >
              <span>Reports</span>
              <kbd className="px-1 py-0.2 bg-slate-800 rounded text-[9px] text-slate-400">R</kbd>
            </button>
            <button
              onClick={() => setIsHelpModalOpen(true)}
              className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-emerald-400 hover:text-emerald-300 text-[11px] font-mono flex items-center space-x-1 transition-colors"
            >
              <span>Help</span>
              <kbd className="px-1 py-0.2 bg-slate-800 rounded text-[9px] text-slate-400">?</kbd>
            </button>
            <button
              onClick={triggerPrintReport}
              className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-blue-400 hover:text-blue-300 text-[11px] font-mono flex items-center space-x-1 transition-colors"
            >
              <span>Print</span>
              <Printer className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Global KPI Summary Ribbon */}
        <KPICards
          tickers={universeTickers}
          activeFilter={
            filters.onlyHighIvr
              ? 'IVR'
              : filters.onlyOversold
                ? 'OVERSOLD'
                : filters.onlyNearSupport
                  ? 'SUPPORT'
                  : filters.onlyEarningsAlert
                    ? 'EARNINGS'
                    : 'ALL'
          }
          onFilterHighIvr={() =>
            setFilters((prev) => ({
              ...prev,
              onlyHighIvr: !prev.onlyHighIvr,
              onlyOversold: false,
              onlyNearSupport: false,
              onlyEarningsAlert: false,
            }))
          }
          onFilterOversold={() =>
            setFilters((prev) => ({
              ...prev,
              onlyOversold: !prev.onlyOversold,
              onlyNearSupport: false,
              onlyHighIvr: false,
              onlyEarningsAlert: false,
            }))
          }
          onFilterNearSupport={() =>
            setFilters((prev) => ({
              ...prev,
              onlyNearSupport: !prev.onlyNearSupport,
              onlyOversold: false,
              onlyHighIvr: false,
              onlyEarningsAlert: false,
            }))
          }
          onFilterEarnings={() =>
            setFilters((prev) => ({
              ...prev,
              onlyEarningsAlert: !prev.onlyEarningsAlert,
              onlyHighIvr: false,
              onlyOversold: false,
              onlyNearSupport: false,
            }))
          }
        />

        {/* Global Toolbar & Filter Strip */}
        <div className="glass-panel p-3.5 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
              placeholder="Search ticker, company name, or sector..."
              className="w-full bg-slate-900/90 border border-slate-700/80 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
            {filters.search && (
              <button
                onClick={() => setFilters((prev) => ({ ...prev, search: '' }))}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs"
              >
                ×
              </button>
            )}
          </div>

          {/* Quick Filter Buttons & Watchlist Filter */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Active Watchlist Toggle */}
            <button
              onClick={() => setShowWatchlistOnly(!showWatchlistOnly)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all ${showWatchlistOnly
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
                }`}
            >
              <Star className="w-3.5 h-3.5" filled={showWatchlistOnly} />
              <span>
                {activeGroup.name} ({currentWatchlistSymbols.length})
              </span>
            </button>

            {/* Quick Strategy Flags */}
            <button
              onClick={() =>
                setFilters((prev) => ({ ...prev, onlyHighIvr: !prev.onlyHighIvr }))
              }
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all ${filters.onlyHighIvr
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
                }`}
            >
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>IVR ≥ 45%</span>
            </button>

            <button
              onClick={() =>
                setFilters((prev) => ({ ...prev, onlyOversold: !prev.onlyOversold, onlyNearSupport: false }))
              }
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all ${filters.onlyOversold
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
                }`}
              title="Filter tickers with 14-Day RSI strictly < 35"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Oversold (RSI &lt; 35)</span>
            </button>

            <button
              onClick={() =>
                setFilters((prev) => ({ ...prev, onlyNearSupport: !prev.onlyNearSupport, onlyOversold: false }))
              }
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all ${filters.onlyNearSupport
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
                }`}
              title="Filter tickers trading within 2% of Lower Bollinger Band"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
              <span>Near Lower Support</span>
            </button>

            <button
              onClick={() =>
                setFilters((prev) => ({ ...prev, onlyEarningsAlert: !prev.onlyEarningsAlert }))
              }
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all ${filters.onlyEarningsAlert
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
                }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              <span>Earnings &le; 7d</span>
            </button>

            {/* Liquidity Tier Dropdown */}
            <select
              value={filters.liquidityTier}
              onChange={(e) => setFilters((prev) => ({ ...prev, liquidityTier: e.target.value }))}
              className="bg-slate-900 border border-slate-800 text-slate-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-emerald-500"
            >
              <option value="ALL">All Liquidity Tiers</option>
              <option value="Tier 1">Tier 1 (Ultra-Liquid)</option>
              <option value="Tier 2/3">Tier 2/3 (Moderate)</option>
              <option value="Tier 4">Tier 4 (Small-Cap)</option>
            </select>

            {/* Quick Export Actions */}
            <div className="flex items-center space-x-1 border-l border-slate-800 pl-2">
              <button
                onClick={handleExportCSV}
                className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors"
                title="Quick Export view to CSV"
              >
                <FileText className="w-4 h-4 text-slate-400" />
              </button>
              <button
                onClick={handleExportExcel}
                className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-emerald-300 border border-slate-800 transition-colors"
                title="Quick Export view to Excel (.xlsx)"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              </button>
              <button
                onClick={triggerPrintReport}
                className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-indigo-300 border border-slate-800 transition-colors"
                title="Print Report / Save PDF"
              >
                <Printer className="w-4 h-4 text-indigo-400" />
              </button>
            </div>

            {(filters.search ||
              filters.onlyHighIvr ||
              filters.onlyOversold ||
              filters.onlyEarningsAlert ||
              filters.liquidityTier !== 'ALL' ||
              showWatchlistOnly) && (
                <button
                  onClick={handleResetFilters}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  title="Reset all filters"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}
          </div>
        </div>

        {/* Options Cadence Quick Filter Toggle Strip */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-1">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider hidden sm:inline">
              Expiration Cadence:
            </span>
            <div className="inline-flex p-1 bg-slate-900/90 rounded-xl border border-slate-800 shadow-inner">
              <button
                onClick={() => setFilters((prev) => ({ ...prev, weeklyCadence: 'ALL' }))}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${!filters.weeklyCadence || filters.weeklyCadence === 'ALL'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                    : 'text-slate-400 hover:text-slate-200'
                  }`}
              >
                All Cycles ({weeklyCadenceCounts.all})
              </button>
              <button
                onClick={() => setFilters((prev) => ({ ...prev, weeklyCadence: 'WEEKLY_ONLY' }))}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1.5 ${filters.weeklyCadence === 'WEEKLY_ONLY'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                    : 'text-slate-400 hover:text-emerald-400'
                  }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Weekly Only ({weeklyCadenceCounts.weekly})</span>
              </button>
              <button
                onClick={() => setFilters((prev) => ({ ...prev, weeklyCadence: 'MONTHLY_ONLY' }))}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1.5 ${filters.weeklyCadence === 'MONTHLY_ONLY'
                    ? 'bg-slate-700 text-white shadow-md shadow-slate-700/30'
                    : 'text-slate-400 hover:text-slate-200'
                  }`}
              >
                <span className="w-2 h-2 rounded-full bg-slate-400" />
                <span>Monthly Only ({weeklyCadenceCounts.monthly})</span>
              </button>
            </div>
          </div>

          <div className="text-xs text-slate-400 font-mono">
            {activeTree === 'EQUITIES' ? (
              <span>
                Showing <strong className="text-white">{filteredTickers.length}</strong> of{' '}
                <strong className="text-slate-300">{universeTickers.length}</strong> equities
              </span>
            ) : (
              <span>
                Showing <strong className="text-white">{filteredOpportunities.length}</strong> of{' '}
                <strong className="text-slate-300">
                  {dataPayload?.opportunities.length || 0}
                </strong>{' '}
                option contracts
              </span>
            )}
          </div>
        </div>

        {/* Primary Content View Switcher */}
        {activeTree === 'EQUITIES' ? (
          activeEquitiesTab === 'INTERACTIVE_CHARTS' ? (
            /* Dedicated Interactive Technical Chart Workspace */
            <div className="space-y-4">
              {/* Ticker Selector Strip */}
              <div className="glass-panel p-2.5 rounded-xl border border-slate-800 flex items-center space-x-2 overflow-x-auto">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider pl-2 pr-1 shrink-0">
                  Select Ticker:
                </span>
                {filteredTickers.map((t) => (
                  <button
                    key={t.symbol}
                    onClick={() => setActiveChartSymbol(t.symbol)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all shrink-0 flex items-center space-x-1.5 ${activeChartSymbol === t.symbol
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 border border-blue-400'
                        : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
                      }`}
                  >
                    <span>{t.symbol}</span>
                    <span className="text-[10px] text-slate-300 font-sans font-normal">
                      ${t.spot_price.toFixed(0)}
                    </span>
                  </button>
                ))}
              </div>

              {/* Chart Canvas */}
              {(() => {
                const targetTicker =
                  filteredTickers.find((t) => t.symbol === activeChartSymbol) ||
                  filteredTickers[0] ||
                  universeTickers[0];
                return targetTicker ? (
                  <InteractiveChart
                    ticker={targetTicker}
                    opportunities={dataPayload?.opportunities || []}
                    height={460}
                  />
                ) : null;
              })()}
            </div>
          ) : activeEquitiesTab === 'FUNDAMENTAL_HEALTH' ? (
            /* Fundamental Solvency, Altman Z-Score & SEC EDGAR Filings */
            <div className="space-y-4">
              <FundamentalHealthTable
                data={fundamentalHealthData}
                onSelectTicker={(symbol) => {
                  const target = universeTickers.find((t) => t.symbol === symbol);
                  if (target) {
                    setSelectedTicker(target);
                  } else {
                    const fundItem = fundamentalHealthData.find((f) => f.symbol === symbol);
                    setSelectedTicker({
                      symbol,
                      name: fundItem?.name || symbol,
                      sector: fundItem?.sector || 'Equities',
                      liquidity_tier: 'Tier 2/3 (Moderate)',
                      spot_price: fundItem?.spot_price || 100.0,
                      avg_volume_30: 1000000,
                      sma_20: fundItem?.spot_price || 100.0,
                      upper_bb: (fundItem?.spot_price || 100.0) * 1.07,
                      lower_bb: (fundItem?.spot_price || 100.0) * 0.93,
                      bb_width_pct: 14.0,
                      rsi_14: 50.0,
                      rsi_flag: 'NORMAL',
                      hv_30: 25.0,
                      iv_current: 25.0,
                      iv_rank: 35,
                      earnings_within_7d: false,
                      next_earnings_date: 'N/A',
                    });
                  }
                }}
              />
            </div>
          ) : (
            /* Tree 1: US Equities Analysis (Primary Screener Table) */
            <div className="space-y-4">
              {activeEquitiesTab === 'TREND_SUPPORT' && (
                <div className="glass-panel p-3 rounded-xl border border-blue-500/30 bg-blue-950/20 text-xs flex items-center justify-between text-blue-300">
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-blue-400" />
                    <span><strong>Trend &amp; Support Map:</strong> Tickers sorted by proximity to key support levels and 20D SMA boundaries.</span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">Sort: Proximity to Support</span>
                </div>
              )}
              {activeEquitiesTab === 'VOLATILITY_RISK' && (
                <div className="glass-panel p-3 rounded-xl border border-amber-500/30 bg-amber-950/20 text-xs flex items-center justify-between text-amber-300">
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    <span><strong>Volatility &amp; Risk Profiler:</strong> Filtered for high Implied Volatility Rank (IVR &ge; 40) and 30D Historical Volatility.</span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">Sort: 30D HV (Desc)</span>
                </div>
              )}
              {activeEquitiesTab === 'EARNINGS_CALENDAR' && (
                <div className="glass-panel p-3 rounded-xl border border-rose-500/30 bg-rose-950/20 text-xs flex items-center justify-between text-rose-300">
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-rose-400" />
                    <span><strong>Earnings Calendar &amp; Binary Risk:</strong> Monitoring assets with upcoming quarterly earnings reports within the next 7–14 days.</span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">Earnings Shock Alert Active</span>
                </div>
              )}
              {activeEquitiesTab === 'SECTOR_OVERVIEW' && (
                <div className="glass-panel p-3 rounded-xl border border-purple-500/30 bg-purple-950/20 text-xs flex items-center justify-between text-purple-300">
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-purple-400" />
                    <span><strong>Sector &amp; Universe Overview:</strong> Tickers categorized across broad indices, technology, healthcare, and income funds.</span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">Sort: Sector Grouping</span>
                </div>
              )}

              <PrimaryScreenerTable
                tickers={filteredTickers}
                watchlist={currentWatchlistSymbols}
                onToggleWatchlist={handleToggleWatchlist}
                sortBy={filters.sortBy}
                sortOrder={filters.sortOrder}
                onSort={handleSort}
                onSelectTicker={(ticker) => setSelectedTicker(ticker)}
              />
            </div>
          )
        ) : (
          /* Tree 2: Options & Weekly Yield Engine */
          <div className="space-y-4">
            {activeOptionsTab === 'MULTI_LEG_SPREADS' ? (
              /* Defined-Risk Vertical Spreads & Iron Condors (anchored in 0.15 - 0.20 Delta) */
              <MultiLegSpreadTable
                spreads={multiLegSpreads}
                onStageSpreadOrder={handleStageSpread}
              />
            ) : activeOptionsTab === 'VOLATILITY_SKEW' ? (
              /* 25-Delta Volatility Skew & Term Structure Radar */
              <VolatilitySkewRadar skewData={volatilitySkewData} />
            ) : activeOptionsTab === 'BACKTEST_MARGIN' ? (
              /* Multi-Year Systematic Backtester & FINRA 4210 Margin Stress Test */
              <OptionsBacktestView availableSymbols={universeTickers.map((t) => t.symbol)} />
            ) : activeOptionsTab === 'BROKER_STAGING' ? (
              /* Broker Order Staging & 1-Click Execution Workbench */
              <BrokerStagingWorkbench
                opportunities={filteredOpportunities}
                spreads={multiLegSpreads}
                onStageOpportunity={handleStageOpportunity}
                onStageSpread={handleStageSpread}
                onOpenSchwabSettings={() => setIsSchwabModalOpen(true)}
              />
            ) : (
              /* Options Opportunities Table (CSPs & CCs) */
              <div className="space-y-4">
                {activeOptionsTab === 'DELTA_GREEKS' && (
                  <div className="glass-panel p-3 rounded-xl border border-emerald-500/30 bg-emerald-950/20 text-xs flex items-center justify-between text-emerald-300">
                    <div className="flex items-center space-x-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      <span><strong>0.15–0.20 Delta Sweet Spot:</strong> Options positioned outside 2 SD Bollinger Bands with 80%–85% Probability of Expiring OTM.</span>
                    </div>
                    <span className="text-[11px] font-mono text-slate-400">Sweet Spot Active</span>
                  </div>
                )}
                {activeOptionsTab === 'EXPIRATION_CADENCE' && (
                  <div className="glass-panel p-3 rounded-xl border border-teal-500/30 bg-teal-950/20 text-xs flex items-center justify-between text-teal-300">
                    <div className="flex items-center space-x-2">
                      <span className="w-2 h-2 rounded-full bg-teal-400" />
                      <span><strong>Expiration Cadence &amp; CBOE Registry:</strong> Distinguishing weekly-optionable tickers (3–5 DTE) from standard monthly-only contracts.</span>
                    </div>
                    <span className="text-[11px] font-mono text-slate-400">CBOE Directory Validated</span>
                  </div>
                )}

                <ScreenerTable
                  opportunities={filteredOpportunities}
                  sortBy={filters.sortBy}
                  sortOrder={filters.sortOrder}
                  onSort={handleSort}
                  onSelectOpportunity={(opp) => setSelectedOpportunity(opp)}
                  onOpenCalculator={(opp) => setCalculatorOpportunity(opp)}
                  onStageOrder={handleStageOpportunity}
                />
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modals Suite */}
      {/* 1. Global Command Palette (Ctrl+K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        tickers={universeTickers}
        onSelectTicker={(t) => {
          setSelectedTicker(t);
        }}
        onNavigateTree={(tree, tab) => {
          setActiveTree(tree);
          if (tree === 'EQUITIES' && tab) setActiveEquitiesTab(tab as EquitiesTabType);
          if (tree === 'OPTIONS' && tab) setActiveOptionsTab(tab as OptionsTabType);
        }}
        onOpenHelp={() => setIsHelpModalOpen(true)}
        onOpenWatchlist={() => setIsWatchlistModalOpen(true)}
        onOpenReports={() => setIsReportQueryModalOpen(true)}
        onOpenSchwab={() => setIsSchwabModalOpen(true)}
        onOpenDiagnostics={() => setIsDiagnosticsOpen(true)}
        onExportCSV={handleExportCSV}
        onExportExcel={handleExportExcel}
        onTriggerPrint={triggerPrintReport}
      />

      {/* 2. Strategy & Help Handbook (?) */}
      <HelpHandbookModal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
      />

      {/* 3. Charles Schwab Retail Trader API Provisioning Modal */}
      <SchwabSettingsModal
        isOpen={isSchwabModalOpen}
        onClose={() => setIsSchwabModalOpen(false)}
      />

      {/* 3.1. API Health & Automated Diagnostics Suite Modal */}
      {isDiagnosticsOpen && (
        <ErrorBoundary fallbackTitle="API Diagnostics Suite Recovered" onReset={() => setIsDiagnosticsOpen(false)}>
          <ApiDiagnosticsModal
            isOpen={isDiagnosticsOpen}
            onClose={() => setIsDiagnosticsOpen(false)}
            onOpenSchwabSettings={() => setIsSchwabModalOpen(true)}
          />
        </ErrorBoundary>
      )}

      {/* 4. Multi-Watchlist Manager with Bulk & CSV/Excel Ingestion (W) */}
      <WatchlistManagerModal
        isOpen={isWatchlistModalOpen}
        onClose={() => setIsWatchlistModalOpen(false)}
        watchlistGroups={watchlistGroups}
        activeGroupId={activeGroupId}
        onSelectGroup={(id) => setActiveGroupId(id)}
        onCreateGroup={handleCreateWatchlist}
        onDeleteGroup={handleDeleteWatchlist}
        onUpdateGroupTickers={handleUpdateGroupTickers}
        availableUniverse={universeTickers}
        onAddCustomTickerMeta={handleAddCustomTickerMeta}
        onRecalculateTickers={handleLiveRecalculate}
        isRecalculating={isRecalculating}
      />


      {/* 5. Report Queries & Multi-Format Exports (R) */}
      {isReportQueryModalOpen && (
        <ErrorBoundary fallbackTitle="Report Queries & Export View Recovered" onReset={() => setIsReportQueryModalOpen(false)}>
          <ReportQueryModal
            isOpen={isReportQueryModalOpen}
            onClose={() => setIsReportQueryModalOpen(false)}
            tickers={universeTickers}
            opportunities={allUniverseOpportunities}
            summary={dataPayload?.summary || null}
          />
        </ErrorBoundary>
      )}

      {/* 5. Ticker Detail 5-Part Audit Modal */}
      {selectedTicker && (
        <ErrorBoundary fallbackTitle="Ticker Detail View Recovered" onReset={() => setSelectedTicker(null)}>
          <TickerAuditModal
            ticker={selectedTicker}
            opportunities={allUniverseOpportunities}
            onClose={() => setSelectedTicker(null)}
          />
        </ErrorBoundary>
      )}

      {/* 6. Option Opportunity Detail Modal */}
      {selectedOpportunity && (
        <ErrorBoundary fallbackTitle="Option Details Recovered" onReset={() => setSelectedOpportunity(null)}>
          <OptionDetailModal
            opportunity={selectedOpportunity}
            onClose={() => setSelectedOpportunity(null)}
            onOpenCalculator={(opp) => {
              setSelectedOpportunity(null);
              setCalculatorOpportunity(opp);
            }}
            onStageOrder={(opp) => {
              setSelectedOpportunity(null);
              handleStageOpportunity(opp);
            }}
          />
        </ErrorBoundary>
      )}

      {/* 7. Cash Income Calculator Modal */}
      {calculatorOpportunity && (
        <ErrorBoundary fallbackTitle="Income Calculator Recovered" onReset={() => setCalculatorOpportunity(null)}>
          <IncomeCalculatorModal
            opportunity={calculatorOpportunity}
            onClose={() => setCalculatorOpportunity(null)}
          />
        </ErrorBoundary>
      )}

      {/* 8. Broker Order Staging & 1-Click Execution Payloads Modal */}
      {isStagedModalOpen && stagedOrder && (
        <ErrorBoundary fallbackTitle="Broker Staging Recovered" onReset={() => setIsStagedModalOpen(false)}>
          <BrokerOrderStagingModal
            isOpen={isStagedModalOpen}
            onClose={() => setIsStagedModalOpen(false)}
            stagedOrder={stagedOrder}
            onQuantityChange={handleUpdateStagedQuantity}
            onAccountTypeChange={handleUpdateStagedAccountType}
            onPricingTypeChange={handleUpdateStagedPricingType}
          />
        </ErrorBoundary>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-6 mt-12 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 space-y-2">
          <p className="font-semibold text-slate-300">
            DeltaHarvest Institutional • Systematic US Equities Analysis &amp; Options Income
          </p>
          <p className="text-[11px] text-slate-500 max-w-2xl mx-auto">
            Rules: Cash-Secured Put strikes $\le$ Lower Bollinger Band (2 SD); Covered Call strikes $\ge$ Upper Bollinger Band (2 SD). Always observe the 80% Profit Buy-to-Close trigger and 0.50 Delta roll trigger.
          </p>
        </div>
      </footer>

      {/* Floating Back to Top Button */}
      <ScrollToTopButton />
    </div>
  );
};
