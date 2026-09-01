import React from 'react';
import { ArrowUpDown, AlertTriangle, ChevronRight, ShieldAlert, ShieldCheck, Star } from './icons';
import { TickerMeta } from '../types/options';

interface PrimaryScreenerTableProps {
  tickers: TickerMeta[];
  watchlist: string[];
  onToggleWatchlist: (symbol: string) => void;
  sortBy: keyof TickerMeta | 'cushion_pct';
  sortOrder: 'asc' | 'desc';
  onSort: (column: keyof TickerMeta | 'cushion_pct') => void;
  onSelectTicker: (ticker: TickerMeta) => void;
}

export const PrimaryScreenerTable: React.FC<PrimaryScreenerTableProps> = ({
  tickers,
  watchlist,
  onToggleWatchlist,
  sortBy,
  sortOrder,
  onSort,
  onSelectTicker,
}) => {
  const renderSortArrow = (column: keyof TickerMeta | 'cushion_pct') => {
    if (sortBy !== column) {
      return <ArrowUpDown className="w-3 h-3 text-slate-500 opacity-40" />;
    }
    return (
      <span className="text-emerald-400 font-bold text-xs ml-1">
        {sortOrder === 'asc' ? '↑' : '↓'}
      </span>
    );
  };

  return (
    <div className="glass-panel rounded-xl border border-slate-800/80 overflow-hidden shadow-2xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/90 text-[11px] font-semibold text-slate-400 uppercase tracking-wider select-none">
              <th
                onClick={() => onSort('symbol')}
                className="py-3 px-4 cursor-pointer hover:text-slate-200 transition-colors"
              >
                <div className="flex items-center space-x-1">
                  <span>Ticker</span>
                  {renderSortArrow('symbol')}
                </div>
              </th>

              <th
                onClick={() => onSort('spot_price')}
                className="py-3 px-3 cursor-pointer hover:text-slate-200 transition-colors"
              >
                <div className="flex items-center space-x-1">
                  <span>Price ($)</span>
                  {renderSortArrow('spot_price')}
                </div>
              </th>

              <th
                onClick={() => onSort('iv_rank')}
                className="py-3 px-3 cursor-pointer hover:text-slate-200 transition-colors"
              >
                <div className="flex items-center space-x-1">
                  <span>IV Rank (IVR)</span>
                  {renderSortArrow('iv_rank')}
                </div>
              </th>

              <th
                onClick={() => onSort('rsi_14')}
                className="py-3 px-3 cursor-pointer hover:text-slate-200 transition-colors"
              >
                <div className="flex items-center space-x-1">
                  <span>14D RSI</span>
                  {renderSortArrow('rsi_14')}
                </div>
              </th>

              <th
                onClick={() => onSort('sma_20')}
                className="py-3 px-3 cursor-pointer hover:text-slate-200 transition-colors"
              >
                <div className="flex items-center space-x-1">
                  <span>20D SMA</span>
                  {renderSortArrow('sma_20')}
                </div>
              </th>

              <th
                onClick={() => onSort('lower_bb')}
                className="py-3 px-3 cursor-pointer hover:text-slate-200 transition-colors"
              >
                <div className="flex items-center space-x-1">
                  <span>Lower BB (Put Strike)</span>
                  {renderSortArrow('lower_bb')}
                </div>
              </th>

              <th
                onClick={() => onSort('upper_bb')}
                className="py-3 px-3 cursor-pointer hover:text-slate-200 transition-colors"
              >
                <div className="flex items-center space-x-1">
                  <span>Upper BB (Call Strike)</span>
                  {renderSortArrow('upper_bb')}
                </div>
              </th>

              <th
                onClick={() => onSort('cushion_pct')}
                className="py-3 px-3 cursor-pointer hover:text-slate-200 transition-colors"
              >
                <div className="flex items-center space-x-1">
                  <span>Put Cushion %</span>
                  {renderSortArrow('cushion_pct')}
                </div>
              </th>

              <th
                onClick={() => onSort('liquidity_tier')}
                className="py-3 px-3 cursor-pointer hover:text-slate-200 transition-colors"
              >
                <div className="flex items-center space-x-1">
                  <span>Liquidity Tier</span>
                  {renderSortArrow('liquidity_tier')}
                </div>
              </th>

              <th
                onClick={() => onSort('has_weeklys')}
                className="py-3 px-3 cursor-pointer hover:text-slate-200 transition-colors"
              >
                <div className="flex items-center space-x-1">
                  <span>Weekly Options</span>
                  {renderSortArrow('has_weeklys')}
                </div>
              </th>

              <th className="py-3 px-4 text-center">Audit</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-800/60 text-xs">
            {tickers.length === 0 ? (
              <tr>
                <td colSpan={11} className="py-12 text-center text-slate-400">
                  <p className="text-sm font-medium text-slate-300">
                    No tickers match the active filter criteria.
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Try resetting filters or clearing the search box.
                  </p>
                </td>
              </tr>
            ) : (
              tickers.map((t) => {
                const putCushion = ((t.spot_price - t.lower_bb) / t.spot_price) * 100;
                const isHighIVR = t.iv_rank >= 45;
                const isRsiExtreme = t.rsi_14 > 70 || t.rsi_14 < 30;
                const isTier1 = t.liquidity_tier.includes('Tier 1');
                const isTier4 = t.liquidity_tier.includes('Tier 4');

                return (
                  <tr
                    key={t.symbol}
                    onClick={() => onSelectTicker(t)}
                    className="hover:bg-slate-900/80 transition-colors group cursor-pointer"
                  >
                    {/* Ticker & Name */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleWatchlist(t.symbol);
                          }}
                          className="p-1 -ml-1 text-slate-500 hover:text-amber-400 transition-colors focus:outline-none"
                          title={watchlist.includes(t.symbol) ? "Remove from My Watchlist" : "Add to My Watchlist"}
                        >
                          <Star
                            className={`w-3.5 h-3.5 ${
                              watchlist.includes(t.symbol)
                                ? 'text-amber-400'
                                : 'text-slate-600 group-hover:text-slate-400'
                            }`}
                            filled={watchlist.includes(t.symbol)}
                          />
                        </button>
                        <span className="font-bold font-mono text-white text-sm group-hover:text-emerald-400 transition-colors">
                          {t.symbol}
                        </span>
                        {t.options_cadence && (
                          <span
                            className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase ${
                              t.has_weeklys === false
                                ? 'bg-slate-800 text-slate-400 border border-slate-700'
                                : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                            }`}
                            title={t.has_weeklys === false ? "Monthly options only" : "CBOE-registered active weekly options"}
                          >
                            {t.has_weeklys === false ? 'Monthly' : 'Weekly'}
                          </span>
                        )}
                        {t.earnings_within_7d && (
                          <span
                            className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse"
                            title="Earnings within 7 days! Gap & IV crush risk"
                          >
                            <AlertTriangle className="w-2.5 h-2.5 mr-0.5" />
                            Earnings
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate max-w-[130px]">
                        {t.name}
                      </div>
                    </td>

                    {/* Price ($) */}
                    <td className="py-3.5 px-3">
                      <div className="font-mono font-bold text-slate-100">
                        ${t.spot_price.toFixed(2)}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {(t.avg_volume_30 / 1000000).toFixed(1)}M vol
                      </div>
                    </td>

                    {/* IV Rank (with visual progress bar + Green/Amber Badge) */}
                    <td className="py-3.5 px-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-14 bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              isHighIVR ? 'bg-emerald-400' : 'bg-amber-400'
                            }`}
                            style={{ width: `${Math.min(100, Math.max(8, t.iv_rank))}%` }}
                          />
                        </div>
                        <span
                          className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                            isHighIVR
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                          }`}
                        >
                          {t.iv_rank}% {isHighIVR ? 'High' : 'Low'}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                        IV: {t.iv_current}% • HV: {t.hv_30}%
                      </div>
                    </td>

                    {/* 14D RSI */}
                    <td className="py-3.5 px-3">
                      <div className="flex items-center space-x-1.5">
                        <span
                          className={`font-mono font-bold ${
                            t.rsi_14 < 30
                              ? 'text-emerald-400'
                              : t.rsi_14 > 70
                              ? 'text-rose-400'
                              : 'text-slate-200'
                          }`}
                        >
                          {t.rsi_14}
                        </span>

                        {isRsiExtreme && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                            {t.rsi_14 > 70 ? 'Overbought' : 'Oversold'}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* 20D SMA */}
                    <td className="py-3.5 px-3">
                      <div className="font-mono text-slate-300 font-medium">
                        ${t.sma_20.toFixed(2)}
                      </div>
                    </td>

                    {/* Lower BB (Put Strike Target) */}
                    <td className="py-3.5 px-3">
                      <div className="font-mono font-bold text-emerald-400">
                        ${t.lower_bb.toFixed(2)}
                      </div>
                      <div className="text-[10px] text-emerald-500/80 font-mono">
                        CSP Target Strike
                      </div>
                    </td>

                    {/* Upper BB (Call Strike Target) */}
                    <td className="py-3.5 px-3">
                      <div className="font-mono font-bold text-cyan-400">
                        ${t.upper_bb.toFixed(2)}
                      </div>
                      <div className="text-[10px] text-cyan-500/80 font-mono">
                        CC Target Strike
                      </div>
                    </td>

                    {/* Put Safety Cushion % */}
                    <td className="py-3.5 px-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md font-mono font-bold text-xs ${
                          putCushion >= 5.0
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        +{putCushion.toFixed(1)}%
                      </span>
                    </td>

                    {/* Liquidity Tier */}
                    <td className="py-3.5 px-3">
                      <span
                        className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border ${
                          isTier1
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : isTier4
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                            : 'bg-slate-800 text-slate-300 border-slate-700'
                        }`}
                      >
                        {isTier4 ? (
                          <ShieldAlert className="w-3 h-3" />
                        ) : (
                          <ShieldCheck className="w-3 h-3" />
                        )}
                        <span>{t.liquidity_tier.split(' ')[0]} {t.liquidity_tier.split(' ')[1]}</span>
                      </span>
                    </td>

                    {/* Weekly Options Badge */}
                    <td className="py-3.5 px-3">
                      {t.has_weeklys === false ? (
                        <span
                          className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-800 text-slate-300 border border-slate-700 shadow-sm"
                          title={`Monthly Only: Nearest expiration is ${t.nearest_expiration_date || t.target_exp || 'Monthly'} (${t.days_to_nearest_expiration ?? t.target_dte ?? '?'} DTE)`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-500 mr-1.5" />
                          Monthly
                        </span>
                      ) : (
                        <span
                          className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-sm"
                          title={`Active Weeklys: ${t.expiration_cadence || 'Weekly'}`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse" />
                          Weekly
                        </span>
                      )}
                    </td>

                    {/* Action Button */}
                    <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => onSelectTicker(t)}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-emerald-600/30 hover:text-emerald-300 text-slate-300 border border-slate-700/80 transition-all flex items-center space-x-1 mx-auto text-[11px] font-semibold"
                      >
                        <span>Audit</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
