import React from 'react';
import { DirectActionBanner } from './DirectActionBanner';
import { ShieldCheck, AlertTriangle, ShieldAlert, Activity, TrendingUp } from '../../../icons';
import { MenuTreeType, EquitiesTabType, OptionsTabType } from '../../../../types/options';

export interface ChapterSolvencyCefProps {
  onNavigate?: (tree: MenuTreeType, optionsTab?: OptionsTabType, equitiesTab?: EquitiesTabType) => void;
  onOpenValuation?: (ticker?: string) => void;
}

export const ChapterSolvencyCef: React.FC<ChapterSolvencyCefProps> = ({
  onNavigate,
  onOpenValuation,
}) => {
  return (
    <div className="space-y-6">
      <div className="border-l-2 border-indigo-500 pl-4 py-1">
        <h3 className="text-base font-bold text-white">Fundamental Solvency, Altman Z-Score &amp; CEF Anatomy</h3>
        <p className="text-slate-400 mt-1">
          Protecting option sellers from balance-sheet bankruptcy risks and understanding CEF income mechanics.
        </p>
      </div>

      <DirectActionBanner
        actions={[
          {
            label: 'Fundamental Solvency & SEC EDGAR Table',
            location: 'Equities > Fundamental Health',
            onClick: () => onNavigate?.('EQUITIES', undefined, 'FUNDAMENTAL_HEALTH'),
          },
          {
            label: 'Launch DCF Valuation & DuPont Terminal (v3.4)',
            location: 'Valuation Terminal',
            onClick: () => onOpenValuation?.('NVDA'),
          },
        ]}
      />

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
  );
};
