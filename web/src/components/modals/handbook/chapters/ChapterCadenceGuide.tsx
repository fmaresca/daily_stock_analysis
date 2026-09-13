import React from 'react';
import { DirectActionBanner } from './DirectActionBanner';
import { MenuTreeType, EquitiesTabType, OptionsTabType } from '../../../../types/options';

export interface ChapterCadenceGuideProps {
  onNavigate?: (tree: MenuTreeType, optionsTab?: OptionsTabType, equitiesTab?: EquitiesTabType) => void;
}

export const ChapterCadenceGuide: React.FC<ChapterCadenceGuideProps> = ({
  onNavigate,
}) => {
  return (
    <div className="space-y-6">
      <div className="border-l-2 border-teal-500 pl-4 py-1">
        <h3 className="text-base font-bold text-white">Expiration Cadence &amp; CBOE Weeklys Registry</h3>
        <p className="text-slate-400 mt-1">
          Understanding why some tickers expire every Friday while others only trade once a month on the 3rd Friday.
        </p>
      </div>

      <DirectActionBanner
        actions={[
          {
            label: 'Expiration Cadence & DTE Matrix',
            location: 'Options > Expiration Cadence',
            onClick: () => onNavigate?.('OPTIONS', 'EXPIRATION_CADENCE'),
          },
          {
            label: 'Options Income Screener (DTE Filter)',
            location: 'Options > Income Screener',
            onClick: () => onNavigate?.('OPTIONS', 'INCOME_SCREENER'),
          },
        ]}
      />

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
  );
};
