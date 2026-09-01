import React, { useMemo } from 'react';
import {
  X,
  ShieldCheck,
  TrendingUp,
  DollarSign,
  Clock,
  Target,
  BarChart2,
  CheckCircle,
  HelpCircle,
  Zap,
  Award,
  Newspaper,
  Flame,
} from './icons';
import { OptionOpportunity } from '../types/options';
import { getSecurityIntelligence } from '../utils/securityIntelligence';

interface OptionDetailModalProps {
  opportunity: OptionOpportunity | null;
  onClose: () => void;
  onOpenCalculator: (opportunity: OptionOpportunity) => void;
  onStageOrder?: (opportunity: OptionOpportunity) => void;
}

export const OptionDetailModal: React.FC<OptionDetailModalProps> = ({
  opportunity,
  onClose,
  onOpenCalculator,
  onStageOrder,
}) => {
  if (!opportunity) return null;

  const isCSP = opportunity.strategy === 'CSP';
  const intel = useMemo(() => getSecurityIntelligence(opportunity.symbol), [opportunity.symbol]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="glass-panel w-full max-w-3xl rounded-2xl border border-slate-700/80 shadow-2xl overflow-hidden text-slate-200 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-md ${
                isCSP
                  ? 'bg-emerald-600 shadow-emerald-600/30'
                  : 'bg-cyan-600 shadow-cyan-600/30'
              }`}
            >
              {isCSP ? <ShieldCheck className="w-6 h-6" /> : <TrendingUp className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-black font-mono text-white">
                  {opportunity.symbol}
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-medium">
                  ${opportunity.strike} {opportunity.type.toUpperCase()}
                </span>
                <span
                  className={`text-xs px-2 py-0.5 rounded font-semibold border ${
                    isCSP
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                  }`}
                >
                  {opportunity.strategy_name}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {opportunity.name} • {opportunity.sector} • Expires {opportunity.expiration} ({opportunity.dte} days)
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

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Key Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
              <div className="text-[11px] text-slate-400 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                <span>Annualized Yield</span>
              </div>
              <div className="text-2xl font-black font-mono text-emerald-400 mt-1">
                {opportunity.annualized_roc}%
              </div>
              <div className="text-[10px] text-slate-400">
                {opportunity.roc_pct}% in {opportunity.dte} days
              </div>
            </div>

            <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
              <div className="text-[11px] text-slate-400 flex items-center gap-1">
                <Target className="w-3.5 h-3.5 text-cyan-400" />
                <span>Win Probability (POP)</span>
              </div>
              <div className="text-2xl font-black font-mono text-cyan-400 mt-1">
                {opportunity.pop_pct}%
              </div>
              <div className="text-[10px] text-slate-400">
                Delta: {opportunity.abs_delta.toFixed(2)}
              </div>
            </div>

            <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
              <div className="text-[11px] text-slate-400 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Total Cash Inflow</span>
              </div>
              <div className="text-2xl font-black font-mono text-white mt-1">
                +${opportunity.premium_total}
              </div>
              <div className="text-[10px] text-slate-400">
                ${opportunity.mid.toFixed(2)} / share
              </div>
            </div>

            <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
              <div className="text-[11px] text-slate-400 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Safety Cushion</span>
              </div>
              <div className="text-2xl font-black font-mono text-emerald-300 mt-1">
                {opportunity.cushion_pct}%
              </div>
              <div className="text-[10px] text-slate-400">
                Breakeven: ${opportunity.breakeven}
              </div>
            </div>
          </div>

          {/* Underlying AI Health & News Catalyst Banner */}
          <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      Underlying AI Health &amp; Solvency Score
                    </span>
                    <span className="px-2 py-0.5 rounded font-mono font-bold text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      {intel.compositeScore} / 100 ({intel.sentimentLabel})
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    Wall St Consensus: <strong className="text-slate-200">{intel.analystConsensus}</strong> • Target: <strong className="text-emerald-400 font-mono">${intel.targetPrice.toFixed(2)} (+{intel.upsidePct}%)</strong>
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-2 font-mono text-[11px]">
                <span className="text-slate-400">Support Floor: <strong className="text-emerald-400">${intel.keySupportPrice.toFixed(2)}</strong></span>
                <span className="text-slate-600">•</span>
                <span className="text-slate-400">Resistance: <strong className="text-cyan-400">${intel.keyResistancePrice.toFixed(2)}</strong></span>
              </div>
            </div>

            {intel.recentNews[0] && (
              <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-[11px] flex items-start gap-2">
                <Newspaper className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <div className="flex items-center space-x-2">
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                      {intel.recentNews[0].category}
                    </span>
                    <strong className="text-white">{intel.recentNews[0].headline}</strong>
                    <span className="text-[10px] text-slate-500 font-mono">({intel.recentNews[0].source})</span>
                  </div>
                  <p className="text-slate-400 leading-snug">{intel.recentNews[0].optionsImplication}</p>
                </div>
              </div>
            )}
          </div>

          {/* Trade Economics & Greeks Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Column 1: Trade Economics */}
            <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-2.5">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                <span>Trade Economics (Per 1 Contract)</span>
              </h3>

              <div className="flex justify-between text-xs py-1 border-b border-slate-800/80">
                <span className="text-slate-400">Underlying Spot Price:</span>
                <span className="font-mono text-white">${opportunity.current_price.toFixed(2)}</span>
              </div>

              <div className="flex justify-between text-xs py-1 border-b border-slate-800/80">
                <span className="text-slate-400">Contract Strike:</span>
                <span className="font-mono text-white">${opportunity.strike.toFixed(2)}</span>
              </div>

              <div className="flex justify-between text-xs py-1 border-b border-slate-800/80">
                <span className="text-slate-400">Bid / Ask Spread:</span>
                <span className="font-mono text-slate-300">
                  ${opportunity.bid.toFixed(2)} - ${opportunity.ask.toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between text-xs py-1 border-b border-slate-800/80">
                <span className="text-slate-400">Collateral Required:</span>
                <span className="font-mono text-amber-300 font-semibold">
                  ${opportunity.collateral_required.toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between text-xs py-1 border-b border-slate-800/80">
                <span className="text-slate-400">Net Cash Collected:</span>
                <span className="font-mono text-emerald-400 font-bold">
                  +${opportunity.premium_total.toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between text-xs py-1">
                <span className="text-slate-400">Effective Breakeven:</span>
                <span className="font-mono text-cyan-300 font-semibold">
                  ${opportunity.breakeven.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Column 2: Greeks & Technical Analysis */}
            <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-2.5">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                <BarChart2 className="w-4 h-4 text-cyan-400" />
                <span>Greeks & Technical Profile</span>
              </h3>

              <div className="flex justify-between text-xs py-1 border-b border-slate-800/80">
                <span className="text-slate-400">Delta (Δ):</span>
                <span className="font-mono text-slate-200">
                  {opportunity.delta} (POP: {opportunity.pop_pct}%)
                </span>
              </div>

              <div className="flex justify-between text-xs py-1 border-b border-slate-800/80">
                <span className="text-slate-400">Daily Theta Decay (Θ):</span>
                <span className="font-mono text-emerald-400 font-semibold">
                  +${Math.abs(opportunity.theta * 100).toFixed(2)} / day
                </span>
              </div>

              <div className="flex justify-between text-xs py-1 border-b border-slate-800/80">
                <span className="text-slate-400">Implied Volatility (IV):</span>
                <span className="font-mono text-slate-200">
                  {opportunity.iv}% (IV Rank: {opportunity.iv_rank}/100)
                </span>
              </div>

              <div className="flex justify-between text-xs py-1 border-b border-slate-800/80">
                <span className="text-slate-400">14-Day RSI:</span>
                <span className="font-mono text-slate-200">
                  {opportunity.rsi} ({opportunity.rsi < 40 ? 'Oversold Dip' : 'Neutral Range'})
                </span>
              </div>

              <div className="flex justify-between text-xs py-1 border-b border-slate-800/80">
                <span className="text-slate-400">Key Support Level:</span>
                <span className="font-mono text-emerald-400">
                  ${opportunity.support_level} ({opportunity.dist_to_support}% below spot)
                </span>
              </div>

              <div className="flex justify-between text-xs py-1">
                <span className="text-slate-400">Trend Assessment:</span>
                <span className="font-medium text-slate-200">{opportunity.trend}</span>
              </div>
            </div>
          </div>

          {/* Expiration Scenarios */}
          <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800 space-y-2">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>Expiration Outcome Playbook</span>
            </h4>

            {isCSP ? (
              <div className="space-y-2 text-xs text-slate-300">
                <div className="flex items-start space-x-2 bg-slate-900/80 p-2.5 rounded-lg border border-emerald-500/20">
                  <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono text-[10px] font-bold">
                    SCENARIO A
                  </span>
                  <div>
                    <span className="font-semibold text-white">Stock stays above ${opportunity.strike}</span>: 
                    Contract expires 100% worthless. You keep the full <strong>${opportunity.premium_total}</strong> cash profit, releasing your <strong>${opportunity.collateral_required.toLocaleString()}</strong> collateral to repeat the cycle next week.
                  </div>
                </div>

                <div className="flex items-start space-x-2 bg-slate-900/80 p-2.5 rounded-lg border border-cyan-500/20">
                  <span className="px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-400 font-mono text-[10px] font-bold">
                    SCENARIO B
                  </span>
                  <div>
                    <span className="font-semibold text-white">Stock drops below ${opportunity.strike}</span>: 
                    You are assigned 100 shares of {opportunity.symbol} at ${opportunity.strike}. Your effective net purchase price is only <strong>${opportunity.breakeven}</strong> (a {opportunity.cushion_pct}% discount from today's price). You can immediately start selling Covered Calls on them.
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2 text-xs text-slate-300">
                <div className="flex items-start space-x-2 bg-slate-900/80 p-2.5 rounded-lg border border-cyan-500/20">
                  <span className="px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-400 font-mono text-[10px] font-bold">
                    SCENARIO A
                  </span>
                  <div>
                    <span className="font-semibold text-white">Stock stays below ${opportunity.strike}</span>: 
                    Contract expires worthless. You keep 100% of your shares plus the <strong>${opportunity.premium_total}</strong> collected cash income.
                  </div>
                </div>

                <div className="flex items-start space-x-2 bg-slate-900/80 p-2.5 rounded-lg border border-emerald-500/20">
                  <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono text-[10px] font-bold">
                    SCENARIO B
                  </span>
                  <div>
                    <span className="font-semibold text-white">Stock surges above ${opportunity.strike}</span>: 
                    Shares are called away at ${opportunity.strike}. You capture the <strong>${opportunity.premium_total}</strong> premium plus the capital gain from current price to strike, achieving max return of {opportunity.max_return_pct || opportunity.roc_pct}%.
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs text-slate-400">
            <HelpCircle className="w-4 h-4 text-slate-500" />
            <span>Black-Scholes Theoretical Greeks • 4.5% Risk-Free Rate</span>
          </div>

          <div className="flex items-center space-x-3">
            {onStageOrder && (
              <button
                onClick={() => {
                  onClose();
                  onStageOrder(opportunity);
                }}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-amber-500/20 text-amber-400 hover:text-amber-300 border border-slate-700 transition-all flex items-center space-x-1.5 shadow-sm"
              >
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Stage Broker Order</span>
              </button>
            )}
            <button
              onClick={() => {
                onClose();
                onOpenCalculator(opportunity);
              }}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 transition-all flex items-center space-x-1.5"
            >
              <span>Calculate Income Portfolio</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
