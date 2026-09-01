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
} from './icons';

interface HelpHandbookModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type HandbookTab =
  | 'STRATEGY_RULES'
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
                  v1.2
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Systematic Rules, Technical Indicators, Options Greeks, and Risk Audits
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
            onClick={() => setActiveTab('CADENCE_GUIDE')}
            className={`px-3 py-2 rounded-xl font-semibold flex items-center space-x-1.5 transition-all whitespace-nowrap ${
              activeTab === 'CADENCE_GUIDE'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>2. Weekly vs Monthly Expirations</span>
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
            <span>3. Greeks &amp; Yield Math</span>
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
            <span>4. Liquidity Tiers &amp; Slippage</span>
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
            <span>5. Shortcuts &amp; FAQ</span>
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

          {/* TAB 2: Expiration Cadence Guide */}
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
                  <div className="text-xs font-bold text-white">How often is the data refreshed?</div>
                  <p className="text-xs text-slate-400">
                    The GitHub Actions pipeline runs daily at 4:30 PM Eastern Time (Monday through Friday) immediately after market close, analyzing updated end-of-day prices, IV ranks, and fresh weekly options chains.
                  </p>
                </div>

                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-1">
                  <div className="text-xs font-bold text-white">Can I import my own custom tickers?</div>
                  <p className="text-xs text-slate-400">
                    Yes! Click "Manage Watchlists" or press <code>W</code> to add single tickers or paste a bulk list. You can also upload a CSV or Excel file containing your custom symbols.
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
