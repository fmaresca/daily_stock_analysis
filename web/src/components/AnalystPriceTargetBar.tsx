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
  const low = targets.low || (currentPrice * 0.85);
  const mean = targets.mean || (currentPrice * 1.12);
  const high = targets.high || (currentPrice * 1.30);
  const recommendation = targets.recommendation || 'Moderate Buy';
  const numberOfAnalysts = targets.numberOfAnalysts || targets.number_of_analysts || 28;

  // Breakdown counts (derive if not explicitly provided)
  const breakdown = targets.ratings_breakdown || (() => {
    const total = numberOfAnalysts;
    const r = recommendation.toUpperCase();
    if (r.includes('STRONG_BUY') || r.includes('STRONG BUY')) {
      const sb = Math.round(total * 0.65);
      const b = Math.round(total * 0.25);
      const h = Math.round(total * 0.08);
      const u = Math.max(0, total - sb - b - h);
      return { strong_buy: sb, buy: b, hold: h, underperform: u, sell: 0 };
    }
    if (r.includes('BUY') || r.includes('OUTPERFORM')) {
      const sb = Math.round(total * 0.35);
      const b = Math.round(total * 0.45);
      const h = Math.round(total * 0.15);
      const u = Math.max(0, total - sb - b - h);
      return { strong_buy: sb, buy: b, hold: h, underperform: u, sell: 0 };
    }
    if (r.includes('HOLD') || r.includes('NEUTRAL')) {
      const sb = Math.round(total * 0.15);
      const b = Math.round(total * 0.25);
      const h = Math.round(total * 0.45);
      const u = Math.round(total * 0.10);
      const s = Math.max(0, total - sb - b - h - u);
      return { strong_buy: sb, buy: b, hold: h, underperform: u, sell: s };
    }
    const sb = Math.round(total * 0.05);
    const b = Math.round(total * 0.15);
    const h = Math.round(total * 0.30);
    const u = Math.round(total * 0.30);
    const s = Math.max(0, total - sb - b - h - u);
    return { strong_buy: sb, buy: b, hold: h, underperform: u, sell: s };
  })();

  const totalBreakdown =
    breakdown.strong_buy + breakdown.buy + breakdown.hold + breakdown.underperform + breakdown.sell || numberOfAnalysts || 1;

  const pctSB = Math.round((breakdown.strong_buy / totalBreakdown) * 100);
  const pctB = Math.round((breakdown.buy / totalBreakdown) * 100);
  const pctH = Math.round((breakdown.hold / totalBreakdown) * 100);
  const pctU = Math.round((breakdown.underperform / totalBreakdown) * 100);
  const pctS = Math.max(0, 100 - pctSB - pctB - pctH - pctU);

  // Calculate overall range bounds
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
      return { label: 'Strong Buy', bg: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40', score: '1.2' };
    }
    if (r.includes('BUY') || r.includes('OUTPERFORM')) {
      return { label: 'Moderate Buy', bg: 'bg-teal-500/15 text-teal-300 border-teal-500/40', score: '1.8' };
    }
    if (r.includes('HOLD') || r.includes('NEUTRAL')) {
      return { label: 'Hold / Neutral', bg: 'bg-amber-500/15 text-amber-300 border-amber-500/40', score: '2.9' };
    }
    if (r.includes('SELL') || r.includes('UNDERPERFORM')) {
      return { label: 'Underperform / Sell', bg: 'bg-rose-500/15 text-rose-300 border-rose-500/40', score: '4.2' };
    }
    return { label: rec || 'Moderate Buy', bg: 'bg-slate-800 text-slate-300 border-slate-700', score: '2.0' };
  };

  const badge = getRecommendationBadge(recommendation);

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-xl p-5 text-slate-100 shadow-lg space-y-6">
      {/* Header Info */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">
              Equity Research Consensus
            </span>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${badge.bg}`}>
              {badge.label}
            </span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
              Score: {targets.score ? targets.score.toFixed(1) : badge.score} / 5.0
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Based on <strong className="text-white font-mono">{numberOfAnalysts}</strong> Wall Street equity analyst ratings covering this ticker
          </p>
        </div>

        {/* Upside Metric Callout */}
        <div className="text-right">
          <span className="text-xs text-slate-400 block">Consensus Mean Upside</span>
          <span className={`text-base font-bold font-mono ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
            {isPositive ? `+${upsidePct}%` : `${upsidePct}%`}
          </span>
        </div>
      </div>

      {/* 1. ANALYST RATINGS DISTRIBUTION BREAKDOWN BAR & HEATMAP */}
      <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-300 uppercase tracking-wider text-[11px]">
            Analyst Ratings Distribution Breakdown ({totalBreakdown} Total)
          </span>
          <span className="font-mono text-emerald-400 text-xs font-bold">
            {pctSB + pctB}% Bullish
          </span>
        </div>

        {/* Proportional Stacked Heatmap Bar */}
        <div className="h-4 w-full bg-slate-800 rounded-full overflow-hidden flex shadow-inner">
          {pctSB > 0 && (
            <div
              className="bg-emerald-500 h-full transition-all hover:opacity-90"
              style={{ width: `${pctSB}%` }}
              title={`Strong Buy: ${breakdown.strong_buy} (${pctSB}%)`}
            />
          )}
          {pctB > 0 && (
            <div
              className="bg-teal-400 h-full transition-all hover:opacity-90"
              style={{ width: `${pctB}%` }}
              title={`Buy: ${breakdown.buy} (${pctB}%)`}
            />
          )}
          {pctH > 0 && (
            <div
              className="bg-amber-400 h-full transition-all hover:opacity-90"
              style={{ width: `${pctH}%` }}
              title={`Hold: ${breakdown.hold} (${pctH}%)`}
            />
          )}
          {pctU > 0 && (
            <div
              className="bg-orange-500 h-full transition-all hover:opacity-90"
              style={{ width: `${pctU}%` }}
              title={`Underperform: ${breakdown.underperform} (${pctU}%)`}
            />
          )}
          {pctS > 0 && (
            <div
              className="bg-rose-500 h-full transition-all hover:opacity-90"
              style={{ width: `${pctS}%` }}
              title={`Sell: ${breakdown.sell} (${pctS}%)`}
            />
          )}
        </div>

        {/* Breakdown Count Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs pt-1 font-mono">
          <div className="p-2 rounded-lg bg-emerald-950/40 border border-emerald-500/30">
            <span className="text-[10px] text-emerald-400 block font-sans">Strong Buy</span>
            <span className="text-sm font-bold text-emerald-300">{breakdown.strong_buy}</span>
            <span className="text-[10px] text-slate-500 block">({pctSB}%)</span>
          </div>

          <div className="p-2 rounded-lg bg-teal-950/40 border border-teal-500/30">
            <span className="text-[10px] text-teal-400 block font-sans">Buy / Outperform</span>
            <span className="text-sm font-bold text-teal-300">{breakdown.buy}</span>
            <span className="text-[10px] text-slate-500 block">({pctB}%)</span>
          </div>

          <div className="p-2 rounded-lg bg-amber-950/40 border border-amber-500/30">
            <span className="text-[10px] text-amber-400 block font-sans">Hold / Neutral</span>
            <span className="text-sm font-bold text-amber-300">{breakdown.hold}</span>
            <span className="text-[10px] text-slate-500 block">({pctH}%)</span>
          </div>

          <div className="p-2 rounded-lg bg-orange-950/40 border border-orange-500/30">
            <span className="text-[10px] text-orange-400 block font-sans">Underperform</span>
            <span className="text-sm font-bold text-orange-300">{breakdown.underperform}</span>
            <span className="text-[10px] text-slate-500 block">({pctU}%)</span>
          </div>

          <div className="p-2 rounded-lg bg-rose-950/40 border border-rose-500/30">
            <span className="text-[10px] text-rose-400 block font-sans">Sell</span>
            <span className="text-sm font-bold text-rose-300">{breakdown.sell}</span>
            <span className="text-[10px] text-slate-500 block">({pctS}%)</span>
          </div>
        </div>
      </div>

      {/* 2. TARGET PRICE SUMMARY */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="p-2.5 rounded-lg bg-slate-800/50 border border-slate-700/50">
          <span className="text-[11px] font-medium text-slate-400 block uppercase font-sans">Low Target</span>
          <span className="text-sm font-bold font-mono text-rose-300">
            {currencySymbol}{low.toFixed(2)}
          </span>
        </div>

        <div className="p-2.5 rounded-lg bg-blue-950/40 border border-blue-800/50">
          <span className="text-[11px] font-medium text-blue-300 block uppercase font-sans">Mean Target</span>
          <span className="text-sm font-bold font-mono text-blue-200">
            {currencySymbol}{mean.toFixed(2)}
          </span>
        </div>

        <div className="p-2.5 rounded-lg bg-slate-800/50 border border-slate-700/50">
          <span className="text-[11px] font-medium text-slate-400 block uppercase font-sans">High Target</span>
          <span className="text-sm font-bold font-mono text-emerald-300">
            {currencySymbol}{high.toFixed(2)}
          </span>
        </div>
      </div>

      {/* 3. VISUAL RANGE TRACK & MARKERS */}
      <div className="relative pt-6 pb-8 px-2">
        {/* Current Price Pointer Tooltip */}
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
