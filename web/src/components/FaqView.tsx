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
  category: 'GENERAL' | 'STRATEGY' | 'EXECUTION' | 'MARGIN' | 'APIS' | 'TAX' | 'AI';
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
            Your Tradier API Key is kept <strong>strictly private</strong>. In the web interface, the key is masked by default with bullet points and held in browser <code className="text-slate-200">sessionStorage</code> for your active session only, or configured via local server environment variables.
          </p>
          <p>
            It is never committed to source control, never sent to third-party telemetry, and wiped upon session logout.
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
    {
      id: 'faq-8',
      category: 'TAX',
      question: 'What is Section 1256 and how do SPX, NDX, and RUT save taxes vs. ETF options (SPY, QQQ)?',
      answer: (
        <div className="space-y-2 text-slate-300">
          <p>
            Under <strong>IRC §1256</strong>, broad-based cash-settled index options (such as SPX, NDX, RUT, VIX, and XSP) are classified as nonequity options.
          </p>
          <p>
            Every dollar of net gain is automatically taxed as <strong>60% Long-Term Capital Gains</strong> (top 20% federal rate) and <strong>40% Short-Term Capital Gains</strong> (top 37% ordinary rate), regardless of how briefly you held the trade. This produces an effective blended top tax rate of <strong>26.8%</strong> vs. 37% on standard equity options — unlocking up to 10.2% in pure tax alpha.
          </p>
          <p className="text-xs text-amber-300">
            <strong>Important distinction:</strong> ETF options (SPY, QQQ, IWM) hold conflicting IRS and judicial precedent (Rev. Rul. 2026-16). DeltaHarvest strictly defaults ETF options to standard equity option rules (&quot;Needs review&quot;) and never auto-classifies them as 1256.
          </p>
        </div>
      ),
    },
    {
      id: 'faq-9',
      category: 'TAX',
      question: 'Why does DeltaHarvest decompose Rate Effect vs. Timing Effect in Tax Alpha & Backtesting?',
      answer: (
        <div className="space-y-2 text-slate-300">
          <p>
            Section 1256 creates two counteracting economic effects that point in opposite directions:
          </p>
          <ul className="list-disc list-inside space-y-1 text-xs">
            <li><strong>Rate Effect (Tax Savings):</strong> Statutory 60/40 blended tax rate yields lower taxes on realized profits.</li>
            <li><strong>Timing Effect (Cash Acceleration Drag):</strong> Mandatory year-end mark-to-market valuation (IRC §1256(a)(1) &amp; IRS Pub 550 p.57) requires paying taxes on unrealized gains as of December 31 before any cash is received from a position sale.</li>
          </ul>
          <p>
            A truthful institutional model never presents a single &quot;tax alpha&quot; number that hides the cash-flow timing cost. When After-Tax Mode is toggled in the Options Backtester, taxes are debited directly at each December mark to mirror real-world liquidity conditions.
          </p>
        </div>
      ),
    },
    {
      id: 'faq-10',
      category: 'AI',
      question: 'How does the 7-Provider Multi-LLM Failover Chain protect against API rate limits and outages?',
      answer: (
        <div className="space-y-2 text-slate-300">
          <p>
            DeltaHarvest utilizes an institutional multi-tiered failover chain behind <code className="text-emerald-300 font-mono">_llm.js</code>. If primary Google Gemini encounters rate limits (HTTP 429) or upstream server downtime (5xx), requests cascade seamlessly through 7 sequential fallback slots:
          </p>
          <ol className="list-decimal list-inside space-y-0.5 text-xs text-slate-400 font-mono">
            <li>Slot 1: Groq (llama-3.3-70b-versatile)</li>
            <li>Slot 2: Cerebras (llama-3.3-70b)</li>
            <li>Slot 3: OpenRouter (openrouter/free)</li>
            <li>Slot 4: Mistral (mistral-small-latest)</li>
            <li>Slot 5: NVIDIA NIM (meta/llama-3.3-70b-instruct)</li>
            <li>Slot 6: Cloudflare Workers AI (@cf/meta/llama-3.1-8b-instruct)</li>
            <li>Slot 7: Cohere (command-r-plus)</li>
          </ol>
          <p className="text-xs">
            In accordance with Iron Rule #2, client HTTP 400 errors fail closed immediately without failover, preserving system integrity and zero key disclosure.
          </p>
        </div>
      ),
    },
    {
      id: 'faq-11',
      category: 'STRATEGY',
      question: 'What is the 5-Point Options Pre-Flight Underwriting Scorecard?',
      answer: (
        <div className="space-y-2 text-slate-300">
          <p>
            The 5-Point Pre-Flight Scorecard evaluates every options trade candidate across five quantitative dimensions:
          </p>
          <ul className="list-disc list-inside space-y-1 text-xs">
            <li><strong>1. Binary Events:</strong> No earnings or FDA events within 14 days.</li>
            <li><strong>2. Weekly Cadence:</strong> CBOE Friday weekly options availability.</li>
            <li><strong>3. Liquidity Friction:</strong> &gt;1M daily shares and bid/ask spreads &lt;$0.15.</li>
            <li><strong>4. IV Rank:</strong> IVR &gt;25% for CSPs; IVR &lt;60% for Covered Calls.</li>
            <li><strong>5. Technical Cushion:</strong> &gt;5% margin of safety above 20-day / 50-day SMA and RSI &gt;35.</li>
          </ul>
          <p className="text-xs">
            Candidates receive an institutional rating (<strong>PRIME</strong>, <strong>CONDITIONAL</strong>, or <strong>AVOID</strong>) before capital is committed.
          </p>
        </div>
      ),
    },
    {
      id: 'faq-12',
      category: 'EXECUTION',
      question: 'How do Declarative Option Playbooks and the Signal Journal work together?',
      answer: (
        <div className="space-y-2 text-slate-300">
          <p>
            DeltaHarvest provides 5 institutional Strategy Playbooks (Conservative CSP 15Δ, Momentum CC 22Δ, PMCC Compounder, Post-Earnings Crush, and Oversold Bounce).
          </p>
          <p>
            When an actionable setup is surfaced by the Strategy Agent or Ticker Audit, clicking <strong>&quot;Track in Journal&quot;</strong> automatically logs the underlying symbol, strategy, delta, spot price, and thesis into persistent Cloudflare D1 storage (<code className="text-purple-300 font-mono">/api/options/journal</code>), enabling disciplined post-trade analytics.
          </p>
        </div>
      ),
    },
    {
      id: 'faq-13',
      category: 'EXECUTION',
      question: 'How does the New-Upload Weekly Reset and Non-Destructive Archiving work?',
      answer: (
        <div className="space-y-2 text-slate-300">
          <p>
            When uploading a fresh Charles Schwab positions CSV, DeltaHarvest begins a new weekly trading ritual under the <em>Archive, Don&apos;t Annihilate</em> rule:
          </p>
          <ul className="list-disc list-inside space-y-1 text-slate-400">
            <li><strong>Automated Archiving:</strong> Previous screener results (MarketChameleon, Barchart, Gemini AI selections, ThinkorSwim) are safely moved to week-labeled archive storage (<code className="text-teal-300 font-mono">deltaharvest_screen_archive_YYYY-MM-DD_...</code>).</li>
            <li><strong>Clean Workspace:</strong> Active screener tables clear cleanly to prevent stale candidate contamination, while user filter settings (IV rank, volume, price bounds) remain intact.</li>
            <li><strong>Cumulative Data Sacredness:</strong> YTD option premiums written, capital ledger allocations, tax records, and options journal entries are strictly preserved across weeks.</li>
            <li><strong>Non-Destructive Restoration:</strong> Any prior week&apos;s screener datasets can be restored at any time via the <em>&quot;Restore prior week&quot;</em> dropdown in the screener view without losing active work.</li>
          </ul>
        </div>
      ),
    },
    {
      id: 'faq-14',
      category: 'MARGIN',
      question: 'How does Expiry Purge on Import protect live P&L and CSP collateral math?',
      answer: (
        <div className="space-y-2 text-slate-300">
          <p>
            Brokerage export CSVs frequently include option contracts that expired on the preceding Friday close. DeltaHarvest automatically purges these contracts during import:
          </p>
          <ul className="list-disc list-inside space-y-1 text-slate-400">
            <li><strong>Single Clock Cutoff:</strong> All legs are checked against the Single Clock Authority (4:00 PM ET cutoff, adjusting for NYSE holiday closures).</li>
            <li><strong>Quarantined Partition:</strong> Expired legs are routed to a dedicated <code className="text-amber-300 font-mono">deltaharvest_expired_on_import_...</code> bucket labeled <em>&quot;Expired &lt;date&gt; — excluded from live analysis&quot;</em>.</li>
            <li><strong>Zero Math Pollution:</strong> Expired contracts never enter active portfolio positions, live P&amp;L, Greeks, covered call tracking, or cash-secured put collateral liability calculations ($Strike &times; 100).</li>
            <li><strong>Audit Visibility:</strong> Expired legs remain visible in a collapsed drawer in the Upload view for full reconciliation transparency.</li>
          </ul>
        </div>
      ),
    },
    {
      id: 'faq-15',
      category: 'AI',
      question: 'How do I upload and import Gemini AI Final Selections (CSV / Sheet / Excel)?',
      answer: (
        <div className="space-y-2 text-slate-300">
          <p>
            In Workflow Step 5 (Cascading Screener Funnel), Sub-Tab 5 offers a zero-dependency universal import engine:
          </p>
          <ul className="list-disc list-inside space-y-1 text-slate-400">
            <li><strong>Multi-Format Ingestion:</strong> Supports RFC 4180 CSV, TSV, modern Excel (.xlsx), Microsoft XML Spreadsheet 2003 (.xls/.xml), Google Sheets public links, and direct clipboard paste.</li>
            <li><strong>3-Table Segmentation:</strong> Automatically parses rows into Table 1 (Recommended Institutional Trades), Table 2 (Borderline Candidates), and Table 3 (Excluded), extracting strike, delta, expiration, and yield metrics.</li>
            <li><strong>Schwab Staging Link:</strong> Table 1 recommended trades feature 1-click bracket order staging to the Charles Schwab Order Workbench with automated cash collateral validation.</li>
            <li><strong>Template &amp; Export:</strong> Download standardized templates or export your active selections directly from the UI.</li>
          </ul>
        </div>
      ),
    },
    {
      id: 'faq-16',
      category: 'GENERAL',
      question: 'What is the Single Clock Authority and how does it prevent timezone drift?',
      answer: (
        <div className="space-y-2 text-slate-300">
          <p>
            DeltaHarvest centralizes all platform time and date logic in <code className="text-teal-300 font-mono">web/src/utils/appNow.ts</code> and edge <code className="text-teal-300 font-mono">functions/api/_now.js</code>:
          </p>
          <ul className="list-disc list-inside space-y-1 text-slate-400">
            <li><strong>America/New_York (ET) Anchor:</strong> Regardless of user local time or server timezone, the trading day, week boundaries, and market status strictly reference New York exchange time.</li>
            <li><strong>Deterministic 16:00 ET Close:</strong> Option expiration occurs precisely at 4:00 PM ET on Fridays (or Thursdays before Good Friday / market holidays).</li>
            <li><strong>Weekend Indicator Rollover:</strong> Macro calendars and screening weeks advance automatically to the upcoming week upon Friday close.</li>
          </ul>
        </div>
      ),
    },
    {
      id: 'faq-17',
      category: 'GENERAL',
      question: 'How does DeltaHarvest protect Password Reset Inquiries and prevent token exposure?',
      answer: (
        <div className="space-y-2 text-slate-300">
          <p>
            DeltaHarvest adheres to strict institutional zero-exposure credentials architecture:
          </p>
          <ul className="list-disc list-inside space-y-1 text-slate-400">
            <li><strong>Single-Recipient Token Dispatch:</strong> Cryptographically generated single-use reset tokens (30-minute validity) are dispatched exclusively to the registered user&apos;s verified mailbox. They are never sent to administrative channels or notification copies.</li>
            <li><strong>Masked Admin Metadata:</strong> The Admin Console &quot;Access &amp; Reset Inquiries&quot; tab displays only safe metadata (Request ID, Submitter, Request/Expiry Timestamps, Status, and a 6-character non-usable correlation fingerprint). Plaintext reset URLs and tokens are never returned by the API or rendered in the DOM.</li>
            <li><strong>Server-Side Revocation:</strong> Administrators can immediately revoke pending reset requests server-side, which purges the cryptographic token from D1 while preserving the audit trail.</li>
          </ul>
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
              Find detailed explanations regarding statistical strike selection, profit-taking mechanics, defensive rolling protocols, Section 1256 tax alpha, and real-time API integrations.
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
              placeholder="Search FAQ questions (e.g. 1256, 80% rule, Tradier, margin)..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 transition-colors"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              { key: 'ALL', label: 'All Topics' },
              { key: 'STRATEGY', label: 'Strategy Rules' },
              { key: 'TAX', label: 'Section 1256 & Taxes' },
              { key: 'AI', label: 'Strategy Agent & LLMs' },
              { key: 'APIS', label: 'Tradier & Schwab' },
              { key: 'MARGIN', label: 'Margin & Greeks' },
              { key: 'EXECUTION', label: 'Execution & Journal' },
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
