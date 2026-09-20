import React from 'react';
import { DirectActionBanner } from './DirectActionBanner';
import { MenuTreeType, EquitiesTabType, OptionsTabType } from '../../../../types/options';

export interface ChapterWeeklyWorkflowGuideProps {
  onNavigate?: (tree: MenuTreeType, optionsTab?: OptionsTabType, equitiesTab?: EquitiesTabType) => void;
  onOpenSimulator?: () => void;
}

export const ChapterWeeklyWorkflowGuide: React.FC<ChapterWeeklyWorkflowGuideProps> = ({
  onNavigate,
  onOpenSimulator,
}) => {
  return (
    <div className="space-y-6">
      <div className="border-l-2 border-emerald-400 pl-4 py-1">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <span>📅 The Systematic End-of-Week Options Ritual (7-Step Guided Workflow)</span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
            Production Standard
          </span>
        </h3>
        <p className="text-slate-300 mt-1 text-xs leading-relaxed">
          Every weekend, systematic options income investors execute this strict 7-step ritual to audit cash, encumber weekly living disbursements ($5,000), manage holdings and 80% profit triggers, evaluate macro catalysts, run the Tri-Screen quant engine, obtain Gemini AI Extended Thinking trade selections in 3 markdown tables, and stage bracket orders in the broker workbench.
        </p>
      </div>

      <DirectActionBanner
        title="7-Step Guided Workflow & Tactical Tools Direct Access"
        actions={[
          {
            label: 'Step 1: Schwab Positions',
            location: 'Workflow > Upload',
            onClick: () => onNavigate?.('WORKFLOW', 'SCHWAB_POSITIONS_UPLOAD'),
          },
          {
            label: 'Step 2: Cash Ledger',
            location: 'Workflow > Cash Ledger',
            onClick: () => onNavigate?.('WORKFLOW', 'WEEKLY_CASH_LEDGER'),
          },
          {
            label: 'Step 3: Covered Calls',
            location: 'Workflow > Covered Calls',
            onClick: () => onNavigate?.('WORKFLOW', 'HOLDINGS_COVERED_CALLS'),
          },
          {
            label: 'Step 4: Macro & Earnings',
            location: 'Workflow > Macro Guard',
            onClick: () => onNavigate?.('WORKFLOW', 'ECONOMIC_CALENDAR'),
          },
          {
            label: 'Step 5: Cascading Screeners',
            location: 'Workflow > Cascading Funnel',
            onClick: () => onNavigate?.('WORKFLOW', 'CASCADING_SCREENER'),
          },
          {
            label: 'Step 6: Executive Report',
            location: 'Workflow > Executive Report',
            onClick: () => onNavigate?.('WORKFLOW', 'WEEKLY_EXECUTIVE_REPORT'),
          },
          {
            label: 'Step 7: Broker Staging',
            location: 'Workflow > Order Staging',
            onClick: () => onNavigate?.('WORKFLOW', 'BROKER_STAGING'),
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
        ]}
      />

      {/* Universal Table Navigation & Sorting Tip */}
      <div className="bg-slate-900/90 border border-cyan-500/30 rounded-xl p-3.5 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-300 shrink-0">
            <span className="text-base">↕️</span>
          </div>
          <div>
            <span className="font-bold text-white block">Universal Column Sorting &amp; Sticky Locked Headers</span>
            <span className="text-slate-300">
              All columnar data tables across the platform (Cascading Tri-Screen, Weekly Stock Screeners, Active Position Audits, Holdings &amp; CCs, Broker Staging, and Macro Calendar) feature interactive multi-type sorting. Click any header to toggle ascending/descending, with headers remaining locked and visible while scrolling.
            </span>
          </div>
        </div>
      </div>

      {/* Step-by-Step Production Guide with Explicit Manual Interventions */}
      <div className="space-y-4">
        {/* Step 1 */}
        <div className="bg-slate-950/80 p-4 rounded-xl border border-blue-500/30 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
            <div className="flex items-center space-x-2">
              <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-300 font-mono font-bold flex items-center justify-center text-xs">
                1
              </span>
              <span className="font-bold text-blue-300 text-sm">Step 1: Upload Schwab Positions &amp; Cash (SchwabPositionsUploadView)</span>
            </div>
            <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-400">
              Route: WORKFLOW &rarr; SCHWAB_POSITIONS_UPLOAD
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="space-y-1.5">
              <strong className="text-white block font-semibold">⚙️ Automated System Ingestion:</strong>
              <ul className="text-slate-300 space-y-1 list-disc list-inside">
                <li><strong>Pre-Ingestion Clean Reset Routine:</strong> Automatically runs just prior to new Schwab CSV ingestion. Clears all stale positions, purges prior week screened stocks (ThinkorSwim, Barchart, MarketChameleon), wipes prior AI recommendations, and clears staged orders, resetting cash encumbrances to only the default $5,000 living expenses.</li>
                <li><strong>Dynamic Cash Pool Summation:</strong> Dynamically sums all cash and money market funds (Bank Deposit Core Sweep, SNYXX, SNAXX, and reserve MMFs) prior to any deductions.</li>
                <li><strong>Automatic Open CSP Collateral Backout:</strong> Computes <code className="text-amber-300 font-mono">Strike &times; Contracts &times; 100</code> for every open cash-secured put and backs out the collateral liability to determine Available Cash before living expenses.</li>
                <li><strong>Default Living Expenses Encumbrance:</strong> Reserves exactly $5,000 in weekly living expenses, producing accurate Net Free Cash for new CSPs.</li>
                <li><strong>Baseline Auto-Seed:</strong> Pre-loads verified week-ending baseline positions with a clean reset in one click.</li>
              </ul>
            </div>

            <div className="space-y-1.5 bg-slate-900/60 p-3 rounded-lg border border-slate-800">
              <strong className="text-amber-300 block font-semibold">👤 Manual Intervention Required by User:</strong>
              <ol className="text-slate-300 space-y-1 list-decimal list-inside">
                <li><strong>Export from Schwab:</strong> Log into Charles Schwab, navigate to Positions, and click &quot;Export&quot; as of Friday&apos;s close.</li>
                <li><strong>Upload CSV or Reset:</strong> Click &quot;Start New Week (Clean Reset)&quot; or directly drag-and-drop/select your CSV file in the dropzone (which auto-triggers the clean reset).</li>
                <li><strong>Verify Balances:</strong> Review categorized cards, then click <strong>&quot;Proceed to Step 2: Cash Balance &rarr;&quot;</strong>.</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Step 2 */}
        <div className="bg-slate-950/80 p-4 rounded-xl border border-emerald-500/30 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
            <div className="flex items-center space-x-2">
              <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-bold flex items-center justify-center text-xs">
                2
              </span>
              <span className="font-bold text-emerald-300 text-sm">Step 2: Precalculated Cash Balance, Disbursements &amp; Tax Ledger (WeeklyCashLedgerView)</span>
            </div>
            <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-400">
              Route: WORKFLOW &rarr; WEEKLY_CASH_LEDGER
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="space-y-1.5">
              <strong className="text-white block font-semibold">⚙️ Automated System Calculations:</strong>
              <ul className="text-slate-300 space-y-1 list-disc list-inside">
                <li><strong>Precalculated Cash Formula:</strong> Evaluates <code className="text-emerald-300 font-mono">Precalculated Liquid Cash = Cash Sweep + Money Market Funds - &Sigma;(Strike &times; 100 &times; Contracts for open CSPs)</code>.</li>
                <li><strong>Living Expense Encumbrance:</strong> Automatically subtracts $5,000 upfront weekly living disbursements before options sizing.</li>
                <li><strong>End-of-Week Tax &amp; YTD Verification:</strong> Prompts weekly review of YTD Option Premiums Written and YTD Net Realized Capital Gains, while strictly retaining Capital Loss Carry Forwards across weekly resets. Alerts upon crossing the January 1 calendar year boundary.</li>
                <li><strong>Position Limits &amp; Budget Guardrails:</strong> Strictly enforces $200,000 single equity security position limit and dynamically sizes concurrent trades: <code className="text-emerald-400 font-mono">min(5, floor(Free Cash / Target Allocation))</code>, auto-gating Step 5 screener candidates.</li>
              </ul>
            </div>

            <div className="space-y-1.5 bg-slate-900/60 p-3 rounded-lg border border-slate-800">
              <strong className="text-amber-300 block font-semibold">👤 Manual Intervention Required by User:</strong>
              <ol className="text-slate-300 space-y-1 list-decimal list-inside">
                <li><strong>Verify Precalculated Cash:</strong> Review the formula breakdown box. If cash or MMF balances changed, edit inline or use quick chips.</li>
                <li><strong>Confirm Weekly YTD Tax Figures:</strong> Click <em>Edit YTD Gains &amp; Carryover</em> to adjust closed capital gains or premiums, verify the retained loss carryforward, and click <em>Confirm &amp; Mark Reconciled for Week</em>.</li>
                <li><strong>New Calendar Year Reset (Jan 1):</strong> When the calendar year transitions, reset YTD Premiums and Net Gains to $0.00 and roll unused losses into your Prior-Year Capital Loss Carry Forward.</li>
                <li><strong>Position Allocation Target:</strong> Select your target allocation (Auto, $50k, $100k, or $200k max cap) to calibrate position sizing.</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Step 3 */}
        <div className="bg-slate-950/80 p-4 rounded-xl border border-indigo-500/30 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
            <div className="flex items-center space-x-2">
              <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-300 font-mono font-bold flex items-center justify-center text-xs">
                3
              </span>
              <span className="font-bold text-indigo-300 text-sm">Step 3: Holdings &amp; Covered Calls Harvest Radar (Configurable &Delta;)</span>
            </div>
            <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-400">
              Route: WORKFLOW &rarr; HOLDINGS_COVERED_CALLS
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="space-y-1.5">
              <strong className="text-white block font-semibold">⚙️ Automated System Calculations &amp; Simulator Synergy:</strong>
              <ul className="text-slate-300 space-y-1 list-disc list-inside">
                <li><strong>Configurable Target Delta Calibration (20&Delta; Default):</strong> Automatically targets the upcoming weekly Friday expiration (5-7 DTE, holiday adjusted) using Black-Scholes inversion: <code>K = S &middot; exp((r + &sigma;&sup2;/2)T - &Phi;&macr;&sup1;(&Delta;)&sigma;&radic;T)</code>. Users can recalibrate to 15&Delta; Safe (85% PoP), 20&Delta; Standard, 25&Delta; Balanced, 30&Delta; High Yield, or type any custom delta directly.</li>
                <li><strong>ATM Straddle Implied Move Defense:</strong> Quantifies the &plusmn;1 SD straddle jump (<code>Spot &middot; &sigma; &middot; &radic;T &middot; 0.84</code>) and flags whether the strike clears the straddle bounds to protect against unexpected volatility spikes.</li>
                <li><strong>Cost-Basis &amp; Earnings Safety Guardrails:</strong> Checks position cost basis (warning if underwater) and audits corporate earnings dates to pause automatic staging during quarterly earnings gap risk.</li>
                <li><strong>1-Click Simulator Integration:</strong> Every harvest candidate features a <em>&quot;Simulate&quot;</em> action button that launches the 100-Point Options Trade Quality Simulator pre-loaded with the symbol, expiration, delta, and IV rank for complete Greeks and payoff analysis.</li>
                <li><strong>Dual 80% Profit Triggers:</strong> Automatically flags calls and CSPs achieving &ge;80% profit capture for 1-click <em>Close (BTC)</em> or <em>Roll &rarr;</em> for net credit.</li>
              </ul>
            </div>

            <div className="space-y-1.5 bg-slate-900/60 p-3 rounded-lg border border-slate-800">
              <strong className="text-amber-300 block font-semibold">👤 Manual Intervention &amp; Customization Controls:</strong>
              <ol className="text-slate-300 space-y-1 list-decimal list-inside">
                <li><strong>Adjust Harvest Target Delta:</strong> Use the calibration bar at the top of Step 3 to select quick preset pills (15&Delta;, 20&Delta;, 25&Delta;, 30&Delta;), fine-tune via &plusmn;1&Delta; steppers, slide the continuous bar, or type an exact integer delta percentage.</li>
                <li><strong>Fine-Tune Per-Position Delta:</strong> Click into an individual holding to open the Covered Call Recommendation modal, adjust the target delta dynamically for that specific trade, or click <em>&quot;Audit in 100-Pt Simulator&quot;</em> to view the full quantitative score breakdown.</li>
                <li><strong>Harvest Uncovered Lots:</strong> Click <strong>&quot;Stage All Safe Weekly Calls&quot;</strong> to stage all earnings-cleared covered call orders into Step 7 in a single batch.</li>
                <li><strong>Manage 80% Profit Triggers:</strong> For contracts hitting 80% profit, select <strong>Close (BTC)</strong> to unlock shares or <strong>Roll &rarr;</strong> to extend into next Friday.</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Step 4 */}
        <div className="bg-slate-950/80 p-4 rounded-xl border border-purple-500/30 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
            <div className="flex items-center space-x-2">
              <span className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-300 font-mono font-bold flex items-center justify-center text-xs">
                4
              </span>
              <span className="font-bold text-purple-300 text-sm">Step 4: Macro &amp; Catalysts Radar (EconomicCalendarView)</span>
            </div>
            <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-400">
              Route: WORKFLOW &rarr; ECONOMIC_CALENDAR
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="space-y-1.5">
              <strong className="text-white block font-semibold">⚙️ Automated System Calculations &amp; Resilient Feed Engine:</strong>
              <ul className="text-slate-300 space-y-1 list-disc list-inside">
                <li><strong>3-Tier Fallback Hierarchy:</strong> Auto-refreshes high-impact macro catalysts via Tier 1 (Cloudflare Edge API / FastAPI) &rarr; Tier 2 (Secondary Public CORS Proxy Mirror) &rarr; Tier 3 (Curated Bundled Schedule dataset), ensuring 100% uninterrupted availability even during upstream rate limits.</li>
                <li><strong>Feed Status Indicator:</strong> Real-time header badges dynamically reflect source health (🟢 Live Feed, 🔄 Secondary Mirror, 🛡️ Curated Schedule).</li>
                <li><strong>Transmission Matrix:</strong> Maps events to affected sectors (e.g. CPI/PCE &rarr; QQQ/XLF/TLT, FOMC &rarr; Broad Market, NFP &rarr; IWM, Crude Oil &rarr; XLE).</li>
              </ul>
            </div>

            <div className="space-y-1.5 bg-slate-900/60 p-3 rounded-lg border border-slate-800">
              <strong className="text-amber-300 block font-semibold">👤 Manual Intervention Required by User:</strong>
              <ol className="text-slate-300 space-y-1 list-decimal list-inside">
                <li><strong>Review Weekly Catalysts:</strong> Check the calendar for high-impact releases scheduled during the upcoming expiration week.</li>
                <li><strong>Refresh Feed:</strong> Click <strong>&quot;Refresh Feed&quot;</strong> anytime to re-query the latest calendar updates across the 3-tier hierarchy.</li>
                <li><strong>Evaluate Sector Exposure:</strong> If CPI or FOMC falls mid-week, verify you widen safety cushions (&ge;5.0% cushion, &le;0.18&Delta;) on sensitive growth equities.</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Step 5 */}
        <div className="bg-slate-950/80 p-4 rounded-xl border border-cyan-500/30 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
            <div className="flex items-center space-x-2">
              <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-300 font-mono font-bold flex items-center justify-center text-xs">
                5
              </span>
              <span className="font-bold text-cyan-300 text-sm">Step 5: Tri-Screen &amp; Gemini AI Decision Hub (CascadingScreenerView)</span>
            </div>
            <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-400">
              Route: WORKFLOW &rarr; CASCADING_SCREENER
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="space-y-1.5">
              <strong className="text-white block font-semibold">⚙️ Automated System Calculations &amp; Tri-Screen Engine:</strong>
              <ul className="text-slate-300 space-y-1 list-disc list-inside">
                <li><strong>Tab 1 (Barchart Top 1%):</strong> Automated screener with 100% buy consensus across 13 technical moving averages and MACDs. Supports <strong>&quot;Fetch Live Quotes&quot;</strong> (re-hydrating live market prices via Tradier) and <strong>&quot;Upload CSV&quot;</strong> for latest Friday exports.</li>
                <li><strong>Tab 2 (MarketChameleon Momentum):</strong> Momentum equities with RSI 50–70, IV30 &gt; 30%, and CBOE weekly registry verification. Features <strong>&quot;Fetch Live Quotes&quot;</strong> and <strong>&quot;Upload CSV&quot;</strong> alongside Prescreen Builder.</li>
                <li><strong>Tab 3 (ThinkorSwim View 190898):</strong> Automatically computes 13-indicator Barchart opinion consensus, stability arrows, and options cadence for any custom or TOS tickers.</li>
                <li><strong>Tab 4 (Gemini AI Extended Thinking):</strong> Ingests liquidity constraints ($200k max single equity CSP cap, $5,000 living deduction, free cash), strictly eliminates non-weekly options via CBOE Weeklys Gate, filters candidate contracts within 0.15–0.25&Delta;, formats institutional prompt, and parses 3 markdown tables.</li>
              </ul>
            </div>

            <div className="space-y-1.5 bg-slate-900/60 p-3 rounded-lg border border-slate-800">
              <strong className="text-amber-300 block font-semibold">👤 Manual Intervention Required by User:</strong>
              <ol className="text-slate-300 space-y-1 list-decimal list-inside">
                <li><strong>Update Screens (Tab 1 &amp; 2):</strong> Click <strong>&quot;Fetch Live Quotes&quot;</strong> to re-hydrate real-time market prices, or click <strong>&quot;Upload CSV&quot;</strong> to ingest newly downloaded Friday screens directly.</li>
                <li><strong>Run TOS Screen (Tab 3):</strong> Click <strong>Schwab Import Equities</strong> (or paste custom symbols) and click <strong>&quot;▶ Run Barchart View 190898 Analysis&quot;</strong>.</li>
                <li><strong>Send to Gemini Hub:</strong> Click <strong>&quot;📥 Send Screened Stocks to Gemini Decision Hub&quot;</strong> on any of the screens.</li>
                <li><strong>Generate &amp; Run Prompt:</strong> On Tab 4, click <strong>&quot;1-Click Copy Prompt&quot;</strong>. Open <strong>gemini.google.com</strong> (select Gemini Pro with Extended Thinking HIGH), paste the prompt, and execute.</li>
                <li><strong>Import &amp; Stage:</strong> Copy Gemini&apos;s markdown response, paste it into the DeltaHarvest parser box, and click <strong>&quot;1-Click Stage&quot;</strong> on Table 1 recommended trades.</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Step 6 */}
        <div className="bg-slate-950/80 p-4 rounded-xl border border-amber-500/30 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
            <div className="flex items-center space-x-2">
              <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-300 font-mono font-bold flex items-center justify-center text-xs">
                6
              </span>
              <span className="font-bold text-amber-300 text-sm">Step 6: Master Report (WeeklyExecutiveReportView)</span>
            </div>
            <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-400">
              Route: WORKFLOW &rarr; WEEKLY_EXECUTIVE_REPORT
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="space-y-1.5">
              <strong className="text-white block font-semibold">⚙️ Automated System Calculations:</strong>
              <ul className="text-slate-300 space-y-1 list-disc list-inside">
                <li><strong>Executive Digest Synthesis:</strong> Integrates portfolio health score, daily Theta cash flow, SPY Beta-weighted Delta, and capital utilization.</li>
                <li><strong>Live Transaction Audit Trail:</strong> Summarizes mid-week live transactions, real Schwab options premium captured ($51,514.11), and IRS Section 1256 tax alpha.</li>
                <li><strong>Action Plan Compilation:</strong> Collates staged trades, rolls, and profit-taking orders into an executive checklist.</li>
              </ul>
            </div>

            <div className="space-y-1.5 bg-slate-900/60 p-3 rounded-lg border border-slate-800">
              <strong className="text-amber-300 block font-semibold">👤 Manual Intervention Required by User:</strong>
              <ol className="text-slate-300 space-y-1 list-decimal list-inside">
                <li><strong>Review Synthesis:</strong> Verify overall portfolio health score and capital allocation metrics.</li>
                <li><strong>Export Audit Records:</strong> Click <strong>&quot;Download CSV&quot;</strong> or <strong>&quot;Print-to-PDF&quot;</strong> for weekly compliance and archival records.</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Step 7 */}
        <div className="bg-slate-950/80 p-4 rounded-xl border border-teal-500/30 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
            <div className="flex items-center space-x-2">
              <span className="w-6 h-6 rounded-full bg-teal-500/20 text-teal-300 font-mono font-bold flex items-center justify-center text-xs">
                7
              </span>
              <span className="font-bold text-teal-300 text-sm">Step 7: Broker Order Execution (BrokerStagingWorkbench)</span>
            </div>
            <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-400">
              Route: WORKFLOW &rarr; BROKER_STAGING
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="space-y-1.5">
              <strong className="text-white block font-semibold">⚙️ Automated System Calculations:</strong>
              <ul className="text-slate-300 space-y-1 list-disc list-inside">
                <li><strong>Bracket Order Synthesis:</strong> Automatically structures limit entry price, 80% GTC profit-taking order, and 0.50&Delta; defensive roll trigger.</li>
                <li><strong>Collateral Verification:</strong> Re-verifies required collateral against free cash before trade confirmation.</li>
              </ul>
            </div>

            <div className="space-y-1.5 bg-slate-900/60 p-3 rounded-lg border border-slate-800">
              <strong className="text-amber-300 block font-semibold">👤 Manual Intervention Required by User:</strong>
              <ol className="text-slate-300 space-y-1 list-decimal list-inside">
                <li><strong>Review Staged Orders:</strong> Inspect limit prices and contracts count.</li>
                <li><strong>Execute in Broker:</strong> Submit orders to Charles Schwab or Interactive Brokers (Live Capital or Simulation mode) at Monday market open.</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
