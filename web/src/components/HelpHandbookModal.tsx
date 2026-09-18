import React, { useState } from 'react';
import {
  X,
  BookOpen,
  ShieldCheck,
  Flame,
  Layers,
  Activity,
  Command,
  ShieldAlert,
  BarChart2,
  Zap,
  MessageSquare,
  BrainCircuit,
  Calendar,
  DollarSign,
} from './icons';
import { MenuTreeType, EquitiesTabType, OptionsTabType } from '../types/options';

// Chapter components
import { ChapterLaypersonPrimer } from './modals/handbook/chapters/ChapterLaypersonPrimer';
import { ChapterTradeQualityScoring } from './modals/handbook/chapters/ChapterTradeQualityScoring';
import { ChapterWeeklyWorkflowGuide } from './modals/handbook/chapters/ChapterWeeklyWorkflowGuide';
import { ChapterWeeklyScreenersGuide } from './modals/handbook/chapters/ChapterWeeklyScreenersGuide';
import { ChapterAiOptionsIncome } from './modals/handbook/chapters/ChapterAiOptionsIncome';
import { ChapterEconomicCalendar } from './modals/handbook/chapters/ChapterEconomicCalendar';
import { ChapterStrategyRules } from './modals/handbook/chapters/ChapterStrategyRules';
import { ChapterMarketChameleon } from './modals/handbook/chapters/ChapterMarketChameleon';
import { ChapterChartReading } from './modals/handbook/chapters/ChapterChartReading';
import { ChapterSpreadsSkew } from './modals/handbook/chapters/ChapterSpreadsSkew';
import { ChapterSolvencyCef } from './modals/handbook/chapters/ChapterSolvencyCef';
import { ChapterBacktestMargin } from './modals/handbook/chapters/ChapterBacktestMargin';
import { ChapterBrokerExecution } from './modals/handbook/chapters/ChapterBrokerExecution';
import { ChapterContextSentiment } from './modals/handbook/chapters/ChapterContextSentiment';
import { ChapterLiveStreamingRisk } from './modals/handbook/chapters/ChapterLiveStreamingRisk';
import { ChapterCadenceGuide } from './modals/handbook/chapters/ChapterCadenceGuide';
import { ChapterGreeksFormulas } from './modals/handbook/chapters/ChapterGreeksFormulas';
import { ChapterLiquidityTiers } from './modals/handbook/chapters/ChapterLiquidityTiers';
import { ChapterShortcutsFaq } from './modals/handbook/chapters/ChapterShortcutsFaq';
import { ChapterQuantValuation } from './modals/handbook/chapters/ChapterQuantValuation';
import { ChapterTaxAlphaAudit } from './modals/handbook/chapters/ChapterTaxAlphaAudit';

interface HelpHandbookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (tree: MenuTreeType, optionsTab?: OptionsTabType, equitiesTab?: EquitiesTabType) => void;
  onOpenSimulator?: () => void;
  onOpenValuation?: (ticker?: string) => void;
  onOpenTradier?: () => void;
  onOpenSchwab?: () => void;
  onOpenDiagnostics?: () => void;
  onOpenReports?: () => void;
  onOpenWatchlists?: () => void;
  onOpenAlerts?: () => void;
  onOpenCommandPalette?: () => void;
  onOpenEquityAnalysis?: () => void;
}

type HandbookTab =
  | 'LAYPERSON_PRIMER'
  | 'TRADE_QUALITY_SCORING'
  | 'WEEKLY_WORKFLOW_GUIDE'
  | 'AI_OPTIONS_INCOME'
  | 'ECONOMIC_CALENDAR'
  | 'WEEKLY_SCREENERS_GUIDE'
  | 'STRATEGY_RULES'
  | 'MARKET_CHAMELEON'
  | 'CHART_READING'
  | 'SPREADS_SKEW'
  | 'SOLVENCY_CEF'
  | 'BACKTEST_MARGIN'
  | 'BROKER_EXECUTION'
  | 'CONTEXT_SENTIMENT'
  | 'LIVE_STREAMING_RISK'
  | 'CADENCE_GUIDE'
  | 'GREEKS_FORMULAS'
  | 'LIQUIDITY_TIERS'
  | 'SHORTCUTS_FAQ'
  | 'QUANT_VALUATION_ENGINE'
  | 'TAX_ALPHA_AUDIT';

export const HelpHandbookModal: React.FC<HelpHandbookModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onOpenSimulator,
  onOpenValuation,
  onOpenTradier,
  onOpenSchwab,
  onOpenDiagnostics,
  onOpenReports,
  onOpenWatchlists,
  onOpenAlerts,
  onOpenCommandPalette,
  onOpenEquityAnalysis,
}) => {
  const [activeTab, setActiveTab] = useState<HandbookTab>('LAYPERSON_PRIMER');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div
        className="w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>DeltaHarvest Strategy Handbook &amp; Educational Center</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  v3.4
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Systematic Rules, DCF Intrinsic Valuation, DuPont Analysis, Technicals, Spreads, Prediction Markets &amp; Risk Circuit-Breakers
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center space-x-1 p-2 bg-slate-950/40 border-b border-slate-800 overflow-x-auto text-xs">
          <button
            onClick={() => setActiveTab('LAYPERSON_PRIMER')}
            className={`px-3 py-2 rounded-xl font-semibold flex items-center space-x-1.5 transition-all whitespace-nowrap ${
              activeTab === 'LAYPERSON_PRIMER'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-amber-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <span>🌟</span>
            <span>Plain-English Primer</span>
          </button>

          <button
            onClick={() => setActiveTab('TRADE_QUALITY_SCORING')}
            className={`px-3 py-2 rounded-xl font-semibold flex items-center space-x-1.5 transition-all whitespace-nowrap ${
              activeTab === 'TRADE_QUALITY_SCORING'
                ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 text-white shadow-md shadow-emerald-600/30 ring-1 ring-emerald-400/50'
                : 'text-emerald-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Zap className="w-4 h-4 text-emerald-400" />
            <span>Options Trade Quality Simulator (100 Pts)</span>
          </button>

          <button
            onClick={() => setActiveTab('WEEKLY_WORKFLOW_GUIDE')}
            className={`px-3 py-2 rounded-xl font-semibold flex items-center space-x-1.5 transition-all whitespace-nowrap ${
              activeTab === 'WEEKLY_WORKFLOW_GUIDE'
                ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 text-white shadow-md shadow-emerald-600/30 ring-1 ring-emerald-400/50'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <span>📅</span>
            <span>Weekly Workflow &amp; 15–25Δ Funnel</span>
          </button>

          <button
            onClick={() => setActiveTab('WEEKLY_SCREENERS_GUIDE')}
            className={`px-3 py-2 rounded-xl font-semibold flex items-center space-x-1.5 transition-all whitespace-nowrap ${
              activeTab === 'WEEKLY_SCREENERS_GUIDE'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/30 ring-1 ring-emerald-400/50'
                : 'text-amber-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Flame className="w-4 h-4 text-amber-400" />
            <span>Weekly Stock Screeners (Barchart)</span>
          </button>

          <button
            onClick={() => setActiveTab('AI_OPTIONS_INCOME')}
            className={`px-3 py-2 rounded-xl font-semibold flex items-center space-x-1.5 transition-all whitespace-nowrap ${
              activeTab === 'AI_OPTIONS_INCOME'
                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-600/30 ring-1 ring-violet-400/50'
                : 'text-violet-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <BrainCircuit className="w-4 h-4 text-violet-400" />
            <span>AI Options Screener (Thinking)</span>
          </button>

          <button
            onClick={() => setActiveTab('ECONOMIC_CALENDAR')}
            className={`px-3 py-2 rounded-xl font-semibold flex items-center space-x-1.5 transition-all whitespace-nowrap ${
              activeTab === 'ECONOMIC_CALENDAR'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/30 ring-1 ring-blue-400/50'
                : 'text-blue-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Calendar className="w-4 h-4 text-blue-400" />
            <span>Economic Indicators &amp; Macro Catalysts</span>
          </button>

          <button
            onClick={() => setActiveTab('STRATEGY_RULES')}
            className={`px-3 py-2 rounded-xl font-semibold flex items-center space-x-1.5 transition-all whitespace-nowrap ${
              activeTab === 'STRATEGY_RULES'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>1. Core Strategy Rules</span>
          </button>

          <button
            onClick={() => setActiveTab('MARKET_CHAMELEON')}
            className={`px-3 py-2 rounded-xl font-semibold flex items-center space-x-1.5 transition-all whitespace-nowrap ${
              activeTab === 'MARKET_CHAMELEON'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <span>🦎</span>
            <span>2. MarketChameleon Patterns &amp; Ideas</span>
          </button>

          <button
            onClick={() => setActiveTab('CHART_READING')}
            className={`px-3 py-2 rounded-xl font-semibold flex items-center space-x-1.5 transition-all whitespace-nowrap ${
              activeTab === 'CHART_READING'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Activity className="w-4 h-4 text-cyan-400" />
            <span>3. Visual Charting &amp; Strike Positioning</span>
          </button>

          <button
            onClick={() => setActiveTab('SPREADS_SKEW')}
            className={`px-3 py-2 rounded-xl font-semibold flex items-center space-x-1.5 transition-all whitespace-nowrap ${
              activeTab === 'SPREADS_SKEW'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>4. Multi-Leg Spreads &amp; Volatility Skew</span>
          </button>

          <button
            onClick={() => setActiveTab('SOLVENCY_CEF')}
            className={`px-3 py-2 rounded-xl font-semibold flex items-center space-x-1.5 transition-all whitespace-nowrap ${
              activeTab === 'SOLVENCY_CEF'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
            <span>5. Altman Z-Score &amp; CEF Anatomy</span>
          </button>

          <button
            onClick={() => setActiveTab('BACKTEST_MARGIN')}
            className={`px-3 py-2 rounded-xl font-semibold flex items-center space-x-1.5 transition-all whitespace-nowrap ${
              activeTab === 'BACKTEST_MARGIN'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <BarChart2 className="w-4 h-4 text-purple-400" />
            <span>6. Backtesting &amp; Margin Stress</span>
          </button>

          <button
            onClick={() => setActiveTab('BROKER_EXECUTION')}
            className={`px-3 py-2 rounded-xl font-semibold flex items-center space-x-1.5 transition-all whitespace-nowrap ${
              activeTab === 'BROKER_EXECUTION'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Zap className="w-4 h-4 text-amber-400" />
            <span>7. Broker Staging &amp; Execution</span>
          </button>

          <button
            onClick={() => setActiveTab('CONTEXT_SENTIMENT')}
            className={`px-3 py-2 rounded-xl font-semibold flex items-center space-x-1.5 transition-all whitespace-nowrap ${
              activeTab === 'CONTEXT_SENTIMENT'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <MessageSquare className="w-4 h-4 text-blue-400" />
            <span>8. Sentiment &amp; Predictions</span>
          </button>

          <button
            onClick={() => setActiveTab('LIVE_STREAMING_RISK')}
            className={`px-3 py-2 rounded-xl font-semibold flex items-center space-x-1.5 transition-all whitespace-nowrap ${
              activeTab === 'LIVE_STREAMING_RISK'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            <span>9. Live Risk Circuit-Breakers</span>
          </button>

          <button
            onClick={() => setActiveTab('CADENCE_GUIDE')}
            className={`px-3 py-2 rounded-xl font-semibold flex items-center space-x-1.5 transition-all whitespace-nowrap ${
              activeTab === 'CADENCE_GUIDE'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>10. Weekly vs Monthly Expirations</span>
          </button>

          <button
            onClick={() => setActiveTab('GREEKS_FORMULAS')}
            className={`px-3 py-2 rounded-xl font-semibold flex items-center space-x-1.5 transition-all whitespace-nowrap ${
              activeTab === 'GREEKS_FORMULAS'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Activity className="w-4 h-4 text-emerald-400" />
            <span>11. Greeks &amp; Formulas</span>
          </button>

          <button
            onClick={() => setActiveTab('LIQUIDITY_TIERS')}
            className={`px-3 py-2 rounded-xl font-semibold flex items-center space-x-1.5 transition-all whitespace-nowrap ${
              activeTab === 'LIQUIDITY_TIERS'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Flame className="w-4 h-4 text-amber-400" />
            <span>12. Liquidity Tiers</span>
          </button>

          <button
            onClick={() => setActiveTab('SHORTCUTS_FAQ')}
            className={`px-3 py-2 rounded-xl font-semibold flex items-center space-x-1.5 transition-all whitespace-nowrap ${
              activeTab === 'SHORTCUTS_FAQ'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Command className="w-4 h-4" />
            <span>13. Shortcuts &amp; FAQ</span>
          </button>

          <button
            onClick={() => setActiveTab('QUANT_VALUATION_ENGINE')}
            className={`px-3 py-2 rounded-xl font-semibold flex items-center space-x-1.5 transition-all whitespace-nowrap ${
              activeTab === 'QUANT_VALUATION_ENGINE'
                ? 'bg-gradient-to-r from-teal-600 via-emerald-600 to-cyan-600 text-white shadow-md shadow-teal-600/30 ring-1 ring-teal-400/50'
                : 'text-teal-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <DollarSign className="w-4 h-4 text-teal-400" />
            <span>14. Quantitative Equity Valuation &amp; DCF Terminal (v3.4)</span>
          </button>

          <button
            onClick={() => setActiveTab('TAX_ALPHA_AUDIT')}
            className={`px-3 py-2 rounded-xl font-semibold flex items-center space-x-1.5 transition-all whitespace-nowrap ${
              activeTab === 'TAX_ALPHA_AUDIT'
                ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white shadow-md shadow-emerald-600/30 ring-1 ring-emerald-400/50'
                : 'text-emerald-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <span>15. Institutional Derivatives Tax Alpha &amp; IRC Subchapter P Audit (v3.4)</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm text-slate-300 leading-relaxed">
          {activeTab === 'LAYPERSON_PRIMER' && (
            <ChapterLaypersonPrimer
              onNavigate={onNavigate}
              onOpenSimulator={onOpenSimulator}
              onOpenValuation={onOpenValuation}
            />
          )}

          {activeTab === 'TRADE_QUALITY_SCORING' && (
            <ChapterTradeQualityScoring
              onOpenSimulator={onOpenSimulator}
              onNavigate={onNavigate}
            />
          )}

          {activeTab === 'WEEKLY_WORKFLOW_GUIDE' && (
            <ChapterWeeklyWorkflowGuide
              onNavigate={onNavigate}
              onOpenSimulator={onOpenSimulator}
            />
          )}

          {activeTab === 'WEEKLY_SCREENERS_GUIDE' && (
            <ChapterWeeklyScreenersGuide onNavigate={onNavigate} />
          )}

          {activeTab === 'AI_OPTIONS_INCOME' && (
            <ChapterAiOptionsIncome onNavigate={onNavigate} />
          )}

          {activeTab === 'ECONOMIC_CALENDAR' && (
            <ChapterEconomicCalendar onNavigate={onNavigate} />
          )}

          {activeTab === 'STRATEGY_RULES' && (
            <ChapterStrategyRules
              onNavigate={onNavigate}
            />
          )}

          {activeTab === 'MARKET_CHAMELEON' && (
            <ChapterMarketChameleon onNavigate={onNavigate} />
          )}

          {activeTab === 'CHART_READING' && (
            <ChapterChartReading onNavigate={onNavigate} />
          )}

          {activeTab === 'SPREADS_SKEW' && (
            <ChapterSpreadsSkew onNavigate={onNavigate} />
          )}

          {activeTab === 'SOLVENCY_CEF' && (
            <ChapterSolvencyCef onNavigate={onNavigate} />
          )}

          {activeTab === 'BACKTEST_MARGIN' && (
            <ChapterBacktestMargin onNavigate={onNavigate} />
          )}

          {activeTab === 'BROKER_EXECUTION' && (
            <ChapterBrokerExecution
              onNavigate={onNavigate}
              onOpenTradier={onOpenTradier}
              onOpenSchwab={onOpenSchwab}
            />
          )}

          {activeTab === 'CONTEXT_SENTIMENT' && (
            <ChapterContextSentiment onNavigate={onNavigate} />
          )}

          {activeTab === 'LIVE_STREAMING_RISK' && (
            <ChapterLiveStreamingRisk
              onNavigate={onNavigate}
              onOpenAlerts={onOpenAlerts}
            />
          )}

          {activeTab === 'CADENCE_GUIDE' && (
            <ChapterCadenceGuide onNavigate={onNavigate} />
          )}

          {activeTab === 'GREEKS_FORMULAS' && (
            <ChapterGreeksFormulas
              onNavigate={onNavigate}
            />
          )}

          {activeTab === 'LIQUIDITY_TIERS' && (
            <ChapterLiquidityTiers
              onNavigate={onNavigate}
            />
          )}

          {activeTab === 'SHORTCUTS_FAQ' && (
            <ChapterShortcutsFaq
              onNavigate={onNavigate}
              onOpenCommandPalette={onOpenCommandPalette}
              onOpenWatchlists={onOpenWatchlists}
              onOpenReports={onOpenReports}
              onOpenSimulator={onOpenSimulator}
              onOpenEquityAnalysis={onOpenEquityAnalysis}
            />
          )}

          {activeTab === 'QUANT_VALUATION_ENGINE' && (
            <ChapterQuantValuation
              onOpenValuation={onOpenValuation}
              onNavigate={onNavigate}
              onOpenSimulator={onOpenSimulator}
            />
          )}

          {activeTab === 'TAX_ALPHA_AUDIT' && (
            <ChapterTaxAlphaAudit
              onNavigate={onNavigate}
              onOpenSimulator={onOpenSimulator}
            />
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>DeltaHarvest Institutional Income System</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold transition-colors cursor-pointer"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
