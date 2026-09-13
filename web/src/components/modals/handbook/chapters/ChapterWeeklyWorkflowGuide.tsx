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
                <li><strong>CSV Position Ingestion:</strong> Automatically ingests export files directly from Charles Schwab accounts as of the close of trading for the week.</li>
                <li><strong>Asset Breakdown:</strong> Classifies rows into Bank Sweep Cash, Money Market Funds (SNYXX, SNAXX), Open Option Contracts (CSPs and Covered Calls), and Equities.</li>
                <li><strong>Baseline Auto-Seed:</strong> Pre-loads verified week-ending baseline positions ($573,820.76 liquid cash pool and $263,250.00 CSP encumbrance) with one click.</li>
              </ul>
            </div>

            <div className="space-y-1.5 bg-slate-900/60 p-3 rounded-lg border border-slate-800">
              <strong className="text-amber-300 block font-semibold">👤 Manual Intervention Required by User:</strong>
              <ol className="text-slate-300 space-y-1 list-decimal list-inside">
                <li><strong>Export from Schwab:</strong> Log into Charles Schwab, navigate to Positions, and click &quot;Export&quot; as of Friday&apos;s close.</li>
                <li><strong>Upload CSV:</strong> Drag-and-drop or select your CSV file in the dropzone.</li>
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
                <li><strong>Calendar YTD Premiums Tracking:</strong> Automatically tracks cumulative option premiums earned across the calendar year (2026 baseline defaults to $603,305.40) and adds settled current week premiums.</li>
                <li><strong>YTD Capital Gains &amp; Loss Netting:</strong> Computes net taxable income by adding YTD premiums and realized capital gains, subtracting realized losses and applying prior-year capital loss carryforwards (e.g. IRS $3,000 annual allowance).</li>
                <li><strong>Position Limits:</strong> Strictly enforces $200,000 single equity security position limit and dynamically sizes concurrent trades: <code className="text-emerald-400 font-mono">min(5, floor(Free Cash / Target Allocation))</code>.</li>
              </ul>
            </div>

            <div className="space-y-1.5 bg-slate-900/60 p-3 rounded-lg border border-slate-800">
              <strong className="text-amber-300 block font-semibold">👤 Manual Intervention Required by User:</strong>
              <ol className="text-slate-300 space-y-1 list-decimal list-inside">
                <li><strong>Verify Precalculated Cash:</strong> Review the formula breakdown box. If cash or MMF balances changed, edit inline or use quick chips.</li>
                <li><strong>Set Living Expenses:</strong> Verify the weekly disbursement ($5,000 default). Adjust if extraordinary tax or capital distributions are planned.</li>
                <li><strong>Update Starting YTD Premiums ($603,305.40):</strong> Directly edit or quick-fill the starting YTD baseline in Panel A or verify/adjust the starting balance directly within the <em>Log Current Week Premium</em> modal before logging weekly options.</li>
                <li><strong>Maintain YTD Capital Gains &amp; Loss Carryforwards:</strong> Click <em>Edit Gains &amp; Carryover</em> in Panel B to update closed equity/ETF realized gains, realized losses, and IRS prior-year loss carryforwards with real-time taxable income preview.</li>
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
              <span className="font-bold text-indigo-300 text-sm">Step 3: Holdings &amp; Covered Calls (HoldingsCoveredCallView)</span>
            </div>
            <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-400">
              Route: WORKFLOW &rarr; HOLDINGS_COVERED_CALLS
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="space-y-1.5">
              <strong className="text-white block font-semibold">⚙️ Automated System Calculations:</strong>
              <ul className="text-slate-300 space-y-1 list-disc list-inside">
                <li><strong>Multi-Leg Pairing:</strong> Pairs 7 equity holdings (AXTI, BLZE, IONQ, LUNR, NET, RTX, TSLA) with active covered calls and real-time Mkt Prices.</li>
                <li><strong>Dynamic Expiration Engine:</strong> Evaluates option expiration dates deterministically; expired options display a clean &quot;Expired (Date)&quot; status badge.</li>
                <li><strong>80% Profit Triggers:</strong> Flags profitable active covered calls that have captured &ge;80% of max premium (excluding expired contracts) to eliminate gamma tail risk.</li>
                <li><strong>Uncovered Block Detection:</strong> Identifies unhedged 100-share blocks and calculates 20&Delta; strike suggestions anchored above resistance.</li>
              </ul>
            </div>

            <div className="space-y-1.5 bg-slate-900/60 p-3 rounded-lg border border-slate-800">
              <strong className="text-amber-300 block font-semibold">👤 Manual Intervention Required by User:</strong>
              <ol className="text-slate-300 space-y-1 list-decimal list-inside">
                <li><strong>Check Profit Triggers:</strong> Review active positions highlighted in emerald (&ge;80% profit). Click <strong>&quot;Stage BTC Order&quot;</strong> to buy-to-close or roll out and up.</li>
                <li><strong>Write Covered Calls:</strong> On any unhedged shares, review the recommended 20&Delta; strikes and click <strong>&quot;1-Click Stage CC&quot;</strong> to send to the broker workbench.</li>
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
