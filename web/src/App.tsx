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
import { FundamentalHealthTable } from './components/FundamentalHealthTable';
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

const DEFAULT_UNIVERSE_SYMBOLS = [
  'SPY', 'QQQ', 'IWM', 'NVDA', 'AAPL', 'MSFT', 'AMZN', 'TSLA',
  'PLTR', 'IONQ', 'NET', 'RTX', 'JEPI', 'SCHD', 'SPCX', 'ZETA', 'BLZE', 'AXTI',
];

const INITIAL_WATCHLIST_GROUPS: WatchlistGroup[] = [
  {
    id: 'core-18',
    name: 'Core 18 Universe',
    description: 'Default multi-asset watchlist of ETFs, Mega-Caps, and Growth',
    tickers: DEFAULT_UNIVERSE_SYMBOLS,
    isDefault: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'tier-1-liquid',
    name: 'Tier 1 Ultra-Liquid',
    description: 'Tightest penny-wide spreads and institutional depth',
    tickers: ['SPY', 'QQQ', 'NVDA', 'AAPL', 'MSFT', 'AMZN', 'TSLA'],
    isDefault: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'high-yield-etfs',
    name: 'Dividend & High-Yield',
    description: 'Income ETFs and covered-call vehicles',
    tickers: ['JEPI', 'SCHD', 'SPCX'],
    isDefault: true,
    createdAt: new Date().toISOString(),
  },
];

export const App: React.FC = () => {
  const [dataPayload, setDataPayload] = useState<OptionsDataPayload | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
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
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Data Fetching
  const fetchData = async () => {
    setIsLoading(true);
    let loaded = false;

    // 1. Attempt local public JSON path
    try {
      const res = await fetch('./data/options_data.json?t=' + Date.now());
      if (res.ok) {
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

    // 2. Attempt absolute public root /data/options_data.json
    if (!loaded) {
      try {
        const res = await fetch('/data/options_data.json');
        if (res.ok) {
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
        if (activeEquitiesTab === 'EARNINGS_CALENDAR' && filters.onlyEarningsAlert) {
          if (!t.earnings_within_7d) return false;
        }
      }

      // Quick KPI flags
      if (filters.onlyHighIvr && t.iv_rank < 45) return false;
      if (filters.onlyOversold && t.rsi_14 > 40) return false;
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

  // Filtered Opportunities (for Tree 2 Options Screener)
  const filteredOpportunities = useMemo(() => {
    const opps = dataPayload?.opportunities || [];
    return opps.filter((o) => {
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
    dataPayload,
    currentWatchlistSymbols,
    showWatchlistOnly,
    filters,
    activeTree,
    activeOptionsTab,
    universeTickers,
  ]);

  // Synthesized Multi-Leg Spreads (anchored strictly in 0.15 - 0.20 Delta)
  const multiLegSpreads = useMemo(() => {
    return generateMultiLegSpreads(filteredTickers, dataPayload?.opportunities || []);
  }, [filteredTickers, dataPayload?.opportunities]);

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
    if (!universeTickers.some((t) => t.symbol === symbol)) {
      const syntheticMeta: TickerMeta = {
        symbol,
        name: `${symbol} (Custom User Asset)`,
        sector: 'Custom Watchlist',
        liquidity_tier: 'Tier 2/3 (Moderate)',
        spot_price: 100.0,
        avg_volume_30: 1000000,
        sma_20: 100.0,
        upper_bb: 105.0,
        lower_bb: 95.0,
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
      setCustomTickers((prev) => [...prev, syntheticMeta]);
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
    setShowWatchlistOnly(false);
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
      exportTickersToCSV(filteredTickers, `deltaharvest_equities_${Date.now()}.csv`);
    } else {
      exportOpportunitiesToCSV(filteredOpportunities, `deltaharvest_options_${Date.now()}.csv`);
    }
  };

  const handleExportExcel = () => {
    exportToExcel(
      {
        tickers: filteredTickers,
        opportunities: filteredOpportunities,
        summary: dataPayload?.summary || null,
      },
      `deltaharvest_complete_${Date.now()}.xlsx`
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-white">
      {/* Header with Search, Watchlists, Reports, and Help triggers */}
      <Header
        summary={dataPayload?.summary || null}
        lastUpdated={dataPayload?.metadata.last_updated || ''}
        totalTickers={universeTickers.length}
        onRefresh={fetchData}
        isLoading={isLoading}
        dataSource={dataSource}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onOpenHelp={() => setIsHelpModalOpen(true)}
        onOpenWatchlists={() => setIsWatchlistModalOpen(true)}
        onOpenReports={() => setIsReportQueryModalOpen(true)}
        onOpenSchwab={() => setIsSchwabModalOpen(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Dual Navigation Tree: US Equities Analysis vs Options Engine */}
        <DualMenuTree
          activeTree={activeTree}
          onSelectTree={(tree) => setActiveTree(tree)}
          activeEquitiesTab={activeEquitiesTab}
          onSelectEquitiesTab={(tab) => setActiveEquitiesTab(tab)}
          activeOptionsTab={activeOptionsTab}
          onSelectOptionsTab={(tab) => setActiveOptionsTab(tab)}
          totalTickersCount={universeTickers.length}
          weeklyCount={weeklyCadenceCounts.weekly}
          monthlyCount={weeklyCadenceCounts.monthly}
          highIvrCount={highIvrCount}
          earningsAlertCount={earningsAlertCount}
        />

        {/* Global KPI Summary Ribbon */}
        <KPICards
          tickers={universeTickers}
          activeFilter={
            filters.onlyHighIvr
              ? 'IVR'
              : filters.onlyOversold
              ? 'OVERSOLD'
              : filters.onlyEarningsAlert
              ? 'EARNINGS'
              : 'ALL'
          }
          onFilterHighIvr={() =>
            setFilters((prev) => ({
              ...prev,
              onlyHighIvr: !prev.onlyHighIvr,
              onlyOversold: false,
              onlyEarningsAlert: false,
            }))
          }
          onFilterOversold={() =>
            setFilters((prev) => ({
              ...prev,
              onlyOversold: !prev.onlyOversold,
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
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all ${
                showWatchlistOnly
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
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all ${
                filters.onlyHighIvr
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>IVR ≥ 45%</span>
            </button>

            <button
              onClick={() =>
                setFilters((prev) => ({ ...prev, onlyOversold: !prev.onlyOversold }))
              }
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all ${
                filters.onlyOversold
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Oversold Dips</span>
            </button>

            <button
              onClick={() =>
                setFilters((prev) => ({ ...prev, onlyEarningsAlert: !prev.onlyEarningsAlert }))
              }
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all ${
                filters.onlyEarningsAlert
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
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  !filters.weeklyCadence || filters.weeklyCadence === 'ALL'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                All Cycles ({weeklyCadenceCounts.all})
              </button>
              <button
                onClick={() => setFilters((prev) => ({ ...prev, weeklyCadence: 'WEEKLY_ONLY' }))}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1.5 ${
                  filters.weeklyCadence === 'WEEKLY_ONLY'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                    : 'text-slate-400 hover:text-emerald-400'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Weekly Only ({weeklyCadenceCounts.weekly})</span>
              </button>
              <button
                onClick={() => setFilters((prev) => ({ ...prev, weeklyCadence: 'MONTHLY_ONLY' }))}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1.5 ${
                  filters.weeklyCadence === 'MONTHLY_ONLY'
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
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all shrink-0 flex items-center space-x-1.5 ${
                      activeChartSymbol === t.symbol
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
              <FundamentalHealthTable data={fundamentalHealthData} />
            </div>
          ) : (
            /* Tree 1: US Equities Analysis (Primary Screener Table) */
            <div className="space-y-4">
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
              <MultiLegSpreadTable spreads={multiLegSpreads} />
            ) : activeOptionsTab === 'VOLATILITY_SKEW' ? (
              /* 25-Delta Volatility Skew & Term Structure Radar */
              <VolatilitySkewRadar skewData={volatilitySkewData} />
            ) : activeOptionsTab === 'EXPIRATION_CADENCE' ? (
              /* Expiration Cadence view: Focus on weekly vs monthly metadata */
              <PrimaryScreenerTable
                tickers={filteredTickers}
                watchlist={currentWatchlistSymbols}
                onToggleWatchlist={handleToggleWatchlist}
                sortBy={filters.sortBy}
                sortOrder={filters.sortOrder}
                onSort={handleSort}
                onSelectTicker={(ticker) => setSelectedTicker(ticker)}
              />
            ) : (
              /* Options Opportunities Table (CSPs & CCs) */
              <ScreenerTable
                opportunities={filteredOpportunities}
                sortBy={filters.sortBy}
                sortOrder={filters.sortOrder}
                onSort={handleSort}
                onSelectOpportunity={(opp) => setSelectedOpportunity(opp)}
                onOpenCalculator={(opp) => setCalculatorOpportunity(opp)}
              />
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
      />

      {/* 5. Report Queries & Multi-Format Exports (R) */}
      <ReportQueryModal
        isOpen={isReportQueryModalOpen}
        onClose={() => setIsReportQueryModalOpen(false)}
        tickers={universeTickers}
        opportunities={dataPayload?.opportunities || []}
        summary={dataPayload?.summary || null}
      />

      {/* 5. Ticker Detail 5-Part Audit Modal */}
      <TickerAuditModal
        ticker={selectedTicker}
        opportunities={dataPayload?.opportunities || []}
        onClose={() => setSelectedTicker(null)}
      />

      {/* 6. Option Opportunity Detail Modal */}
      <OptionDetailModal
        opportunity={selectedOpportunity}
        onClose={() => setSelectedOpportunity(null)}
        onOpenCalculator={(opp) => {
          setSelectedOpportunity(null);
          setCalculatorOpportunity(opp);
        }}
      />

      {/* 7. Cash Income Calculator Modal */}
      <IncomeCalculatorModal
        opportunity={calculatorOpportunity}
        onClose={() => setCalculatorOpportunity(null)}
      />

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
    </div>
  );
};
