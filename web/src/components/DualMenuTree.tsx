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
      <div className="glass-panel p-2 rounded-xl border border-slate-800/90 overflow-x-auto">
        {activeTree === 'EQUITIES' ? (
          /* Tree 1: US Equities Sub-Navigation */
          <div className="flex items-center space-x-1 min-w-max">
            <button
              onClick={() => onSelectEquitiesTab('TECHNICAL_SCREENER')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all ${
                activeEquitiesTab === 'TECHNICAL_SCREENER'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Technical Screener &amp; Bollinger Bands</span>
            </button>

            <button
              onClick={() => onSelectEquitiesTab('TREND_SUPPORT')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all ${
                activeEquitiesTab === 'TREND_SUPPORT'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Trend &amp; Support Map</span>
            </button>

            <button
              onClick={() => onSelectEquitiesTab('VOLATILITY_RISK')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all ${
                activeEquitiesTab === 'VOLATILITY_RISK'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>Volatility &amp; Risk Profiler</span>
              {highIvrCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500/20 text-amber-300 font-mono">
                  {highIvrCount}
                </span>
              )}
            </button>

            <button
              onClick={() => onSelectEquitiesTab('EARNINGS_CALENDAR')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all ${
                activeEquitiesTab === 'EARNINGS_CALENDAR'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Calendar className="w-3.5 h-3.5 text-rose-400" />
              <span>Earnings Calendar &amp; Risk</span>
              {earningsAlertCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500/20 text-rose-300 font-mono">
                  {earningsAlertCount}
                </span>
              )}
            </button>

            <button
              onClick={() => onSelectEquitiesTab('SECTOR_OVERVIEW')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all ${
                activeEquitiesTab === 'SECTOR_OVERVIEW'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <PieChart className="w-3.5 h-3.5" />
              <span>Sector &amp; Universe Overview</span>
            </button>
          </div>
        ) : (
          /* Tree 2: Options & Weekly Engine Sub-Navigation */
          <div className="flex items-center space-x-1 min-w-max">
            <button
              onClick={() => onSelectOptionsTab('INCOME_SCREENER')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all ${
                activeOptionsTab === 'INCOME_SCREENER'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Conservative Income Screener (CSPs &amp; CCs)</span>
            </button>

            <button
              onClick={() => onSelectOptionsTab('EXPIRATION_CADENCE')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all ${
                activeOptionsTab === 'EXPIRATION_CADENCE'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Expiration Cadence &amp; CBOE Registry</span>
            </button>

            <button
              onClick={() => onSelectOptionsTab('DELTA_GREEKS')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all ${
                activeOptionsTab === 'DELTA_GREEKS'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Delta Harvest &amp; Greeks Radar</span>
            </button>

            <button
              onClick={() => onSelectOptionsTab('TICKER_AUDIT')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all ${
                activeOptionsTab === 'TICKER_AUDIT'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>5-Part Options Safety Audit</span>
            </button>

            <button
              onClick={() => onSelectOptionsTab('INCOME_CALCULATOR')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all ${
                activeOptionsTab === 'INCOME_CALCULATOR'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Calculator className="w-3.5 h-3.5 text-cyan-400" />
              <span>Cash Income Calculator</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
