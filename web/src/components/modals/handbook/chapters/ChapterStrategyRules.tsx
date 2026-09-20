import React from 'react';
import { DirectActionBanner } from './DirectActionBanner';
import { ShieldCheck, TrendingUp, Check, AlertTriangle } from '../../../icons';
import { MenuTreeType, EquitiesTabType, OptionsTabType } from '../../../../types/options';

export interface ChapterStrategyRulesProps {
  onNavigate?: (tree: MenuTreeType, optionsTab?: OptionsTabType, equitiesTab?: EquitiesTabType) => void;
}

export const ChapterStrategyRules: React.FC<ChapterStrategyRulesProps> = ({
  onNavigate,
}) => {
  return (
    <div className="space-y-6">
      <div className="border-l-2 border-emerald-500 pl-4 py-1">
        <h3 className="text-base font-bold text-white">The DeltaHarvest Philosophy</h3>
        <p className="text-slate-400 mt-1">
          DeltaHarvest is designed for conservative, recurring income. Rather than speculating on direction, we sell out-of-the-money (OTM) options outside statistical volatility boundaries (2 Standard Deviations) with rapid time decay (theta).
        </p>
      </div>

      <DirectActionBanner
        actions={[
          {
            label: 'Core Strategy Methodology View',
            location: 'Tree: Methodology',
            onClick: () => onNavigate?.('METHODOLOGY'),
          },
          {
            label: 'Defensive Roll Assistant (0.50Δ Trigger)',
            location: 'Options > Defensive Roll Assistant',
            onClick: () => onNavigate?.('OPTIONS', 'DEFENSIVE_ROLL_ASSISTANT'),
          },
          {
            label: 'Expiration Cadence Rules',
            location: 'Options > Expiration Cadence',
            onClick: () => onNavigate?.('OPTIONS', 'EXPIRATION_CADENCE'),
          },
        ]}
      />

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
              <span><strong>Delta Range:</strong> Default 0.20 Delta (~80% PoP), manually customizable from 0.15Δ Safe up to 0.30Δ High Yield via the Step 3 Harvest Radar calibration controls and Simulator.</span>
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
  );
};
