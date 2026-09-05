import React from 'react';
import {
  Activity,
  BarChart2,
  Calendar,
  Compass,
  Flame,
  Layers,
  PieChart,
  ShieldCheck,
  TrendingUp,
  Sliders,
  Calculator,
  Zap,
  Award,
  DollarSign,
  BrainCircuit,
  Filter,
  Clock,
  CheckCircle2,
} from './icons';
import { MenuTreeType, EquitiesTabType, OptionsTabType } from '../types/options';

interface DualMenuTreeProps {
  activeTree: MenuTreeType;
  onSelectTree: (tree: MenuTreeType) => void;
  activeEquitiesTab: EquitiesTabType;
  onSelectEquitiesTab: (tab: EquitiesTabType) => void;
  activeOptionsTab: OptionsTabType;
  onSelectOptionsTab: (tab: OptionsTabType) => void;
  totalTickersCount: number;
  weeklyCount: number;
  monthlyCount: number;
  highIvrCount: number;
  earningsAlertCount: number;
  freeCashAmount?: number;
}

export const DualMenuTree: React.FC<DualMenuTreeProps> = ({
  activeTree,
  onSelectTree,
  activeEquitiesTab,
  onSelectEquitiesTab,
  activeOptionsTab,
  onSelectOptionsTab,
  totalTickersCount,
  weeklyCount,
  monthlyCount,
  highIvrCount,
  earningsAlertCount,
  freeCashAmount,
}) => {
  return (
    <div className="space-y-3">
      {/* Primary Top-Level Mode Selector */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-2.5 gap-3">
        <div className="flex items-center space-x-2">
          {/* Mode 1: Weekly Workflow (Default) */}
          <button
            onClick={() => {
              onSelectTree('WORKFLOW');
              if (
                activeOptionsTab !== 'WEEKLY_CASH_LEDGER' &&
                activeOptionsTab !== 'HOLDINGS_COVERED_CALLS' &&
                activeOptionsTab !== 'ECONOMIC_CALENDAR' &&
                activeOptionsTab !== 'CASCADING_SCREENER' &&
                activeOptionsTab !== 'WEEKLY_EXECUTIVE_REPORT' &&
                activeOptionsTab !== 'BROKER_STAGING'
              ) {
                onSelectOptionsTab('WEEKLY_CASH_LEDGER');
              }
            }}
            className={`flex items-center space-x-2.5 px-4 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
              activeTree === 'WORKFLOW'
                ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 text-white shadow-lg shadow-emerald-600/30 ring-1 ring-emerald-400/40'
                : 'bg-slate-900/90 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <Clock className="w-4 h-4 text-emerald-300" />
            <span>📅 End-of-Week Workflow</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                activeTree === 'WORKFLOW' ? 'bg-white/20 text-white' : 'bg-emerald-500/10 text-emerald-400'
              }`}
            >
              Weekend Ritual
            </span>
          </button>

          {/* Mode 2: Strategy Labs */}
          <button
            onClick={() => onSelectTree('OPTIONS')}
            className={`flex items-center space-x-2.5 px-4 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
              activeTree === 'OPTIONS'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-600/30 ring-1 ring-indigo-400/40'
                : 'bg-slate-900/90 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <Sliders className="w-4 h-4 text-indigo-300" />
            <span>🔬 Strategy Labs</span>
          </button>

          {/* Mode 3: US Equities Universe */}
          <button
            onClick={() => onSelectTree('EQUITIES')}
            className={`flex items-center space-x-2.5 px-4 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
              activeTree === 'EQUITIES'
                ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-600/30 ring-1 ring-blue-400/40'
                : 'bg-slate-900/90 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <BarChart2 className="w-4 h-4 text-blue-300" />
            <span>📊 US Equities Universe</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                activeTree === 'EQUITIES' ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {totalTickersCount}
            </span>
          </button>
        </div>

        {/* Status Indicators */}
        <div className="hidden lg:flex items-center space-x-4 text-xs font-mono text-slate-400">
          {freeCashAmount !== undefined && (
            <span className="flex items-center space-x-1.5 text-emerald-400 font-bold">
              <DollarSign className="w-3.5 h-3.5" />
              <span>Free Cash: ${freeCashAmount.toLocaleString()}</span>
            </span>
          )}
          <span className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>{weeklyCount} Weeklys</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-slate-500" />
            <span>{monthlyCount} Monthly</span>
          </span>
        </div>
      </div>

      {/* Sub-Navigation Strip (Contextual by Mode) */}
      <div className="glass-panel py-2 px-3 rounded-xl border border-slate-800/90 overflow-x-auto min-h-[56px] flex items-center shadow-lg">
        {activeTree === 'WORKFLOW' ? (
          /* WORKFLOW MODE: Guided End-of-Week Ritual */
          <div className="flex items-center space-x-2 min-w-max w-full">
            {/* Step 1: Cash & Disbursements */}
            <button
              onClick={() => onSelectOptionsTab('WEEKLY_CASH_LEDGER')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer border ${
                activeOptionsTab === 'WEEKLY_CASH_LEDGER'
                  ? 'bg-emerald-600 text-white border-emerald-400 shadow-md shadow-emerald-600/30 ring-1 ring-emerald-400/50'
                  : 'bg-slate-900/90 text-slate-300 hover:text-white hover:bg-slate-800 border-slate-700/70'
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-black/30 flex items-center justify-center text-[10px] font-mono">1</span>
              <DollarSign className="w-3.5 h-3.5 text-emerald-300" />
              <span>1. Cash &amp; Disbursements</span>
            </button>

            <span className="text-slate-600 text-xs">➔</span>

            {/* Step 2: Holdings & Covered Calls */}
            <button
              onClick={() => onSelectOptionsTab('HOLDINGS_COVERED_CALLS')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer border ${
                activeOptionsTab === 'HOLDINGS_COVERED_CALLS'
                  ? 'bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-600/30 ring-1 ring-indigo-400/50'
                  : 'bg-slate-900/90 text-slate-300 hover:text-white hover:bg-slate-800 border-slate-700/70'
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-black/30 flex items-center justify-center text-[10px] font-mono">2</span>
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-300" />
              <span>2. Holdings &amp; Covered Calls</span>
            </button>

            <span className="text-slate-600 text-xs">➔</span>

            {/* Step 3: Macro & Catalysts */}
            <button
              onClick={() => onSelectOptionsTab('ECONOMIC_CALENDAR')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer border ${
                activeOptionsTab === 'ECONOMIC_CALENDAR'
                  ? 'bg-blue-600 text-white border-blue-400 shadow-md shadow-blue-600/30 ring-1 ring-blue-400/50'
                  : 'bg-slate-900/90 text-slate-300 hover:text-white hover:bg-slate-800 border-slate-700/70'
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-black/30 flex items-center justify-center text-[10px] font-mono">3</span>
              <Calendar className="w-3.5 h-3.5 text-blue-300" />
              <span>3. Macro &amp; Catalysts</span>
            </button>

            <span className="text-slate-600 text-xs">➔</span>

            {/* Step 4: Cascading Screener & Gemini */}
            <button
              onClick={() => onSelectOptionsTab('CASCADING_SCREENER')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer border ${
                activeOptionsTab === 'CASCADING_SCREENER'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-emerald-400 shadow-md shadow-emerald-600/30 ring-1 ring-emerald-400/50'
                  : 'bg-slate-900/90 text-slate-300 hover:text-white hover:bg-slate-800 border-slate-700/70'
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-black/30 flex items-center justify-center text-[10px] font-mono">4</span>
              <Filter className="w-3.5 h-3.5 text-emerald-300" />
              <span>4. Tri-Screen &amp; Gemini AI</span>
            </button>

            <span className="text-slate-600 text-xs">➔</span>

            {/* Step 5: Weekly Executive Report */}
            <button
              onClick={() => onSelectOptionsTab('WEEKLY_EXECUTIVE_REPORT')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer border ${
                activeOptionsTab === 'WEEKLY_EXECUTIVE_REPORT'
                  ? 'bg-amber-600 text-white border-amber-400 shadow-md shadow-amber-600/30 ring-1 ring-amber-400/50'
                  : 'bg-slate-900/90 text-slate-300 hover:text-white hover:bg-slate-800 border-slate-700/70'
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-black/30 flex items-center justify-center text-[10px] font-mono">5</span>
              <Award className="w-3.5 h-3.5 text-amber-300" />
              <span>5. Master Report</span>
            </button>

            <span className="text-slate-600 text-xs">➔</span>

            {/* Step 6: Broker Staging */}
            <button
              onClick={() => onSelectOptionsTab('BROKER_STAGING')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer border ${
                activeOptionsTab === 'BROKER_STAGING'
                  ? 'bg-cyan-600 text-white border-cyan-400 shadow-md shadow-cyan-600/30 ring-1 ring-cyan-400/50'
                  : 'bg-slate-900/90 text-slate-300 hover:text-white hover:bg-slate-800 border-slate-700/70'
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-black/30 flex items-center justify-center text-[10px] font-mono">6</span>
              <Zap className="w-3.5 h-3.5 text-cyan-300" />
              <span>6. Broker Staging</span>
            </button>
          </div>
        ) : activeTree === 'OPTIONS' ? (
          /* STRATEGY LABS MODE: Specialized Derivatives & Stress Labs */
          <div className="flex items-center space-x-2 min-w-max">
            <button
              onClick={() => onSelectOptionsTab('INCOME_SCREENER')}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all border ${
                activeOptionsTab === 'INCOME_SCREENER'
                  ? 'bg-emerald-600 text-white border-emerald-400 shadow-md'
                  : 'bg-slate-900/90 text-slate-300 hover:text-white hover:bg-slate-800 border-slate-700/70'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Conservative Income (CSPs &amp; CCs)</span>
            </button>

            <button
              onClick={() => onSelectOptionsTab('MULTI_LEG_SPREADS')}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all border ${
                activeOptionsTab === 'MULTI_LEG_SPREADS'
                  ? 'bg-emerald-600 text-white border-emerald-400 shadow-md'
                  : 'bg-slate-900/90 text-slate-300 hover:text-white hover:bg-slate-800 border-slate-700/70'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Multi-Leg Spreads &amp; Iron Condors</span>
            </button>

            <button
              onClick={() => onSelectOptionsTab('PMCC_SCREENER')}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all border ${
                activeOptionsTab === 'PMCC_SCREENER'
                  ? 'bg-purple-600 text-white border-purple-400 shadow-md'
                  : 'bg-slate-900/90 text-slate-300 hover:text-white hover:bg-slate-800 border-slate-700/70'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5 text-purple-400" />
              <span>Poor Man’s Covered Call (PMCC)</span>
            </button>

            <button
              onClick={() => onSelectOptionsTab('OPTION_CHAIN_MATRIX')}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all border ${
                activeOptionsTab === 'OPTION_CHAIN_MATRIX'
                  ? 'bg-cyan-600 text-white border-cyan-400 shadow-md'
                  : 'bg-slate-900/90 text-slate-300 hover:text-white hover:bg-slate-800 border-slate-700/70'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span>Option Chain &amp; Volatility Smile</span>
            </button>

            <button
              onClick={() => onSelectOptionsTab('VOLATILITY_SKEW')}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all border ${
                activeOptionsTab === 'VOLATILITY_SKEW'
                  ? 'bg-emerald-600 text-white border-emerald-400 shadow-md'
                  : 'bg-slate-900/90 text-slate-300 hover:text-white hover:bg-slate-800 border-slate-700/70'
              }`}
            >
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              <span>25Δ Skew &amp; Term Structure</span>
            </button>

            <button
              onClick={() => onSelectOptionsTab('PORTFOLIO_MARGIN_SIM')}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all border ${
                activeOptionsTab === 'PORTFOLIO_MARGIN_SIM'
                  ? 'bg-indigo-600 text-white border-indigo-400 shadow-md'
                  : 'bg-slate-900/90 text-slate-300 hover:text-white hover:bg-slate-800 border-slate-700/70'
              }`}
            >
              <Sliders className="w-3.5 h-3.5 text-indigo-400" />
              <span>Margin &amp; Shock Simulator</span>
            </button>

            <button
              onClick={() => onSelectOptionsTab('DEFENSIVE_ROLL_ASSISTANT')}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all border ${
                activeOptionsTab === 'DEFENSIVE_ROLL_ASSISTANT'
                  ? 'bg-amber-600 text-white border-amber-400 shadow-md'
                  : 'bg-slate-900/90 text-slate-300 hover:text-white hover:bg-slate-800 border-slate-700/70'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>Defensive Rolling &amp; Repair</span>
            </button>

            <button
              onClick={() => onSelectOptionsTab('TAX_ALPHA_OPTIMIZER')}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all border ${
                activeOptionsTab === 'TAX_ALPHA_OPTIMIZER'
                  ? 'bg-emerald-600 text-white border-emerald-400 shadow-md'
                  : 'bg-slate-900/90 text-slate-300 hover:text-white hover:bg-slate-800 border-slate-700/70'
              }`}
            >
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
              <span>Section 1256 Tax Alpha</span>
            </button>

            <button
              onClick={() => onSelectOptionsTab('AI_OPTIONS_INCOME')}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all border ${
                activeOptionsTab === 'AI_OPTIONS_INCOME'
                  ? 'bg-amber-600 text-white border-amber-400 shadow-md'
                  : 'bg-slate-900/90 text-slate-300 hover:text-white hover:bg-slate-800 border-slate-700/70'
              }`}
            >
              <BrainCircuit className="w-3.5 h-3.5 text-amber-300" />
              <span>Options Income AI (Thinking)</span>
            </button>

            <button
              onClick={() => onSelectOptionsTab('BACKTEST_MARGIN')}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all border ${
                activeOptionsTab === 'BACKTEST_MARGIN'
                  ? 'bg-emerald-600 text-white border-emerald-400 shadow-md'
                  : 'bg-slate-900/90 text-slate-300 hover:text-white hover:bg-slate-800 border-slate-700/70'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5 text-purple-400" />
              <span>Systematic Backtester</span>
            </button>
          </div>
        ) : (
          /* EQUITIES MODE: Stock Screener, Charts & Fundamental Analysis */
          <div className="flex items-center space-x-2 min-w-max">
            <button
              onClick={() => onSelectEquitiesTab('TECHNICAL_SCREENER')}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all border ${
                activeEquitiesTab === 'TECHNICAL_SCREENER'
                  ? 'bg-blue-600 text-white border-blue-400 shadow-md'
                  : 'bg-slate-900/90 text-slate-300 hover:text-white hover:bg-slate-800 border-slate-700/70'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Technical Screener</span>
            </button>

            <button
              onClick={() => onSelectEquitiesTab('WEEKLY_STOCK_SCREENERS')}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all border ${
                activeEquitiesTab === 'WEEKLY_STOCK_SCREENERS'
                  ? 'bg-emerald-600 text-white border-emerald-400 shadow-md'
                  : 'bg-slate-900/90 text-slate-300 hover:text-white hover:bg-slate-800 border-slate-700/70'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>Weekly Stock Screeners (Barchart)</span>
            </button>

            <button
              onClick={() => onSelectEquitiesTab('INTERACTIVE_CHARTS')}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all border ${
                activeEquitiesTab === 'INTERACTIVE_CHARTS'
                  ? 'bg-blue-600 text-white border-blue-400 shadow-md'
                  : 'bg-slate-900/90 text-slate-300 hover:text-white hover:bg-slate-800 border-slate-700/70'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>Interactive Candlestick Charts</span>
            </button>

            <button
              onClick={() => onSelectEquitiesTab('FUNDAMENTAL_HEALTH')}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all border ${
                activeEquitiesTab === 'FUNDAMENTAL_HEALTH'
                  ? 'bg-blue-600 text-white border-blue-400 shadow-md'
                  : 'bg-slate-900/90 text-slate-300 hover:text-white hover:bg-slate-800 border-slate-700/70'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Fundamental Health &amp; SEC EDGAR</span>
            </button>

            <button
              onClick={() => onSelectEquitiesTab('TREND_SUPPORT')}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all border ${
                activeEquitiesTab === 'TREND_SUPPORT'
                  ? 'bg-blue-600 text-white border-blue-400 shadow-md'
                  : 'bg-slate-900/90 text-slate-300 hover:text-white hover:bg-slate-800 border-slate-700/70'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Trend &amp; Support Map</span>
            </button>

            <button
              onClick={() => onSelectEquitiesTab('VOLATILITY_RISK')}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all border ${
                activeEquitiesTab === 'VOLATILITY_RISK'
                  ? 'bg-blue-600 text-white border-blue-400 shadow-md'
                  : 'bg-slate-900/90 text-slate-300 hover:text-white hover:bg-slate-800 border-slate-700/70'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>Volatility &amp; Risk Profiler</span>
            </button>

            <button
              onClick={() => onSelectEquitiesTab('EARNINGS_CALENDAR')}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all border ${
                activeEquitiesTab === 'EARNINGS_CALENDAR'
                  ? 'bg-blue-600 text-white border-blue-400 shadow-md'
                  : 'bg-slate-900/90 text-slate-300 hover:text-white hover:bg-slate-800 border-slate-700/70'
              }`}
            >
              <Calendar className="w-3.5 h-3.5 text-rose-400" />
              <span>Earnings Calendar</span>
            </button>

            <button
              onClick={() => onSelectEquitiesTab('ECONOMIC_CALENDAR')}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all border ${
                activeEquitiesTab === 'ECONOMIC_CALENDAR'
                  ? 'bg-blue-600 text-white border-blue-400 shadow-md'
                  : 'bg-slate-900/90 text-slate-300 hover:text-white hover:bg-slate-800 border-slate-700/70'
              }`}
            >
              <Calendar className="w-3.5 h-3.5 text-blue-400" />
              <span>Economic Indicators (USD)</span>
            </button>

            <button
              onClick={() => onSelectEquitiesTab('SECTOR_OVERVIEW')}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all border ${
                activeEquitiesTab === 'SECTOR_OVERVIEW'
                  ? 'bg-blue-600 text-white border-blue-400 shadow-md'
                  : 'bg-slate-900/90 text-slate-300 hover:text-white hover:bg-slate-800 border-slate-700/70'
              }`}
            >
              <PieChart className="w-3.5 h-3.5" />
              <span>Sector Overview</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
