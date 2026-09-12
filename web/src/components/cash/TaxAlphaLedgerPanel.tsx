import React from 'react';
import {
  TrendingUp,
  Percent,
  Plus,
  Clock,
  Edit2,
} from '../icons';
import { AccountCapitalState, TaxLedgerState } from '../../types/options';
import { calculateNetTaxableMetrics } from '../../utils/capitalAndTaxLedger';

export interface TaxAlphaLedgerPanelProps {
  capitalState: AccountCapitalState;
  taxState: TaxLedgerState;
  taxMetrics: ReturnType<typeof calculateNetTaxableMetrics>;
  onOpenAddDisbursement: () => void;
  onRemoveDisbursement: (id: string) => void;
  onOpenEditPriorYtd: () => void;
  onOpenAddWeekPremium: () => void;
  onOpenEditTaxGains: () => void;
}

export const TaxAlphaLedgerPanel: React.FC<TaxAlphaLedgerPanelProps> = React.memo(({
  capitalState,
  taxState,
  taxMetrics,
  onOpenAddDisbursement,
  onRemoveDisbursement,
  onOpenEditPriorYtd,
  onOpenAddWeekPremium,
  onOpenEditTaxGains,
}) => {
  return (
    <div className="space-y-4">
      {/* Itemized Planned Disbursements Strip */}
      <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-2 text-xs">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-slate-300 flex items-center space-x-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>Active Planned Disbursements (Encumbered Against Free Cash)</span>
          </span>
          <button
            onClick={onOpenAddDisbursement}
            className="text-[11px] text-cyan-400 hover:text-cyan-300 font-bold"
          >
            + Add Item
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {capitalState.plannedDisbursements.length === 0 ? (
            <span className="text-slate-500 text-[11px]">No planned disbursements encumbering cash.</span>
          ) : (
            capitalState.plannedDisbursements.map((d) => (
              <div
                key={d.id}
                className="px-2.5 py-1 rounded-lg bg-slate-900 border border-amber-500/30 flex items-center space-x-2 text-xs font-mono"
              >
                <span className="text-white font-semibold">{d.description}:</span>
                <span className="text-amber-400 font-bold">-${d.amount.toLocaleString()}</span>
                <span className="text-[10px] text-slate-400 lowercase">({d.frequency || 'weekly'})</span>
                <button
                  onClick={() => onRemoveDisbursement(d.id)}
                  className="text-slate-500 hover:text-rose-400 text-sm font-bold pl-1 cursor-pointer"
                  title="Remove disbursement"
                >
                  &times;
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Dual Panels: Calendar YTD Premiums & YTD Capital Gains / Carryover */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Panel A: Calendar YTD Premiums Tracking */}
        <div className="glass-panel p-4 rounded-2xl border border-slate-800 shadow-xl space-y-3 bg-gradient-to-br from-slate-900/90 to-slate-950">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>Calendar YTD Premiums Tracking ({taxState.currentTaxYear})</span>
            </span>
            <div className="flex items-center space-x-2">
              <button
                onClick={onOpenEditPriorYtd}
                className="text-[11px] text-cyan-400 hover:text-cyan-300 font-bold flex items-center space-x-1 cursor-pointer bg-slate-900/80 px-2.5 py-1 rounded-lg border border-cyan-500/30 hover:border-cyan-400/60 transition-colors"
                title="Directly edit starting YTD baseline balance"
              >
                <Edit2 className="w-3 h-3" />
                <span>Edit Starting YTD</span>
              </button>
              <button
                onClick={onOpenAddWeekPremium}
                className="text-[11px] text-emerald-400 hover:text-emerald-300 font-bold flex items-center space-x-1 cursor-pointer bg-slate-900/80 px-2.5 py-1 rounded-lg border border-emerald-500/30 hover:border-emerald-400/60 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Log Current Week Premium</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-1">
            <div
              onClick={onOpenEditPriorYtd}
              className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/50 cursor-pointer transition-colors group relative"
              title="Click to edit starting YTD balance ($603,305.40)"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400 block font-medium">Starting / Prior YTD</span>
                <Edit2 className="w-3 h-3 text-slate-500 group-hover:text-cyan-400 transition-colors" />
              </div>
              <span className="text-base font-bold font-mono text-cyan-300">
                ${capitalState.priorYtdPremiumBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-[9px] text-slate-500 block">Baseline ($603,305.40 default)</span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-emerald-500/30">
              <span className="text-[10px] text-emerald-400 block font-semibold">+ Current Week</span>
              <span className="text-base font-bold font-mono text-emerald-300">
                +${capitalState.currentWeekPremiumsCollected.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-[9px] text-emerald-400/70 block">Settled this week</span>
            </div>

            <div className="p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-500/40">
              <span className="text-[10px] text-white block font-bold">= Cumulative YTD</span>
              <span className="text-base font-bold font-mono text-emerald-400">
                ${capitalState.ytdPremiumsEarned.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-[9px] text-slate-400 block">2026 Calendar Year</span>
            </div>
          </div>

          <p className="text-[11px] text-slate-400">
            Captures all options expired, exercised, or rolled for the current week and adds to your calendar year-to-date starting balance ($603,305.40 baseline).
          </p>
        </div>

        {/* Panel B: YTD Capital Gains & Loss Carryforward Offset */}
        <div className="glass-panel p-4 rounded-2xl border border-slate-800 shadow-xl space-y-3 bg-gradient-to-br from-slate-900/90 to-slate-950">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-1.5">
              <Percent className="w-4 h-4 text-cyan-400" />
              <span>YTD Capital Gains &amp; Loss Carryforward ({taxState.currentTaxYear})</span>
            </span>
            <button
              onClick={onOpenEditTaxGains}
              className="text-[11px] text-cyan-400 hover:text-cyan-300 font-bold flex items-center space-x-1 cursor-pointer bg-slate-900/80 px-2.5 py-1 rounded-lg border border-cyan-500/30 hover:border-cyan-400/60 transition-colors"
              title="Edit YTD Realized Capital Gains, Losses, and Carryforwards"
            >
              <Edit2 className="w-3 h-3" />
              <span>Edit Gains &amp; Carryover</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
            <div
              onClick={onOpenEditTaxGains}
              className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/50 cursor-pointer transition-colors group"
              title="Click to edit YTD Realized Capital Gains"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-emerald-400 block font-semibold">Realized Gains</span>
                <Edit2 className="w-2.5 h-2.5 text-slate-500 group-hover:text-emerald-400" />
              </div>
              <span className="text-base font-bold font-mono text-emerald-400">
                +${taxState.ytdRealizedCapitalGains.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-[9px] text-slate-500 block">YTD Capital Gains</span>
            </div>

            <div
              onClick={onOpenEditTaxGains}
              className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-rose-500/50 cursor-pointer transition-colors group"
              title="Click to edit YTD Realized Capital Losses"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-rose-400 block font-semibold">Realized Losses</span>
                <Edit2 className="w-2.5 h-2.5 text-slate-500 group-hover:text-rose-400" />
              </div>
              <span className="text-base font-bold font-mono text-rose-400">
                -${taxState.ytdRealizedCapitalLosses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-[9px] text-slate-500 block">YTD Capital Losses</span>
            </div>

            <div
              onClick={onOpenEditTaxGains}
              className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-amber-500/50 cursor-pointer transition-colors group"
              title="Click to edit Prior-Year Loss Carryforward"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-amber-400 block font-semibold">Loss Carryforward</span>
                <Edit2 className="w-2.5 h-2.5 text-slate-500 group-hover:text-amber-400" />
              </div>
              <span className="text-base font-bold font-mono text-amber-400">
                -${taxState.priorYearLossCarryforward.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-[9px] text-slate-500 block">IRS Carryover</span>
            </div>

            <div className="p-2.5 rounded-xl bg-blue-950/30 border border-blue-500/30">
              <span className="text-[10px] text-blue-300 block font-semibold">Net Taxable Est.</span>
              <span className="text-base font-bold font-mono text-white">
                ${taxMetrics.netTaxableIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-[9px] text-slate-400 block">Gains - Losses - Carry</span>
            </div>
          </div>

          <div className="flex justify-between items-center text-[11px] text-slate-400 pt-1 border-t border-slate-800/80 font-mono">
            <span>
              Net Cap Gains:{' '}
              <strong className={taxState.ytdRealizedCapitalGains - taxState.ytdRealizedCapitalLosses >= 0 ? "text-emerald-400" : "text-rose-400"}>
                {taxState.ytdRealizedCapitalGains - taxState.ytdRealizedCapitalLosses >= 0 ? '+' : ''}
                ${(taxState.ytdRealizedCapitalGains - taxState.ytdRealizedCapitalLosses).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </strong>
            </span>
            <span>
              Carryforward Offsetting:{' '}
              <strong className="text-cyan-300">
                -${taxMetrics.carryforwardApplied.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </strong>
            </span>
            <span>
              Premiums Included:{' '}
              <strong className="text-emerald-300">
                +${capitalState.ytdPremiumsEarned.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </strong>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
});

TaxAlphaLedgerPanel.displayName = 'TaxAlphaLedgerPanel';
