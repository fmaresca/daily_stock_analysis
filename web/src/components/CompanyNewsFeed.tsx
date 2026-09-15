import React, { useState, useEffect, useCallback } from 'react';
import {
  Newspaper,
  ExternalLink,
  RefreshCw,
  Building,
} from './icons';

// ─── Types ────────────────────────────────────────────────────────────────────

interface NewsItem {
  id: string;
  title: string;
  link: string;
  source: string;
  publisher?: string;
  publishedAt: string;
  category: 'news' | 'sec-8k';
}

interface NewsSources {
  marketChameleon: number;
  googleNews: number;
  yahooFinance: number;
  secEdgar: number;
}

interface NewsPayload {
  ticker: string;
  total: number;
  sources: NewsSources;
  mcBlocked: boolean;
  items: NewsItem[];
  cachedAt: string;
}

type FilterTab = 'all' | 'mc' | 'top' | 'sec';

interface CompanyNewsFeedProps {
  /** Ticker symbol, e.g. "AAPL" */
  ticker: string;
  /** Optional CSS class for the outer container */
  className?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sourceBadgeClass(source: string): string {
  if (source === 'MarketChameleon')
    return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
  if (source === 'SEC EDGAR')
    return 'bg-purple-500/15 text-purple-300 border-purple-500/30';
  if (source.startsWith('Yahoo'))
    return 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30';
  return 'bg-slate-700/60 text-slate-300 border-slate-600/50';
}

function shortSource(source: string): string {
  if (source === 'MarketChameleon') return 'MC';
  if (source === 'SEC EDGAR') return 'SEC 8-K';
  if (source.startsWith('Yahoo')) return 'Yahoo';
  if (source.startsWith('Google')) {
    const parts = source.split('·');
    return parts.length > 1 ? parts[1].trim() : 'Google News';
  }
  return source;
}

// ─── Tab bar ─────────────────────────────────────────────────────────────────

const TABS: { id: FilterTab; label: string; emoji: string }[] = [
  { id: 'all', label: 'All', emoji: '📰' },
  { id: 'mc', label: 'MarketChameleon', emoji: '🦎' },
  { id: 'top', label: 'Top News', emoji: '🔥' },
  { id: 'sec', label: 'SEC 8-K', emoji: '🏛' },
];

// ─── Component ────────────────────────────────────────────────────────────────

export const CompanyNewsFeed: React.FC<CompanyNewsFeedProps> = ({
  ticker,
  className = '',
}) => {
  const [payload, setPayload] = useState<NewsPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

  const mcNewsUrl = `https://marketchameleon.com/Overview/${ticker}/News/`;

  const fetchNews = useCallback(async () => {
    if (!ticker) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/news/${encodeURIComponent(ticker)}`);
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const data: NewsPayload = await res.json();
      setPayload(data);
      setLastFetched(new Date());
    } catch (err: any) {
      setError(err?.message || 'Failed to load news');
    } finally {
      setLoading(false);
    }
  }, [ticker]);

  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  // ── Derived lists ────────────────────────────────────────────────────────
  const allItems = payload?.items ?? [];

  const filteredItems: NewsItem[] = (() => {
    switch (activeTab) {
      case 'mc':
        return allItems.filter((i) => i.source === 'MarketChameleon');
      case 'top':
        return allItems.filter(
          (i) => i.source !== 'MarketChameleon' && i.category !== 'sec-8k'
        );
      case 'sec':
        return allItems.filter((i) => i.category === 'sec-8k');
      default:
        return allItems;
    }
  })();

  const tabCount = (tab: FilterTab): number => {
    switch (tab) {
      case 'mc':
        return payload?.sources.marketChameleon ?? 0;
      case 'top':
        return (payload?.sources.googleNews ?? 0) + (payload?.sources.yahooFinance ?? 0);
      case 'sec':
        return payload?.sources.secEdgar ?? 0;
      default:
        return payload?.total ?? 0;
    }
  };

  const mcBlocked = payload?.mcBlocked ?? false;

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div
      className={`bg-slate-900/60 rounded-2xl border border-slate-800 overflow-hidden ${className}`}
      id={`company-news-feed-${ticker}`}
    >
      {/* ── Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 pt-4 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Newspaper className="w-4 h-4 text-blue-400 shrink-0" />
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            Live News Feed
          </h3>
          {ticker && (
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
              {ticker}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* MarketChameleon launcher — always visible */}
          <a
            href={mcNewsUrl}
            target="_blank"
            rel="noopener noreferrer"
            id={`mc-launcher-${ticker}`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold
              bg-emerald-950/60 hover:bg-emerald-900/80
              text-emerald-300 hover:text-white
              border border-emerald-600/40 hover:border-emerald-500
              transition-all shadow-sm"
            title={`View ${ticker} live news on MarketChameleon`}
          >
            <span>View Live on MarketChameleon</span>
            <ExternalLink className="w-3 h-3" />
          </a>

          {/* Refresh */}
          <button
            onClick={fetchNews}
            disabled={loading}
            id={`news-refresh-${ticker}`}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-40 cursor-pointer"
            title="Refresh news"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* ── Source summary row ── */}
      {payload && !loading && (
        <div className="flex flex-wrap gap-2 px-4 py-2.5 border-b border-slate-800/60 bg-slate-950/40">
          {[
            { label: 'MarketChameleon', count: payload.sources.marketChameleon, cls: 'text-emerald-400' },
            { label: 'Google News', count: payload.sources.googleNews, cls: 'text-blue-400' },
            { label: 'Yahoo Finance', count: payload.sources.yahooFinance, cls: 'text-cyan-400' },
            { label: 'SEC 8-K', count: payload.sources.secEdgar, cls: 'text-purple-400' },
          ].map(({ label, count, cls }) => (
            <span key={label} className="text-[10px] font-mono text-slate-500">
              <span className={`font-bold ${cls}`}>{count}</span>{' '}
              <span>{label}</span>
            </span>
          ))}
          {lastFetched && (
            <span className="ml-auto text-[10px] font-mono text-slate-600">
              {lastFetched.toLocaleTimeString()}
            </span>
          )}
        </div>
      )}

      {/* ── Filter tabs ── */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-800/60 overflow-x-auto">
        {TABS.map((tab) => {
          const count = tabCount(tab.id);
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`news-tab-${tab.id}-${ticker}`}
              onClick={() => setActiveTab(tab.id)}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer border ${
                active
                  ? 'bg-blue-600 text-white border-blue-500 shadow shadow-blue-600/20'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border-slate-700/80 hover:bg-slate-800'
              }`}
            >
              <span>{tab.emoji}</span>
              <span>{tab.label}</span>
              {payload && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                    active
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-800 text-slate-500 border border-slate-700'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── MarketChameleon blocked banner (only on MC tab) ── */}
      {activeTab === 'mc' && mcBlocked && !loading && (
        <div className="mx-4 mt-3 flex items-start gap-3 p-3.5 rounded-xl bg-amber-950/40 border border-amber-600/30 text-amber-200 text-xs">
          <span className="text-lg leading-none">⚠️</span>
          <div className="space-y-1">
            <p className="font-semibold">
              MarketChameleon live stream is protected by Cloudflare anti-bot.
            </p>
            <p className="text-amber-300/80">
              Click below to view {ticker} news directly on MarketChameleon.
            </p>
            <a
              href={mcNewsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 mt-1 px-3 py-1.5 rounded-lg bg-amber-600/20 hover:bg-amber-600/40 border border-amber-500/40 text-amber-200 font-semibold transition-colors"
            >
              Open {ticker} News on MarketChameleon
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      )}

      {/* ── Body ── */}
      <div className="p-4 space-y-2.5">
        {/* Loading skeleton */}
        {loading && (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="bg-slate-950/60 rounded-xl border border-slate-800 p-3.5 animate-pulse space-y-2"
              >
                <div className="h-3 bg-slate-800 rounded w-3/4" />
                <div className="h-2.5 bg-slate-800 rounded w-1/3" />
              </div>
            ))}
          </div>
        )}

        {/* Error state */}
        {!loading && error && (
          <div className="py-6 text-center text-sm text-rose-400">
            <span className="block text-xl mb-2">⚠️</span>
            {error}
            <button
              onClick={fetchNews}
              className="mt-3 block mx-auto text-xs text-slate-400 hover:text-white underline cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && filteredItems.length === 0 && (
          <div className="py-8 text-center text-slate-500 text-sm">
            {activeTab === 'mc' && mcBlocked ? null : (
              <>
                <span className="block text-2xl mb-2">📭</span>
                No {activeTab === 'sec' ? 'SEC 8-K filings' : 'articles'} found for{' '}
                <strong className="text-slate-300">{ticker}</strong>
              </>
            )}
          </div>
        )}

        {/* News items */}
        {!loading && !error &&
          filteredItems.map((item) => (
            <a
              key={item.id}
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              id={`news-item-${item.id}`}
              className="group block bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80
                hover:border-slate-600 hover:bg-slate-900/80
                transition-all duration-150 space-y-2"
            >
              <div className="flex flex-wrap items-center gap-1.5">
                {/* Category badge */}
                <span
                  className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded border ${
                    item.category === 'sec-8k'
                      ? 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  {item.category === 'sec-8k' ? '🏛 8-K' : '📰 news'}
                </span>

                {/* Source badge */}
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${sourceBadgeClass(item.source)}`}
                >
                  {shortSource(item.source)}
                </span>

                {/* Publisher (MC extra label) */}
                {item.publisher && item.publisher !== 'MarketChameleon' && (
                  <span className="text-[10px] text-slate-500 font-mono truncate max-w-[160px]">
                    via {item.publisher}
                  </span>
                )}

                <span className="ml-auto text-[10px] font-mono text-slate-600 shrink-0">
                  {item.publishedAt}
                </span>
              </div>

              <h4
                className="text-xs font-semibold text-slate-200 leading-snug
                  group-hover:text-white transition-colors line-clamp-2"
              >
                {item.title}
              </h4>

              <div className="flex items-center gap-1 text-[10px] text-slate-600 group-hover:text-slate-400 transition-colors">
                <ExternalLink className="w-3 h-3" />
                <span className="truncate">{item.link.replace(/^https?:\/\//, '').split('?')[0]}</span>
              </div>
            </a>
          ))}

        {/* SEC filings CTA */}
        {!loading && activeTab === 'sec' && (payload?.sources.secEdgar ?? 0) > 0 && (
          <a
            href={`https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${ticker}&type=8-K&count=20`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 mt-1 py-2.5 px-4 rounded-xl
              bg-purple-950/40 hover:bg-purple-900/60
              border border-purple-500/30 hover:border-purple-500/60
              text-purple-300 hover:text-white text-xs font-semibold
              transition-all"
          >
            <Building className="w-3.5 h-3.5" />
            View All {ticker} Filings on SEC EDGAR
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
    </div>
  );
};

export default CompanyNewsFeed;
