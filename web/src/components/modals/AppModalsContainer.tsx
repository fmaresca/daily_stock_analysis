import React, { lazy, Suspense } from 'react';
import { ErrorBoundary } from '../ErrorBoundary';
import {
  TickerMeta,
  OptionOpportunity,
  WatchlistGroup,
  ScreenerSummary,
  MenuTreeType,
  OptionsTabType,
  EquitiesTabType,
} from '../../types/options';
import { OptionStrategyType } from '../../types/optionsScreener.types';
import { StagedBracketOrder, AccountType, PriceExecutionType } from '../../utils/brokerOrderStaging';

import { lazyWithRetry } from '../../utils/lazyWithRetry';

// Lazy loaded modals with auto-recovery on deployment chunk invalidation
const HelpHandbookModal = lazyWithRetry(() => import('../HelpHandbookModal').then(m => ({ default: m.HelpHandbookModal })), 'HelpHandbookModal');
const WatchlistManagerModal = lazyWithRetry(() => import('../WatchlistManagerModal').then(m => ({ default: m.WatchlistManagerModal })), 'WatchlistManagerModal');
const ReportQueryModal = lazyWithRetry(() => import('../ReportQueryModal').then(m => ({ default: m.ReportQueryModal })), 'ReportQueryModal');
const TickerAuditModal = lazyWithRetry(() => import('../TickerAuditModal').then(m => ({ default: m.TickerAuditModal })), 'TickerAuditModal');
const OptionDetailModal = lazyWithRetry(() => import('../OptionDetailModal').then(m => ({ default: m.OptionDetailModal })), 'OptionDetailModal');
const IncomeCalculatorModal = lazyWithRetry(() => import('../IncomeCalculatorModal').then(m => ({ default: m.IncomeCalculatorModal })), 'IncomeCalculatorModal');
const SchwabSettingsModal = lazyWithRetry(() => import('../SchwabSettingsModal').then(m => ({ default: m.SchwabSettingsModal })), 'SchwabSettingsModal');
const TradierSettingsModal = lazyWithRetry(() => import('../TradierSettingsModal').then(m => ({ default: m.TradierSettingsModal })), 'TradierSettingsModal');
const ApiDiagnosticsModal = lazyWithRetry(() => import('../ApiDiagnosticsModal').then(m => ({ default: m.ApiDiagnosticsModal })), 'ApiDiagnosticsModal');
const BrokerOrderStagingModal = lazyWithRetry(() => import('../BrokerOrderStagingModal').then(m => ({ default: m.BrokerOrderStagingModal })), 'BrokerOrderStagingModal');
const AlertSettingsModal = lazyWithRetry(() => import('../AlertSettingsModal').then(m => ({ default: m.AlertSettingsModal })), 'AlertSettingsModal');
const OptionsTradeQualityModal = lazyWithRetry(() => import('../screener/OptionsTradeQualityModal').then(m => ({ default: m.OptionsTradeQualityModal })), 'OptionsTradeQualityModal');
const FundamentalValuationModal = lazyWithRetry(() => import('../FundamentalValuationModal').then(m => ({ default: m.FundamentalValuationModal })), 'FundamentalValuationModal');

export interface AppModalsContainerProps {
  modalState: {
    isHelpModalOpen: boolean;
    isTradierModalOpen: boolean;
    isSchwabModalOpen: boolean;
    isDiagnosticsOpen: boolean;
    isWatchlistModalOpen: boolean;
    isReportQueryModalOpen: boolean;
    isAlertsModalOpen: boolean;
    isSimulatorModalOpen: boolean;
    isValuationModalOpen: boolean;
    isStagedModalOpen: boolean;
    selectedTicker: TickerMeta | null;
    selectedOpportunity: OptionOpportunity | null;
    calculatorOpportunity: OptionOpportunity | null;
    stagedOrder: StagedBracketOrder | null;
    valuationInitialTicker?: string;
    simulatorInitialData: {
      ticker?: string;
      expiration?: string;
      ivRank?: number;
      delta?: number;
      distTo50Sma?: number;
      strategy?: OptionStrategyType;
      dataSource?: 'BARCHART' | 'MARKETCHAMELEON';
    };
  };
  // Modal Setters
  setIsHelpModalOpen: (open: boolean) => void;
  setIsTradierModalOpen: (open: boolean) => void;
  setIsSchwabModalOpen: (open: boolean) => void;
  setIsDiagnosticsOpen: (open: boolean) => void;
  setIsWatchlistModalOpen: (open: boolean) => void;
  setIsReportQueryModalOpen: (open: boolean) => void;
  setIsAlertsModalOpen: (open: boolean) => void;
  setIsSimulatorModalOpen: (open: boolean) => void;
  openSimulator?: (data?: any) => void;
  setIsStagedModalOpen: (open: boolean) => void;
  setIsCommandPaletteOpen: (open: boolean) => void;
  setSelectedTicker: (ticker: TickerMeta | null) => void;
  setSelectedOpportunity: (opp: OptionOpportunity | null) => void;
  setCalculatorOpportunity: (opp: OptionOpportunity | null) => void;
  // Navigation & Actions
  navigateTo: (tree: MenuTreeType, optTab?: OptionsTabType, eqTab?: EquitiesTabType) => void;
  openValuation: (ticker: string) => void;
  closeValuation: () => void;
  setActiveTree: (tree: MenuTreeType) => void;
  setActiveEquitiesTab: (tab: EquitiesTabType) => void;
  handleStageOpportunity: (opp: OptionOpportunity) => void;
  handleUpdateStagedQuantity: (qty: number) => void;
  handleUpdateStagedAccountType: (acc: AccountType) => void;
  handleUpdateStagedPricingType: (pricing: PriceExecutionType) => void;
  // Watchlist & Universe Data
  watchlistGroups: WatchlistGroup[];
  activeGroupId: string;
  setActiveGroupId: (id: string) => void;
  handleCreateWatchlist: (name: string, tickers?: string[]) => void;
  handleRenameWatchlist: (id: string, name: string) => void;
  handleDeleteWatchlist: (id: string) => void;
  handleUpdateGroupTickers: (id: string, tickers: string[]) => void;
  universeTickers: TickerMeta[];
  allUniverseOpportunities: OptionOpportunity[];
  handleAddCustomTickerMeta: (symbol: string) => void;
  handleLiveRecalculate: (tickers: string[]) => Promise<void>;
  isRecalculating: boolean;
  summary: ScreenerSummary | null;
}

export const AppModalsContainer: React.FC<AppModalsContainerProps> = ({
  modalState,
  setIsHelpModalOpen,
  setIsTradierModalOpen,
  setIsSchwabModalOpen,
  setIsDiagnosticsOpen,
  setIsWatchlistModalOpen,
  setIsReportQueryModalOpen,
  setIsAlertsModalOpen,
  setIsSimulatorModalOpen,
  openSimulator,
  setIsStagedModalOpen,
  setIsCommandPaletteOpen,
  setSelectedTicker,
  setSelectedOpportunity,
  setCalculatorOpportunity,
  navigateTo,
  openValuation,
  closeValuation,
  setActiveTree,
  setActiveEquitiesTab,
  handleStageOpportunity,
  handleUpdateStagedQuantity,
  handleUpdateStagedAccountType,
  handleUpdateStagedPricingType,
  watchlistGroups,
  activeGroupId,
  setActiveGroupId,
  handleCreateWatchlist,
  handleRenameWatchlist,
  handleDeleteWatchlist,
  handleUpdateGroupTickers,
  universeTickers,
  allUniverseOpportunities,
  handleAddCustomTickerMeta,
  handleLiveRecalculate,
  isRecalculating,
  summary,
}) => {
  return (
    <Suspense
      fallback={
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm">
          <div className="flex items-center space-x-3 px-6 py-4 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl text-slate-200">
            <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-medium">Loading Module...</span>
          </div>
        </div>
      }
    >
      {/* 1. Help & Handbook Modal */}
      <HelpHandbookModal
        isOpen={modalState.isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
        onNavigate={(tree, optTab, eqTab) => {
          setIsHelpModalOpen(false);
          navigateTo(tree as any, optTab, eqTab);
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
        onOpenEquityAnalysis={() => {
          setIsHelpModalOpen(false);
          const target = universeTickers.find((t) => t.symbol === 'TSLA') || universeTickers[0] || {
            symbol: 'TSLA',
            companyName: 'Tesla Inc',
            currentPrice: 245.0,
            priceChange: 0,
            priceChangePercent: 0,
            ivRank: 55,
            ivPercentile: 50,
            rsi14: 48,
            historicalVol30d: 45,
            updatedAt: new Date().toISOString(),
          };
          setSelectedTicker(target);
        }}
      />

      {/* 2. Tradier API Settings Modal (Primary) */}
      <TradierSettingsModal
        isOpen={modalState.isTradierModalOpen}
        onClose={() => setIsTradierModalOpen(false)}
        onOpenSchwabSettings={() => {
          setIsTradierModalOpen(false);
          setIsSchwabModalOpen(true);
        }}
      />

      {/* 3. Charles Schwab Retail Trader API Provisioning Modal (Fallback) */}
      <SchwabSettingsModal
        isOpen={modalState.isSchwabModalOpen}
        onClose={() => setIsSchwabModalOpen(false)}
      />

      {/* 4. API Health & Automated Diagnostics Suite Modal */}
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

      {/* 5. Multi-Watchlist Manager with Bulk & CSV/Excel Ingestion (W) */}
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

      {/* 6. Report Queries & Multi-Format Exports (R) */}
      {modalState.isReportQueryModalOpen && (
        <ErrorBoundary fallbackTitle="Report Queries & Export View Recovered" onReset={() => setIsReportQueryModalOpen(false)}>
          <ReportQueryModal
            isOpen={modalState.isReportQueryModalOpen}
            onClose={() => setIsReportQueryModalOpen(false)}
            tickers={universeTickers}
            opportunities={allUniverseOpportunities}
            summary={summary}
          />
        </ErrorBoundary>
      )}

      {/* 7. Ticker Detail 5-Part Audit Modal */}
      {modalState.selectedTicker && (
        <ErrorBoundary fallbackTitle="Ticker Detail View Recovered" onReset={() => setSelectedTicker(null)}>
          <TickerAuditModal
            ticker={modalState.selectedTicker}
            opportunities={allUniverseOpportunities}
            availableTickers={universeTickers}
            onClose={() => setSelectedTicker(null)}
            onOpenSimulator={(sym) => {
              setSelectedTicker(null);
              if (openSimulator) {
                openSimulator({ ticker: sym, strategy: 'CASH_SECURED_PUT' });
              } else {
                setIsSimulatorModalOpen(true);
              }
            }}
          />
        </ErrorBoundary>
      )}

      {/* 8. Option Opportunity Detail Modal */}
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

      {/* 9. Cash Income Calculator Modal */}
      {modalState.calculatorOpportunity && (
        <ErrorBoundary fallbackTitle="Income Calculator Recovered" onReset={() => setCalculatorOpportunity(null)}>
          <IncomeCalculatorModal
            opportunity={modalState.calculatorOpportunity}
            onClose={() => setCalculatorOpportunity(null)}
          />
        </ErrorBoundary>
      )}

      {/* 10. Broker Order Staging & 1-Click Execution Payloads Modal */}
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

      {/* 11. Real-Time Alert Engine & Webhooks Modal */}
      {modalState.isAlertsModalOpen && (
        <AlertSettingsModal
          isOpen={modalState.isAlertsModalOpen}
          onClose={() => setIsAlertsModalOpen(false)}
          tickers={universeTickers}
          opportunities={allUniverseOpportunities}
        />
      )}

      {/* 12. Quantitative Options Trade Quality Simulator Modal */}
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

      {/* 13. DCF Intrinsic Valuation & DuPont Structural Terminal */}
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
  );
};
