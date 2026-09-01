import React, { useState } from 'react';
import {
  ShieldCheck,
  TrendingUp,
  Sliders,
  DollarSign,
  ArrowUpDown,
  Calculator,
  Flame,
  CheckCircle2,
} from './icons';
import { MultiLegSpread } from '../types/options';

interface MultiLegSpreadTableProps {
  spreads: MultiLegSpread[];
  onOpenSpreadCalculator?: (spread: MultiLegSpread) => void;
}

export const MultiLegSpreadTable: React.FC<MultiLegSpreadTableProps> = ({
  spreads,
  onOpenSpreadCalculator,
}) => {
  const [strategyFilter, setStrategyFilter] = useState<'ALL' | 'BULL_PUT_SPREAD' | 'BEAR_CALL_SPREAD' | 'IRON_CONDOR'>('ALL');
  const [sortBy, setSortBy] = useState<keyof MultiLegSpread>('annualized_roc');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const filteredSpreads = spreads
    .filter((s) => (strategyFilter === 'ALL' ? true : s.strategy === strategyFilter))
    .sort((a, b) => {
      const valA = a[sortBy] ?? 0;
      const valB = b[sortBy] ?? 0;
      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortOrder === 'asc' ? valA - valB : valB - valA;
      }
      return sortOrder === 'asc'
        ? String(valA).localeCompare(String(valB))
        : String(valB).localeCompare(String(valA));
    });

  const handleSort = (col: keyof MultiLegSpread) => {
    if (sortBy === col) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(col);
      setSortOrder('desc');
    }
  };

  return (
    <div className="space-y-4">
      {/* Strategy Switcher Toolbar */}
      <div className="glass-panel p-3 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider hidden sm:inline">
            Spread Strategy:
          </span>
          <div className="inline-flex p-1 bg-slate-900 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setStrategyFilter('ALL')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
                strategyFilter === 'ALL'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All Defined-Risk ({spreads.length})
            </button>
            <button
              onClick={() => setStrategyFilter('BULL_PUT_SPREAD')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
                strategyFilter === 'BULL_PUT_SPREAD'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-emerald-400'
              }`}
            >
              Bull Put Spreads
            </button>
            <button
              onClick={() => setStrategyFilter('BEAR_CALL_SPREAD')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
                strategyFilter === 'BEAR_CALL_SPREAD'
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                  : 'text-slate-400 hover:text-cyan-400'
              }`}
            >
              Bear Call Spreads
            </button>
            <button
              onClick={() => setStrategyFilter('IRON_CONDOR')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
                strategyFilter === 'IRON_CONDOR'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                  : 'text-slate-400 hover:text-purple-400'
              }`}
            >
              Iron Condors (Dual Wing)
            </button>
          </div>
        </div>

        <div className="text-xs text-slate-400">
          <span className="font-semibold text-emerald-400">0.15–0.20 Delta Rule:</span> Short legs are strictly anchored outside 2 SD Bollinger Bands.
        </div>
      </div>

      {/* Spreads Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider select-none">
                <th onClick={() => handleSort('symbol')} className="py-3 px-3.5 cursor-pointer hover:text-white">
                  Symbol
                </th>
                <th className="py-3 px-3">Strategy</th>
                <th className="py-3 px-3">
                  Short Leg <span className="text-emerald-400 font-mono">(0.15–0.20 Δ)</span>
                </th>
                <th className="py-3 px-3">Long Protection Leg</th>
                <th onClick={() => handleSort('net_credit')} className="py-3 px-3 cursor-pointer hover:text-white text-right">
                  Net Credit ($)
                </th>
                <th onClick={() => handleSort('max_loss')} className="py-3 px-3 cursor-pointer hover:text-white text-right">
                  Max Risk / Collateral
                </th>
                <th onClick={() => handleSort('cushion_pct')} className="py-3 px-3 cursor-pointer hover:text-white text-right">
                  Safety Cushion
                </th>
                <th onClick={() => handleSort('roc_pct')} className="py-3 px-3 cursor-pointer hover:text-white text-right">
                  ROC %
                </th>
                <th onClick={() => handleSort('annualized_roc')} className="py-3 px-3 cursor-pointer hover:text-white text-right">
                  Ann. Yield %
                </th>
                <th onClick={() => handleSort('pop_pct')} className="py-3 px-3 cursor-pointer hover:text-white text-right">
                  POP %
                </th>
                <th className="py-3 px-3 text-center">Cadence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filteredSpreads.map((spread) => {
                const isBPS = spread.strategy === 'BULL_PUT_SPREAD';
                const isBCS = spread.strategy === 'BEAR_CALL_SPREAD';
                const isIC = spread.strategy === 'IRON_CONDOR';

                return (
                  <tr key={spread.id} className="hover:bg-slate-800/40 transition-colors">
                    {/* Symbol */}
                    <td className="py-3 px-3.5">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-white text-xs">{spread.symbol}</span>
                        <span className="text-[10px] text-slate-400 font-sans">
                          ${spread.current_price.toFixed(2)}
                        </span>
                      </div>
                    </td>

                    {/* Strategy Badge */}
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          isBPS
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : isBCS
                            ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                            : 'bg-purple-500/15 text-purple-400 border border-purple-500/30'
                        }`}
                      >
                        {isBPS ? 'Bull Put Spread' : isBCS ? 'Bear Call Spread' : 'Iron Condor'}
                      </span>
                    </td>

                    {/* Short Leg (0.15 - 0.20 Delta) */}
                    <td className="py-3 px-3">
                      {isIC ? (
                        <div className="text-[11px]">
                          <div>Put: <strong className="text-emerald-400">${spread.short_strike}</strong> ({Math.abs(spread.short_delta).toFixed(2)}Δ)</div>
                          <div>Call: <strong className="text-cyan-400">${spread.call_short_strike}</strong> ({Math.abs(spread.call_short_delta || 0).toFixed(2)}Δ)</div>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-1.5 text-xs">
                          <strong className={isBPS ? 'text-emerald-400' : 'text-cyan-400'}>
                            ${spread.short_strike}
                          </strong>
                          <span className="text-[10px] text-slate-400">
                            ({Math.abs(spread.short_delta).toFixed(2)} Δ)
                          </span>
                        </div>
                      )}
                    </td>

                    {/* Long Protection Leg */}
                    <td className="py-3 px-3">
                      {isIC ? (
                        <div className="text-[11px] text-slate-400">
                          <div>Put: ${spread.long_strike}</div>
                          <div>Call: ${spread.call_long_strike}</div>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-1.5 text-xs text-slate-300">
                          <span>${spread.long_strike}</span>
                          <span className="text-[10px] text-slate-500">
                            ({Math.abs(spread.long_delta).toFixed(2)} Δ)
                          </span>
                        </div>
                      )}
                    </td>

                    {/* Net Credit */}
                    <td className="py-3 px-3 text-right">
                      <span className="font-bold text-emerald-400 text-xs">
                        +${spread.net_credit}
                      </span>
                      <span className="text-[10px] text-slate-500 block">
                        (${(spread.net_credit / 100).toFixed(2)}/sh)
                      </span>
                    </td>

                    {/* Max Loss / Collateral */}
                    <td className="py-3 px-3 text-right">
                      <span className="font-bold text-slate-200 text-xs">
                        ${spread.collateral_required}
                      </span>
                      <span className="text-[10px] text-slate-500 block">
                        {spread.spread_width}pt width
                      </span>
                    </td>

                    {/* Safety Cushion */}
                    <td className="py-3 px-3 text-right">
                      <span className="font-bold text-emerald-400">
                        +{spread.cushion_pct.toFixed(1)}%
                      </span>
                    </td>

                    {/* ROC % */}
                    <td className="py-3 px-3 text-right text-slate-200 font-bold">
                      {spread.roc_pct.toFixed(1)}%
                    </td>

                    {/* Annualized ROC % */}
                    <td className="py-3 px-3 text-right font-black text-emerald-400 text-xs">
                      {spread.annualized_roc.toFixed(1)}%
                    </td>

                    {/* POP % */}
                    <td className="py-3 px-3 text-right font-bold text-slate-300">
                      {spread.pop_pct.toFixed(1)}%
                    </td>

                    {/* Cadence Badge */}
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                          spread.has_weeklys
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {spread.has_weeklys ? 'Weekly' : 'Monthly'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
