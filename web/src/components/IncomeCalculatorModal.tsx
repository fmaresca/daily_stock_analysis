import React, { useState } from 'react';
import { X, DollarSign, Calculator, ShieldCheck, ArrowRight } from './icons';
import { OptionOpportunity } from '../types/options';

interface IncomeCalculatorModalProps {
  opportunity: OptionOpportunity | null;
  onClose: () => void;
}

export const IncomeCalculatorModal: React.FC<IncomeCalculatorModalProps> = ({
  opportunity,
  onClose,
}) => {
  const [allocatedCapital, setAllocatedCapital] = useState<number>(25000);

  if (!opportunity) return null;

  const collateralPerContract = opportunity.collateral_required;
  const contractsCount = Math.max(1, Math.floor(allocatedCapital / collateralPerContract));
  const actualDeployed = contractsCount * collateralPerContract;
  const cashReserve = Math.max(0, allocatedCapital - actualDeployed);

  const upfrontIncome = contractsCount * opportunity.premium_total;
  const periodReturnPct = (upfrontIncome / actualDeployed) * 100;
  const projectedWeekly = (upfrontIncome / opportunity.dte) * 7;
  const projectedMonthly = projectedWeekly * 4.33;
  const projectedAnnual = (actualDeployed * (opportunity.annualized_roc / 100));

  const tBillAnnual = actualDeployed * 0.045; // 4.5% risk-free rate comparison
  const extraIncomeVsTBill = projectedAnnual - tBillAnnual;

  const presets = [10000, 25000, 50000, 100000];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="glass-panel w-full max-w-2xl rounded-2xl border border-slate-700/80 shadow-2xl overflow-hidden text-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Income & Capital Planner
              </h2>
              <p className="text-xs text-slate-400">
                {opportunity.symbol} ${opportunity.strike} {opportunity.strategy_name} ({opportunity.dte}d)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Capital Input and Quick Presets */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Available Capital to Deploy ($ USD)
            </label>

            <div className="flex items-center space-x-3">
              <div className="relative flex-1">
                <DollarSign className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="number"
                  step="1000"
                  value={allocatedCapital}
                  onChange={(e) => setAllocatedCapital(Math.max(1000, Number(e.target.value)))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-lg font-mono font-bold text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 mt-2">
              <span className="text-[11px] text-slate-400">Presets:</span>
              {presets.map((amt) => (
                <button
                  key={amt}
                  onClick={() => setAllocatedCapital(amt)}
                  className={`px-2.5 py-1 rounded-md text-xs font-mono transition-colors ${
                    allocatedCapital === amt
                      ? 'bg-emerald-600 text-white font-bold'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  ${(amt / 1000).toFixed(0)}k
                </button>
              ))}
            </div>
          </div>

          {/* Sizing Breakdown */}
          <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 grid grid-cols-3 gap-3 text-center">
            <div>
              <div className="text-[11px] text-slate-400">Contracts Affordable</div>
              <div className="text-2xl font-black font-mono text-white mt-0.5">
                {contractsCount} <span className="text-xs font-normal text-slate-400">cts</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                {contractsCount * 100} shares covered
              </div>
            </div>

            <div>
              <div className="text-[11px] text-slate-400">Capital Deployed</div>
              <div className="text-2xl font-black font-mono text-emerald-400 mt-0.5">
                ${actualDeployed.toLocaleString()}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                ${cashReserve.toLocaleString()} reserve
              </div>
            </div>

            <div>
              <div className="text-[11px] text-slate-400">Immediate Cash Yield</div>
              <div className="text-2xl font-black font-mono text-cyan-400 mt-0.5">
                +${upfrontIncome.toLocaleString()}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                {periodReturnPct.toFixed(2)}% in {opportunity.dte}d
              </div>
            </div>
          </div>

          {/* Projected Cash Flow Timeline */}
          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
              <span>Projected Passive Cash Flow</span>
              <span className="text-emerald-400 font-mono font-semibold">
                {opportunity.annualized_roc}% Annualized ROC
              </span>
            </h3>

            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800 text-center">
                <div className="text-[10px] text-slate-400 uppercase">Avg Weekly Income</div>
                <div className="text-lg font-mono font-bold text-white mt-1">
                  ${projectedWeekly.toFixed(0)}
                </div>
                <div className="text-[10px] text-slate-500">per 7 days</div>
              </div>

              <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800 text-center">
                <div className="text-[10px] text-slate-400 uppercase">Monthly Run-Rate</div>
                <div className="text-lg font-mono font-bold text-emerald-400 mt-1">
                  ${projectedMonthly.toFixed(0)}
                </div>
                <div className="text-[10px] text-slate-500">per ~30 days</div>
              </div>

              <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800 text-center">
                <div className="text-[10px] text-slate-400 uppercase">Projected 12M Income</div>
                <div className="text-lg font-mono font-bold text-cyan-400 mt-1">
                  ${projectedAnnual.toFixed(0)}
                </div>
                <div className="text-[10px] text-slate-500">annualized cash</div>
              </div>
            </div>

            {/* Comparison vs T-Bills */}
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>
                  Generates <strong>+${extraIncomeVsTBill.toFixed(0)}/yr</strong> above standard 4.5% Treasury yield on the same capital.
                </span>
              </div>
              <ArrowRight className="w-4 h-4 text-emerald-400 hidden sm:block" />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
