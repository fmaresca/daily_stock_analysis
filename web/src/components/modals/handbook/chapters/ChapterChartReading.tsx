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
    </div>
  );
};
