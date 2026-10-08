import React, { useState } from 'react';
import {
  Flame,
  Activity,
  MessageSquare,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  AlertTriangle,
  Globe,
  HelpCircle,
  Sparkles,
} from './icons';
import { AdanosMarketSentiment } from '../types/options';

interface MarketSentimentSectionProps {
  sentiment: AdanosMarketSentiment | null;
  isLoading?: boolean;
  symbol: string;
}

export const MarketSentimentSection: React.FC<MarketSentimentSectionProps> = ({
  sentiment,
  isLoading = false,
  symbol,
}) => {
  const [isAiExplanationOpen, setIsAiExplanationOpen] = useState(true);

  // 1. Loading Skeleton State
  if (isLoading) {
    return (
      <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-4 animate-pulse">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-slate-800 rounded-full" />
            <div className="h-4 w-36 bg-slate-800 rounded" />
          </div>
          <div className="h-5 w-20 bg-slate-800 rounded-full" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="h-20 bg-slate-950/70 rounded-lg border border-slate-800" />
          <div className="h-20 bg-slate-950/70 rounded-lg border border-slate-800" />
          <div className="h-20 bg-slate-950/70 rounded-lg border border-slate-800" />
        </div>
      </div>
    );
  }

  // 2. Unconfigured or Unavailable Quiet Fallback State
  const hasData = Boolean(
    sentiment &&
    sentiment.configured !== false &&
    (sentiment.sentiment_score !== null ||
      sentiment.buzz_score !== null ||
      (sentiment.sources && Object.keys(sentiment.sources).length > 0))
  );

  if (!hasData) {
    return (
      <div className="bg-slate-900/40 p-3.5 rounded-xl border border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2.5">
          <Activity className="w-4 h-4 text-slate-500 shrink-0" />
          <div>
            <span className="font-semibold text-slate-300">Market Sentiment: </span>
            <span className="text-slate-400">Sentiment unavailable</span>
            <span className="text-slate-500 text-[11px] block sm:inline sm:ml-2">
              (No active coverage or API unconfigured for ${symbol})
            </span>
          </div>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800/80 text-slate-400 border border-slate-700/50">
          Adanos Feed
        </span>
      </div>
    );
  }

  // 3. Populated Sentiment State
  const sentimentScore = sentiment?.sentiment_score ?? null;
  const buzzScore = sentiment?.buzz_score ?? null;
  const bullPct = sentiment?.bullish_pct ?? null;
  const bearPct = sentiment?.bearish_pct ?? null;
  const mentions = sentiment?.mentions ?? 0;
  const trend = (sentiment?.trend || 'stable').toLowerCase();
  const explanation = sentiment?.explanation || null;
  const explanationSource = sentiment?.explanation_source || 'Adanos';
  const sources = sentiment?.sources || {};
  const asOf = sentiment?.asOf ? new Date(sentiment.asOf).toLocaleTimeString() : 'Recent';

  // Sentiment Color & Badge Mapping
  const getScoreColor = (score: number | null) => {
    if (score === null) return 'text-slate-400';
    if (score >= 0.15) return 'text-emerald-400';
    if (score <= -0.15) return 'text-rose-400';
    return 'text-amber-400';
  };

  const getTrendBadge = (t: string) => {
    if (t === 'rising') {
      return {
        label: 'Rising Momentum',
        className: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
      };
    }
    if (t === 'falling') {
      return {
        label: 'Fading Momentum',
        className: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
      };
    }
    return {
      label: 'Stable Discussion',
      className: 'bg-slate-800 text-slate-300 border-slate-700',
    };
  };

  const trendBadge = getTrendBadge(trend);

  // Source Row Definition (max 4 rows)
  const sourceDefs: { key: string; name: string; icon: string }[] = [
    { key: 'reddit', name: 'Reddit (WSB / Stocks)', icon: '💬' },
    { key: 'x', name: 'X / Twitter ($Cashtags)', icon: '🐦' },
    { key: 'polymarket', name: 'Polymarket Contracts', icon: '🔮' },
    { key: 'news', name: 'Financial News Desk', icon: '📰' },
  ];

  return (
    <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-4 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
        <div className="flex items-center space-x-2">
          <Flame className="w-4 h-4 text-amber-400" />
          <div>
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <span>Market Sentiment &amp; Attention Layer</span>
              <span className="text-[10px] font-mono text-cyan-400 lowercase font-normal">
                (Adanos Intelligence)
              </span>
            </h3>
            <div className="text-[10px] text-slate-400">
              Cross-platform directional sentiment &amp; social buzz signals for ${symbol}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {sentiment?.stale && (
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Stale Cache
            </span>
          )}
          <span
            className={`px-2.5 py-0.5 rounded-full text-xs font-bold font-mono border ${trendBadge.className}`}
          >
            {trendBadge.label}
          </span>
        </div>
      </div>

      {/* Primary KPI Grid: Sentiment Score, Buzz Score, Bull/Bear Split */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* KPI 1: Market Sentiment Score (-1.0 to +1.0) */}
        <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="text-[11px] text-slate-400">Market Sentiment Score</div>
            <div className={`text-xl font-bold font-mono mt-1 ${getScoreColor(sentimentScore)}`}>
              {sentimentScore !== null ? (sentimentScore > 0 ? `+${sentimentScore.toFixed(2)}` : sentimentScore.toFixed(2)) : 'Neutral'}
            </div>
          </div>

          {/* Scale Gauge Indicator (-1 to +1) */}
          <div className="mt-2 space-y-1">
            <div className="w-full bg-slate-800 h-1.5 rounded-full relative overflow-hidden flex">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  sentimentScore !== null && sentimentScore >= 0 ? 'bg-emerald-400' : 'bg-rose-400'
                }`}
                style={{
                  width: `${Math.min(100, Math.max(0, sentimentScore !== null ? ((sentimentScore + 1) / 2) * 100 : 50))}%`,
                }}
              />
            </div>
            <div className="flex justify-between text-[9px] font-mono text-slate-500">
              <span>-1.0 Bear</span>
              <span>0.0 Neutral</span>
              <span>+1.0 Bull</span>
            </div>
          </div>
        </div>

        {/* KPI 2: Buzz Score (0-100) */}
        <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="text-[11px] text-slate-400">Buzz Score (Attention Index)</div>
            <div className="text-xl font-bold font-mono text-cyan-300 mt-1">
              {buzzScore !== null ? `${buzzScore} / 100` : 'N/A'}
            </div>
          </div>
          <p className="text-[10px] text-slate-400 mt-2">
            Discussion velocity across Reddit, X, and financial media.
          </p>
        </div>

        {/* KPI 3: Bullish / Bearish Share Split Bar */}
        <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center text-[11px] text-slate-400">
              <span>Bullish / Bearish Share</span>
              <span className="font-mono text-[10px] text-slate-500">{mentions.toLocaleString()} mentions</span>
            </div>
            <div className="flex justify-between text-xs font-bold font-mono mt-1">
              <span className="text-emerald-400">{bullPct !== null ? `${bullPct}% Bull` : 'N/A'}</span>
              <span className="text-rose-400">{bearPct !== null ? `${bearPct}% Bear` : 'N/A'}</span>
            </div>
          </div>

          {/* Split Bar */}
          <div className="mt-2 w-full bg-slate-800 h-2 rounded-full overflow-hidden flex">
            {bullPct !== null && bearPct !== null ? (
              <>
                <div className="bg-emerald-500 h-full transition-all" style={{ width: `${bullPct}%` }} />
                <div
                  className="bg-slate-700 h-full transition-all"
                  style={{ width: `${Math.max(0, 100 - bullPct - bearPct)}%` }}
                />
                <div className="bg-rose-500 h-full transition-all" style={{ width: `${bearPct}%` }} />
              </>
            ) : (
              <div className="bg-slate-700 w-full h-full" />
            )}
          </div>
        </div>
      </div>

      {/* AI Explanation Collapsible Section */}
      {explanation && (
        <div className="bg-slate-950/80 rounded-lg border border-slate-800/90 overflow-hidden">
          <button
            type="button"
            onClick={() => setIsAiExplanationOpen((prev) => !prev)}
            className="w-full px-3 py-2 flex items-center justify-between text-left hover:bg-slate-900/50 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>AI Discussion Context</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 uppercase font-normal">
                {explanationSource}
              </span>
            </div>
            {isAiExplanationOpen ? (
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            )}
          </button>

          {isAiExplanationOpen && (
            <div className="px-3 pb-3 text-xs text-slate-300 leading-relaxed border-t border-slate-900/80 pt-2 font-sans">
              {explanation}
            </div>
          )}
        </div>
      )}

      {/* Platform Breakdown Matrix (Max 4 Rows: Reddit, X, Polymarket, News) */}
      <div className="space-y-1.5">
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono">
          Platform Breakdown
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          {sourceDefs.map((def) => {
            const src = sources[def.key];
            if (!src) {
              return (
                <div
                  key={def.key}
                  className="bg-slate-950/40 p-2.5 rounded-lg border border-slate-900 flex items-center justify-between text-slate-500 opacity-60"
                >
                  <span className="flex items-center gap-1.5 font-medium">
                    <span>{def.icon}</span>
                    <span>{def.name}</span>
                  </span>
                  <span className="text-[10px] font-mono">No active mentions</span>
                </div>
              );
            }

            const srcScore = src.sentiment_score ?? null;
            const srcBuzz = src.buzz_score ?? null;
            const srcMentions = src.mentions ?? 0;

            return (
              <div
                key={def.key}
                className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between"
              >
                <div className="flex items-center gap-1.5">
                  <span>{def.icon}</span>
                  <div>
                    <span className="font-semibold text-slate-200 block text-xs">{def.name}</span>
                    <span className="text-[10px] font-mono text-slate-500">
                      {srcMentions.toLocaleString()} mentions
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 font-mono text-xs">
                  {srcBuzz !== null && (
                    <span className="text-cyan-300 bg-cyan-950/40 border border-cyan-800/40 px-1.5 py-0.5 rounded text-[10px]">
                      Buzz {srcBuzz}
                    </span>
                  )}
                  {srcScore !== null && (
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                        srcScore >= 0.15
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : srcScore <= -0.15
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      }`}
                    >
                      {srcScore > 0 ? `+${srcScore.toFixed(2)}` : srcScore.toFixed(2)}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Meta */}
      <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 border-t border-slate-800/80 pt-2">
        <span>As of: {asOf}</span>
        <span>Adanos Verified API v1.53.4</span>
      </div>
    </div>
  );
};
