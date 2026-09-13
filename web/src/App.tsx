import React, { useState, useEffect, useMemo, Suspense, lazy } from 'react';
import { Header } from './components/Header';
import { InstitutionalSidebar } from './components/InstitutionalSidebar';
import { InstitutionalHeroBanner } from './components/ui/InstitutionalHeroBanner';
import { DualMenuTree } from './components/DualMenuTree';
import { CommandPalette } from './components/CommandPalette';
import { LoadingSkeleton } from './components/ui/LoadingSkeleton';
import { BreadcrumbsBar } from './components/ui/BreadcrumbsBar';
import { ScreenerFilterToolbar } from './components/ui/ScreenerFilterToolbar';

// Core primary tables & controls
import { PrimaryScreenerTable } from './components/PrimaryScreenerTable';
import { ScreenerTable } from './components/ScreenerTable';
import { ScrollToTopButton } from './components/ScrollToTopButton';
import { ErrorBoundary } from './components/ErrorBoundary';
import { InstitutionalFooter } from './components/layout/InstitutionalFooter';

// Custom Hooks
import { useAppNavigation } from './hooks/useAppNavigation';
import { useWatchlistState } from './hooks/useWatchlistState';
import { useModalManager } from './hooks/useModalManager';
import { useGlobalShortcuts } from './hooks/useGlobalShortcuts';
import { useOptionsData } from './hooks/useOptionsData';

import { AppModalsContainer } from './components/modals/AppModalsContainer';
import { useFilteredOpportunities } from './hooks/useFilteredOpportunities';
import { useOrderStaging } from './hooks/useOrderStaging';

// Code-split heavy views & tabs
const InteractiveChart = lazy(() => import('./components/InteractiveChart').then(m => ({ default: m.InteractiveChart })));
const MultiLegSpreadTable = lazy(() => import('./components/MultiLegSpreadTable').then(m => ({ default: m.MultiLegSpreadTable })));
const VolatilitySkewRadar = lazy(() => import('./components/VolatilitySkewRadar').then(m => ({ default: m.VolatilitySkewRadar })));
const FundamentalHealthTable = lazy(() => import('./components/FundamentalHealthTable').then(m => ({ default: m.FundamentalHealthTable })));
const OptionsBacktestView = lazy(() => import('./components/OptionsBacktestView').then(m => ({ default: m.OptionsBacktestView })));
const BrokerStagingWorkbench = lazy(() => import('./components/BrokerStagingWorkbench').then(m => ({ default: m.BrokerStagingWorkbench })));
const OptionChainMatrixView = lazy(() => import('./components/OptionChainMatrixView').then(m => ({ default: m.OptionChainMatrixView })));
const PmccScreenerView = lazy(() => import('./components/PmccScreenerView').then(m => ({ default: m.PmccScreenerView })));
const PortfolioMarginSimulatorView = lazy(() => import('./components/PortfolioMarginSimulatorView').then(m => ({ default: m.PortfolioMarginSimulatorView })));
const MultiAgentTradeAuditorView = lazy(() => import('./components/MultiAgentTradeAuditorView').then(m => ({ default: m.MultiAgentTradeAuditorView })));
const DefensiveRollAssistantView = lazy(() => import('./components/DefensiveRollAssistantView').then(m => ({ default: m.DefensiveRollAssistantView })));
const TaxAlphaOptimizerView = lazy(() => import('./components/TaxAlphaOptimizerView').then(m => ({ default: m.TaxAlphaOptimizerView })));
const ExecutivePortfolioDigestView = lazy(() => import('./components/ExecutivePortfolioDigestView').then(m => ({ default: m.ExecutivePortfolioDigestView })));
const WeeklyStockScreenersView = lazy(() => import('./components/WeeklyStockScreenersView').then(m => ({ default: m.WeeklyStockScreenersView })));
const OptionsIncomeAnalyzer = lazy(() => import('./components/OptionsIncomeAnalyzer').then(m => ({ default: m.OptionsIncomeAnalyzer })));
const EconomicCalendarView = lazy(() => import('./components/EconomicCalendarView').then(m => ({ default: m.EconomicCalendarView })));
const WeeklyPositionAuditView = lazy(() => import('./components/WeeklyPositionAuditView').then(m => ({ default: m.WeeklyPositionAuditView })));
const CascadingScreenerView = lazy(() => import('./components/CascadingScreenerView').then(m => ({ default: m.CascadingScreenerView })));
const SchwabPositionsUploadView = lazy(() => import('./components/SchwabPositionsUploadView').then(m => ({ default: m.SchwabPositionsUploadView })));
const WeeklyCashLedgerView = lazy(() => import('./components/WeeklyCashLedgerView').then(m => ({ default: m.WeeklyCashLedgerView })));
const HoldingsCoveredCallView = lazy(() => import('./components/HoldingsCoveredCallView').then(m => ({ default: m.HoldingsCoveredCallView })));
const WeeklyExecutiveReportView = lazy(() => import('./components/WeeklyExecutiveReportView').then(m => ({ default: m.WeeklyExecutiveReportView })));
const MethodologyView = lazy(() => import('./components/MethodologyView').then(m => ({ default: m.MethodologyView })));
const FaqView = lazy(() => import('./components/FaqView').then(m => ({ default: m.FaqView })));
const DisclaimerView = lazy(() => import('./components/DisclaimerView').then(m => ({ default: m.DisclaimerView })));
import { useAuth } from './context/AuthContext';
import { LoginView } from './components/auth/LoginView';
import { UserDashboardView } from './components/auth/UserDashboardView';
import { AdminUsersView } from './components/auth/AdminUsersView';
import { PasswordChangeView } from './components/auth/PasswordChangeView';
import { Users } from './components/icons';


// Types & Utilities
import { PortfolioPosition } from './utils/portfolioStressTest';
import { getStoredCapitalState } from './utils/capitalAndTaxLedger';
import { WeeklyScreenerDataset } from './types/weeklyScreeners';
import { startContinuousRiskSweeper, stopContinuousRiskSweeper } from './utils/continuousRiskSweeper';
import { OptionContractData } from './utils/optionChainMatrix';
import { calculateLiveExecutiveMetrics } from './utils/executiveReportGenerator';
import {
  TickerMeta,
  OptionOpportunity,
  MultiLegSpread,
  FilterState,
  EquitiesTabType,
  OptionsTabType,
} from './types/options';
import {
  exportTickersToCSV,
  exportOpportunitiesToCSV,
  exportToExcel,
  triggerPrintReport,
} from './utils/exportImport';
import { SECURITY_INTELLIGENCE_REGISTRY } from './utils/securityIntelligence';
import {
  synthesizeAllUniverseOpportunities,
  createFallbackTickerMeta,
} from './utils/optionsSynthesis';

const DEFAULT_UNIVERSE_SYMBOLS = [
  'AXTI', 'BLZE', 'IONQ', 'LUNR', 'NET', 'RTX', 'TSLA',
];

export const App: React.FC = () => {
  // 1. Navigation Hook
  const {
    activeTree,
    setActiveTree,
    activeEquitiesTab,
    setActiveEquitiesTab,
    activeOptionsTab,
    setActiveOptionsTab,
    activeChartSymbol,
    setActiveChartSymbol,
    navigateTo,
  } = useAppNavigation();

  const { user, isAuthenticated, isAdmin, isLoading: isAuthLoading } = useAuth();

  // Redirect non-admin client accounts away from Admin User Management
  useEffect(() => {
    if (isAuthenticated && !isAdmin) {
      if (activeTree === 'ADMIN_USERS') {
        navigateTo('DASHBOARD');
      }
    }
  }, [isAuthenticated, isAdmin, activeTree, navigateTo]);

  // 2. Watchlist State Hook
  const {
    watchlistGroups,
    setWatchlistGroups,
    activeGroupId,
    setActiveGroupId,
    showWatchlistOnly,
    setShowWatchlistOnly,
    currentWatchlistSymbols,
    handleToggleWatchlist,
    handleCreateWatchlist,
    handleRenameWatchlist,
    handleDeleteWatchlist,
    handleUpdateGroupTickers,
  } = useWatchlistState();

  // 3. Modal Manager Hook
  const {
    state: modalState,
    setSelectedTicker,
    setSelectedOpportunity,
    setCalculatorOpportunity,
    setIsCommandPaletteOpen,
    setIsHelpModalOpen,
    setIsWatchlistModalOpen,
    setIsReportQueryModalOpen,
    setIsTradierModalOpen,
    setIsSchwabModalOpen,
    setIsDiagnosticsOpen,
    setIsAlertsModalOpen,
    setIsSimulatorModalOpen,
    setSimulatorInitialData,
    setStagedOrder,
    setIsStagedModalOpen,
    setActiveStagedOpportunity,
    setActiveStagedSpread,
    openStagedModal,
    openOptionDetail,
    openValuation,
    closeValuation,
  } = useModalManager();

  // 4. Options Data Hook (Sync, WebSockets, Cache, REST fallback)
  const {
    dataPayload,
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
  } = useOptionsData(currentWatchlistSymbols);

  // 5. Global Shortcuts Hook
  useGlobalShortcuts({
    onToggleCommandPalette: () => setIsCommandPaletteOpen((prev) => !prev),
    onToggleHelpModal: () => setIsHelpModalOpen((prev) => !prev),
    onToggleWatchlistModal: () => setIsWatchlistModalOpen((prev) => !prev),
    onToggleReportQueryModal: () => setIsReportQueryModalOpen((prev) => !prev),
    onSelectTree: (tree) => setActiveTree(tree),
    onNavigateOptionsTab: (tab) => {
      setActiveTree('OPTIONS');
      setActiveOptionsTab(tab);
    },
  });

  // App-specific UI States
  const [customTickers, setCustomTickers] = useState<TickerMeta[]>([]);
  const [weeklyScreenersDataset, setWeeklyScreenersDataset] = useState<WeeklyScreenerDataset | null>(null);
  const [portfolioRefreshKey, setPortfolioRefreshKey] = useState<number>(0);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  // Computed Live Executive Portfolio Metrics
  const liveExecutiveMetrics = useMemo(() => {
    return calculateLiveExecutiveMetrics();
  }, [portfolioRefreshKey]);

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

  // Continuous Risk Sweeper background execution
  useEffect(() => {
    startContinuousRiskSweeper();
    return () => {
      stopContinuousRiskSweeper();
    };
  }, []);

  // Ingest weekly stock screeners JSON dataset on mount
  useEffect(() => {
    const loadWeeklyScreeners = async () => {
      try {
        const res = await fetch('./data/weekly_screeners.json?t=' + Date.now());
        if (res.ok) {
          const json = await res.json();
          setWeeklyScreenersDataset(json);
        }
      } catch (err) {
        console.warn('Could not load weekly_screeners.json on startup:', err);
      }
    };
    loadWeeklyScreeners();
  }, []);

  // Listen for portfolio book and balance changes
  useEffect(() => {
    const handlePortfolioUpdate = () => {
      setPortfolioRefreshKey((prev) => prev + 1);
    };
    window.addEventListener('deltaharvest_portfolio_updated', handlePortfolioUpdate);
    window.addEventListener('storage', handlePortfolioUpdate);
    return () => {
      window.removeEventListener('deltaharvest_portfolio_updated', handlePortfolioUpdate);
      window.removeEventListener('storage', handlePortfolioUpdate);
    };
  }, []);

  // Dynamic Equities Ingestion
  const accountEquitySymbols = useMemo(() => {
    try {
      const raw = typeof localStorage !== 'undefined' ? localStorage.getItem('deltaharvest_portfolio_book') : null;
      if (raw) {
        const positions: PortfolioPosition[] = JSON.parse(raw);
        if (Array.isArray(positions) && positions.length > 0) {
          const stocks = positions
            .filter((p) => p.type === 'STOCK')
            .map((p) => p.symbol.toUpperCase().trim())
            .filter(Boolean);
          const unique = Array.from(new Set(stocks));
          if (unique.length > 0) return unique;
        }
      }
    } catch (e) {
      console.warn('Failed to parse account equity positions from storage:', e);
    }
    return DEFAULT_UNIVERSE_SYMBOLS;
  }, [portfolioRefreshKey]);

  const separatelyCreatedWatchlistSymbols = useMemo(() => {
    const symbols = new Set<string>();
    (watchlistGroups || []).forEach((g) => {
      (g.tickers || []).forEach((t) => {
        const clean = t.toUpperCase().trim();
        if (clean) symbols.add(clean);
      });
    });
    return Array.from(symbols);
  }, [watchlistGroups]);

  const trackedEquitySymbols = useMemo(() => {
    return Array.from(new Set([...accountEquitySymbols, ...separatelyCreatedWatchlistSymbols]));
  }, [accountEquitySymbols, separatelyCreatedWatchlistSymbols]);

  // Dynamic Universe Tickers Assembly
  const universeTickers = useMemo(() => {
    const rawTickers = dataPayload?.tickers || [];
    const tickerMap = new Map<string, TickerMeta>();

    rawTickers.forEach((t) => tickerMap.set(t.symbol.toUpperCase(), t));
    customTickers.forEach((t) => {
      if (!tickerMap.has(t.symbol.toUpperCase())) tickerMap.set(t.symbol.toUpperCase(), t);
    });

    const result: TickerMeta[] = [];
    trackedEquitySymbols.forEach((sym) => {
      const upper = sym.toUpperCase().trim();
      if (tickerMap.has(upper)) {
        result.push(tickerMap.get(upper)!);
      } else {
        const intel = SECURITY_INTELLIGENCE_REGISTRY[upper];
        const initialSpot = intel?.keySupportPrice && intel?.keyResistancePrice
          ? Math.round(((intel.keySupportPrice + intel.keyResistancePrice) / 2) * 100) / 100
          : intel?.targetPrice ? Math.round(intel.targetPrice * 0.9 * 100) / 100 : 100.0;
        const initialVol = intel?.liquidityScore && intel.liquidityScore >= 95 ? 25000000 : 1000000;
        const initialName = intel?.name || `${upper} Equity`;
        const initialSector = intel?.sector || 'Custom Watchlist';
        const initialTier = intel?.liquidityScore && intel.liquidityScore >= 95 ? 'Tier 1 (Ultra-Liquid)' : 'Tier 2/3 (Moderate)';

        result.push(createFallbackTickerMeta(upper, {
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
          expiration_cadence: 'Weekly',
        }));
      }
    });

    return result;
  }, [dataPayload, customTickers, trackedEquitySymbols]);

  // Synthesize High-Probability CSP & CC Opportunities for all universe tickers
  const allUniverseOpportunities = useMemo(() => {
    return synthesizeAllUniverseOpportunities(
      dataPayload?.opportunities || [],
      universeTickers,
      trackedEquitySymbols
    );
  }, [dataPayload?.opportunities, universeTickers, trackedEquitySymbols]);

  // Filter State
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

  // 4. Order Staging Handlers Hook
  const {
    handleStageOpportunity,
    handleStageSpread,
    handleStageContractFromChain,
    handleUpdateStagedQuantity,
    handleUpdateStagedAccountType,
    handleUpdateStagedPricingType,
  } = useOrderStaging({
    universeTickers,
    modalState,
    openStagedModal,
    setStagedOrder,
  });

  // 5. Filtered Universe & Synthesized Spreads/Skews Hook
  const {
    weeklyCadenceCounts,
    highIvrCount,
    earningsAlertCount,
    filteredTickers,
    filteredOpportunities,
    multiLegSpreads,
    volatilitySkewData,
    fundamentalHealthData,
  } = useFilteredOpportunities({
    universeTickers,
    allUniverseOpportunities,
    currentWatchlistSymbols,
    showWatchlistOnly,
    filters,
  });

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

      const syntheticMeta = createFallbackTickerMeta(cleanSym, {
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
      });

      setCustomTickers((prev) => {
        if (prev.some((c) => c.symbol === cleanSym)) return prev;
        return [...prev, syntheticMeta];
      });

      setWatchlistGroups((prev) =>
        prev.map((g) => {
          if (g.id === 'core-universe' && !g.tickers.includes(cleanSym)) {
            return { ...g, tickers: [...g.tickers, cleanSym] };
          }
          return g;
        })
      );

      handleLiveRecalculate([cleanSym]);
    }
  };

  // Quick Exports
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
    if (tab === 'TECHNICAL_SCREENER') {
      setFilters((prev) => ({ ...prev, sortBy: 'symbol', sortOrder: 'asc', onlyHighIvr: false, onlyEarningsAlert: false, onlyOversold: false }));
    } else if (tab === 'TREND_SUPPORT') {
      setFilters((prev) => ({ ...prev, sortBy: 'dist_to_support' as any, sortOrder: 'asc', onlyHighIvr: false, onlyEarningsAlert: false, onlyOversold: false }));
    } else if (tab === 'VOLATILITY_RISK') {
      setFilters((prev) => ({ ...prev, sortBy: 'hv_30', sortOrder: 'desc', onlyHighIvr: false, onlyEarningsAlert: false, onlyOversold: false }));
    } else if (tab === 'EARNINGS_CALENDAR') {
      setFilters((prev) => ({ ...prev, sortBy: 'next_earnings_date' as any, sortOrder: 'asc', onlyHighIvr: false, onlyEarningsAlert: false, onlyOversold: false }));
    } else if (tab === 'SECTOR_OVERVIEW') {
      setFilters((prev) => ({ ...prev, sortBy: 'sector', sortOrder: 'asc', onlyHighIvr: false, onlyEarningsAlert: false, onlyOversold: false }));
    } else {
      setFilters((prev) => ({ ...prev, onlyHighIvr: false, onlyEarningsAlert: false, onlyOversold: false }));
    }
  };

  const handleSelectOptionsTab = (tab: OptionsTabType) => {
    setActiveOptionsTab(tab);
    setFilters((prev) => ({ ...prev, onlyHighIvr: false, onlyEarningsAlert: false }));
    if (tab === 'TICKER_AUDIT') {
      const target = modalState.selectedTicker || filteredTickers[0] || universeTickers[0];
      if (target) setSelectedTicker(target);
    } else if (tab === 'INCOME_CALCULATOR') {
      const targetOpp = modalState.calculatorOpportunity || (dataPayload?.opportunities.length ? dataPayload.opportunities[0] : null);
      if (targetOpp) setCalculatorOpportunity(targetOpp);
    } else if (tab === 'DELTA_GREEKS') {
      setFilters((prev) => ({ ...prev, strategy: 'ALL' }));
    }
  };

  const isScreeningTab = (activeTree === 'EQUITIES' && (activeEquitiesTab === 'TECHNICAL_SCREENER' || activeEquitiesTab === 'TREND_SUPPORT' || activeEquitiesTab === 'VOLATILITY_RISK' || activeEquitiesTab === 'EARNINGS_CALENDAR' || activeEquitiesTab === 'SECTOR_OVERVIEW')) ||
    (activeTree === 'OPTIONS' && (activeOptionsTab === 'INCOME_SCREENER' || activeOptionsTab === 'DELTA_GREEKS' || activeOptionsTab === 'EXPIRATION_CADENCE'));

  // ------------------------------------------------------------------------
  // FAIL-SAFE PRIVACY & TENANT ISOLATION GATE
  // When an unauthenticated visitor accesses the application URL, they must
  // NEVER see the internal Living Trust portfolio, cash ledger, or private records.
  // Instead, immediately hold them at the LoginView and display access request info.
  // ------------------------------------------------------------------------
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-200">
        <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mb-4" />
        <p className="text-xs font-mono text-slate-400">Verifying Security Session & Tenant Authorization...</p>
      </div>
    );
  }

  if (!isAuthenticated || activeTree === 'LOGIN') {
    return (
      <LoginView
        onSuccess={(loggedInUser) => {
          const isTargetAdmin =
            loggedInUser?.role === 'ADMIN' ||
            loggedInUser?.email?.toLowerCase() === 'fjmaresca@gmail.com' ||
            user?.role === 'ADMIN' ||
            user?.email?.toLowerCase() === 'fjmaresca@gmail.com' ||
            isAdmin;

          if (isTargetAdmin) {
            navigateTo('WORKFLOW', 'SCHWAB_POSITIONS_UPLOAD');
          } else {
            navigateTo('DASHBOARD');
          }
        }}
      />
    );
  }

  return (

    <div className="min-h-screen bg-slate-950 light:bg-slate-50 text-slate-100 light:text-slate-900 flex selection:bg-emerald-500 selection:text-white transition-colors">
      {/* 1. Institutional Sidebar Navigation */}
      <InstitutionalSidebar
        activeTree={activeTree}
        onSelectTree={(tree) => navigateTo(tree, activeOptionsTab, activeEquitiesTab)}
        activeEquitiesTab={activeEquitiesTab}
        onSelectEquitiesTab={handleSelectEquitiesTab}
        activeOptionsTab={activeOptionsTab}
        onSelectOptionsTab={handleSelectOptionsTab}
        totalTickersCount={universeTickers.length}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        onOpenSimulator={() => setIsSimulatorModalOpen(true)}
        onOpenValuation={() => openValuation('NVDA')}
        onOpenWatchlists={() => setIsWatchlistModalOpen(true)}
        onOpenReports={() => setIsReportQueryModalOpen(true)}
        onOpenDiagnostics={() => setIsDiagnosticsOpen(true)}
        onOpenTradier={() => setIsTradierModalOpen(true)}
        onOpenSchwab={() => setIsSchwabModalOpen(true)}
        onOpenAlerts={() => setIsAlertsModalOpen(true)}
        onOpenHelp={() => setIsHelpModalOpen(true)}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        freeCashAmount={getStoredCapitalState().freeCash}
      />

      {/* 2. Main Institutional Content Container */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header with Search, Watchlists, Reports, and Help triggers */}
        <Header
          summary={dataPayload?.summary || null}
          lastUpdated={lastLiveFetchTime || dataPayload?.metadata.last_updated || ''}
          totalTickers={universeTickers.length}
          executiveMetrics={liveExecutiveMetrics}
          onRefresh={fetchData}
          onLiveRecalculate={() => handleLiveRecalculate(currentWatchlistSymbols)}
          isLoading={isLoading}
          isRecalculating={isRecalculating}
          dataSource={dataSource}
          autoSyncInterval={autoSyncSettings.intervalSeconds}
          onChangeAutoSyncInterval={handleAutoSyncIntervalChange}
          autoSyncCountdown={autoSyncCountdown}
          marketHoursOnly={autoSyncSettings.marketHoursOnly}
          onToggleMarketHoursOnly={handleToggleMarketHoursOnly}
          isMarketOpen={isMarketOpen}
          isThrottled={isThrottled}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          onOpenHelp={() => setIsHelpModalOpen(true)}
          onOpenWatchlists={() => setIsWatchlistModalOpen(true)}
          onOpenReports={() => setIsReportQueryModalOpen(true)}
          onOpenTradier={() => setIsTradierModalOpen(true)}
          onOpenSchwab={() => setIsSchwabModalOpen(true)}
          onOpenAlerts={() => setIsAlertsModalOpen(true)}
          onOpenDiagnostics={() => setIsDiagnosticsOpen(true)}
          onOpenSimulator={() => setIsSimulatorModalOpen(true)}
          onOpenValuation={() => openValuation('NVDA')}
          onOpenExecutiveDigest={() => {
            setActiveTree('OPTIONS');
            setActiveOptionsTab('EXECUTIVE_DIGEST');
          }}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(true)}
          theme={theme}
          onToggleTheme={handleToggleTheme}
          onNavigateTo={navigateTo}
        />


        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          {/* Institutional KPI Overview & Performance Area Chart Hero Banner (Admin Only) */}
          {isAdmin && activeTree !== 'DASHBOARD' && activeTree !== 'ADMIN_USERS' && activeTree !== 'SETTINGS_PASSWORD' && (
            <InstitutionalHeroBanner
              executiveMetrics={liveExecutiveMetrics}
              totalTickersCount={universeTickers.length}
              freeCashAmount={getStoredCapitalState().freeCash}
              theme={theme}
              onOpenExecutiveDigest={() => {
                setActiveTree('OPTIONS');
                setActiveOptionsTab('EXECUTIVE_DIGEST');
              }}
              onOpenSimulator={() => setIsSimulatorModalOpen(true)}
            />
          )}

          {/* Dual Navigation Tree: US Equities Analysis vs Options Engine */}
          {activeTree !== 'DASHBOARD' && activeTree !== 'ADMIN_USERS' && activeTree !== 'SETTINGS_PASSWORD' && (
            <DualMenuTree
              activeTree={activeTree}
              onSelectTree={(tree) => navigateTo(tree, activeOptionsTab, activeEquitiesTab)}
              activeEquitiesTab={activeEquitiesTab}
              onSelectEquitiesTab={handleSelectEquitiesTab}
              activeOptionsTab={activeOptionsTab}
              onSelectOptionsTab={handleSelectOptionsTab}
              totalTickersCount={universeTickers.length}
              weeklyCount={weeklyCadenceCounts.weekly}
              monthlyCount={weeklyCadenceCounts.monthly}
              highIvrCount={highIvrCount}
              earningsAlertCount={earningsAlertCount}
              freeCashAmount={getStoredCapitalState().freeCash}
            />
          )}

          {/* Breadcrumbs & Quick-Jump Navigation Bar */}
          <BreadcrumbsBar
            activeTree={activeTree}
            activeEquitiesTab={activeEquitiesTab}
            activeOptionsTab={activeOptionsTab}
            onNavigateTo={navigateTo}
            onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
            onOpenWatchlist={() => setIsWatchlistModalOpen(true)}
            onOpenReports={() => setIsReportQueryModalOpen(true)}
            onOpenHelp={() => setIsHelpModalOpen(true)}
            onPrint={triggerPrintReport}
          />

          {/* Contextual Screener Toolbar: Rendered strictly on Screening Views */}
          {isScreeningTab && (
            <ScreenerFilterToolbar
              filters={filters}
              setFilters={setFilters}
              universeTickers={universeTickers}
              filteredTickers={filteredTickers}
              filteredOpportunities={filteredOpportunities}
              totalOpportunitiesCount={dataPayload?.opportunities.length || 0}
              watchlistGroups={watchlistGroups}
              activeGroupId={activeGroupId}
              setActiveGroupId={setActiveGroupId}
              showWatchlistOnly={showWatchlistOnly}
              setShowWatchlistOnly={setShowWatchlistOnly}
              onOpenWatchlistModal={() => setIsWatchlistModalOpen(true)}
              onExportCSV={handleExportCSV}
              onExportExcel={handleExportExcel}
              onPrint={triggerPrintReport}
              onResetFilters={handleResetFilters}
              weeklyCadenceCounts={weeklyCadenceCounts}
              activeTree={activeTree}
            />
          )}

          {/* Primary Content View Switcher */}
          <Suspense fallback={<LoadingSkeleton rows={8} className="p-4" />}>
            {activeTree === 'DASHBOARD' ? (
              <UserDashboardView
                onNavigateToScreener={() => navigateTo('EQUITIES', undefined, 'TECHNICAL_SCREENER')}
                onNavigateToCharts={() => navigateTo('EQUITIES', undefined, 'INTERACTIVE_CHARTS')}
                onNavigateToWorkflow={() => navigateTo('WORKFLOW', 'SCHWAB_POSITIONS_UPLOAD')}
                onNavigateToWorkflowStep={(step) => navigateTo('WORKFLOW', step)}
              />
            ) : activeTree === 'ADMIN_USERS' ? (
              isAdmin ? (
                <AdminUsersView onBackToWorkspace={() => navigateTo('DASHBOARD')} />
              ) : !isAuthenticated ? (
                <div className="p-8 max-w-lg mx-auto text-center bg-slate-900 border border-purple-500/30 rounded-2xl shadow-2xl space-y-4 my-12">
                  <div className="w-12 h-12 rounded-xl bg-purple-500/20 border border-purple-500/40 text-purple-300 flex items-center justify-center mx-auto">
                    <Users className="w-6 h-6" />
                  </div>
                  <h2 className="text-lg font-bold text-white">Administrator Access Required</h2>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    The <strong>Multi-Tenant Administration Console</strong> allows the Super-Administrator (<strong>fjmaresca@gmail.com</strong>) to provision new client logins, issue temporary passwords, and control tenant access.
                  </p>
                  <div className="pt-2 flex flex-col sm:flex-row justify-center gap-3">
                    <button
                      onClick={() => navigateTo('LOGIN')}
                      className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-lg text-xs font-bold shadow cursor-pointer transition-all"
                    >
                      Sign In as Admin (fjmaresca@gmail.com)
                    </button>
                    <button
                      onClick={() => navigateTo('WORKFLOW')}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                    >
                      Return to Screener
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-8 max-w-lg mx-auto text-center bg-slate-900 border border-rose-500/40 rounded-2xl shadow-2xl space-y-4 my-12">
                  <h2 className="text-lg font-bold text-rose-400">Admin Permission Required</h2>
                  <p className="text-xs text-slate-300">
                    Your account ({user?.email}) has <strong>CLIENT</strong> privileges. Only the Super-Administrator (<strong>fjmaresca@gmail.com</strong>) can access user provisioning.
                  </p>
                  <button
                    onClick={() => navigateTo('DASHBOARD')}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs cursor-pointer"
                  >
                    Return to Private Workspace
                  </button>
                </div>
              )
            ) : activeTree === 'SETTINGS_PASSWORD' ? (
              <PasswordChangeView onSuccess={() => navigateTo('DASHBOARD')} />
            ) : activeTree === 'METHODOLOGY' ? (
              <MethodologyView
              onNavigateToScreener={() => navigateTo('EQUITIES', undefined, 'TECHNICAL_SCREENER')}
              onNavigateToOptions={() => navigateTo('OPTIONS', 'WEEKLY_POSITION_AUDIT')}
            />
          ) : activeTree === 'FAQ' ? (
            <FaqView
              onNavigateToScreener={() => navigateTo('EQUITIES', undefined, 'TECHNICAL_SCREENER')}
              onNavigateToMethodology={() => navigateTo('METHODOLOGY')}
              onOpenTradier={() => setIsTradierModalOpen(true)}
              onOpenSchwab={() => setIsSchwabModalOpen(true)}
            />
          ) : activeTree === 'DISCLAIMER' ? (
            <DisclaimerView
              onNavigateToScreener={() => navigateTo('EQUITIES', undefined, 'TECHNICAL_SCREENER')}
              onNavigateToMethodology={() => navigateTo('METHODOLOGY')}
            />
          ) : activeTree === 'EQUITIES' ? (
            activeEquitiesTab === 'WEEKLY_STOCK_SCREENERS' ? (
              <WeeklyStockScreenersView
                initialDataset={weeklyScreenersDataset}
                onSelectSymbolForChart={(sym) => {
                  setActiveChartSymbol(sym);
                  setActiveEquitiesTab('INTERACTIVE_CHARTS');
                }}
                onOpenTickerAudit={(sym) => {
                  const target = universeTickers.find((t) => t.symbol === sym) || createFallbackTickerMeta(sym);
                  setSelectedTicker(target);
                }}
                onOpenBrokerStaging={(_sym, _strat) => {
                  setActiveTree('OPTIONS');
                  setActiveOptionsTab('BROKER_STAGING');
                }}
              />
            ) : activeEquitiesTab === 'INTERACTIVE_CHARTS' ? (
              <div className="space-y-4">
                <div className="glass-panel p-2.5 rounded-xl border border-slate-800 flex items-center space-x-2 overflow-x-auto">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider pl-2 pr-1 shrink-0">
                    Select Ticker:
                  </span>
                  {filteredTickers.map((t) => (
                    <button
                      key={t.symbol}
                      onClick={() => setActiveChartSymbol(t.symbol)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all shrink-0 flex items-center space-x-1.5 cursor-pointer ${
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
              <div className="space-y-4">
                <FundamentalHealthTable
                  data={fundamentalHealthData}
                  onSelectTicker={(symbol) => {
                    const fundItem = fundamentalHealthData.find((f) => f.symbol === symbol);
                    const target = universeTickers.find((t) => t.symbol === symbol) || createFallbackTickerMeta(symbol, {
                      name: fundItem?.name || symbol,
                      sector: fundItem?.sector || 'Equities',
                      spot_price: fundItem?.spot_price || 100.0,
                    });
                    setSelectedTicker(target);
                  }}
                />
              </div>
            ) : activeEquitiesTab === 'ECONOMIC_CALENDAR' ? (
              <EconomicCalendarView
                onSelectSymbolForChart={(sym) => {
                  setActiveChartSymbol(sym);
                  setActiveTree('EQUITIES');
                  setActiveEquitiesTab('INTERACTIVE_CHARTS');
                }}
                onOpenTickerAudit={(sym) => {
                  const target = universeTickers.find((t) => t.symbol === sym) || createFallbackTickerMeta(sym);
                  setSelectedTicker(target);
                }}
              />
            ) : (
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
                  sortBy={filters.sortBy as any}
                  sortOrder={filters.sortOrder}
                  onSort={handleSort}
                  onSelectTicker={(ticker) => setSelectedTicker(ticker)}
                />
              </div>
            )
          ) : (
            <div className="space-y-4">
              {activeOptionsTab === 'SCHWAB_POSITIONS_UPLOAD' ? (
                <SchwabPositionsUploadView
                  onNavigateToCashLedger={() => setActiveOptionsTab('WEEKLY_CASH_LEDGER')}
                />
              ) : activeOptionsTab === 'WEEKLY_CASH_LEDGER' ? (
                <WeeklyCashLedgerView
                  onNavigateToHoldings={() => setActiveOptionsTab('HOLDINGS_COVERED_CALLS')}
                  onNavigateToScreener={() => setActiveOptionsTab('CASCADING_SCREENER')}
                />
              ) : activeOptionsTab === 'HOLDINGS_COVERED_CALLS' ? (
                <HoldingsCoveredCallView
                  onStageOrder={handleStageOpportunity}
                  onNavigateToScreener={() => setActiveOptionsTab('CASCADING_SCREENER')}
                />
              ) : activeOptionsTab === 'WEEKLY_EXECUTIVE_REPORT' ? (
                <WeeklyExecutiveReportView
                  onNavigateTab={(tab) => setActiveOptionsTab(tab)}
                />
              ) : activeOptionsTab === 'WEEKLY_POSITION_AUDIT' ? (
                <WeeklyPositionAuditView
                  onNavigateToRollAssistant={(_sym) => {
                    setActiveTree('OPTIONS');
                    setActiveOptionsTab('DEFENSIVE_ROLL_ASSISTANT');
                  }}
                  onNavigateToCoveredCallScreener={(sym) => {
                    setFilters((prev) => ({ ...prev, search: sym, strategy: 'CC' }));
                    setActiveTree('WORKFLOW');
                    setActiveOptionsTab('CASCADING_SCREENER');
                  }}
                  onStageCloseOrder={(pos) => {
                    handleStageOpportunity({
                      id: `CLOSE_${pos.symbol}_${pos.strike}`,
                      symbol: pos.symbol,
                      name: pos.symbol,
                      category: 'PORTFOLIO_CLOSE',
                      sector: 'Portfolio',
                      strategy: pos.type === 'CSP' ? 'CSP' : 'CC',
                      strategy_name: `Buy to Close (${pos.type})`,
                      expiration: new Date(Date.now() + pos.dte * 86400000).toISOString().split('T')[0],
                      dte: pos.dte,
                      current_price: pos.spotPrice,
                      strike: pos.strike,
                      type: pos.type === 'CSP' ? 'put' : 'call',
                      bid: pos.currentOptionPrice * 0.95,
                      ask: pos.currentOptionPrice * 1.05,
                      mid: pos.currentOptionPrice,
                      collateral_required: 0,
                      premium_total: Math.round(pos.currentOptionPrice * 100),
                      breakeven: pos.strike,
                      cushion_pct: 0,
                      roc_pct: 0,
                      annualized_roc: 0,
                      delta: pos.delta,
                      abs_delta: Math.abs(pos.delta),
                      theta: pos.theta,
                      pop_pct: 90,
                      iv: pos.iv,
                      iv_rank: 50,
                      rsi: 50,
                      safety_tier: '80% Profit Close',
                      tier_color: 'emerald',
                      tags: ['PROFIT_TAKE', 'GAMMA_SHIELD'],
                      rating: 99,
                    });
                    setActiveOptionsTab('BROKER_STAGING');
                  }}
                />
              ) : activeOptionsTab === 'CASCADING_SCREENER' ? (
                <CascadingScreenerView
                  tickers={universeTickers}
                  allOpportunities={allUniverseOpportunities}
                  initialWeeklyDataset={weeklyScreenersDataset}
                  onStageOpportunity={handleStageOpportunity}
                  onSelectSymbolForChart={(sym) => {
                    setActiveChartSymbol(sym);
                    setActiveTree('EQUITIES');
                    setActiveEquitiesTab('INTERACTIVE_CHARTS');
                  }}
                  onOpenTickerAudit={(sym) => {
                    const target = universeTickers.find((t) => t.symbol === sym) || createFallbackTickerMeta(sym);
                    setSelectedTicker(target);
                  }}
                  onOpenBrokerStaging={(_sym, _strat) => {
                    setActiveTree('OPTIONS');
                    setActiveOptionsTab('BROKER_STAGING');
                  }}
                />
              ) : activeOptionsTab === 'WEEKLY_STOCK_SCREENERS' ? (
                <WeeklyStockScreenersView
                  initialDataset={weeklyScreenersDataset}
                  onSelectSymbolForChart={(sym) => {
                    setActiveChartSymbol(sym);
                    setActiveTree('EQUITIES');
                    setActiveEquitiesTab('INTERACTIVE_CHARTS');
                  }}
                  onOpenTickerAudit={(sym) => {
                    const target = universeTickers.find((t) => t.symbol === sym) || createFallbackTickerMeta(sym);
                    setSelectedTicker(target);
                  }}
                  onOpenBrokerStaging={(_sym, _strat) => {
                    setActiveOptionsTab('BROKER_STAGING');
                  }}
                />
              ) : activeOptionsTab === 'AI_OPTIONS_INCOME' ? (
                <OptionsIncomeAnalyzer
                  onSelectSymbolForChart={(sym) => {
                    setActiveChartSymbol(sym);
                    setActiveTree('EQUITIES');
                    setActiveEquitiesTab('INTERACTIVE_CHARTS');
                  }}
                  onOpenTickerAudit={(sym) => {
                    const target = universeTickers.find((t) => t.symbol === sym) || createFallbackTickerMeta(sym);
                    setSelectedTicker(target);
                  }}
                />
              ) : activeOptionsTab === 'ECONOMIC_CALENDAR' ? (
                <EconomicCalendarView
                  onSelectSymbolForChart={(sym) => {
                    setActiveChartSymbol(sym);
                    setActiveTree('EQUITIES');
                    setActiveEquitiesTab('INTERACTIVE_CHARTS');
                  }}
                  onOpenTickerAudit={(sym) => {
                    const target = universeTickers.find((t) => t.symbol === sym) || createFallbackTickerMeta(sym);
                    setSelectedTicker(target);
                  }}
                />
              ) : activeOptionsTab === 'MULTI_LEG_SPREADS' ? (
                <MultiLegSpreadTable
                  spreads={multiLegSpreads}
                  onStageSpreadOrder={handleStageSpread}
                />
              ) : activeOptionsTab === 'OPTION_CHAIN_MATRIX' ? (
                <OptionChainMatrixView
                  tickers={universeTickers}
                  onStageCustomOrder={handleStageContractFromChain}
                  onCalculateIncome={(c, s) => handleStageContractFromChain(c, s)}
                />
              ) : activeOptionsTab === 'PMCC_SCREENER' ? (
                <PmccScreenerView
                  tickers={universeTickers}
                  onStagePmcc={handleStageSpread}
                />
              ) : activeOptionsTab === 'PORTFOLIO_MARGIN_SIM' ? (
                <PortfolioMarginSimulatorView />
              ) : activeOptionsTab === 'MULTI_AGENT_AUDIT' ? (
                <MultiAgentTradeAuditorView
                  tickers={universeTickers}
                  onStageStructuredOpportunity={handleStageOpportunity}
                />
              ) : activeOptionsTab === 'DEFENSIVE_ROLL_ASSISTANT' ? (
                <DefensiveRollAssistantView
                  onStageRollOrder={handleStageSpread}
                />
              ) : activeOptionsTab === 'TAX_ALPHA_OPTIMIZER' ? (
                <TaxAlphaOptimizerView />
              ) : activeOptionsTab === 'EXECUTIVE_DIGEST' ? (
                <ExecutivePortfolioDigestView />
              ) : activeOptionsTab === 'VOLATILITY_SKEW' ? (
                <VolatilitySkewRadar skewData={volatilitySkewData} />
              ) : activeOptionsTab === 'BACKTEST_MARGIN' ? (
                <OptionsBacktestView availableSymbols={universeTickers.map((t) => t.symbol)} />
              ) : activeOptionsTab === 'BROKER_STAGING' ? (
                <BrokerStagingWorkbench
                  opportunities={filteredOpportunities}
                  spreads={multiLegSpreads}
                  onStageOpportunity={handleStageOpportunity}
                  onStageSpread={handleStageSpread}
                  onOpenSchwabSettings={() => setIsSchwabModalOpen(true)}
                />
              ) : (
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
                    sortBy={filters.sortBy as keyof OptionOpportunity}
                    sortOrder={filters.sortOrder}
                    onSort={handleSort}
                    onSelectOpportunity={(opp) => openOptionDetail(opp)}
                    onOpenCalculator={(opp) => setCalculatorOpportunity(opp)}
                    onStageOrder={handleStageOpportunity}
                    onOpenSimulator={(opp) => {
                      const dist50 = opp.current_price > 0 && opp.strike > 0
                        ? ((opp.strike - opp.current_price) / opp.current_price) * 100
                        : -5.1;
                      const isMcSource = opp.tags?.some((t) => t.includes('CHAMELEON') || t.includes('MC_')) || false;
                      setSimulatorInitialData({
                        ticker: opp.symbol,
                        expiration: opp.expiration,
                        ivRank: opp.iv_rank || 48,
                        delta: Math.abs(opp.delta || 0.18),
                        distTo50Sma: dist50,
                        strategy: opp.strategy === 'CSP' ? 'CASH_SECURED_PUT' : 'COVERED_CALL',
                        dataSource: isMcSource ? 'MARKETCHAMELEON' : 'BARCHART',
                      });
                      setIsSimulatorModalOpen(true);
                    }}
                  />
                </div>
              )}
            </div>
          )}
        </Suspense>
      </main>

      {/* 1. Global Command Palette (Ctrl+K) */}
      <CommandPalette
          isOpen={modalState.isCommandPaletteOpen}
          onClose={() => setIsCommandPaletteOpen(false)}
          tickers={universeTickers}
          onSelectTicker={(t) => setSelectedTicker(t)}
          onNavigateTree={(tree, tab) => {
            if (tree === 'WORKFLOW') {
              navigateTo('WORKFLOW', (tab as OptionsTabType) || 'SCHWAB_POSITIONS_UPLOAD');
            } else {
              setActiveTree(tree);
              if (tree === 'EQUITIES' && tab) setActiveEquitiesTab(tab as EquitiesTabType);
              if (tree === 'OPTIONS' && tab) setActiveOptionsTab(tab as OptionsTabType);
            }
          }}
          onOpenHelp={() => setIsHelpModalOpen(true)}
          onOpenWatchlist={() => setIsWatchlistModalOpen(true)}
          onOpenReports={() => setIsReportQueryModalOpen(true)}
          onOpenTradier={() => setIsTradierModalOpen(true)}
          onOpenSchwab={() => setIsSchwabModalOpen(true)}
          onOpenDiagnostics={() => setIsDiagnosticsOpen(true)}
          onOpenSimulator={() => setIsSimulatorModalOpen(true)}
          onOpenValuation={(t) => openValuation(t || 'NVDA')}
          onExportCSV={handleExportCSV}
          onExportExcel={handleExportExcel}
          onTriggerPrint={triggerPrintReport}
        />

      {/* Centralized Modals Container */}
      <AppModalsContainer
        modalState={modalState}
        setIsHelpModalOpen={setIsHelpModalOpen}
        setIsTradierModalOpen={setIsTradierModalOpen}
        setIsSchwabModalOpen={setIsSchwabModalOpen}
        setIsDiagnosticsOpen={setIsDiagnosticsOpen}
        setIsWatchlistModalOpen={setIsWatchlistModalOpen}
        setIsReportQueryModalOpen={setIsReportQueryModalOpen}
        setIsAlertsModalOpen={setIsAlertsModalOpen}
        setIsSimulatorModalOpen={setIsSimulatorModalOpen}
        setIsStagedModalOpen={setIsStagedModalOpen}
        setIsCommandPaletteOpen={setIsCommandPaletteOpen}
        setSelectedTicker={setSelectedTicker}
        setSelectedOpportunity={setSelectedOpportunity}
        setCalculatorOpportunity={setCalculatorOpportunity}
        navigateTo={navigateTo}
        openValuation={openValuation}
        closeValuation={closeValuation}
        setActiveTree={setActiveTree}
        setActiveEquitiesTab={setActiveEquitiesTab}
        handleStageOpportunity={handleStageOpportunity}
        handleUpdateStagedQuantity={handleUpdateStagedQuantity}
        handleUpdateStagedAccountType={handleUpdateStagedAccountType}
        handleUpdateStagedPricingType={handleUpdateStagedPricingType}
        watchlistGroups={watchlistGroups}
        activeGroupId={activeGroupId}
        setActiveGroupId={setActiveGroupId}
        handleCreateWatchlist={handleCreateWatchlist}
        handleRenameWatchlist={handleRenameWatchlist}
        handleDeleteWatchlist={handleDeleteWatchlist}
        handleUpdateGroupTickers={handleUpdateGroupTickers}
        universeTickers={universeTickers}
        allUniverseOpportunities={allUniverseOpportunities}
        handleAddCustomTickerMeta={handleAddCustomTickerMeta}
        handleLiveRecalculate={handleLiveRecalculate}
        isRecalculating={isRecalculating}
        summary={dataPayload?.summary || null}
      />


      {/* Comprehensive Footer with SEO & Crawler-Friendly Internal Hyperlinks */}
      <InstitutionalFooter
        navigateTo={navigateTo}
        setIsSimulatorModalOpen={setIsSimulatorModalOpen}
        openValuation={openValuation}
        setIsDiagnosticsOpen={setIsDiagnosticsOpen}
        setIsTradierModalOpen={setIsTradierModalOpen}
      />
      </div>

      {/* Floating Back to Top Button */}
      <ScrollToTopButton />
    </div>
  );
};
