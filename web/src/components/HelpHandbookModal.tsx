import React, { useState } from 'react';
import {
  HelpCircle,
  X,
  BookOpen,
  ShieldCheck,
  TrendingUp,
  Flame,
  Layers,
  Activity,
  Command,
  Check,
  AlertTriangle,
  ShieldAlert,
  BarChart2,
  Zap,
  MessageSquare,
  BrainCircuit,
} from './icons';

interface HelpHandbookModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type HandbookTab =
  | 'LAYPERSON_PRIMER'
  | 'AI_OPTIONS_INCOME'
  | 'WEEKLY_SCREENERS_GUIDE'
  | 'STRATEGY_RULES'
  | 'MARKET_CHAMELEON'
  | 'CHART_READING'
  | 'SPREADS_SKEW'
  | 'SOLVENCY_CEF'
  | 'BACKTEST_MARGIN'
  | 'BROKER_EXECUTION'
  | 'CONTEXT_SENTIMENT'
  | 'LIVE_STREAMING_RISK'
  | 'CADENCE_GUIDE'
  | 'GREEKS_FORMULAS'
  | 'LIQUIDITY_TIERS'
  | 'SHORTCUTS_FAQ';

export const HelpHandbookModal: React.FC<HelpHandbookModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<HandbookTab>('LAYPERSON_PRIMER');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div
        className="w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>DeltaHarvest Strategy Handbook &amp; Educational Center</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  v3.2
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Systematic Rules, Technicals, Spreads, Prediction Markets, Sentiment &amp; Risk Circuit-Breakers
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center space-x-1 p-2 bg-slate-950/40 border-b border-slate-800 overflow-x-auto text-xs">
          <button
            onClick={() => setActiveTab('LAYPERSON_PRIMER')}
            className={`px-3 py-2 rounded-xl font-semibold flex items-center space-x-1.5 transition-all whitespace-nowrap ${
              activeTab === 'LAYPERSON_PRIMER'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-amber-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <span>🌟</span>
            <span>Plain-English Primer (Non-Traders)</span>
          </button>

          <button
            onClick={() => setActiveTab('WEEKLY_SCREENERS_GUIDE')}
            className={`px-3 py-2 rounded-xl font-semibold flex items-center space-x-1.5 transition-all whitespace-nowrap ${
              activeTab === 'WEEKLY_SCREENERS_GUIDE'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/30 ring-1 ring-emerald-400/50'
                : 'text-amber-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Flame className="w-4 h-4 text-amber-400" />
            <span>Weekly Stock Screeners (Barchart)</span>
          </button>

          <button
            onClick={() => setActiveTab('AI_OPTIONS_INCOME')}
            className={`px-3 py-2 rounded-xl font-semibold flex items-center space-x-1.5 transition-all whitespace-nowrap ${
              activeTab === 'AI_OPTIONS_INCOME'
                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-600/30 ring-1 ring-violet-400/50'
                : 'text-violet-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <BrainCircuit className="w-4 h-4 text-violet-400" />
            <span>AI Options Screener (Thinking)</span>
          </button>

          <button
            onClick={() => setActiveTab('STRATEGY_RULES')}
            className={`px-3 py-2 rounded-xl font-semibold flex items-center space-x-1.5 transition-all whitespace-nowrap ${
              activeTab === 'STRATEGY_RULES'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>1. Core Strategy Rules</span>
          </button>

          <button
            onClick={() => setActiveTab('MARKET_CHAMELEON')}
            className={`px-3 py-2 rounded-xl font-semibold flex items-center space-x-1.5 transition-all whitespace-nowrap ${
              activeTab === 'MARKET_CHAMELEON'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <span>🦎</span>
            <span>2. MarketChameleon Patterns &amp; Ideas</span>
          </button>

          <button
            onClick={() => setActiveTab('CHART_READING')}
            className={`px-3 py-2 rounded-xl font-semibold flex items-center space-x-1.5 transition-all whitespace-nowrap ${
              activeTab === 'CHART_READING'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Activity className="w-4 h-4 text-cyan-400" />
            <span>3. Visual Charting &amp; Strike Positioning</span>
          </button>

          <button
            onClick={() => setActiveTab('SPREADS_SKEW')}
            className={`px-3 py-2 rounded-xl font-semibold flex items-center space-x-1.5 transition-all whitespace-nowrap ${
              activeTab === 'SPREADS_SKEW'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>4. Multi-Leg Spreads &amp; Volatility Skew</span>
          </button>

          <button
            onClick={() => setActiveTab('SOLVENCY_CEF')}
            className={`px-3 py-2 rounded-xl font-semibold flex items-center space-x-1.5 transition-all whitespace-nowrap ${
              activeTab === 'SOLVENCY_CEF'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
            <span>5. Altman Z-Score &amp; CEF Anatomy</span>
          </button>

          <button
            onClick={() => setActiveTab('BACKTEST_MARGIN')}
            className={`px-3 py-2 rounded-xl font-semibold flex items-center space-x-1.5 transition-all whitespace-nowrap ${
              activeTab === 'BACKTEST_MARGIN'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <BarChart2 className="w-4 h-4 text-purple-400" />
            <span>6. Backtesting &amp; Margin Stress</span>
          </button>

          <button
            onClick={() => setActiveTab('BROKER_EXECUTION')}
            className={`px-3 py-2 rounded-xl font-semibold flex items-center space-x-1.5 transition-all whitespace-nowrap ${
              activeTab === 'BROKER_EXECUTION'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Zap className="w-4 h-4 text-amber-400" />
            <span>7. Broker Staging &amp; Execution</span>
          </button>

          <button
            onClick={() => setActiveTab('CONTEXT_SENTIMENT')}
            className={`px-3 py-2 rounded-xl font-semibold flex items-center space-x-1.5 transition-all whitespace-nowrap ${
              activeTab === 'CONTEXT_SENTIMENT'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <MessageSquare className="w-4 h-4 text-blue-400" />
            <span>8. Sentiment &amp; Predictions</span>
          </button>

          <button
            onClick={() => setActiveTab('LIVE_STREAMING_RISK')}
            className={`px-3 py-2 rounded-xl font-semibold flex items-center space-x-1.5 transition-all whitespace-nowrap ${
              activeTab === 'LIVE_STREAMING_RISK'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            <span>9. Live Risk Circuit-Breakers</span>
          </button>

          <button
            onClick={() => setActiveTab('CADENCE_GUIDE')}
            className={`px-3 py-2 rounded-xl font-semibold flex items-center space-x-1.5 transition-all whitespace-nowrap ${
              activeTab === 'CADENCE_GUIDE'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>10. Weekly vs Monthly Expirations</span>
          </button>

          <button
            onClick={() => setActiveTab('GREEKS_FORMULAS')}
            className={`px-3 py-2 rounded-xl font-semibold flex items-center space-x-1.5 transition-all whitespace-nowrap ${
              activeTab === 'GREEKS_FORMULAS'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Activity className="w-4 h-4 text-emerald-400" />
            <span>11. Greeks &amp; Formulas</span>
          </button>

          <button
            onClick={() => setActiveTab('LIQUIDITY_TIERS')}
            className={`px-3 py-2 rounded-xl font-semibold flex items-center space-x-1.5 transition-all whitespace-nowrap ${
              activeTab === 'LIQUIDITY_TIERS'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Flame className="w-4 h-4 text-amber-400" />
            <span>12. Liquidity Tiers</span>
          </button>

          <button
            onClick={() => setActiveTab('SHORTCUTS_FAQ')}
            className={`px-3 py-2 rounded-xl font-semibold flex items-center space-x-1.5 transition-all whitespace-nowrap ${
              activeTab === 'SHORTCUTS_FAQ'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Command className="w-4 h-4" />
            <span>13. Shortcuts &amp; FAQ</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm text-slate-300 leading-relaxed">
          {/* TAB 0: Plain-English Layperson Primer */}
          {activeTab === 'LAYPERSON_PRIMER' && (
            <div className="space-y-6">
              <div className="border-l-2 border-emerald-400 pl-4 py-1">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>🌟 Welcome to DeltaHarvest: Plain-English Guide for Everyday Investors</span>
                </h3>
                <p className="text-slate-300 mt-1">
                  You don&apos;t need to be a Wall Street day-trader to use this platform. DeltaHarvest is an automated conservative income system that lets you collect recurring cash flow from high-quality stocks with high statistical odds of success.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Concept 1: What is an Option? */}
                <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-2">
                  <div className="font-bold text-white text-xs flex items-center gap-1.5">
                    <span className="text-emerald-400">1.</span> What is an Option Contract?
                  </div>
                  <p className="text-xs text-slate-300">
                    Think of an option like an <strong>insurance contract</strong> or an <strong>earnest money deposit on real estate</strong>. When you sell an option, someone pays you cash today in exchange for a promise that expires in a few days or weeks.
                  </p>
                </div>

                {/* Concept 2: Cash-Secured Put (CSP) */}
                <div className="bg-slate-950/70 p-4 rounded-xl border border-emerald-500/30 space-y-2">
                  <div className="font-bold text-emerald-300 text-xs flex items-center gap-1.5">
                    <span className="text-emerald-400">2.</span> Cash-Secured Put (CSP) = Getting Paid to Buy on Sale
                  </div>
                  <p className="text-xs text-slate-300">
                    You set aside cash to buy 100 shares of a great company (like Apple or Microsoft) at a <strong>steep discount price you choose</strong>. You get paid real cash upfront today. If the stock never drops to your discount price, you keep 100% of the cash for free!
                  </p>
                </div>

                {/* Concept 3: Covered Call (CC) */}
                <div className="bg-slate-950/70 p-4 rounded-xl border border-cyan-500/30 space-y-2">
                  <div className="font-bold text-cyan-300 text-xs flex items-center gap-1.5">
                    <span className="text-cyan-400">3.</span> Covered Call (CC) = Collecting Rental Income
                  </div>
                  <p className="text-xs text-slate-300">
                    If you own 100 shares of a stock, selling a Covered Call is like collecting monthly rental income on your house while agreeing that if someone offers you a massive jackpot price, you&apos;ll sell it for huge profits.
                  </p>
                </div>

                {/* Concept 4: Delta and Probabilities */}
                <div className="bg-slate-950/70 p-4 rounded-xl border border-indigo-500/30 space-y-2">
                  <div className="font-bold text-indigo-300 text-xs flex items-center gap-1.5">
                    <span className="text-indigo-400">4.</span> Delta (&Delta;) = The Statistical Odds
                  </div>
                  <p className="text-xs text-slate-300">
                    Delta measures the probability of a stock reaching your strike price. When we target <strong>0.15 Delta</strong>, math says there is an <strong>~85% statistical probability</strong> that the trade will finish fully profitable with zero stock purchase required.
                  </p>
                </div>

                {/* Concept 5: Bollinger Bands */}
                <div className="bg-slate-950/70 p-4 rounded-xl border border-amber-500/30 space-y-2">
                  <div className="font-bold text-amber-300 text-xs flex items-center gap-1.5">
                    <span className="text-amber-400">5.</span> Bollinger Bands = Price Highway Guardrails
                  </div>
                  <p className="text-xs text-slate-300">
                    Bollinger Bands show the statistical normal price boundaries of a stock (2 Standard Deviations = 95% of all price action). We sell puts <strong>below the Lower Band floor</strong> and calls <strong>above the Upper Band ceiling</strong> for maximum safety margin.
                  </p>
                </div>

                {/* Concept 6: IV Rank */}
                <div className="bg-slate-950/70 p-4 rounded-xl border border-purple-500/30 space-y-2">
                  <div className="font-bold text-purple-300 text-xs flex items-center gap-1.5">
                    <span className="text-purple-400">6.</span> IV Rank (IVR %) = Volatility Thermometer
                  </div>
                  <p className="text-xs text-slate-300">
                    Implied Volatility (IV) measures market panic or excitement. When IV Rank is high (&ge; 45%), option buyers overpay for insurance, allowing conservative option sellers to harvest unusually high cash yields.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MarketChameleon Quantitative Patterns */}
          {activeTab === 'MARKET_CHAMELEON' && (
            <div className="space-y-6">
              <div className="border-l-2 border-amber-400 pl-4 py-1">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>🦎 MarketChameleon Quantitative Patterns &amp; Stock Ideas</span>
                </h3>
                <p className="text-slate-400 mt-1">
                  MarketChameleon uses a triple Simple Moving Average (SMA 20/50/250) engine and 6-month price range dynamics to classify equities into actionable technical patterns and institutional Stock Ideas.
                </p>
              </div>

              {/* 3 Moving Averages */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 text-center">
                  <div className="text-[10px] text-slate-400 uppercase font-mono">Short-Term (1 Month)</div>
                  <div className="text-base font-bold text-emerald-400 font-mono mt-0.5">20-Day SMA</div>
                  <div className="text-[11px] text-slate-400 mt-1">Fast baseline and immediate dynamic support/resistance level.</div>
                </div>

                <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 text-center">
                  <div className="text-[10px] text-slate-400 uppercase font-mono">Medium-Term (10 Weeks)</div>
                  <div className="text-base font-bold text-cyan-400 font-mono mt-0.5">50-Day SMA</div>
                  <div className="text-[11px] text-slate-400 mt-1">Intermediate institutional trend filter and pullback cushion.</div>
                </div>

                <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 text-center">
                  <div className="text-[10px] text-slate-400 uppercase font-mono">Long-Term (1 Year)</div>
                  <div className="text-base font-bold text-indigo-400 font-mono mt-0.5">250-Day SMA</div>
                  <div className="text-[11px] text-slate-400 mt-1">Macro secular trend anchor distinguishing bull from bear regimes.</div>
                </div>
              </div>

              {/* 9 Technical Patterns */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                  9 Technical Pattern Classifications
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-950/70 p-3 rounded-xl border border-emerald-500/30 space-y-1">
                    <div className="font-bold text-emerald-300">📈 Uptrend (Bullish Stack)</div>
                    <div className="text-slate-300 font-mono text-[11px]">Price &gt; SMA 20 &gt; SMA 50 &gt; SMA 250</div>
                    <div className="text-slate-400 text-[11px]">Strong upward momentum across all timeframes. Ideal for Bull Put Spreads and Covered Calls.</div>
                  </div>

                  <div className="bg-slate-950/70 p-3 rounded-xl border border-rose-500/30 space-y-1">
                    <div className="font-bold text-rose-300">📉 Downtrend (Bearish Stack)</div>
                    <div className="text-slate-300 font-mono text-[11px]">Price &lt; SMA 20 &lt; SMA 50 &lt; SMA 250</div>
                    <div className="text-slate-400 text-[11px]">Sustained downward drift. Avoid naked puts; hedge with Bear Call Spreads or Collars.</div>
                  </div>

                  <div className="bg-slate-950/70 p-3 rounded-xl border border-cyan-500/30 space-y-1">
                    <div className="font-bold text-cyan-300">⚡ Bottom Bounce (Reversal Candidate)</div>
                    <div className="text-slate-300 font-mono text-[11px]">Prevailing downtrend (SMA 20 &lt; 50), Price[t] crosses above SMA 20[t]</div>
                    <div className="text-slate-400 text-[11px]">Signals oversold exhaustion and potential mean-reversion rally. Prime for conservative CSPs.</div>
                  </div>

                  <div className="bg-slate-950/70 p-3 rounded-xl border border-amber-500/30 space-y-1">
                    <div className="font-bold text-amber-300">🛡️ Top Pullback (Dip in Uptrend)</div>
                    <div className="text-slate-300 font-mono text-[11px]">Uptrend stack, but Price dips below SMA 20 while holding above SMA 50</div>
                    <div className="text-slate-400 text-[11px]">Healthy institutional consolidation inside a strong bull market. Excellent entry for dip buyers.</div>
                  </div>

                  <div className="bg-slate-950/70 p-3 rounded-xl border border-purple-500/30 space-y-1">
                    <div className="font-bold text-purple-300">💀 Dead Cat Bounce Warning</div>
                    <div className="text-slate-300 font-mono text-[11px]">SMA 50 &lt; 250, breached SMA 20 recently but closed down lower</div>
                    <div className="text-slate-400 text-[11px]">Fakeout recovery trap that failed to hold. Signals continued weakness.</div>
                  </div>

                  <div className="bg-slate-950/70 p-3 rounded-xl border border-teal-500/30 space-y-1">
                    <div className="font-bold text-teal-300">🔥 Momentum Stocks (Stock Ideas)</div>
                    <div className="text-slate-300 font-mono text-[11px]">(Price - Low 6M) / (High 6M - Low 6M) strictly increasing across 3M, 2M, 1M</div>
                    <div className="text-slate-400 text-[11px]">Stocks consistently gaining relative strength near 6-month highs. High momentum leaders.</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: Weekly Stock Screeners Guide */}
          {activeTab === 'WEEKLY_SCREENERS_GUIDE' && (
            <div className="space-y-6">
              <div className="border-l-2 border-amber-400 pl-4 py-1">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>🔥 Weekly Stock Screeners &amp; Multi-Source Ingestion Engine</span>
                </h3>
                <p className="text-slate-400 mt-1">
                  Automated screener agent tracking Top 1% Direction Strength, 13-indicator technical consensus, and weekly options availability from Barchart.com (with pluggable MarketChameleon.com integration).
                </p>
              </div>

              {/* What is Barchart Direction Strength */}
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-3">
                <h4 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-1.5 text-emerald-400">
                  <Flame className="w-4 h-4 text-amber-400" />
                  <span>1. Barchart Top 1% Direction Strength &amp; 13 Technical Indicators</span>
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Barchart’s Direction Strength evaluates a stock across <strong>13 distinct technical indicators</strong> categorized into short-term (20-day), medium-term (50-day), and long-term (100/150/200-day) moving averages and MACD oscillators.
                  When a stock achieves a <strong>100% Buy</strong> composite rating, all 13 indicators have unanimously triggered bullish trend confirmations:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <div className="font-bold text-cyan-300">Short-Term (4 Indicators)</div>
                    <div className="text-[11px] text-slate-400 mt-1">20-Day SMA, 20-50 MACD, 20-100 MACD, 20-200 MACD Oscillators</div>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <div className="font-bold text-emerald-300">Medium-Term (4 Indicators)</div>
                    <div className="text-[11px] text-slate-400 mt-1">50-Day SMA, 50-100 MACD, 50-150 MACD, 50-200 MACD Oscillators</div>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <div className="font-bold text-indigo-300">Long-Term (5 Indicators)</div>
                    <div className="text-[11px] text-slate-400 mt-1">100/150/200-Day SMAs, 100-200 MACD, and 200 SMA 20-Day Slope</div>
                  </div>
                </div>
              </div>

              {/* Why Weekly Options */}
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-3">
                <h4 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-1.5 text-cyan-400">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  <span>2. The Power of Weekly Options (Expiry Cadence &amp; Gamma Defense)</span>
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Stocks equipped with <strong>Weekly Options</strong> allow income traders to execute options contracts expiring every Friday, rather than only once a month (3rd Friday). This unlocks three critical advantages:
                </p>
                <ul className="list-disc list-inside text-xs text-slate-300 space-y-1.5 pl-1">
                  <li><strong>Rapid Theta Acceleration:</strong> Time decay exponentially accelerates inside 7–14 DTE, allowing fast profit realization at 50% max profit.</li>
                  <li><strong>Tighter Strike Selection:</strong> Weekly options provide tighter dollar-interval strikes ($0.50 or $1 increments), enabling precise delta anchoring (0.15–0.20Δ).</li>
                  <li><strong>Tactical Rolling Flexibility:</strong> If an underlying equity tests support, weekly contracts can be rolled down and out week-by-week for continuous net credit.</li>
                </ul>
              </div>

              {/* Automated Agent Architecture & CSV Upload */}
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-3">
                <h4 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-1.5 text-amber-300">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span>3. Automated Screener Agent Architecture &amp; CSV Pipelines</span>
                </h4>
                <div className="space-y-2 text-xs text-slate-300">
                  <p>
                    The screener agent (<code className="text-emerald-300 font-mono">src/screener_agents/</code>) uses headless Playwright Chromium to bypass AWS WAF challenges and fetch the exact Barchart view (view 190898).
                  </p>
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 font-mono text-[11px] text-slate-300 space-y-1">
                    <div className="text-emerald-400 font-bold"># CLI Commands:</div>
                    <div>python scripts/run_screener_agent.py --source barchart</div>
                    <div>python scripts/run_screener_agent.py --import-csv path/to/screener.csv</div>
                  </div>
                  <p>
                    <strong>In-Browser CSV Dropzone:</strong> You can also drag-and-drop or upload any CSV downloaded from Barchart or MarketChameleon directly on the <em>Weekly Stock Screeners</em> page for instant client-side parsing and analysis.
                  </p>
                </div>
              </div>

              {/* MarketChameleon.com Screener & Copy-Paste Results */}
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-3">
                <h4 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-1.5 text-purple-400">
                  <Layers className="w-4 h-4 text-purple-400" />
                  <span>4. MarketChameleon.com Screener &amp; 1-Click Copy-Paste Results</span>
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  The <strong>MarketChameleon Screener Agent</strong> (<code className="text-purple-300 font-mono">MarketChameleonScreenerAgent</code>) automatically queries <code className="text-purple-300 font-mono">marketchameleon.com/Screeners/Stocks</code> with the preselected criteria:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
                    <span className="font-bold text-purple-300">Stock Idea:</span> Momentum Stocks<br />
                    <span className="font-bold text-purple-300">Market Cap:</span> Over $1 Billion<br />
                    <span className="font-bold text-purple-300">Options:</span> Has Options Listed
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
                    <span className="font-bold text-purple-300">14-Day RSI:</span> 50 to 70 (Sweet Spot)<br />
                    <span className="font-bold text-purple-300">Volatility:</span> 1-Yr, 20-Day, 1-Day, IV30 &gt; 30<br />
                    <span className="font-bold text-purple-300">MA Technical:</span> Any Bullish (Uptrend / Cross)
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 font-mono text-[11px] text-slate-300 space-y-1">
                  <div className="text-purple-400 font-bold"># CLI Run &amp; Sync:</div>
                  <div>python scripts/run_screener_agent.py --source marketchameleon</div>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  <strong>1-Click Copy Results:</strong> Click <strong>Copy Results (TSV)</strong> in the top toolbar to copy all visible records along with their respective column headings directly to your clipboard, formatted for instant pasting into Excel, Google Sheets, or your trade log.
                </p>
              </div>

              {/* Barchart Custom Watchlist & View 190898 Analysis Engine */}
              <div className="bg-slate-950/60 p-4 rounded-xl border border-amber-800/60 space-y-3">
                <h4 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-1.5 text-amber-400">
                  <Flame className="w-4 h-4 text-amber-400" />
                  <span>5. Barchart Custom Watchlist Agent &amp; View 190898 Analysis Engine</span>
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  The <strong>Barchart Custom Watchlist Agent</strong> (<code className="text-amber-300 font-mono">BarchartCustomWatchlistAgent</code>) lets you ingest any custom set of stock symbols in bulk or individually, querying Barchart to perform analysis and return output identical to <code className="text-amber-300 font-mono">barchart.com/my/watchlist?viewName=190898</code>.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
                    <span className="font-bold text-amber-300">Ingestion Modes:</span> Quick Single Symbol or Bulk Textarea (commas, spaces, newlines, or .txt/.csv file upload).<br />
                    <span className="font-bold text-amber-300">Curated Presets:</span> Mag 7, Semis, CBOE High Vol, AI &amp; Cloud.
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
                    <span className="font-bold text-amber-300">View 190898 Columns:</span> Symbol, Name, Last Price, Net Change, % Change, Barchart Opinion, Opinion Score %, Stability (Previous / Last Week / Last Month), Weekly Options, Options Cadence, Signal Strength, Signal Direction, Recommended Strategy.<br />
                    <span className="font-bold text-amber-300">Resilience:</span> Online WAF-bypass query with automatic fallback to local 13-indicator consensus engine.
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 font-mono text-[11px] text-slate-300 space-y-1">
                  <div className="text-amber-400 font-bold"># CLI Commands:</div>
                  <div>python scripts/run_screener_agent.py --source barchart_custom --symbols &quot;AAPL,NVDA,TSLA,DELL,NOW&quot;</div>
                  <div>python scripts/run_screener_agent.py --source barchart_custom --symbols-file symbols.txt</div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: AI Options Income Screener (Gemini Thinking Mode) */}
          {activeTab === 'AI_OPTIONS_INCOME' && (
            <div className="space-y-6">
              <div className="border-l-2 border-violet-400 pl-4 py-1">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <BrainCircuit className="w-5 h-5 text-violet-400" />
                  <span>AI Options Income Screener (Gemini Extended Thinking)</span>
                </h3>
                <p className="text-slate-400 mt-1">
                  Automated institutional quantitative engine that filters stock screeners (Barchart Direction Strength View 190898, MarketChameleon, or custom CSVs) into high-probability Cash-Secured Put (CSP) and Covered Call (CC) candidates using Gemini 2.5 Flash / 2.0 Pro with extended chain-of-thought reasoning.
                </p>
              </div>

              {/* 4 Quantitative Mandates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-950/70 p-4 rounded-xl border border-violet-500/30 space-y-2">
                  <div className="flex items-center space-x-2 text-violet-300 font-bold text-xs uppercase tracking-wider">
                    <ShieldCheck className="w-4 h-4 text-violet-400" />
                    <span>Cash-Secured Put (CSP) Constraints</span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    <li><strong>DTE:</strong> 5–10 DTE (nearest weekly expiration) for rapid theta decay.</li>
                    <li><strong>Delta:</strong> -0.15 to -0.30 (80%–85% win probability).</li>
                    <li><strong>Downside Cushion:</strong> 3.5% to 6.0% below current spot price.</li>
                    <li><strong>Technical Anchor:</strong> Strike &le; major support (20/50 SMA, swing low).</li>
                    <li><strong>Volatility:</strong> IV Rank &gt; 35% for rich premium harvest.</li>
                    <li><strong>Min AROC:</strong> &ge; 15.0% annualized return on capital.</li>
                  </ul>
                </div>

                <div className="bg-slate-950/70 p-4 rounded-xl border border-indigo-500/30 space-y-2">
                  <div className="flex items-center space-x-2 text-indigo-300 font-bold text-xs uppercase tracking-wider">
                    <TrendingUp className="w-4 h-4 text-indigo-400" />
                    <span>Covered Call (CC) Constraints</span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    <li><strong>DTE:</strong> 5–10 DTE (nearest weekly expiration).</li>
                    <li><strong>Delta:</strong> +0.15 to +0.30 (preserving upside while harvesting theta).</li>
                    <li><strong>Upside Cushion:</strong> Strike &ge; dynamic resistance (upper BB, 50 SMA, swing high).</li>
                    <li><strong>Min AROC:</strong> &ge; 12.0% annualized return on capital.</li>
                    <li><strong>Earnings Blackout:</strong> Absolute rejection if earnings date occurs during cycle.</li>
                    <li><strong>Liquidity:</strong> Open interest &gt; 100, bid/ask spread &le; 10% of bid.</li>
                  </ul>
                </div>
              </div>

              {/* Zero-Billing Guarantee & Pro Plan Bridge */}
              <div className="bg-gradient-to-r from-amber-500/10 via-slate-900 to-amber-500/10 p-4 rounded-xl border border-amber-500/40 space-y-3">
                <div className="flex items-center space-x-2 text-amber-300 font-bold text-xs uppercase tracking-wider">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span>Zero-Billing Guarantee &amp; Personal Pro Plan Bridge ($0 Cost)</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Google Gemini Pro web subscriptions (<code className="px-1.5 py-0.5 rounded bg-slate-800 text-amber-300 font-mono">gemini.google.com</code>) are consumer accounts and are completely separate from developer API billing (<code className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">ai.google.dev</code>). To guarantee you never incur developer API overages, DeltaHarvest offers a 1-click zero-cost workflow:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
                  <div className="p-3 rounded-lg bg-slate-950/80 border border-amber-500/30 space-y-1">
                    <div className="font-bold text-amber-400">Step 1: Copy Prompt</div>
                    <div className="text-[11px] text-slate-300">Click &quot;Copy Prompt for Gemini Pro Plan ($0 Cost)&quot; in the screener header. The system bundles your dataset with the complete institutional quantitative prompt.</div>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-950/80 border border-amber-500/30 space-y-1">
                    <div className="font-bold text-amber-400">Step 2: Paste in Gemini Pro</div>
                    <div className="text-[11px] text-slate-300">Open gemini.google.com in your browser and paste. With Thinking Mode active, Gemini performs deep calculation and outputs valid JSON.</div>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-950/80 border border-amber-500/30 space-y-1">
                    <div className="font-bold text-amber-400">Step 3: Import JSON</div>
                    <div className="text-[11px] text-slate-300">Click &quot;Import Gemini JSON&quot; in the app and paste the model output. The interactive decision matrix and audit log populate instantly!</div>
                  </div>
                </div>
              </div>

              {/* Gemini Extended Thinking Mode */}
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
                <div className="flex items-center space-x-2 text-white font-bold">
                  <BrainCircuit className="w-4 h-4 text-violet-400" />
                  <span>Gemini Extended Thinking Architecture (thinking_level: HIGH)</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  When analyzing option surfaces, standard LLMs often hallucinate delta-to-strike ratios or miss subtle earnings blackout windows. By setting <code className="px-1 py-0.5 rounded bg-slate-800 text-cyan-300 font-mono">thinking_level: HIGH</code>, Gemini spends thousands of internal reasoning tokens cross-referencing support levels, validating AROC math <code className="px-1 py-0.5 rounded bg-slate-800 text-emerald-300 font-mono">((Premium/Strike) * (365/DTE)) * 100</code>, and auditing rejected symbols with clear diagnostic rationale.
                </p>
              </div>

              {/* Dual-Runtime Architecture */}
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
                <div className="flex items-center space-x-2 text-white font-bold">
                  <Layers className="w-4 h-4 text-emerald-400" />
                  <span>Dual-Runtime Production &amp; Local Parity</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <div className="font-bold text-emerald-400">Production (Cloudflare Pages)</div>
                    <div className="text-[11px] text-slate-400 mt-1">Executes on Cloudflare Edge (<code className="text-slate-300 font-mono">/functions/api/analyze-options.js</code>) with 0 server cold starts and automatic free-tier rate limit protection.</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <div className="font-bold text-cyan-400">Local Development (FastAPI)</div>
                    <div className="text-[11px] text-slate-400 mt-1">Executes on FastAPI backend (<code className="text-slate-300 font-mono">POST /api/v1/options/analyze-options</code>) automatically fallback-routed if running without Wrangler.</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 1: Core Strategy Rules */}
          {activeTab === 'STRATEGY_RULES' && (
            <div className="space-y-6">
              <div className="border-l-2 border-emerald-500 pl-4 py-1">
                <h3 className="text-base font-bold text-white">The DeltaHarvest Philosophy</h3>
                <p className="text-slate-400 mt-1">
                  DeltaHarvest is designed for conservative, recurring income. Rather than speculating on direction, we sell out-of-the-money (OTM) options outside statistical volatility boundaries (2 Standard Deviations) with rapid time decay (theta).
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Cash-Secured Put Rules */}
                <div className="bg-slate-950/70 p-4 rounded-xl border border-emerald-500/30 space-y-3">
                  <div className="flex items-center space-x-2 text-emerald-400 font-bold">
                    <ShieldCheck className="w-5 h-5" />
                    <span>Cash-Secured Put (CSP) Criteria</span>
                  </div>
                  <ul className="space-y-2 text-xs text-slate-300">
                    <li className="flex items-start space-x-2">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span><strong>Strike Target:</strong> At or below Lower Bollinger Band (2 SD, 20 SMA).</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span><strong>Delta Range:</strong> Targeting ~0.15 to 0.20 Delta (80%+ statistical probability of expiring OTM).</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span><strong>Volatility:</strong> IV Rank &ge; 45% preferred for elevated option premium.</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span><strong>Safety Cushion:</strong> At least 4.0%–8.0% price buffer down to spot.</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span><strong>Capital Requirement:</strong> 100% cash collateral reserved (Strike &times; 100).</span>
                    </li>
                  </ul>
                </div>

                {/* Covered Call Rules */}
                <div className="bg-slate-950/70 p-4 rounded-xl border border-cyan-500/30 space-y-3">
                  <div className="flex items-center space-x-2 text-cyan-400 font-bold">
                    <TrendingUp className="w-5 h-5" />
                    <span>Covered Call (CC) Criteria</span>
                  </div>
                  <ul className="space-y-2 text-xs text-slate-300">
                    <li className="flex items-start space-x-2">
                      <Check className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                      <span><strong>Strike Target:</strong> At or above Upper Bollinger Band (2 SD, 20 SMA).</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <Check className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                      <span><strong>Delta Range:</strong> Targeting ~0.15 to 0.20 Delta to preserve upside run room.</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <Check className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                      <span><strong>Upside Cushion:</strong> At least 4.0%–7.0% capital appreciation headroom.</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <Check className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                      <span><strong>Return Potential:</strong> Earn instant cash premium plus capital gains if called away.</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Earnings Warning Card */}
              <div className="bg-rose-950/30 p-4 rounded-xl border border-rose-500/40 space-y-2">
                <div className="flex items-center space-x-2 text-rose-400 font-bold text-sm">
                  <AlertTriangle className="w-4 h-4" />
                  <span>The 7-Day Earnings Risk Rule</span>
                </div>
                <p className="text-xs text-rose-200">
                  Binary earnings releases can easily trigger 10%–20% gap moves that blow through technical Bollinger Bands in seconds. <strong>Rule:</strong> Do NOT write weekly CSPs or Covered Calls if earnings fall within 7 days. Wait for the announcement to pass and write after IV crush settles.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: Visual Chart Reading & Strike Positioning */}
          {activeTab === 'CHART_READING' && (
            <div className="space-y-6">
              <div className="border-l-2 border-cyan-500 pl-4 py-1">
                <h3 className="text-base font-bold text-white">Visual Chart Reading &amp; Strike Positioning</h3>
                <p className="text-slate-400 mt-1">
                  How to read candlestick price action against Bollinger Bands and confirm optimal option strike entries.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-950/70 p-4 rounded-xl border border-sky-500/30 space-y-2">
                  <div className="flex items-center space-x-2 text-sky-400 font-bold text-xs">
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
                    <span>20-Day SMA Mean Regression</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    The 20-day Simple Moving Average serves as the equilibrium baseline. Price deviations far above or below the 20 SMA experience strong magnetic mean-reverting pull back toward the center.
                  </p>
                </div>

                <div className="bg-slate-950/70 p-4 rounded-xl border border-emerald-500/30 space-y-2">
                  <div className="flex items-center space-x-2 text-emerald-400 font-bold text-xs">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                    <span>Lower Bollinger Band (2 SD)</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Statistically, 95.4% of all closing prices remain inside the 2 Standard Deviation envelope. Writing Put strikes <strong>below the Lower Band</strong> gives an institutional statistical edge against adverse downward moves.
                  </p>
                </div>

                <div className="bg-slate-950/70 p-4 rounded-xl border border-pink-500/30 space-y-2">
                  <div className="flex items-center space-x-2 text-pink-400 font-bold text-xs">
                    <span className="w-2.5 h-2.5 rounded-full bg-pink-400" />
                    <span>Upper Bollinger Band (2 SD)</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    When a stock rallies to the Upper Band, momentum often stalls or consolidates. Writing Covered Calls <strong>at or above the Upper Band</strong> maximizes upside capital appreciation before potential assignment.
                  </p>
                </div>
              </div>

              {/* Barchart 13-Indicator Opinion & Top 1% Signal Strength Matrix */}
              <div className="bg-slate-950/80 p-4 rounded-xl border border-amber-500/40 space-y-3">
                <div className="font-bold text-amber-300 text-xs uppercase tracking-wider flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Flame className="w-4 h-4 text-amber-400" />
                    <span>Barchart 13-Indicator Opinion &amp; Top 1% Signal Strength Engine</span>
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    13-Study Multi-Timeframe Matrix
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  DeltaHarvest replicates Barchart&apos;s proprietary multi-timeframe analytics, evaluating 13 technical moving averages and MACD oscillators across three distinct time horizons to provide a unified mathematical consensus (-100% to +100%):
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1.5">
                    <div className="font-bold text-cyan-300 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-cyan-400" />
                      <span>Short-Term (4 Indicators)</span>
                    </div>
                    <ul className="text-[11px] text-slate-400 space-y-1 font-mono">
                      <li>• 20-Day SMA vs Price</li>
                      <li>• 20-50 MACD Oscillator</li>
                      <li>• 20-100 MACD Oscillator</li>
                      <li>• 20-200 MACD Oscillator</li>
                    </ul>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1.5">
                    <div className="font-bold text-indigo-300 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-indigo-400" />
                      <span>Medium-Term (4 Indicators)</span>
                    </div>
                    <ul className="text-[11px] text-slate-400 space-y-1 font-mono">
                      <li>• 50-Day SMA vs Price</li>
                      <li>• 50-100 MACD Oscillator</li>
                      <li>• 50-150 MACD Oscillator</li>
                      <li>• 50-200 MACD Oscillator</li>
                    </ul>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1.5">
                    <div className="font-bold text-purple-300 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-purple-400" />
                      <span>Long-Term (5 Indicators)</span>
                    </div>
                    <ul className="text-[11px] text-slate-400 space-y-1 font-mono">
                      <li>• 100-Day SMA vs Price</li>
                      <li>• 150-Day SMA vs Price</li>
                      <li>• 200-Day SMA vs Price</li>
                      <li>• 100-200 MACD Oscillator</li>
                      <li>• 200 SMA 20-Day Slope</li>
                    </ul>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-amber-950/30 border border-amber-500/30 text-xs text-amber-200 space-y-1.5">
                  <div className="font-bold flex items-center gap-1 text-amber-300">
                    <Flame className="w-4 h-4 text-amber-400" />
                    <span>Top 1% Signal Strength Qualification Criteria:</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    A security qualifies for the glowing <strong className="text-amber-300">🔥 Top 1% Buy</strong> badge when it satisfies two strict mathematical criteria:
                    <br />
                    1. <strong>Unanimous 100% Buy (13/13 votes)</strong> across all short, medium, and long-term indicators.
                    <br />
                    2. <strong>Maximum Historical Trend Consistency</strong>: Closing price held above the 50-Day SMA for &ge;90% of the preceding 60 trading days with <em>Strongest</em> momentum direction.
                  </p>
                </div>
              </div>

              {/* Confluence Checklist */}
              <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  <span>The 4-Step Confluence Checklist for Writing Cash-Secured Puts</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                    <div className="font-bold text-emerald-400">Step 1: Candlestick Test of Lower Band</div>
                    <p className="text-slate-400 text-[11px]">Look for long bottom wicks or hammer candles piercing and rejecting the Lower Bollinger Band.</p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                    <div className="font-bold text-emerald-400">Step 2: 14-Day Blended RSI Oversold Check</div>
                    <p className="text-slate-400 text-[11px]">
                      Uses 50/50 Blended RSI (50% Wilder RMA + 50% Cutler SMA). RSI &le; 35 indicates selling exhaustion, reducing the likelihood of sustained immediate breakdown.
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                    <div className="font-bold text-emerald-400">Step 3: Elevated IV Rank (&ge; 45%)</div>
                    <p className="text-slate-400 text-[11px]">Ensure option premium is historically rich so theta decay pays handsomely for your risk.</p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                    <div className="font-bold text-emerald-400">Step 4: Confirm 4%–8% Cushion to Strike</div>
                    <p className="text-slate-400 text-[11px]">Verify that the visual green dotted strike line sits comfortably outside the daily ATR noise band.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Multi-Leg Spreads & Volatility Skew */}
          {activeTab === 'SPREADS_SKEW' && (
            <div className="space-y-6">
              <div className="border-l-2 border-emerald-500 pl-4 py-1">
                <h3 className="text-base font-bold text-white">Defined-Risk Vertical Spreads, Iron Condors &amp; Volatility Skew</h3>
                <p className="text-slate-400 mt-1">
                  How DeltaHarvest preserves the conservative 0.15–0.20 Delta rule while reducing capital collateral requirements by up to 90%.
                </p>
              </div>

              {/* Strict Retention of 0.15 - 0.20 Delta Rule */}
              <div className="bg-emerald-950/20 p-4 rounded-xl border border-emerald-500/40 space-y-2">
                <div className="flex items-center space-x-2 text-emerald-400 font-bold text-sm">
                  <ShieldCheck className="w-5 h-5" />
                  <span>The Fundamental Pillar: 0.15 to 0.20 Delta Short Leg Rule</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  In single-leg Cash-Secured Puts, selling a 0.15–0.20 Delta option ensures an ~80%–85% probability of expiring Out of the Money outside the 2 SD Bollinger Band envelope. 
                  When upgrading to <strong>Multi-Leg Vertical Spreads</strong>, DeltaHarvest <em>strictly retains this exact same 0.15–0.20 Delta anchor</em> for the short leg. We then buy a cheaper, further OTM wing (0.05–0.08 Delta) to cap maximum risk.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Bull Put Credit Spread */}
                <div className="bg-slate-950/70 p-4 rounded-xl border border-emerald-500/30 space-y-2">
                  <div className="flex items-center space-x-2 text-emerald-400 font-bold text-xs">
                    <TrendingUp className="w-4 h-4" />
                    <span>Bull Put Credit Spread</span>
                  </div>
                  <ul className="text-xs text-slate-300 space-y-1.5 list-disc pl-4">
                    <li><strong>Sell:</strong> Put at 0.15–0.20 Delta (&le; Lower Bollinger Band).</li>
                    <li><strong>Buy:</strong> Protective Put 1–2 strikes lower ($1–$5 width).</li>
                    <li><strong>Advantage:</strong> Slashes collateral from $50,000 to $400 while keeping 80%+ win rate.</li>
                  </ul>
                </div>

                {/* Bear Call Credit Spread */}
                <div className="bg-slate-950/70 p-4 rounded-xl border border-cyan-500/30 space-y-2">
                  <div className="flex items-center space-x-2 text-cyan-400 font-bold text-xs">
                    <TrendingUp className="w-4 h-4" />
                    <span>Bear Call Credit Spread</span>
                  </div>
                  <ul className="text-xs text-slate-300 space-y-1.5 list-disc pl-4">
                    <li><strong>Sell:</strong> Call at 0.15–0.20 Delta (&ge; Upper Bollinger Band).</li>
                    <li><strong>Buy:</strong> Protective Call 1–2 strikes higher ($1–$5 width).</li>
                    <li><strong>Advantage:</strong> Defined-risk bearish income harvest without unlimited short call upside danger.</li>
                  </ul>
                </div>

                {/* Iron Condor */}
                <div className="bg-slate-950/70 p-4 rounded-xl border border-purple-500/30 space-y-2">
                  <div className="flex items-center space-x-2 text-purple-400 font-bold text-xs">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Iron Condor (Dual Wing)</span>
                  </div>
                  <ul className="text-xs text-slate-300 space-y-1.5 list-disc pl-4">
                    <li><strong>Combine:</strong> 0.15–0.20 Delta Put Spread + 0.15–0.20 Delta Call Spread.</li>
                    <li><strong>Margin Efficiency:</strong> Margin is required for only ONE wing, while collecting double premium!</li>
                    <li><strong>Ideal Environment:</strong> Range-bound high IV Rank assets outside earnings.</li>
                  </ul>
                </div>
              </div>

              {/* 25-Delta Skew & Term Structure */}
              <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-2">
                  <Activity className="w-4 h-4 text-cyan-400" />
                  <span>Interpreting 25-Delta Volatility Skew &amp; Term Structure</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                    <div className="font-bold text-emerald-400">Put vs Call 25Δ Skew Spread (&gt; +4.0%)</div>
                    <p className="text-slate-400 text-[11px]">
                      In equities, downside fear creates a steep volatility smirk where Puts trade significantly more expensive than Calls. Selling Puts or Bull Put Spreads captures this rich fear premium.
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                    <div className="font-bold text-amber-400">Term Structure Inversion (Backwardation)</div>
                    <p className="text-slate-400 text-[11px]">
                      When 7D Weekly IV exceeds 30D/60D IV, the market is pricing acute near-term binary risk (e.g. imminent earnings). Exercise extreme caution or wait until IV crush occurs post-event.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Fundamental Solvency, Altman Z-Score & CEF Anatomy */}
          {activeTab === 'SOLVENCY_CEF' && (
            <div className="space-y-6">
              <div className="border-l-2 border-indigo-500 pl-4 py-1">
                <h3 className="text-base font-bold text-white">Fundamental Solvency, Altman Z-Score &amp; CEF Anatomy</h3>
                <p className="text-slate-400 mt-1">
                  Protecting option sellers from balance-sheet bankruptcy risks and understanding CEF income mechanics.
                </p>
              </div>

              {/* Altman Z-Score Rule */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-950/70 p-4 rounded-xl border border-emerald-500/30 space-y-2">
                  <div className="flex items-center space-x-2 text-emerald-400 font-bold text-xs">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Safe Zone (Z &gt; 2.99)</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Zero statistical probability of financial distress over the next 24 months. Ideal for writing conservative Cash-Secured Puts and Bull Put Spreads.
                  </p>
                </div>

                <div className="bg-slate-950/70 p-4 rounded-xl border border-amber-500/30 space-y-2">
                  <div className="flex items-center space-x-2 text-amber-400 font-bold text-xs">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Grey Zone (1.81 &le; Z &le; 2.99)</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Moderate leverage or cyclical earnings volatility. Options writing is acceptable but requires strict position sizing and stops.
                  </p>
                </div>

                <div className="bg-slate-950/70 p-4 rounded-xl border border-rose-500/30 space-y-2">
                  <div className="flex items-center space-x-2 text-rose-400 font-bold text-xs">
                    <ShieldAlert className="w-4 h-4" />
                    <span>Distress Alert (Z &lt; 1.81)</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Elevated insolvency risk. <strong>Rule:</strong> Never sell Cash-Secured Puts on distress companies; technical Bollinger Bands offer zero protection during corporate bankruptcy.
                  </p>
                </div>
              </div>

              {/* Piotroski F-Score & SEC EDGAR */}
              <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  <span>Piotroski F-Score (0 to 9) &amp; SEC 10-K Filings</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                    <div className="font-bold text-emerald-400">Piotroski Score 7–9 (Elite Quality)</div>
                    <p className="text-slate-400 text-[11px]">
                      Measures 9 fundamental signals: positive ROA, expanding operating cash flow, decreasing leverage, and improving gross margins. Companies scoring 7–9 are institutional cash generators.
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                    <div className="font-bold text-blue-400">Direct SEC EDGAR 10-K &amp; 10-Q Verification</div>
                    <p className="text-slate-400 text-[11px]">
                      Clicking any EDGAR link takes you directly to the company's official SEC filings browser to review audited footnotes, debt maturities, and 13F institutional ownership schedules.
                    </p>
                  </div>
                </div>
              </div>

              {/* Closed-End Fund (CEF) Analytics */}
              <div className="bg-slate-950/80 p-4 rounded-xl border border-indigo-500/30 space-y-3">
                <div className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-indigo-400" />
                  <span>Closed-End Fund (CEF) Valuation &amp; Return of Capital (RoC)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                    <div className="font-bold text-cyan-400">Discount to NAV &amp; 52-Week Z-Score</div>
                    <p className="text-slate-400 text-[11px]">
                      When a quality income fund trades at a discount to its Net Asset Value with a negative 52-week Z-score (&le; -1.5), buyers acquire underlying income assets below liquidation value.
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                    <div className="font-bold text-amber-300">Constructive vs Destructive Return of Capital</div>
                    <p className="text-slate-400 text-[11px]">
                      <strong>Constructive RoC:</strong> Fund uses options cash flow and unrealized gains to defer taxes without harming NAV.<br />
                      <strong>Destructive RoC:</strong> Fund pays dividends from its own capital base, steadily cannibalizing share price.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: Systematic Options Backtesting & Margin Stress Testing */}
          {activeTab === 'BACKTEST_MARGIN' && (
            <div className="space-y-6">
              <div className="border-l-2 border-purple-500 pl-4 py-1">
                <h3 className="text-base font-bold text-white">Systematic Options Backtesting &amp; FINRA 4210 Margin Stress Testing</h3>
                <p className="text-slate-400 mt-1">
                  Empirical edge of 0.15–0.20 Delta harvesting and protecting capital against forced margin liquidations.
                </p>
              </div>

              {/* Backtest Alpha Advantage */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-950/70 p-4 rounded-xl border border-emerald-500/30 space-y-2">
                  <div className="flex items-center space-x-2 text-emerald-400 font-bold text-xs">
                    <TrendingUp className="w-4 h-4" />
                    <span>The Mathematical Edge of 0.15–0.20 Delta</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Options pricing models systematically overestimate future realized volatility. By consistently selling options 1 to 2 standard deviations OTM (outside Bollinger Bands with 0.15–0.20 Delta), option sellers harvest an average <strong>85%–88% win rate</strong> while capturing positive theta decay each week.
                  </p>
                </div>

                <div className="bg-slate-950/70 p-4 rounded-xl border border-purple-500/30 space-y-2">
                  <div className="flex items-center space-x-2 text-purple-400 font-bold text-xs">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Shallower Drawdowns vs Buy &amp; Hold</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Because net premium collected acts as a continuous cash cushion, systematic DeltaHarvest strategies experience roughly <strong>half the maximum drawdown</strong> of pure equity buy-and-hold during broad market downturns, delivering Sharpe ratios &gt; 1.5.
                  </p>
                </div>
              </div>

              {/* FINRA 4210 Reg-T vs. Portfolio Margin */}
              <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-2">
                  <Activity className="w-4 h-4 text-cyan-400" />
                  <span>Understanding FINRA 4210: Reg-T vs. Portfolio Margin (TIMS)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                    <div className="font-bold text-slate-200">Standard Reg-T (100% Collateral)</div>
                    <p className="text-slate-400 text-[11px]">
                      Under standard retail margin rules, writing a Cash-Secured Put requires reserving 100% of the strike price in cash (e.g. $59,000 for 1 contract of SPY at $590). This limits capital velocity but guarantees zero margin call risk.
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                    <div className="font-bold text-emerald-400">Portfolio Margin (TIMS Shock Valuation)</div>
                    <p className="text-slate-400 text-[11px]">
                      Available on qualified accounts ($110k+ net equity), Portfolio Margin models portfolio risk by simulating a &plusmn;15% price shock. Collateral requirements drop by <strong>80%–85%</strong>, permitting institutional-grade capital efficiency.
                    </p>
                  </div>
                </div>
              </div>

              {/* Stress Testing & Black Swan Preparedness */}
              <div className="bg-slate-950/80 p-4 rounded-xl border border-amber-500/30 space-y-3">
                <div className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span>Stress Testing for -10% Corrections &amp; -20% Black Swan Shocks</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  During sharp market crashes, two forces hit short options simultaneously: <strong>gamma expansion</strong> (delta increases as spot plunges toward the strike) and <strong>IV expansion</strong> (implied volatility spikes by 40%–60%). Our stress test tool simulates these exact dual shocks so you know in advance how much excess equity you need to survive severe market distress without receiving an automated broker liquidation call.
                </p>
              </div>
            </div>
          )}

          {/* TAB: Institutional Order Staging & Execution */}
          {activeTab === 'BROKER_EXECUTION' && (
            <div className="space-y-6">
              <div className="border-l-2 border-amber-500 pl-4 py-1">
                <h3 className="text-base font-bold text-white">Institutional Order Staging, Bracket Execution &amp; Risk Circuit Breakers</h3>
                <p className="text-slate-400 mt-1">
                  Bridging quantitative screening directly into error-free brokerage execution for Charles Schwab, Interactive Brokers (IBKR), and Thinkorswim.
                </p>
              </div>

              {/* The 80% Profit-Decay Rule & Defensive Roll Rule */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-950/70 p-4 rounded-xl border border-amber-500/30 space-y-2">
                  <div className="flex items-center space-x-2 text-amber-400 font-bold text-xs">
                    <Check className="w-4 h-4" />
                    <span>The Mandatory 80% Profit-Taking Bracket</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Options decay non-linearly. The last 20% of premium carries disproportionate tail risk for minuscule incremental yield. DeltaHarvest automatically stages a <strong>Good-Til-Cancelled (GTC) Buy-to-Close Limit Order at 20% of the initial premium collected</strong> (0.20 &times; Entry Price). This locks in 80% maximum profit, cleanses portfolio margin, and frees capital for the next cycle.
                  </p>
                </div>

                <div className="bg-slate-950/70 p-4 rounded-xl border border-rose-500/30 space-y-2">
                  <div className="flex items-center space-x-2 text-rose-400 font-bold text-xs">
                    <ShieldAlert className="w-4 h-4" />
                    <span>0.50 Delta / 200% Defensive Roll Trigger</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    If an underlying drops toward your put strike and the contract delta touches <strong>0.50</strong> (or option price doubles to 200% of entry premium), the defensive rule triggers: <strong>never take assignment passively</strong>. Roll the contract out in time (to the next monthly cycle) and down in strike for an additional net credit to restore delta neutrality.
                  </p>
                </div>
              </div>

              {/* Multi-Broker Protocols Breakdown */}
              <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span>Multi-Broker Execution Protocols</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                    <div className="font-bold text-blue-400">Charles Schwab Retail Trader API</div>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      Conforms to Schwab's REST order schema. Staged as a <code className="text-slate-300">TRIGGER</code> complex order: primary limit fill immediately schedules the 80% profit-taking child order. Supports direct 1-click transmission.
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                    <div className="font-bold text-rose-400">Interactive Brokers (TWS BasketTrader)</div>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      Exports compliant <code className="text-slate-300">.csv</code> files formatted for TWS BasketTrader. Traders can drag and drop multiple staged legs directly into TWS for synchronized limit execution.
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                    <div className="font-bold text-emerald-400">Thinkorswim (ToS) Syntax</div>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      Outputs standard 1-line copyable execution text (e.g. <code className="text-slate-300">SELL -1 SPY 100 18 OCT 26 550 PUT @2.85 LMT</code>) ready for instantaneous paste into Thinkorswim's Order Entry bar.
                    </p>
                  </div>
                </div>
              </div>

              {/* Position Sizing & Concentration Guardrail */}
              <div className="bg-slate-950/80 p-4 rounded-xl border border-emerald-500/30 space-y-2">
                <div className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>The 10% Single-Underlying Concentration Guardrail</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  No single option assignment should ever consume more than <strong>10% of total portfolio equity</strong>. When staging orders, DeltaHarvest automatically calculates required margin against your account equity and flags a yellow or red circuit-breaker warning if position sizing violates institutional diversification limits.
                </p>
              </div>
            </div>
          )}

          {/* TAB 7: Prediction Markets & Contextual Sentiment */}
          {activeTab === 'CONTEXT_SENTIMENT' && (
            <div className="space-y-6">
              <div className="border-l-2 border-cyan-500 pl-4 py-1">
                <h3 className="text-base font-bold text-white">Contextual Intelligence: Prediction Markets &amp; Retail Sentiment</h3>
                <p className="text-slate-400 mt-1">
                  Layered multi-source signals surfaced inside each ticker's Audit tab — enriching options decisions with crowd wisdom, professional consensus, and social heat.
                </p>
              </div>

              {/* Analyst Price Target Bar */}
              <div className="bg-slate-950/70 p-4 rounded-xl border border-emerald-500/30 space-y-3">
                <div className="flex items-center space-x-2 text-emerald-400 font-bold text-xs">
                  <TrendingUp className="w-4 h-4" />
                  <span>Analyst Price Target Bar (Audit Tab → News &amp; Analyst)</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                    <div className="font-bold text-white">How to Read It</div>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      A horizontal track displays the Wall Street <strong>Low / Mean / High</strong> price targets from all covering analysts. A needle marks the current spot price. The consensus upside % callout tells you how far below mean the stock is trading.
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                    <div className="font-bold text-emerald-400">Why It Matters for CSP Writers</div>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      If spot price is at or below the analyst low target, the market is already pricing in extreme pessimism. This context reduces assignment risk for a conservative OTM put writer near the Lower Bollinger Band.
                    </p>
                  </div>
                </div>
              </div>

              {/* Prediction Market Cards */}
              <div className="bg-slate-950/70 p-4 rounded-xl border border-purple-500/30 space-y-3">
                <div className="flex items-center space-x-2 text-purple-400 font-bold text-xs">
                  <BarChart2 className="w-4 h-4" />
                  <span>Prediction Market Analytics &amp; Term Structure (Audit Tab → Prediction Markets)</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                    <div className="font-bold text-white">Kalshi (CFTC Regulated) &amp; Polymarket</div>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      CFTC-regulated USD contracts and decentralized USDC orderbooks. Binary (Yes/No) contracts representing real capital backing specific corporate combinations, earnings hurdles, and policy timelines.
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                    <div className="font-bold text-cyan-400">Multi-Year Term Structures</div>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      Models complex multi-horizon catalysts (such as SPCX / TSLA strategic combination or Robotaxi regulatory clearance) across 2025, 2026, 2027, and 2028+. Computes cumulative odds, marginal density (+Δ%), and annualized hazard rates.
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                    <div className="font-bold text-blue-400">PMCI Scoring Engine (0-100)</div>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      Weighted composite score factoring CFTC regulation weighting (1.20x), decentralized orderbook depth (1.15x), and volume logarithmic scaling to compute true market confidence.
                    </p>
                  </div>
                </div>
                <div className="bg-cyan-950/30 p-3 rounded-lg border border-cyan-500/30 text-xs text-cyan-300">
                  <strong>Options Coupling Rule:</strong> When near-term (&lt;12M) catalyst hazard rate is low (&lt;25%), short put assignments are protected, creating an optimal Cash-Secured Put (CSP) harvesting window. When multi-year cumulative odds exceed 60%, long LEAPS call spreads offer asymmetric convexity.
                </div>
              </div>

              {/* Social Sentiment Gauge */}
              <div className="bg-slate-950/70 p-4 rounded-xl border border-cyan-500/30 space-y-3">
                <div className="flex items-center space-x-2 text-amber-400 font-bold text-xs">
                  <Activity className="w-4 h-4" />
                  <span>Social Sentiment Velocity Score (SSVS) &amp; Multi-Channel Matrix</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                    <div className="font-bold text-emerald-400">StockTwits &amp; Reddit WSB</div>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      Live ratio of Bullish vs. Bearish Cashtag messages and Reddit /r/wallstreetbets trending rank. Computes retail volume velocity (z-scores) to detect viral momentum surges.
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                    <div className="font-bold text-amber-400">SSVS Composite (0-100)</div>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      Blends StockTwits (30%), Reddit (20%), X/Twitter Cashtags (20%), Seeking Alpha Quant (15%), and TradingView 26-Indicator Consensus (15%) into a single momentum index.
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                    <div className="font-bold text-purple-400">Retail Flow Divergence</div>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      Flags divergence between retail hype and fundamental/technical factors. Detects FOMO exhaustions, short squeeze warnings, or constructive smart money accumulation.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: Live Streaming & Risk Circuit-Breakers */}
          {activeTab === 'LIVE_STREAMING_RISK' && (
            <div className="space-y-6">
              <div className="border-l-2 border-rose-500 pl-4 py-1">
                <h3 className="text-base font-bold text-white">Live API Streaming, FastAPI Backend &amp; Quantitative Risk Circuit-Breakers</h3>
                <p className="text-slate-400 mt-1">
                  How the system fetches real-time data, calculates high-precision Greeks, and enforces portfolio-level safety gates before you place any order.
                </p>
              </div>

              {/* Live Data Architecture */}
              <div className="bg-slate-950/70 p-4 rounded-xl border border-blue-500/30 space-y-3">
                <div className="flex items-center space-x-2 text-blue-400 font-bold text-xs">
                  <Zap className="w-4 h-4" />
                  <span>FastAPI Live Snapshot &amp; WebSocket Stream</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                    <div className="font-bold text-white">REST Snapshot: <code className="text-slate-400">/api/v1/options/snapshot</code></div>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      When the FastAPI backend is running (<code>python main.py --serve</code>), the Web UI fetches a live enriched options snapshot via REST. This includes real IV rank, current Greeks, and latest news context directly from market data providers.
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                    <div className="font-bold text-cyan-400">WebSocket Stream: <code className="text-slate-400">/api/v1/ws/stream</code></div>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      A persistent WebSocket connection pushes real-time option chain updates to the UI. When disconnected (backend offline), the UI automatically falls back to the last cached local JSON snapshot — no hard crash.
                    </p>
                  </div>
                </div>
              </div>

              {/* Tradier Fallback */}
              <div className="bg-slate-950/70 p-4 rounded-xl border border-teal-500/30 space-y-2">
                <div className="flex items-center space-x-2 text-teal-400 font-bold text-xs">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Tradier API — Secondary Data Source Fallback</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  If your Charles Schwab OAuth session is not yet authenticated or is offline, the system automatically falls back to <strong>Tradier</strong> for live options chains and US equity quotes. Configure your Tradier API token in <code className="text-slate-400">.env</code> as <code className="text-slate-400">TRADIER_TOKEN</code>. This ensures zero data gap during Schwab re-authorization cycles.
                </p>
              </div>

              {/* Automated API Self-Test Diagnostic Suite */}
              <div className="bg-slate-950/70 p-4 rounded-xl border border-emerald-500/40 space-y-3">
                <div className="flex items-center space-x-2 text-emerald-400 font-bold text-xs">
                  <Activity className="w-4 h-4" />
                  <span>Interactive API Self-Test &amp; Health Suite (Header → API Self-Test)</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  DeltaHarvest includes an integrated, zero-script <strong>Automated Self-Test Engine</strong> accessible anytime from the top navigation bar. In a single click, it sends live probe requests across all 4 system feeds:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="font-bold text-blue-400">1. Charles Schwab Trader API:</span>
                    <p className="text-[11px] text-slate-400 mt-0.5">Validates OAuth credentials, token expiration, and probes live NBBO quotes &amp; Greeks with millisecond latency measurement.</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="font-bold text-emerald-400">2. Market Data &amp; Bollinger Engine:</span>
                    <p className="text-[11px] text-slate-400 mt-0.5">Pings live tick streams, validating 20 SMA, 2-SD Bollinger Bands, and Blended 14-RSI calculations.</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="font-bold text-cyan-400">3. Prediction Markets Oracle:</span>
                    <p className="text-[11px] text-slate-400 mt-0.5">Probes Polymarket &amp; Manifold decentralized contract order books and verifies real-time probability resolution.</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="font-bold text-amber-400">4. Social Sentiment NLP Pipeline:</span>
                    <p className="text-[11px] text-slate-400 mt-0.5">Tests StockTwits message streams and Reddit WSB sentiment parsers, extracting live crowd volume rankings.</p>
                  </div>
                </div>
              </div>

              {/* QuantLib Greeks */}
              <div className="bg-slate-950/70 p-4 rounded-xl border border-purple-500/30 space-y-3">
                <div className="flex items-center space-x-2 text-purple-400 font-bold text-xs">
                  <Activity className="w-4 h-4" />
                  <span>High-Precision Greeks Engine (BSM/BAW Analytical)</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                    <div className="font-bold text-white">Black-Scholes-Merton (European)</div>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      Used for index options (SPX, XSP) and European-style contracts. Delivers exact closed-form Delta, Gamma, Theta, Vega, and Rho. IV is solved by bisection on market price.
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                    <div className="font-bold text-amber-300">Barone-Adesi-Whaley (American)</div>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      Used for all equity options (SPY, NVDA, AAPL, etc.) that carry <strong>early exercise risk</strong>. The BAW model calculates an early exercise premium above BSM value. Deep in-the-money puts near ex-dividend dates are flagged with an early assignment probability score.
                    </p>
                  </div>
                </div>
              </div>

              {/* Risk Circuit-Breakers */}
              <div className="bg-slate-950/80 p-4 rounded-xl border border-rose-500/40 space-y-3">
                <div className="font-bold text-rose-300 text-xs uppercase tracking-wider flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                  <span>Portfolio Risk Circuit-Breakers — Automatic Order Gates</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-slate-900 border border-rose-500/30 space-y-1">
                    <div className="font-bold text-rose-300">Max Drawdown Halt</div>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      If the portfolio's unrealized mark-to-market drawdown exceeds a configurable threshold (default: 15%), the circuit-breaker blocks all new order staging and raises a visible red alert. No new positions until drawdown recovers.
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900 border border-amber-500/30 space-y-1">
                    <div className="font-bold text-amber-300">Delta Neutrality Bounds</div>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      Tracks aggregate portfolio net Delta. If the portfolio drifts too directional (e.g. aggregate Delta below -0.30 or above +0.30), new orders in the same direction are blocked to maintain near-neutral risk posture.
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-700 space-y-1">
                    <div className="font-bold text-slate-200">Single-Underlying Concentration Cap</div>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      No single ticker may represent more than <strong>10% of total portfolio equity at risk</strong>. The staging engine calculates required collateral against account size and warns (yellow) or blocks (red) the order if the concentration limit would be breached.
                    </p>
                  </div>
                </div>
                <div className="bg-rose-950/30 p-3 rounded-lg border border-rose-500/30 text-xs text-rose-300">
                  <strong>Rule:</strong> Circuit-breaker thresholds are set in <code className="text-rose-200">.env</code> via <code className="text-rose-200">RISK_MAX_DRAWDOWN_PCT</code>, <code className="text-rose-200">RISK_MAX_DELTA_EXPOSURE</code>, and <code className="text-rose-200">RISK_MAX_SINGLE_UNDERLYING_PCT</code>. All default to conservative values — tighten them, never loosen beyond your personal risk tolerance.
                </div>
              </div>
            </div>
          )}

          {/* TAB 9: Expiration Cadence Guide */}
          {activeTab === 'CADENCE_GUIDE' && (
            <div className="space-y-6">
              <div className="border-l-2 border-teal-500 pl-4 py-1">
                <h3 className="text-base font-bold text-white">Expiration Cadence &amp; CBOE Weeklys Registry</h3>
                <p className="text-slate-400 mt-1">
                  Understanding why some tickers expire every Friday while others only trade once a month on the 3rd Friday.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-950/70 p-4 rounded-xl border border-emerald-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-400">Weekly &amp; Intra-Week Cadence</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                      3–5 DTE Ideal
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Tickers in the official <strong>CBOE Available Weeklys Directory</strong> (such as SPY, QQQ, NVDA, AAPL, PLTR, TSLA) feature expirations every single Friday, and in some cases daily (Monday, Wednesday, Friday).
                  </p>
                  <div className="text-xs text-emerald-300 bg-emerald-950/40 p-2.5 rounded-lg border border-emerald-500/20">
                    ✓ <strong>Theta Decay Acceleration:</strong> Writing 3–5 DTE options captures the steepest portion of the exponential theta decay curve.
                  </div>
                </div>

                <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-700 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-300">Monthly Only Cadence</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                      Standard 3rd Friday
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Tickers not registered in the CBOE Weeklys directory (such as <strong>JEPI</strong> and <strong>BLZE</strong>) only trade standard monthly contracts expiring on the <strong>3rd Friday of each month</strong> (typically 15–45 DTE).
                  </p>
                  <div className="text-xs text-amber-300 bg-amber-950/40 p-2.5 rounded-lg border border-amber-500/30">
                    ⚠️ <strong>Adjusted DTE Strategy:</strong> DeltaHarvest automatically recognizes monthly-only cycles, targets the nearest 3rd Friday, and normalizes annualized yields to the true DTE.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Greeks & Math Formulas */}
          {activeTab === 'GREEKS_FORMULAS' && (
            <div className="space-y-6">
              <div className="border-l-2 border-cyan-500 pl-4 py-1">
                <h3 className="text-base font-bold text-white">Options Greeks &amp; Yield Calculations</h3>
                <p className="text-slate-400 mt-1">
                  Formulas and practical interpretation for systematic risk management.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                  <div className="font-bold text-white text-xs">Delta (&Delta;)</div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Rate of change in option price per $1 move in underlying. Used as a close proxy for probability of expiring In-The-Money (ITM). Target: <strong>0.15–0.20</strong>.
                  </div>
                </div>

                <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                  <div className="font-bold text-white text-xs">Theta (&Theta;)</div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Daily cash erosion of option premium. As option sellers, Theta is our primary edge, accelerating exponentially inside the final 7 days before expiration.
                  </div>
                </div>

                <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                  <div className="font-bold text-white text-xs">IV Rank (IVR %)</div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Percentile ranking of current Implied Volatility against its 52-week high and low:
                    <div className="font-mono text-emerald-400 mt-1 text-[10px]">
                      (IV - IV_low) / (IV_high - IV_low) &times; 100
                    </div>
                  </div>
                </div>

                <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                  <div className="font-bold text-white text-xs">Return on Capital (ROC)</div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Net cash yield per contract relative to collateral:
                    <div className="font-mono text-cyan-400 mt-1 text-[10px]">
                      (Premium / Strike) &times; 100
                    </div>
                  </div>
                </div>

                <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                  <div className="font-bold text-white text-xs">Annualized ROC %</div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Compounding rate normalized across the year:
                    <div className="font-mono text-emerald-400 mt-1 text-[10px]">
                      ROC &times; (365 / DTE)
                    </div>
                  </div>
                </div>

                <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                  <div className="font-bold text-white text-xs">Probability of Profit (POP %)</div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Statistical likelihood of trade expiring worthless or profitable based on Black-Scholes normal distribution.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Liquidity Tiers */}
          {activeTab === 'LIQUIDITY_TIERS' && (
            <div className="space-y-6">
              <div className="border-l-2 border-amber-500 pl-4 py-1">
                <h3 className="text-base font-bold text-white">Liquidity Tiers &amp; Execution Slippage Rules</h3>
                <p className="text-slate-400 mt-1">
                  Bid-ask spread widths determine your real-world fill prices. Never use market orders on illiquid options chains.
                </p>
              </div>

              <div className="space-y-3">
                <div className="bg-slate-950/70 p-3.5 rounded-xl border border-emerald-500/30 flex items-start space-x-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 mt-1 shrink-0" />
                  <div>
                    <div className="font-bold text-white text-xs">Tier 1: Ultra-Liquid (SPY, QQQ, NVDA, AAPL, MSFT, TSLA)</div>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Penny-wide bid/ask spreads ($0.01–$0.03). Instant fills near mid price with institutional market maker depth. Low execution friction.
                    </p>
                  </div>
                </div>

                <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 flex items-start space-x-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-400 mt-1 shrink-0" />
                  <div>
                    <div className="font-bold text-white text-xs">Tier 2/3: Moderate Retail Liquidity (PLTR, IONQ, NET, RTX, SCHD, SPCX)</div>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Spreads generally $0.05 to $0.15. Work limit orders at midpoint. If unfilled after 5 minutes, adjust by 1–2 cents toward the bid/ask.
                    </p>
                  </div>
                </div>

                <div className="bg-slate-950/70 p-3.5 rounded-xl border border-rose-500/40 flex items-start space-x-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-400 mt-1 shrink-0" />
                  <div>
                    <div className="font-bold text-rose-300 text-xs">Tier 4: Small-Cap &amp; Wide Spread Warning (AXTI, BLZE, ZETA)</div>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Spreads can reach $0.20 to $0.60, representing 10%–25% of the total option premium. <strong>STRICT RULE:</strong> Always use limit orders at the midpoint. NEVER submit market orders, or slippage will eliminate your profit margin.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: Shortcuts & FAQ */}
          {activeTab === 'SHORTCUTS_FAQ' && (
            <div className="space-y-6">
              <div className="border-l-2 border-purple-500 pl-4 py-1">
                <h3 className="text-base font-bold text-white">Global Shortcuts &amp; Frequently Asked Questions</h3>
                <p className="text-slate-400 mt-1">
                  Speed up your workflow using built-in keyboard hotkeys.
                </p>
              </div>

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
                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-1">
                  <div className="text-xs font-bold text-white">How does the Koyfin / TradingView Institutional Terminal Architecture work?</div>
                  <p className="text-xs text-slate-400">
                    The platform is engineered as a high-density institutional workstation: (1) <strong>Top Macro Bar</strong> features real-time macro tape tracking SPY, QQQ, DIA, IWM, and VIX with dynamic percentage change badges, live NYSE trading status (OPEN/CLOSED), and data sync clocks; (2) <strong>Collapsible Left Command Rail</strong> provides quick access to Signals Matrix, Watchlists, Options Income Scanner, Archive &amp; Backtests, and Settings &amp; API Keys; (3) <strong>Executive Decision Matrix</strong> utilizes a <code>table-fixed</code> zero-shift layout with 10 explicit dimensions including options setups (CSP / CC annualized yield) and monospace tabular numbers; (4) <strong>550px Slide-Over Ticker Inspector</strong> provides deep dive with 50-day TradingView candlestick charts, Entry/Target/Stop horizontal overlays, structured Bull/Bear/Catalyst thesis, and actionable options bracket protocols.
                  </p>
                </div>

                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-1">
                  <div className="text-xs font-bold text-white">How does Automated Watchlist Hydration &amp; Screener Quality Control work?</div>
                  <p className="text-xs text-slate-400">
                    Immediately upon adding any symbol (e.g. <code>EOSE</code>) to a watchlist, DeltaHarvest automatically triggers a background hydration pipeline: (1) Fetches real-time price, volume, and percentage change via the quote API; (2) Retrieves 50-day daily OHLCV history; (3) Dynamically derives 20 EMA, 50 EMA, 14-period RSI, and 14-period ATR; (4) Enforces a strict <strong>Quality Control Gate</strong> in the Decision Matrix screener displaying a live "Fetching..." indicator until confirmed data is ready, completely eliminating placeholder default prices ($100.00) or missing technicals.
                  </p>
                </div>

                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-1">
                  <div className="text-xs font-bold text-white">How do I get real market prices &amp; options for new tickers (e.g. CLM, CRF)?</div>
                  <p className="text-xs text-slate-400">
                    When you add new symbols in the Watchlist Manager (<code>W</code>), click the <strong>⚡ Fetch Real Market Data &amp; Options</strong> button in the modal footer or hit <strong>⚡ Live Fetch</strong> in the top header. The backend Python calculation engine will compute live spot prices, 20 SMA, 2-SD Bollinger Bands, 14d RSI, 30d Historical Volatility, and full options chains on demand.
                  </p>
                </div>

                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-1">
                  <div className="text-xs font-bold text-white">What is the difference between "Sync" and "⚡ Live Fetch"?</div>
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
                  <div className="text-xs font-bold text-white">What is the Ticker Audit Modal and how do I inspect a symbol?</div>
                  <p className="text-xs text-slate-400">
                    Clicking on any ticker in the Primary Screener, Fundamental Health, or Command Palette (<code>Ctrl+K</code>) opens the 5-Part Institutional Audit Modal. It features an interactive TradingView candlestick chart with Bollinger Bands and strike overlays, 20 SMA &amp; RSI indicators, institutional 13F float breakdown, SEC EDGAR links, Wall Street price targets, prediction markets odds, and social sentiment velocity.
                  </p>
                </div>

                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-1">
                  <div className="text-xs font-bold text-white">Can I import my own custom tickers?</div>
                  <p className="text-xs text-slate-400">
                    Yes! Click "Watchlists" or press <code>W</code> to add single tickers or paste a bulk list. You can also upload a CSV or Excel file containing your custom symbols.
                  </p>
                </div>

                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-1">
                  <div className="text-xs font-bold text-white">How do Named Watchlists work (Create, Rename, Delete)?</div>
                  <p className="text-xs text-slate-400">
                    You can create multiple custom-named watchlists by opening the Watchlist Manager (<code>W</code>) and clicking <strong>+ New List</strong>. To rename any watchlist (including your primary default <strong>Frank Favorites</strong>), click the <strong>Rename</strong> button next to the active list name, type the new name, and hit Save. To delete an unwanted watchlist, click <strong>Delete Watchlist</strong> and confirm the prompt (you must maintain at least one watchlist). You can also quickly switch between active watchlists using the dropdown selector in the screener Filter Bar.
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
                    A <strong>Poor Man’s Covered Call</strong> replaces costly 100-share stock purchases with deep In-The-Money LEAPS ($0.80+\Delta$) and sells 30–45 DTE short calls ($0.25\Delta$), cutting capital outlay by 60%–75% while maintaining zero extrinsic assignment risk. The <strong>Portfolio Margin &amp; Stress Simulator</strong> lets you enter your active derivatives book and model multi-factor market shocks (Price $\pm 20\%$, Volatility spikes up to $+100\%$, Time decay), comparing standard Reg-T margin against risk-based Portfolio Margin (TIMS) to quantify liberated purchasing power.
                  </p>
                </div>

                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-1">
                  <div className="text-xs font-bold text-white">How does the AI Multi-Agent Trade Structurer &amp; SEC 10-K Auditor work?</div>
                  <p className="text-xs text-slate-400">
                    The <strong>AI Multi-Agent Trade Structurer</strong> deploys a council of three specialized agents: (1) The <em>Quant Specialist</em> audits Delta bounds ($0.15–0.20\Delta$), IV Rank, expected price moves, and statistical probability of profit; (2) The <em>Fundamental &amp; SEC Auditor</em> examines corporate debt maturity, interest coverage, and SEC EDGAR 10-K/10-Q disclosures to ensure solvency; (3) The <em>Senior Trade Structurer</em> integrates these insights to formulate precise limit prices, capital allocation limits (max 4.5%–5%), mandatory 80% profit targets, and 0.50 Delta stop triggers, with 1-click order staging.
                  </p>
                </div>

                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-1">
                  <div className="text-xs font-bold text-white">What is the 0.50 Delta Defensive Roll Rule and how does the Repair Engine work?</div>
                  <p className="text-xs text-slate-400">
                    When short options face adverse price moves, DeltaHarvest enforces the <strong>0.50 Delta Rule</strong>: never permit an option to reach assignment without testing a defensive adjustment. The <strong>Defensive Rolling &amp; Repair Engine</strong> evaluates four institutional repair tactics: (1) <em>Roll Out &amp; Down</em> (extending expiration 21–28 days while dropping strike $5.00 for a net credit); (2) <em>Roll Flat</em> (extending time at the same strike to harvest maximum extrinsic value); (3) <em>Inverted Wing Defense</em> (selling an opposing credit spread to reduce maximum drawdown); and (4) <em>1:2 Ratio Stock Repair</em> (recovering underwater stock at zero net capital cost).
                  </p>
                </div>

                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-1">
                  <div className="text-xs font-bold text-white">How do Section 1256 Index Contracts and the Wash-Sale Shield optimize taxes?</div>
                  <p className="text-xs text-slate-400">
                    Under <strong>IRS Section 1256</strong>, all trading profits in broad index options (SPX, XSP, NDX, RUT) enjoy statutory 60/40 tax treatment: 60% is taxed at the lower long-term capital gains rate (20%) and 40% at short-term rates, generating an effective blended tax rate of ~26.8% vs. 37% for standard equity options. In addition, Section 1256 contracts settle in cash and are exempt from the 30-day wash-sale rule. The <strong>Wash-Sale Shield</strong> identifies underwater equity positions and suggests non-substantially identical replacement proxies (e.g. SPY &rarr; XSP) to bank immediate tax deductions while keeping continuous market exposure.
                  </p>
                </div>

                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-1">
                  <div className="text-xs font-bold text-white">What is the Executive Portfolio Health Digest &amp; Continuous Guardian?</div>
                  <p className="text-xs text-slate-400">
                    The <strong>Executive Portfolio Health Digest</strong> aggregates total Net Liquidity, Daily Theta Cashflow run-rate, SPY Beta Delta exposure, and Portfolio Margin (TIMS) capital savings into a unified C-suite dashboard with one-click <strong>Download Markdown</strong> and <strong>Print Executive PDF</strong> capabilities. In the background, the <strong>Continuous Risk Sweeper</strong> autonomously audits active positions against the 80% profit-taking threshold and 0.50 Delta defense trigger, issuing instant alerts to protect capital.
                  </p>
                </div>

                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-1">
                  <div className="text-xs font-bold text-white">How does the Closed-Loop Trade Lifecycle &amp; Top Header Risk Pulse work?</div>
                  <p className="text-xs text-slate-400">
                    DeltaHarvest links order execution, portfolio margin stress-testing, and defensive repair into a unified closed loop: (1) When an order is previewed or executed in the <em>Broker Workbench</em>, it automatically logs into your active <em>Portfolio Ledger</em>; (2) The <em>Defensive Rolling Engine</em> dynamically loads your active ledger positions so you can test and stage repair tactics on real holdings; (3) The <em>Option Chain Matrix</em> models true CBOE calendar Friday cycles (weekly, monthly 3rd Friday, and annual LEAPS); (4) The persistent <em>Top Header Risk Pulse</em> displays real-time health (e.g. 94/100 Health • +$142/d Theta) with global hotkeys (<code>?</code> for Handbook, <code>Alt+S</code> for Staging, <code>Alt+E</code> for Executive Digest).
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>DeltaHarvest Institutional Income System</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold transition-colors"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
