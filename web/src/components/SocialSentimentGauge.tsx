import React from 'react';
import { SocialSentiment } from '../types/options';
import { Flame, Activity, MessageSquare } from './icons';

interface SocialSentimentGaugeProps {
  sentiment?: SocialSentiment;
}

export const SocialSentimentGauge: React.FC<SocialSentimentGaugeProps> = ({ sentiment = {} }) => {
  const stocktwits_sentiment = sentiment.stocktwits_sentiment || 'Neutral';
  const stocktwits_bullish_pct = sentiment.stocktwits_bullish_pct !== undefined ? sentiment.stocktwits_bullish_pct : 50.0;
  const reddit_rank = sentiment.reddit_rank || 'N/A';
  const reddit_sentiment = sentiment.reddit_sentiment || 'Neutral';
  const social_volume_flag = sentiment.social_volume_flag || 'Normal';

  const bullPct = Math.min(100, Math.max(0, parseFloat(String(stocktwits_bullish_pct)) || 50));
  const bearPct = parseFloat((100 - bullPct).toFixed(1));

  const getSentimentBadge = (sent: string) => {
    const s = (sent || '').toLowerCase();
    if (s.includes('bull')) {
      return { label: 'Bullish', bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' };
    }
    if (s.includes('bear')) {
      return { label: 'Bearish', bg: 'bg-rose-500/10 text-rose-400 border-rose-500/30' };
    }
    return { label: 'Neutral', bg: 'bg-amber-500/10 text-amber-400 border-amber-500/30' };
  };

  const stBadge = getSentimentBadge(stocktwits_sentiment);
  const redditBadge = getSentimentBadge(reddit_sentiment);

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-xl p-5 text-slate-100 shadow-lg space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
            <Flame className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs uppercase tracking-wider font-bold text-slate-300 block">
              Retail &amp; Forum Sentiment Velocity
            </span>
            <p className="text-xs text-slate-500 mt-0.5">
              Aggregated stream analysis from StockTwits &amp; Reddit /r/WallStreetBets
            </p>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${stBadge.bg}`}>
          {stBadge.label}
        </span>
      </div>

      {/* StockTwits Bull vs Bear Gauge */}
      <div>
        <div className="flex justify-between items-end mb-2">
          <div>
            <span className="text-xs font-medium text-emerald-400 block">StockTwits Bullish Ratio</span>
            <span className="text-xl font-extrabold text-slate-100">{bullPct}%</span>
          </div>
          <div className="text-right">
            <span className="text-xs font-medium text-rose-400 block">Bearish Ratio</span>
            <span className="text-xl font-extrabold text-slate-100">{bearPct}%</span>
          </div>
        </div>

        {/* Dual-Segment Meter */}
        <div className="h-3.5 w-full bg-slate-800 rounded-full flex overflow-hidden p-0.5 gap-1 border border-slate-700/50">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-l-full transition-all duration-500"
            style={{ width: `${bullPct}%` }}
          />
          <div
            className="h-full bg-gradient-to-r from-rose-400 to-rose-500 rounded-r-full transition-all duration-500"
            style={{ width: `${bearPct}%` }}
          />
        </div>

        <div className="flex justify-between text-[11px] text-slate-400 mt-2 px-0.5 font-mono">
          <span>Source: StockTwits Feed</span>
          <span className="text-slate-500">50% Balanced Baseline</span>
        </div>
      </div>

      {/* Reddit / WSB Intelligence Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
        <div className="p-3.5 bg-slate-800/40 border border-slate-700/50 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-slate-400 uppercase block">
              Reddit WSB Rank
            </span>
            <span className="text-sm font-bold text-slate-200 mt-0.5 block font-mono">
              {reddit_rank}
            </span>
          </div>
          <span className={`px-2 py-0.5 rounded text-xs font-medium border ${redditBadge.bg}`}>
            {redditBadge.label}
          </span>
        </div>

        <div className="p-3.5 bg-slate-800/40 border border-slate-700/50 rounded-xl">
          <span className="text-[11px] font-medium text-slate-400 uppercase block">
            Comment Velocity (24H)
          </span>
          <span className="text-sm font-bold text-slate-200 mt-0.5 block font-mono">
            {social_volume_flag}
          </span>
        </div>
      </div>
    </div>
  );
};
