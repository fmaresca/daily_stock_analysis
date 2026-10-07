import React, { useState } from 'react';
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
  Zap,
  Award,
  DollarSign,
  BrainCircuit,
  Filter,
  Clock,
  HelpCircle,
  Upload,
  ChevronDown,
  ChevronUp,
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
  highIvrCount: _highIvrCount,
  earningsAlertCount: _earningsAlertCount,
  freeCashAmount,
}) => {
  // Dynamically track configured target delta for Step 3 label
  const [targetDeltaPct, setTargetDeltaPct] = React.useState<number>(() => {
    try {
      const saved = localStorage.getItem('deltaharvest_harvest_target_delta');
      if (saved) {
        const val = parseFloat(saved);
        if (!isNaN(val) && val > 0 && val < 1) return Math.round(val * 100);
      }
    } catch {}
    return 20;
  });

  // Track if user is in any screener context to offer orientation
  const isScreenerContext =
    (activeTree === 'EQUITIES' &&
      (activeEquitiesTab === 'TECHNICAL_SCREENER' || activeEquitiesTab === 'WEEKLY_STOCK_SCREENERS')) ||
    (activeTree === 'OPTIONS' && activeOptionsTab === 'INCOME_SCREENER') ||
    (activeTree === 'WORKFLOW' && activeOptionsTab === 'CASCADING_SCREENER');

  const [isChooserExpanded, setIsChooserExpanded] = useState<boolean>(() => {
    try {
      return localStorage.getItem('deltaharvest_screener_chooser_open') !== 'false';
    } catch {
      return true;
    }
  });

  const toggleChooser = () => {
    setIsChooserExpanded((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('deltaharvest_screener_chooser_open', String(next));
      } catch {}
      return next;
    });
  };

  React.useEffect(() => {
    const handleUpdate = () => {
      try {
        const saved = localStorage.getItem('deltaharvest_harvest_target_delta');
        if (saved) {
          const val = parseFloat(saved);
          if (!isNaN(val) && val > 0 && val < 1) {
            setTargetDeltaPct(Math.round(val * 100));
          }
        }
      } catch {}
    };
    window.addEventListener('deltaharvest_portfolio_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('deltaharvest_portfolio_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

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
                activeOptionsTab !== 'SCHWAB_POSITIONS_UPLOAD' &&
                activeOptionsTab !== 'WEEKLY_CASH_LEDGER' &&
                activeOptionsTab !== 'HOLDINGS_COVERED_CALLS' &&
                activeOptionsTab !== 'ECONOMIC_CALENDAR' &&
                activeOptionsTab !== 'CASCADING_SCREENER' &&
                activeOptionsTab !== 'WEEKLY_EXECUTIVE_REPORT' &&
                activeOptionsTab !== 'BROKER_STAGING'
              ) {
                onSelectOptionsTab('SCHWAB_POSITIONS_UPLOAD');
              }
            }}
            className={`flex items-center space-x-2.5 px-4 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
              activeTree === 'WORKFLOW'
                ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 text-white shadow-lg shadow-emerald-600/30 ring-1 ring-emerald-400/40'
                : 'bg-slate-900/90 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
            }`}
            aria-label="Workflow Ritual"
            aria-current={activeTree === 'WORKFLOW' ? 'true' : undefined}
          >
            <Clock className="w-4 h-4 text-emerald-300" />
            <span>Workflow Ritual</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                activeTree === 'WORKFLOW' ? 'bg-white/20 text-white' : 'bg-emerald-500/10 text-emerald-400'
              }`}
            >
              7 Steps
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
            aria-label="Strategy Labs"
            aria-current={activeTree === 'OPTIONS' ? 'true' : undefined}
          >
            <Sliders className="w-4 h-4 text-indigo-300" />
            <span>Strategy Labs</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                activeTree === 'OPTIONS' ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
              }`}
            >
              10 Labs
            </span>
          </button>

          {/* Mode 3: US Equities Universe */}
          <button
            onClick={() => onSelectTree('EQUITIES')}
            className={`flex items-center space-x-2.5 px-4 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
              activeTree === 'EQUITIES'
                ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-600/30 ring-1 ring-blue-400/40'
                : 'bg-slate-900/90 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
            }`}
            aria-label="Stock Screener"
            aria-current={activeTree === 'EQUITIES' ? 'true' : undefined}
          >
            <BarChart2 className="w-4 h-4 text-blue-300" />
            <span>Stock Screener</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                activeTree === 'EQUITIES' ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
              }`}
            >
              <span>{totalTickersCount}</span>
            </span>
          </button>

          {/* Mode 4: Quantitative Methodology */}
          <button
            onClick={() => onSelectTree('METHODOLOGY')}
            className={`flex items-center space-x-2 px-3 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
              activeTree === 'METHODOLOGY'
                ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-lg shadow-teal-600/30 ring-1 ring-teal-400/40'
                : 'bg-slate-900/90 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
            }`}
            aria-label="Methodology"
            aria-current={activeTree === 'METHODOLOGY' ? 'true' : undefined}
          >
            <BrainCircuit className="w-4 h-4 text-teal-300" />
            <span>Methodology</span>
          </button>

          {/* Mode 5: Investor FAQ */}
          <button
            onClick={() => onSelectTree('FAQ')}
            className={`flex items-center space-x-2 px-3 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
              activeTree === 'FAQ'
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-600/30 ring-1 ring-cyan-400/40'
                : 'bg-slate-900/90 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
            }`}
            aria-label="Investor FAQ"
            aria-current={activeTree === 'FAQ' ? 'true' : undefined}
          >
            <HelpCircle className="w-4 h-4 text-cyan-300" />
            <span>Investor FAQ</span>
          </button>

          {/* Mode 6: Regulatory Disclaimers */}
          <button
            onClick={() => onSelectTree('DISCLAIMER')}
            className={`flex items-center space-x-2 px-3 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
              activeTree === 'DISCLAIMER'
                ? 'bg-gradient-to-r from-rose-600 to-amber-600 text-white shadow-lg shadow-rose-600/30 ring-1 ring-rose-400/40'
                : 'bg-slate-900/90 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
            }`}
            aria-label="Disclaimers"
            aria-current={activeTree === 'DISCLAIMER' ? 'true' : undefined}
          >
            <ShieldCheck className="w-4 h-4 text-rose-300" />
            <span>Disclaimers</span>
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
          /* WORKFLOW MODE: Guided End-of-Week Ritual - Canonical Byte-Identical Labels */
          <div className="flex items-center space-x-2 min-w-max w-full">
            {/* Step 1: Upload Positions */}
            <button
              onClick={() => onSelectOptionsTab('SCHWAB_POSITIONS_UPLOAD')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer border ${
                activeOptionsTab === 'SCHWAB_POSITIONS_UPLOAD'
                  ? 'bg-emerald-600 text-white border-emerald-400 shadow-md shadow-emerald-600/30 ring-1 ring-emerald-400/50'
                  : 'bg-slate-900/90 text-slate-300 hover:text-white hover:bg-slate-800 border-slate-700/70'
              }`}
              title="Import your Schwab account positions and cash balances from CSV."
              aria-label="1. Upload Positions"
              aria-current={activeOptionsTab === 'SCHWAB_POSITIONS_UPLOAD' ? 'true' : undefined}
            >
              <span className="w-4 h-4 rounded-full bg-black/30 flex items-center justify-center text-[10px] font-mono">1</span>
              <Upload className="w-3.5 h-3.5 text-emerald-300" />
              <span>1. Upload Positions</span>
            </button>

            <span className="text-slate-600 text-xs">➔</span>

            {/* Step 2: Cash & Tax Ledger */}
            <button
              onClick={() => onSelectOptionsTab('WEEKLY_CASH_LEDGER')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer border ${
                activeOptionsTab === 'WEEKLY_CASH_LEDGER'
                  ? 'bg-emerald-600 text-white border-emerald-400 shadow-md shadow-emerald-600/30 ring-1 ring-emerald-400/50'
                  : 'bg-slate-900/90 text-slate-300 hover:text-white hover:bg-slate-800 border-slate-700/70'
              }`}
              title="Calculate deployable cash after deducting living expenses and tax liabilities."
              aria-label="2. Cash & Tax Ledger"
              aria-current={activeOptionsTab === 'WEEKLY_CASH_LEDGER' ? 'true' : undefined}
            >
              <span className="w-4 h-4 rounded-full bg-black/30 flex items-center justify-center text-[10px] font-mono">2</span>
              <DollarSign className="w-3.5 h-3.5 text-emerald-300" />
              <span>2. Cash &amp; Tax Ledger</span>
            </button>

            <span className="text-slate-600 text-xs">➔</span>

            {/* Step 3: Holdings & Covered Calls */}
            <button
              onClick={() => onSelectOptionsTab('HOLDINGS_COVERED_CALLS')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer border ${
                activeOptionsTab === 'HOLDINGS_COVERED_CALLS'
                  ? 'bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-600/30 ring-1 ring-indigo-400/50'
                  : 'bg-slate-900/90 text-slate-300 hover:text-white hover:bg-slate-800 border-slate-700/70'
              }`}
              title="Review stock holdings for 80% profit alerts and safe covered calls."
              aria-label="3. Holdings & Covered Calls"
              aria-current={activeOptionsTab === 'HOLDINGS_COVERED_CALLS' ? 'true' : undefined}
            >
              <span className="w-4 h-4 rounded-full bg-black/30 flex items-center justify-center text-[10px] font-mono">3</span>
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-300" />
              <span>3. Holdings &amp; Covered Calls</span>
              <span className="text-[10px] font-mono opacity-80">({targetDeltaPct}&Delta;)</span>
            </button>

            <span className="text-slate-600 text-xs">➔</span>

            {/* Step 4: Economic Calendar */}
            <button
              onClick={() => onSelectOptionsTab('ECONOMIC_CALENDAR')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer border ${
                activeOptionsTab === 'ECONOMIC_CALENDAR'
                  ? 'bg-blue-600 text-white border-blue-400 shadow-md shadow-blue-600/30 ring-1 ring-blue-400/50'
                  : 'bg-slate-900/90 text-slate-300 hover:text-white hover:bg-slate-800 border-slate-700/70'
              }`}
              title="Check upcoming high-impact economic events and Fed announcements this week."
              aria-label="4. Economic Calendar"
              aria-current={activeOptionsTab === 'ECONOMIC_CALENDAR' ? 'true' : undefined}
            >
              <span className="w-4 h-4 rounded-full bg-black/30 flex items-center justify-center text-[10px] font-mono">4</span>
              <Calendar className="w-3.5 h-3.5 text-blue-300" />
              <span>4. Economic Calendar</span>
            </button>

            <span className="text-slate-600 text-xs">➔</span>

            {/* Step 5: Weekly Shortlist Screener */}
            <button
              onClick={() => onSelectOptionsTab('CASCADING_SCREENER')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer border ${
                activeOptionsTab === 'CASCADING_SCREENER'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-emerald-400 shadow-md shadow-emerald-600/30 ring-1 ring-emerald-400/50'
                  : 'bg-slate-900/90 text-slate-300 hover:text-white hover:bg-slate-800 border-slate-700/70'
              }`}
              title="Run the 3-stage quantitative funnel and generate AI trade ideas."
              aria-label="5. Weekly Shortlist Screener"
              aria-current={activeOptionsTab === 'CASCADING_SCREENER' ? 'true' : undefined}
            >
              <span className="w-4 h-4 rounded-full bg-black/30 flex items-center justify-center text-[10px] font-mono">5</span>
              <Filter className="w-3.5 h-3.5 text-emerald-300" />
              <span>5. Weekly Shortlist Screener</span>
            </button>

            <span className="text-slate-600 text-xs">➔</span>

            {/* Step 6: Executive Report */}
            <button
              onClick={() => onSelectOptionsTab('WEEKLY_EXECUTIVE_REPORT')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer border ${
                activeOptionsTab === 'WEEKLY_EXECUTIVE_REPORT'
                  ? 'bg-amber-600 text-white border-amber-400 shadow-md shadow-amber-600/30 ring-1 ring-amber-400/50'
                  : 'bg-slate-900/90 text-slate-300 hover:text-white hover:bg-slate-800 border-slate-700/70'
              }`}
              title="Generate weekly compliance health score, theta income, and PDF summary."
              aria-label="6. Executive Report"
              aria-current={activeOptionsTab === 'WEEKLY_EXECUTIVE_REPORT' ? 'true' : undefined}
            >
              <span className="w-4 h-4 rounded-full bg-black/30 flex items-center justify-center text-[10px] font-mono">6</span>
              <Award className="w-3.5 h-3.5 text-amber-300" />
              <span>6. Executive Report</span>
            </button>

            <span className="text-slate-600 text-xs">➔</span>

            {/* Step 7: Order Staging */}
            <button
              onClick={() => onSelectOptionsTab('BROKER_STAGING')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer border ${
                activeOptionsTab === 'BROKER_STAGING'
                  ? 'bg-cyan-600 text-white border-cyan-400 shadow-md shadow-cyan-600/30 ring-1 ring-cyan-400/50'
                  : 'bg-slate-900/90 text-slate-300 hover:text-white hover:bg-slate-800 border-slate-700/70'
              }`}
              title="Review and prepare final trade orders before placing them at broker."
              aria-label="7. Order Staging"
              aria-current={activeOptionsTab === 'BROKER_STAGING' ? 'true' : undefined}
            >
              <span className="w-4 h-4 rounded-full bg-black/30 flex items-center justify-center text-[10px] font-mono">7</span>
              <Zap className="w-3.5 h-3.5 text-cyan-300" />
              <span>7. Order Staging</span>
            </button>
          </div>
        ) : activeTree === 'OPTIONS' ? (
          /* STRATEGY LABS MODE: Plain-Language Labels with Secondary Jargon */
          <div className="flex items-center space-x-2 min-w-max">
            {/* 1. Find Income Trades */}
            <button
              onClick={() => onSelectOptionsTab('INCOME_SCREENER')}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all border ${
                activeOptionsTab === 'INCOME_SCREENER'
                  ? 'bg-emerald-600 text-white border-emerald-400 shadow-md'
                  : 'bg-slate-900/90 text-slate-300 hover:text-white hover:bg-slate-800 border-slate-700/70'
              }`}
              title="Scan conservative options selling trades with high probability of profit."
              aria-label="Find Income Trades"
              aria-current={activeOptionsTab === 'INCOME_SCREENER' ? 'true' : undefined}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Find Income Trades</span>
              <span className="text-[10px] font-mono opacity-70">(CSPs &amp; CCs)</span>
            </button>

            {/* 2. Multi-Leg Spreads */}
            <button
              onClick={() => onSelectOptionsTab('MULTI_LEG_SPREADS')}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all border ${
                activeOptionsTab === 'MULTI_LEG_SPREADS'
                  ? 'bg-emerald-600 text-white border-emerald-400 shadow-md'
                  : 'bg-slate-900/90 text-slate-300 hover:text-white hover:bg-slate-800 border-slate-700/70'
              }`}
              title="Explore defined-risk option spreads, iron condors, and credit strategies."
              aria-label="Multi-Leg Spreads"
              aria-current={activeOptionsTab === 'MULTI_LEG_SPREADS' ? 'true' : undefined}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Multi-Leg Spreads</span>
              <span className="text-[10px] font-mono opacity-70">(Iron Condors)</span>
            </button>

            {/* 3. Poor Man's Covered Call */}
            <button
              onClick={() => onSelectOptionsTab('PMCC_SCREENER')}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all border ${
                activeOptionsTab === 'PMCC_SCREENER'
                  ? 'bg-purple-600 text-white border-purple-400 shadow-md'
                  : 'bg-slate-900/90 text-slate-300 hover:text-white hover:bg-slate-800 border-slate-700/70'
              }`}
              title="Scan long-term options paired with short calls for reduced capital."
              aria-label="Poor Man's Covered Call"
              aria-current={activeOptionsTab === 'PMCC_SCREENER' ? 'true' : undefined}
            >
              <TrendingUp className="w-3.5 h-3.5 text-purple-400" />
              <span>Poor Man's Covered Call</span>
              <span className="text-[10px] font-mono opacity-70">(PMCC)</span>
            </button>

            {/* 4. Option Chain Matrix */}
            <button
              onClick={() => onSelectOptionsTab('OPTION_CHAIN_MATRIX')}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all border ${
                activeOptionsTab === 'OPTION_CHAIN_MATRIX'
                  ? 'bg-cyan-600 text-white border-cyan-400 shadow-md'
                  : 'bg-slate-900/90 text-slate-300 hover:text-white hover:bg-slate-800 border-slate-700/70'
              }`}
              title="Browse complete option strike chains, bid-ask quotes, and Greek values."
              aria-label="Option Chain Matrix"
              aria-current={activeOptionsTab === 'OPTION_CHAIN_MATRIX' ? 'true' : undefined}
            >
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span>Option Chain Matrix</span>
              <span className="text-[10px] font-mono opacity-70">(Smile)</span>
            </button>

            {/* 5. Volatility Skew Radar */}
            <button
              onClick={() => onSelectOptionsTab('VOLATILITY_SKEW')}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all border ${
                activeOptionsTab === 'VOLATILITY_SKEW'
                  ? 'bg-emerald-600 text-white border-emerald-400 shadow-md'
                  : 'bg-slate-900/90 text-slate-300 hover:text-white hover:bg-slate-800 border-slate-700/70'
              }`}
              title="Measure market fear and institutional demand between put and call options."
              aria-label="Volatility Skew Radar"
              aria-current={activeOptionsTab === 'VOLATILITY_SKEW' ? 'true' : undefined}
            >
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              <span>Volatility Skew Radar</span>
              <span className="text-[10px] font-mono opacity-70">(25Δ)</span>
            </button>

            {/* 6. Margin Stress Simulator */}
            <button
              onClick={() => onSelectOptionsTab('PORTFOLIO_MARGIN_SIM')}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all border ${
                activeOptionsTab === 'PORTFOLIO_MARGIN_SIM'
                  ? 'bg-indigo-600 text-white border-indigo-400 shadow-md'
                  : 'bg-slate-900/90 text-slate-300 hover:text-white hover:bg-slate-800 border-slate-700/70'
              }`}
              title="Stress-test portfolio margin requirements against simulated 15% market crashes."
              aria-label="Margin Stress Simulator"
              aria-current={activeOptionsTab === 'PORTFOLIO_MARGIN_SIM' ? 'true' : undefined}
            >
              <Sliders className="w-3.5 h-3.5 text-indigo-400" />
              <span>Margin Stress Simulator</span>
              <span className="text-[10px] font-mono opacity-70">(TIMS ±15%)</span>
            </button>

            {/* 7. Roll Assistant */}
            <button
              onClick={() => onSelectOptionsTab('DEFENSIVE_ROLL_ASSISTANT')}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all border ${
                activeOptionsTab === 'DEFENSIVE_ROLL_ASSISTANT'
                  ? 'bg-amber-600 text-white border-amber-400 shadow-md'
                  : 'bg-slate-900/90 text-slate-300 hover:text-white hover:bg-slate-800 border-slate-700/70'
              }`}
              title="Find algorithmic roll adjustments for threatened positions to collect credits."
              aria-label="Roll Assistant"
              aria-current={activeOptionsTab === 'DEFENSIVE_ROLL_ASSISTANT' ? 'true' : undefined}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>Roll Assistant</span>
              <span className="text-[10px] font-mono opacity-70">(Repair)</span>
            </button>

            {/* 8. Tax Optimizer */}
            <button
              onClick={() => onSelectOptionsTab('TAX_ALPHA_OPTIMIZER')}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all border ${
                activeOptionsTab === 'TAX_ALPHA_OPTIMIZER'
                  ? 'bg-emerald-600 text-white border-emerald-400 shadow-md'
                  : 'bg-slate-900/90 text-slate-300 hover:text-white hover:bg-slate-800 border-slate-700/70'
              }`}
              title="Maximize tax efficiency using index options rules and loss harvesting."
              aria-label="Tax Optimizer"
              aria-current={activeOptionsTab === 'TAX_ALPHA_OPTIMIZER' ? 'true' : undefined}
            >
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
              <span>Tax Optimizer</span>
              <span className="text-[10px] font-mono opacity-70">(§1256)</span>
            </button>

            {/* 9. Options Income AI */}
            <button
              onClick={() => onSelectOptionsTab('AI_OPTIONS_INCOME')}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all border ${
                activeOptionsTab === 'AI_OPTIONS_INCOME'
                  ? 'bg-amber-600 text-white border-amber-400 shadow-md'
                  : 'bg-slate-900/90 text-slate-300 hover:text-white hover:bg-slate-800 border-slate-700/70'
              }`}
              title="Use AI extended thinking to analyze and rank weekly trade opportunities."
              aria-label="Options Income AI"
              aria-current={activeOptionsTab === 'AI_OPTIONS_INCOME' ? 'true' : undefined}
            >
              <BrainCircuit className="w-3.5 h-3.5 text-amber-300" />
              <span>Options Income AI</span>
              <span className="text-[10px] font-mono opacity-70">(Thinking)</span>
            </button>

            {/* 10. Strategy Backtester */}
            <button
              onClick={() => onSelectOptionsTab('BACKTEST_MARGIN')}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all border ${
                activeOptionsTab === 'BACKTEST_MARGIN'
                  ? 'bg-emerald-600 text-white border-emerald-400 shadow-md'
                  : 'bg-slate-900/90 text-slate-300 hover:text-white hover:bg-slate-800 border-slate-700/70'
              }`}
              title="Test conservative options selling rules against historical stock market data."
              aria-label="Strategy Backtester"
              aria-current={activeOptionsTab === 'BACKTEST_MARGIN' ? 'true' : undefined}
            >
              <BarChart2 className="w-3.5 h-3.5 text-purple-400" />
              <span>Strategy Backtester</span>
            </button>
          </div>
        ) : activeTree === 'EQUITIES' ? (
          /* EQUITIES MODE: Stock Screener, Charts & Fundamental Analysis */
          <div className="flex items-center space-x-2 min-w-max">
            {/* 1. Stock Screener */}
            <button
              onClick={() => onSelectEquitiesTab('TECHNICAL_SCREENER')}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all border ${
                activeEquitiesTab === 'TECHNICAL_SCREENER'
                  ? 'bg-blue-600 text-white border-blue-400 shadow-md'
                  : 'bg-slate-900/90 text-slate-300 hover:text-white hover:bg-slate-800 border-slate-700/70'
              }`}
              title="Scan US stocks by price, trend, moving averages, and volume."
              aria-label="Stock Screener"
              aria-current={activeEquitiesTab === 'TECHNICAL_SCREENER' ? 'true' : undefined}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Stock Screener</span>
            </button>

            {/* 2. Weekly Stock Picks */}
            <button
              onClick={() => onSelectEquitiesTab('WEEKLY_STOCK_SCREENERS')}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all border ${
                activeEquitiesTab === 'WEEKLY_STOCK_SCREENERS'
                  ? 'bg-emerald-600 text-white border-emerald-400 shadow-md'
                  : 'bg-slate-900/90 text-slate-300 hover:text-white hover:bg-slate-800 border-slate-700/70'
              }`}
              title="Filter top weekly momentum stocks and high-conviction buy ratings."
              aria-label="Weekly Stock Picks"
              aria-current={activeEquitiesTab === 'WEEKLY_STOCK_SCREENERS' ? 'true' : undefined}
            >
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>Weekly Stock Picks</span>
              <span className="text-[10px] font-mono opacity-70">(Barchart)</span>
            </button>

            {/* 3. Interactive Charts */}
            <button
              onClick={() => onSelectEquitiesTab('INTERACTIVE_CHARTS')}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all border ${
                activeEquitiesTab === 'INTERACTIVE_CHARTS'
                  ? 'bg-blue-600 text-white border-blue-400 shadow-md'
                  : 'bg-slate-900/90 text-slate-300 hover:text-white hover:bg-slate-800 border-slate-700/70'
              }`}
              title="Analyze candlestick price charts with technical indicators and support levels."
              aria-label="Interactive Charts"
              aria-current={activeEquitiesTab === 'INTERACTIVE_CHARTS' ? 'true' : undefined}
            >
              <BarChart2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>Interactive Charts</span>
            </button>

            {/* 4. Company Health & SEC */}
            <button
              onClick={() => onSelectEquitiesTab('FUNDAMENTAL_HEALTH')}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all border ${
                activeEquitiesTab === 'FUNDAMENTAL_HEALTH'
                  ? 'bg-blue-600 text-white border-blue-400 shadow-md'
                  : 'bg-slate-900/90 text-slate-300 hover:text-white hover:bg-slate-800 border-slate-700/70'
              }`}
              title="Examine company balance sheets, valuation ratios, and official SEC filings."
              aria-label="Company Health & SEC"
              aria-current={activeEquitiesTab === 'FUNDAMENTAL_HEALTH' ? 'true' : undefined}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Company Health &amp; SEC</span>
            </button>

            {/* 5. Trend & Support Map */}
            <button
              onClick={() => onSelectEquitiesTab('TREND_SUPPORT')}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all border ${
                activeEquitiesTab === 'TREND_SUPPORT'
                  ? 'bg-blue-600 text-white border-blue-400 shadow-md'
                  : 'bg-slate-900/90 text-slate-300 hover:text-white hover:bg-slate-800 border-slate-700/70'
              }`}
              title="Identify stocks trading near strong historical support and price floors."
              aria-label="Trend & Support Map"
              aria-current={activeEquitiesTab === 'TREND_SUPPORT' ? 'true' : undefined}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Trend &amp; Support Map</span>
            </button>

            {/* 6. Volatility Profiler */}
            <button
              onClick={() => onSelectEquitiesTab('VOLATILITY_RISK')}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all border ${
                activeEquitiesTab === 'VOLATILITY_RISK'
                  ? 'bg-blue-600 text-white border-blue-400 shadow-md'
                  : 'bg-slate-900/90 text-slate-300 hover:text-white hover:bg-slate-800 border-slate-700/70'
              }`}
              title="Rank stocks by implied volatility levels and historical price swings."
              aria-label="Volatility Profiler"
              aria-current={activeEquitiesTab === 'VOLATILITY_RISK' ? 'true' : undefined}
            >
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>Volatility Profiler</span>
            </button>

            {/* 7. Earnings Calendar */}
            <button
              onClick={() => onSelectEquitiesTab('EARNINGS_CALENDAR')}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all border ${
                activeEquitiesTab === 'EARNINGS_CALENDAR'
                  ? 'bg-blue-600 text-white border-blue-400 shadow-md'
                  : 'bg-slate-900/90 text-slate-300 hover:text-white hover:bg-slate-800 border-slate-700/70'
              }`}
              title="Monitor upcoming company earnings reports to avoid unexpected volatility shocks."
              aria-label="Earnings Calendar"
              aria-current={activeEquitiesTab === 'EARNINGS_CALENDAR' ? 'true' : undefined}
            >
              <Calendar className="w-3.5 h-3.5 text-rose-400" />
              <span>Earnings Calendar</span>
            </button>

            {/* 8. Economic Calendar */}
            <button
              onClick={() => onSelectEquitiesTab('ECONOMIC_CALENDAR')}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all border ${
                activeEquitiesTab === 'ECONOMIC_CALENDAR'
                  ? 'bg-blue-600 text-white border-blue-400 shadow-md'
                  : 'bg-slate-900/90 text-slate-300 hover:text-white hover:bg-slate-800 border-slate-700/70'
              }`}
              title="Track key macroeconomic release dates and market-moving catalyst events."
              aria-label="Economic Calendar"
              aria-current={activeEquitiesTab === 'ECONOMIC_CALENDAR' ? 'true' : undefined}
            >
              <Calendar className="w-3.5 h-3.5 text-blue-400" />
              <span>Economic Calendar</span>
            </button>

            {/* 9. Sector Overview */}
            <button
              onClick={() => onSelectEquitiesTab('SECTOR_OVERVIEW')}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all border ${
                activeEquitiesTab === 'SECTOR_OVERVIEW'
                  ? 'bg-blue-600 text-white border-blue-400 shadow-md'
                  : 'bg-slate-900/90 text-slate-300 hover:text-white hover:bg-slate-800 border-slate-700/70'
              }`}
              title="Compare performance and capital flow across major stock market sectors."
              aria-label="Sector Overview"
              aria-current={activeEquitiesTab === 'SECTOR_OVERVIEW' ? 'true' : undefined}
            >
              <PieChart className="w-3.5 h-3.5" />
              <span>Sector Overview</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center space-x-2 min-w-max w-full">
            <button
              onClick={() => onSelectTree('METHODOLOGY')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer border ${
                activeTree === 'METHODOLOGY'
                  ? 'bg-teal-600 text-white border-teal-400 shadow-md shadow-teal-600/30'
                  : 'bg-slate-900/90 text-slate-300 hover:text-white hover:bg-slate-800 border-slate-700/70'
              }`}
              aria-label="Methodology"
              aria-current={activeTree === 'METHODOLOGY' ? 'true' : undefined}
            >
              <BrainCircuit className="w-3.5 h-3.5 text-teal-300" />
              <span>Methodology</span>
            </button>

            <button
              onClick={() => onSelectTree('FAQ')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer border ${
                activeTree === 'FAQ'
                  ? 'bg-cyan-600 text-white border-cyan-400 shadow-md shadow-cyan-600/30'
                  : 'bg-slate-900/90 text-slate-300 hover:text-white hover:bg-slate-800 border-slate-700/70'
              }`}
              aria-label="Investor FAQ"
              aria-current={activeTree === 'FAQ' ? 'true' : undefined}
            >
              <HelpCircle className="w-3.5 h-3.5 text-cyan-300" />
              <span>Investor FAQ</span>
            </button>

            <button
              onClick={() => onSelectTree('DISCLAIMER')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer border ${
                activeTree === 'DISCLAIMER'
                  ? 'bg-rose-600 text-white border-rose-400 shadow-md shadow-rose-600/30'
                  : 'bg-slate-900/90 text-slate-300 hover:text-white hover:bg-slate-800 border-slate-700/70'
              }`}
              aria-label="Disclaimers"
              aria-current={activeTree === 'DISCLAIMER' ? 'true' : undefined}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-rose-300" />
              <span>Disclaimers</span>
            </button>

            <span className="text-slate-600 px-2">|</span>

            <button
              onClick={() => onSelectTree('WORKFLOW')}
              className="px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 bg-slate-900/90 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800 cursor-pointer"
              aria-label="Return to Workflow"
            >
              <span>Return to Workflow ➔</span>
            </button>
          </div>
        )}
      </div>

      {/* Screener Chooser Orientation Component: Rendered where screener concepts meet */}
      {isScreenerContext && (
        <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3 shadow-md animate-fade-in transition-all">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
            <div className="flex items-center space-x-2">
              <span className="text-sm">🧭</span>
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                What are you trying to do today?
              </span>
              <span className="text-[11px] text-slate-500 hidden sm:inline">
                — Choose the right screener for your goal
              </span>
            </div>
            <button
              onClick={toggleChooser}
              className="text-[11px] text-slate-400 hover:text-white flex items-center space-x-1 cursor-pointer transition-colors"
              title={isChooserExpanded ? 'Collapse orientation guide' : 'Expand orientation guide'}
              aria-label={isChooserExpanded ? 'Collapse orientation guide' : 'Expand orientation guide'}
            >
              <span>{isChooserExpanded ? 'Hide' : 'Show Guide'}</span>
              {isChooserExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          {isChooserExpanded && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-2.5">
              {/* Card 1: Find Stocks to Watch */}
              <div
                onClick={() => {
                  onSelectTree('EQUITIES');
                  onSelectEquitiesTab('TECHNICAL_SCREENER');
                }}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                  activeTree === 'EQUITIES' &&
                  (activeEquitiesTab === 'TECHNICAL_SCREENER' || activeEquitiesTab === 'WEEKLY_STOCK_SCREENERS')
                    ? 'bg-blue-950/40 border-blue-500/50 shadow-sm ring-1 ring-blue-500/30'
                    : 'bg-slate-900/60 border-slate-800 hover:bg-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="w-2 h-2 rounded-full bg-blue-400" />
                    <span className="text-xs font-bold text-blue-300">1. Find Stocks to Watch</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-snug">
                    Scan the broad US stock universe by price trend, moving averages, and technical indicators.
                  </p>
                </div>
                <div className="mt-2.5 flex items-center justify-between text-[11px] text-blue-400 font-semibold">
                  <span>Stock Screener</span>
                  <span>➔</span>
                </div>
              </div>

              {/* Card 2: Find Options Income Trades */}
              <div
                onClick={() => {
                  onSelectTree('OPTIONS');
                  onSelectOptionsTab('INCOME_SCREENER');
                }}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                  activeTree === 'OPTIONS' && activeOptionsTab === 'INCOME_SCREENER'
                    ? 'bg-emerald-950/40 border-emerald-500/50 shadow-sm ring-1 ring-emerald-500/30'
                    : 'bg-slate-900/60 border-slate-800 hover:bg-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="text-xs font-bold text-emerald-300">2. Find Income Trades</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-snug">
                    Screen conservative cash-secured puts &amp; covered calls positioned outside Bollinger Bands.
                  </p>
                </div>
                <div className="mt-2.5 flex items-center justify-between text-[11px] text-emerald-400 font-semibold">
                  <span>Find Income Trades</span>
                  <span>➔</span>
                </div>
              </div>

              {/* Card 3: Run the Weekly Shortlist */}
              <div
                onClick={() => {
                  onSelectTree('WORKFLOW');
                  onSelectOptionsTab('CASCADING_SCREENER');
                }}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                  activeTree === 'WORKFLOW' && activeOptionsTab === 'CASCADING_SCREENER'
                    ? 'bg-teal-950/40 border-teal-500/50 shadow-sm ring-1 ring-teal-500/30'
                    : 'bg-slate-900/60 border-slate-800 hover:bg-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="w-2 h-2 rounded-full bg-teal-400" />
                    <span className="text-xs font-bold text-teal-300">3. Run Weekly Shortlist</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-snug">
                    Walk the 7-step weekend ritual (Step 5) to filter high-conviction trades and generate AI recommendations.
                  </p>
                </div>
                <div className="mt-2.5 flex items-center justify-between text-[11px] text-teal-400 font-semibold">
                  <span>Step 5: Shortlist</span>
                  <span>➔</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
