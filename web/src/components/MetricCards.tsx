import React from 'react';
import { DollarSign, ShieldAlert, Sparkles, Percent, Target } from './icons';
import { ScreenerSummary, OptionOpportunity } from '../types/options';

interface MetricCardsProps {
  summary: ScreenerSummary | null;
  filteredCount: number;
  filteredOpportunities: OptionOpportunity[];
}

export const MetricCards: React.FC<MetricCardsProps> = ({
  summary,
  filteredCount,
  filteredOpportunities,
}) => {
  const avgFilteredYield =
    filteredOpportunities.length > 0
      ? (
          filteredOpportunities.reduce((acc, o) => acc + o.annualized_roc, 0) /
          filteredOpportunities.length
        ).toFixed(1)
      : '0.0';

  const avgPop =
    filteredOpportunities.length > 0
      ? (
          filteredOpportunities.reduce((acc, o) => acc + o.pop_pct, 0) /
          filteredOpportunities.length
        ).toFixed(1)
      : '0.0';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Metric 1: Avg Filtered Yield */}
      <div className="glass-panel p-4 rounded-xl relative overflow-hidden group border border-emerald-500/20 hover:border-emerald-500/40 transition-all">
        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
          <Percent className="w-16 h-16 text-emerald-400" />
        </div>
        <div className="flex items-center space-x-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
          <DollarSign className="w-4 h-4 text-emerald-400" />
          <span>Avg Annualized Yield</span>
        </div>
        <div className="flex items-baseline space-x-2">
          <span className="text-3xl font-black font-mono text-emerald-400 tracking-tight">
            {avgFilteredYield}%
          </span>
          <span className="text-xs text-slate-400">ROC / yr</span>
        </div>
        <div className="text-[11px] text-slate-400 mt-2 flex items-center justify-between">
          <span>Targeting weekly theta decay</span>
          <span className="text-emerald-400/80 font-medium">Weekly Income</span>
        </div>
      </div>

      {/* Metric 2: Average Probability of Profit */}
      <div className="glass-panel p-4 rounded-xl relative overflow-hidden group border border-cyan-500/20 hover:border-cyan-500/40 transition-all">
        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
          <Target className="w-16 h-16 text-cyan-400" />
        </div>
        <div className="flex items-center space-x-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
          <Target className="w-4 h-4 text-cyan-400" />
          <span>Avg Win Probability</span>
        </div>
        <div className="flex items-baseline space-x-2">
          <span className="text-3xl font-black font-mono text-cyan-400 tracking-tight">
            {avgPop}%
          </span>
          <span className="text-xs text-slate-400">POP</span>
        </div>
        <div className="text-[11px] text-slate-400 mt-2 flex items-center justify-between">
          <span>Based on Black-Scholes Delta</span>
          <span className="text-cyan-400/80 font-medium">Conservative</span>
        </div>
      </div>

      {/* Metric 3: Active Opportunities Count */}
      <div className="glass-panel p-4 rounded-xl relative overflow-hidden group border border-slate-800 hover:border-slate-700 transition-all">
        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
          <Sparkles className="w-16 h-16 text-amber-400" />
        </div>
        <div className="flex items-center space-x-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>Matches Filter Criteria</span>
        </div>
        <div className="flex items-baseline space-x-2">
          <span className="text-3xl font-black font-mono text-white tracking-tight">
            {filteredCount}
          </span>
          <span className="text-xs text-slate-400">contracts</span>
        </div>
        <div className="text-[11px] text-slate-400 mt-2 flex items-center justify-between">
          <span>From {summary?.total_screened_tickers || 16} liquid underlying assets</span>
          <span className="text-amber-400/80 font-medium">Liquid</span>
        </div>
      </div>

      {/* Metric 4: High Volatility Plays */}
      <div className="glass-panel p-4 rounded-xl relative overflow-hidden group border border-indigo-500/20 hover:border-indigo-500/40 transition-all">
        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
          <ShieldAlert className="w-16 h-16 text-indigo-400" />
        </div>
        <div className="flex items-center space-x-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
          <ShieldAlert className="w-4 h-4 text-indigo-400" />
          <span>Top Volatility Leaders</span>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap mt-1">
          {summary?.top_volatility_tickers.slice(0, 4).map((t) => (
            <span
              key={t.symbol}
              className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-xs font-mono font-medium bg-slate-900 border border-slate-700 text-indigo-300"
            >
              <span>{t.symbol}</span>
              <span className="text-[10px] text-indigo-400/70">IVR {t.iv_rank}</span>
            </span>
          ))}
        </div>
        <div className="text-[11px] text-slate-400 mt-2 flex items-center justify-between">
          <span>High IV expansion = Richer premiums</span>
          <span className="text-indigo-400/80 font-medium">Prime Sellers</span>
        </div>
      </div>
    </div>
  );
};
