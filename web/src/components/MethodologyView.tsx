import React from 'react';
import {
  ShieldCheck,
  TrendingUp,
  Activity,
  Layers,
  Zap,
  BarChart2,
  BrainCircuit,
  Sliders,
  DollarSign,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Clock,
  Sparkles,
  CheckCircle2,
} from './icons';

interface MethodologyViewProps {
  onNavigateToScreener?: () => void;
  onNavigateToOptions?: () => void;
}

export const MethodologyView: React.FC<MethodologyViewProps> = ({
  onNavigateToScreener,
  onNavigateToOptions,
}) => {
  return (
    <div className="space-y-8 animate-fadeIn max-w-7xl mx-auto px-2 sm:px-4 py-4">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-950 to-emerald-950/40 p-6 sm:p-8 border border-emerald-500/30 shadow-2xl">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-semibold tracking-wide">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Quantitative Investment Methodology &amp; Mathematical Architecture</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white">
              DeltaHarvest Systematic Quantitative Model
            </h1>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              DeltaHarvest operates on a rigorous, rules-based options income model designed for conservative capital compounding. By uniting statistical standard deviation boundaries, implied volatility rank normalization, and institutional risk guards, the system eliminates emotional execution.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {onNavigateToScreener && (
              <button
                onClick={onNavigateToScreener}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
              >
                <span>Launch Screener</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
            {onNavigateToOptions && (
              <button
                onClick={onNavigateToOptions}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs sm:text-sm border border-slate-700 transition-all cursor-pointer"
              >
                <span>Options Chain Matrix</span>
                <Activity className="w-4 h-4 text-emerald-400" />
              </button>
            )}
          </div>
        </div>

        {/* High-Level Pillars Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-slate-800/80">
          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
            <div className="text-[11px] font-mono text-emerald-400 uppercase tracking-wider">Pillar 1</div>
            <div className="text-sm font-bold text-white mt-1">Bollinger 2.0 SD</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Statistical Boundary Strike Selection</div>
          </div>
          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
            <div className="text-[11px] font-mono text-emerald-400 uppercase tracking-wider">Pillar 2</div>
            <div className="text-sm font-bold text-white mt-1">Delta 0.15 - 0.25</div>
            <div className="text-[11px] text-slate-400 mt-0.5">80%+ Prob. of Expiring OTM</div>
          </div>
          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
            <div className="text-[11px] font-mono text-emerald-400 uppercase tracking-wider">Pillar 3</div>
            <div className="text-sm font-bold text-white mt-1">80% Profit Rule</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Systematic Early Buy-to-Close</div>
          </div>
          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
            <div className="text-[11px] font-mono text-emerald-400 uppercase tracking-wider">Pillar 4</div>
            <div className="text-sm font-bold text-white mt-1">0.50 Delta Roll</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Tested Position Defensive Roll</div>
          </div>
        </div>
      </div>

      {/* Section 1: Core Mathematical Architecture */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2 border-b border-slate-800 pb-2">
          <BrainCircuit className="w-5 h-5 text-emerald-400" />
          <h2 className="text-lg sm:text-xl font-bold text-white">1. Core Quantitative Rules &amp; Formulas</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card: Cash-Secured Put Strike Selection */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-700/50">
                  RULE 1: STRIKE SELECTION
                </span>
                <h3 className="text-base font-bold text-white mt-1.5 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Statistical Standard Deviation Barrier
                </h3>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              For Cash-Secured Puts, strike selection must reside at or below the 20-day Lower Bollinger Band (2 standard deviations below the 20 SMA):
            </p>

            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800/80 font-mono text-xs text-emerald-300 space-y-1">
              <div>K_put &le; SMA_20 - (2.0 &times; &sigma;_20)</div>
              <div className="text-[10px] text-slate-500">where K = Strike Price, SMA_20 = 20-day Simple Moving Average, &sigma; = 20-day Std Deviation</div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              For Covered Calls, strike selection must reside at or above the 20-day Upper Bollinger Band:
            </p>

            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800/80 font-mono text-xs text-emerald-300 space-y-1">
              <div>K_call &ge; SMA_20 + (2.0 &times; &sigma;_20)</div>
              <div className="text-[10px] text-slate-500">Ensures calls are sold into statistical exhaustion rather than premature resistance.</div>
            </div>
          </div>

          {/* Card: Delta & Probability Modeling */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-950/80 text-teal-300 border border-teal-700/50">
                  RULE 2: PROBABILITY DYNAMICS
                </span>
                <h3 className="text-base font-bold text-white mt-1.5 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-teal-400" />
                  Delta Sensitivity &amp; Probability of Profit (POP)
                </h3>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Options Greeks govern position sensitivity. DeltaHarvest targets option contracts with absolute Delta between 0.15 and 0.25:
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <div className="text-[10px] font-mono text-slate-400">Put Delta Target</div>
                <div className="text-sm font-bold text-emerald-400 font-mono">-0.15 to -0.22</div>
                <div className="text-[10px] text-slate-500 mt-1">&approx; 78% - 85% Prob OTM</div>
              </div>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <div className="text-[10px] font-mono text-slate-400">Call Delta Target</div>
                <div className="text-sm font-bold text-cyan-400 font-mono">+0.18 to +0.28</div>
                <div className="text-[10px] text-slate-500 mt-1">&approx; 72% - 82% Prob OTM</div>
              </div>
            </div>

            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800/80 font-mono text-[11px] text-slate-300">
              POP &approx; 1 - |&Delta;| &minus; (Bid-Ask Friction &times; 0.02)
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Trade Lifecycle & Exit Disciplines */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2 border-b border-slate-800 pb-2">
          <Clock className="w-5 h-5 text-emerald-400" />
          <h2 className="text-lg sm:text-xl font-bold text-white">2. Trade Lifecycle &amp; Execution Protocols</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Phase 1 */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-950/80 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold font-mono text-sm">
              01
            </div>
            <h3 className="font-bold text-white text-sm">Screening &amp; Selection</h3>
            <ul className="text-xs text-slate-300 space-y-2 list-disc list-inside">
              <li>Underlying must pass Fundamental Solvency check (Altman Z-Score &gt; 1.8, positive operating margin).</li>
              <li>Examine IV Rank &gt; 25% to capture elevated option premiums.</li>
              <li>Target 7 to 45 Days to Expiration (DTE) to capture maximum Theta decay acceleration.</li>
            </ul>
          </div>

          {/* Phase 2 */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-3">
            <div className="w-8 h-8 rounded-lg bg-teal-950/80 border border-teal-500/40 flex items-center justify-center text-teal-400 font-bold font-mono text-sm">
              02
            </div>
            <h3 className="font-bold text-white text-sm">The 80% Buy-to-Close Rule</h3>
            <ul className="text-xs text-slate-300 space-y-2 list-disc list-inside">
              <li>When position captures <strong>80% of max initial credit</strong>, automatically enter a Buy-to-Close limit order.</li>
              <li>Eliminates tail risk: why risk 100% of collateral for the remaining 20% of premium?</li>
              <li>Frees buying power immediately to compound into new weekly opportunities.</li>
            </ul>
          </div>

          {/* Phase 3 */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400 font-bold font-mono text-sm">
              03
            </div>
            <h3 className="font-bold text-white text-sm">The 0.50 Delta Defensive Roll</h3>
            <ul className="text-xs text-slate-300 space-y-2 list-disc list-inside">
              <li>If underlying moves against position and strike becomes At-The-Money (ATM, Delta reaches &plusmn;0.50):</li>
              <li>Execute a defensive roll: Buy to close current contract, sell a further expiration out-in-time for a <strong>net credit</strong>.</li>
              <li>Never roll for a net debit. Extends duration and lowers break-even cost basis.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Section 3: Liquidity Tier Classification */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2 border-b border-slate-800 pb-2">
          <Layers className="w-5 h-5 text-emerald-400" />
          <h2 className="text-lg sm:text-xl font-bold text-white">3. Institutional Liquidity Tiers</h2>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/50">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Tier Level</th>
                <th className="py-3 px-4">Representative Tickers</th>
                <th className="py-3 px-4">Expiration Frequency</th>
                <th className="py-3 px-4">Bid-Ask Spread Margin</th>
                <th className="py-3 px-4">Trading Recommendation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              <tr className="hover:bg-slate-800/30">
                <td className="py-3 px-4 font-bold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Tier 1: Ultra-Liquid
                </td>
                <td className="py-3 px-4 font-mono font-bold text-white">SPY, QQQ, AAPL, NVDA, TSLA, MSFT</td>
                <td className="py-3 px-4">Daily &amp; Multi-Weekly</td>
                <td className="py-3 px-4 text-emerald-300">&le; $0.03 (Tight)</td>
                <td className="py-3 px-4 text-slate-400">Institutional quality. Instant execution at mid-price.</td>
              </tr>
              <tr className="hover:bg-slate-800/30">
                <td className="py-3 px-4 font-bold text-teal-300">Tier 2: High Quality</td>
                <td className="py-3 px-4 font-mono font-bold text-white">IWM, AMZN, GOOGL, PLTR, RTX</td>
                <td className="py-3 px-4">Weekly (Every Friday)</td>
                <td className="py-3 px-4 text-teal-300">$0.04 &minus; $0.10</td>
                <td className="py-3 px-4 text-slate-400">Prime candidates for weekly covered call harvesting.</td>
              </tr>
              <tr className="hover:bg-slate-800/30">
                <td className="py-3 px-4 font-bold text-yellow-400">Tier 3: Moderate / Monthly</td>
                <td className="py-3 px-4 font-mono font-bold text-white">JEPI, SCHD, NET, IONQ, LUNR</td>
                <td className="py-3 px-4">Monthly or Select Weeklys</td>
                <td className="py-3 px-4 text-yellow-400">$0.10 &minus; $0.25</td>
                <td className="py-3 px-4 text-slate-400">Always use limit orders set to the midpoint price.</td>
              </tr>
              <tr className="hover:bg-slate-800/30">
                <td className="py-3 px-4 font-bold text-rose-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                  Tier 4: Illiquid / Warning
                </td>
                <td className="py-3 px-4 font-mono font-bold text-white">AXTI, BLZE, ZETA, Small-Caps</td>
                <td className="py-3 px-4">Monthly Only or Wide Spreads</td>
                <td className="py-3 px-4 text-rose-400">&gt; $0.30 (Wide)</td>
                <td className="py-3 px-4 text-slate-400">Requires manual pricing verification; high slippage risk.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
