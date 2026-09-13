import React from 'react';
import { WeeklyScreenerRecord } from '../../../types/weeklyScreeners';
import { ShieldCheck, BarChart2, Zap } from '../../icons';

export interface MarketChameleonRowProps {
  item: WeeklyScreenerRecord;
  onSelectSymbolForChart?: (symbol: string) => void;
  onOpenTickerAudit?: (symbol: string) => void;
  onOpenBrokerStaging?: (symbol: string, strategy: string) => void;
}

export const MarketChameleonRow: React.FC<MarketChameleonRowProps> = React.memo(({
  item,
  onSelectSymbolForChart,
  onOpenTickerAudit,
  onOpenBrokerStaging,
}) => {
  const isPositive = item.percent_change >= 0;
  const ex = item.extra_fields || {};
  const isCboe = Boolean(item.in_cboe_registry || ex.in_cboe_registry || item.has_weekly_options);
  const cadence = item.expiration_cadence || ex.expiration_cadence || (isCboe ? 'Weekly' : 'Monthly Only');

  return (
    <tr className="hover:bg-slate-900/60 transition-colors group">
      {/* Ticker & Name */}
      <td className="py-3 px-4">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onSelectSymbolForChart?.(item.symbol)}
            className="font-black text-sm text-white hover:text-purple-400 transition-colors cursor-pointer text-left"
            title="Click to view Interactive Candlestick Chart"
          >
            {item.symbol}
          </button>
          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
            USA
          </span>
        </div>
        <div className="text-[10px] text-slate-400 font-sans truncate max-w-[180px]" title={item.name}>
          {item.name}
        </div>
      </td>

      {/* Price */}
      <td className="py-3 px-3 text-right font-bold text-slate-100">
        ${item.last_price.toFixed(2)}
      </td>

      {/* Net Chg & % */}
      <td className={`py-3 px-3 text-right font-bold ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
        <div>{isPositive ? `+${item.price_change.toFixed(2)}` : item.price_change.toFixed(2)}</div>
        <div className="text-[10px] opacity-80">
          {isPositive ? `+${item.percent_change.toFixed(2)}%` : `${item.percent_change.toFixed(2)}%`}
        </div>
      </td>

      {/* Market Cap */}
      <td className="py-3 px-3 text-right font-bold text-slate-300">
        {ex.market_cap_str || '-'}
      </td>

      {/* 14-Day RSI */}
      <td className="py-3 px-3 text-center">
        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
          {ex.rsi_14 !== undefined ? Number(ex.rsi_14).toFixed(1) : '-'}
        </span>
      </td>

      {/* IV30 */}
      <td className="py-3 px-3 text-center">
        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
          {ex.iv30 !== undefined ? `${Number(ex.iv30).toFixed(1)}%` : '-'}
        </span>
      </td>

      {/* 20D / 1Y Vol */}
      <td className="py-3 px-3 text-center text-[10px] text-slate-400">
        <div>20D: <span className="text-slate-200">{ex.vol_20d ? `${Number(ex.vol_20d).toFixed(1)}%` : '-'}</span></div>
        <div>1Y: <span className="text-slate-200">{ex.vol_1y ? `${Number(ex.vol_1y).toFixed(1)}%` : '-'}</span></div>
      </td>

      {/* MA Signal */}
      <td className="py-3 px-4 font-sans">
        <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
          {ex.ma_signal || item.opinion}
        </span>
      </td>

      {/* CBOE Weeklys & Cadence */}
      <td className="py-3 px-3 text-center font-sans">
        {isCboe ? (
          <div className="inline-flex flex-col items-center">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 whitespace-nowrap">
              CBOE Weekly
            </span>
            <span className="text-[9px] text-emerald-400 font-mono mt-0.5 whitespace-nowrap">
              {cadence}
            </span>
          </div>
        ) : (
          <div className="inline-flex flex-col items-center">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700 whitespace-nowrap">
              Monthly Only
            </span>
            <span className="text-[9px] text-slate-500 font-mono mt-0.5 whitespace-nowrap">
              Standard 3rd Fri
            </span>
          </div>
        )}
      </td>

      {/* Strategy Setup */}
      <td className="py-3 px-3 font-sans">
        <span className="font-semibold text-xs text-cyan-300">
          {item.recommended_strategy === 'BULL_PUT_SPREAD' && 'Bull Put Credit Spread'}
          {item.recommended_strategy === 'CSP' && 'Cash-Secured Put'}
          {item.recommended_strategy === 'COVERED_CALL' && 'Covered Call'}
          {item.recommended_strategy === 'IRON_CONDOR' && 'Iron Condor'}
        </span>
        <div className="text-[10px] text-slate-400">
          {isCboe ? 'CBOE Weekly Verified' : 'Monthly Options Chain'}
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
