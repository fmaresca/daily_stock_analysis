import React from 'react';
import { DirectActionBanner } from './DirectActionBanner';
import { Zap, AlertTriangle } from '../../../icons';
import { MenuTreeType, EquitiesTabType, OptionsTabType } from '../../../../types/options';

export interface ChapterTradeQualityScoringProps {
  onNavigate?: (tree: MenuTreeType, optionsTab?: OptionsTabType, equitiesTab?: EquitiesTabType) => void;
  onOpenSimulator?: () => void;
}

export const ChapterTradeQualityScoring: React.FC<ChapterTradeQualityScoringProps> = ({
  onNavigate,
  onOpenSimulator,
}) => {
  return (
    <div className="space-y-6">
      <div className="border-l-2 border-emerald-400 pl-4 py-1">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Zap className="w-5 h-5 text-emerald-400" />
          <span>100-Point Quantitative Trade Quality Scoring Model (Weekly CSP/CC)</span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
            Institutional Standard
          </span>
        </h3>
        <p className="text-slate-300 mt-1 text-xs leading-relaxed">
          Evaluates weekly Cash-Secured Puts (CSPs) and Covered Calls (CCs) using a rigorous 100-point composite model rewarding elevated implied volatility, optimal delta positioning (0.15–0.25Δ), moving average support buffers, and tight liquidity, while penalizing earnings binary event risks and assignment hazards.
        </p>
      </div>

      <DirectActionBanner
        actions={[
          {
            label: 'Launch Interactive Simulator',
            location: 'Interactive Modal',
            onClick: onOpenSimulator,
          },
          {
            label: 'Options Income Screener Table',
            location: 'Options > Income Screener',
            onClick: () => onNavigate?.('OPTIONS', 'INCOME_SCREENER'),
          },
          {
            label: 'Earnings Calendar Guard',
            location: 'Equities > Earnings Calendar',
            onClick: () => onNavigate?.('EQUITIES', undefined, 'EARNINGS_CALENDAR'),
          },
        ]}
      />

      {/* 5 Scoring Dimensions Table */}
      <div className="glass-panel rounded-xl border border-slate-800 overflow-hidden text-xs">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950/80 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              <th className="py-2.5 px-3">Dimension</th>
              <th className="py-2.5 px-2 text-center">Weight</th>
              <th className="py-2.5 px-3">Optimal Target Range</th>
              <th className="py-2.5 px-4">Evaluation Criteria &amp; Penalty Triggers</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-300 font-sans">
            <tr className="hover:bg-slate-800/30">
              <td className="py-2.5 px-3 font-semibold text-white">IV Rank / Percentile</td>
              <td className="py-2.5 px-2 text-center font-mono font-bold text-emerald-400">25% (25 pts)</td>
              <td className="py-2.5 px-3 text-emerald-300 font-mono">35% &ndash; 70%</td>
              <td className="py-2.5 px-4 text-[11px]">Maximizes volatility premium capture while avoiding binary distress. Linear scale 0&ndash;35; max score 35&ndash;70; slight haircut &gt;70% unless verified.</td>
            </tr>
            <tr className="hover:bg-slate-800/30">
              <td className="py-2.5 px-3 font-semibold text-white">Option Delta (PoP)</td>
              <td className="py-2.5 px-2 text-center font-mono font-bold text-emerald-400">25% (25 pts)</td>
              <td className="py-2.5 px-3 text-emerald-300 font-mono">0.15 &ndash; 0.25Δ (CSP)<br/>0.20 &ndash; 0.30Δ (CC)</td>
              <td className="py-2.5 px-4 text-[11px]">Targets 75%&ndash;85% probability of expiring OTM. Steep penalties for deltas &lt;0.10 (low yield) or &gt;0.35 (high assignment risk).</td>
            </tr>
            <tr className="hover:bg-slate-800/30">
              <td className="py-2.5 px-3 font-semibold text-white">Technical &amp; MA Alignment</td>
              <td className="py-2.5 px-2 text-center font-mono font-bold text-emerald-400">25% (25 pts)</td>
              <td className="py-2.5 px-3 text-emerald-300 font-mono">Strike &lt; 20/50 SMA (Puts)<br/>Strike &ge; 20/50 SMA (Calls)</td>
              <td className="py-2.5 px-4 text-[11px]">Puts: Price &gt; 50 SMA and strike placed below key moving average dynamic support. Calls: Underlying in healthy trend, strike placed above resistance.</td>
            </tr>
            <tr className="hover:bg-slate-800/30">
              <td className="py-2.5 px-3 font-semibold text-white">Annualized RoC (%)</td>
              <td className="py-2.5 px-2 text-center font-mono font-bold text-emerald-400">15% (15 pts)</td>
              <td className="py-2.5 px-3 text-emerald-300 font-mono">18% &ndash; 35%+ Annualized</td>
              <td className="py-2.5 px-4 text-[11px]">Calculated using cash collateral (CSP = Strike &times; 100) or stock spot price (CC). Zero points if annualized yield is under 10%.</td>
            </tr>
            <tr className="hover:bg-slate-800/30">
              <td className="py-2.5 px-3 font-semibold text-white">Liquidity &amp; Execution</td>
              <td className="py-2.5 px-2 text-center font-mono font-bold text-emerald-400">10% (10 pts)</td>
              <td className="py-2.5 px-3 text-emerald-300 font-mono">Spread &le; 5% of mid<br/>OI &ge; 500 contracts</td>
              <td className="py-2.5 px-4 text-[11px]">Penalizes wide bid/ask slippage and illiquid strikes with low market maker participation.</td>
            </tr>
            <tr className="bg-rose-950/20">
              <td className="py-2.5 px-3 font-bold text-rose-300">Hard Risk Filter (Gate)</td>
              <td className="py-2.5 px-2 text-center font-mono font-bold text-rose-400">Gate</td>
              <td className="py-2.5 px-3 text-rose-300 font-mono">No earnings before DTE</td>
              <td className="py-2.5 px-4 text-[11px] text-rose-300 font-medium">Drops composite score by 40 points and marks trade as DISQUALIFIED if an earnings announcement falls inside the weekly expiration window. Disqualifies if spread &gt; 15%.</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Reference Execution Example */}
      <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
        <div className="font-bold text-emerald-400 flex items-center justify-between">
          <span>Reference Candidate Execution (XYZ Weekly Put &ndash; 96.0 Score)</span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">Very High Trade Quality</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[11px] text-slate-300 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
          <div>Spot: $184.50</div>
          <div>Strike: $175.00P</div>
          <div>IV Rank: 48% (25.0 pts)</div>
          <div>Delta: 0.18Δ (25.0 pts)</div>
          <div>50 SMA: $177.25 (25.0 pts)</div>
          <div>Bid/Ask: $1.15 / $1.20</div>
          <div>RoC: 47.9% Ann. (15.0 pts)</div>
          <div>OI: 2,400 (10.0 pts)</div>
        </div>
      </div>

      {/* Interactive Inputs & Multi-Source Technical Hydration */}
      <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-3 text-xs">
        <div className="font-bold text-emerald-400 flex items-center gap-2">
          <Zap className="w-4 h-4 text-emerald-400" />
          <span>Interactive Stock Ticker &amp; Expiration Date Hydration Engine</span>
        </div>
        <p className="text-slate-300 leading-relaxed text-[11px]">
          The Options Trade Quality Simulator provides dedicated input controls for <strong>Stock Ticker</strong> and <strong>Expiration Date</strong> with real-time technical calculation. Enter any ticker symbol and select your desired weekly or monthly expiration to automatically hydrate IV Rank, 50-day SMA distance, option delta, and return on capital from either market data provider:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-[11px]">
          <div className="p-3 rounded-lg bg-slate-900 border border-emerald-500/30 space-y-1">
            <span className="font-bold text-emerald-300 block">Barchart.com Ingestion Engine</span>
            <p className="text-slate-400">
              Calculates the 13-Indicator Barchart Technical Opinion across short, medium, and long-term moving averages/MACDs, 14-day blended RSI, and historical volatility IV Rank calibration.
            </p>
          </div>
          <div className="p-3 rounded-lg bg-slate-900 border border-cyan-500/30 space-y-1">
            <span className="font-bold text-cyan-300 block">MarketChameleon.com Ingestion Engine</span>
            <p className="text-slate-400">
              Evaluates quantitative moving average technical patterns (Uptrend, Bullish Crossover, Fast Bullish, Top Pullback), 6-Month Range Position, IV30, 20-day volatility, and CBOE weeklys directory confirmation.
            </p>
          </div>
        </div>
      </div>

      {/* Dynamic Earnings Capture & Straddle Implied Move Defense Engine */}
      <div className="bg-slate-950/80 p-4 rounded-xl border border-amber-500/30 space-y-3 text-xs">
        <div className="font-bold text-amber-300 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          <span>Dynamic Earnings Detection &amp; ATM Straddle Implied Move Defense Engine</span>
        </div>
        <p className="text-slate-300 leading-relaxed text-[11px]">
          Selling options through corporate earnings announcements introduces severe binary jump risk (volatility crush and overnight gap risk). The simulator dynamically tracks upcoming corporate reporting schedules and evaluates whether an announcement falls inside the selected expiration cycle (<code className="text-amber-300 font-mono">tradeDate &le; earningsDate &le; expirationDate</code>):
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2.5 text-[11px] font-sans">
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
            <span className="font-bold text-amber-300 block">1. Dynamic Calendar Capture</span>
            <p className="text-slate-400">
              Cross-references authoritative earnings schedules for Schwab living trust equities and top universe tickers against your selected expiration date, tagging warnings automatically and highlighting DTE to the report.
            </p>
          </div>
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
            <span className="font-bold text-amber-300 block">2. ATM Straddle Implied Move</span>
            <p className="text-slate-400 font-mono text-[10px]">
              Move &plusmn;$ = S &times; (0.65 &times; IV_event + 0.35 &times; HistMove%)
            </p>
            <p className="text-slate-400">
              Prices the expected 1-standard-deviation earnings jump cone using market-maker at-the-money straddle pricing to define upper and lower post-earnings gap limits.
            </p>
          </div>
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
            <span className="font-bold text-emerald-300 block">3. Defended Strike Formulation</span>
            <p className="text-slate-400">
              Adjusts recommended strike prices outside the straddle cone with a 15% safety buffer (<code className="text-emerald-400 font-mono">CSP Strike &le; Spot - Move &times; 1.15</code>; <code className="text-amber-400 font-mono">CC Strike &ge; Spot + Move &times; 1.15</code>). Defended trades avoid hard disqualification!
            </p>
          </div>
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
            <span className="font-bold text-cyan-300 block">4. Live Sync &amp; Latency Pause</span>
            <p className="text-slate-400">
              For unstored equities, the simulator pauses to automatically fetch live SEC/Wall Street event dates. An in-flight banner alerts you to the lookup and caches the date permanently in browser storage.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
