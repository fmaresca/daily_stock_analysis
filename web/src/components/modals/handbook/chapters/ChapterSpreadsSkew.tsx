import React from 'react';
import { DirectActionBanner } from './DirectActionBanner';
import { ShieldCheck, TrendingUp, Activity } from '../../../icons';
import { MenuTreeType, EquitiesTabType, OptionsTabType } from '../../../../types/options';

export interface ChapterSpreadsSkewProps {
  onNavigate?: (tree: MenuTreeType, optionsTab?: OptionsTabType, equitiesTab?: EquitiesTabType) => void;
}

export const ChapterSpreadsSkew: React.FC<ChapterSpreadsSkewProps> = ({
  onNavigate,
}) => {
  return (
    <div className="space-y-6">
      <div className="border-l-2 border-emerald-500 pl-4 py-1">
        <h3 className="text-base font-bold text-white">Defined-Risk Vertical Spreads, Iron Condors &amp; Volatility Skew</h3>
        <p className="text-slate-400 mt-1">
          How DeltaHarvest preserves the conservative 0.15–0.20 Delta rule while reducing capital collateral requirements by up to 90%.
        </p>
      </div>

      <DirectActionBanner
        actions={[
          {
            label: 'Multi-Leg Vertical Spreads Table',
            location: 'Options > Multi-Leg Spreads',
            onClick: () => onNavigate?.('OPTIONS', 'MULTI_LEG_SPREADS'),
          },
          {
            label: 'Volatility Skew Radar',
            location: 'Options > Volatility Skew',
            onClick: () => onNavigate?.('OPTIONS', 'VOLATILITY_SKEW'),
          },
          {
            label: 'Poor Mans Covered Call (PMCC)',
            location: 'Options > PMCC Screener',
            onClick: () => onNavigate?.('OPTIONS', 'PMCC_SCREENER'),
          },
        ]}
      />

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
  );
};
