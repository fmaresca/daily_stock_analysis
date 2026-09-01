import React from 'react';
import { AnalystIntelligence } from '../types/options';

interface AnalystPriceTargetBarProps {
  currentPrice: number;
  targets?: AnalystIntelligence;
  currencySymbol?: string;
}

export const AnalystPriceTargetBar: React.FC<AnalystPriceTargetBarProps> = ({
  currentPrice,
  targets = {},
  currencySymbol = '$',
}) => {
  const low = targets.low || 0;
  const mean = targets.mean || 0;
  const high = targets.high || 0;
  const recommendation = targets.recommendation || 'N/A';
  const numberOfAnalysts = targets.numberOfAnalysts || targets.number_of_analysts || 0;

  // Fallback state if analyst data is not available
  if (!low || !high || low === high) {
    return (
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-slate-400 text-xs text-center">
        No active analyst consensus price targets available for this symbol.
      </div>
    );
  }

  // Calculate overall range bounds (expand if currentPrice trades outside low/high targets)
  const plotMin = Math.min(low, currentPrice);
  const plotMax = Math.max(high, currentPrice);
  const totalRange = plotMax - plotMin || 1;

  // Percentage position offsets
  const lowPos = ((low - plotMin) / totalRange) * 100;
  const meanPos = ((mean - plotMin) / totalRange) * 100;
  const highPos = ((high - plotMin) / totalRange) * 100;
  const currentPos = Math.max(0, Math.min(100, ((currentPrice - plotMin) / totalRange) * 100));

  // Upside / Downside to Consensus Mean
  const upsidePct = mean ? (((mean - currentPrice) / currentPrice) * 100).toFixed(1) : '0';
  const isPositive = parseFloat(upsidePct) >= 0;

  // Consensus Badge Styling
  const getRecommendationBadge = (rec: string) => {
    const r = rec.toUpperCase();
    if (r.includes('STRONG_BUY') || r.includes('STRONG BUY')) {
      return { label: 'Strong Buy', bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' };
    }
    if (r.includes('BUY') || r.includes('OUTPERFORM')) {
      return { label: 'Buy / Outperform', bg: 'bg-green-500/10 text-green-400 border-green-500/30' };
    }
    if (r.includes('HOLD') || r.includes('NEUTRAL')) {
      return { label: 'Hold / Neutral', bg: 'bg-amber-500/10 text-amber-400 border-amber-500/30' };
    }
    if (r.includes('SELL') || r.includes('UNDERPERFORM')) {
      return { label: 'Underperform / Sell', bg: 'bg-rose-500/10 text-rose-400 border-rose-500/30' };
    }
    return { label: rec || 'N/A', bg: 'bg-slate-800 text-slate-300 border-slate-700' };
  };

  const badge = getRecommendationBadge(recommendation);

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-xl p-5 text-slate-100 shadow-lg">
      {/* Header Info */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">
              Wall St Consensus
            </span>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${badge.bg}`}>
              {badge.label}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Based on {numberOfAnalysts ? `${numberOfAnalysts} analyst ratings` : 'consensus coverage'}
          </p>
        </div>

        {/* Upside Metric Callout */}
        <div className="text-right">
          <span className="text-xs text-slate-400 block">Consensus Upside</span>
          <span className={`text-base font-bold ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
            {isPositive ? `+${upsidePct}%` : `${upsidePct}%`}
          </span>
        </div>
      </div>

      {/* Target Price Values Summary */}
      <div className="grid grid-cols-3 gap-2 text-center mb-8">
        <div className="p-2.5 rounded-lg bg-slate-800/50 border border-slate-700/50">
          <span className="text-[11px] font-medium text-slate-400 block uppercase">Low Target</span>
          <span className="text-sm font-semibold text-rose-300">
            {currencySymbol}{low.toFixed(2)}
          </span>
        </div>

        <div className="p-2.5 rounded-lg bg-blue-950/40 border border-blue-800/50">
          <span className="text-[11px] font-medium text-blue-300 block uppercase">Mean Consensus</span>
          <span className="text-sm font-semibold text-blue-200">
            {currencySymbol}{mean.toFixed(2)}
          </span>
        </div>

        <div className="p-2.5 rounded-lg bg-slate-800/50 border border-slate-700/50">
          <span className="text-[11px] font-medium text-slate-400 block uppercase">High Target</span>
          <span className="text-sm font-semibold text-emerald-300">
            {currencySymbol}{high.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Visual Range Track & Markers */}
      <div className="relative pt-6 pb-8 px-2">
        {/* Current Price Pointer Tooltip (Positioned Above Bar) */}
        <div
          className="absolute -top-1 -translate-x-1/2 flex flex-col items-center transition-all duration-300 z-20 pointer-events-none"
          style={{ left: `${currentPos}%` }}
        >
          <span className="px-2 py-0.5 rounded bg-amber-400 text-slate-950 text-[10px] font-extrabold whitespace-nowrap shadow-md">
            Current: {currencySymbol}{currentPrice.toFixed(2)}
          </span>
          <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[4px] border-t-amber-400" />
        </div>

        {/* Base Track */}
        <div className="relative h-3 w-full bg-slate-800 rounded-full overflow-visible">
          {/* Target Range Spread (Low to High fill) */}
          <div
            className="absolute top-0 bottom-0 bg-gradient-to-r from-rose-500/60 via-blue-500/60 to-emerald-500/60 rounded-full opacity-80"
            style={{
              left: `${lowPos}%`,
              width: `${Math.max(2, highPos - lowPos)}%`,
            }}
          />

          {/* Low Target Tick */}
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-1.5 h-5 bg-rose-400 rounded-full z-10"
            style={{ left: `${lowPos}%` }}
            title={`Low Target: ${currencySymbol}${low.toFixed(2)}`}
          />

          {/* Mean Consensus Target Pin */}
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2.5 h-6 bg-blue-400 border-2 border-slate-950 rounded-full z-10 shadow"
            style={{ left: `${meanPos}%` }}
            title={`Mean Consensus: ${currencySymbol}${mean.toFixed(2)}`}
          />

          {/* High Target Tick */}
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-1.5 h-5 bg-emerald-400 rounded-full z-10"
            style={{ left: `${highPos}%` }}
            title={`High Target: ${currencySymbol}${high.toFixed(2)}`}
          />

          {/* Current Spot Needle Line */}
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-1 h-7 bg-amber-400 border border-slate-950 rounded-full z-20 shadow-lg"
            style={{ left: `${currentPos}%` }}
          />
        </div>

        {/* Bottom Legend Labels */}
        <div className="relative w-full text-[11px] text-slate-400 mt-3 h-4">
          <span className="absolute -translate-x-1/2 font-mono" style={{ left: `${lowPos}%` }}>
            {currencySymbol}{low.toFixed(0)}
          </span>
          <span className="absolute -translate-x-1/2 font-mono text-blue-300 font-semibold" style={{ left: `${meanPos}%` }}>
            {currencySymbol}{mean.toFixed(0)} (Avg)
          </span>
          <span className="absolute -translate-x-1/2 font-mono" style={{ left: `${highPos}%` }}>
            {currencySymbol}{high.toFixed(0)}
          </span>
        </div>
      </div>
    </div>
  );
};
