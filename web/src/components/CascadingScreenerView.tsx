import React, { useState, useMemo } from 'react';
import {
  OptionOpportunity,
  TickerMeta,
  AccountCapitalState,
  MultiLegSpread,
} from '../types/options';
import { getStoredCapitalState } from '../utils/capitalAndTaxLedger';
import {
  ShieldCheck,
  TrendingUp,
  DollarSign,
  Flame,
  BrainCircuit,
  Sliders,
  Copy,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Zap,
  ArrowUpDown,
  Filter,
  RefreshCw,
  Award,
} from './icons';

interface CascadingScreenerViewProps {
  tickers: TickerMeta[];
  allOpportunities: OptionOpportunity[];
  onStageOpportunity?: (opp: OptionOpportunity) => void;
  onSelectSymbolForChart?: (symbol: string) => void;
}

export const CascadingScreenerView: React.FC<CascadingScreenerViewProps> = ({
  tickers,
  allOpportunities,
  onStageOpportunity,
  onSelectSymbolForChart,
}) => {
  // 1. Capital State from ledger
  const capitalState = useMemo(() => {
    return getStoredCapitalState();
  }, []);

  // Strategy Mode: CSP vs CC
  const [strategyMode, setStrategyMode] = useState<'CSP' | 'CC'>('CSP');

  // Funnel Stage Controls
  const [minBarchartScore, setMinBarchartScore] = useState<number>(70); // 70% or 80% Buy
  const [onlyTop1Pct, setOnlyTop1Pct] = useState<boolean>(false);
  const [onlyMcUptrend, setOnlyMcUptrend] = useState<boolean>(false);
  const [minIvRank, setMinIvRank] = useState<number>(35);
  const [strictDeltaRange, setStrictDeltaRange] = useState<boolean>(true); // 0.15 to 0.25
  const [minDelta, setMinDelta] = useState<number>(0.15);
  const [maxDelta, setMaxDelta] = useState<number>(0.25);
  const [onlyWithinCashBudget, setOnlyWithinCashBudget] = useState<boolean>(true);
  const [maxPositionCollateral, setMaxPositionCollateral] = useState<number>(
    capitalState.maxPerPositionAllocation || 15000
  );
  const [excludeEarnings14d, setExcludeEarnings14d] = useState<boolean>(true);

  // Thinkorswim (TOS) Custom Watchlist Input
  const [tosTickersInput, setTosTickersInput] = useState<string>('');
  const [isTosInputOpen, setIsTosInputOpen] = useState<boolean>(false);

  // Sorting
  const [sortBy, setSortBy] = useState<keyof OptionOpportunity | 'annualized_roc'>('annualized_roc');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // AI Extended Thinking Modal State
  const [isAiModalOpen, setIsAiModalOpen] = useState<boolean>(false);
  const [copiedPrompt, setCopiedPrompt] = useState<boolean>(false);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<string>('');
  const [importedBriefing, setImportedBriefing] = useState<string>('');

  // Parse custom TOS tickers
  const tosSymbols = useMemo(() => {
    if (!tosTickersInput.trim()) return [];
    return tosTickersInput
      .toUpperCase()
      .split(/[\s,;\n]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && s.length <= 6);
  }, [tosTickersInput]);

  // Stage 1: Filter Underlying Quality (Barchart + MC + TOS)
  const stage1Tickers = useMemo(() => {
    return tickers.filter((t) => {
      // If user provided custom TOS tickers, prioritize them or match
      if (tosSymbols.length > 0 && !tosSymbols.includes(t.symbol)) {
        return false;
      }

      // Earnings check
      if (excludeEarnings14d && t.earnings_within_7d) {
        return false;
      }

      // Barchart technical opinion
      if (t.barchart_opinion) {
        if (t.barchart_opinion.opinion_pct < minBarchartScore) return false;
        if (onlyTop1Pct && !t.barchart_opinion.is_top_1_pct) return false;
      }

      // MarketChameleon Pattern
      if (onlyMcUptrend && t.market_chameleon) {
        if (t.market_chameleon.primary_trend !== 'Uptrend') return false;
      }

      return true;
    });
  }, [tickers, tosSymbols, excludeEarnings14d, minBarchartScore, onlyTop1Pct, onlyMcUptrend]);

  // Stage 2 & 3 & 4: Cascading Opportunities Filter
  const finalCandidates = useMemo(() => {
    const stage1Symbols = new Set(stage1Tickers.map((t) => t.symbol));

    const opps = allOpportunities.filter((o) => {
      // Must match strategy
      if (o.strategy !== strategyMode) return false;

      // Must be from Stage 1 approved underlying symbols
      if (!stage1Symbols.has(o.symbol)) return false;

      // Stage 2: IV Rank
      if (minIvRank > 0 && o.iv_rank < minIvRank) return false;

      // Stage 3: Strict 15Δ – 25Δ Delta Sweet Spot
      const absDelta = Math.abs(o.delta || o.abs_delta || 0.20);
      if (strictDeltaRange) {
        if (absDelta < minDelta || absDelta > maxDelta) return false;
      }

      // Stage 4: Cash Budget / Collateral Gate (e.g. <= $15,000 per position)
      if (strategyMode === 'CSP' && onlyWithinCashBudget) {
        const collateral = o.collateral_required || o.strike * 100;
        if (collateral > maxPositionCollateral) return false;
        // Also must not exceed overall free cash available
        if (capitalState.freeCash > 0 && collateral > capitalState.freeCash) return false;
      }

      return true;
    });

    // Apply Sorting
    return opps.sort((a, b) => {
      const aVal = (a as any)[sortBy] ?? 0;
      const bVal = (b as any)[sortBy] ?? 0;
      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [
    allOpportunities,
    strategyMode,
    stage1Tickers,
    minIvRank,
    strictDeltaRange,
    minDelta,
    maxDelta,
    onlyWithinCashBudget,
    maxPositionCollateral,
    capitalState.freeCash,
    sortBy,
    sortOrder,
  ]);

  // Sizing: Calculate how many candidates can be funded with free cash
  const maxAffordablePositions = useMemo(() => {
    if (capitalState.freeCash <= 0 || maxPositionCollateral <= 0) return 0;
    return Math.min(5, Math.floor(capitalState.freeCash / maxPositionCollateral));
  }, [capitalState.freeCash, maxPositionCollateral]);

  // Construct Detailed Gemini Extended Thinking Prompt
  const generateGeminiThinkingPrompt = () => {
    const candidateList = finalCandidates.slice(0, 15).map((c, i) => {
      const tMeta = tickers.find((t) => t.symbol === c.symbol);
      const barchartText = tMeta?.barchart_opinion
        ? `${tMeta.barchart_opinion.opinion_pct}% Buy (${tMeta.barchart_opinion.signal_strength}${tMeta.barchart_opinion.is_top_1_pct ? ', Top 1%' : ''})`
        : 'N/A';
      const mcText = tMeta?.market_chameleon ? tMeta.market_chameleon.primary_trend : 'N/A';

      return `${i + 1}. **${c.symbol}** (${c.name || c.symbol}) - Spot: $${c.current_price.toFixed(2)}
   - Strike: $${c.strike.toFixed(2)} (${c.cushion_pct.toFixed(1)}% cushion below spot)
   - Delta: ${c.delta.toFixed(2)} | POP: ${c.pop_pct.toFixed(0)}%
   - Expiration: ${c.expiration} (${c.dte} DTE)
   - Mid Premium: $${c.mid.toFixed(2)} ($${c.premium_total} cash per contract)
   - Cash Collateral Required: $${c.collateral_required.toLocaleString()}
   - Annualized ROC: ${c.annualized_roc.toFixed(1)}%
   - IV Rank: ${c.iv_rank}% | 14-Day RSI: ${c.rsi.toFixed(0)}
   - Barchart Directional Signal: ${barchartText}
   - MarketChameleon Primary Trend: ${mcText}
   - Next Earnings: ${c.next_earnings_date || 'No upcoming earnings in 14d'}`;
    }).join('\n\n');

    return `### Institutional Weekly Options Income Selection Request (Extended Thinking Evaluation)

**Role:** Senior Derivatives Risk Officer and Systematic Options Portfolio Manager.
**Trading Strategy:** Weekly Cash-Secured Put (CSP) and Covered Call (CC) Writing.
**Capital Constraints:**
- Total Liquid Cash Balance: $${capitalState.totalCash.toLocaleString()}
- Cash Collateral Committed to Open CSPs: $${capitalState.committedCollateral.toLocaleString()}
- **Free Cash Available to Deploy (Non-Margin): $${capitalState.freeCash.toLocaleString()}**
- **Maximum Target Allocation per Position: $${maxPositionCollateral.toLocaleString()}** (Strict non-margin 100% cash-secured rule)
- **Desired Output Selection: Exactly 1 to ${Math.max(1, Math.min(5, maxAffordablePositions))} Top-Conviction Candidates** that can be fully funded without exceeding available cash.

**Target Mandate & Risk Parameters:**
1. **Delta Sweet Spot:** Short strikes strictly positioned in the **0.15 to 0.25 Delta range** (~75% to 85% probability of expiring OTM).
2. **Technical Support Anchor:** Short put strike must be positioned below key technical support / lower 2-SD Bollinger Band envelope.
3. **Volatility & Extrinsic Harvest:** Favor elevated IV Rank with strong time decay (Theta) and positive directional momentum.
4. **Binary Event Shield:** Completely avoid entering new positions with earnings announcements occurring within the holding period (unless cushion exceeds expected move by > 2.5x).

---

### Screened Multi-Source Candidate Pool (Barchart + MarketChameleon + Thinkorswim Technicals):

${candidateList || 'No candidates currently meeting preliminary filters.'}

---

### Required Deliverables:
Please utilize your deep **Extended Thinking** to evaluate the macro environment, underlying fundamentals, support levels, and volatility dynamics, then provide:
1. **Top 1 to ${Math.max(1, Math.min(5, maxAffordablePositions))} High-Conviction Put Option Recommendations** (strictly fitting within the $${maxPositionCollateral.toLocaleString()} collateral limit and $${capitalState.freeCash.toLocaleString()} total cash budget).
2. **Detailed Trade Setup per Selected Ticker:**
   - Exact Ticker, Strike, Expiration Date.
   - Exact cash collateral required and contract quantity to write.
   - Break-even price and downside cushion percentage.
   - Specific rationale: Why Barchart direction strength + MarketChameleon pattern validates this security over others.
3. **Risk Management & Defense Playbook:**
   - Pre-determined exit threshold (80% profit-taking limit price).
   - Defensive roll contingency: Exact lower strike and later expiration to roll if spot drops within 2% of strike.`;
  };

  const handleCopyPrompt = () => {
    const prompt = generateGeminiThinkingPrompt();
    navigator.clipboard.writeText(prompt);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Strategy Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2.5">
            <Filter className="w-6 h-6 text-emerald-400" />
            <span>Cascading Options Screener (15Δ–25Δ &amp; Cash Budget Gate)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Multi-stage funnel: Technical Quality &rarr; IV Rank &rarr; 15Δ–25Δ Sweet Spot &rarr; $15k/pos Available Cash Gate &rarr; Gemini Extended Thinking Selection.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* Strategy Toggle */}
          <div className="inline-flex p-1 bg-slate-900 rounded-xl border border-slate-800 shadow-inner">
            <button
              onClick={() => setStrategyMode('CSP')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                strategyMode === 'CSP'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Cash-Secured Puts (CSPs)
            </button>
            <button
              onClick={() => setStrategyMode('CC')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                strategyMode === 'CC'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Covered Calls (CCs)
            </button>
          </div>

          {/* AI Extended Thinking Button */}
          <button
            onClick={() => setIsAiModalOpen(true)}
            className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white shadow-lg shadow-amber-600/30 flex items-center space-x-2 transition-all cursor-pointer"
          >
            <BrainCircuit className="w-4 h-4 text-amber-200" />
            <span>AI Extended Thinking Sizing</span>
            <span className="px-1.5 py-0.2 rounded bg-black/20 text-[10px] font-mono">$0 Cost</span>
          </button>
        </div>
      </div>

      {/* 2. Interactive Visual Cascading Funnel Banner */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 shadow-xl bg-slate-950/80 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
            <Layers className="w-4 h-4 text-emerald-400" />
            <span>Cascading Screening Funnel Pipeline</span>
          </span>
          <span className="text-xs text-slate-400 font-mono">
            {finalCandidates.length} Opportunities Qualified (from {tickers.length} Universe Assets)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Funnel Stage 1 */}
          <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800/90 space-y-1.5 relative overflow-hidden">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="font-bold text-slate-300">Stage 1: Technical Quality</span>
              <span className="font-mono text-white font-bold">{stage1Tickers.length} pass</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-tight">
              Barchart &ge; {minBarchartScore}% Buy • MC Trend • Exclude Earnings &le; 14d
            </p>
            <div className="flex items-center space-x-2 pt-1 text-[10px]">
              <button
                onClick={() => setOnlyTop1Pct(!onlyTop1Pct)}
                className={`px-1.5 py-0.5 rounded border transition-colors ${
                  onlyTop1Pct ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold' : 'text-slate-500 border-slate-800'
                }`}
              >
                Top 1% Only
              </button>
              <button
                onClick={() => setIsTosInputOpen(!isTosInputOpen)}
                className={`px-1.5 py-0.5 rounded border transition-colors ${
                  tosSymbols.length > 0 ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-bold' : 'text-slate-500 border-slate-800'
                }`}
              >
                TOS Import {tosSymbols.length > 0 ? `(${tosSymbols.length})` : ''}
              </button>
            </div>
          </div>

          {/* Funnel Stage 2 */}
          <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800/90 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="font-bold text-slate-300">Stage 2: Volatility Harvest</span>
              <span className="font-mono text-white font-bold">IVR &ge; {minIvRank}%</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-tight">
              Ensures extrinsic premium capture and favorable volatility contraction.
            </p>
            <div className="flex items-center space-x-1.5 pt-1 text-[10px]">
              {[0, 30, 40, 50].map((val) => (
                <button
                  key={val}
                  onClick={() => setMinIvRank(val)}
                  className={`px-1.5 py-0.5 rounded border ${
                    minIvRank === val
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold'
                      : 'text-slate-500 border-slate-800'
                  }`}
                >
                  {val === 0 ? 'Off' : `${val}%+`}
                </button>
              ))}
            </div>
          </div>

          {/* Funnel Stage 3 */}
          <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-emerald-400">
              <span className="font-bold">Stage 3: Delta Sweet Spot</span>
              <span className="font-mono text-emerald-300 font-bold">
                {minDelta.toFixed(2)}–{maxDelta.toFixed(2)}Δ
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-tight">
              Strictly outside 2-SD Bollinger Band support (75%–85% POP).
            </p>
            <div className="flex items-center space-x-2 pt-1 text-[10px] text-slate-400 font-mono">
              <span>POP: 75%–85%</span>
              <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold">
                Sweet Spot Active
              </span>
            </div>
          </div>

          {/* Funnel Stage 4 */}
          <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800/90 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="font-bold text-slate-300">Stage 4: Capital Gate</span>
              <span className="font-mono text-amber-400 font-bold">
                &le; ${maxPositionCollateral.toLocaleString()}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-tight">
              100% Cash-Secured (Zero Margin). Free Cash: ${capitalState.freeCash.toLocaleString()}.
            </p>
            <div className="flex items-center justify-between pt-1 text-[10px]">
              <label className="flex items-center space-x-1 cursor-pointer text-slate-300">
                <input
                  type="checkbox"
                  checked={onlyWithinCashBudget}
                  onChange={(e) => setOnlyWithinCashBudget(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-700 text-emerald-500"
                />
                <span>Within Cash Budget</span>
              </label>
              <span className="font-mono font-bold text-emerald-400">
                {maxAffordablePositions} positions affordable
              </span>
            </div>
          </div>
        </div>

        {/* Thinkorswim Ticker Importer Collapse */}
        {isTosInputOpen && (
          <div className="p-3 rounded-xl bg-slate-900 border border-cyan-500/30 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-cyan-300 flex items-center space-x-1.5">
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Thinkorswim (TOS) Watchlist Import</span>
              </span>
              <button
                onClick={() => setTosTickersInput('')}
                className="text-slate-400 hover:text-white text-[11px]"
              >
                Clear
              </button>
            </div>
            <textarea
              rows={2}
              value={tosTickersInput}
              onChange={(e) => setTosTickersInput(e.target.value)}
              placeholder="Paste comma or space-separated symbols from Thinkorswim (e.g. AAPL, NVDA, MSFT, AMD, GOOGL)..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
            />
            <p className="text-[11px] text-slate-400">
              Symbols will be matched against Barchart opinions and filtered through the 15Δ–25Δ cash-budget funnel.
            </p>
          </div>
        )}
      </div>

      {/* 3. Candidates Results Table */}
      <div className="glass-panel rounded-2xl border border-slate-800/90 shadow-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center space-x-2">
            <Award className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">
              Screened {strategyMode === 'CSP' ? 'Cash-Secured Put' : 'Covered Call'} Candidates ({finalCandidates.length})
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {maxAffordablePositions > 0 ? (
              <span>
                Free Cash allows writing <strong className="text-emerald-400 font-bold">{maxAffordablePositions} positions</strong> ($15k each)
              </span>
            ) : (
              <span className="text-amber-400">Deployable cash reached limit</span>
            )}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/90 text-[11px] font-semibold text-slate-400 uppercase tracking-wider select-none">
                <th
                  onClick={() => {
                    setSortBy('symbol');
                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                  }}
                  className="py-3 px-4 cursor-pointer hover:text-white"
                >
                  Ticker / Asset
                </th>
                <th className="py-3 px-3">Barchart / MC Quality</th>
                <th
                  onClick={() => {
                    setSortBy('current_price');
                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                  }}
                  className="py-3 px-3 cursor-pointer hover:text-white"
                >
                  Spot Price
                </th>
                <th
                  onClick={() => {
                    setSortBy('strike');
                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                  }}
                  className="py-3 px-3 cursor-pointer hover:text-white"
                >
                  Strike (Cushion)
                </th>
                <th className="py-3 px-3">DTE (Exp)</th>
                <th
                  onClick={() => {
                    setSortBy('abs_delta');
                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                  }}
                  className="py-3 px-3 cursor-pointer hover:text-white"
                >
                  Delta (POP)
                </th>
                <th className="py-3 px-3">Premium (Cash)</th>
                <th className="py-3 px-3">Collateral</th>
                <th
                  onClick={() => {
                    setSortBy('annualized_roc');
                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                  }}
                  className="py-3 px-3 cursor-pointer hover:text-white text-right"
                >
                  Annualized ROC
                </th>
                <th className="py-3 px-3 text-center">Affordable</th>
                <th className="py-3 px-4 text-center">Stage Order</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800/60">
              {finalCandidates.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400">
                    <div className="max-w-md mx-auto space-y-2">
                      <p className="text-sm font-medium text-slate-300">
                        No candidates match your cascading funnel criteria.
                      </p>
                      <p className="text-xs text-slate-500">
                        Try lowering the minimum Barchart score, adjusting IV Rank, or increasing the collateral budget.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                finalCandidates.map((opp, idx) => {
                  const tMeta = tickers.find((t) => t.symbol === opp.symbol);
                  const barchart = tMeta?.barchart_opinion;
                  const affordableContracts = Math.floor(
                    (capitalState.freeCash || 0) / (opp.collateral_required || opp.strike * 100)
                  );

                  return (
                    <tr key={opp.id || idx} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => onSelectSymbolForChart && onSelectSymbolForChart(opp.symbol)}
                            className="font-bold text-white text-sm hover:text-blue-400 transition-colors"
                          >
                            {opp.symbol}
                          </button>
                          {barchart?.is_top_1_pct && (
                            <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              Top 1%
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 block truncate max-w-[140px]">
                          {opp.name || opp.category}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        {barchart ? (
                          <div>
                            <span className="text-emerald-400 font-bold font-mono">
                              {barchart.opinion_pct}% Buy
                            </span>
                            <span className="text-[10px] text-slate-400 block">
                              {barchart.signal_strength}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-500 text-[10px]">Tier 1 Validated</span>
                        )}
                      </td>

                      <td className="py-3 px-3 font-mono text-slate-200">
                        ${opp.current_price.toFixed(2)}
                      </td>

                      <td className="py-3 px-3 font-mono">
                        <div>
                          <span className="text-white font-bold">${opp.strike.toFixed(2)}</span>
                          <span className="text-[10px] text-emerald-400 block font-semibold">
                            +{opp.cushion_pct.toFixed(1)}% cushion
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-3 font-mono text-slate-300">
                        <div>
                          <span>{opp.dte}d</span>
                          <span className="text-[10px] text-slate-500 block">{opp.expiration}</span>
                        </div>
                      </td>

                      <td className="py-3 px-3 font-mono">
                        <div>
                          <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                            {opp.delta.toFixed(2)}Δ
                          </span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            {opp.pop_pct.toFixed(0)}% POP
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-3 font-mono">
                        <span className="text-white font-bold">${opp.mid.toFixed(2)}</span>
                        <span className="text-[10px] text-emerald-400 block">
                          +${opp.premium_total} cash
                        </span>
                      </td>

                      <td className="py-3 px-3 font-mono">
                        <span
                          className={`font-semibold ${
                            opp.collateral_required <= maxPositionCollateral
                              ? 'text-slate-200'
                              : 'text-amber-400'
                          }`}
                        >
                          ${opp.collateral_required.toLocaleString()}
                        </span>
                      </td>

                      <td className="py-3 px-3 font-mono text-right">
                        <span className="text-emerald-400 font-bold text-sm">
                          +{opp.annualized_roc.toFixed(1)}%
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          {opp.roc_pct.toFixed(1)}% flat
                        </span>
                      </td>

                      <td className="py-3 px-3 text-center font-mono">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            affordableContracts > 0
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : 'bg-slate-800 text-slate-500'
                          }`}
                        >
                          {affordableContracts > 0 ? `${affordableContracts} cts` : '0 cts'}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => onStageOpportunity && onStageOpportunity(opp)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/30 flex items-center space-x-1 mx-auto transition-colors"
                        >
                          <Zap className="w-3 h-3" />
                          <span>Stage</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. MODAL: Gemini Extended Thinking Prompt Bridge ($0 Cost) */}
      {isAiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 max-w-3xl w-full shadow-2xl space-y-4 bg-slate-950 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2.5">
                <BrainCircuit className="w-6 h-6 text-amber-400" />
                <div>
                  <h3 className="text-base font-bold text-white">
                    Gemini Extended Thinking Macro &amp; Candidate Evaluator
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Evaluates multi-source candidates (Barchart + MarketChameleon + Thinkorswim) to pick 1 to 5 top put-writing ideas constrained to ${maxPositionCollateral.toLocaleString()}/pos.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAiModalOpen(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ×
              </button>
            </div>

            {/* Step-by-Step Instructions */}
            <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/30 text-xs text-amber-200 space-y-1">
              <span className="font-bold block">💡 How to use with your Gemini Pro / Advanced Subscription ($0 Cost):</span>
              <ol className="list-decimal list-inside space-y-0.5 text-slate-300 text-[11px]">
                <li>Click <strong>"1-Click Copy Prompt"</strong> below.</li>
                <li>Open <strong>gemini.google.com</strong> and select your extended thinking model.</li>
                <li>Paste the prompt &amp; hit enter. Gemini will reason through support, volatility, and pick the top 1–5 trades.</li>
                <li>Optionally paste Gemini's trade recommendation back here for quick reference!</li>
              </ol>
            </div>

            {/* Generated Prompt Preview */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300">Generated Institutional Prompt</span>
                <span className="text-[11px] text-slate-500 font-mono">
                  {finalCandidates.length} candidate contracts pre-formatted
                </span>
              </div>
              <div className="relative">
                <textarea
                  readOnly
                  rows={8}
                  value={generateGeminiThinkingPrompt()}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white font-mono text-[11px] leading-relaxed select-all focus:outline-none"
                />
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800">
              <a
                href="https://gemini.google.com"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-amber-400 hover:text-amber-300 flex items-center space-x-1.5 font-semibold"
              >
                <span>Open gemini.google.com</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <div className="flex items-center space-x-2">
                <button
                  onClick={handleCopyPrompt}
                  className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all ${
                    copiedPrompt
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                      : 'bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-600/30'
                  }`}
                >
                  {copiedPrompt ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Copied to Clipboard!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>1-Click Copy Prompt</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Optional Import Section */}
            <div className="pt-3 border-t border-slate-800/80 space-y-2">
              <span className="text-xs font-semibold text-slate-300 block">
                Paste Gemini's Selected Recommendations (Optional)
              </span>
              <textarea
                rows={4}
                value={importedBriefing}
                onChange={(e) => setImportedBriefing(e.target.value)}
                placeholder="Paste Gemini's response here to archive it with this week's trading plan..."
                className="w-full bg-slate-900/80 border border-slate-800 rounded-xl p-3 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
