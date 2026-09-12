import React, { useState, useEffect } from 'react';
import {
  Sliders,
  Clock,
  TrendingUp,
  Percent,
} from '../icons';
import {
  AccountCapitalState,
  TaxLedgerState,
} from '../../types/options';
import {
  MAX_SINGLE_EQUITY_POSITION_LIMIT,
  DEFAULT_PER_POSITION_BUDGET,
} from '../../utils/capitalAndTaxLedger';

// ----------------------------------------------------
// 1. EditBalancesModal
// ----------------------------------------------------
export interface EditBalancesModalProps {
  isOpen: boolean;
  onClose: () => void;
  capitalState: AccountCapitalState;
  taxState: TaxLedgerState;
  onSave: (data: {
    totalCash: number;
    targetAllocation: number;
    priorYtdPremiums: number;
    currentWeekPremiums: number;
    lossCarryover: number;
    realizedGains: number;
    realizedLosses: number;
  }) => void;
}

export const EditBalancesModal: React.FC<EditBalancesModalProps> = ({
  isOpen,
  onClose,
  capitalState,
  taxState,
  onSave,
}) => {
  const [inputTotalCash, setInputTotalCash] = useState<number>(capitalState.totalCash);
  const [inputTargetAllocation, setInputTargetAllocation] = useState<number>(
    capitalState.maxPerPositionAllocation || DEFAULT_PER_POSITION_BUDGET
  );
  const [inputPriorYtdPremiums, setInputPriorYtdPremiums] = useState<number>(
    capitalState.priorYtdPremiumBalance
  );
  const [inputCurrentWeekPremiums, setInputCurrentWeekPremiums] = useState<number>(
    capitalState.currentWeekPremiumsCollected
  );
  const [inputLossCarryover, setInputLossCarryover] = useState<number>(
    taxState.priorYearLossCarryforward
  );
  const [inputRealizedGains, setInputRealizedGains] = useState<number>(
    taxState.ytdRealizedCapitalGains
  );
  const [inputRealizedLosses, setInputRealizedLosses] = useState<number>(
    taxState.ytdRealizedCapitalLosses
  );

  useEffect(() => {
    if (isOpen) {
      setInputTotalCash(capitalState.totalCash);
      setInputTargetAllocation(capitalState.maxPerPositionAllocation || DEFAULT_PER_POSITION_BUDGET);
      setInputPriorYtdPremiums(capitalState.priorYtdPremiumBalance);
      setInputCurrentWeekPremiums(capitalState.currentWeekPremiumsCollected);
      setInputLossCarryover(taxState.priorYearLossCarryforward);
      setInputRealizedGains(taxState.ytdRealizedCapitalGains);
      setInputRealizedLosses(taxState.ytdRealizedCapitalLosses);
    }
  }, [isOpen, capitalState, taxState]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      totalCash: Number(inputTotalCash),
      targetAllocation: Number(inputTargetAllocation),
      priorYtdPremiums: Number(inputPriorYtdPremiums),
      currentWeekPremiums: Number(inputCurrentWeekPremiums),
      lossCarryover: Number(inputLossCarryover),
      realizedGains: Number(inputRealizedGains),
      realizedLosses: Number(inputRealizedLosses),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 max-w-md w-full shadow-2xl space-y-4 bg-slate-950">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-base font-bold text-white flex items-center space-x-2">
            <Sliders className="w-5 h-5 text-cyan-400" />
            <span>Edit Account Balances &amp; Tax Carryover</span>
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-lg font-bold cursor-pointer"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="text-slate-300 block mb-1 font-semibold">
              Total Brokerage Cash Position ($)
            </label>
            <input
              type="number"
              value={inputTotalCash}
              onChange={(e) => setInputTotalCash(Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
              required
            />
            <span className="text-[10px] text-slate-500 mt-0.5 block">
              Unadjusted cash position before subtracting planned living disbursements and CSP collateral.
            </span>
          </div>

          <div>
            <label className="text-slate-300 block mb-1 font-semibold flex items-center justify-between">
              <span>Target Allocation per Position ($)</span>
              <span className="text-[10px] text-cyan-400 font-mono">Max $200,000 / Equity</span>
            </label>
            <input
              type="number"
              step="5000"
              max={MAX_SINGLE_EQUITY_POSITION_LIMIT}
              value={inputTargetAllocation}
              onChange={(e) => setInputTargetAllocation(Math.min(MAX_SINGLE_EQUITY_POSITION_LIMIT, Number(e.target.value)))}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
              required
            />
            <span className="text-[10px] text-slate-500 mt-0.5 block">
              Target capital allocation per CSP write. The position limit on any one equity security CSP will be no more than $200,000.
            </span>
          </div>

          <div>
            <label className="text-slate-300 block mb-1 font-semibold">
              Previous / Starting YTD Premiums Balance ($)
            </label>
            <input
              type="number"
              step="0.01"
              value={inputPriorYtdPremiums}
              onChange={(e) => setInputPriorYtdPremiums(Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
              required
            />
            <span className="text-[10px] text-slate-500 mt-0.5 block">
              Cumulative option premiums harvested prior to the current trading week. Resets to zero on Jan 1.
            </span>
          </div>

          <div>
            <label className="text-slate-300 block mb-1 font-semibold">
              Current Week Premiums Collected ($)
            </label>
            <input
              type="number"
              step="0.01"
              value={inputCurrentWeekPremiums}
              onChange={(e) => setInputCurrentWeekPremiums(Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
              required
            />
            <span className="text-[10px] text-slate-500 mt-0.5 block">
              Net premium settled from Friday expirations or future rolls for the current week.
            </span>
          </div>

          <div>
            <label className="text-slate-300 block mb-1 font-semibold">
              Prior-Year Capital Loss Carryforward ($)
            </label>
            <input
              type="number"
              value={inputLossCarryover}
              onChange={(e) => setInputLossCarryover(Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
              required
            />
            <span className="text-[10px] text-slate-500 mt-0.5 block">
              Capital loss carried over from prior year to offset current year realized gains and option premiums.
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-300 block mb-1 font-semibold">
                YTD Realized Gains ($)
              </label>
              <input
                type="number"
                step="0.01"
                value={inputRealizedGains}
                onChange={(e) => setInputRealizedGains(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-emerald-400 font-mono"
                required
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">
                Closed equity/ETF gains
              </span>
            </div>
            <div>
              <label className="text-slate-300 block mb-1 font-semibold">
                YTD Realized Losses ($)
              </label>
              <input
                type="number"
                step="0.01"
                value={inputRealizedLosses}
                onChange={(e) => setInputRealizedLosses(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-rose-400 font-mono"
                required
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">
                Closed equity/ETF losses
              </span>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer"
            >
              Save Balances
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ----------------------------------------------------
// 2. AddDisbursementModal
// ----------------------------------------------------
export interface AddDisbursementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (description: string, amount: number, frequency: 'WEEKLY' | 'MONTHLY' | 'ONE_TIME') => void;
}

export const AddDisbursementModal: React.FC<AddDisbursementModalProps> = ({
  isOpen,
  onClose,
  onAdd,
}) => {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<number>(5000);
  const [frequency, setFrequency] = useState<'WEEKLY' | 'MONTHLY' | 'ONE_TIME'>('WEEKLY');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd(description, amount, frequency);
    setDescription('');
    setAmount(5000);
    setFrequency('WEEKLY');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 max-w-md w-full shadow-2xl space-y-4 bg-slate-950">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-base font-bold text-white flex items-center space-x-2">
            <Clock className="w-5 h-5 text-amber-400" />
            <span>Add Planned or Recurring Disbursement</span>
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-lg font-bold cursor-pointer"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="text-slate-300 block mb-1 font-semibold">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Weekly Living Expenses, Tax Reserve"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
              required
            />
          </div>

          <div>
            <label className="text-slate-300 block mb-1 font-semibold">Amount ($)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
              required
            />
          </div>

          <div>
            <label className="text-slate-300 block mb-1 font-semibold">Frequency</label>
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value as any)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
            >
              <option value="WEEKLY">Weekly (Default $5,000)</option>
              <option value="MONTHLY">Monthly</option>
              <option value="ONE_TIME">One-Time Planned Withdrawal</option>
            </select>
          </div>

          <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold cursor-pointer"
            >
              Encumber Cash
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ----------------------------------------------------
// 3. AddWeeklyPremiumModal
// ----------------------------------------------------
export interface AddWeeklyPremiumModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialStartingYtd: number;
  currentWeekPremiums: number;
  onAdd: (data: {
    startingYtd: number;
    symbol: string;
    type: 'EXPIRED' | 'EXERCISED' | 'ROLLED';
    amount: number;
    note: string;
  }) => void;
}

export const AddWeeklyPremiumModal: React.FC<AddWeeklyPremiumModalProps> = ({
  isOpen,
  onClose,
  initialStartingYtd,
  currentWeekPremiums,
  onAdd,
}) => {
  const [modalStartingYtdInput, setModalStartingYtdInput] = useState<number>(initialStartingYtd);
  const [premSymbol, setPremSymbol] = useState('');
  const [premAmount, setPremAmount] = useState<number>(350);
  const [premType, setPremType] = useState<'EXPIRED' | 'EXERCISED' | 'ROLLED'>('EXPIRED');
  const [premNote, setPremNote] = useState('');

  useEffect(() => {
    if (isOpen) {
      setModalStartingYtdInput(initialStartingYtd);
    }
  }, [isOpen, initialStartingYtd]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({
      startingYtd: Number(modalStartingYtdInput) || initialStartingYtd,
      symbol: premSymbol,
      type: premType,
      amount: Number(premAmount),
      note: premNote,
    });
    setPremSymbol('');
    setPremNote('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 max-w-md w-full shadow-2xl space-y-4 bg-slate-950">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-base font-bold text-white flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            <span>Log Settled Option Premium for Current Week</span>
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-lg font-bold cursor-pointer"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="p-3 bg-slate-900/90 rounded-xl border border-emerald-500/30 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-slate-200 font-semibold text-xs flex items-center space-x-1.5">
                <span>Starting / Prior YTD Premiums ($)</span>
                <span className="text-[10px] text-slate-400 font-normal">(Verified 2026 Baseline)</span>
              </label>
              <button
                type="button"
                onClick={() => setModalStartingYtdInput(603305.40)}
                className="text-[10px] text-emerald-400 hover:text-emerald-300 underline font-mono cursor-pointer"
              >
                Reset to $603,305.40
              </button>
            </div>
            <input
              type="number"
              step="0.01"
              value={modalStartingYtdInput}
              onChange={(e) => setModalStartingYtdInput(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-emerald-400 font-bold font-mono text-sm focus:border-emerald-500 focus:outline-none"
              required
            />
            <div className="flex justify-between items-center text-[10px] text-slate-400 pt-0.5">
              <span>Current Week premium will be added to this baseline amount.</span>
              <span className="font-mono text-slate-300">
                Preview YTD: ${(Number(modalStartingYtdInput || 0) + currentWeekPremiums + Number(premAmount || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <div>
            <label className="text-slate-300 block mb-1 font-semibold">Symbol</label>
            <input
              type="text"
              value={premSymbol}
              onChange={(e) => setPremSymbol(e.target.value)}
              placeholder="e.g. PANW, PLTR, TSLA, NET"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
              required
            />
          </div>

          <div>
            <label className="text-slate-300 block mb-1 font-semibold">Settlement Outcome</label>
            <select
              value={premType}
              onChange={(e) => setPremType(e.target.value as any)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
            >
              <option value="EXPIRED">Expired Worthless (100% Premium Captured)</option>
              <option value="EXERCISED">Exercised / Assigned</option>
              <option value="ROLLED">Rolled for Future Week (Net Credit Captured)</option>
            </select>
          </div>

          <div>
            <label className="text-slate-300 block mb-1 font-semibold">Net Premium Amount ($)</label>
            <input
              type="number"
              step="0.01"
              value={premAmount}
              onChange={(e) => setPremAmount(Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
              required
            />
          </div>

          <div>
            <label className="text-slate-300 block mb-1 font-semibold">Notes</label>
            <input
              type="text"
              value={premNote}
              onChange={(e) => setPremNote(e.target.value)}
              placeholder="e.g. Friday expiration settlement"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer"
            >
              Add to Current Week
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ----------------------------------------------------
// 4. EditPriorYtdModal
// ----------------------------------------------------
export interface EditPriorYtdModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPriorYtd: number;
  currentWeekPremiums: number;
  onSave: (newPriorYtd: number) => void;
}

export const EditPriorYtdModal: React.FC<EditPriorYtdModalProps> = ({
  isOpen,
  onClose,
  currentPriorYtd,
  currentWeekPremiums,
  onSave,
}) => {
  const [inputVal, setInputVal] = useState<number>(currentPriorYtd);

  useEffect(() => {
    if (isOpen) {
      setInputVal(currentPriorYtd);
    }
  }, [isOpen, currentPriorYtd]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(Number(inputVal));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 max-w-md w-full shadow-2xl space-y-4 bg-slate-950">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-base font-bold text-white flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-cyan-400" />
            <span>Edit Calendar YTD Starting Balance</span>
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-lg font-bold cursor-pointer"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="p-3 bg-cyan-950/20 border border-cyan-500/30 rounded-xl space-y-1">
            <span className="text-[11px] font-bold text-cyan-300 block">Baseline Tracking for 2026</span>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Enter your verified calendar year-to-date starting option premiums prior to the current week.
              Current verified baseline is <strong className="text-white font-mono">$603,305.40</strong>.
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-slate-300 font-semibold">
                Starting / Prior YTD Premiums ($)
              </label>
              <button
                type="button"
                onClick={() => setInputVal(603305.40)}
                className="text-[11px] text-emerald-400 hover:text-emerald-300 underline font-mono cursor-pointer"
              >
                Quick Fill: $603,305.40
              </button>
            </div>
            <input
              type="number"
              step="0.01"
              value={inputVal}
              onChange={(e) => setInputVal(Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-emerald-400 font-mono font-bold text-sm focus:border-cyan-500 focus:outline-none"
              required
            />
          </div>

          <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1 font-mono text-[11px]">
            <div className="flex justify-between text-slate-400">
              <span>Current Week Premiums:</span>
              <span className="text-emerald-400">+${currentWeekPremiums.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-white font-bold border-t border-slate-800 pt-1">
              <span>New Cumulative YTD:</span>
              <span className="text-emerald-300">${(Number(inputVal || 0) + currentWeekPremiums).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold cursor-pointer"
            >
              Save YTD Baseline
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ----------------------------------------------------
// 5. EditTaxGainsModal
// ----------------------------------------------------
export interface EditTaxGainsModalProps {
  isOpen: boolean;
  onClose: () => void;
  taxState: TaxLedgerState;
  ytdPremiumsEarned: number;
  onSave: (data: {
    taxYear: number;
    realizedGains: number;
    realizedLosses: number;
    lossCarryover: number;
  }) => void;
}

export const EditTaxGainsModal: React.FC<EditTaxGainsModalProps> = ({
  isOpen,
  onClose,
  taxState,
  ytdPremiumsEarned,
  onSave,
}) => {
  const [inputTaxYear, setInputTaxYear] = useState<number>(taxState.currentTaxYear);
  const [inputRealizedGains, setInputRealizedGains] = useState<number>(taxState.ytdRealizedCapitalGains);
  const [inputRealizedLosses, setInputRealizedLosses] = useState<number>(taxState.ytdRealizedCapitalLosses);
  const [inputTaxCarryover, setInputTaxCarryover] = useState<number>(taxState.priorYearLossCarryforward);

  useEffect(() => {
    if (isOpen) {
      setInputTaxYear(taxState.currentTaxYear);
      setInputRealizedGains(taxState.ytdRealizedCapitalGains);
      setInputRealizedLosses(taxState.ytdRealizedCapitalLosses);
      setInputTaxCarryover(taxState.priorYearLossCarryforward);
    }
  }, [isOpen, taxState]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      taxYear: Number(inputTaxYear) || 2026,
      realizedGains: Number(inputRealizedGains),
      realizedLosses: Number(inputRealizedLosses),
      lossCarryover: Number(inputTaxCarryover),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 max-w-md w-full shadow-2xl space-y-4 bg-slate-950">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-base font-bold text-white flex items-center space-x-2">
            <Percent className="w-5 h-5 text-cyan-400" />
            <span>Edit YTD Capital Gains &amp; Loss Carryforward</span>
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-lg font-bold cursor-pointer"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="text-slate-300 block mb-1 font-semibold">Tax Year</label>
            <input
              type="number"
              value={inputTaxYear}
              onChange={(e) => setInputTaxYear(Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
              required
            />
          </div>

          <div>
            <label className="text-slate-300 block mb-1 font-semibold">
              YTD Realized Capital Gains ($)
            </label>
            <input
              type="number"
              step="0.01"
              value={inputRealizedGains}
              onChange={(e) => setInputRealizedGains(Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-emerald-400 font-mono font-bold"
              required
            />
            <span className="text-[10px] text-slate-500 mt-0.5 block">
              Total realized gains on equities/ETFs closed this tax year.
            </span>
          </div>

          <div>
            <label className="text-slate-300 block mb-1 font-semibold">
              YTD Realized Capital Losses ($)
            </label>
            <input
              type="number"
              step="0.01"
              value={inputRealizedLosses}
              onChange={(e) => setInputRealizedLosses(Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-rose-400 font-mono font-bold"
              required
            />
            <span className="text-[10px] text-slate-500 mt-0.5 block">
              Total realized losses on closed trades to offset gains.
            </span>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-slate-300 font-semibold">
                Prior-Year Capital Loss Carryforward ($)
              </label>
              <button
                type="button"
                onClick={() => setInputTaxCarryover(3000)}
                className="text-[11px] text-amber-400 hover:text-amber-300 underline font-mono cursor-pointer"
              >
                IRS Default: $3,000
              </button>
            </div>
            <input
              type="number"
              step="0.01"
              value={inputTaxCarryover}
              onChange={(e) => setInputTaxCarryover(Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-amber-400 font-mono font-bold"
              required
            />
            <span className="text-[10px] text-slate-500 mt-0.5 block">
              Carried forward from previous years (Schedule D / Form 1040).
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5 font-mono text-[11px]">
            <div className="flex justify-between text-slate-400">
              <span>Net Capital Gains / Losses:</span>
              <span className={Number(inputRealizedGains || 0) - Number(inputRealizedLosses || 0) >= 0 ? "text-emerald-400" : "text-rose-400"}>
                {Number(inputRealizedGains || 0) - Number(inputRealizedLosses || 0) >= 0 ? '+' : ''}${(Number(inputRealizedGains || 0) - Number(inputRealizedLosses || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Carryforward Deducted:</span>
              <span className="text-amber-400">-${Math.min(Math.max(0, Number(inputRealizedGains || 0) - Number(inputRealizedLosses || 0)), Number(inputTaxCarryover || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-white font-bold border-t border-slate-800 pt-1">
              <span>Estimated Net Taxable Income:</span>
              <span className="text-cyan-300">
                ${Math.max(0, (ytdPremiumsEarned + Number(inputRealizedGains || 0) - Number(inputRealizedLosses || 0) - Number(inputTaxCarryover || 0))).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold cursor-pointer"
            >
              Save Tax Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
