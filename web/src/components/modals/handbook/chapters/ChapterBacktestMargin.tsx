import React from 'react';
import { DirectActionBanner } from './DirectActionBanner';
import { TrendingUp, ShieldCheck, Activity, AlertTriangle } from '../../../icons';
import { MenuTreeType, EquitiesTabType, OptionsTabType } from '../../../../types/options';

export interface ChapterBacktestMarginProps {
  onNavigate?: (tree: MenuTreeType, optionsTab?: OptionsTabType, equitiesTab?: EquitiesTabType) => void;
}

export const ChapterBacktestMargin: React.FC<ChapterBacktestMarginProps> = ({
  onNavigate,
}) => {
  return (
    <div className="space-y-6">
      <div className="border-l-2 border-purple-500 pl-4 py-1">
        <h3 className="text-base font-bold text-white">Systematic Options Backtesting &amp; FINRA 4210 Margin Stress Testing</h3>
        <p className="text-slate-400 mt-1">
          Empirical edge of 0.15–0.20 Delta harvesting and protecting capital against forced margin liquidations.
        </p>
      </div>

      <DirectActionBanner
        actions={[
          {
            label: 'Portfolio Margin & Stress Test Simulator',
            location: 'Options > Portfolio Margin Sim',
            onClick: () => onNavigate?.('OPTIONS', 'PORTFOLIO_MARGIN_SIM'),
          },
          {
            label: 'Tax Alpha & Wash-Sale Optimizer',
            location: 'Options > Tax Alpha Optimizer',
            onClick: () => onNavigate?.('OPTIONS', 'TAX_ALPHA_OPTIMIZER'),
          },
          {
            label: 'Options Strategy Backtester',
            location: 'Options > Backtest Engine',
            onClick: () => onNavigate?.('OPTIONS', 'BACKTEST_MARGIN'),
          },
        ]}
      />

      {/* Backtest Alpha Advantage */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-950/70 p-4 rounded-xl border border-emerald-500/30 space-y-2">
          <div className="flex items-center space-x-2 text-emerald-400 font-bold text-xs">
            <TrendingUp className="w-4 h-4" />
            <span>The Mathematical Edge of 0.15–0.20 Delta</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Options pricing models systematically overestimate future realized volatility. By consistently selling options 1 to 2 standard deviations OTM (outside Bollinger Bands with 0.15–0.20 Delta), option sellers harvest an average <strong>85%–88% win rate</strong> while capturing positive theta decay each week.
          </p>
        </div>

        <div className="bg-slate-950/70 p-4 rounded-xl border border-purple-500/30 space-y-2">
          <div className="flex items-center space-x-2 text-purple-400 font-bold text-xs">
            <ShieldCheck className="w-4 h-4" />
            <span>Shallower Drawdowns vs Buy &amp; Hold</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Because net premium collected acts as a continuous cash cushion, systematic DeltaHarvest strategies experience roughly <strong>half the maximum drawdown</strong> of pure equity buy-and-hold during broad market downturns, delivering Sharpe ratios &gt; 1.5.
          </p>
        </div>
      </div>

      {/* FINRA 4210 Reg-T vs. Portfolio Margin */}
      <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-3">
        <div className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400" />
          <span>Understanding FINRA 4210: Reg-T vs. Portfolio Margin (TIMS)</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
            <div className="font-bold text-slate-200">Standard Reg-T (100% Collateral)</div>
            <p className="text-slate-400 text-[11px]">
              Under standard retail margin rules, writing a Cash-Secured Put requires reserving 100% of the strike price in cash (e.g. $59,000 for 1 contract of SPY at $590). This limits capital velocity but guarantees zero margin call risk.
            </p>
          </div>
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
            <div className="font-bold text-emerald-400">Portfolio Margin (TIMS Shock Valuation)</div>
            <p className="text-slate-400 text-[11px]">
              Available on qualified accounts ($110k+ net equity), Portfolio Margin models portfolio risk by simulating a &plusmn;15% price shock. Collateral requirements drop by <strong>80%–85%</strong>, permitting institutional-grade capital efficiency.
            </p>
          </div>
        </div>
      </div>

      {/* Stress Testing & Black Swan Preparedness */}
      <div className="bg-slate-950/80 p-4 rounded-xl border border-amber-500/30 space-y-3">
        <div className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          <span>Stress Testing for -10% Corrections &amp; -20% Black Swan Shocks</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          During sharp market crashes, two forces hit short options simultaneously: <strong>gamma expansion</strong> (delta increases as spot plunges toward the strike) and <strong>IV expansion</strong> (implied volatility spikes by 40%–60%). Our stress test tool simulates these exact dual shocks so you know in advance how much excess equity you need to survive severe market distress without receiving an automated broker liquidation call.
        </p>
      </div>
    </div>
  );
};
