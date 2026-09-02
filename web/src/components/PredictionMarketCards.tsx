import React from 'react';
import { PredictionMarketEvent } from '../types/options';
import { ExternalLink } from './icons';

interface PredictionMarketCardsProps {
  events?: PredictionMarketEvent[];
}

export const PredictionMarketCards: React.FC<PredictionMarketCardsProps> = ({ events = [] }) => {
  if (!events || events.length === 0) {
    return (
      <div className="p-8 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
        <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-slate-800/80 flex items-center justify-center text-slate-400 text-lg">
          🎲
        </div>
        <p className="text-sm font-bold text-slate-300">No Active Prediction Markets</p>
        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
          No live binary outcome contracts currently indexed on Polymarket Gamma or Manifold Markets for this ticker.
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase tracking-wider font-bold text-slate-300">
            Live Binary Event Probabilities
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/30">
            Crowdsourced Intelligence
          </span>
        </div>
        <span className="text-xs text-slate-500 font-mono">
          {events.length} active contract{events.length > 1 ? 's' : ''}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {events.map((ev, idx) => {
          const prob = parseProb(ev.probability);
          const colorClass = getProbColor(prob);
          const isKalshi = ev.source?.includes('Kalshi');
          const isPredictIt = ev.source?.includes('PredictIt');

          return (
            <a
              key={idx}
              href={ev.url || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col justify-between p-4 bg-slate-900/90 hover:bg-slate-850 border border-slate-800 hover:border-blue-500/40 rounded-xl transition-all duration-200 shadow-md"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[10px] font-bold tracking-wide uppercase px-2 py-0.5 rounded border ${
                      isKalshi
                        ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                        : isPredictIt
                        ? 'bg-blue-500/10 text-blue-300 border-blue-500/30'
                        : 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}>
                      {ev.source || 'US Market'}
                    </span>
                    {isKalshi && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono">
                        CFTC Regulated
                      </span>
                    )}
                  </div>
                  <div className="flex items-center text-slate-500 group-hover:text-cyan-400 transition-colors">
                    <span className="text-[11px] mr-1">Live Orderbook</span>
                    <ExternalLink className="w-3 h-3" />
                  </div>
                </div>

                <p className="text-xs font-semibold text-slate-200 line-clamp-2 leading-relaxed group-hover:text-blue-300 transition-colors">
                  {ev.event}
                </p>
                {ev.relevance_note && (
                  <span className="text-[10px] text-cyan-400/80 font-sans block mt-1.5">
                    🎯 {ev.relevance_note}
                  </span>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-xs text-slate-400 font-medium">Implied Probability ("Yes")</span>
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
  );
};
