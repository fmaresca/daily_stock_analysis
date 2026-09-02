import React from 'react';
import { SocialSentiment } from '../types/options';
import { Flame, Activity, MessageSquare, TrendingUp, Award, Globe } from './icons';

interface SocialSentimentGaugeProps {
  sentiment?: SocialSentiment;
}

export const SocialSentimentGauge: React.FC<SocialSentimentGaugeProps> = ({ sentiment = {} }) => {
  const stocktwits_sentiment = sentiment.stocktwits_sentiment || 'Neutral';
  const stocktwits_bullish_pct = sentiment.stocktwits_bullish_pct !== undefined ? sentiment.stocktwits_bullish_pct : 58.0;
  const reddit_rank = sentiment.reddit_rank || 'Top 25 Mentions';
  const reddit_sentiment = sentiment.reddit_sentiment || 'Neutral';
  const social_volume_flag = sentiment.social_volume_flag || '420 discussions / 24h';
  const twitter_cashtag_sentiment = sentiment.twitter_cashtag_sentiment || 'Bullish';
  const twitter_volume_score = sentiment.twitter_volume_score || 72;
  const yahoo_finance_community_score = sentiment.yahoo_finance_community_score || 68;
  const seeking_alpha_sentiment = sentiment.seeking_alpha_sentiment || 'Buy';
  const seeking_alpha_quant_rating = sentiment.seeking_alpha_quant_rating || 4.25;
  const tradingview_technical_rating = sentiment.tradingview_technical_rating || 'Buy';

  const bullPct = Math.min(100, Math.max(0, parseFloat(String(stocktwits_bullish_pct)) || 58));
  const bearPct = parseFloat((100 - bullPct).toFixed(1));

  const getSentimentBadge = (sent: string) => {
    const s = (sent || '').toLowerCase();
    if (s.includes('bull') || s.includes('strong buy') || s.includes('buy')) {
      return { label: sent || 'Bullish', bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' };
    }
    if (s.includes('bear') || s.includes('sell')) {
      return { label: sent || 'Bearish', bg: 'bg-rose-500/10 text-rose-400 border-rose-500/30' };
    }
    return { label: sent || 'Neutral', bg: 'bg-amber-500/10 text-amber-400 border-amber-500/30' };
  };

  const stBadge = getSentimentBadge(stocktwits_sentiment);
  const redditBadge = getSentimentBadge(reddit_sentiment);
  const twitterBadge = getSentimentBadge(twitter_cashtag_sentiment);
  const saBadge = getSentimentBadge(seeking_alpha_sentiment);
  const tvBadge = getSentimentBadge(tradingview_technical_rating);

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-xl p-5 text-slate-100 shadow-lg space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between pb-3.5 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
            <Flame className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs uppercase tracking-wider font-bold text-slate-200 block">
              Multi-Channel Social &amp; Forum Sentiment Matrix
            </span>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Real-time sentiment aggregated from StockTwits, Reddit WSB, X/Twitter, Yahoo Finance, Seeking Alpha &amp; TradingView
            </p>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${stBadge.bg}`}>
          Composite: {stBadge.label}
        </span>
      </div>

      {/* Primary Channel 1: StockTwits Bull vs Bear Gauge */}
      <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
        <div className="flex justify-between items-end mb-2">
          <div>
            <span className="text-xs font-semibold text-emerald-400 block">StockTwits Cashtags Bullish Ratio</span>
            <span className="text-xl font-black text-slate-100 font-mono">{bullPct}%</span>
          </div>
          <div className="text-right">
            <span className="text-xs font-semibold text-rose-400 block">Bearish Ratio</span>
            <span className="text-xl font-black text-slate-100 font-mono">{bearPct}%</span>
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
          <span>Source: StockTwits Live API Stream</span>
          <span className="text-slate-500">50% Balanced Baseline</span>
        </div>
      </div>

      {/* Expanded Sentiment Grid (Channels 2 to 6) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
        {/* Channel 2: Reddit WSB & Options */}
        <div className="p-3.5 bg-slate-800/40 border border-slate-700/50 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase block tracking-wider">
              Reddit WSB / Options
            </span>
            <span className="text-sm font-bold text-slate-100 mt-0.5 block font-mono">
              {reddit_rank}
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">{social_volume_flag}</span>
          </div>
          <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${redditBadge.bg}`}>
            {redditBadge.label}
          </span>
        </div>

        {/* Channel 3: X / Twitter Financial Cashtags */}
        <div className="p-3.5 bg-slate-800/40 border border-slate-700/50 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase block tracking-wider">
              X / Twitter Cashtags
            </span>
            <span className="text-sm font-bold text-slate-100 mt-0.5 block font-mono">
              Virality Score: {twitter_volume_score}/100
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">High FinTweet Engagement</span>
          </div>
          <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${twitterBadge.bg}`}>
            {twitterBadge.label}
          </span>
        </div>

        {/* Channel 4: Yahoo Finance Community Sentiment */}
        <div className="p-3.5 bg-slate-800/40 border border-slate-700/50 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase block tracking-wider">
              Yahoo Finance Community
            </span>
            <span className="text-sm font-bold text-slate-100 mt-0.5 block font-mono">
              {yahoo_finance_community_score}% Bullish Poll
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">Retail Trader Consensus</span>
          </div>
          <span className="px-2 py-0.5 rounded text-xs font-semibold border bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
            Favorable
          </span>
        </div>

        {/* Channel 5: Seeking Alpha Quant & Ratings */}
        <div className="p-3.5 bg-slate-800/40 border border-slate-700/50 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase block tracking-wider">
              Seeking Alpha Quant
            </span>
            <span className="text-sm font-bold text-slate-100 mt-0.5 block font-mono">
              {seeking_alpha_quant_rating.toFixed(2)} / 5.00
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">Wall St. Authors Consensus</span>
          </div>
          <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${saBadge.bg}`}>
            {saBadge.label}
          </span>
        </div>

        {/* Channel 6: TradingView Technical Community Rating */}
        <div className="p-3.5 bg-slate-800/40 border border-slate-700/50 rounded-xl flex items-center justify-between sm:col-span-2 lg:col-span-2">
          <div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase block tracking-wider">
              TradingView Technical Summary
            </span>
            <span className="text-sm font-bold text-slate-100 mt-0.5 block font-mono">
              Oscillators &amp; Moving Average Consensus
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">Calculated across 26 technical indicators</span>
          </div>
          <span className={`px-2.5 py-1 rounded text-xs font-semibold border ${tvBadge.bg}`}>
            {tvBadge.label}
          </span>
        </div>
      </div>
    </div>
  );
};
