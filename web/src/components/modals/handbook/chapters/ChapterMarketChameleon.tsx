import React from 'react';
import { DirectActionBanner } from './DirectActionBanner';
import { MenuTreeType, EquitiesTabType, OptionsTabType } from '../../../../types/options';

export interface ChapterMarketChameleonProps {
  onNavigate?: (tree: MenuTreeType, optionsTab?: OptionsTabType, equitiesTab?: EquitiesTabType) => void;
}

export const ChapterMarketChameleon: React.FC<ChapterMarketChameleonProps> = ({
  onNavigate,
}) => {
  return (
    <div className="space-y-6">
      <div className="border-l-2 border-amber-400 pl-4 py-1">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <span>🦎 MarketChameleon Quantitative Patterns &amp; Stock Ideas</span>
        </h3>
        <p className="text-slate-400 mt-1">
          MarketChameleon uses a triple Simple Moving Average (SMA 20/50/250) engine and 6-month price range dynamics to classify equities into actionable technical patterns and institutional Stock Ideas.
        </p>
      </div>

      <DirectActionBanner
        actions={[
          {
            label: 'Cascading Screener (Market Chameleon Tab)',
            location: 'Workflow > Cascading Screener',
            onClick: () => onNavigate?.('WORKFLOW', 'CASCADING_SCREENER'),
          },
          {
            label: 'Technical Screener (SMA Analysis)',
            location: 'Equities > Technical Screener',
            onClick: () => onNavigate?.('EQUITIES', undefined, 'TECHNICAL_SCREENER'),
          },
        ]}
      />

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
  );
};
