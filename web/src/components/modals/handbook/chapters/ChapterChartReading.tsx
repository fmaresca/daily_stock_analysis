import React from 'react';
import { DirectActionBanner } from './DirectActionBanner';
import { Flame, Activity } from '../../../icons';
import { MenuTreeType, EquitiesTabType, OptionsTabType } from '../../../../types/options';

export interface ChapterChartReadingProps {
  onNavigate?: (tree: MenuTreeType, optionsTab?: OptionsTabType, equitiesTab?: EquitiesTabType) => void;
}

export const ChapterChartReading: React.FC<ChapterChartReadingProps> = ({
  onNavigate,
}) => {
  return (
    <div className="space-y-6">
      <div className="border-l-2 border-cyan-500 pl-4 py-1">
        <h3 className="text-base font-bold text-white">Visual Chart Reading &amp; Strike Positioning</h3>
        <p className="text-slate-400 mt-1">
          How to read candlestick price action against Bollinger Bands and confirm optimal option strike entries.
        </p>
      </div>

      <DirectActionBanner
        actions={[
          {
            label: 'Al Brooks Price Action Lab',
            location: 'Equities > Price Action',
            onClick: () => onNavigate?.('EQUITIES', undefined, 'PRICE_ACTION'),
          },
          {
            label: 'Interactive Candlestick Charts',
            location: 'Equities > Interactive Charts',
            onClick: () => onNavigate?.('EQUITIES', undefined, 'INTERACTIVE_CHARTS'),
          },
          {
            label: 'Trend & Support Levels',
            location: 'Equities > Trend Support',
            onClick: () => onNavigate?.('EQUITIES', undefined, 'TREND_SUPPORT'),
          },
        ]}
      />

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

      {/* Al Brooks Price Action Analysis Methodology Section */}
      <div className="bg-slate-950/80 p-4 rounded-xl border border-emerald-500/40 space-y-3">
        <div className="font-bold text-emerald-300 text-xs uppercase tracking-wider flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            <span>Al Brooks Price Action Method &amp; Pattern Setups</span>
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
            Reading Price Charts Bar by Bar
          </span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          The <strong>Price Action Lab</strong> implements non-repainting mathematical heuristics based on the published
          concepts of Al Brooks (John Wiley &amp; Sons). Key capabilities include:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
          <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 space-y-1">
            <span className="text-emerald-400 font-bold block text-[11px]">H1 / H2 &amp; L1 / L2 Pullbacks</span>
            <p className="text-slate-400 text-[10px] leading-relaxed">
              Two-legged counter-trend pullbacks testing the 20-period Exponential Moving Average (EMA). High-conviction continuation entries in established trends.
            </p>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 space-y-1">
            <span className="text-sky-400 font-bold block text-[11px]">Breakouts &amp; Failed Breakouts</span>
            <p className="text-slate-400 text-[10px] leading-relaxed">
              Quantitative detection of trading ranges (2+ test boundary rule) with breakout extensions and failed-breakout fade reversals at range extremes.
            </p>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 space-y-1">
            <span className="text-amber-400 font-bold block text-[11px]">Always-In Regime (AIL / AIS)</span>
            <p className="text-slate-400 text-[10px] leading-relaxed">
              Algorithmic state machine tracking whether market pressure is Always-In Long (AIL), Always-In Short (AIS), or Neutral / Range-bound with 2-bar lag non-repainting swing pivots.
            </p>
          </div>
        </div>

        {/* Canonical Bar Pipeline & Pivot Lag Rules */}
        <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 space-y-2 text-xs">
          <div className="font-bold text-slate-200 text-[11px] flex items-center justify-between">
            <span className="text-teal-300">Canonical Bar Pipeline &amp; Non-Repainting Invariants</span>
            <span className="text-[10px] font-mono text-slate-400">maxBadTickPct = 0.02</span>
          </div>
          <ul className="text-[11px] text-slate-400 space-y-1 list-disc list-inside">
            <li><strong>Bad-Tick Guard:</strong> Filters out erroneous trades exceeding 2% outlier deviation without fabricating synthetic bars or erasing natural weekend gaps.</li>
            <li><strong>Objective Bar Classification:</strong> Trend Bars require body &gt; 55% of full range; Dojis have body &lt; 20%; Reversal Bars require tails &gt; 50% rejecting range extremes.</li>
            <li><strong>2-Bar Pivot Confirmation:</strong> Swing highs/lows are confirmed only after 2 subsequent bars fail to exceed the pivot extreme (<code className="text-cyan-300 font-mono">H[t-2] &gt; H[t-4..t]</code>), ensuring live charts never repaint past markers.</li>
          </ul>
        </div>
      </div>

      {/* Broad Market Regime: SPX & NDX Agreement Matrix */}
      <div className="bg-slate-950/80 p-4 rounded-xl border border-cyan-500/40 space-y-3">
        <div className="font-bold text-cyan-300 text-xs uppercase tracking-wider flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            <span>Dual-Index Market Regime (SPX &amp; NDX) &amp; Sizing Matrix</span>
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
            SPY &amp; QQQ Liquid Proxies
          </span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          The workstation concurrently computes Always-In trend state for both the S&amp;P 500 (SPY proxy) and Nasdaq-100 (QQQ proxy) using the Single Clock Authority (America/New_York ET), driving systematic position sizing:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-500/40 space-y-1">
            <div className="font-bold text-emerald-300 flex items-center justify-between">
              <span>AGREE (Aligned Trend)</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">Full Sizing</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              SPY and QQQ are both AIL (Bullish) or both AIS (Bearish). Confirms strong inter-market breadth. Full/aggressive risk allocation is approved for trend setups and premium writing (CSPs in AIL, CCs in AIS).
            </p>
          </div>

          <div className="p-3 rounded-lg bg-amber-950/30 border border-amber-500/40 space-y-1">
            <div className="font-bold text-amber-300 flex items-center justify-between">
              <span>MIXED (Partial Alignment)</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono">50%–75% Sizing</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              One index is trending while the other is Neutral / Trading Range. Moderate directional edge. Scale down new commitments to 50%–75% of standard capital allocation.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-rose-950/30 border border-rose-500/40 space-y-1">
            <div className="font-bold text-rose-300 flex items-center justify-between">
              <span>CONFLICT (Divergence)</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-mono">Stand Aside / 25%</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              One index is Always-In Long while the other is Always-In Short. Rotational turbulence or sector divergence. Stand aside or reduce sizing to &le;25% until alignment resolves.
            </p>
          </div>
        </div>

        <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
          <span>
            <strong>Immutable Audit Trail:</strong> Daily regime states are recorded immutably in browser storage and edge D1 database (<code className="text-purple-300 font-mono">price_action_regimes</code> table with <code className="text-slate-200 font-mono">INSERT OR IGNORE</code>). Historical dates are never overwritten.
          </span>
        </div>
      </div>

      {/* Setup Alerts Engine & Anti-Spam Guards */}
      <div className="bg-slate-950/80 p-4 rounded-xl border border-indigo-500/40 space-y-3">
        <div className="font-bold text-indigo-300 text-xs uppercase tracking-wider flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-400" />
            <span>Price Action Setup Alerts &amp; Noise Suppression</span>
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
            Multi-Channel Dispatch
          </span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          The alert engine continuously evaluates bar close events and dispatches notifications via Browser, Webhooks (Discord/Slack), and Email with five institutional noise filters:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
            <div className="font-bold text-indigo-300">1. Deduplication Signature</div>
            <p className="text-slate-400 text-[11px]">
              Every notification is keyed by <code className="text-cyan-300 font-mono">ticker:setupType:signalBarDate</code>. A setup cannot fire more than once for the same bar date.
            </p>
          </div>
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
            <div className="font-bold text-indigo-300">2. 5-Bar Directional Cooldown</div>
            <p className="text-slate-400 text-[11px]">
              Once a Bullish or Bearish setup fires on a ticker, subsequent setups in that same direction are muted for 5 trading bars to eliminate clustering fatigue.
            </p>
          </div>
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
            <div className="font-bold text-indigo-300">3. Regime Alignment Filter</div>
            <p className="text-slate-400 text-[11px]">
              Optional filter suppresses contra-trend setups (e.g. Long setups during Bearish AIS regime) to ensure trades align with macro market tailwinds.
            </p>
          </div>
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
            <div className="font-bold text-indigo-300">4. Quiet Hours Window (22:00–07:00 ET)</div>
            <p className="text-slate-400 text-[11px]">
              Non-critical alerts are held overnight, matching platform noise gate <code className="text-amber-300 font-mono">src/notification_noise.py</code>.
            </p>
          </div>
        </div>
      </div>

      {/* Safe Reversion, Alert Toggling & Configuration Reset */}
      <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-700 space-y-3">
        <div className="font-bold text-slate-200 text-xs uppercase tracking-wider flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            <span>Safe Reversion, Alert Toggling &amp; Configuration Reset</span>
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
            Non-Destructive Rollback
          </span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          DeltaHarvest is engineered with strict quarantine boundaries, ensuring that toggling alerts or resetting parameters never corrupts financial ledgers or portfolio positions:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 space-y-1.5">
            <div className="font-bold text-teal-300">Toggling Off Alerts &amp; Channel Muting</div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Click the <strong>Bell icon</strong> in the Price Action Lab header to open the Alerts Preferences drawer. You can toggle off the Master Alerts switch to cease all notifications instantly, or independently mute Browser, Discord, or Email delivery without impacting chart detections.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 space-y-1.5">
            <div className="font-bold text-teal-300">Resetting Detection Parameters</div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              All pattern detection heuristics (20 EMA baseline, 55% trend bar body ratio, 2-bar lag pivots) are anchored to institutional defaults. Reverting or clearing user configuration overrides restores factory parameters immediately.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 space-y-1.5">
            <div className="font-bold text-teal-300">Quarantined Storage &amp; Data Safety</div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Price Action local alert history (<code className="text-teal-300 font-mono">deltaharvest_price_action_alerts</code>) and regime caches are strictly separated from your core options journal (<code className="text-purple-300 font-mono">options_signal_journal</code>), YTD premiums written, and Schwab portfolio balances. Clearing local alert logs never touches trading records.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 space-y-1.5">
            <div className="font-bold text-teal-300">Switching Back to Standard Charts</div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              You can toggle between the Al Brooks Price Action Lab and the standard Interactive Candlestick / Barchart 13-Study view at any time from the Equities navigation menu with 0 state loss or data interference.
            </p>
          </div>
        </div>

        <p className="text-[10px] text-slate-400 italic">
          Regulatory Notice: Not financial advice. Pattern detections, invalidation boundaries, and measured moves
          are probabilistic educational models only.
        </p>
      </div>
    </div>
  );
};
