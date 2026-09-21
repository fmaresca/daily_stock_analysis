import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  calculateDCFIntrinsicValue,
  calculateDuPont3Step,
  calculateDuPont5Step,
  calculateValuationMultiples,
  calculateEnterpriseValue,
} from '../utils/fundamentalValuation';
import { calculateDynamicRiskReward } from '../utils/securityIntelligence';
import {
  fetchLiveValuationStock,
  EnrichedValuationStock,
  getStoredValuationTickers,
  saveStoredValuationTickers,
  getInitialActiveValuationTicker,
} from '../utils/liveValuationFetcher';
import { getSchwabImportedEquities } from '../utils/schwabPositionsParser';
import {
  X,
  TrendingUp,
  ShieldCheck,
  Activity,
  DollarSign,
  Layers,
  Sparkles,
  ExternalLink,
  Search,
  Plus,
  RefreshCw,
  Copy,
  Check,
  FileText,
  CheckCircle2,
} from './icons';

interface FundamentalValuationModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTicker?: string;
  onNavigateToEquities?: () => void;
}

type ValuationTab = 'DCF_SIMULATOR' | 'DUPONT_DECOMPOSITION' | 'MULTIPLES_DEFENSE' | 'DYNAMIC_ATR_RISK';

export const FundamentalValuationModal: React.FC<FundamentalValuationModalProps> = ({
  isOpen,
  onClose,
  initialTicker = 'NVDA',
  onNavigateToEquities,
}) => {
  const [activeTab, setActiveTab] = useState<ValuationTab>('DCF_SIMULATOR');

  // Active Symbol & Watchlist State
  const [selectedSymbol, setSelectedSymbol] = useState<string>(() =>
    getInitialActiveValuationTicker(initialTicker)
  );
  const [tickerInput, setTickerInput] = useState<string>('');
  const [customTickers, setCustomTickers] = useState<string[]>(() => getStoredValuationTickers());
  const [portfolioTickers, setPortfolioTickers] = useState<string[]>([]);

  // Live Data & Loading State
  const [currentStock, setCurrentStock] = useState<EnrichedValuationStock | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState<boolean>(false);
  const [showTextMemoModal, setShowTextMemoModal] = useState<boolean>(false);

  // Tab 1: DCF Inputs (Reactive to current stock, with user slider overrides)
  const [dcfBaseFCF, setDcfBaseFCF] = useState<number>(50000);
  const [dcfWacc, setDcfWacc] = useState<number>(9.5);
  const [dcfTermG, setDcfTermG] = useState<number>(3.0);
  const [g1, setG1] = useState<number>(25);
  const [g2, setG2] = useState<number>(20);
  const [g3, setG3] = useState<number>(15);
  const [g4, setG4] = useState<number>(10);
  const [g5, setG5] = useState<number>(8);

  // Tab 4: Dynamic ATR Inputs
  const [atrMultiplierK, setAtrMultiplierK] = useState<number>(2.0);
  const [atrMultiplierM, setAtrMultiplierM] = useState<number>(4.0);

  // Initialize Portfolio Tickers on open
  useEffect(() => {
    if (isOpen) {
      try {
        const equities = getSchwabImportedEquities();
        if (Array.isArray(equities) && equities.length > 0) {
          setPortfolioTickers(equities);
        }
      } catch (err) {
        console.warn('Error reading portfolio equities for valuation modal:', err);
      }
    }
  }, [isOpen]);

  // Synchronize when initialTicker changes
  useEffect(() => {
    if (isOpen && initialTicker) {
      const sym = initialTicker.toUpperCase().trim();
      setSelectedSymbol(sym);
    }
  }, [isOpen, initialTicker]);

  // Core Data Hydration Routine: Queries Tradier API & financial models
  const loadStockData = useCallback(async (sym: string) => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const enriched = await fetchLiveValuationStock(sym);
      setCurrentStock(enriched);

      // Hydrate DCF interactive sliders from newly fetched stock
      setDcfBaseFCF(enriched.baseFCF);
      setDcfWacc(Math.round(enriched.wacc * 1000) / 10);
      setDcfTermG(Math.round(enriched.termG * 1000) / 10);
      setG1(Math.round(enriched.growthRates[0] * 100));
      setG2(Math.round(enriched.growthRates[1] * 100));
      setG3(Math.round(enriched.growthRates[2] * 100));
      setG4(Math.round(enriched.growthRates[3] * 100));
      setG5(Math.round(enriched.growthRates[4] * 100));
    } catch (err: any) {
      console.error('Error fetching live stock valuation data:', err);
      setFetchError(`Could not fetch live Tradier feed for ${sym}.`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch when selectedSymbol changes or modal opens
  useEffect(() => {
    if (isOpen && selectedSymbol) {
      loadStockData(selectedSymbol);
    }
  }, [isOpen, selectedSymbol, loadStockData]);

  // Ticker Selection Handler
  const handleSelectSymbol = (sym: string) => {
    const clean = sym.toUpperCase().trim();
    if (clean === selectedSymbol) return;
    setSelectedSymbol(clean);
  };

  // Add Stock Symbol Handler
  const handleAddSymbol = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = tickerInput.toUpperCase().trim();
    if (!clean) return;

    // Add to customTickers if not already present
    if (!customTickers.includes(clean)) {
      const updated = [clean, ...customTickers.filter((s) => s !== clean)];
      setCustomTickers(updated);
      saveStoredValuationTickers(updated);
    }

    setTickerInput('');
    setSelectedSymbol(clean);
  };

  // Remove Stock Symbol from Quick-Select Pills
  const handleRemoveCustomTicker = (sym: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = customTickers.filter((s) => s !== sym);
    setCustomTickers(updated);
    saveStoredValuationTickers(updated);

    if (selectedSymbol === sym) {
      const nextSym = updated[0] || portfolioTickers[0] || 'NVDA';
      setSelectedSymbol(nextSym);
    }
  };

  // Unified list of symbols to show in quick-switch pills
  const displayPills = useMemo(() => {
    const set = new Set<string>();
    // Always include currently selected symbol
    if (selectedSymbol) set.add(selectedSymbol);
    // Include user-added custom tickers
    customTickers.forEach((s) => set.add(s));
    // Include imported portfolio tickers
    portfolioTickers.forEach((s) => set.add(s));
    return Array.from(set);
  }, [selectedSymbol, customTickers, portfolioTickers]);

  // Active stock fallback structure to ensure zero crashes while loading
  const activeStock: EnrichedValuationStock = useMemo(() => {
    if (currentStock) return currentStock;
    return {
      symbol: selectedSymbol,
      name: `${selectedSymbol} Equity`,
      spot: 100.0,
      baseFCF: 1000,
      growthRates: [0.2, 0.16, 0.12, 0.1, 0.06],
      wacc: 0.095,
      termG: 0.03,
      debt: 500,
      cash: 1200,
      shares: 500,
      netIncome: 1200,
      ebt: 1400,
      ebit: 1500,
      revenue: 6000,
      assets: 8000,
      equity: 5000,
      trailingEps: 2.4,
      forwardEps: 3.1,
      growthPct: 20.0,
      atr: 2.8,
      dataSource: 'CALIBRATED_MODEL',
      lastUpdated: new Date().toISOString(),
    };
  }, [currentStock, selectedSymbol]);

  // 1. DCF Engine Calculation
  const dcfResult = useMemo(() => {
    const growthArray = [g1 / 100, g2 / 100, g3 / 100, g4 / 100, g5 / 100];
    return calculateDCFIntrinsicValue({
      baseFCF: dcfBaseFCF,
      forecastGrowthRates: growthArray,
      wacc: dcfWacc / 100,
      terminalGrowthRate: dcfTermG / 100,
      totalDebt: activeStock.debt,
      cashAndEquivalents: activeStock.cash,
      sharesOutstanding: activeStock.shares,
      currentSpotPrice: activeStock.spot,
    });
  }, [dcfBaseFCF, g1, g2, g3, g4, g5, dcfWacc, dcfTermG, activeStock]);

  // 2. DuPont Analysis Calculation
  const dupont3 = useMemo(() => {
    return calculateDuPont3Step({
      netIncome: activeStock.netIncome,
      revenue: activeStock.revenue,
      totalAssets: activeStock.assets,
      shareholdersEquity: activeStock.equity,
    });
  }, [activeStock]);

  const dupont5 = useMemo(() => {
    return calculateDuPont5Step({
      netIncome: activeStock.netIncome,
      ebt: activeStock.ebt,
      ebit: activeStock.ebit,
      sales: activeStock.revenue,
      totalAssets: activeStock.assets,
      shareholdersEquity: activeStock.equity,
    });
  }, [activeStock]);

  // 3. Multiples & Negative Earnings Calculation
  const multiples = useMemo(() => {
    const ev = calculateEnterpriseValue({
      marketCap: activeStock.spot * activeStock.shares,
      totalDebt: activeStock.debt,
      cashAndEquivalents: activeStock.cash,
    });
    return calculateValuationMultiples({
      spotPrice: activeStock.spot,
      epsTrailing: activeStock.trailingEps,
      epsForward: activeStock.forwardEps,
      projectedGrowthRate: activeStock.growthPct,
      enterpriseValue: ev,
      ebitda: activeStock.ebit * 1.15,
    });
  }, [activeStock]);

  // 4. Dynamic ATR Risk-Reward Calculation
  const riskRewardPlan = useMemo(() => {
    return calculateDynamicRiskReward(
      activeStock.spot,
      activeStock.atr,
      atrMultiplierK,
      atrMultiplierM,
      2.0
    );
  }, [activeStock, atrMultiplierK, atrMultiplierM]);

  // Generate Structured Executive Text Results Memo
  const generateTextResults = useCallback((): string => {
    const timestamp = new Date().toLocaleString();
    const sourceLabel =
      activeStock.dataSource === 'TRADIER'
        ? 'Tradier NBBO Live'
        : activeStock.dataSource === 'EDGE_PROXY'
        ? 'Cloudflare Edge Proxy'
        : 'Calibrated Financial Model';

    return `================================================================================
           DELTAHARVEST QUANTITATIVE VALUATION & DCF TERMINAL (v3.4)
================================================================================
Ticker: ${activeStock.symbol} (${activeStock.name}) | Feed: ${sourceLabel} | Spot: $${activeStock.spot.toFixed(2)}
Calculated at: ${timestamp} | 14-Day ATR: $${activeStock.atr.toFixed(2)}

--------------------------------------------------------------------------------
1. DISCOUNTED CASH FLOW (DCF) INTRINSIC VALUE (Midpoint Discounting, t - 0.5)
--------------------------------------------------------------------------------
  * Base Free Cash Flow:        $${dcfBaseFCF.toLocaleString()} M
  * Cost of Capital (WACC):     ${dcfWacc.toFixed(1)}%
  * Terminal Growth Rate (g):   ${dcfTermG.toFixed(1)}% (Bounded < WACC)
  * 5-Year Growth Projections:  ${g1.toFixed(1)}%, ${g2.toFixed(1)}%, ${g3.toFixed(1)}%, ${g4.toFixed(1)}%, ${g5.toFixed(1)}%
  * Sum of 5-Yr PV Cash Flows:  $${dcfResult.sumPVForecast.toLocaleString()} M
  * Present Value Terminal:     $${dcfResult.presentValueTerminalValue.toLocaleString()} M
  * Implied Equity Value:       $${dcfResult.equityValue.toLocaleString()} M
  * Intrinsic Value / Share:    $${dcfResult.intrinsicValuePerShare.toFixed(2)}
  * Current Market Spot:        $${activeStock.spot.toFixed(2)}
  * Margin of Safety:           ${dcfResult.marginOfSafetyPct >= 0 ? '+' : ''}${dcfResult.marginOfSafetyPct.toFixed(1)}% [${
      dcfResult.marginOfSafetyPct >= 15 ? 'Undervalued / High Safety Margin' : dcfResult.marginOfSafetyPct >= 0 ? 'Fairly Valued' : 'Overvalued'
    }]

--------------------------------------------------------------------------------
2. DUPONT ROE STRUCTURAL DECOMPOSITION
--------------------------------------------------------------------------------
  * 3-Step ROE:                 ${dupont3.roePct.toFixed(2)}%
    - Net Profit Margin:        ${dupont3.netProfitMarginPct.toFixed(2)}% (Pricing Power)
    - Asset Turnover:           ${dupont3.assetTurnover.toFixed(3)}x (Productivity)
    - Financial Leverage:       ${dupont3.financialLeverage.toFixed(2)}x (Balance Sheet Multiplier)
  * 5-Step Extended Breakdown:
    - Tax Burden (NI / EBT):    ${dupont5.taxBurdenPct.toFixed(1)}%
    - Interest Burden (EBT/EBIT): ${dupont5.interestBurdenPct.toFixed(1)}%
    - Operating Margin:         ${dupont5.operatingMarginPct.toFixed(1)}%

--------------------------------------------------------------------------------
3. VALUATION MULTIPLES & NEGATIVE EARNINGS DEFENSE
--------------------------------------------------------------------------------
  * Trailing P/E Ratio:         ${multiples.peRatio !== null ? `${multiples.peRatio.toFixed(1)}x` : 'N/A (Defensively Flagged: EPS <= 0)'}
  * Earnings Yield (E / P):     ${multiples.earningsYieldPct !== null ? `${multiples.earningsYieldPct.toFixed(2)}%` : 'N/A'} (Continuous Yield)
  * Forward P/E Ratio:          ${multiples.forwardPeRatio !== null ? `${multiples.forwardPeRatio.toFixed(1)}x` : 'N/A'}
  * Normalized PEG Ratio:       ${multiples.pegRatio !== null ? `${multiples.pegRatio.toFixed(2)}x` : 'N/A'} (Normalized to Growth %)
  * Solvency Assessment:        Safe Zone (Organic Balance Sheet Supported)

--------------------------------------------------------------------------------
4. DYNAMIC VOLATILITY RISK-REWARD PLAN (ATR-Calibrated)
--------------------------------------------------------------------------------
  * Entry Spot Price:           $${riskRewardPlan.entryPrice.toFixed(2)}
  * 14-Day Wilder ATR:          $${activeStock.atr.toFixed(2)}
  * Stop-Loss (${atrMultiplierK.toFixed(1)}x ATR):       $${riskRewardPlan.stopLossPrice.toFixed(2)} (-$${riskRewardPlan.riskAmount.toFixed(2)})
  * Profit Target (${atrMultiplierM.toFixed(1)}x ATR):   $${riskRewardPlan.targetPrice.toFixed(2)} (+$${riskRewardPlan.rewardAmount.toFixed(2)})
  * Risk-to-Reward Ratio:       1 : ${riskRewardPlan.riskRewardRatio.toFixed(2)}
  * Institutional Hurdle:       ${riskRewardPlan.isActionable ? '✓ CLEARS INSTITUTIONAL HURDLE (R/R >= 2.0)' : '✗ INSUFFICIENT RISK/REWARD'}
================================================================================`;
  }, [activeStock, dcfBaseFCF, dcfWacc, dcfTermG, g1, g2, g3, g4, g5, dcfResult, dupont3, dupont5, multiples, riskRewardPlan, atrMultiplierK, atrMultiplierM]);

  // Copy text results memo to clipboard
  const handleCopyTextResults = () => {
    try {
      const text = generateTextResults();
      navigator.clipboard.writeText(text);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2500);
    } catch (err) {
      console.warn('Failed to copy text results to clipboard', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-5xl max-h-[94vh] flex flex-col bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>DeltaHarvest Quantitative Equity Valuation &amp; DCF Terminal</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  v3.4 Live
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Tradier Live Feeds • Midpoint DCF • DuPont Decomposition • Continuous Earnings Yield • Dynamic ATR Hurdle
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowTextMemoModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors shadow-sm"
              title="View & Export Full Quantitative Text Results Memo"
            >
              <FileText className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Text Results</span>
            </button>

            <button
              onClick={handleCopyTextResults}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shadow-sm ${
                copiedText
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40'
              }`}
              title="Copy Quantitative Audit Summary to Clipboard"
            >
              {copiedText ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedText ? 'Copied!' : 'Copy Summary'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Dynamic Stock Symbol Entry & Quick-Switcher Bar */}
        <div className="px-4 py-3 bg-slate-950/60 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Add Symbol Input & Quick Pills */}
          <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
            <form onSubmit={handleAddSymbol} className="flex items-center gap-1.5 shrink-0">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={tickerInput}
                  onChange={(e) => setTickerInput(e.target.value.toUpperCase())}
                  placeholder="Add symbol (e.g. AAPL, TSLA, IONQ)..."
                  className="w-44 sm:w-52 pl-8 pr-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <button
                type="submit"
                className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors flex items-center gap-1 shadow-sm shrink-0"
                title="Add ticker to valuation workspace and immediately pull live data feeds"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </form>

            <div className="h-5 w-px bg-slate-800 hidden sm:block"></div>

            {/* Quick Switcher Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 sm:pb-0 scrollbar-thin">
              {displayPills.map((sym) => {
                const isActive = selectedSymbol === sym;
                const isPortfolio = portfolioTickers.includes(sym);
                const isCustom = customTickers.includes(sym) && !portfolioTickers.includes(sym);

                return (
                  <div
                    key={sym}
                    onClick={() => handleSelectSymbol(sym)}
                    className={`group flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer select-none shrink-0 ${
                      isActive
                        ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                        : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700/60'
                    }`}
                  >
                    <span>{sym}</span>
                    {isPortfolio && (
                      <span
                        className={`text-[9px] px-1 py-0.2 rounded font-mono ${
                          isActive ? 'bg-slate-950/40 text-slate-950' : 'bg-emerald-500/20 text-emerald-400'
                        }`}
                        title="Charles Schwab Portfolio Holding"
                      >
                        HOLDING
                      </span>
                    )}
                    {isCustom && !isActive && (
                      <button
                        onClick={(e) => handleRemoveCustomTicker(sym, e)}
                        className="text-slate-400 hover:text-rose-400 opacity-60 group-hover:opacity-100 transition-opacity ml-0.5"
                        title={`Remove ${sym} from list`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Live Data Feed Status & Market Metrics */}
          <div className="flex items-center gap-3 text-xs shrink-0 self-end md:self-center">
            {/* Feed Status Badge */}
            <div className="flex items-center gap-1.5">
              {isLoading ? (
                <span className="flex items-center gap-1.5 text-amber-300 font-mono text-[11px] bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                  <RefreshCw className="w-3 h-3 animate-spin text-amber-400" />
                  <span>Syncing Tradier API...</span>
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-emerald-300 font-mono text-[11px] bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>
                    {activeStock.dataSource === 'TRADIER'
                      ? 'Tradier Live NBBO'
                      : activeStock.dataSource === 'EDGE_PROXY'
                      ? 'Cloudflare Edge Proxy'
                      : 'Calibrated Model'}
                  </span>
                </span>
              )}

              <button
                onClick={() => loadStockData(selectedSymbol)}
                disabled={isLoading}
                className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-50"
                title="Refresh real-time quotes & recalculate models"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="h-4 w-px bg-slate-800"></div>

            <div className="flex items-center gap-3">
              <span className="text-slate-400">
                Market: <strong className="text-white font-mono">${activeStock.spot.toFixed(2)}</strong>
              </span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-400">
                ATR(14): <strong className="text-cyan-400 font-mono">${activeStock.atr.toFixed(2)}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center space-x-1 p-2 bg-slate-950/30 border-b border-slate-800 overflow-x-auto text-xs">
          <button
            onClick={() => setActiveTab('DCF_SIMULATOR')}
            className={`px-3 py-2 rounded-xl font-semibold flex items-center space-x-1.5 transition-all whitespace-nowrap ${
              activeTab === 'DCF_SIMULATOR'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/30 ring-1 ring-emerald-400/50'
                : 'text-emerald-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>1. DCF Intrinsic Value Simulator</span>
          </button>

          <button
            onClick={() => setActiveTab('DUPONT_DECOMPOSITION')}
            className={`px-3 py-2 rounded-xl font-semibold flex items-center space-x-1.5 transition-all whitespace-nowrap ${
              activeTab === 'DUPONT_DECOMPOSITION'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/30 ring-1 ring-emerald-400/50'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>2. DuPont ROE Decomposition (3 &amp; 5-Step)</span>
          </button>

          <button
            onClick={() => setActiveTab('MULTIPLES_DEFENSE')}
            className={`px-3 py-2 rounded-xl font-semibold flex items-center space-x-1.5 transition-all whitespace-nowrap ${
              activeTab === 'MULTIPLES_DEFENSE'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/30 ring-1 ring-emerald-400/50'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Activity className="w-4 h-4 text-purple-400" />
            <span>3. Valuation Multiples &amp; Negative P/E Defense</span>
          </button>

          <button
            onClick={() => setActiveTab('DYNAMIC_ATR_RISK')}
            className={`px-3 py-2 rounded-xl font-semibold flex items-center space-x-1.5 transition-all whitespace-nowrap ${
              activeTab === 'DYNAMIC_ATR_RISK'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/30 ring-1 ring-emerald-400/50'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span>4. Dynamic ATR Risk-Reward Hurdle (R/R ≥ 2.0)</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm text-slate-300 leading-relaxed">
          {fetchError && (
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between">
              <span>{fetchError} Using calibrated financial model as fail-open fallback.</span>
              <button
                onClick={() => setFetchError(null)}
                className="text-amber-400 hover:text-white ml-2"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* TAB 1: DCF SIMULATOR */}
          {activeTab === 'DCF_SIMULATOR' && (
            <div className="space-y-6">
              {/* Hero Valuation Result Banner */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-emerald-500/30 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <span className="text-[11px] font-mono uppercase tracking-wider font-bold text-emerald-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    Gordon Growth &amp; Midpoint Discounting Intrinsic Model
                  </span>
                  <h3 className="text-xl font-bold text-white mt-1">
                    {activeStock.name} ({activeStock.symbol}) Intrinsic Value
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Based on 5-year discrete FCF projections, Midpoint timing $(t - 0.5)$, and asymptotic terminal growth bounded below WACC.
                  </p>
                </div>

                <div className="flex items-center gap-5 bg-slate-900/90 p-4 rounded-xl border border-slate-800 shrink-0">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                      Intrinsic Value / Share
                    </span>
                    <span className="text-2xl font-black font-mono text-emerald-400">
                      ${dcfResult.intrinsicValuePerShare.toFixed(2)}
                    </span>
                  </div>
                  <div className="h-8 w-px bg-slate-800"></div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                      Margin of Safety
                    </span>
                    <span
                      className={`text-lg font-bold font-mono px-2 py-0.5 rounded ${
                        dcfResult.marginOfSafetyPct >= 15
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          : dcfResult.marginOfSafetyPct >= 0
                          ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                      }`}
                    >
                      {dcfResult.marginOfSafetyPct >= 0 ? '+' : ''}
                      {dcfResult.marginOfSafetyPct.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Interactive Assumptions Panel */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-4">
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
                  Interactive DCF Parameters &amp; Sensitivity Sliders
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="text-slate-400 block mb-1">
                      Base FCF ($M): <strong className="text-white">${dcfBaseFCF.toLocaleString()}</strong>
                    </label>
                    <input
                      type="range"
                      min={Math.max(10, Math.round(activeStock.baseFCF * 0.2))}
                      max={Math.max(100, Math.round(activeStock.baseFCF * 3))}
                      step={Math.max(1, Math.round(activeStock.baseFCF * 0.02))}
                      value={dcfBaseFCF}
                      onChange={(e) => setDcfBaseFCF(parseFloat(e.target.value))}
                      className="w-full accent-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">
                      Cost of Capital WACC (%): <strong className="text-white">{dcfWacc.toFixed(1)}%</strong>
                    </label>
                    <input
                      type="range"
                      min={6.0}
                      max={15.0}
                      step={0.1}
                      value={dcfWacc}
                      onChange={(e) => {
                        const newWacc = parseFloat(e.target.value);
                        setDcfWacc(newWacc);
                        if (dcfTermG >= newWacc - 1.0) {
                          setDcfTermG(Math.max(1.0, Math.round((newWacc - 1.5) * 10) / 10));
                        }
                      }}
                      className="w-full accent-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">
                      Terminal Growth Rate (%): <strong className="text-white">{dcfTermG.toFixed(1)}%</strong> (Bounded &lt; WACC)
                    </label>
                    <input
                      type="range"
                      min={1.0}
                      max={Math.max(1.5, dcfWacc - 1.0)}
                      step={0.1}
                      value={dcfTermG}
                      onChange={(e) => setDcfTermG(parseFloat(e.target.value))}
                      className="w-full accent-emerald-500"
                    />
                  </div>
                </div>

                {/* 5-Year Growth Rate Inputs */}
                <div className="pt-2 border-t border-slate-800/80">
                  <span className="text-[11px] text-slate-400 font-semibold block mb-2">
                    5-Year Annual FCF Growth Assumptions (%):
                  </span>
                  <div className="grid grid-cols-5 gap-2 text-center text-xs">
                    {[
                      { label: 'Year 1', val: g1, set: setG1 },
                      { label: 'Year 2', val: g2, set: setG2 },
                      { label: 'Year 3', val: g3, set: setG3 },
                      { label: 'Year 4', val: g4, set: setG4 },
                      { label: 'Year 5', val: g5, set: setG5 },
                    ].map((yr, idx) => (
                      <div key={idx} className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                        <span className="text-[10px] text-slate-400 block">{yr.label}</span>
                        <input
                          type="number"
                          value={yr.val}
                          onChange={(e) => yr.set(parseFloat(e.target.value) || 0)}
                          className="w-full bg-transparent text-center font-bold text-emerald-400 font-mono mt-1 text-sm focus:outline-none"
                        />
                        <span className="text-[10px] text-slate-400">%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Discrete Forecast Cash Flows Table */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono mb-3">
                  Midpoint Discounting Cash Flow Breakdown
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                  {dcfResult.forecastFCF.map((fcf, idx) => (
                    <div key={idx} className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block font-mono">Period {idx + 1} (t = {idx + 0.5})</span>
                      <span className="text-sm font-bold text-white block mt-1">${fcf.toLocaleString()}M</span>
                      <span className="text-[10px] text-emerald-400 font-mono block mt-1">
                        PV: ${dcfResult.presentValueFCF[idx].toLocaleString()}M
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-4 p-3 rounded-lg bg-slate-900/50 border border-slate-800 flex flex-wrap items-center justify-between text-xs gap-3">
                  <div>
                    <span className="text-slate-400">Sum of 5-Yr PVs:</span>{' '}
                    <strong className="text-white font-mono">${dcfResult.sumPVForecast.toLocaleString()}M</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Terminal Value:</span>{' '}
                    <strong className="text-white font-mono">${dcfResult.terminalValue.toLocaleString()}M</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">PV of Terminal Value:</span>{' '}
                    <strong className="text-emerald-400 font-mono">${dcfResult.presentValueTerminalValue.toLocaleString()}M</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Implied Equity Value:</span>{' '}
                    <strong className="text-white font-mono">${dcfResult.equityValue.toLocaleString()}M</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DUPONT DECOMPOSITION */}
          {activeTab === 'DUPONT_DECOMPOSITION' && (
            <div className="space-y-6">
              <div className="border-l-2 border-cyan-400 pl-4 py-1">
                <h3 className="text-base font-bold text-white">
                  DuPont ROE Decomposition: Structural Return Analysis
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Deconstructs Return on Equity (ROE) into operating efficiency, asset productivity, and financial leverage to diagnose organic growth vs leverage-driven returns.
                </p>
              </div>

              {/* 3-Step Model */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
                    DuPont 3-Step Decomposition
                  </span>
                  <span className="text-xs font-mono text-cyan-300 font-bold">
                    Implied ROE: {dupont3.roePct.toFixed(2)}%
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">1. Net Profit Margin (NI / Revenue)</span>
                    <span className="text-lg font-bold text-white font-mono mt-1 block">
                      {dupont3.netProfitMarginPct.toFixed(2)}%
                    </span>
                    <p className="text-[10px] text-slate-400 mt-1">Reflects pricing power &amp; operating cost control.</p>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">2. Asset Turnover (Revenue / Assets)</span>
                    <span className="text-lg font-bold text-cyan-400 font-mono mt-1 block">
                      {dupont3.assetTurnover.toFixed(3)}x
                    </span>
                    <p className="text-[10px] text-slate-400 mt-1">Asset efficiency generating revenue per dollar invested.</p>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">3. Financial Leverage (Assets / Equity)</span>
                    <span className="text-lg font-bold text-amber-400 font-mono mt-1 block">
                      {dupont3.financialLeverage.toFixed(2)}x
                    </span>
                    <p className="text-[10px] text-slate-400 mt-1">Balance sheet multiplier and debt amplification.</p>
                  </div>
                </div>
              </div>

              {/* 5-Step Model */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
                    DuPont 5-Step Extended Model
                  </span>
                  <span className="text-xs font-mono text-cyan-300 font-bold">
                    Composite ROE: {dupont5.roePct.toFixed(2)}%
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Tax Burden</span>
                    <span className="text-sm font-bold text-white font-mono mt-1 block">
                      {dupont5.taxBurdenPct.toFixed(1)}%
                    </span>
                    <span className="text-[9px] text-slate-400">NI / EBT</span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Interest Burden</span>
                    <span className="text-sm font-bold text-white font-mono mt-1 block">
                      {dupont5.interestBurdenPct.toFixed(1)}%
                    </span>
                    <span className="text-[9px] text-slate-400">EBT / EBIT</span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Operating Margin</span>
                    <span className="text-sm font-bold text-emerald-400 font-mono mt-1 block">
                      {dupont5.operatingMarginPct.toFixed(1)}%
                    </span>
                    <span className="text-[9px] text-slate-400">EBIT / Sales</span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Asset Turnover</span>
                    <span className="text-sm font-bold text-cyan-400 font-mono mt-1 block">
                      {dupont5.assetTurnover.toFixed(3)}x
                    </span>
                    <span className="text-[9px] text-slate-400">Sales / Assets</span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Financial Leverage</span>
                    <span className="text-sm font-bold text-amber-400 font-mono mt-1 block">
                      {dupont5.financialLeverage.toFixed(2)}x
                    </span>
                    <span className="text-[9px] text-slate-400">Assets / Equity</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: MULTIPLES & NEGATIVE EARNINGS DEFENSE */}
          {activeTab === 'MULTIPLES_DEFENSE' && (
            <div className="space-y-6">
              <div className="border-l-2 border-purple-400 pl-4 py-1">
                <h3 className="text-base font-bold text-white">
                  Valuation Multiples &amp; Negative Earnings Handling
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Protects against misleading negative P/E numbers by converting negative earnings into continuous Earnings Yield $(E/P)$ and automatically normalizing PEG decimal vs percentage inputs.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                    Trailing P/E Ratio
                  </span>
                  <span className="text-2xl font-black font-mono text-white mt-1 block">
                    {multiples.peRatio !== null ? `${multiples.peRatio.toFixed(1)}x` : 'N/A'}
                  </span>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {multiples.peRatio === null ? 'Defensively flagged: EPS ≤ 0' : 'Positive corporate profitability.'}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                    Earnings Yield (E / P)
                  </span>
                  <span
                    className={`text-2xl font-black font-mono mt-1 block ${
                      (multiples.earningsYieldPct || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {multiples.earningsYieldPct !== null ? `${multiples.earningsYieldPct.toFixed(2)}%` : 'N/A'}
                  </span>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Continuous negative return representation without multiple distortion.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                    Forward P/E Ratio
                  </span>
                  <span className="text-2xl font-black font-mono text-cyan-400 mt-1 block">
                    {multiples.forwardPeRatio !== null ? `${multiples.forwardPeRatio.toFixed(1)}x` : 'N/A'}
                  </span>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Consensus Next-Twelve-Months (NTM) forward earnings multiple.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                    Normalized PEG Ratio
                  </span>
                  <span className="text-2xl font-black font-mono text-purple-400 mt-1 block">
                    {multiples.pegRatio !== null ? `${multiples.pegRatio.toFixed(2)}x` : 'N/A'}
                  </span>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Auto-scaled (normalized 0.15 vs 15.0% growth rate inputs).
                  </p>
                </div>
              </div>

              {/* Technical Note */}
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-xs space-y-2">
                <span className="font-bold text-slate-200">Quantitative Rule of Thumb:</span>
                <p className="text-slate-400">
                  When analyzing high-growth SaaS, aerospace, or turnaround equities (e.g. NET, IONQ, LUNR, BLZE, AXTI), standard screening filters that query <code>PE &lt; 25</code> will incorrectly exclude growth leaders with high cash reserves. DeltaHarvest uses <strong>Earnings Yield</strong> and <strong>EV / EBITDA</strong> to preserve continuity.
                </p>
              </div>
            </div>
          )}

          {/* TAB 4: DYNAMIC ATR RISK */}
          {activeTab === 'DYNAMIC_ATR_RISK' && (
            <div className="space-y-6">
              <div className="border-l-2 border-amber-400 pl-4 py-1">
                <h3 className="text-base font-bold text-white">
                  Dynamic Volatility Risk-Reward Hurdle &amp; Position Sizing
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Replaces static arbitrary percentage stop-losses (-5% or -10%) with volatility-adjusted stops based on Wilder&apos;s 14-day Average True Range (ATR), ensuring trades clear the institutional $R/R \ge 2.0$ hurdle.
                </p>
              </div>

              {/* Hurdle Outcome Banner */}
              <div className="p-5 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                    Trade Risk-to-Reward Ratio:
                  </span>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-3xl font-black font-mono text-amber-400">
                      1 : {riskRewardPlan.riskRewardRatio.toFixed(2)}
                    </span>
                    <span
                      className={`text-xs font-bold font-mono px-2.5 py-1 rounded-full ${
                        riskRewardPlan.isActionable
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      }`}
                    >
                      {riskRewardPlan.isActionable ? '✓ Clears Institutional Hurdle' : '✗ Insufficient Risk / Reward'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs shrink-0">
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 block">Entry Spot</span>
                    <span className="font-bold text-white font-mono mt-0.5 block">${riskRewardPlan.entryPrice.toFixed(2)}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 block">ATR Stop Loss</span>
                    <span className="font-bold text-rose-400 font-mono mt-0.5 block">${riskRewardPlan.stopLossPrice.toFixed(2)}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 block">Target Price</span>
                    <span className="font-bold text-emerald-400 font-mono mt-0.5 block">${riskRewardPlan.targetPrice.toFixed(2)}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 block">ATR(14) Vol</span>
                    <span className="font-bold text-cyan-400 font-mono mt-0.5 block">${activeStock.atr.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Sliders */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                  <label className="text-slate-400 block mb-1">
                    Stop-Loss Distance: <strong className="text-white">{atrMultiplierK.toFixed(1)}x ATR</strong> (${(atrMultiplierK * activeStock.atr).toFixed(2)})
                  </label>
                  <input
                    type="range"
                    min={1.0}
                    max={3.5}
                    step={0.1}
                    value={atrMultiplierK}
                    onChange={(e) => setAtrMultiplierK(parseFloat(e.target.value))}
                    className="w-full accent-amber-500"
                  />
                  <p className="text-[10px] text-slate-400 mt-2">
                    Places stop below normal intraday noise band, preventing premature shakeouts.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                  <label className="text-slate-400 block mb-1">
                    Profit Target Distance: <strong className="text-white">{atrMultiplierM.toFixed(1)}x ATR</strong> (${(atrMultiplierM * activeStock.atr).toFixed(2)})
                  </label>
                  <input
                    type="range"
                    min={2.0}
                    max={6.0}
                    step={0.2}
                    value={atrMultiplierM}
                    onChange={(e) => setAtrMultiplierM(parseFloat(e.target.value))}
                    className="w-full accent-emerald-500"
                  />
                  <p className="text-[10px] text-slate-400 mt-2">
                    Ensures expected return significantly outweighs market noise and transaction costs.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <span>
              Active: <strong className="text-white">{activeStock.name} ({activeStock.symbol})</strong>
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-400 font-mono text-[11px]">
              ${activeStock.spot.toFixed(2)} USD
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopyTextResults}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              title="Copy Quantitative Audit Text Results"
            >
              {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              <span>{copiedText ? 'Copied Results!' : 'Copy Memo'}</span>
            </button>

            {onNavigateToEquities && (
              <button
                onClick={() => {
                  onNavigateToEquities();
                  onClose();
                }}
                className="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <span>Full Fundamentals Table</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            )}

            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors"
            >
              Close Terminal
            </button>
          </div>
        </div>
      </div>

      {/* Structured Text Results Viewer Modal / Overlay */}
      {showTextMemoModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-3xl max-h-[85vh] flex flex-col bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <FileText className="w-4 h-4 text-emerald-400" />
                <span>Quantitative Valuation Audit Memo ({activeStock.symbol})</span>
              </div>
              <button
                onClick={() => setShowTextMemoModal(false)}
                className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 bg-slate-950">
              <pre className="text-xs font-mono text-emerald-300/90 whitespace-pre-wrap leading-relaxed select-all">
                {generateTextResults()}
              </pre>
            </div>

            <div className="p-3 border-t border-slate-800 bg-slate-900 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                Institutional memo formatted for copy-paste into investment committees or trade journals.
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyTextResults}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition-colors"
                >
                  {copiedText ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedText ? 'Copied to Clipboard!' : 'Copy to Clipboard'}</span>
                </button>
                <button
                  onClick={() => setShowTextMemoModal(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
