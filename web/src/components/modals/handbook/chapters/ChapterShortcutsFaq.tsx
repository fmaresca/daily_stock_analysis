import React from 'react';
import { DirectActionBanner } from './DirectActionBanner';
import { MenuTreeType, EquitiesTabType, OptionsTabType } from '../../../../types/options';

export interface ChapterShortcutsFaqProps {
  onNavigate?: (tree: MenuTreeType, optionsTab?: OptionsTabType, equitiesTab?: EquitiesTabType) => void;
  onOpenCommandPalette?: () => void;
  onOpenWatchlists?: () => void;
  onOpenReports?: () => void;
  onOpenSimulator?: () => void;
  onOpenEquityAnalysis?: () => void;
}

export const ChapterShortcutsFaq: React.FC<ChapterShortcutsFaqProps> = ({
  onNavigate,
  onOpenCommandPalette,
  onOpenWatchlists,
  onOpenReports,
  onOpenSimulator,
  onOpenEquityAnalysis,
}) => {
  return (
    <div className="space-y-6">
      <div className="border-l-2 border-purple-500 pl-4 py-1">
        <h3 className="text-base font-bold text-white">Global Shortcuts &amp; Frequently Asked Questions</h3>
        <p className="text-slate-400 mt-1">
          Speed up your workflow using built-in keyboard hotkeys.
        </p>
      </div>

      <DirectActionBanner
        title="Shortcuts &amp; System Features Direct Access"
        actions={[
          {
            label: 'Command Palette (Ctrl+K)',
            location: 'Modal: Command Palette',
            onClick: onOpenCommandPalette,
          },
          {
            label: 'Equity Analysis (Ticker Audit)',
            location: 'Header & Sidebar: Equity Analysis',
            onClick: onOpenEquityAnalysis,
          },
          {
            label: 'Trade Quality Simulator',
            location: 'Interactive Modal: 4-Tab Engine',
            onClick: onOpenSimulator,
          },
          {
            label: 'Tax Alpha Optimizer (1256)',
            location: 'Options > Tax Alpha Optimizer',
            onClick: () => onNavigate?.('OPTIONS', 'TAX_ALPHA_OPTIMIZER'),
          },
          {
            label: 'Defensive Roll Assistant',
            location: 'Options > Defensive Roll Assistant',
            onClick: () => onNavigate?.('OPTIONS', 'DEFENSIVE_ROLL_ASSISTANT'),
          },
          {
            label: 'Portfolio Margin Simulator',
            location: 'Options > Portfolio Margin Sim',
            onClick: () => onNavigate?.('OPTIONS', 'PORTFOLIO_MARGIN_SIM'),
          },
          {
            label: 'Frequently Asked Questions (FAQ)',
            location: 'Tree: FAQ',
            onClick: () => onNavigate?.('FAQ'),
          },
          {
            label: 'Custom Watchlist Manager (W)',
            location: 'Modal: Watchlists',
            onClick: onOpenWatchlists,
          },
          {
            label: 'Executive Reports Query (R)',
            location: 'Modal: Reports',
            onClick: onOpenReports,
          },
          {
            label: 'Regulatory Disclaimers',
            location: 'Tree: Disclaimer',
            onClick: () => onNavigate?.('DISCLAIMER'),
          },
        ]}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-300">Open Command Palette &amp; Search</span>
          <kbd className="px-2 py-1 bg-slate-800 rounded font-mono text-xs text-emerald-400 border border-slate-700">
            Ctrl + K
          </kbd>
        </div>

        <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-300">Open Strategy Handbook</span>
          <kbd className="px-2 py-1 bg-slate-800 rounded font-mono text-xs text-cyan-400 border border-slate-700">
            ?
          </kbd>
        </div>

        <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-300">Open Watchlist Manager</span>
          <kbd className="px-2 py-1 bg-slate-800 rounded font-mono text-xs text-amber-400 border border-slate-700">
            W
          </kbd>
        </div>

        <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-300">Open Report Queries &amp; Export</span>
          <kbd className="px-2 py-1 bg-slate-800 rounded font-mono text-xs text-indigo-400 border border-slate-700">
            R
          </kbd>
        </div>
      </div>

      <div className="space-y-3 pt-2">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Frequently Asked Questions
        </h4>
        <div className="bg-slate-950/60 p-3 rounded-xl border border-emerald-500/40 space-y-1">
          <div className="text-xs font-bold text-emerald-300">Where can I find a complete breakdown of every menu button and tool on the platform?</div>
          <p className="text-xs text-slate-300">
            Open the <strong>Strategy Handbook (?)</strong> and select <strong>🧭 Platform Map &amp; Menu Tour (Tab 2)</strong>! It decodes every single button in the top header (API Self-Test, DCF Valuation, Equity Analysis, Watchlists, Alerts, Reports, Day/Night Mode, Admin Console) and every tier of the left sidebar (Workflow Ritual Steps 1–7, My Workspace, Investment Portfolio, 7 Equities Universe, 10 Strategy Labs, Tactical Tools).
          </p>
        </div>

        <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-1">
          <div className="text-xs font-bold text-white">What is the difference between &quot;My Workspace&quot; and &quot;Investment Portfolio&quot; in the sidebar?</div>
          <p className="text-xs text-slate-400">
            <strong>My Workspace</strong> is your individualized tenant workstation containing personal quick-action launchers, strategy shortcuts, and recent transactions. <strong>Investment Portfolio</strong> (formerly Trust Portfolio) is the institutional master digest that visualizes your full capital waterfall, Net Liquidation Value, 3-tier liquid cash reserves, active Covered Calls, and open CSP collateral liabilities.
          </p>
        </div>

        <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-1">
          <div className="text-xs font-bold text-white">How does the 1-Click Prompt with Gemini AI in Step 5 work?</div>
          <p className="text-xs text-slate-400">
            In <strong>Step 5 (Tri-Screen Cascading Screener)</strong>, DeltaHarvest aggregates hundreds of opportunities from ThinkorSwim, Barchart, and MarketChameleon into a synthesized candidate pool with Black-Scholes Delta (&Delta;), IV Rank, and strike prices. Clicking <strong>&quot;1-Click Copy Prompt for Gemini AI Hub&quot;</strong> copies an institutional quantitative prompt to your clipboard. Paste it into Gemini AI Pro to receive 3 clean tables: Top 5 Recommended Trades, Borderline Setups, and Excluded Stocks with full qualitative reasoning.
          </p>
        </div>

        <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-1">
          <div className="text-xs font-bold text-white">How does the Koyfin / TradingView Institutional Terminal Architecture work?</div>
          <p className="text-xs text-slate-400">
            The platform is engineered as a high-density institutional workstation: (1) <strong>Top Macro Bar</strong> features real-time macro tape tracking SPY, QQQ, DIA, IWM, and VIX with dynamic percentage change badges, live NYSE trading status (OPEN/CLOSED), and data sync clocks; (2) <strong>Collapsible Left Command Rail</strong> provides quick access to Signals Matrix, Watchlists, Options Income Scanner, Archive &amp; Backtests, and Settings &amp; API Keys; (3) <strong>Executive Decision Matrix</strong> utilizes a <code>table-fixed</code> zero-shift layout with 10 explicit dimensions including options setups (CSP / CC annualized yield) and monospace tabular numbers; (4) <strong>550px Slide-Over Ticker Inspector</strong> provides deep dive with 50-day TradingView candlestick charts, Entry/Target/Stop horizontal overlays, structured Bull/Bear/Catalyst thesis, and actionable options bracket protocols.
          </p>
        </div>

        <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-1">
          <div className="text-xs font-bold text-white">How does Automated Watchlist Hydration &amp; Screener Quality Control work?</div>
          <p className="text-xs text-slate-400">
            Immediately upon adding any symbol (e.g. <code>EOSE</code>) to a watchlist, DeltaHarvest automatically triggers a background hydration pipeline: (1) Fetches real-time price, volume, and percentage change via the quote API; (2) Retrieves 50-day daily OHLCV history; (3) Dynamically derives 20 EMA, 50 EMA, 14-period RSI, and 14-period ATR; (4) Enforces a strict <strong>Quality Control Gate</strong> in the Decision Matrix screener displaying a live &quot;Fetching...&quot; indicator until confirmed data is ready, completely eliminating placeholder default prices ($100.00) or missing technicals.
          </p>
        </div>

        <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-1">
          <div className="text-xs font-bold text-white">How do I get real market prices &amp; options for new tickers (e.g. CLM, CRF)?</div>
          <p className="text-xs text-slate-400">
            When you add new symbols in the Watchlist Manager (<code>W</code>), click the <strong>⚡ Fetch Real Market Data &amp; Options</strong> button in the modal footer or hit <strong>⚡ Live Fetch</strong> in the top header. The backend Python calculation engine will compute live spot prices, 20 SMA, 2-SD Bollinger Bands, 14d RSI, 30d Historical Volatility, and full options chains on demand.
          </p>
        </div>

        <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-1">
          <div className="text-xs font-bold text-white">What is the difference between &quot;Sync&quot; and &quot;⚡ Live Fetch&quot;?</div>
          <p className="text-xs text-slate-400">
            <strong>Sync</strong> reloads the latest pre-compiled snapshot dataset rapidly from cache/disk. <strong>⚡ Live Fetch</strong> triggers real-time calculation across market data APIs (Yahoo Finance / Schwab / Tradier) to refresh Greeks, IV ranks, and pricing for all active tickers.
          </p>
        </div>

        <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-1">
          <div className="text-xs font-bold text-white">How often is the default data refreshed?</div>
          <p className="text-xs text-slate-400">
            The automated GitHub Actions workflow runs daily at 4:30 PM Eastern Time (Monday through Friday) immediately after market close, analyzing updated end-of-day prices, IV ranks, and fresh weekly options chains.
          </p>
        </div>

        <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-1">
          <div className="text-xs font-bold text-white">What is the Equity Analysis (Ticker Audit) Modal and how do I inspect a symbol?</div>
          <p className="text-xs text-slate-400">
            Clicking the <strong>Equity Analysis</strong> button in the top header or left sidebar, or clicking on any ticker in the Primary Screener, Fundamental Health, or Command Palette (<code>Ctrl+K</code>) opens the 5-Part Institutional Audit Modal. It features an interactive TradingView candlestick chart with Bollinger Bands and strike overlays, 20 SMA &amp; RSI indicators, institutional 13F float breakdown, SEC EDGAR links, Wall Street price targets, prediction markets odds, social sentiment velocity, and real-time news aggregation.
          </p>
        </div>

        <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-1">
          <div className="text-xs font-bold text-white">Can I import my own custom tickers?</div>
          <p className="text-xs text-slate-400">
            Yes! Click &quot;Watchlists&quot; or press <code>W</code> to add single tickers or paste a bulk list. You can also upload a CSV or Excel file containing your custom symbols.
          </p>
        </div>

        <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-1">
          <div className="text-xs font-bold text-white">How is the &quot;Equities Tracked&quot; count in the header calculated?</div>
          <p className="text-xs text-slate-400">
            The top header badge dynamically displays the exact number of equities in your options-writing portfolio, plus any equities in Watchlists separately created. All symbols are dynamic: as you import broker positions, execute stock transactions, or add/remove tickers across custom watchlists, the tracked equities count dynamically updates in real time.
          </p>
        </div>

        <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-1">
          <div className="text-xs font-bold text-white">How do Named Watchlists work (Create, Rename, Delete)?</div>
          <p className="text-xs text-slate-400">
            You can create multiple custom-named watchlists by opening the Watchlist Manager (<code>W</code>) and clicking <strong>+ New List</strong>. To rename any watchlist (including your primary default <strong>Institutional Equities</strong>), click the <strong>Rename</strong> button next to the active list name, type the new name, and hit Save. To delete an unwanted watchlist, click <strong>Delete Watchlist</strong> and confirm the prompt (you must maintain at least one watchlist). You can also quickly switch between active watchlists using the dropdown selector in the screener Filter Bar.
          </p>
        </div>

        <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-1">
          <div className="text-xs font-bold text-white">How does 1-Click Broker Order Execution &amp; Simulation Mode work?</div>
          <p className="text-xs text-slate-400">
            When staging a Cash-Secured Put or defined-risk spread, DeltaHarvest automatically constructs validated broker payloads for Charles Schwab, Interactive Brokers (IBKR), and Thinkorswim with mandatory 80% profit-taking limits and 0.50 Delta roll alerts. In the staging modal, toggle <strong>Simulation / Dry-Run</strong> to test order margin and bracket validation safely, or toggle <strong>Enable Live Orders</strong> to transmit directly to the Charles Schwab Retail Trader API or IBKR Client Portal Gateway. All previewed and executed orders are logged in the <strong>Execution History</strong> tab with CSV export.
          </p>
        </div>

        <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-1">
          <div className="text-xs font-bold text-white">How do Watchlist Server Sync and Real-Time Alerts work?</div>
          <p className="text-xs text-slate-400">
            Click <strong>☁️ Sync to Server</strong> in the Watchlist Manager to persist your customized universe to the backend server across sessions, or export/import JSON backups. Open <strong>Alerts</strong> in the header to activate native OS browser notifications or configure Discord/Telegram webhooks that trigger when watchlist tickers hit oversold RSI-14 (&lt; 35), touch Lower Bollinger Band support, or spike in IV Rank (&ge; 45%).
          </p>
        </div>

        <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-1">
          <div className="text-xs font-bold text-white">How do the Interactive Option Chain Matrix &amp; Volatility Smile work?</div>
          <p className="text-xs text-slate-400">
            Navigate to <strong>Option Chain &amp; IV Smile</strong> in the Options menu to view a strike-by-strike straddle ladder pairing Calls (left) and Puts (right) with real-time Greeks (Delta, Gamma, Theta, Vega), Volume, and Open Interest for any expiration date. The interactive Volatility Smile chart plots Implied Volatility across strikes to reveal call/put skew and mispriced volatility smirks. Click any contract to stage an order directly.
          </p>
        </div>

        <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-1">
          <div className="text-xs font-bold text-white">What is a Poor Man’s Covered Call (PMCC) &amp; Portfolio Margin Stress Simulator?</div>
          <p className="text-xs text-slate-400">
            A <strong>Poor Man’s Covered Call</strong> replaces costly 100-share stock purchases with deep In-The-Money LEAPS ($0.80+\Delta$) and sells 30–45 DTE short calls ($0.25\Delta$), cutting capital outlay by 60%–75% while maintaining zero extrinsic assignment risk. The <strong>Portfolio Margin &amp; Stress Simulator</strong> lets you enter your active derivatives book and model multi-factor market shocks (Price &plusmn; 20%, Volatility spikes up to +100%, Time decay), comparing standard Reg-T margin against risk-based Portfolio Margin (TIMS) to quantify liberated purchasing power.
          </p>
        </div>

        <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-1">
          <div className="text-xs font-bold text-white">How does the AI Multi-Agent Trade Structurer &amp; SEC 10-K Auditor work?</div>
          <p className="text-xs text-slate-400">
            The <strong>AI Multi-Agent Trade Structurer</strong> deploys a council of three specialized agents: (1) The <em>Quant Specialist</em> audits Delta bounds (0.15–0.20Δ), IV Rank, expected price moves, and statistical probability of profit; (2) The <em>Fundamental &amp; SEC Auditor</em> examines corporate debt maturity, interest coverage, and SEC EDGAR 10-K/10-Q disclosures to ensure solvency; (3) The <em>Senior Trade Structurer</em> integrates these insights to formulate precise limit prices, capital allocation limits (max 4.5%–5%), mandatory 80% profit targets, and 0.50 Delta stop triggers, with 1-click order staging.
          </p>
        </div>

        <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-1">
          <div className="text-xs font-bold text-white">What is the 0.50 Delta Defensive Roll Rule and how does the Repair Engine work?</div>
          <p className="text-xs text-slate-400">
            When short options face adverse price moves, DeltaHarvest enforces the <strong>0.50 Delta Rule</strong>: never permit an option to reach assignment without testing a defensive adjustment. The <strong>Defensive Rolling &amp; Repair Engine</strong> evaluates four institutional repair tactics: (1) <em>Roll Out &amp; Down</em> (extending expiration 21–28 days while dropping strike $5.00 for a net credit); (2) <em>Roll Flat</em> (extending time at the same strike to harvest maximum extrinsic value); (3) <em>Inverted Wing Defense</em> (selling an opposing credit spread to reduce maximum drawdown); and (4) <em>1:2 Ratio Stock Repair</em> (recovering underwater stock at zero net capital cost). The assistant is directly wired to your live portfolio ledger in real-time, strictly evaluating your actual open holdings and suppressing generic mock presets whenever live positions exist.
          </p>
        </div>

        <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-1">
          <div className="text-xs font-bold text-white">How do Section 1256 Index Contracts and the Wash-Sale Shield optimize taxes?</div>
          <p className="text-xs text-slate-400">
            Under <strong>IRS Section 1256</strong>, all trading profits in broad index options (SPX, XSP, NDX, RUT) enjoy statutory 60/40 tax treatment: 60% is taxed at the lower long-term capital gains rate (20%) and 40% at short-term rates, generating an effective blended tax rate of ~26.8% vs. 37% for standard equity options. In addition, Section 1256 contracts settle in cash and are exempt from the 30-day wash-sale rule. The <strong>Wash-Sale Shield</strong> identifies underwater equity positions and suggests non-substantially identical replacement proxies (e.g. SPY &rarr; XSP) to bank immediate tax deductions while keeping continuous market exposure. The Tax Alpha Optimizer also synchronizes directly with your verified 2026 Calendar YTD Premiums baseline ($603,305.40), featuring a 1-click &quot;Sync YTD&quot; action to model realistic annual Form 6781 tax alpha.
          </p>
        </div>

        <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-1">
          <div className="text-xs font-bold text-white">What is the Executive Portfolio Health Digest &amp; Continuous Guardian?</div>
          <p className="text-xs text-slate-400">
            The <strong>Executive Portfolio Health Digest</strong> aggregates total Net Liquidity, Daily Theta Cashflow run-rate, SPY Beta Delta exposure, and Portfolio Margin (TIMS) capital savings into a unified C-suite dashboard with one-click <strong>Download Markdown</strong> and <strong>Print Executive PDF</strong> capabilities. The PDF engine supports a dedicated <strong>Text Form / No Backgrounds</strong> mode with light formatting, stripping all dark backgrounds and box graphics for clean financial printing or filing. Its <strong>100-Point Compliance Health Score</strong> is calculated dynamically from live holdings: starting at 100, it deducts 10 pts per threatened position (|&Delta;| &ge; 0.40), 15–25 pts if free cash buffer falls below 10% or 5%, 10 pts per single-equity CSP exposure exceeding $200,000, and 5 pts per unrolled covered call that has captured &ge; 80% profit. In the background, the <strong>Continuous Risk Sweeper</strong> autonomously audits active positions against the 80% profit-taking threshold and 0.50 Delta defense trigger, issuing instant alerts to protect capital.
          </p>
        </div>

        <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-1">
          <div className="text-xs font-bold text-white">How does the Closed-Loop Trade Lifecycle &amp; Top Header Risk Pulse work?</div>
          <p className="text-xs text-slate-400">
            DeltaHarvest links order execution, portfolio margin stress-testing, and defensive repair into a unified closed loop: (1) When an order is previewed or executed in the <em>Broker Workbench</em>, it automatically logs into your active <em>Portfolio Ledger</em>; (2) The <em>Defensive Rolling Engine</em> dynamically loads your active ledger positions so you can test and stage repair tactics on real holdings; (3) The <em>Option Chain Matrix</em> models true CBOE calendar Friday cycles (weekly, monthly 3rd Friday, and annual LEAPS); (4) The persistent <em>Top Header Risk Pulse</em> dynamically calculates and displays real-time portfolio compliance health and net daily theta run-rate (e.g. <code>{'{score}'}/100 Health • +${'{theta}'}/d</code>) synchronized live with your active portfolio positions and stress test engine via global storage events, with global hotkeys (<code>?</code> for Handbook, <code>Alt+S</code> for Staging, <code>Alt+E</code> for Executive Digest).
          </p>
        </div>

        <div className="bg-slate-950/60 p-3 rounded-xl border border-blue-500/30 space-y-1">
          <div className="text-xs font-bold text-white flex items-center gap-1.5">
            <span className="text-blue-400">🔍</span>
            <span>How does the Equity Analysis Card work, and how do I search symbols and calculate option strikes?</span>
          </div>
          <p className="text-xs text-slate-400">
            Click <strong>Equity Analysis</strong> in the top header or institutional sidebar to launch the comprehensive Equity Analysis Card:
          </p>
          <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside mt-1">
            <li><strong>Dynamic Symbol Search:</strong> Type any US equity or ETF ticker symbol (e.g. <code>NVDA</code>, <code>TSLA</code>, <code>AAPL</code>, <code>AMD</code>, <code>SPY</code>) into the top search bar or click any quick-select chip.</li>
            <li><strong>Immediate Market Quote Hydration:</strong> Clicking <em>Fetch Price</em> instantly retrieves real-time pricing via edge proxies and financial feeds, updating Wilder 14-day RSI, 20-day SMA, 2-SD Bollinger Bands, 30-day Historical Volatility (HV30), Implied Volatility (IV), and synthetic Cash-Secured Put and Covered Call option setups across all 4 card tabs.</li>
            <li><strong>Direct Simulator Strike Calculator:</strong> Click the <strong>⚡ Trade Simulator</strong> or <strong>Calculate Strikes</strong> button in the card header or options tab to open the <em>Trade Quality Simulator</em> preloaded with that exact stock ticker, where you can model custom Delta bounds (0.10–0.40), expiration cycles, and simulated P&amp;L payout curves for both puts and calls.</li>
          </ul>
        </div>

        <div className="bg-slate-950/60 p-3 rounded-xl border border-emerald-500/30 space-y-1">
          <div className="text-xs font-bold text-white flex items-center gap-1.5">
            <span className="text-emerald-400">💵</span>
            <span>How does Calendar YTD Premiums Tracking work ($603,305.40 Baseline &amp; Pre-Logging Verification)?</span>
          </div>
          <p className="text-xs text-slate-400">
            Calendar YTD Premiums Tracking records cumulative gross and net option cashflow generated across the tax year. For 2026, the verified institutional baseline is established at <strong>$603,305.40</strong>. The platform features two direct verification points:
          </p>
          <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside mt-1">
            <li><strong>Step 2 Panel A (Weekly Cash Ledger):</strong> Displays the cumulative Calendar YTD total with a dedicated <em>Edit Starting Baseline</em> modal and quick-fill chips to adjust or correct historical premiums at any time.</li>
            <li><strong>Pre-Logging Verification Modal:</strong> When you click <em>Log Current Week Premium</em>, the modal prominently displays and allows editing the starting YTD balance ($603,305.40) directly at the top. This allows you to verify and calibrate the baseline before logging your current week&apos;s realized option income, with a live calculation of the resulting cumulative YTD total.</li>
          </ul>
        </div>

        <div className="bg-slate-950/60 p-3 rounded-xl border border-emerald-500/30 space-y-1">
          <div className="text-xs font-bold text-white flex items-center gap-1.5">
            <span className="text-emerald-400">📊</span>
            <span>Where is the YTD Capital Gains and Capital Loss Carryforwards tracking located and how is it edited?</span>
          </div>
          <p className="text-xs text-slate-400">
            YTD Capital Gains and Capital Loss Carryforwards are tracked in <strong>Step 2 (WeeklyCashLedgerView) Panel B</strong> via an institutional 4-card matrix:
          </p>
          <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside mt-1">
            <li><strong>Realized Capital Gains:</strong> Closed gains from equity, ETF, and underlying share sales.</li>
            <li><strong>Realized Capital Losses:</strong> Closed losses from stock or long hedges.</li>
            <li><strong>Prior Year Loss Carryforward:</strong> Unused historical capital losses brought forward under IRS rules (including the standard $3,000 annual ordinary income offset allowance).</li>
            <li><strong>Net Taxable Options &amp; Equity Estimate:</strong> Real-time net taxable liability: <code className="text-emerald-300 font-mono">Net = (YTD Premiums + Realized Gains) - Realized Losses - Loss Carryforward Offset</code>.</li>
          </ul>
          <p className="text-xs text-slate-400 mt-1">
            Click <strong>&quot;Edit Gains &amp; Carryover&quot;</strong> on the card header to open the dedicated maintenance modal, where you can modify the tax year, enter realized gains and losses, adjust loss carryforwards, and instantly preview net taxable income before saving.
          </p>
        </div>

        <div className="bg-slate-950/60 p-3 rounded-xl border border-emerald-500/30 space-y-1">
          <div className="text-xs font-bold text-white flex items-center gap-1.5">
            <span className="text-emerald-400">💼</span>
            <span>What asset classes are tracked in the Active Position Ledger?</span>
          </div>
          <p className="text-xs text-slate-400">
            The <strong>Active Position Ledger</strong> reflects the complete institutional inventory across all <strong>4 core asset classes</strong> in the target broker trading account:
          </p>
          <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside mt-1">
            <li><strong>Long Equities:</strong> Equity shares held long that provide portfolio delta, underlying asset appreciation, and collateral backing for covered calls.</li>
            <li><strong>Related Options:</strong> Cash-Secured Puts (encumbering cash collateral) and Covered Calls (generating systematic options yield against held equities).</li>
            <li><strong>Bank Cash &amp; Sweep:</strong> Liquid cash balance and bank deposit sweep providing instant deployable purchasing power.</li>
            <li><strong>Money Market Funds (MMF):</strong> Municipal and government money market funds preserving capital while delivering daily yield.</li>
          </ul>
          <p className="text-xs text-slate-400 mt-1">
            Use the <strong>Asset Class Filter Tabs</strong> (<em>All, Equities, CSPs, Covered Calls, Cash &amp; MMF</em>) to isolate holdings, or upload a fresh broker CSV export at any time.
          </p>
        </div>

        <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-1">
          <div className="text-xs font-bold text-white flex items-center gap-1.5">
            <span>🖨️</span>
            <span>How does the PDF engine handle printing without background graphics (Text Form with Light Formatting)?</span>
          </div>
          <p className="text-xs text-slate-400">
            Both the <strong>Weekly Executive Master Report</strong> (Step 6) and the <strong>Executive Portfolio Health Digest</strong> feature native PDF rendering engineered for clean, ink-efficient text printing without background graphics. The platform sets <code>print-color-adjust: economy</code> so browser print engines naturally suppress heavy color fills and allow unchecking &quot;Background graphics&quot; without breaking readability. Additionally, a dedicated <strong>&quot;Text Form / No Backgrounds&quot;</strong> toggle is provided in the action toolbar; when active, it completely eliminates all dark card backgrounds, glassmorphism, and color blocks, rendering clean financial text, subtle 1px divider lines, and high-contrast typography optimized for archiving, executive memos, and physical printing.
          </p>
        </div>

        <div className="bg-slate-950/60 p-3 rounded-xl border border-purple-500/30 space-y-1">
          <div className="text-xs font-bold text-white flex items-center gap-1.5">
            <span className="text-purple-400">📊</span>
            <span>How does the 4-Tab Options Trade Quality Simulator evaluate options &amp; implied earnings moves?</span>
          </div>
          <p className="text-xs text-slate-400">
            The <strong>Options Trade Quality Simulator</strong> features a unified 4-tab institutional interface:
          </p>
          <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside mt-1">
            <li><strong>Tab 1 (Scoring &amp; Dual-Yield Blueprint):</strong> Interactive parameter sliders (DTE, Delta, IV Rank, Cushion %, AROC %) and real-time computation of Static Yield (<code className="text-emerald-300 font-mono">Y_static = Premium / Spot</code>) vs. Assigned Yield (<code className="text-emerald-300 font-mono">Y_assigned = (Premium + (Strike - Spot)) / Spot</code>). Automatically detects corporate earnings within expiration and requires clearing the <strong>ATM Straddle Implied Move</strong> (<code className="text-cyan-300 font-mono">0.65*IV + 0.35*HistoricalMove</code>) with a 15% safety buffer.</li>
            <li><strong>Tab 2 (Expiration Payoff Diagram):</strong> Visualizes net profit/loss profiles across price points, marking the exact Break-Even price (<code className="text-emerald-300 font-mono">S_BE = Strike - Premium</code> for CSPs, <code className="text-emerald-300 font-mono">Spot - Premium</code> for CCs), maximum profit caps, and assignment zones.</li>
            <li><strong>Tab 3 (Defensive Roll Matrix):</strong> Computes down-and-out credit rolls when spot drops within 2.5% of strike or Delta reaches &ge;0.40, evaluating next-cycle strikes, DTE extension, and net credit.</li>
            <li><strong>Tab 4 (Volatility &amp; Dividend Guard):</strong> Quantifies Variance Risk Premium (<code className="text-amber-300 font-mono">VRP = IV - RV_30d</code>) and flags early exercise risk if ex-dividend occurs before expiration and call extrinsic value is less than the dividend (<code className="text-rose-300 font-mono">C_ext &lt; Div</code>).</li>
          </ul>
        </div>

        <div className="bg-slate-950/60 p-3 rounded-xl border border-cyan-500/30 space-y-1">
          <div className="text-xs font-bold text-white flex items-center gap-1.5">
            <span className="text-cyan-400">⚖️</span>
            <span>How do IRC §1256 (60/40 rule) and §1092 Qualified Covered Calls (QCC) optimize my tax alpha?</span>
          </div>
          <p className="text-xs text-slate-400">
            Derivative taxation under U.S. Internal Revenue Code Subchapter P is audited through a 5-gateway evaluation hierarchy:
          </p>
          <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside mt-1">
            <li><strong>Gate 1 (§1256 Non-Equity Options):</strong> Broad-based cash-settled index options (SPX, NDX, RUT, XSP) qualify for <strong>60% Long-Term / 40% Short-Term capital gains tax rates</strong> (max federal blended ~26.8% vs. 40.8% ordinary rate), regardless of holding period, with annual 12/31 mark-to-market. Single-stock equity options and ETF options (SPY, QQQ) do <em>not</em> qualify.</li>
            <li><strong>Gate 2 (§1092(c)(4) QCC Test):</strong> Writing a Covered Call on long stock creates an offsetting straddle unless it meets <strong>Qualified Covered Call (QCC)</strong> statutory benchmarks: DTE &gt; 30 days and strike not deep-in-the-money (&le; 1 applicable benchmark strike below prior day close). Non-QCC calls suspend stock holding periods or trigger loss deferral.</li>
            <li><strong>Gate 3 (§1091 Wash Sales):</strong> Substantially identical contract purchases within 30 days before/after closing a loss position disallow loss deductions, adding the disallowed loss to the new position&apos;s cost basis.</li>
            <li><strong>Gate 4 &amp; 5 (§1233 &amp; §1259):</strong> Protective puts terminate unheld long-term stock clocks; deep ITM synthetic hedges trigger constructive sales.</li>
          </ul>
        </div>

        <div className="bg-slate-950/60 p-3 rounded-xl border border-amber-500/30 space-y-1">
          <div className="text-xs font-bold text-white flex items-center gap-1.5">
            <span className="text-amber-400">🛡️</span>
            <span>How does the Defensive Roll Assistant protect threatened CSPs and Covered Calls?</span>
          </div>
          <p className="text-xs text-slate-400">
            The <strong>Defensive Roll Assistant</strong> monitors active positions against institutional defense triggers: when an underlying stock tests a short put strike within 2.5% or option delta reaches &ge;0.40 (or tested on the upside for covered calls), the engine calculates an optimal <em>down-and-out</em> or <em>up-and-out</em> roll. By extending the expiration cycle by 7 to 30 days, the investor buys back the threatened near-term contract and sells a lower-strike/higher-duration contract for an overall <strong>net credit</strong>, lowering break-even cost basis while avoiding forced assignment.
          </p>
        </div>

        <div className="bg-slate-950/60 p-3 rounded-xl border border-emerald-500/30 space-y-1">
          <div className="text-xs font-bold text-white flex items-center gap-1.5">
            <span className="text-emerald-400">⚡</span>
            <span>How does the Advanced Buy-Write Module integrate OptionForge, Optopsy, and Trading-Skills models?</span>
          </div>
          <p className="text-xs text-slate-400">
            The <strong>Advanced Buy-Write (Covered Call) Module</strong> combines three open-source options engineering methodologies into a seamless portfolio overlay:
          </p>
          <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside mt-1">
            <li><strong>OptionForge Interactive Payoff Visualization:</strong> Generates real-time expiration P&amp;L curves for covered call structures (long 100 shares + short 1 call). Instantly updates Breakeven (<code className="text-cyan-300 font-mono">S_BE = Spot - Premium</code>), Max Profit (<code className="text-emerald-300 font-mono">(Strike - Spot) + Premium</code>), Downside Cushion (<code className="text-amber-300 font-mono">Premium / Spot</code>), and Annualized Yield on Capital (<code className="text-purple-300 font-mono">MaxProfit% * (365 / DTE)</code>) with live sensitivity sliders.</li>
            <li><strong>Optopsy Dynamic Delta &amp; IVR Screener:</strong> Filters options across custom Delta sweet spots (Conservative 0.15–0.22&Delta;, Balanced 0.22–0.32&Delta;, Aggressive 0.32–0.42&Delta;) and optimal theta-decay cycles (21–45 DTE). Strikes are ranked using a multi-factor composite score that rewards elevated Implied Volatility Rank (IVR &gt; 50%) to harvest rich volatility premiums while enforcing bid-ask spread liquidity guards.</li>
            <li><strong>Trading-Skills Early Dividend Assignment Risk Engine:</strong> Detects American-style early exercise hazards around corporate Ex-Dividend dates. If an Ex-Dividend date falls within the option holding period and the dividend amount exceeds remaining call extrinsic (time) value (<code className="text-rose-400 font-mono">Dividend &gt; Extrinsic</code>), the scanner raises an amber/rose early assignment alert so investors avoid forfeiting dividends or facing premature stock call-aways.</li>
          </ul>
        </div>

        <div className="bg-slate-950/60 p-3 rounded-xl border border-indigo-500/30 space-y-1">
          <div className="text-xs font-bold text-white flex items-center gap-1.5">
            <span className="text-indigo-400">💬</span>
            <span>How do the Social Share Toolbar and Discord Webhook Alert Dispatcher work?</span>
          </div>
          <p className="text-xs text-slate-400">
            The <strong>Social Share Toolbar</strong> located in the Ticker Audit technical boundary view enables instantaneous trade idea syndication across multiple channels:
          </p>
          <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside mt-1">
            <li><strong>Discord Webhook Dispatcher:</strong> Configure your personal or community Discord channel webhook URL. The terminal generates an institutional rich embed formatted with strategy-coded color themes (Emerald for CSPs, Cyan for Covered Calls, Amber for Spreads, Purple for Condors), technical indicators (RSI, IV Rank), collateral requirements, annualized return, POP, and break-even levels. Rate limits (HTTP 429) are gracefully handled with automatic retry back-off.</li>
            <li><strong>Trader Networks &amp; Live Squawks:</strong> Direct one-click share deep-links to Telegram, WhatsApp, and StockTwits, plus direct launcher access to live trading squawks (FinancialJuice) and derivative discussion communities (r/thetagang, r/options, MarketChameleon).</li>
          </ul>
        </div>

        <div className="bg-slate-950/60 p-3 rounded-xl border border-emerald-500/30 space-y-1">
          <div className="text-xs font-bold text-white flex items-center gap-1.5">
            <span className="text-emerald-400">🔐</span>
            <span>How does tenant authentication and the password reset workflow operate?</span>
          </div>
          <p className="text-xs text-slate-400">
            DeltaHarvest utilizes a multi-tenant authentication architecture powered by native Web Crypto API PBKDF2 password hashing (100,000 iterations) with salted HMAC-SHA256 session tokens:
          </p>
          <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside mt-1">
            <li><strong>Self-Service Password Reset (Login Screen):</strong> Users who have forgotten their credentials click &quot;Forgot password?&quot; on the sign-in screen and enter their registered email address. The edge worker generates a single-use cryptographically random token valid for 30 minutes and dispatches reset instructions to the registered email address. Upon token confirmation, the user sets a new password (min. 8 characters) and an automated audit alert is transmitted to the platform administrator.</li>
            <li><strong>Administrative Reset Console:</strong> Platform administrators can reset tenant passwords directly from the User Administration Directory (<code className="text-cyan-300 font-mono">/admin/users</code>) using either tenant ID or email.</li>
            <li><strong>In-Session Password Rotation:</strong> Authenticated users can rotate credentials at any time directly within their personal tenant workspace using the Password Change modal.</li>
          </ul>
        </div>

        <div className="bg-slate-950/60 p-3 rounded-xl border border-teal-500/30 space-y-1">
          <div className="text-xs font-bold text-white flex items-center gap-1.5">
            <span className="text-teal-400">📬</span>
            <span>How does the Scheduled Morning Digest Push work and how do I subscribe?</span>
          </div>
          <p className="text-xs text-slate-400">
            The <strong>Scheduled Morning Digest Push</strong> dispatches an automated market pre-opening intelligence briefing before the bell on trading days (scheduled via GitHub Actions at 6:00 AM CT / 11:00 UTC, Mon–Fri):
          </p>
          <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside mt-1">
            <li><strong>Automated Pre-Market Intelligence:</strong> Includes economic catalyst alerts, macro radar, expiring option warnings, and top screened opportunities formatted for quick review.</li>
            <li><strong>User Profile Opt-In:</strong> Log in to your personal dashboard (<code className="text-cyan-300 font-mono">/profile</code> or User Dashboard) and scroll to <strong>Morning Intelligence Digest</strong>. Toggle the subscription switch on, specify your preferred delivery email, and optionally enter a Discord webhook URL for community/channel notifications.</li>
            <li><strong>Fail-Safe Dispatch:</strong> The edge engine checks trading day calendars before sending, authenticates via edge secret headers, dispatches via Resend/Discord webhook, and logs run outcomes in SQLite/D1.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

