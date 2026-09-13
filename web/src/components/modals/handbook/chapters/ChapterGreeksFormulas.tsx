import React from 'react';
import { DirectActionBanner } from './DirectActionBanner';
import { MenuTreeType, EquitiesTabType, OptionsTabType } from '../../../../types/options';

export interface ChapterGreeksFormulasProps {
  onNavigate?: (tree: MenuTreeType, optionsTab?: OptionsTabType, equitiesTab?: EquitiesTabType) => void;
}

export const ChapterGreeksFormulas: React.FC<ChapterGreeksFormulasProps> = ({
  onNavigate,
}) => {
  return (
    <div className="space-y-6">
      <div className="border-l-2 border-cyan-500 pl-4 py-1">
        <h3 className="text-base font-bold text-white">Options Greeks &amp; Yield Calculations</h3>
        <p className="text-slate-400 mt-1">
          Formulas and practical interpretation for systematic risk management.
        </p>
      </div>

      <DirectActionBanner
        actions={[
          {
            label: 'Option Chain Matrix & Black-Scholes Greeks',
            location: 'Options > Option Chain Matrix',
            onClick: () => onNavigate?.('OPTIONS', 'OPTION_CHAIN_MATRIX'),
          },
          {
            label: 'Live Delta Greeks Table',
            location: 'Options > Delta Greeks',
            onClick: () => onNavigate?.('OPTIONS', 'DELTA_GREEKS'),
          },
        ]}
      />

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
  );
};
