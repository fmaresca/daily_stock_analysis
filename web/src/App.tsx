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

// Custom Hooks
import { useAppNavigation } from './hooks/useAppNavigation';
import { useWatchlistState } from './hooks/useWatchlistState';
import { useModalManager } from './hooks/useModalManager';
import { useGlobalShortcuts } from './hooks/useGlobalShortcuts';
import { useOptionsData } from './hooks/useOptionsData';

// Code-split heavy modals (loaded on-demand when triggered by user)
const HelpHandbookModal = lazy(() => import('./components/HelpHandbookModal').then(m => ({ default: m.HelpHandbookModal })));
const WatchlistManagerModal = lazy(() => import('./components/WatchlistManagerModal').then(m => ({ default: m.WatchlistManagerModal })));
const ReportQueryModal = lazy(() => import('./components/ReportQueryModal').then(m => ({ default: m.ReportQueryModal })));
const TickerAuditModal = lazy(() => import('./components/TickerAuditModal').then(m => ({ default: m.TickerAuditModal })));
const OptionDetailModal = lazy(() => import('./components/OptionDetailModal').then(m => ({ default: m.OptionDetailModal })));
const IncomeCalculatorModal = lazy(() => import('./components/IncomeCalculatorModal').then(m => ({ default: m.IncomeCalculatorModal })));
const SchwabSettingsModal = lazy(() => import('./components/SchwabSettingsModal').then(m => ({ default: m.SchwabSettingsModal })));
const TradierSettingsModal = lazy(() => import('./components/TradierSettingsModal').then(m => ({ default: m.TradierSettingsModal })));
const ApiDiagnosticsModal = lazy(() => import('./components/ApiDiagnosticsModal').then(m => ({ default: m.ApiDiagnosticsModal })));
const BrokerOrderStagingModal = lazy(() => import('./components/BrokerOrderStagingModal').then(m => ({ default: m.BrokerOrderStagingModal })));
const AlertSettingsModal = lazy(() => import('./components/AlertSettingsModal').then(m => ({ default: m.AlertSettingsModal })));
const OptionsTradeQualityModal = lazy(() => import('./components/screener/OptionsTradeQualityModal').then(m => ({ default: m.OptionsTradeQualityModal })));
const FundamentalValuationModal = lazy(() => import('./components/FundamentalValuationModal').then(m => ({ default: m.FundamentalValuationModal })));

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

// Types & Utilities
import { PortfolioPosition } from './utils/portfolioStressTest';
import { getStoredCapitalState } from './utils/capitalAndTaxLedger';
import { WeeklyScreenerDataset } from './types/weeklyScreeners';
import { startContinuousRiskSweeper, stopContinuousRiskSweeper } from './utils/continuousRiskSweeper';
import { OptionContractData } from './utils/optionChainMatrix';
import { calculateLiveExecutiveMetrics } from './utils/executiveReportGenerator';
import {
  stageSingleLegOrder,
  stageMultiLegSpreadOrder,
  AccountType,
  PriceExecutionType,
} from './utils/brokerOrderStaging';
import { generateMultiLegSpreads, generateVolatilitySkew } from './utils/optionsMultiLeg';
import { generateFundamentalHealthData } from './utils/fundamentalSolvency';
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

  const executiveMetrics = useMemo(() => {
    return calculateLiveExecutiveMetrics();
  }, [portfolioRefreshKey]);

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

  // Order Staging Handlers
  const handleStageOpportunity = (opp: OptionOpportunity) => {
    const meta = universeTickers.find((t) => t.symbol === opp.symbol);
    const staged = stageSingleLegOrder(opp, meta, 1, 'SCHWAB', 'REG_T_MARGIN', 'MIDPOINT');
    openStagedModal(staged, opp, null);
  };

  const handleStageSpread = (spread: MultiLegSpread) => {
    const order = stageMultiLegSpreadOrder(spread, 1, 'SCHWAB', 'REG_T_MARGIN', 'MIDPOINT');
    openStagedModal(order, null, spread);
  };

  const handleStageContractFromChain = (contract: OptionContractData, spotPrice: number) => {
    const isPut = contract.type === 'PUT';
    const opp: OptionOpportunity = {
      id: `CHAIN_${contract.underlyingSymbol}_${contract.strike}_${contract.type}`,
      symbol: contract.underlyingSymbol,
      name: contract.underlyingSymbol,
      category: 'Equities',
      sector: 'Technology',
      liquidity_tier: 'Tier 1',
      strategy: isPut ? 'CSP' : 'COVERED_CALL',
      strategy_name: isPut ? 'Cash-Secured Put' : 'Covered Call',
      expiration: contract.expiration,
      dte: contract.dte,
      current_price: spotPrice,
      strike: contract.strike,
      type: isPut ? 'put' : 'call',
      bid: contract.bid,
      ask: contract.ask,
      mid: contract.mid,
      collateral_required: isPut ? contract.strike * 100 : spotPrice * 100,
      premium_total: Math.round(contract.mid * 100),
      breakeven: isPut ? contract.strike - contract.mid : spotPrice - contract.mid,
      cushion_pct: isPut ? Math.round(((spotPrice - contract.strike) / spotPrice) * 1000) / 10 : 0,
      roc_pct: Math.round((contract.mid / (isPut ? contract.strike : spotPrice)) * 1000) / 10,
      annualized_roc: Math.round((contract.mid / (isPut ? contract.strike : spotPrice)) * (365 / Math.max(1, contract.dte)) * 1000) / 10,
      delta: contract.delta,
      abs_delta: Math.abs(contract.delta),
      theta: contract.theta,
      pop_pct: Math.round((1 - Math.abs(contract.delta)) * 1000) / 10,
      iv: contract.iv,
      iv_rank: 35,
      rsi: 50,
      safety_tier: 'Option Chain Contract',
      tier_color: 'cyan',
      tags: ['OPTION_CHAIN', contract.type],
      rating: 85,
    };
    handleStageOpportunity(opp);
  };

  const handleUpdateStagedQuantity = (qty: number) => {
    if (modalState.activeStagedOpportunity) {
      const meta = universeTickers.find((t) => t.symbol === modalState.activeStagedOpportunity?.symbol);
      const updated = stageSingleLegOrder(
        modalState.activeStagedOpportunity,
        meta,
        qty,
        modalState.stagedOrder?.broker || 'SCHWAB',
        modalState.stagedOrder?.accountType || 'REG_T_MARGIN',
        modalState.stagedOrder?.pricingType || 'MIDPOINT'
      );
      setStagedOrder(updated);
    } else if (modalState.activeStagedSpread) {
      const updated = stageMultiLegSpreadOrder(
        modalState.activeStagedSpread,
        qty,
        modalState.stagedOrder?.broker || 'SCHWAB',
        modalState.stagedOrder?.accountType || 'REG_T_MARGIN',
        modalState.stagedOrder?.pricingType || 'MIDPOINT'
      );
      setStagedOrder(updated);
    }
  };

  const handleUpdateStagedAccountType = (acc: AccountType) => {
    if (modalState.activeStagedOpportunity) {
      const meta = universeTickers.find((t) => t.symbol === modalState.activeStagedOpportunity?.symbol);
      const updated = stageSingleLegOrder(
        modalState.activeStagedOpportunity,
        meta,
        modalState.stagedOrder?.quantity || 1,
        modalState.stagedOrder?.broker || 'SCHWAB',
        acc,
        modalState.stagedOrder?.pricingType || 'MIDPOINT'
      );
      setStagedOrder(updated);
    } else if (modalState.activeStagedSpread) {
      const updated = stageMultiLegSpreadOrder(
        modalState.activeStagedSpread,
        modalState.stagedOrder?.quantity || 1,
        modalState.stagedOrder?.broker || 'SCHWAB',
        acc,
        modalState.stagedOrder?.pricingType || 'MIDPOINT'
      );
      setStagedOrder(updated);
    }
  };

  const handleUpdateStagedPricingType = (pricing: PriceExecutionType) => {
    if (modalState.activeStagedOpportunity) {
      const meta = universeTickers.find((t) => t.symbol === modalState.activeStagedOpportunity?.symbol);
      const updated = stageSingleLegOrder(
        modalState.activeStagedOpportunity,
        meta,
        modalState.stagedOrder?.quantity || 1,
        modalState.stagedOrder?.broker || 'SCHWAB',
        modalState.stagedOrder?.accountType || 'REG_T_MARGIN',
        pricing
      );
      setStagedOrder(updated);
    } else if (modalState.activeStagedSpread) {
      const updated = stageMultiLegSpreadOrder(
        modalState.activeStagedSpread,
        modalState.stagedOrder?.quantity || 1,
        modalState.stagedOrder?.broker || 'SCHWAB',
        modalState.stagedOrder?.accountType || 'REG_T_MARGIN',
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
      if (showWatchlistOnly && !currentWatchlistSymbols.includes(t.symbol)) {
        return false;
      }

      if (filters.search) {
        const q = filters.search.toLowerCase();
        const matchesSymbol = t.symbol.toLowerCase().includes(q);
        const matchesName = t.name.toLowerCase().includes(q);
        const matchesSector = t.sector.toLowerCase().includes(q);
        if (!matchesSymbol && !matchesName && !matchesSector) return false;
      }

      if (filters.onlyHighIvr && t.iv_rank < 45) return false;
      if (filters.onlyOversold && (t.rsi_14 ?? 50) >= 35) return false;
      if (filters.onlyNearSupport && t.spot_price > (t.lower_bb ?? 0) * 1.02) return false;
      if (filters.onlyEarningsAlert && !t.earnings_within_7d) return false;

      if (filters.weeklyCadence === 'WEEKLY_ONLY' && t.has_weeklys === false) return false;
      if (filters.weeklyCadence === 'MONTHLY_ONLY' && t.has_weeklys !== false) return false;

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
  ]);

  // Filtered Opportunities (for Tree 2 Options Screener)
  const filteredOpportunities = useMemo(() => {
    return allUniverseOpportunities.filter((o) => {
      if (showWatchlistOnly && !currentWatchlistSymbols.includes(o.symbol)) {
        return false;
      }

      if (filters.strategy && filters.strategy !== 'ALL') {
        if (o.strategy !== filters.strategy) return false;
      }

      if (filters.search) {
        const q = filters.search.toLowerCase();
        if (!o.symbol.toLowerCase().includes(q) && !o.name.toLowerCase().includes(q)) {
          return false;
        }
      }

      if (filters.weeklyCadence === 'WEEKLY_ONLY') {
        const tMeta = universeTickers.find((t) => t.symbol === o.symbol);
        if (tMeta && tMeta.has_weeklys === false) return false;
      }
      if (filters.weeklyCadence === 'MONTHLY_ONLY') {
        const tMeta = universeTickers.find((t) => t.symbol === o.symbol);
        if (tMeta && tMeta.has_weeklys !== false) return false;
      }

      if (filters.onlyHighIvr && o.iv_rank < 45) return false;
      if (filters.onlyEarningsAlert && !o.earnings_within_7d) return false;

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
    universeTickers,
  ]);

  // Synthesized Multi-Leg Spreads
  const multiLegSpreads = useMemo(() => {
    return generateMultiLegSpreads(filteredTickers, allUniverseOpportunities);
  }, [filteredTickers, allUniverseOpportunities]);

  const volatilitySkewData = useMemo(() => {
    return generateVolatilitySkew(filteredTickers);
  }, [filteredTickers]);

  const fundamentalHealthData = useMemo(() => {
    return generateFundamentalHealthData(filteredTickers);
  }, [filteredTickers]);

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
        />

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          {/* Institutional KPI Overview & Performance Area Chart Hero Banner */}
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

          {/* Dual Navigation Tree: US Equities Analysis vs Options Engine */}
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
          {activeTree === 'METHODOLOGY' ? (
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
                  sortBy={filters.sortBy}
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
                    sortBy={filters.sortBy}
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

      {/* Modals Suite (Lazy Loaded on demand) */}
      <Suspense fallback={null}>
        {/* 1. Global Command Palette (Ctrl+K) */}
        <CommandPalette
          isOpen={modalState.isCommandPaletteOpen}
          onClose={() => setIsCommandPaletteOpen(false)}
          tickers={universeTickers}
          onSelectTicker={(t) => setSelectedTicker(t)}
          onNavigateTree={(tree, tab) => {
            setActiveTree(tree);
            if (tree === 'EQUITIES' && tab) setActiveEquitiesTab(tab as EquitiesTabType);
            if (tree === 'OPTIONS' && tab) setActiveOptionsTab(tab as OptionsTabType);
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

        {/* 2. Strategy & Help Handbook (?) */}
        <HelpHandbookModal
          isOpen={modalState.isHelpModalOpen}
          onClose={() => setIsHelpModalOpen(false)}
          onNavigate={(tree, optTab, eqTab) => {
            setIsHelpModalOpen(false);
            navigateTo(tree, optTab, eqTab);
          }}
          onOpenSimulator={() => {
            setIsHelpModalOpen(false);
            setIsSimulatorModalOpen(true);
          }}
          onOpenValuation={(t) => {
            setIsHelpModalOpen(false);
            openValuation(t || 'NVDA');
          }}
          onOpenTradier={() => {
            setIsHelpModalOpen(false);
            setIsTradierModalOpen(true);
          }}
          onOpenSchwab={() => {
            setIsHelpModalOpen(false);
            setIsSchwabModalOpen(true);
          }}
          onOpenDiagnostics={() => {
            setIsHelpModalOpen(false);
            setIsDiagnosticsOpen(true);
          }}
          onOpenReports={() => {
            setIsHelpModalOpen(false);
            setIsReportQueryModalOpen(true);
          }}
          onOpenWatchlists={() => {
            setIsHelpModalOpen(false);
            setIsWatchlistModalOpen(true);
          }}
          onOpenAlerts={() => {
            setIsHelpModalOpen(false);
            setIsAlertsModalOpen(true);
          }}
          onOpenCommandPalette={() => {
            setIsHelpModalOpen(false);
            setIsCommandPaletteOpen(true);
          }}
        />

        {/* 3. Tradier API Settings Modal (Primary) */}
        <TradierSettingsModal
          isOpen={modalState.isTradierModalOpen}
          onClose={() => setIsTradierModalOpen(false)}
          onOpenSchwabSettings={() => {
            setIsTradierModalOpen(false);
            setIsSchwabModalOpen(true);
          }}
        />

        {/* 3.1. Charles Schwab Retail Trader API Provisioning Modal (Fallback) */}
        <SchwabSettingsModal
          isOpen={modalState.isSchwabModalOpen}
          onClose={() => setIsSchwabModalOpen(false)}
        />

        {/* 3.2. API Health & Automated Diagnostics Suite Modal */}
        {modalState.isDiagnosticsOpen && (
          <ErrorBoundary fallbackTitle="API Diagnostics Suite Recovered" onReset={() => setIsDiagnosticsOpen(false)}>
            <ApiDiagnosticsModal
              isOpen={modalState.isDiagnosticsOpen}
              onClose={() => setIsDiagnosticsOpen(false)}
              onOpenTradierSettings={() => {
                setIsDiagnosticsOpen(false);
                setIsTradierModalOpen(true);
              }}
              onOpenSchwabSettings={() => {
                setIsDiagnosticsOpen(false);
                setIsSchwabModalOpen(true);
              }}
            />
          </ErrorBoundary>
        )}

        {/* 4. Multi-Watchlist Manager with Bulk & CSV/Excel Ingestion (W) */}
        <WatchlistManagerModal
          isOpen={modalState.isWatchlistModalOpen}
          onClose={() => setIsWatchlistModalOpen(false)}
          watchlistGroups={watchlistGroups}
          activeGroupId={activeGroupId}
          onSelectGroup={(id) => setActiveGroupId(id)}
          onCreateGroup={handleCreateWatchlist}
          onRenameGroup={handleRenameWatchlist}
          onDeleteGroup={handleDeleteWatchlist}
          onUpdateGroupTickers={handleUpdateGroupTickers}
          availableUniverse={universeTickers}
          onAddCustomTickerMeta={handleAddCustomTickerMeta}
          onRecalculateTickers={handleLiveRecalculate}
          isRecalculating={isRecalculating}
        />

        {/* 5. Report Queries & Multi-Format Exports (R) */}
        {modalState.isReportQueryModalOpen && (
          <ErrorBoundary fallbackTitle="Report Queries & Export View Recovered" onReset={() => setIsReportQueryModalOpen(false)}>
            <ReportQueryModal
              isOpen={modalState.isReportQueryModalOpen}
              onClose={() => setIsReportQueryModalOpen(false)}
              tickers={universeTickers}
              opportunities={allUniverseOpportunities}
              summary={dataPayload?.summary || null}
            />
          </ErrorBoundary>
        )}

        {/* 5. Ticker Detail 5-Part Audit Modal */}
        {modalState.selectedTicker && (
          <ErrorBoundary fallbackTitle="Ticker Detail View Recovered" onReset={() => setSelectedTicker(null)}>
            <TickerAuditModal
              ticker={modalState.selectedTicker}
              opportunities={allUniverseOpportunities}
              onClose={() => setSelectedTicker(null)}
            />
          </ErrorBoundary>
        )}

        {/* 6. Option Opportunity Detail Modal */}
        {modalState.selectedOpportunity && (
          <ErrorBoundary fallbackTitle="Option Details Recovered" onReset={() => setSelectedOpportunity(null)}>
            <OptionDetailModal
              opportunity={modalState.selectedOpportunity}
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
        {modalState.calculatorOpportunity && (
          <ErrorBoundary fallbackTitle="Income Calculator Recovered" onReset={() => setCalculatorOpportunity(null)}>
            <IncomeCalculatorModal
              opportunity={modalState.calculatorOpportunity}
              onClose={() => setCalculatorOpportunity(null)}
            />
          </ErrorBoundary>
        )}

        {/* 8. Broker Order Staging & 1-Click Execution Payloads Modal */}
        {modalState.isStagedModalOpen && modalState.stagedOrder && (
          <ErrorBoundary fallbackTitle="Broker Staging Recovered" onReset={() => setIsStagedModalOpen(false)}>
            <BrokerOrderStagingModal
              isOpen={modalState.isStagedModalOpen}
              onClose={() => setIsStagedModalOpen(false)}
              stagedOrder={modalState.stagedOrder}
              onQuantityChange={handleUpdateStagedQuantity}
              onAccountTypeChange={handleUpdateStagedAccountType}
              onPricingTypeChange={handleUpdateStagedPricingType}
            />
          </ErrorBoundary>
        )}

        {/* 9. Real-Time Alert Engine & Webhooks Modal */}
        {modalState.isAlertsModalOpen && (
          <AlertSettingsModal
            isOpen={modalState.isAlertsModalOpen}
            onClose={() => setIsAlertsModalOpen(false)}
            tickers={universeTickers}
            opportunities={allUniverseOpportunities}
          />
        )}

        {/* 10. Quantitative Options Trade Quality Simulator Modal */}
        {modalState.isSimulatorModalOpen && (
          <OptionsTradeQualityModal
            isOpen={modalState.isSimulatorModalOpen}
            onClose={() => setIsSimulatorModalOpen(false)}
            initialTicker={modalState.simulatorInitialData.ticker || ''}
            initialExpiration={modalState.simulatorInitialData.expiration || ''}
            initialIvRank={modalState.simulatorInitialData.ivRank || 48}
            initialDelta={modalState.simulatorInitialData.delta || 0.18}
            initialDistTo50Sma={modalState.simulatorInitialData.distTo50Sma || -5.1}
            initialStrategy={modalState.simulatorInitialData.strategy || 'CASH_SECURED_PUT'}
            initialDataSource={modalState.simulatorInitialData.dataSource || 'BARCHART'}
          />
        )}

        {/* 11. DCF Intrinsic Valuation & DuPont Structural Terminal (v3.4) */}
        {modalState.isValuationModalOpen && (
          <ErrorBoundary fallbackTitle="DCF Valuation Terminal Recovered" onReset={() => closeValuation()}>
            <FundamentalValuationModal
              isOpen={modalState.isValuationModalOpen}
              onClose={closeValuation}
              initialTicker={modalState.valuationInitialTicker || 'NVDA'}
              onNavigateToEquities={() => {
                closeValuation();
                setActiveTree('EQUITIES');
                setActiveEquitiesTab('FUNDAMENTAL_HEALTH');
              }}
            />
          </ErrorBoundary>
        )}
      </Suspense>

      {/* Comprehensive Footer with SEO & Crawler-Friendly Internal Hyperlinks */}
      <footer className="border-t border-slate-800/80 bg-slate-950/95 py-10 mt-14 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-left">
            {/* Column 1: Brand & Overview */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold">
                  Δ
                </div>
                <span className="font-bold text-white tracking-tight text-sm">DeltaHarvest Institutional</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Systematic US equities quantitative analysis, conservative options cash flow harvesting, and institutional risk management.
              </p>
              <div className="text-[10px] font-mono text-emerald-400">
                Tradier API Primary • Schwab Retail Fallback
              </div>
            </div>

            {/* Column 2: Core Workflows */}
            <div className="space-y-2">
              <div className="text-xs font-mono uppercase tracking-wider text-white font-bold">Core Engines</div>
              <ul className="space-y-1.5 text-[11px]">
                <li>
                  <a
                    href="/workflow"
                    onClick={(e) => { e.preventDefault(); navigateTo('WORKFLOW', 'WEEKLY_CASH_LEDGER'); }}
                    className="hover:text-emerald-400 transition-colors"
                  >
                    End-of-Week Workflow
                  </a>
                </li>
                <li>
                  <a
                    href="/equities"
                    onClick={(e) => { e.preventDefault(); navigateTo('EQUITIES', undefined, 'TECHNICAL_SCREENER'); }}
                    className="hover:text-emerald-400 transition-colors"
                  >
                    Equities Technical Screener
                  </a>
                </li>
                <li>
                  <a
                    href="/options"
                    onClick={(e) => { e.preventDefault(); navigateTo('OPTIONS', 'WEEKLY_POSITION_AUDIT'); }}
                    className="hover:text-emerald-400 transition-colors"
                  >
                    Weekly Options &amp; Position Audit
                  </a>
                </li>
                <li>
                  <a
                    href="/spreads"
                    onClick={(e) => { e.preventDefault(); navigateTo('OPTIONS', 'MULTI_LEG_SPREADS'); }}
                    className="hover:text-emerald-400 transition-colors"
                  >
                    Multi-Leg Spreads Analyzer
                  </a>
                </li>
              </ul>
            </div>

            {/* Column 3: Quantitative Tools */}
            <div className="space-y-2">
              <div className="text-xs font-mono uppercase tracking-wider text-white font-bold">Risk &amp; Margin</div>
              <ul className="space-y-1.5 text-[11px]">
                <li>
                  <a
                    href="/margin"
                    onClick={(e) => { e.preventDefault(); navigateTo('OPTIONS', 'PORTFOLIO_MARGIN_SIM'); }}
                    className="hover:text-emerald-400 transition-colors"
                  >
                    Portfolio Margin (TIMS) Simulator
                  </a>
                </li>
                <li>
                  <a
                    href="/calendar"
                    onClick={(e) => { e.preventDefault(); navigateTo('OPTIONS', 'ECONOMIC_CALENDAR'); }}
                    className="hover:text-emerald-400 transition-colors"
                  >
                    Economic &amp; Earnings Calendar
                  </a>
                </li>
                <li>
                  <button
                    onClick={() => setIsSimulatorModalOpen(true)}
                    className="hover:text-emerald-400 transition-colors text-left cursor-pointer"
                  >
                    Trade Quality Scoring Simulator
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => openValuation('NVDA')}
                    className="hover:text-teal-400 text-teal-300 font-medium transition-colors text-left cursor-pointer"
                  >
                    DCF Intrinsic Valuation &amp; DuPont (v3.4)
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setIsDiagnosticsOpen(true)}
                    className="hover:text-emerald-400 transition-colors text-left cursor-pointer"
                  >
                    API Diagnostics &amp; System Health
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 4: Institutional Documentation & Disclosures */}
            <div className="space-y-2">
              <div className="text-xs font-mono uppercase tracking-wider text-white font-bold">Governance &amp; Research</div>
              <ul className="space-y-1.5 text-[11px]">
                <li>
                  <a
                    href="/methodology"
                    onClick={(e) => { e.preventDefault(); navigateTo('METHODOLOGY'); }}
                    className="hover:text-teal-400 font-medium transition-colors"
                  >
                    Quantitative Methodology (2.0 SD Rule)
                  </a>
                </li>
                <li>
                  <a
                    href="/faq"
                    onClick={(e) => { e.preventDefault(); navigateTo('FAQ'); }}
                    className="hover:text-cyan-400 font-medium transition-colors"
                  >
                    Investor FAQ &amp; Handbook
                  </a>
                </li>
                <li>
                  <a
                    href="/disclaimer"
                    onClick={(e) => { e.preventDefault(); navigateTo('DISCLAIMER'); }}
                    className="hover:text-rose-400 font-medium transition-colors"
                  >
                    Regulatory Disclaimers &amp; OCC Risks
                  </a>
                </li>
                <li>
                  <button
                    onClick={() => setIsTradierModalOpen(true)}
                    className="text-emerald-400 hover:text-emerald-300 transition-colors text-left cursor-pointer"
                  >
                    Tradier API Settings (Primary)
                  </button>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500">
            <p>
              &copy; {new Date().getFullYear()} DeltaHarvest Institutional. Quantitative Equity Analysis &amp; Options Income.
            </p>
            <p>
              Rules: Cash-Secured Put strikes &le; Lower Bollinger Band (2 SD); Covered Call strikes &ge; Upper Bollinger Band (2 SD); 80% Buy-to-Close rule; 0.50 Delta Roll trigger.
            </p>
          </div>
        </div>
      </footer>
      </div>

      {/* Floating Back to Top Button */}
      <ScrollToTopButton />
    </div>
  );
};
