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
}) => {
  return (
    <div className="space-y-3">
      {/* Primary Tree Selector Tabs */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center space-x-2">
          {/* Tree 1 Switcher */}
          <button
            onClick={() => onSelectTree('EQUITIES')}
            className={`flex items-center space-x-2.5 px-4 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all ${
              activeTree === 'EQUITIES'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/30'
                : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <BarChart2 className="w-4 h-4" />
            <span>US Equities Analysis</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                activeTree === 'EQUITIES' ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {totalTickersCount}
            </span>
          </button>

          {/* Tree 2 Switcher */}
          <button
            onClick={() => onSelectTree('OPTIONS')}
            className={`flex items-center space-x-2.5 px-4 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all ${
              activeTree === 'OPTIONS'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-600/30'
                : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Options &amp; Weekly Yield Engine</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                activeTree === 'OPTIONS' ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {weeklyCount} Wkly
            </span>
          </button>
        </div>

        <div className="hidden md:flex items-center space-x-3 text-xs text-slate-400">
          <span className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>{weeklyCount} Weeklys Active</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-slate-500" />
            <span>{monthlyCount} Monthly Only</span>
          </span>
        </div>
      </div>

      {/* Sub-Navigation Level for Active Tree */}
      <div className="glass-panel py-2.5 px-3 rounded-xl border border-slate-800/90 overflow-x-auto min-h-[58px] flex items-center shadow-lg">
        {activeTree === 'EQUITIES' ? (
          /* Tree 1: US Equities Sub-Navigation */
          <div className="flex items-center space-x-2 min-w-max">
            <button
              onClick={() => onSelectEquitiesTab('TECHNICAL_SCREENER')}
              className={`px-3.5 py-2.5 rounded-xl text-xs sm:text-[13px] font-bold flex items-center space-x-2 transition-all leading-normal border cursor-pointer ${
                activeEquitiesTab === 'TECHNICAL_SCREENER'
                  ? 'bg-blue-600 text-white border-blue-400 shadow-md shadow-blue-600/30 ring-1 ring-blue-400/50'
                  : 'bg-slate-900/90 text-slate-300 hover:text-white hover:bg-slate-800 border-slate-700/70 shadow-sm'
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>Technical Screener</span>
            </button>

            <button
              onClick={() => onSelectEquitiesTab('INTERACTIVE_CHARTS')}
              className={`px-3.5 py-2.5 rounded-xl text-xs sm:text-[13px] font-bold flex items-center space-x-2 transition-all leading-normal border cursor-pointer ${
                activeEquitiesTab === 'INTERACTIVE_CHARTS'
                  ? 'bg-blue-600 text-white border-blue-400 shadow-md shadow-blue-600/30 ring-1 ring-blue-400/50'
                  : 'bg-slate-900/90 text-slate-300 hover:text-white hover:bg-slate-800 border-slate-700/70 shadow-sm'
              }`}
            >
              <BarChart2 className="w-4 h-4 text-cyan-400" />
              <span>Interactive Candlestick Charts &amp; BB Envelopes</span>
            </button>

            <button
              onClick={() => onSelectEquitiesTab('FUNDAMENTAL_HEALTH')}
              className={`px-3.5 py-2.5 rounded-xl text-xs sm:text-[13px] font-bold flex items-center space-x-2 transition-all leading-normal border cursor-pointer ${
                activeEquitiesTab === 'FUNDAMENTAL_HEALTH'
                  ? 'bg-blue-600 text-white border-blue-400 shadow-md shadow-blue-600/30 ring-1 ring-blue-400/50'
                  : 'bg-slate-900/90 text-slate-300 hover:text-white hover:bg-slate-800 border-slate-700/70 shadow-sm'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Fundamental Health &amp; SEC EDGAR</span>
            </button>

            <button
              onClick={() => onSelectEquitiesTab('TREND_SUPPORT')}
              className={`px-3.5 py-2.5 rounded-xl text-xs sm:text-[13px] font-bold flex items-center space-x-2 transition-all leading-normal border cursor-pointer ${
                activeEquitiesTab === 'TREND_SUPPORT'
                  ? 'bg-blue-600 text-white border-blue-400 shadow-md shadow-blue-600/30 ring-1 ring-blue-400/50'
                  : 'bg-slate-900/90 text-slate-300 hover:text-white hover:bg-slate-800 border-slate-700/70 shadow-sm'
              }`}
            >
              <Compass className="w-4 h-4" />
              <span>Trend &amp; Support Map</span>
            </button>

            <button
              onClick={() => onSelectEquitiesTab('VOLATILITY_RISK')}
              className={`px-3.5 py-2.5 rounded-xl text-xs sm:text-[13px] font-bold flex items-center space-x-2 transition-all leading-normal border cursor-pointer ${
                activeEquitiesTab === 'VOLATILITY_RISK'
                  ? 'bg-blue-600 text-white border-blue-400 shadow-md shadow-blue-600/30 ring-1 ring-blue-400/50'
                  : 'bg-slate-900/90 text-slate-300 hover:text-white hover:bg-slate-800 border-slate-700/70 shadow-sm'
              }`}
            >
              <Flame className="w-4 h-4 text-amber-400" />
              <span>Volatility &amp; Risk Profiler</span>
              {highIvrCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-500/20 text-amber-300 font-mono">
                  {highIvrCount}
                </span>
              )}
            </button>

            <button
              onClick={() => onSelectEquitiesTab('EARNINGS_CALENDAR')}
              className={`px-3.5 py-2.5 rounded-xl text-xs sm:text-[13px] font-bold flex items-center space-x-2 transition-all leading-normal border cursor-pointer ${
                activeEquitiesTab === 'EARNINGS_CALENDAR'
                  ? 'bg-blue-600 text-white border-blue-400 shadow-md shadow-blue-600/30 ring-1 ring-blue-400/50'
                  : 'bg-slate-900/90 text-slate-300 hover:text-white hover:bg-slate-800 border-slate-700/70 shadow-sm'
              }`}
            >
              <Calendar className="w-4 h-4 text-rose-400" />
              <span>Earnings Calendar &amp; Risk</span>
              {earningsAlertCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-rose-500/20 text-rose-300 font-mono">
                  {earningsAlertCount}
                </span>
              )}
            </button>

            <button
              onClick={() => onSelectEquitiesTab('SECTOR_OVERVIEW')}
              className={`px-3.5 py-2.5 rounded-xl text-xs sm:text-[13px] font-bold flex items-center space-x-2 transition-all leading-normal border cursor-pointer ${
                activeEquitiesTab === 'SECTOR_OVERVIEW'
                  ? 'bg-blue-600 text-white border-blue-400 shadow-md shadow-blue-600/30 ring-1 ring-blue-400/50'
                  : 'bg-slate-900/90 text-slate-300 hover:text-white hover:bg-slate-800 border-slate-700/70 shadow-sm'
              }`}
            >
              <PieChart className="w-4 h-4" />
              <span>Sector &amp; Universe Overview</span>
            </button>
          </div>
        ) : (
          /* Tree 2: Options & Weekly Engine Sub-Navigation */
          <div className="flex items-center space-x-2 min-w-max">
            <button
              onClick={() => onSelectOptionsTab('INCOME_SCREENER')}
              className={`px-3.5 py-2.5 rounded-xl text-xs sm:text-[13px] font-bold flex items-center space-x-2 transition-all leading-normal border cursor-pointer ${
                activeOptionsTab === 'INCOME_SCREENER'
                  ? 'bg-emerald-600 text-white border-emerald-400 shadow-md shadow-emerald-600/30 ring-1 ring-emerald-400/50'
                  : 'bg-slate-900/90 text-slate-300 hover:text-white hover:bg-slate-800 border-slate-700/70 shadow-sm'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>Conservative Income (CSPs &amp; CCs)</span>
            </button>

            <button
              onClick={() => onSelectOptionsTab('MULTI_LEG_SPREADS')}
              className={`px-3.5 py-2.5 rounded-xl text-xs sm:text-[13px] font-bold flex items-center space-x-2 transition-all leading-normal border cursor-pointer ${
                activeOptionsTab === 'MULTI_LEG_SPREADS'
                  ? 'bg-emerald-600 text-white border-emerald-400 shadow-md shadow-emerald-600/30 ring-1 ring-emerald-400/50'
                  : 'bg-slate-900/90 text-slate-300 hover:text-white hover:bg-slate-800 border-slate-700/70 shadow-sm'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Multi-Leg Spreads &amp; Iron Condors</span>
            </button>

            <button
              onClick={() => onSelectOptionsTab('OPTION_CHAIN_MATRIX')}
              className={`px-3.5 py-2.5 rounded-xl text-xs sm:text-[13px] font-bold flex items-center space-x-2 transition-all leading-normal border cursor-pointer ${
                activeOptionsTab === 'OPTION_CHAIN_MATRIX'
                  ? 'bg-cyan-600 text-white border-cyan-400 shadow-md shadow-cyan-600/30 ring-1 ring-cyan-400/50'
                  : 'bg-slate-900/90 text-slate-300 hover:text-white hover:bg-slate-800 border-slate-700/70 shadow-sm'
              }`}
            >
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>Option Chain &amp; IV Smile</span>
            </button>

            <button
              onClick={() => onSelectOptionsTab('PMCC_SCREENER')}
              className={`px-3.5 py-2.5 rounded-xl text-xs sm:text-[13px] font-bold flex items-center space-x-2 transition-all leading-normal border cursor-pointer ${
                activeOptionsTab === 'PMCC_SCREENER'
                  ? 'bg-purple-600 text-white border-purple-400 shadow-md shadow-purple-600/30 ring-1 ring-purple-400/50'
                  : 'bg-slate-900/90 text-slate-300 hover:text-white hover:bg-slate-800 border-slate-700/70 shadow-sm'
              }`}
            >
              <TrendingUp className="w-4 h-4 text-purple-400" />
              <span>Poor Man’s Covered Call (PMCC)</span>
            </button>

            <button
              onClick={() => onSelectOptionsTab('PORTFOLIO_MARGIN_SIM')}
              className={`px-3.5 py-2.5 rounded-xl text-xs sm:text-[13px] font-bold flex items-center space-x-2 transition-all leading-normal border cursor-pointer ${
                activeOptionsTab === 'PORTFOLIO_MARGIN_SIM'
                  ? 'bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-600/30 ring-1 ring-indigo-400/50'
                  : 'bg-slate-900/90 text-slate-300 hover:text-white hover:bg-slate-800 border-slate-700/70 shadow-sm'
              }`}
            >
              <Sliders className="w-4 h-4 text-indigo-400" />
              <span>Portfolio Margin &amp; Stress Sim</span>
            </button>

            <button
              onClick={() => onSelectOptionsTab('VOLATILITY_SKEW')}
              className={`px-3.5 py-2.5 rounded-xl text-xs sm:text-[13px] font-bold flex items-center space-x-2 transition-all leading-normal border cursor-pointer ${
                activeOptionsTab === 'VOLATILITY_SKEW'
                  ? 'bg-emerald-600 text-white border-emerald-400 shadow-md shadow-emerald-600/30 ring-1 ring-emerald-400/50'
                  : 'bg-slate-900/90 text-slate-300 hover:text-white hover:bg-slate-800 border-slate-700/70 shadow-sm'
              }`}
            >
              <Activity className="w-4 h-4 text-cyan-400" />
              <span>25Δ Volatility Skew &amp; Term Structure</span>
            </button>

            <button
              onClick={() => onSelectOptionsTab('BACKTEST_MARGIN')}
              className={`px-3.5 py-2.5 rounded-xl text-xs sm:text-[13px] font-bold flex items-center space-x-2 transition-all leading-normal border cursor-pointer ${
                activeOptionsTab === 'BACKTEST_MARGIN'
                  ? 'bg-emerald-600 text-white border-emerald-400 shadow-md shadow-emerald-600/30 ring-1 ring-emerald-400/50'
                  : 'bg-slate-900/90 text-slate-300 hover:text-white hover:bg-slate-800 border-slate-700/70 shadow-sm'
              }`}
            >
              <BarChart2 className="w-4 h-4 text-purple-400" />
              <span>Backtester &amp; Margin Stress-Test</span>
            </button>

            <button
              onClick={() => onSelectOptionsTab('BROKER_STAGING')}
              className={`px-3.5 py-2.5 rounded-xl text-xs sm:text-[13px] font-bold flex items-center space-x-2 transition-all leading-normal border cursor-pointer ${
                activeOptionsTab === 'BROKER_STAGING'
                  ? 'bg-emerald-600 text-white border-emerald-400 shadow-md shadow-emerald-600/30 ring-1 ring-emerald-400/50'
                  : 'bg-slate-900/90 text-slate-300 hover:text-white hover:bg-slate-800 border-slate-700/70 shadow-sm'
              }`}
            >
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Broker Staging &amp; Order Payloads</span>
            </button>

            <button
              onClick={() => onSelectOptionsTab('EXPIRATION_CADENCE')}
              className={`px-3.5 py-2.5 rounded-xl text-xs sm:text-[13px] font-bold flex items-center space-x-2 transition-all leading-normal border cursor-pointer ${
                activeOptionsTab === 'EXPIRATION_CADENCE'
                  ? 'bg-emerald-600 text-white border-emerald-400 shadow-md shadow-emerald-600/30 ring-1 ring-emerald-400/50'
                  : 'bg-slate-900/90 text-slate-300 hover:text-white hover:bg-slate-800 border-slate-700/70 shadow-sm'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Expiration Cadence &amp; CBOE Registry</span>
            </button>

            <button
              onClick={() => onSelectOptionsTab('DELTA_GREEKS')}
              className={`px-3.5 py-2.5 rounded-xl text-xs sm:text-[13px] font-bold flex items-center space-x-2 transition-all leading-normal border cursor-pointer ${
                activeOptionsTab === 'DELTA_GREEKS'
                  ? 'bg-emerald-600 text-white border-emerald-400 shadow-md shadow-emerald-600/30 ring-1 ring-emerald-400/50'
                  : 'bg-slate-900/90 text-slate-300 hover:text-white hover:bg-slate-800 border-slate-700/70 shadow-sm'
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>Delta Harvest &amp; Greeks Radar</span>
            </button>

            <button
              onClick={() => onSelectOptionsTab('TICKER_AUDIT')}
              className={`px-3.5 py-2.5 rounded-xl text-xs sm:text-[13px] font-bold flex items-center space-x-2 transition-all leading-normal border cursor-pointer ${
                activeOptionsTab === 'TICKER_AUDIT'
                  ? 'bg-emerald-600 text-white border-emerald-400 shadow-md shadow-emerald-600/30 ring-1 ring-emerald-400/50'
                  : 'bg-slate-900/90 text-slate-300 hover:text-white hover:bg-slate-800 border-slate-700/70 shadow-sm'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>5-Part Options Safety Audit</span>
            </button>

            <button
              onClick={() => onSelectOptionsTab('INCOME_CALCULATOR')}
              className={`px-3.5 py-2.5 rounded-xl text-xs sm:text-[13px] font-bold flex items-center space-x-2 transition-all leading-normal border cursor-pointer ${
                activeOptionsTab === 'INCOME_CALCULATOR'
                  ? 'bg-emerald-600 text-white border-emerald-400 shadow-md shadow-emerald-600/30 ring-1 ring-emerald-400/50'
                  : 'bg-slate-900/90 text-slate-300 hover:text-white hover:bg-slate-800 border-slate-700/70 shadow-sm'
              }`}
            >
              <Calculator className="w-4 h-4 text-cyan-400" />
              <span>Cash Income Calculator</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
