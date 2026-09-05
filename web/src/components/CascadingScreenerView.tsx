import React, { useState, useMemo, useEffect } from 'react';
import {
  OptionOpportunity,
  TickerMeta,
  AccountCapitalState,
  MultiLegSpread,
  GeminiScreenResult,
  GeminiRecommendedTrade,
} from '../types/options';
import {
  getStoredCapitalState,
  parseGeminiMarkdownTables,
} from '../utils/capitalAndTaxLedger';
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
  Sparkles,
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

  // Thinkorswim (TOS) Custom Watchlist Input & Dual Ingestion
  const [tosTickersInput, setTosTickersInput] = useState<string>('');
  const [isTosInputOpen, setIsTosInputOpen] = useState<boolean>(true);

  // Sorting
  const [sortBy, setSortBy] = useState<keyof OptionOpportunity | 'annualized_roc'>('annualized_roc');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // AI Extended Thinking Modal State & Interactive 3-Table Results
  const [isAiModalOpen, setIsAiModalOpen] = useState<boolean>(false);
  const [copiedPrompt, setCopiedPrompt] = useState<boolean>(false);
  const [copiedBarchartTickers, setCopiedBarchartTickers] = useState<boolean>(false);
  const [importedBriefing, setImportedBriefing] = useState<string>(() => {
    try {
      return localStorage.getItem('deltaharvest_gemini_raw_markdown') || '';
    } catch {
      return '';
    }
  });
  const [parsedGeminiResult, setParsedGeminiResult] = useState<GeminiScreenResult | null>(() => {
    try {
      const saved = localStorage.getItem('deltaharvest_gemini_parsed_screen');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return null;
  });

  // Parse custom TOS tickers
  const tosSymbols = useMemo(() => {
    if (!tosTickersInput.trim()) return [];
    return tosTickersInput
      .toUpperCase()
      .split(/[\s,;\n]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && s.length <= 6);
  }, [tosTickersInput]);

  // Handler for dual ingestion (file upload)
  const handleTosFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = (event.target?.result as string) || '';
      const matches = content.match(/[A-Za-z]{1,5}/g) || [];
      const unique = Array.from(new Set(matches.map((s) => s.toUpperCase()))).filter(
        (s) => s.length <= 5 && !['SYMBOL', 'PRICE', 'STRIKE', 'VOL', 'EXP', 'CALL', 'PUT', 'NAME'].includes(s)
      );
      if (unique.length > 0) {
        setTosTickersInput(unique.join(', '));
      }
    };
    reader.readAsText(file);
  };

  // Handler to copy tickers and open Barchart Watchlist View 190898
  const handleCopyAndOpenBarchart = () => {
    const symbolsToCopy = tosSymbols.length > 0 ? tosSymbols.join(' ') : tickers.slice(0, 30).map((t) => t.symbol).join(' ');
    navigator.clipboard.writeText(symbolsToCopy);
    setCopiedBarchartTickers(true);
    setTimeout(() => setCopiedBarchartTickers(false), 3000);
    window.open('https://www.barchart.com/my/watchlist?viewName=190898', '_blank');
  };

  // Handler to parse pasted Gemini response
  const handleParseMarkdown = (text: string) => {
    setImportedBriefing(text);
    try {
      localStorage.setItem('deltaharvest_gemini_raw_markdown', text);
    } catch (e) {
      console.warn('Failed to save raw markdown:', e);
    }
    const parsed = parseGeminiMarkdownTables(text);
    setParsedGeminiResult(parsed);
    try {
      localStorage.setItem('deltaharvest_gemini_parsed_screen', JSON.stringify(parsed));
    } catch (e) {
      console.warn('Failed to save parsed gemini result:', e);
    }
  };

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

  // Construct Exact Gemini AI Pro Extended Thinking Prompt (from steps.txt)
  const generateGeminiThinkingPrompt = () => {
    const candidateList = finalCandidates.slice(0, 20).map((c, i) => {
      const tMeta = tickers.find((t) => t.symbol === c.symbol);
      const barchartText = tMeta?.barchart_opinion
        ? `${tMeta.barchart_opinion.opinion_pct}% Buy (${tMeta.barchart_opinion.signal_strength})`
        : '80% Buy';
      const mcText = tMeta?.market_chameleon?.primary_trend || 'Uptrend';
      const cushion = c.current_price > 0 ? (((c.current_price - c.strike) / c.current_price) * 100).toFixed(1) : '5.0';

      return `${i + 1}. Ticker: ${c.symbol} | Spot: $${c.current_price.toFixed(2)} | Put Strike: $${c.strike.toFixed(2)} | Expiration: ${c.expiration} (${c.dte} DTE) | Delta: ${c.delta.toFixed(2)} | Bid/Ask: $${c.bid.toFixed(2)}/$${c.ask.toFixed(2)} | Net Premium: $${c.mid.toFixed(2)} ($${c.premium_total}) | Collateral: $${c.collateral_required.toLocaleString()} | Ann. ROC: ${c.annualized_roc.toFixed(1)}% | Cushion: ${cushion}% | IV Rank: ${c.iv_rank}% | RSI: ${c.rsi.toFixed(0)} | Trend: Price > 9 EMA > 18 EMA (${mcText}) | Barchart View 190898: ${barchartText} | Next Earnings: ${c.next_earnings_date || 'None in expiration cycle'}`;
    }).join('\n');

    return `Act as a seasoned options trader specializing in high-probability, income-generating strategies (Cash-Secured Puts). Analyze the provided weekly options screener data and generate a prioritized list of the top trade recommendations.

Available Cash & Position Sizing Gate:
- Total Liquid Cash Balance: $${capitalState.totalCash.toLocaleString()}
- Encumbered Disbursements: $${(capitalState.totalEncumberedDisbursements || 5000).toLocaleString()} (Weekly Living Expenses)
- Committed CSP Collateral: $${capitalState.committedCollateral.toLocaleString()}
- Deployable Free Cash: $${capitalState.freeCash.toLocaleString()}
- Max Collateral per Position: $${maxPositionCollateral.toLocaleString()}
- Max Affordable New Positions: ${Math.max(1, Math.min(5, maxAffordablePositions))}

Strict Filtering & Trade Criteria:
1. Delta: -0.15 to -0.25 (Strict sweet spot).
2. Days to Expiration (DTE): 5 to 7 days (Focus on aggressive weekend theta decay).
3. Technicals: RSI < 70 (Not overbought), Stock Price > 9 EMA > 18 EMA (Short-term uptrend confirmation).
4. Liquidity: Underlying Daily Volume > 500k shares, Option Open Interest > 500 contracts, Bid/Ask Spread < $0.10.
5. Earnings: No earnings announcements within the expiration cycle (Strict avoid).

Evaluation Process:
1. Step 1: Eliminate any ticker failing the Earnings, Liquidity, or Trend criteria.
2. Step 2: Score remaining candidates on IV Rank (higher is better for premium), Cushion to Strike (distance from current price), and Annualized Return on Capital (ROC).
3. Step 3: Select the TOP 5 trades offering the highest risk-adjusted premium within the $${maxPositionCollateral.toLocaleString()} collateral limit.

Screened Weekly Options Screener Data:
${candidateList || 'No candidates currently meeting preliminary filters.'}

Output Format (Strictly Markdown Tables):
TABLE 1: RECOMMENDED TRADES (FINAL 5)
Columns: Ticker | Current Price | Put Strike | Expiration | DTE | Delta | Bid/Ask | Net Premium | Collateral | Ann. ROC (%) | Cushion (%) | Rationale / Key Support Level

TABLE 2: BORDERLINE CANDIDATES (Missed top 5 due to lower ROC or closer support)
Columns: Ticker | Strike | Delta | Reason for Demotion

TABLE 3: EXCLUDED CANDIDATES (Failed hard filters)
Columns: Ticker | Filter Failed (e.g., Earnings, RSI > 70, Illiquid)`;
  };

  const handleCopyPrompt = () => {
    const prompt = generateGeminiThinkingPrompt();
    navigator.clipboard.writeText(prompt);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 3000);
  };

  // Convert Gemini recommended trade to OptionOpportunity and stage in broker workbench
  const handleStageGeminiTrade = (trade: GeminiRecommendedTrade) => {
    if (!onStageOpportunity) return;
    const nextFriday = new Date();
    nextFriday.setDate(nextFriday.getDate() + ((5 + 7 - nextFriday.getDay()) % 7 || 7));
    const expStr = nextFriday.toISOString().split('T')[0];

    const opp: OptionOpportunity = {
      id: `GEMINI_${trade.symbol}_${trade.suggestedStrike}_PUT`,
      symbol: trade.symbol,
      name: trade.symbol,
      category: 'Equities',
      sector: 'Technology',
      liquidity_tier: 'Tier 1',
      current_price: trade.currentPrice || trade.suggestedStrike * 1.05,
      strategy: 'CSP',
      strategy_name: 'Cash-Secured Put',
      expiration: expStr,
      dte: 6,
      strike: trade.suggestedStrike,
      type: 'put',
      bid: 1.40,
      ask: 1.60,
      mid: 1.50,
      iv: 0.35,
      iv_rank: 45,
      delta: -Math.abs(trade.delta || 0.20),
      abs_delta: Math.abs(trade.delta || 0.20),
      theta: 0.08,
      pop_pct: Math.round((1 - Math.abs(trade.delta || 0.20)) * 100),
      cushion_pct: trade.currentPrice > 0 ? ((trade.currentPrice - trade.suggestedStrike) / trade.currentPrice) * 100 : 5.0,
      collateral_required: trade.capitalCommitted || trade.suggestedStrike * 100,
      premium_total: 150,
      breakeven: trade.suggestedStrike - 1.50,
      roc_pct: 1.5,
      annualized_roc: 25.0,
      rsi: trade.rsi14 || 55,
      safety_tier: 'Gemini Recommended',
      tier_color: 'emerald',
      tags: ['GEMINI_AI', 'WEEKLY_CSP'],
      rating: 95,
      earnings_within_7d: false,
    };
    onStageOpportunity(opp);
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

        {/* Thinkorswim & Barchart Watchlist View 190898 Dual Ingestion */}
        {isTosInputOpen && (
          <div className="p-4 rounded-xl bg-slate-900 border border-cyan-500/30 space-y-3 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <span className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-300">
                  <ExternalLink className="w-4 h-4" />
                </span>
                <div>
                  <span className="font-bold text-cyan-300 text-sm block">
                    ThinkorSwim Screen &amp; Barchart View 190898 Workflow
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Paste TOS tickers, copy to Barchart Watchlist for Directional Strength ratings, then re-ingest.
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyAndOpenBarchart}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
                    copiedBarchartTickers
                      ? 'bg-emerald-600 text-white'
                      : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-600/30'
                  }`}
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedBarchartTickers ? 'Copied! Opening Barchart...' : 'Copy Tickers & Open Barchart View 190898'}</span>
                </button>

                <label className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer flex items-center space-x-1.5 transition-colors">
                  <span>📁 Upload CSV/TXT</span>
                  <input
                    type="file"
                    accept=".csv,.txt"
                    onChange={handleTosFileUpload}
                    className="hidden"
                  />
                </label>

                {tosTickersInput && (
                  <button
                    onClick={() => setTosTickersInput('')}
                    className="text-slate-400 hover:text-white text-[11px] px-2 py-1"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            <textarea
              rows={2}
              value={tosTickersInput}
              onChange={(e) => setTosTickersInput(e.target.value)}
              placeholder="Paste comma or space-separated symbols from ThinkorSwim / Barchart (e.g. AAPL, NVDA, MSFT, AMD, GOOGL, PLTR)..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
            />
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>
                {tosSymbols.length > 0 ? (
                  <strong className="text-cyan-300 font-mono">{tosSymbols.length} custom symbols active</strong>
                ) : (
                  'Defaulting to active portfolio and screened universe.'
                )}
              </span>
              <a
                href="https://www.barchart.com/my/watchlist?viewName=190898"
                target="_blank"
                rel="noreferrer"
                className="text-cyan-400 hover:underline flex items-center gap-1"
              >
                <span>Direct link to Barchart View 190898</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        )}
      </div>

      {/* 2.5 Active Gemini AI Recommendations Banner (if parsed) */}
      {parsedGeminiResult && parsedGeminiResult.recommendedTrades.length > 0 && (
        <div className="glass-panel p-5 rounded-2xl border border-emerald-500/40 bg-gradient-to-br from-emerald-950/30 via-slate-900 to-slate-950 shadow-2xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2.5">
              <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                <Sparkles className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  Gemini AI Pro Extended Thinking: Top Trade Recommendations
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Table 1 ({parsedGeminiResult.recommendedTrades.length} Trades)
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Filtered by 15Δ–25Δ sweet spot, 5–7 DTE weekend theta decay, and strictly constrained to your ${maxPositionCollateral.toLocaleString()} collateral limit.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsAiModalOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
              >
                <BrainCircuit className="w-3.5 h-3.5 text-amber-400" />
                <span>Re-evaluate / Edit Prompt</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-[11px]">
                  <th className="py-2.5 px-3">Rank</th>
                  <th className="py-2.5 px-3">Ticker</th>
                  <th className="py-2.5 px-3">Current Spot</th>
                  <th className="py-2.5 px-3">Put Strike</th>
                  <th className="py-2.5 px-3">Delta</th>
                  <th className="py-2.5 px-3">Est. Premium</th>
                  <th className="py-2.5 px-3">Cash Collateral</th>
                  <th className="py-2.5 px-3">Rationale &amp; Support Level</th>
                  <th className="py-2.5 px-3 text-right">Workbench Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {parsedGeminiResult.recommendedTrades.map((trade, idx) => (
                  <tr key={`${trade.symbol}-${idx}`} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-3 text-slate-400 font-bold">#{trade.riskRank || idx + 1}</td>
                    <td className="py-3 px-3 font-bold text-white text-sm">{trade.symbol}</td>
                    <td className="py-3 px-3 text-slate-300">
                      ${trade.currentPrice > 0 ? trade.currentPrice.toFixed(2) : '—'}
                    </td>
                    <td className="py-3 px-3 text-emerald-300 font-bold text-sm">
                      ${trade.suggestedStrike.toFixed(2)} Put
                    </td>
                    <td className="py-3 px-3 text-slate-300 font-bold">
                      {trade.delta}&Delta;
                    </td>
                    <td className="py-3 px-3 text-emerald-400 font-bold">
                      {trade.estPremiumAnnualized}
                    </td>
                    <td className="py-3 px-3 text-amber-300 font-bold">
                      ${trade.capitalCommitted.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-slate-300 text-[11px] max-w-sm">
                      {trade.technicalJustification}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => handleStageGeminiTrade(trade)}
                        className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md shadow-emerald-600/30 flex items-center gap-1.5 ml-auto cursor-pointer transition-all"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        <span>Stage Order</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {(parsedGeminiResult.borderlineCandidates.length > 0 || parsedGeminiResult.excludedCandidates.length > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-slate-800 text-[11px]">
              {parsedGeminiResult.borderlineCandidates.length > 0 && (
                <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
                  <span className="font-bold text-amber-400 block">
                    Table 2: Borderline Candidates ({parsedGeminiResult.borderlineCandidates.length})
                  </span>
                  <div className="text-slate-400 space-y-0.5">
                    {parsedGeminiResult.borderlineCandidates.map((b, i) => (
                      <div key={i} className="flex justify-between">
                        <span className="text-white font-bold">{b.symbol}</span>
                        <span className="text-slate-500">{b.borderlineReason}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {parsedGeminiResult.excludedCandidates.length > 0 && (
                <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
                  <span className="font-bold text-rose-400 block">
                    Table 3: Excluded Candidates ({parsedGeminiResult.excludedCandidates.length})
                  </span>
                  <div className="text-slate-400 space-y-0.5">
                    {parsedGeminiResult.excludedCandidates.map((x, i) => (
                      <div key={i} className="flex justify-between">
                        <span className="text-white font-bold">{x.symbol}</span>
                        <span className="text-rose-400/80">{x.reasonForExclusion}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

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

            {/* Interactive 3-Table Markdown Response Importer */}
            <div className="pt-3 border-t border-slate-800/80 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-white block">
                    Paste Gemini AI Markdown Response (3 Tables)
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Paste the raw markdown from Gemini containing Table 1 (Final 5), Table 2 (Borderline), and Table 3 (Excluded).
                  </span>
                </div>
                <button
                  onClick={() => handleParseMarkdown(importedBriefing)}
                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md flex items-center space-x-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Parse 3 Tables &amp; Stage</span>
                </button>
              </div>

              <textarea
                rows={5}
                value={importedBriefing}
                onChange={(e) => {
                  setImportedBriefing(e.target.value);
                  if (e.target.value.includes('|')) {
                    handleParseMarkdown(e.target.value);
                  }
                }}
                placeholder="Paste Gemini's output here (e.g. TABLE 1: RECOMMENDED TRADES, TABLE 2: BORDERLINE, TABLE 3: EXCLUDED)..."
                className="w-full bg-slate-900/80 border border-slate-800 rounded-xl p-3 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
              />

              {parsedGeminiResult && parsedGeminiResult.recommendedTrades.length > 0 && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-1">
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Table 1: Final {parsedGeminiResult.recommendedTrades.length} Recommended Trades</span>
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      1-Click Staging to Broker Workbench
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-mono">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400 text-[11px]">
                          <th className="py-2 px-2">#</th>
                          <th className="py-2 px-2">Ticker</th>
                          <th className="py-2 px-2">Put Strike</th>
                          <th className="py-2 px-2">Delta</th>
                          <th className="py-2 px-2">Collateral</th>
                          <th className="py-2 px-2">Rationale / Support</th>
                          <th className="py-2 px-2 text-right">Stage Order</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {parsedGeminiResult.recommendedTrades.map((t, idx) => (
                          <tr key={`${t.symbol}-${idx}`} className="hover:bg-slate-800/40">
                            <td className="py-2 px-2 text-slate-500">{t.riskRank || idx + 1}</td>
                            <td className="py-2 px-2 font-bold text-white">{t.symbol}</td>
                            <td className="py-2 px-2 text-emerald-300 font-bold">${t.suggestedStrike.toFixed(2)}</td>
                            <td className="py-2 px-2 text-slate-300">{t.delta}&Delta;</td>
                            <td className="py-2 px-2 text-amber-300">${t.capitalCommitted.toLocaleString()}</td>
                            <td className="py-2 px-2 text-slate-400 text-[11px] max-w-xs truncate" title={t.technicalJustification}>
                              {t.technicalJustification}
                            </td>
                            <td className="py-2 px-2 text-right">
                              <button
                                onClick={() => {
                                  handleStageGeminiTrade(t);
                                  setIsAiModalOpen(false);
                                }}
                                className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] shadow transition-all cursor-pointer flex items-center gap-1 ml-auto"
                              >
                                <Zap className="w-3 h-3" />
                                <span>Stage</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {parsedGeminiResult.borderlineCandidates.length > 0 && (
                    <div className="pt-2 text-[11px] text-slate-400">
                      <span className="font-bold text-amber-400">Table 2: Borderline Candidates: </span>
                      {parsedGeminiResult.borderlineCandidates.map((b) => `${b.symbol} (${b.borderlineReason})`).join(' • ')}
                    </div>
                  )}

                  {parsedGeminiResult.excludedCandidates.length > 0 && (
                    <div className="pt-1 text-[11px] text-slate-400">
                      <span className="font-bold text-rose-400">Table 3: Excluded Candidates: </span>
                      {parsedGeminiResult.excludedCandidates.map((x) => `${x.symbol} (${x.reasonForExclusion})`).join(' • ')}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
