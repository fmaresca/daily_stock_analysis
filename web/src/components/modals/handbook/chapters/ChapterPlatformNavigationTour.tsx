import React from 'react';
import { DirectActionBanner } from './DirectActionBanner';
import { MenuTreeType, EquitiesTabType, OptionsTabType } from '../../../../types/options';
import {
  Compass,
  Zap,
  Search,
  DollarSign,
  TrendingUp,
  ShieldCheck,
  Star,
  Bell,
  FileSpreadsheet,
  HelpCircle,
  Sun,
  Users,
  Briefcase,
  Layers,
  Activity,
  Calendar,
  Flame,
  BrainCircuit,
  BarChart2,
  Lock,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  ArrowRight,
  CheckCircle2,
} from '../../../icons';

export interface ChapterPlatformNavigationTourProps {
  onNavigate?: (tree: MenuTreeType, optionsTab?: OptionsTabType, equitiesTab?: EquitiesTabType) => void;
  onOpenSimulator?: () => void;
  onOpenValuation?: (ticker?: string) => void;
  onOpenTradier?: () => void;
  onOpenSchwab?: () => void;
  onOpenDiagnostics?: () => void;
  onOpenReports?: () => void;
  onOpenWatchlists?: () => void;
  onOpenAlerts?: () => void;
  onOpenCommandPalette?: () => void;
  onOpenEquityAnalysis?: () => void;
}

export const ChapterPlatformNavigationTour: React.FC<ChapterPlatformNavigationTourProps> = ({
  onNavigate,
  onOpenSimulator,
  onOpenValuation,
  onOpenTradier,
  onOpenSchwab,
  onOpenDiagnostics,
  onOpenReports,
  onOpenWatchlists,
  onOpenAlerts,
  onOpenCommandPalette,
  onOpenEquityAnalysis,
}) => {
  return (
    <div className="space-y-8 animate-fade-in text-slate-300">
      {/* Title & Introduction */}
      <div className="border-l-4 border-emerald-400 pl-4 py-1.5 bg-slate-950/40 rounded-r-xl border border-slate-800/80">
        <div className="flex items-center gap-2">
          <Compass className="w-5 h-5 text-emerald-400" />
          <h3 className="text-base font-bold text-white tracking-wide">
            Complete Platform Map &amp; Menu Button Guide
          </h3>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold">
            Interactive User Manual
          </span>
        </div>
        <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
          Welcome to the control center of <strong>DeltaHarvest Institutional</strong>. This comprehensive guide explains
          <strong> every button, menu item, and analytical tool</strong> across the platform so any investor—from a beginner to a seasoned money manager—can effortlessly navigate, understand its computational power, and execute a disciplined weekly cash-generation workflow.
        </p>
      </div>

      {/* Direct Interactive Jump Banner */}
      <DirectActionBanner
        title="Direct Quick-Action Launchers"
        actions={[
          {
            label: 'Workflow Step 1 (Upload Positions)',
            location: 'Workflow > Upload',
            onClick: () => onNavigate?.('WORKFLOW', 'SCHWAB_POSITIONS_UPLOAD'),
          },
          {
            label: 'Workflow Step 5 (Cascading Screener & AI)',
            location: 'Workflow > Screeners',
            onClick: () => onNavigate?.('WORKFLOW', 'CASCADING_SCREENER'),
          },
          {
            label: 'DCF Intrinsic Valuation & DuPont',
            location: 'Valuation Terminal',
            onClick: () => onOpenValuation?.('NVDA'),
          },
          {
            label: '100-Point Trade Quality Simulator',
            location: 'Interactive Modal',
            onClick: onOpenSimulator,
          },
          {
            label: 'Equity Analysis (Ticker Card)',
            location: 'Header / Sidebar',
            onClick: onOpenEquityAnalysis,
          },
          {
            label: 'API Self-Test Diagnostics',
            location: 'Header Button',
            onClick: onOpenDiagnostics,
          },
          {
            label: 'Custom Watchlist Manager (W)',
            location: 'Header Button',
            onClick: onOpenWatchlists,
          },
          {
            label: 'Executive Reports & Export (R)',
            location: 'Header Button',
            onClick: onOpenReports,
          },
        ]}
      />

      {/* Platform Architecture & Layout Diagram */}
      <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-5 space-y-4">
        <h4 className="text-sm font-bold text-white flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          <span>The Three Pillars of the DeltaHarvest Workstation</span>
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-cyan-300">
              <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center text-[11px]">1</span>
              <span>Top Command Header</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Permanent high-visibility bar tracking live market session status (NYSE Open/Closed), instant ticker search (<kbd className="px-1 py-0.5 bg-slate-800 text-[10px] rounded font-mono">Ctrl+K</kbd>), API health tests, quick-launch diagnostic tools, broker connections, and user authorization.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-300">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center text-[11px]">2</span>
              <span>Left Command Sidebar</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              The central navigation spine organizing the <strong>7-Step End-of-Week Workflow Ritual</strong>, user workspace, master portfolio audits, 7 Equities universe, 10 advanced Strategy Labs, order staging, and compliance disclaimers.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-purple-300">
              <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-300 flex items-center justify-center text-[11px]">3</span>
              <span>The Executive Stage</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Zero layout-shift analytical workspace displaying dense quantitative data tables with locked sticky headers, interactive Black-Scholes payoff curves, DuPont ROE decomposition trees, and 1-click AI copy prompts.
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 1: TOP HEADER BUTTONS & TOOLS */}
      <div className="space-y-4">
        <div className="border-b border-slate-800 pb-2">
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              <Compass className="w-4 h-4" />
            </span>
            <span>Section 1: Top Header Bar Tools &amp; Actions (Every Button Decoded)</span>
          </h4>
          <p className="text-xs text-slate-400 mt-1">
            The top header is accessible from every page and gives you instant 1-click access to critical utilities:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 1. API Self-Test */}
          <div className="bg-slate-900/80 p-4 rounded-xl border border-emerald-500/30 space-y-2 hover:border-emerald-500/60 transition-colors">
            <div className="flex items-center justify-between">
              <div className="font-bold text-emerald-300 text-xs flex items-center gap-2">
                <Zap className="w-4 h-4 text-emerald-400" />
                <span>API Self-Test (⚡ Green Pulse)</span>
              </div>
              <button
                onClick={onOpenDiagnostics}
                className="text-[11px] text-emerald-400 hover:text-white px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/40 transition-colors cursor-pointer"
              >
                Launch Now &rarr;
              </button>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              <strong>What it does:</strong> Automated health verification suite that audits all Cloudflare Pages edge functions, Tradier/Schwab market-data proxy latencies, economic calendar APIs, and database response times in real time.
            </p>
            <p className="text-[11px] text-slate-400">
              <em>When to use:</em> If any ticker price appears stale, or before running your weekly screener, click this button to confirm all backend services are healthy and responsive.
            </p>
          </div>

          {/* 2. DCF Valuation */}
          <div className="bg-slate-900/80 p-4 rounded-xl border border-teal-500/30 space-y-2 hover:border-teal-500/60 transition-colors">
            <div className="flex items-center justify-between">
              <div className="font-bold text-teal-300 text-xs flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-teal-400" />
                <span>DCF Valuation ($ Button)</span>
              </div>
              <button
                onClick={() => onOpenValuation?.('NVDA')}
                className="text-[11px] text-teal-400 hover:text-white px-2 py-0.5 rounded bg-teal-950/60 border border-teal-500/40 transition-colors cursor-pointer"
              >
                Launch Now &rarr;
              </button>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              <strong>What it does:</strong> Opens the Institutional Quantitative Valuation &amp; DCF Terminal. Calculates intrinsic fair value using multi-stage Discounted Cash Flow models, DuPont 3-step/5-step ROE decomposition, and ATR-based risk/reward brackets.
            </p>
            <p className="text-[11px] text-slate-400">
              <em>When to use:</em> Before selling puts on any stock, type its symbol here to verify its safety margin, debt solvency, and whether the stock is trading below intrinsic value.
            </p>
          </div>

          {/* 3. Equity Analysis */}
          <div className="bg-slate-900/80 p-4 rounded-xl border border-blue-500/30 space-y-2 hover:border-blue-500/60 transition-colors">
            <div className="flex items-center justify-between">
              <div className="font-bold text-blue-300 text-xs flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-400" />
                <span>Equity Analysis (📈 Ticker Card)</span>
              </div>
              <button
                onClick={onOpenEquityAnalysis}
                className="text-[11px] text-blue-400 hover:text-white px-2 py-0.5 rounded bg-blue-950/60 border border-blue-500/40 transition-colors cursor-pointer"
              >
                Launch Now &rarr;
              </button>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              <strong>What it does:</strong> Brings up the complete 360-degree Ticker Audit Card with 50-day candlestick charts, 20-day SMA, 14-period RSI, 14-period Wilder ATR, Bollinger Band channels, and Wall Street consensus ratings.
            </p>
            <p className="text-[11px] text-slate-400">
              <em>When to use:</em> Whenever you want to visually inspect a single stock&apos;s support and resistance levels before selecting an options strike price.
            </p>
          </div>

          {/* 4. Global Search (Ctrl+K) */}
          <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 space-y-2 hover:border-slate-700 transition-colors">
            <div className="flex items-center justify-between">
              <div className="font-bold text-slate-200 text-xs flex items-center gap-2">
                <Search className="w-4 h-4 text-slate-400" />
                <span>Command Palette &amp; Search (Ctrl+K)</span>
              </div>
              <button
                onClick={onOpenCommandPalette}
                className="text-[11px] text-slate-300 hover:text-white px-2 py-0.5 rounded bg-slate-800 border border-slate-700 transition-colors cursor-pointer"
              >
                Open &rarr;
              </button>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              <strong>What it does:</strong> Interactive global search box and keyboard-navigable spotlight palette. Type any existing database ticker to instantly view it, or enter <strong>any new stock symbol</strong> (e.g. <code>NVDA</code>, <code>PLTR</code>, <code>AMZN</code>) to automatically fetch live quote data, 20-day SMA, 2-SD Bollinger Bands, Wilder RSI-14, HV-30, CBOE weekly options status, and hydrate all database fields directly into the Equity Card.
            </p>
            <p className="text-[11px] text-slate-400">
              <em>When to use:</em> Use the upper right search box or press <kbd className="px-1 py-0.5 bg-slate-800 text-[10px] rounded font-mono">Ctrl+K</kbd> anywhere to find database stocks or analyze any new equity on demand.
            </p>
          </div>

          {/* 5. Health Pulse Badge */}
          <div className="bg-slate-900/80 p-4 rounded-xl border border-emerald-500/30 space-y-2 hover:border-emerald-500/60 transition-colors">
            <div className="flex items-center justify-between">
              <div className="font-bold text-emerald-300 text-xs flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Health Pulse (100/100 • +$X/d Theta)</span>
              </div>
              <button
                onClick={() => onNavigate?.('OPTIONS', 'EXECUTIVE_DIGEST')}
                className="text-[11px] text-emerald-400 hover:text-white px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/40 transition-colors cursor-pointer"
              >
                View Digest &rarr;
              </button>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              <strong>What it does:</strong> Live portfolio health monitor calculating two vital statistics: (1) Portfolio Risk Compliance Score (0–100) reflecting margin safety and position diversification; (2) Daily Theta Cash Flow representing the daily options premium time-decay collected across active contracts.
            </p>
            <p className="text-[11px] text-slate-400">
              <em>When to use:</em> Click this badge at any time to open the full Executive Portfolio Digest breakdown.
            </p>
          </div>

          {/* 6. Tradier & Schwab API Connectors */}
          <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 space-y-2 hover:border-slate-700 transition-colors">
            <div className="flex items-center justify-between">
              <div className="font-bold text-slate-200 text-xs flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                <span>Tradier &amp; Schwab Broker Settings</span>
              </div>
              <div className="flex gap-1.5">
                <button
                  onClick={onOpenTradier}
                  className="text-[10px] text-emerald-400 hover:text-white px-2 py-0.5 rounded bg-slate-800 border border-slate-700 transition-colors cursor-pointer"
                >
                  Tradier
                </button>
                <button
                  onClick={onOpenSchwab}
                  className="text-[10px] text-blue-400 hover:text-white px-2 py-0.5 rounded bg-slate-800 border border-slate-700 transition-colors cursor-pointer"
                >
                  Schwab
                </button>
              </div>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              <strong>What they do:</strong> Connect live quotes and options chains from your brokerage. Tradier provides ultra-fast NBBO streaming and full options strike grids. Schwab provides retail OAuth portfolio synchronization.
            </p>
            <p className="text-[11px] text-slate-400">
              <em>Security Note:</em> Keys are stored in temporary browser session memory (or server-provisioned) and are completely cleared on logout.
            </p>
          </div>

          {/* 7. Watchlists (W) */}
          <div className="bg-slate-900/80 p-4 rounded-xl border border-amber-500/30 space-y-2 hover:border-amber-500/60 transition-colors">
            <div className="flex items-center justify-between">
              <div className="font-bold text-amber-300 text-xs flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-400" />
                <span>Watchlists (W Shortcut)</span>
              </div>
              <button
                onClick={onOpenWatchlists}
                className="text-[11px] text-amber-400 hover:text-white px-2 py-0.5 rounded bg-amber-950/60 border border-amber-500/40 transition-colors cursor-pointer"
              >
                Open (W) &rarr;
              </button>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              <strong>What it does:</strong> Manage multiple customized stock universes. Add tickers individually or upload custom stock lists via CSV (using <code>deltaharvest_watchlist_sample.csv</code>).
            </p>
            <p className="text-[11px] text-slate-400">
              <em>When to use:</em> To curate a personal list of companies you love and want to sell cash-secured puts against.
            </p>
          </div>

          {/* 8. Alerts (🔔) */}
          <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 space-y-2 hover:border-slate-700 transition-colors">
            <div className="flex items-center justify-between">
              <div className="font-bold text-slate-200 text-xs flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-400" />
                <span>Alerts &amp; Webhooks</span>
              </div>
              <button
                onClick={onOpenAlerts}
                className="text-[11px] text-slate-300 hover:text-white px-2 py-0.5 rounded bg-slate-800 border border-slate-700 transition-colors cursor-pointer"
              >
                Configure &rarr;
              </button>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              <strong>What it does:</strong> Configure real-time browser push notifications and outbound Discord / Telegram webhooks for Delta limit breaches, 80% profit triggers, earnings announcements, and economic releases.
            </p>
          </div>

          {/* 9. Reports (R) */}
          <div className="bg-slate-900/80 p-4 rounded-xl border border-indigo-500/30 space-y-2 hover:border-indigo-500/60 transition-colors">
            <div className="flex items-center justify-between">
              <div className="font-bold text-indigo-300 text-xs flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-indigo-400" />
                <span>Executive Reports &amp; Export (R)</span>
              </div>
              <button
                onClick={onOpenReports}
                className="text-[11px] text-indigo-400 hover:text-white px-2 py-0.5 rounded bg-indigo-950/60 border border-indigo-500/40 transition-colors cursor-pointer"
              >
                Open (R) &rarr;
              </button>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              <strong>What it does:</strong> Export complete trading audits, active options contracts, and screener results to CSV, Excel, or formatted PDF for tax and financial record-keeping.
            </p>
          </div>

          {/* 10. Day / Night Mode & Admin Console */}
          <div className="bg-slate-900/80 p-4 rounded-xl border border-purple-500/30 space-y-2 hover:border-purple-500/60 transition-colors">
            <div className="flex items-center justify-between">
              <div className="font-bold text-purple-300 text-xs flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-400" />
                <span>Theme &amp; Admin Console</span>
              </div>
              <button
                onClick={() => onNavigate?.('ADMIN_USERS')}
                className="text-[11px] text-purple-400 hover:text-white px-2 py-0.5 rounded bg-purple-950/60 border border-purple-500/40 transition-colors cursor-pointer"
              >
                Admin &rarr;
              </button>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              <strong>What they do:</strong> Day/Night switch toggles high-contrast daytime reading vs dark room OLED mode. Admin Console allows administrators to provision tenant logins, set notification emails, and audit user sessions.
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 2: LEFT SIDEBAR NAVIGATION TOUR */}
      <div className="space-y-4">
        <div className="border-b border-slate-800 pb-2">
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <Compass className="w-4 h-4" />
            </span>
            <span>Section 2: Left Sidebar Navigation (The Core Platform Spine)</span>
          </h4>
          <p className="text-xs text-slate-400 mt-1">
            The left sidebar is organized into intuitive functional tiers designed to walk you through your investments:
          </p>
        </div>

        {/* Tier A: The 7-Step Workflow Ritual */}
        <div className="bg-slate-950/80 border border-emerald-500/40 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider font-mono">
                ⭐ Core Platform Tier 1: The 7-Step End-of-Week Workflow Ritual
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                7 Steps
              </span>
            </div>
            <button
              onClick={() => onNavigate?.('WORKFLOW', 'SCHWAB_POSITIONS_UPLOAD')}
              className="text-xs text-emerald-400 hover:text-white font-semibold flex items-center gap-1 cursor-pointer"
            >
              <span>Start Ritual</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            This is the heartbeat of DeltaHarvest. Designed for a 15-minute weekend review, following Steps 1 through 7 ensures you never miss a trade or expose yourself to uncontrolled risk:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
            <div
              onClick={() => onNavigate?.('WORKFLOW', 'SCHWAB_POSITIONS_UPLOAD')}
              className="p-3 rounded-lg bg-slate-900 border border-slate-800 hover:border-emerald-500/50 cursor-pointer transition-colors space-y-1"
            >
              <div className="font-bold text-emerald-400 text-xs flex items-center gap-1.5">
                <span>1. Upload Schwab Positions (CSV)</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Drag-and-drop your broker CSV export. Automatically sums liquid Cash &amp; Money Market Funds (MMFs) and subtracts open CSP collateral.
              </p>
            </div>

            <div
              onClick={() => onNavigate?.('WORKFLOW', 'WEEKLY_CASH_LEDGER')}
              className="p-3 rounded-lg bg-slate-900 border border-slate-800 hover:border-emerald-500/50 cursor-pointer transition-colors space-y-1"
            >
              <div className="font-bold text-emerald-400 text-xs flex items-center gap-1.5">
                <span>2. Cash Ledger &amp; Tax Accrual</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Visualizes your 3-tier liquid cash reserves, encumbers weekly living disbursements ($5,000), tracks YTD options premiums, and updates tax carryforwards.
              </p>
            </div>

            <div
              onClick={() => onNavigate?.('WORKFLOW', 'HOLDINGS_COVERED_CALLS')}
              className="p-3 rounded-lg bg-slate-900 border border-slate-800 hover:border-emerald-500/50 cursor-pointer transition-colors space-y-1"
            >
              <div className="font-bold text-emerald-400 text-xs flex items-center gap-1.5">
                <span>3. Holdings &amp; Covered Calls</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Scans your stock holdings for uncovered 100-share blocks, detects &ge;80% profit close/roll opportunities, and stages safe 20Δ weekly Covered Calls.
              </p>
            </div>

            <div
              onClick={() => onNavigate?.('WORKFLOW', 'ECONOMIC_CALENDAR')}
              className="p-3 rounded-lg bg-slate-900 border border-slate-800 hover:border-emerald-500/50 cursor-pointer transition-colors space-y-1"
            >
              <div className="font-bold text-emerald-400 text-xs flex items-center gap-1.5">
                <span>4. Macro Economic Calendar</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Audits upcoming high-impact economic releases (CPI, PPI, FOMC, NFP) and company earnings dates to protect options from surprise volatility gaps.
              </p>
            </div>

            <div
              onClick={() => onNavigate?.('WORKFLOW', 'CASCADING_SCREENER')}
              className="p-3 rounded-lg bg-slate-900 border border-slate-800 hover:border-emerald-500/50 cursor-pointer transition-colors space-y-1"
            >
              <div className="font-bold text-emerald-400 text-xs flex items-center gap-1.5">
                <span>5. Top Opportunities Screener</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Synthesizes top candidates from ThinkorSwim, Barchart, and MarketChameleon. Allocates cash and generates a 1-click prompt for Gemini AI Pro.
              </p>
            </div>

            <div
              onClick={() => onNavigate?.('WORKFLOW', 'WEEKLY_EXECUTIVE_REPORT')}
              className="p-3 rounded-lg bg-slate-900 border border-slate-800 hover:border-emerald-500/50 cursor-pointer transition-colors space-y-1"
            >
              <div className="font-bold text-emerald-400 text-xs flex items-center gap-1.5">
                <span>6. Weekly Executive Report</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Generates a formal executive digest summarizing portfolio yield, capital utilization, theta generation, and active risk metrics.
              </p>
            </div>

            <div
              onClick={() => onNavigate?.('WORKFLOW', 'BROKER_STAGING')}
              className="p-3 rounded-lg bg-slate-900 border border-slate-800 hover:border-emerald-500/50 cursor-pointer transition-colors col-span-full sm:col-span-1 space-y-1"
            >
              <div className="font-bold text-emerald-400 text-xs flex items-center gap-1.5">
                <span>7. Broker Staging &amp; Order Execution</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Review all staged CSPs and CCs, inspect calculated limit prices, and export the queue to your broker for execution on Monday morning.
              </p>
            </div>
          </div>
        </div>

        {/* Tier B: Workspaces & Portfolios */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white text-xs flex items-center gap-1.5">
                <Briefcase className="w-4 h-4 text-cyan-400" />
                <span>My Workspace (Portfolio)</span>
              </span>
              <button
                onClick={() => onNavigate?.('DASHBOARD')}
                className="text-[11px] text-cyan-400 hover:text-white px-2 py-0.5 rounded bg-slate-900 border border-slate-700 transition-colors cursor-pointer"
              >
                Go to Workspace &rarr;
              </button>
            </div>
            <p className="text-xs text-slate-300">
              The primary multi-tenant dashboard. Provides personal net asset summary cards, recent transactions, quick strategy buttons, and zero-leakage tenant isolation.
            </p>
          </div>

          <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white text-xs flex items-center gap-1.5">
                <Briefcase className="w-4 h-4 text-teal-400" />
                <span>Investment Portfolio</span>
              </span>
              <button
                onClick={() => onNavigate?.('OPTIONS', 'EXECUTIVE_DIGEST')}
                className="text-[11px] text-teal-400 hover:text-white px-2 py-0.5 rounded bg-slate-900 border border-slate-700 transition-colors cursor-pointer"
              >
                View Portfolio &rarr;
              </button>
            </div>
            <p className="text-xs text-slate-300">
              Master executive portfolio digest. Breaks down total net liquidation value, 3-tier liquid cash reserves, active covered calls, open cash-secured puts, and collateral margins.
            </p>
          </div>

          <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white text-xs flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-indigo-400" />
                <span>Equities (7 Equities Universe)</span>
              </span>
              <button
                onClick={() => onNavigate?.('EQUITIES', undefined, 'TECHNICAL_SCREENER')}
                className="text-[11px] text-indigo-400 hover:text-white px-2 py-0.5 rounded bg-slate-900 border border-slate-700 transition-colors cursor-pointer"
              >
                Explore Screeners &rarr;
              </button>
            </div>
            <p className="text-xs text-slate-300">
              Technical screeners filtering equities by 20-EMA/50-EMA momentum, RSI oversold/overbought levels, volume trends, and custom CSV screener imports.
            </p>
          </div>

          <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white text-xs flex items-center gap-1.5">
                <BarChart2 className="w-4 h-4 text-purple-400" />
                <span>Strategy Labs (10 Quantitative Labs)</span>
              </span>
              <button
                onClick={() => onNavigate?.('OPTIONS', 'INCOME_SCREENER')}
                className="text-[11px] text-purple-400 hover:text-white px-2 py-0.5 rounded bg-slate-900 border border-slate-700 transition-colors cursor-pointer"
              >
                Open Labs &rarr;
              </button>
            </div>
            <p className="text-xs text-slate-300">
              Ten advanced analytical environments covering: Income Analyzers, Poor Man&apos;s Covered Calls (PMCC), Defensive Roll Assistants, Portfolio Margin Stress Testing, Section 1256 Tax Alpha, and Volatility Skew Radars.
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 3: TACTICAL TOOLS & ADVANCED REFERENCE */}
      <div className="space-y-4">
        <div className="border-b border-slate-800 pb-2">
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/30">
              <Compass className="w-4 h-4" />
            </span>
            <span>Section 3: Tactical Tools &amp; Educational Centers</span>
          </h4>
          <p className="text-xs text-slate-400 mt-1">
            Specialized calculators and educational resources located in the bottom sidebar and throughout the interface:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Trade Simulator */}
          <div className="p-4 rounded-xl bg-slate-900/70 border border-emerald-500/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white text-xs flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-emerald-400" />
                <span>Trade Simulator (100-Point Scoring Engine)</span>
              </span>
              <button
                onClick={onOpenSimulator}
                className="text-[11px] text-emerald-400 hover:text-white px-2 py-0.5 rounded bg-slate-800 border border-slate-700 transition-colors cursor-pointer"
              >
                Launch &rarr;
              </button>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Grade any options trade from 0 to 100 based on Delta (&Delta;), IV Rank, technical support, annualization, and probability of profit (PoP). View interactive expiration payoff graphs and Greek sensitivities.
            </p>
          </div>

          {/* Tax Alpha (1256) */}
          <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white text-xs flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                <span>Tax Alpha Optimizer (IRC Section 1256)</span>
              </span>
              <button
                onClick={() => onNavigate?.('OPTIONS', 'TAX_ALPHA_OPTIMIZER')}
                className="text-[11px] text-slate-300 hover:text-white px-2 py-0.5 rounded bg-slate-800 border border-slate-700 transition-colors cursor-pointer"
              >
                View &rarr;
              </button>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Discover how to harness Section 1256 index options (60% long-term / 40% short-term blended capital gains rates), avoid wash-sale traps, and optimize your after-tax net returns.
            </p>
          </div>

          {/* Defensive Roll Assistant */}
          <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white text-xs flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                <span>Defensive Roll Assistant</span>
              </span>
              <button
                onClick={() => onNavigate?.('OPTIONS', 'DEFENSIVE_ROLL_ASSISTANT')}
                className="text-[11px] text-amber-400 hover:text-white px-2 py-0.5 rounded bg-slate-800 border border-slate-700 transition-colors cursor-pointer"
              >
                View &rarr;
              </button>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              When an option goes against you, the Roll Assistant calculates mathematically optimal roll dates and strike adjustments to extract a net credit, extend trade duration, and prevent assignment.
            </p>
          </div>

          {/* Methodology & FAQ */}
          <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white text-xs flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-cyan-400" />
                <span>Methodology &amp; Investor FAQ</span>
              </span>
              <div className="flex gap-1.5">
                <button
                  onClick={() => onNavigate?.('METHODOLOGY')}
                  className="text-[10px] text-cyan-400 hover:text-white px-2 py-0.5 rounded bg-slate-800 border border-slate-700 transition-colors cursor-pointer"
                >
                  Methodology
                </button>
                <button
                  onClick={() => onNavigate?.('FAQ')}
                  className="text-[10px] text-cyan-400 hover:text-white px-2 py-0.5 rounded bg-slate-800 border border-slate-700 transition-colors cursor-pointer"
                >
                  FAQ
                </button>
              </div>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Review our rigorous academic whitepapers covering Black-Scholes inversion, volatility risk parity, and clear answers to everyday investor questions.
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 4: THE 15-MINUTE WEEKEND HABIT */}
      <div className="bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-950 border border-emerald-500/40 rounded-2xl p-6 space-y-4 shadow-xl">
        <div className="flex items-center gap-2.5">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <h4 className="text-sm font-bold text-white">
            The 15-Minute Weekend Habit for Everyday Investors
          </h4>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          How does a casual user exploit the full power of DeltaHarvest without spending hours looking at charts? Follow this simple 4-step weekend routine:
        </p>

        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 bg-slate-900/80 rounded-xl border border-slate-800">
            <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold font-mono flex items-center justify-center text-xs shrink-0 mt-0.5">
              1
            </span>
            <div>
              <div className="font-bold text-white text-xs">Friday 4:30 PM: Upload Positions (Step 1)</div>
              <p className="text-xs text-slate-400 mt-0.5">
                Export your positions CSV from Charles Schwab, drag-and-drop it into <strong>Step 1</strong>. DeltaHarvest instantly updates your cash balance, calculates net free cash, and audits active contracts.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-slate-900/80 rounded-xl border border-slate-800">
            <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold font-mono flex items-center justify-center text-xs shrink-0 mt-0.5">
              2
            </span>
            <div>
              <div className="font-bold text-white text-xs">Harvest 20Δ Calls on Uncovered Stock (Step 3)</div>
              <p className="text-xs text-slate-400 mt-0.5">
                Head to <strong>Step 3</strong>. If you have 100 shares of any stock without a call, click <strong>&quot;Stage All Safe Weekly Calls&quot;</strong> to collect instant premium with zero earnings conflicts.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-slate-900/80 rounded-xl border border-slate-800">
            <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold font-mono flex items-center justify-center text-xs shrink-0 mt-0.5">
              3
            </span>
            <div>
              <div className="font-bold text-white text-xs">Run Tri-Screen Cascading Screener (Step 5)</div>
              <p className="text-xs text-slate-400 mt-0.5">
                Navigate to <strong>Step 5</strong>. The system filters hundreds of opportunities down to the safest high-yield puts. Click <strong>&quot;1-Click Copy Prompt for Gemini AI Hub&quot;</strong> to have AI review the final candidates.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-slate-900/80 rounded-xl border border-slate-800">
            <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold font-mono flex items-center justify-center text-xs shrink-0 mt-0.5">
              4
            </span>
            <div>
              <div className="font-bold text-white text-xs">Monday Morning: Stage Orders (Step 7)</div>
              <p className="text-xs text-slate-400 mt-0.5">
                Open <strong>Step 7 (Order Staging Workbench)</strong>, verify your calculated limit orders, and enter them with your broker at market open.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
