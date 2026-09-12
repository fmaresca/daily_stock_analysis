import React, { useState } from 'react';
import {
  HelpCircle,
  ShieldCheck,
  TrendingUp,
  Zap,
  Activity,
  Layers,
  DollarSign,
  Lock,
  Search,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Sliders,
  Sparkles,
} from './icons';

interface FaqItem {
  id: string;
  category: 'GENERAL' | 'STRATEGY' | 'EXECUTION' | 'MARGIN' | 'APIS';
  question: string;
  answer: React.ReactNode;
}

interface FaqViewProps {
  onNavigateToScreener?: () => void;
  onNavigateToMethodology?: () => void;
  onOpenTradier?: () => void;
  onOpenSchwab?: () => void;
}

export const FaqView: React.FC<FaqViewProps> = ({
  onNavigateToScreener,
  onNavigateToMethodology,
  onOpenTradier,
  onOpenSchwab,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set(['faq-1', 'faq-2']));

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const faqs: FaqItem[] = [
    {
      id: 'faq-1',
      category: 'GENERAL',
      question: 'What is DeltaHarvest and how does the systematic scanner work?',
      answer: (
        <div className="space-y-2 text-slate-300">
          <p>
            DeltaHarvest is an institutional-grade US equities and options income analysis platform. It continuously scans your equity watchlist (e.g. SPY, QQQ, AAPL, NVDA, TSLA) against real-time market data, technical standard deviation channels, and option Greeks.
          </p>
          <p>
            The engine automatically scores and extracts conservative Cash-Secured Puts (CSPs), Covered Calls (CCs), Poor Man&apos;s Covered Calls (PMCC), and credit spreads meeting rigorous margin-of-safety criteria.
          </p>
        </div>
      ),
    },
    {
      id: 'faq-2',
      category: 'STRATEGY',
      question: 'Why does DeltaHarvest enforce the 80% Max Profit Buy-to-Close rule?',
      answer: (
        <div className="space-y-2 text-slate-300">
          <p>
            When selling options, your upside is strictly capped at 100% of the premium received, while your collateral remains at risk until expiration.
          </p>
          <p>
            Once a position reaches <strong>80% of maximum profit</strong>, you have captured the vast majority of gains while Theta decay slows significantly. Closing the position eliminates tail-risk (gap downs, surprise earnings, macroeconomic shocks) and immediately recycles 100% of your collateral into new higher-yielding setups.
          </p>
        </div>
      ),
    },
    {
      id: 'faq-3',
      category: 'STRATEGY',
      question: 'What is the 0.50 Delta Roll Trigger and how does defensive rolling work?',
      answer: (
        <div className="space-y-2 text-slate-300">
          <p>
            If the underlying stock price declines toward your sold put strike, the option Delta rises toward &minus;0.50 (indicating the contract is now At-The-Money with a 50% probability of expiring in the money).
          </p>
          <p>
            DeltaHarvest triggers a <strong>Defensive Roll</strong> alert: buy to close the current contract and sell a further-dated contract (out 7 to 30 days) at the same or lower strike for a <strong>net credit</strong>. Rolling for a credit reduces your effective cost basis and grants additional time for the underlying stock to recover.
          </p>
        </div>
      ),
    },
    {
      id: 'faq-4',
      category: 'APIS',
      question: 'How do Tradier API (Primary) and Charles Schwab (Fallback) work together?',
      answer: (
        <div className="space-y-2 text-slate-300">
          <p>
            <strong>Tradier API (Primary)</strong> provides zero-latency client-side streaming for real-time NBBO equity quotes and institutional options chains. Because Tradier natively supports CORS (<code className="text-emerald-300 bg-emerald-950/60 px-1 py-0.5 rounded">Access-Control-Allow-Origin: *</code>), requests stream directly from your browser without intermediate proxy delays.
          </p>
          <p>
            <strong>Charles Schwab Retail Trader API (Fallback)</strong> acts as the secondary institutional provider. If Tradier is unconfigured or rate-limited, DeltaHarvest automatically routes requests to Schwab or cached CBOE static directory snapshots seamlessly.
          </p>
        </div>
      ),
    },
    {
      id: 'faq-5',
      category: 'APIS',
      question: 'How is my Tradier API Key kept private and secure?',
      answer: (
        <div className="space-y-2 text-slate-300">
          <p>
            Your Tradier API Key is kept <strong>strictly private</strong>. In the web interface, the key is masked by default with bullet points and stored exclusively in your local browser&apos;s encrypted <code className="text-slate-200">localStorage</code> or local gitignored <code className="text-slate-200">.env</code>.
          </p>
          <p>
            It is never committed to GitHub, never sent to third-party telemetry, and never exposed in public Cloudflare Pages bundles.
          </p>
        </div>
      ),
    },
    {
      id: 'faq-6',
      category: 'MARGIN',
      question: 'What is the difference between Reg-T Margin and Portfolio Margin in the simulator?',
      answer: (
        <div className="space-y-2 text-slate-300">
          <p>
            Under <strong>Regulation T (Reg-T)</strong>, broker margin requirements are static (typically 20% of underlying value minus OTM amount, or 100% cash-secured for cash accounts).
          </p>
          <p>
            Under <strong>Portfolio Margin (TIMS model)</strong>, margin requirements are dynamically calculated based on comprehensive risk arrays and scenario stress tests (&plusmn;8% to &plusmn;15% shocks). This significantly lowers Buying Power Reduction (BPR) on hedged options positions, allowing conservative multi-leg strategies to operate with superior capital efficiency.
          </p>
        </div>
      ),
    },
    {
      id: 'faq-7',
      category: 'EXECUTION',
      question: 'How does the 1-Click Broker Staging Workbench help with order execution?',
      answer: (
        <div className="space-y-2 text-slate-300">
          <p>
            When you select an opportunity in the screener or covered call matrix, clicking <strong>Stage Order</strong> opens the Broker Staging Workbench.
          </p>
          <p>
            The workbench automatically formats the exact order payload (quantity, limit price at the NBBO midpoint, profit-taking bracket at 80%, stop-loss / defensive trigger at 0.50 Delta) compatible with Thinkorswim, Charles Schwab, Interactive Brokers, and Tradier.
          </p>
        </div>
      ),
    },
  ];

  const filteredFaqs = faqs.filter((item) => {
    const matchesCategory = activeCategory === 'ALL' || item.category === activeCategory;
    const matchesSearch =
      !searchQuery ||
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (typeof item.answer === 'string' && item.answer.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-8 animate-fadeIn max-w-7xl mx-auto px-2 sm:px-4 py-4">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-950 to-teal-950/40 p-6 sm:p-8 border border-teal-500/30 shadow-2xl">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-teal-950/80 border border-teal-500/40 text-teal-300 text-xs font-semibold tracking-wide">
              <HelpCircle className="w-3.5 h-3.5 text-teal-400" />
              <span>Investor Knowledge Base &amp; Frequently Asked Questions</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white">
              DeltaHarvest Operational FAQ
            </h1>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              Find detailed explanations regarding statistical strike selection, profit-taking mechanics, defensive rolling protocols, and real-time API integrations.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {onNavigateToMethodology && (
              <button
                onClick={onNavigateToMethodology}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-teal-600/30 transition-all cursor-pointer"
              >
                <span>Quantitative Methodology</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
            {onNavigateToScreener && (
              <button
                onClick={onNavigateToScreener}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs sm:text-sm border border-slate-700 transition-all cursor-pointer"
              >
                <span>Live Screener</span>
                <Activity className="w-4 h-4 text-emerald-400" />
              </button>
            )}
          </div>
        </div>

        {/* Search & Category Filter */}
        <div className="mt-8 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search FAQ questions (e.g. 80% rule, Tradier, margin)..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 transition-colors"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              { key: 'ALL', label: 'All Topics' },
              { key: 'STRATEGY', label: 'Strategy Rules' },
              { key: 'APIS', label: 'Tradier & Schwab' },
              { key: 'MARGIN', label: 'Margin & Greeks' },
              { key: 'EXECUTION', label: 'Execution' },
            ].map((cat) => (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeCategory === cat.key
                    ? 'bg-teal-600 text-white shadow-md shadow-teal-600/30'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Accordion List */}
      <div className="space-y-3">
        {filteredFaqs.length === 0 ? (
          <div className="text-center py-12 bg-slate-900/40 rounded-2xl border border-slate-800 p-6 space-y-2">
            <HelpCircle className="w-8 h-8 text-slate-500 mx-auto" />
            <div className="text-sm font-bold text-white">No matching FAQ entries found</div>
            <p className="text-xs text-slate-400">Try adjusting your search query or category filter.</p>
          </div>
        ) : (
          filteredFaqs.map((faq) => {
            const isExpanded = expandedIds.has(faq.id);
            return (
              <div
                key={faq.id}
                className="bg-slate-900/70 border border-slate-800 rounded-xl overflow-hidden transition-colors hover:border-slate-700"
              >
                <button
                  onClick={() => toggleExpand(faq.id)}
                  className="w-full text-left p-4 sm:p-5 flex items-center justify-between gap-4 cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 text-teal-300 border border-slate-800">
                      {faq.category}
                    </span>
                    <span className="text-sm sm:text-base font-bold text-white">{faq.question}</span>
                  </div>
                  <div className="text-slate-400">
                    {isExpanded ? <ChevronUp className="w-5 h-5 text-teal-400" /> : <ChevronDown className="w-5 h-5" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-4 sm:px-5 pb-5 pt-1 text-xs sm:text-sm border-t border-slate-800/60 leading-relaxed animate-fadeIn">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Direct Configuration Callout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
        <div className="bg-slate-950 p-5 rounded-xl border border-emerald-500/30 flex items-center justify-between">
          <div>
            <div className="text-xs font-mono text-emerald-400 font-semibold">API FEED STATUS</div>
            <div className="text-sm font-bold text-white mt-1">Tradier Real-Time API (Primary)</div>
            <div className="text-xs text-slate-400 mt-0.5">Direct client-side quotes &amp; options chains</div>
          </div>
          {onOpenTradier && (
            <button
              onClick={onOpenTradier}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
            >
              Configure
            </button>
          )}
        </div>

        <div className="bg-slate-950 p-5 rounded-xl border border-cyan-500/30 flex items-center justify-between">
          <div>
            <div className="text-xs font-mono text-cyan-400 font-semibold">FALLBACK FEED STATUS</div>
            <div className="text-sm font-bold text-white mt-1">Charles Schwab API (Fallback)</div>
            <div className="text-xs text-slate-400 mt-0.5">OAuth 2.0 institutional backup quotes</div>
          </div>
          {onOpenSchwab && (
            <button
              onClick={onOpenSchwab}
              className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
            >
              Configure
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
