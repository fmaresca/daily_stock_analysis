import React from 'react';
import {
  Calculator,
  ChevronRight,
  ShieldCheck,
  TrendingUp,
  Zap,
} from '../icons';
import { OptionOpportunity } from '../../types/options';

interface ScreenerRowProps {
  opportunity: OptionOpportunity;
  onSelectOpportunity: (opportunity: OptionOpportunity) => void;
  onOpenCalculator: (opportunity: OptionOpportunity) => void;
  onStageOrder?: (opportunity: OptionOpportunity) => void;
  onOpenSimulator?: (opportunity: OptionOpportunity) => void;
}

export const ScreenerRow: React.FC<ScreenerRowProps> = React.memo(({
  opportunity: opp,
  onSelectOpportunity,
  onOpenCalculator,
  onStageOrder,
  onOpenSimulator,
}) => {
  const isCSP = opp.strategy === 'CSP';

  return (
    <tr
      className="hover:bg-slate-900/80 transition-colors group cursor-pointer"
      onClick={() => onSelectOpportunity(opp)}
    >
      {/* Symbol & Name */}
      <td className="py-3 px-4">
        <div className="flex items-center space-x-2">
          <span className="font-bold font-mono text-white text-sm">
            {opp.symbol}
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-medium">
            {opp.category}
          </span>
        </div>
        <div className="text-[11px] text-slate-400 truncate max-w-[130px]">
          {opp.name}
        </div>
      </td>

      {/* Strategy Badge */}
      <td className="py-3 px-3">
        <span
          className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
            isCSP
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
              : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
          }`}
        >
          {isCSP ? (
            <ShieldCheck className="w-3 h-3" />
          ) : (
            <TrendingUp className="w-3 h-3" />
          )}
          <span>{opp.strategy}</span>
        </span>
      </td>

      {/* Spot Price & Support */}
      <td className="py-3 px-3">
        <div className="font-mono text-slate-200 font-medium">
          ${opp.current_price.toFixed(2)}
        </div>
        <div className="text-[10px] text-slate-400 flex items-center space-x-1">
          <span>Supp: ${opp.support_level}</span>
        </div>
      </td>

      {/* Strike & Safety Cushion */}
      <td className="py-3 px-3">
        <div className="font-mono font-bold text-white">
          ${opp.strike.toFixed(1)}
        </div>
        <div className="text-[10px] text-emerald-400/90 font-mono">
          +{opp.cushion_pct}% {isCSP ? 'cushion' : 'room'}
        </div>
      </td>

      {/* Expiration & DTE */}
      <td className="py-3 px-3">
        <div className="font-mono text-slate-200 font-semibold">
          {opp.dte}d
        </div>
        <div className="text-[10px] text-slate-400">
          {opp.expiration}
        </div>
      </td>

      {/* Premium Mid & Dollar Income */}
      <td className="py-3 px-3">
        <div className="font-mono font-semibold text-emerald-400">
          ${opp.mid.toFixed(2)}
        </div>
        <div className="text-[10px] text-slate-400 font-mono">
          +${opp.premium_total} / ct
        </div>
      </td>

      {/* Delta & POP */}
      <td className="py-3 px-3">
        <div className="font-mono text-slate-300 font-medium">
          Δ {opp.abs_delta.toFixed(2)}
        </div>
        <div className="text-[10px] text-cyan-400 font-mono">
          {opp.pop_pct}% POP
        </div>
      </td>

      {/* IV Rank */}
      <td className="py-3 px-3">
        <div className="flex items-center space-x-1.5">
          <div className="w-12 bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${
                opp.iv_rank > 60
                  ? 'bg-amber-400'
                  : opp.iv_rank > 35
                  ? 'bg-emerald-400'
                  : 'bg-slate-500'
              }`}
              style={{ width: `${opp.iv_rank}%` }}
            />
          </div>
          <span className="font-mono text-[11px] text-slate-300">
            {opp.iv_rank}
          </span>
        </div>
        <div className="text-[10px] text-slate-400 font-mono">
          IV: {opp.iv}%
        </div>
      </td>

      {/* RSI & Trend */}
      <td className="py-3 px-3">
        <div
          className={`font-mono font-medium ${
            opp.rsi < 40
              ? 'text-emerald-400 font-bold'
              : opp.rsi > 70
              ? 'text-rose-400'
              : 'text-slate-300'
          }`}
        >
          {opp.rsi}
        </div>
        <div className="text-[10px] text-slate-400 truncate max-w-[85px]">
          {opp.trend}
        </div>
      </td>

      {/* Annualized ROC % */}
      <td className="py-3 px-4 text-right">
        <div className="inline-flex flex-col items-end">
          <span className="px-2 py-0.5 rounded-md font-mono font-bold text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm">
            {opp.annualized_roc.toFixed(1)}%
          </span>
          <span className="text-[10px] text-slate-400 font-mono mt-0.5">
            {opp.roc_pct.toFixed(2)}% static
          </span>
        </div>
      </td>

      {/* Action Buttons */}
      <td
        className="py-3 px-4 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-center space-x-1">
          {onOpenSimulator && (
            <button
              onClick={() => onOpenSimulator(opp)}
              title="Simulate Trade Quality (100-pt Quantitative Model)"
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300 transition-colors border border-slate-700/60"
            >
              <Zap className="w-3.5 h-3.5" />
            </button>
          )}
          {onStageOrder && (
            <button
              onClick={() => onStageOrder(opp)}
              title="Stage Broker Order (Schwab / IBKR / ToS)"
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-amber-500/20 text-slate-300 hover:text-amber-300 transition-colors border border-slate-700/60"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            </button>
          )}
          <button
            onClick={() => onOpenCalculator(opp)}
            title="Calculate capital & weekly cashflow"
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-emerald-600/30 text-slate-300 hover:text-emerald-300 transition-colors border border-slate-700/60"
          >
            <Calculator className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onSelectOpportunity(opp)}
            title="View contract details"
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700/60"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
});

ScreenerRow.displayName = 'ScreenerRow';
