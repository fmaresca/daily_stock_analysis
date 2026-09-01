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
} from './icons';

interface HelpHandbookModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type HandbookTab =
  | 'STRATEGY_RULES'
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
  const [activeTab, setActiveTab] = useState<HandbookTab>('STRATEGY_RULES');

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
            onClick={() => setActiveTab('CHART_READING')}
            className={`px-3 py-2 rounded-xl font-semibold flex items-center space-x-1.5 transition-all whitespace-nowrap ${
              activeTab === 'CHART_READING'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Activity className="w-4 h-4 text-cyan-400" />
            <span>2. Visual Charting &amp; Strike Positioning</span>
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
            <span>3. Multi-Leg Spreads &amp; Volatility Skew</span>
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
            <span>4. Altman Z-Score &amp; CEF Anatomy</span>
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
            <span>5. Backtesting &amp; Margin Stress</span>
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
            <span>6. Broker Staging &amp; Execution</span>
          </button>

          <button
            onClick={() => setActiveTab('CONTEXT_SENTIMENT')}
            className={`px-3 py-2 rounded-xl font-semibold flex items-center space-x-1.5 transition-all whitespace-nowrap ${
              activeTab === 'CONTEXT_SENTIMENT'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Flame className="w-4 h-4 text-cyan-400" />
            <span>7. Prediction Markets &amp; Sentiment</span>
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
            <span>8. Live Streaming &amp; Risk Circuit-Breakers</span>
          </button>

          <button
            onClick={() => setActiveTab('CADENCE_GUIDE')}
            className={`px-3 py-2 rounded-xl font-semibold flex items-center space-x-1.5 transition-all whitespace-nowrap ${
              activeTab === 'CADENCE_GUIDE'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>9. Expiration Cadence</span>
          </button>

          <button
            onClick={() => setActiveTab('GREEKS_FORMULAS')}
            className={`px-3 py-2 rounded-xl font-semibold flex items-center space-x-1.5 transition-all whitespace-nowrap ${
              activeTab === 'GREEKS_FORMULAS'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>10. Greeks &amp; Yield Math</span>
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
            <span>11. Liquidity Tiers &amp; Slippage</span>
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
            <span>12. Shortcuts &amp; FAQ</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm text-slate-300 leading-relaxed">
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
                    <div className="font-bold text-emerald-400">Step 2: 14-Day RSI Oversold Check</div>
                    <p className="text-slate-400 text-[11px]">RSI &le; 35 indicates selling exhaustion, reducing the likelihood of sustained immediate breakdown.</p>
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
                  <span>Prediction Market Cards (Audit Tab → Prediction Markets)</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                    <div className="font-bold text-white">Polymarket Gamma API</div>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      Polymarket is the world's largest decentralized prediction market. Contracts shown here are binary (Yes / No) events linked to a specific ticker — for example, "Will NVDA close above $150 by Dec 31?" The <strong>Yes % probability</strong> represents real money bet on an outcome, not just sentiment.
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                    <div className="font-bold text-blue-400">Manifold Markets</div>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      A complementary prediction market where traders stake virtual currency on event outcomes. Manifold often surfaces early signals on earnings surprises, regulatory decisions, and sector-specific catalysts. Use as a contrarian indicator when Manifold and Polymarket diverge significantly.
                    </p>
                  </div>
                </div>
                <div className="bg-amber-950/30 p-3 rounded-lg border border-amber-500/30 text-xs text-amber-300">
                  <strong>Usage Rule:</strong> Prediction market probabilities above 70% for a bullish event (e.g. "Beats earnings") support writing a Cash-Secured Put. Probabilities below 30% are a caution flag — consider widening strike distance or skipping that expiration.
                </div>
              </div>

              {/* Social Sentiment Gauge */}
              <div className="bg-slate-950/70 p-4 rounded-xl border border-cyan-500/30 space-y-3">
                <div className="flex items-center space-x-2 text-cyan-400 font-bold text-xs">
                  <Activity className="w-4 h-4" />
                  <span>Social Sentiment Gauge (Audit Tab → Social &amp; Forum Sentiment)</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                    <div className="font-bold text-emerald-400">StockTwits Bull/Bear %</div>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      Live ratio of Bullish vs. Bearish message tags from retail traders. A Bull% ≥ 60% indicates bullish retail bias; ≤ 35% signals fear or short-bias in the crowd. Use as a contrarian indicator for extreme readings.
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                    <div className="font-bold text-cyan-400">Reddit /r/WallStreetBets Rank</div>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      Real-time 24-hour trending rank from the WSB subreddit. Top 10 tickers carry meme-driven gamma squeeze risk. A stock ranked #1–5 on WSB with high IV may see outsized option premium — but also elevated tail risk.
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                    <div className="font-bold text-amber-300">Screener Sentiment Chips</div>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      The main screener table shows compact chips (e.g. "74% Bull" or "WSB #3") directly in the AI Score column so you can filter high-sentiment tickers at a glance without opening each audit detail.
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
