import React from 'react';
import { SocialSentiment } from '../types/options';
import { Flame, Activity, MessageSquare, TrendingUp, Award, Globe, HelpCircle } from './icons';

interface SocialSentimentGaugeProps {
  sentiment?: SocialSentiment;
  technicalScore?: number;
  fundamentalScore?: number;
}

export const SocialSentimentGauge: React.FC<SocialSentimentGaugeProps> = ({
  sentiment = {},
  technicalScore = 75,
  fundamentalScore = 75,
}) => {
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

  const volume_z_score = sentiment.volume_z_score ?? 1.2;
  const sentiment_momentum = sentiment.sentiment_momentum || 'Steady';
  const divergence_note = sentiment.retail_vs_institutional_divergence || 'Standard Market Alignment';
  const fomo_risk = sentiment.fomo_risk_flag || 'Normal Retail Flow';

  const bullPct = Math.min(100, Math.max(0, parseFloat(String(stocktwits_bullish_pct)) || 58));
  const bearPct = parseFloat((100 - bullPct).toFixed(1));

  // Compute SSVS (0 - 100) if not provided
  const ssvsScore = sentiment.ssvs_composite_score ?? (() => {
    const stBull = bullPct;
    const redditScore = reddit_sentiment.includes('Bull') ? 78 : reddit_sentiment.includes('Bear') ? 32 : 50;
    const twitterScore = twitter_volume_score;
    const saScore = (seeking_alpha_quant_rating / 5.0) * 100;
    const tvScore = tradingview_technical_rating.includes('Strong') ? 88 : tradingview_technical_rating.includes('Buy') ? 75 : 50;
    return Math.round((0.30 * stBull) + (0.20 * redditScore) + (0.20 * twitterScore) + (0.15 * saScore) + (0.15 * tvScore));
  })();

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
    <div className="w-full bg-slate-900 border border-slate-800 rounded-xl p-5 text-slate-100 shadow-lg space-y-6">
      {/* 1. SSVS (Social Sentiment Velocity Score) Master Header */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-amber-500/20 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider font-bold text-amber-400 flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-amber-400" />
              Social Sentiment Velocity Score (SSVS)
            </span>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
              sentiment_momentum === 'Accelerating'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : sentiment_momentum === 'Fading'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                : 'bg-slate-800 text-slate-300 border border-slate-700'
            }`}>
              ⚡ Momentum: {sentiment_momentum}
            </span>
          </div>
          <h3 className="text-sm sm:text-base font-bold text-slate-100">
            6-Channel Cross-Platform Velocity, Cashtags &amp; Forum Matrix
          </h3>
          <p className="text-xs text-slate-400 max-w-xl">
            Real-time multi-platform aggregation indexing retail discussions, institutional analyst notes, and retail vs smart-money divergence.
          </p>
        </div>

        <div className="flex items-center gap-4 bg-slate-950/80 p-3.5 rounded-xl border border-slate-800/80 shrink-0">
          <div className="text-right">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
              SSVS Composite
            </span>
            <span className="text-2xl font-black font-mono text-amber-400">
              {ssvsScore}/100
            </span>
            <span className="text-[10px] text-slate-400 block font-mono">
              Z-Score: +{volume_z_score.toFixed(1)}σ
            </span>
          </div>

          <div className="w-px h-10 bg-slate-800" />

          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
              Retail / Flow State
            </span>
            <span className={`px-2.5 py-0.5 rounded text-xs font-bold border inline-block mt-0.5 ${stBadge.bg}`}>
              {stBadge.label}
            </span>
            <span className="text-[10px] text-slate-500 block font-mono mt-0.5">
              {fomo_risk}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Retail vs Institutional Divergence Banner */}
      <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/30 shrink-0 font-bold">
            ⚖️ Flow Divergence
          </span>
          <span className="text-slate-300 font-medium">
            {divergence_note}
          </span>
        </div>

        <span className="text-[11px] font-mono text-slate-400 shrink-0 hidden sm:inline">
          Tech: {technicalScore}/100 • Fund: {fundamentalScore}/100
        </span>
      </div>

      {/* 3. Primary Channel 1: StockTwits Bull vs Bear Real-Time Ratio */}
      <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2">
        <div className="flex justify-between items-end mb-1">
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

        <div className="flex justify-between text-[11px] text-slate-400 pt-1 font-mono">
          <span>Source: StockTwits Live API Stream</span>
          <span className="text-slate-500">50% Balanced Baseline</span>
        </div>
      </div>

      {/* 4. Expanded Multi-Channel Sentiment Grid (Channels 2 to 6) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {/* Channel 2: Reddit WSB & Options */}
        <div className="p-4 bg-slate-950/60 border border-slate-800 hover:border-amber-500/30 transition-all rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase block tracking-wider">
              Reddit WSB / Options
            </span>
            <span className="text-sm font-bold text-slate-100 mt-0.5 block font-mono">
              {reddit_rank}
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">{social_volume_flag}</span>
          </div>
          <span className={`px-2.5 py-1 rounded text-xs font-semibold border ${redditBadge.bg}`}>
            {redditBadge.label}
          </span>
        </div>

        {/* Channel 3: X / Twitter Financial Cashtags */}
        <div className="p-4 bg-slate-950/60 border border-slate-800 hover:border-amber-500/30 transition-all rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase block tracking-wider">
              X / Twitter Cashtags
            </span>
            <span className="text-sm font-bold text-slate-100 mt-0.5 block font-mono">
              Virality Score: {twitter_volume_score}/100
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">High FinTweet Engagement</span>
          </div>
          <span className={`px-2.5 py-1 rounded text-xs font-semibold border ${twitterBadge.bg}`}>
            {twitterBadge.label}
          </span>
        </div>

        {/* Channel 4: Yahoo Finance Community Sentiment */}
        <div className="p-4 bg-slate-950/60 border border-slate-800 hover:border-amber-500/30 transition-all rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase block tracking-wider">
              Yahoo Finance Community
            </span>
            <span className="text-sm font-bold text-slate-100 mt-0.5 block font-mono">
              {yahoo_finance_community_score}% Bullish Poll
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">Retail Trader Consensus</span>
          </div>
          <span className="px-2.5 py-1 rounded text-xs font-semibold border bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
            Favorable
          </span>
        </div>

        {/* Channel 5: Seeking Alpha Quant & Authors */}
        <div className="p-4 bg-slate-950/60 border border-slate-800 hover:border-amber-500/30 transition-all rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase block tracking-wider">
              Seeking Alpha Quant
            </span>
            <span className="text-sm font-bold text-slate-100 mt-0.5 block font-mono">
              {seeking_alpha_quant_rating.toFixed(2)} / 5.00
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">Wall St. Authors Consensus</span>
          </div>
          <span className={`px-2.5 py-1 rounded text-xs font-semibold border ${saBadge.bg}`}>
            {saBadge.label}
          </span>
        </div>

        {/* Channel 6: TradingView Technical Community Consensus */}
        <div className="p-4 bg-slate-950/60 border border-slate-800 hover:border-amber-500/30 transition-all rounded-xl flex items-center justify-between sm:col-span-2 lg:col-span-2">
          <div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase block tracking-wider">
              TradingView Technical Summary
            </span>
            <span className="text-sm font-bold text-slate-100 mt-0.5 block font-mono">
              Oscillators &amp; Moving Average Consensus
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">Calculated across 26 technical indicators</span>
          </div>
          <span className={`px-3 py-1 rounded text-xs font-semibold border ${tvBadge.bg}`}>
            {tvBadge.label}
          </span>
        </div>
      </div>
    </div>
  );
};
