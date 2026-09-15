import React, { useState, useEffect, useCallback } from 'react';
import { Newspaper, ExternalLink, RefreshCw, X } from './icons';

// ─── Types ────────────────────────────────────────────────────────────────────

interface NewsItem {
  id: string;
  title: string;
  link: string;
  source: string;
  publisher?: string;
  publishedAt: string;
  summary?: string;
  category: 'news' | 'sec-8k';
}

interface NewsPayload {
  ticker: string;
  total: number;
  items: NewsItem[];
  cachedAt: string;
}

interface NewsCompactFeedProps {
  /** Ticker symbol, e.g. "NET" */
  ticker: string;
  /** Max articles to display (default 5) */
  limit?: number;
  /** Callback fired when user clicks "View all news →" */
  onViewAllNews?: () => void;
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
  if (source.startsWith('Google'))
    return 'bg-blue-500/15 text-blue-300 border-blue-500/30';
  return 'bg-slate-700/60 text-slate-300 border-slate-600/50';
}

function shortSource(source: string): string {
  if (source === 'MarketChameleon') return 'MC';
  if (source === 'SEC EDGAR') return 'SEC 8-K';
  if (source.startsWith('Yahoo')) return 'Yahoo';
  if (source.startsWith('Google')) {
    const parts = source.split('·');
    return parts.length > 1 ? parts[1].trim() : 'Google';
  }
  return source.length > 16 ? source.slice(0, 14) + '…' : source;
}

function sentimentDot(source: string, category: string): string {
  if (category === 'sec-8k') return 'bg-purple-400';
  if (source === 'MarketChameleon') return 'bg-emerald-400';
  if (source.startsWith('Yahoo')) return 'bg-cyan-400';
  return 'bg-blue-400';
}

// ─── Article pop-out modal ─────────────────────────────────────────────────────

interface ArticleModalProps {
  item: NewsItem;
  ticker: string;
  onClose: () => void;
}

const ArticleModal: React.FC<ArticleModalProps> = ({ item, ticker, onClose }) => {
  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(6px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Card */}
      <div
        className="relative bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden"
        style={{ maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}
        id={`article-modal-${item.id}`}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 px-5 pt-4 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2 shrink-0">
            <Newspaper className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {ticker} — News Story
            </span>
          </div>
          <button
            onClick={onClose}
            id={`close-article-modal-${item.id}`}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
            title="Close article (Esc)"
            aria-label="Close article"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
          {/* Meta badges */}
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded border ${
                item.category === 'sec-8k'
                  ? 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              {item.category === 'sec-8k' ? '🏛 SEC 8-K' : '📰 news'}
            </span>
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${sourceBadgeClass(item.source)}`}
            >
              {shortSource(item.source)}
            </span>
            {item.publisher && item.publisher !== 'MarketChameleon' && (
              <span className="text-[10px] text-slate-500 font-mono truncate max-w-[200px]">
                via {item.publisher}
              </span>
            )}
            <span className="ml-auto text-[10px] font-mono text-slate-500 shrink-0">
              {item.publishedAt}
            </span>
          </div>

          {/* Headline */}
          <h2 className="text-base font-bold text-white leading-snug">
            {item.title}
          </h2>

          {/* Summary (if available) */}
          {item.summary && (
            <p className="text-sm text-slate-300 leading-relaxed">
              {item.summary}
            </p>
          )}

          {!item.summary && (
            <p className="text-sm text-slate-500 italic leading-relaxed">
              Full article available at source. Click the button below to read the complete story.
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 pb-4 pt-3 border-t border-slate-800 flex items-center justify-between gap-3">
          <span className="text-[11px] text-slate-500 font-mono truncate">
            {item.link.replace(/^https?:\/\//, '').split('?')[0].slice(0, 50)}
          </span>
          <a
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            id={`open-full-article-${item.id}`}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors shrink-0 shadow"
          >
            Read Full Story
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

export const NewsCompactFeed: React.FC<NewsCompactFeedProps> = ({
  ticker,
  limit = 5,
  onViewAllNews,
  className = '',
}) => {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<NewsItem | null>(null);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

  const fetchNews = useCallback(async () => {
    if (!ticker) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/news/${encodeURIComponent(ticker)}`);
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const data: NewsPayload = await res.json();
      // Filter to top non-SEC items first, then append SEC items if needed
      const newsItems = data.items.filter((i) => i.category !== 'sec-8k');
      const secItems = data.items.filter((i) => i.category === 'sec-8k');
      const merged = [...newsItems, ...secItems].slice(0, limit);
      setItems(merged);
      setLastFetched(new Date());
    } catch (err: any) {
      setError(err?.message || 'Failed to load news');
    } finally {
      setLoading(false);
    }
  }, [ticker, limit]);

  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <div
        className={`bg-slate-900/60 rounded-xl border border-slate-800 overflow-hidden ${className}`}
        id={`news-compact-feed-${ticker}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <Newspaper className="w-4 h-4 text-blue-400 shrink-0" />
            <span>Recent News Stories &amp; Volatility Drivers</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-500 border border-slate-700">
              {ticker}
            </span>
          </h3>

          <div className="flex items-center gap-2">
            {lastFetched && (
              <span className="text-[10px] font-mono text-slate-600 hidden sm:block">
                {lastFetched.toLocaleTimeString()}
              </span>
            )}
            <button
              onClick={fetchNews}
              disabled={loading}
              id={`compact-news-refresh-${ticker}`}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-40 cursor-pointer"
              title="Refresh news"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="overflow-y-auto" style={{ maxHeight: '260px' }}>
          {/* Loading skeleton */}
          {loading && (
            <div className="p-3 space-y-2">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="bg-slate-950/60 rounded-lg border border-slate-800 p-3 animate-pulse space-y-1.5"
                >
                  <div className="h-2.5 bg-slate-800 rounded w-3/4" />
                  <div className="h-2 bg-slate-800 rounded w-1/3" />
                </div>
              ))}
            </div>
          )}

          {/* Error state */}
          {!loading && error && (
            <div className="py-5 text-center text-xs text-rose-400">
              <span className="block text-lg mb-1">⚠️</span>
              {error}
              <button
                onClick={fetchNews}
                className="mt-2 block mx-auto text-[11px] text-slate-400 hover:text-white underline cursor-pointer"
              >
                Retry
              </button>
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && items.length === 0 && (
            <div className="py-6 text-center text-slate-500 text-xs">
              <span className="block text-xl mb-1.5">📭</span>
              No recent news for <strong className="text-slate-300">{ticker}</strong>
            </div>
          )}

          {/* News list */}
          {!loading && !error && items.length > 0 && (
            <ul className="divide-y divide-slate-800/60">
              {items.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => setSelectedArticle(item)}
                    id={`compact-news-item-${item.id}`}
                    className="w-full text-left px-4 py-2.5 group hover:bg-slate-800/60 transition-colors cursor-pointer"
                    title={item.title}
                  >
                    <div className="flex items-start gap-2.5">
                      {/* Sentiment dot */}
                      <span
                        className={`w-1.5 h-1.5 rounded-full shrink-0 mt-1.5 ${sentimentDot(item.source, item.category)}`}
                      />

                      <div className="flex-1 min-w-0 space-y-1">
                        {/* Headline */}
                        <p className="text-xs font-semibold text-slate-200 leading-snug line-clamp-2 group-hover:text-white transition-colors">
                          {item.title}
                        </p>

                        {/* Meta row */}
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span
                            className={`text-[9px] font-semibold px-1.5 py-0.5 rounded border ${sourceBadgeClass(item.source)}`}
                          >
                            {shortSource(item.source)}
                          </span>
                          {item.category === 'sec-8k' && (
                            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border bg-purple-500/15 text-purple-300 border-purple-500/30">
                              8-K
                            </span>
                          )}
                          <span className="text-[10px] font-mono text-slate-600">
                            {item.publishedAt}
                          </span>
                          <span className="ml-auto text-[9px] text-slate-600 group-hover:text-slate-400 transition-colors flex items-center gap-0.5">
                            <ExternalLink className="w-2.5 h-2.5 inline" />
                            Read
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer CTA */}
        {!loading && !error && (
          <div className="px-4 py-2.5 border-t border-slate-800/60 bg-slate-950/40 flex items-center justify-between gap-2">
            <span className="text-[10px] font-mono text-slate-600">
              {items.length > 0 ? `Top ${items.length} stories` : 'No stories loaded'}
            </span>
            {onViewAllNews && (
              <button
                onClick={onViewAllNews}
                id={`view-all-news-${ticker}`}
                className="text-[11px] font-semibold text-blue-400 hover:text-blue-300 underline transition-colors cursor-pointer"
              >
                View all news &amp; analyst data →
              </button>
            )}
          </div>
        )}
      </div>

      {/* Article pop-out modal */}
      {selectedArticle && (
        <ArticleModal
          item={selectedArticle}
          ticker={ticker}
          onClose={() => setSelectedArticle(null)}
        />
      )}
    </>
  );
};

export default NewsCompactFeed;
