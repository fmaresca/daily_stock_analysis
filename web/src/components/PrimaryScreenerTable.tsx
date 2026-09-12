import React, { useState, useMemo } from 'react';
import {
  ArrowUpDown,
  Flame,
} from './icons';
import { TickerMeta } from '../types/options';
import { calculateBarchartOpinion } from '../utils/barchartEngine';
import { PrimaryScreenerRow } from './screener/PrimaryScreenerRow';

interface PrimaryScreenerTableProps {
  tickers: TickerMeta[];
  watchlist: string[];
  onToggleWatchlist: (symbol: string) => void;
  sortBy: keyof TickerMeta | 'cushion_pct' | 'opinion_pct';
  sortOrder: 'asc' | 'desc';
  onSort: (column: keyof TickerMeta | 'cushion_pct' | 'opinion_pct') => void;
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
  const [opinionFilter, setOpinionFilter] = useState<'ALL' | 'TOP_1_PCT' | 'BUY_ONLY' | 'WEEKLY_ONLY'>('ALL');

  // Ensure each ticker has a populated barchart_opinion
  const enrichedTickers = useMemo(() => {
    return tickers.map((t) => {
      if (t.barchart_opinion) return t;
      const spot = t.spot_price || 100;
      const sma = t.sma_20 || spot;
      return {
        ...t,
        barchart_opinion: calculateBarchartOpinion(t.symbol, [sma * 0.96, sma * 0.98, sma, spot], spot),
      };
    });
  }, [tickers]);

  const filteredTickers = useMemo(() => {
    if (opinionFilter === 'TOP_1_PCT') {
      return enrichedTickers.filter((t) => t.barchart_opinion?.is_top_1_pct);
    }
    if (opinionFilter === 'BUY_ONLY') {
      return enrichedTickers.filter((t) => (t.barchart_opinion?.opinion_pct || 0) >= 80);
    }
    if (opinionFilter === 'WEEKLY_ONLY') {
      return enrichedTickers.filter((t) => t.has_weeklys !== false);
    }
    return enrichedTickers;
  }, [enrichedTickers, opinionFilter]);

  const sortedTickers = useMemo(() => {
    const list = [...filteredTickers];
    list.sort((a, b) => {
      let valA: any = (a as any)[sortBy];
      let valB: any = (b as any)[sortBy];

      if (sortBy === 'cushion_pct') {
        valA = ((a.spot_price - a.lower_bb) / a.spot_price) * 100;
        valB = ((b.spot_price - b.lower_bb) / b.spot_price) * 100;
      } else if (sortBy === 'opinion_pct') {
        valA = a.barchart_opinion?.opinion_pct ?? 0;
        valB = b.barchart_opinion?.opinion_pct ?? 0;
      } else if (sortBy === ('dist_to_support' as any)) {
        valA = Math.abs(a.spot_price - a.lower_bb);
        valB = Math.abs(b.spot_price - b.lower_bb);
      }

      if (valA === valB) return 0;
      if (valA === undefined || valA === null) return 1;
      if (valB === undefined || valB === null) return -1;

      if (typeof valA === 'string') {
        return sortOrder === 'asc'
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA);
      }

      return sortOrder === 'asc' ? valA - valB : valB - valA;
    });
    return list;
  }, [filteredTickers, sortBy, sortOrder]);

  const top1Count = useMemo(() => enrichedTickers.filter((t) => t.barchart_opinion?.is_top_1_pct).length, [enrichedTickers]);
  const buyCount = useMemo(() => enrichedTickers.filter((t) => (t.barchart_opinion?.opinion_pct || 0) >= 80).length, [enrichedTickers]);
  const weeklyCount = useMemo(() => enrichedTickers.filter((t) => t.has_weeklys !== false).length, [enrichedTickers]);

  const renderSortArrow = (column: keyof TickerMeta | 'cushion_pct' | 'opinion_pct') => {
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
    <div className="glass-panel rounded-xl border border-slate-800/80 overflow-hidden shadow-2xl space-y-0">
      {/* Quick Filter Bar */}
      <div className="bg-slate-900/95 px-4 py-2.5 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center space-x-1.5 overflow-x-auto">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1 hidden sm:inline">
            Signal Screener:
          </span>

          <button
            onClick={() => setOpinionFilter('ALL')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              opinionFilter === 'ALL'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
            }`}
          >
            All Symbols ({enrichedTickers.length})
          </button>

          <button
            onClick={() => setOpinionFilter('TOP_1_PCT')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
              opinionFilter === 'TOP_1_PCT'
                ? 'bg-gradient-to-r from-amber-500/30 to-emerald-500/30 text-amber-300 border border-amber-500/50 shadow-[0_0_12px_rgba(245,158,11,0.25)]'
                : 'text-amber-400/80 hover:text-amber-300 hover:bg-amber-500/10 border border-amber-500/20'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span>Top 1% Signals</span>
            <span className="text-[10px] font-mono bg-amber-950/80 px-1.5 py-0.2 rounded border border-amber-500/30 text-amber-200">
              {top1Count}
            </span>
          </button>

          <button
            onClick={() => setOpinionFilter('BUY_ONLY')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1 ${
              opinionFilter === 'BUY_ONLY'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
            }`}
          >
            <span>Strong Buy (≥80%)</span>
            <span className="text-[10px] font-mono text-slate-500">({buyCount})</span>
          </button>

          <button
            onClick={() => setOpinionFilter('WEEKLY_ONLY')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1 ${
              opinionFilter === 'WEEKLY_ONLY'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
            }`}
          >
            <span>Weekly Options Only</span>
            <span className="text-[10px] font-mono text-slate-500">({weeklyCount})</span>
          </button>
        </div>

        <div className="text-[11px] text-slate-400 font-mono hidden md:block">
          Showing <span className="font-bold text-white">{sortedTickers.length}</span> of{' '}
          <span className="text-slate-300">{enrichedTickers.length}</span> securities
        </div>
      </div>

      <div className="overflow-x-auto max-h-[72vh] overflow-y-auto table-scroll-container">
        <table className="w-full text-left border-collapse table-sticky-header">
          <thead className="sticky top-0 z-20 bg-slate-950 border-b border-slate-800 shadow-md">
            <tr className="border-b border-slate-800 bg-slate-950 text-[11px] font-semibold text-slate-400 uppercase tracking-wider select-none">
              <th
                onClick={() => onSort('symbol')}
                className="sticky top-0 bg-slate-950/95 backdrop-blur-md py-3.5 px-4 cursor-pointer hover:text-slate-200 transition-colors z-20"
              >
                <div className="flex items-center space-x-1">
                  <span>Ticker</span>
                  {renderSortArrow('symbol')}
                </div>
              </th>

              <th
                onClick={() => onSort('spot_price')}
                className="sticky top-0 bg-slate-950/95 backdrop-blur-md py-3.5 px-3 cursor-pointer hover:text-slate-200 transition-colors z-20"
              >
                <div className="flex items-center space-x-1">
                  <span>Price ($)</span>
                  {renderSortArrow('spot_price')}
                </div>
              </th>

              <th
                onClick={() => onSort('iv_rank')}
                className="sticky top-0 bg-slate-950/95 backdrop-blur-md py-3.5 px-3 cursor-pointer hover:text-slate-200 transition-colors z-20"
              >
                <div className="flex items-center space-x-1">
                  <span>IV Rank (IVR)</span>
                  {renderSortArrow('iv_rank')}
                </div>
              </th>

              <th
                onClick={() => onSort('rsi_14')}
                className="sticky top-0 bg-slate-950/95 backdrop-blur-md py-3.5 px-3 cursor-pointer hover:text-slate-200 transition-colors z-20"
              >
                <div className="flex items-center space-x-1">
                  <span>14D RSI</span>
                  {renderSortArrow('rsi_14')}
                </div>
              </th>

              <th
                onClick={() => onSort('sma_20')}
                className="sticky top-0 bg-slate-950/95 backdrop-blur-md py-3.5 px-3 cursor-pointer hover:text-slate-200 transition-colors z-20"
              >
                <div className="flex items-center space-x-1">
                  <span>20D SMA</span>
                  {renderSortArrow('sma_20')}
                </div>
              </th>

              <th
                onClick={() => onSort('lower_bb')}
                className="sticky top-0 bg-slate-950/95 backdrop-blur-md py-3.5 px-3 cursor-pointer hover:text-slate-200 transition-colors z-20"
              >
                <div className="flex items-center space-x-1">
                  <span>Lower BB (Put Strike)</span>
                  {renderSortArrow('lower_bb')}
                </div>
              </th>

              <th
                onClick={() => onSort('upper_bb')}
                className="sticky top-0 bg-slate-950/95 backdrop-blur-md py-3.5 px-3 cursor-pointer hover:text-slate-200 transition-colors z-20"
              >
                <div className="flex items-center space-x-1">
                  <span>Upper BB (Call Strike)</span>
                  {renderSortArrow('upper_bb')}
                </div>
              </th>

              <th
                onClick={() => onSort('cushion_pct')}
                className="sticky top-0 bg-slate-950/95 backdrop-blur-md py-3.5 px-3 cursor-pointer hover:text-slate-200 transition-colors z-20"
              >
                <div className="flex items-center space-x-1">
                  <span>Put Cushion %</span>
                  {renderSortArrow('cushion_pct')}
                </div>
              </th>

              <th
                onClick={() => onSort('liquidity_tier')}
                className="sticky top-0 bg-slate-950/95 backdrop-blur-md py-3.5 px-3 cursor-pointer hover:text-slate-200 transition-colors z-20"
              >
                <div className="flex items-center space-x-1">
                  <span>Liquidity Tier</span>
                  {renderSortArrow('liquidity_tier')}
                </div>
              </th>

              <th
                onClick={() => onSort('has_weeklys')}
                className="sticky top-0 bg-slate-950/95 backdrop-blur-md py-3.5 px-3 cursor-pointer hover:text-slate-200 transition-colors z-20"
              >
                <div className="flex items-center space-x-1">
                  <span>Weekly Options</span>
                  {renderSortArrow('has_weeklys')}
                </div>
              </th>

              <th
                onClick={() => onSort('opinion_pct')}
                className="sticky top-0 bg-slate-950/95 backdrop-blur-md py-3.5 px-3 cursor-pointer hover:text-slate-200 transition-colors z-20"
              >
                <div className="flex items-center space-x-1">
                  <span>Signal Strength</span>
                  {renderSortArrow('opinion_pct')}
                </div>
              </th>

              <th className="sticky top-0 bg-slate-950/95 backdrop-blur-md py-3.5 px-3 text-center z-20">
                <span>Analyst &amp; AI Rating</span>
              </th>

              <th className="sticky top-0 bg-slate-950/95 backdrop-blur-md py-3.5 px-4 text-center z-20">Audit</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-800/60 text-xs">
            {sortedTickers.length === 0 ? (
              <tr>
                <td colSpan={13} className="py-12 text-center text-slate-400">
                  <p className="text-sm font-medium text-slate-300">
                    No tickers match the active filter criteria.
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Try resetting filters or clearing the search box.
                  </p>
                </td>
              </tr>
            ) : (
              sortedTickers.map((t) => (
                <PrimaryScreenerRow
                  key={t.symbol}
                  ticker={t}
                  isWatchlisted={watchlist.includes(t.symbol)}
                  onToggleWatchlist={onToggleWatchlist}
                  onSelectTicker={onSelectTicker}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
