import React from 'react';
import { WeeklyScreenerRecord } from '../../../types/weeklyScreeners';
import { ShieldCheck, BarChart2, Zap, CheckCircle2 } from '../../icons';

export interface BarchartScreenRowProps {
  item: WeeklyScreenerRecord;
  onSelectSymbolForChart?: (symbol: string) => void;
  onOpenTickerAudit?: (symbol: string) => void;
  onOpenBrokerStaging?: (symbol: string, strategy: string) => void;
}

export const BarchartScreenRow: React.FC<BarchartScreenRowProps> = React.memo(({
  item,
  onSelectSymbolForChart,
  onOpenTickerAudit,
  onOpenBrokerStaging,
}) => {
  const isPositive = item.percent_change >= 0;
  const is100Buy = item.opinion_pct >= 90;

  return (
    <tr className="hover:bg-slate-900/60 transition-colors group">
      {/* Ticker & Name */}
      <td className="py-3 px-4">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onSelectSymbolForChart?.(item.symbol)}
            className="font-black text-sm text-white hover:text-emerald-400 transition-colors cursor-pointer text-left"
            title="Click to view Interactive Candlestick Chart"
          >
            {item.symbol}
          </button>
          {is100Buy && (
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Top Buy Signal" />
          )}
        </div>
        <div className="text-[10px] text-slate-400 font-sans truncate max-w-[200px]" title={item.name}>
          {item.name}
        </div>
      </td>

      {/* Price */}
      <td className="py-3 px-3 text-right font-bold text-slate-100">
        ${item.last_price.toFixed(2)}
      </td>

      {/* Net Chg */}
      <td className={`py-3 px-3 text-right font-bold ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
        <div>{isPositive ? `+${item.price_change.toFixed(2)}` : item.price_change.toFixed(2)}</div>
        <div className="text-[10px] opacity-80">
          {isPositive ? `+${item.percent_change.toFixed(2)}%` : `${item.percent_change.toFixed(2)}%`}
        </div>
      </td>

      {/* Signal Opinion */}
      <td className="py-3 px-4 font-sans">
        <div className="flex items-center space-x-2">
          <span
            className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
              item.opinion_pct >= 90
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : item.opinion_pct >= 60
                ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                : 'bg-slate-800 text-slate-300 border border-slate-700'
            }`}
          >
            {item.opinion}
          </span>
          <span className="text-[10px] text-amber-300 font-mono font-bold hidden sm:inline">
            {item.signal_strength}
          </span>
        </div>
        <div className="w-28 bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1.5">
          <div
            className={`h-full ${item.opinion_pct >= 90 ? 'bg-emerald-400' : 'bg-teal-400'}`}
            style={{ width: `${Math.max(5, Math.abs(item.opinion_pct))}%` }}
          />
        </div>
      </td>

      {/* Historical Stability */}
      <td className="py-3 px-3 text-center text-[10px] font-mono text-slate-400 font-sans">
        <div className="flex items-center justify-center space-x-1">
          <span className="px-1 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300" title="Previous Day Opinion">
            {item.opinion_previous?.replace(' Buy', '') || '100%'}
          </span>
          <span>&rarr;</span>
          <span className="px-1 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300" title="Last Week Opinion">
            {item.opinion_last_week?.replace(' Buy', '') || '100%'}
          </span>
          <span>&rarr;</span>
          <span className="px-1 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300" title="Last Month Opinion">
            {item.opinion_last_month?.replace(' Buy', '') || '88%'}
          </span>
        </div>
      </td>

      {/* Weekly Options */}
      <td className="py-3 px-3 text-center font-sans">
        {item.has_weekly_options ? (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/40">
            <CheckCircle2 className="w-3 h-3" />
            <span>Weekly Options</span>
          </span>
        ) : (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-400 border border-slate-700">
            Monthly Only
          </span>
        )}
      </td>

      {/* Strategy recommendation */}
      <td className="py-3 px-3 font-sans">
        <span className="font-semibold text-xs text-cyan-300">
          {item.recommended_strategy === 'BULL_PUT_SPREAD' && '0.15-0.20Δ Bull Put Spread'}
          {item.recommended_strategy === 'CSP' && 'Conservative Cash-Secured Put'}
          {item.recommended_strategy === 'IRON_CONDOR' && 'Neutral Iron Condor'}
          {item.recommended_strategy === 'BEAR_CALL_SPREAD' && 'Defensive Bear Call Spread'}
        </span>
        <div className="text-[10px] text-slate-400">
          Anchor outside 20-Day Bollinger Bands
        </div>
      </td>

      {/* Actions */}
      <td className="py-3 px-4 text-center font-sans">
        <div className="flex items-center justify-center space-x-1.5">
          <button
            onClick={() => onOpenTickerAudit?.(item.symbol)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Run 5-Part Options Safety Audit"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          </button>

          <button
            onClick={() => onSelectSymbolForChart?.(item.symbol)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-400 transition-colors cursor-pointer"
            title="Open Candlestick Chart"
          >
            <BarChart2 className="w-3.5 h-3.5 text-cyan-400" />
          </button>

          <button
            onClick={() => onOpenBrokerStaging?.(item.symbol, item.recommended_strategy)}
            className="p-1.5 rounded-lg bg-purple-950/70 hover:bg-purple-900 border border-purple-500/40 text-purple-300 transition-colors cursor-pointer"
            title="Stage Order in Schwab Broker Workbench"
          >
            <Zap className="w-3.5 h-3.5 text-amber-300" />
          </button>
        </div>
      </td>
    </tr>
  );
});
