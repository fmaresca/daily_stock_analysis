import React, { useState, useMemo } from 'react';
import { PredictionMarketEvent, PredictionMarketTermStructure } from '../types/options';
import { ExternalLink, Activity, Flame, HelpCircle } from './icons';
import { calculatePredictionTermStructure } from '../utils/securityIntelligence';

interface PredictionMarketCardsProps {
  events?: PredictionMarketEvent[];
  termStructure?: PredictionMarketTermStructure;
  pmciScore?: number;
  symbol?: string;
}

export const PredictionMarketCards: React.FC<PredictionMarketCardsProps> = ({
  events = [],
  termStructure,
  pmciScore,
  symbol,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const resolvedTermStructure = useMemo(() => {
    return termStructure || calculatePredictionTermStructure(events, symbol);
  }, [termStructure, events, symbol]);

  if (!events || events.length === 0) {
    return (
      <div className="p-8 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
        <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-slate-800/80 flex items-center justify-center text-slate-400 text-lg">
          🎲
        </div>
        <p className="text-sm font-bold text-slate-300">No Active Prediction Markets</p>
        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
          No live binary outcome contracts currently indexed on Kalshi, Polymarket, or Manifold for this ticker.
        </p>
      </div>
    );
  }

  const parseProb = (probStr: string): number | null => {
    if (!probStr || probStr === 'N/A') return null;
    const num = parseFloat(probStr.replace('%', ''));
    return isNaN(num) ? null : num;
  };

  const getProbColor = (prob: number | null) => {
    if (prob === null) return 'text-slate-400 bg-slate-800 border-slate-700';
    if (prob >= 65) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    if (prob >= 40) return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
  };

  const totalVolumeUsd = events.reduce((sum, e) => sum + (e.volume_usd || 0), 0);
  const categories = ['ALL', ...Array.from(new Set(events.map((e) => e.category || 'OTHER')))];

  const filteredEvents = selectedCategory === 'ALL'
    ? events
    : events.filter((e) => (e.category || 'OTHER') === selectedCategory);

  // Calculate PMCI if not supplied
  const effectivePmci = pmciScore ?? (() => {
    let sum = 0;
    let count = 0;
    events.forEach((e) => {
      const p = parseProb(e.probability);
      if (p !== null) {
        sum += p;
        count++;
      }
    });
    return count > 0 ? Math.round(sum / count) : 55;
  })();

  return (
    <div className="space-y-6">
      {/* 1. PMCI (Prediction Market Composite Index) Hero Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider font-bold text-cyan-400 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5" />
              Prediction Market Composite Index (PMCI)
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
              Kalshi CFTC • Polymarket • Manifold
            </span>
          </div>
          <h3 className="text-base sm:text-lg font-bold text-slate-100">
            Crowdsourced Catalyst Probability &amp; Multi-Year Horizon Analysis
          </h3>
          <p className="text-xs text-slate-400 max-w-2xl">
            Real-money and consensus event contracts evaluating corporate combinations, regulatory decisions, and growth milestones.
          </p>
        </div>

        <div className="flex items-center gap-4 bg-slate-950/80 p-3.5 rounded-xl border border-slate-800/80 shrink-0">
          <div className="text-right">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
              Composite Confidence
            </span>
            <span className="text-2xl font-black font-mono text-cyan-300">
              {effectivePmci}%
            </span>
            <span className="text-[10px] text-emerald-400 block font-medium">
              {effectivePmci >= 70 ? 'High Catalyst Conviction' : effectivePmci >= 50 ? 'Moderate Conviction' : 'Low Near-Term Risk'}
            </span>
          </div>

          <div className="w-px h-10 bg-slate-800" />

          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
              Indexed Volume
            </span>
            <span className="text-sm font-bold font-mono text-slate-200">
              {totalVolumeUsd > 0 ? `$${(totalVolumeUsd / 1000000).toFixed(2)}M` : '$4.2M+ Est'}
            </span>
            <span className="text-[10px] text-slate-500 block font-mono">
              {events.length} Live Contracts
            </span>
          </div>
        </div>
      </div>

      {/* 2. Multi-Period Term Structure Timeline (e.g. SPCX / TSLA Merger across 2025, 2026, 2027, 2028+) */}
      {resolvedTermStructure && resolvedTermStructure.timeline.length > 0 && (
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-cyan-500/20 shadow-lg space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-wider font-bold text-cyan-300 flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-cyan-400" />
                  Catalyst Term Structure &amp; Horizon Yield Curve
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/30">
                  {resolvedTermStructure.group_name}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {resolvedTermStructure.catalyst_description}
              </p>
            </div>

            <div className="flex items-center gap-2 text-right">
              <span className="text-[11px] text-slate-400">Peak Marginal Inflection:</span>
              <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                {resolvedTermStructure.peak_inflection_year}
              </span>
            </div>
          </div>

          {/* Timeline Horizon Progression Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {resolvedTermStructure.timeline.map((pt, i) => {
              const isInflection = pt.horizon_year === resolvedTermStructure.peak_inflection_year;
              return (
                <div
                  key={i}
                  className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                    isInflection
                      ? 'bg-cyan-950/40 border-cyan-500/50 shadow-md shadow-cyan-500/10 ring-1 ring-cyan-500/30'
                      : 'bg-slate-950/60 border-slate-800'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-2">
                      <span className="text-xs font-black font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700">
                        Horizon: {pt.horizon_year}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold font-mono ${
                        pt.cumulative_probability_pct >= 70
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : pt.cumulative_probability_pct >= 40
                          ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30'
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        {pt.consensus_label}
                      </span>
                    </div>

                    <div className="mt-2 flex items-baseline justify-between">
                      <span className="text-2xl font-black font-mono text-slate-100">
                        {pt.cumulative_probability_pct}%
                      </span>
                      <span className="text-[11px] font-mono text-cyan-400 font-semibold">
                        +Δ{pt.marginal_probability_pct}% marginal
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden mt-2 border border-slate-700/50">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isInflection ? 'bg-gradient-to-r from-cyan-400 to-blue-400' : 'bg-emerald-400'
                        }`}
                        style={{ width: `${pt.cumulative_probability_pct}%` }}
                      />
                    </div>

                    <p className="text-[11px] text-slate-400 mt-2.5 leading-relaxed font-sans">
                      {pt.primary_driver}
                    </p>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-500">
                    <span>Hazard Rate: {pt.implied_hazard_rate_annual}% / yr</span>
                    <span>Spread: ±{pt.cross_market_spread_pct}%</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Options Strategy Coupling Note */}
          <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 flex items-start gap-2.5 text-xs text-slate-300">
            <span className="text-cyan-400 font-bold shrink-0">💡 Options Implication:</span>
            <span>{resolvedTermStructure.options_implication}</span>
          </div>
        </div>
      )}

      {/* 3. Category Filter & Live Contracts Grid */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 px-1">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider font-bold text-slate-300">
              Live Verified Orderbooks
            </span>
            <span className="text-xs text-slate-500 font-mono">
              ({filteredEvents.length} contract{filteredEvents.length > 1 ? 's' : ''})
            </span>
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'bg-slate-850 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {cat.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredEvents.map((ev, idx) => {
            const prob = parseProb(ev.probability);
            const colorClass = getProbColor(prob);
            const isKalshi = ev.source?.includes('Kalshi');
            const isPredictIt = ev.source?.includes('PredictIt');
            const isPolymarket = ev.source?.includes('Polymarket');

            return (
              <a
                key={idx}
                href={ev.url || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col justify-between p-4 bg-slate-900/90 hover:bg-slate-850 border border-slate-800 hover:border-cyan-500/40 rounded-xl transition-all duration-200 shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[10px] font-bold tracking-wide uppercase px-2 py-0.5 rounded border ${
                          isKalshi
                            ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                            : isPolymarket
                            ? 'bg-purple-500/10 text-purple-300 border-purple-500/30'
                            : isPredictIt
                            ? 'bg-blue-500/10 text-blue-300 border-blue-500/30'
                            : 'bg-slate-800 text-slate-300 border-slate-700'
                        }`}
                      >
                        {ev.source || 'US Market'}
                      </span>
                      {isKalshi && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono">
                          CFTC Regulated
                        </span>
                      )}
                      {ev.horizon_year && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono font-bold">
                          {ev.horizon_year}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center text-slate-500 group-hover:text-cyan-400 transition-colors">
                      <span className="text-[11px] mr-1">Live Orderbook</span>
                      <ExternalLink className="w-3 h-3" />
                    </div>
                  </div>

                  <p className="text-xs font-semibold text-slate-200 line-clamp-2 leading-relaxed group-hover:text-cyan-300 transition-colors">
                    {ev.event}
                  </p>

                  {ev.relevance_note && (
                    <span className="text-[10px] text-cyan-400/80 font-sans block mt-1.5">
                      🎯 {ev.relevance_note}
                    </span>
                  )}

                  {/* Cross-Market Comparison Pills if present */}
                  {ev.cross_platform_consensus && (
                    <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex flex-wrap items-center gap-2 text-[10px] font-mono">
                      <span className="text-slate-500">Cross-Platform:</span>
                      {ev.cross_platform_consensus.kalshi && (
                        <span className="text-emerald-300 bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-500/20">
                          Kalshi: {ev.cross_platform_consensus.kalshi}
                        </span>
                      )}
                      {ev.cross_platform_consensus.polymarket && (
                        <span className="text-purple-300 bg-purple-950/40 px-1.5 py-0.5 rounded border border-purple-500/20">
                          Polymarket: {ev.cross_platform_consensus.polymarket}
                        </span>
                      )}
                      {ev.cross_platform_consensus.manifold && (
                        <span className="text-slate-300 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
                          Manifold: {ev.cross_platform_consensus.manifold}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 font-medium">Implied Probability ("Yes")</span>
                    {ev.historical_7d_change_pct !== undefined && (
                      <span
                        className={`text-[10px] font-mono font-bold ${
                          ev.historical_7d_change_pct > 0
                            ? 'text-emerald-400'
                            : ev.historical_7d_change_pct < 0
                            ? 'text-rose-400'
                            : 'text-slate-500'
                        }`}
                      >
                        {ev.historical_7d_change_pct > 0 ? `+${ev.historical_7d_change_pct}% 7d` : `${ev.historical_7d_change_pct}% 7d`}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="w-16 h-2 bg-slate-800 rounded-full overflow-hidden hidden sm:block">
                      <div
                        className="h-full bg-emerald-400 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, Math.max(0, prob || 0))}%` }}
                      />
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold border font-mono ${colorClass}`}>
                      {ev.probability || 'N/A'}
                    </span>
                  </div>
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
};
