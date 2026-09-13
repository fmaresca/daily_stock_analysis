import React from 'react';
import { AccountCapitalState, TaxLedgerState } from '../../types/options';
import { calculateNetTaxableMetrics } from '../../utils/capitalAndTaxLedger';
import { DollarSign, Percent } from '../icons';

export interface AssetClassSummaryCardsProps {
  capitalState: AccountCapitalState;
  taxState: TaxLedgerState;
  taxMetrics: ReturnType<typeof calculateNetTaxableMetrics>;
  utilizationPct: number;
  onOpenAddTaxRecord: () => void;
}

export const AssetClassSummaryCards: React.FC<AssetClassSummaryCardsProps> = React.memo(({
  capitalState,
  taxState,
  taxMetrics,
  utilizationPct,
  onOpenAddTaxRecord,
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Card A: Liquid Cash & Collateral Budgeting */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800/90 shadow-xl space-y-3 bg-gradient-to-br from-slate-900/90 to-slate-950">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <span>Available Capital &amp; CSP Collateral Ledger</span>
          </span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
            100% Cash-Secured (Zero Margin)
          </span>
        </div>

        <div className="grid grid-cols-3 gap-3 pt-1">
          <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-[11px] text-slate-400 block">Total Liquid Cash</span>
            <span className="text-lg font-bold font-mono text-white">
              ${capitalState.totalCash.toLocaleString()}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-[11px] text-slate-400 block">Committed CSP Collateral</span>
            <span className="text-lg font-bold font-mono text-amber-400">
              ${capitalState.committedCollateral.toLocaleString()}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30">
            <span className="text-[11px] text-emerald-400 block font-semibold">Free Cash Deployable</span>
            <span className="text-lg font-bold font-mono text-emerald-300">
              ${capitalState.freeCash.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Capital Utilization Gauge Bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-[11px] text-slate-400 font-mono">
            <span>Cash Committed: {utilizationPct}%</span>
            <span>
              Affordable $15k Positions: <strong className="text-white">{capitalState.maxAllowedPositions}</strong>
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                utilizationPct > 85
                  ? 'bg-rose-500'
                  : utilizationPct > 65
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${utilizationPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Card B: Calendar YTD Premiums & Tax-Loss Carryforward */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800/90 shadow-xl space-y-3 bg-gradient-to-br from-slate-900/90 to-slate-950">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
            <Percent className="w-4 h-4 text-cyan-400" />
            <span>YTD Option Premiums &amp; Capital Gains ({taxState.currentTaxYear})</span>
          </span>
          <button
            onClick={onOpenAddTaxRecord}
            className="text-[11px] text-cyan-400 hover:text-cyan-300 font-semibold flex items-center space-x-1 cursor-pointer"
          >
            <span>+ Log Closed Trade</span>
          </button>
        </div>

        <div className="grid grid-cols-4 gap-2 pt-1">
          <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-[10px] text-slate-400 block truncate">YTD Premiums</span>
            <span className="text-base font-bold font-mono text-emerald-400">
              +${taxState.ytdPremiumsEarned.toLocaleString(undefined, { minimumFractionDigits: 0 })}
            </span>
          </div>

          <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-[10px] text-slate-400 block truncate">Realized Gains</span>
            <span className="text-base font-bold font-mono text-cyan-400">
              +${taxState.ytdRealizedCapitalGains.toLocaleString(undefined, { minimumFractionDigits: 0 })}
            </span>
          </div>

          <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-[10px] text-slate-400 block truncate">Loss Carryforward</span>
            <span className="text-base font-bold font-mono text-amber-400">
              -${taxState.priorYearLossCarryforward.toLocaleString()}
            </span>
          </div>

          <div className="p-2 rounded-xl bg-blue-950/30 border border-blue-500/30">
            <span className="text-[10px] text-blue-300 block truncate font-semibold">Net Taxable</span>
            <span className="text-base font-bold font-mono text-white">
              ${taxMetrics.netTaxableIncome.toLocaleString(undefined, { minimumFractionDigits: 0 })}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/80 font-mono">
          <span>
            Carryforward Applied: <strong className="text-amber-300">${taxMetrics.carryforwardApplied.toLocaleString()}</strong>
          </span>
          <span>
            Remaining Carryforward: <strong className="text-slate-300">${taxMetrics.remainingCarryforward.toLocaleString()}</strong>
          </span>
        </div>
      </div>
    </div>
  );
});
