import React from 'react';
import {
  DollarSign,
  ShieldCheck,
  Zap,
  Upload,
  CheckCircle2,
} from '../icons';
import { AccountCapitalState } from '../../types/options';
import { PortfolioPosition } from '../../utils/portfolioStressTest';
import {
  MAX_SINGLE_EQUITY_POSITION_LIMIT,
  DEFAULT_PER_POSITION_BUDGET,
} from '../../utils/capitalAndTaxLedger';

export interface LiquidCapitalWaterfallProps {
  capitalState: AccountCapitalState;
  activePositions: PortfolioPosition[];
  activeCSPs: PortfolioPosition[];
  activeCoveredCalls: PortfolioPosition[];
  activeEquities: PortfolioPosition[];
  activeCspNames: string;
  availableCashBeforeLiving: number;
  isEditingInlineCash: boolean;
  setIsEditingInlineCash: (val: boolean) => void;
  inlineCashValue: number;
  setInlineCashValue: (val: number) => void;
  handleQuickUpdateTotalCash: (amt: number) => void;
  handleUpdatePositionAllocation: (amt: number) => void;
  onOpenLiveTxModal: () => void;
  onBrokerCsvUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onResetToLivingTrustBaseline: () => void;
  onOpenAddDisbursementModal: () => void;
  liveTxSuccessMsg: string;
  importSuccessMsg: string;
}

export const LiquidCapitalWaterfall: React.FC<LiquidCapitalWaterfallProps> = React.memo(({
  capitalState,
  activePositions,
  activeCSPs,
  activeCoveredCalls,
  activeEquities,
  activeCspNames,
  availableCashBeforeLiving,
  isEditingInlineCash,
  setIsEditingInlineCash,
  inlineCashValue,
  setInlineCashValue,
  handleQuickUpdateTotalCash,
  handleUpdatePositionAllocation,
  onOpenLiveTxModal,
  onBrokerCsvUpload,
  onResetToLivingTrustBaseline,
  onOpenAddDisbursementModal,
  liveTxSuccessMsg,
  importSuccessMsg,
}) => {
  return (
    <div className="space-y-4">
      {/* Account Profile & Money Market Fund (MMF) Collateral Banner */}
      <div className="glass-panel p-4 rounded-2xl border border-cyan-500/30 shadow-xl bg-gradient-to-r from-slate-950 via-slate-900 to-cyan-950/40 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <span className="p-2 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-black text-white tracking-wide">
                  Account: {capitalState.accountName || 'Living Trust-Options ...609'}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30">
                  Primary CSP Account
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Total Net Liquidation Value:{' '}
                <strong className="text-white font-mono">
                  ${(capitalState.totalAccountValue || 2343519.76).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </strong>{' '}
                &bull; Cash &amp; Money Market Funds (SNYXX + SNAXX) are deemed 100% cash to cover CSPs before offsets.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onOpenLiveTxModal}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-600 to-emerald-600 hover:from-amber-500 hover:to-emerald-500 text-white shadow-md shadow-amber-600/20 flex items-center space-x-1.5 transition-all cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Record Mid-Week Trade</span>
            </button>

            <label className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/30 flex items-center space-x-1.5 transition-colors cursor-pointer">
              <Upload className="w-3.5 h-3.5" />
              <span>Import Positions CSV</span>
              <input
                type="file"
                accept=".csv"
                onChange={onBrokerCsvUpload}
                className="hidden"
              />
            </label>

            <button
              onClick={onResetToLivingTrustBaseline}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/40 flex items-center space-x-1.5 transition-colors cursor-pointer"
              title="Reset capital state and MMF breakdown to Living Trust-Options ...609 baseline"
            >
              <span>Reset to Living Trust Baseline</span>
            </button>
          </div>
        </div>

        {liveTxSuccessMsg && (
          <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs flex items-center space-x-2.5 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-mono text-[11px] leading-relaxed">{liveTxSuccessMsg}</span>
          </div>
        )}

        {importSuccessMsg && (
          <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs flex items-center space-x-2.5 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-mono text-[11px] leading-relaxed">{importSuccessMsg}</span>
          </div>
        )}

        {/* MMF & Cash Breakdown Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1 border-t border-slate-800/80">
          <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-[10px] text-slate-400 block font-semibold">SNYXX (Schwab NY Muni Money)</span>
            <span className="text-sm font-bold font-mono text-cyan-300 block">
              ${(capitalState.cashBreakdown?.snyxx ?? 202775.94).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[9px] text-slate-500">Deemed cash to cover CSP</span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-[10px] text-slate-400 block font-semibold">SNAXX (Schwab Prime Adv Money)</span>
            <span className="text-sm font-bold font-mono text-cyan-300 block">
              ${(capitalState.cashBreakdown?.snaxx ?? 77341.30).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[9px] text-slate-500">Deemed cash to cover CSP</span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-[10px] text-slate-400 block font-semibold">Core Cash &amp; Sweep</span>
            <span className="text-sm font-bold font-mono text-cyan-300 block">
              ${(capitalState.cashBreakdown?.coreCash ?? 299590.53).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[9px] text-slate-500">Cash investments sweep</span>
          </div>

          <div className="p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-500/40">
            <span className="text-[10px] text-emerald-400 block font-bold">Total Cash to Cover CSPs</span>
            <span className="text-sm font-bold font-mono text-emerald-300 block">
              ${capitalState.totalCash.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[9px] text-emerald-400/70 font-mono">
              {activeCspNames} Offsets: -${capitalState.committedCollateral.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Ingested Equities in Watchlist Strip */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs">
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-bold text-slate-300">Equities Ingested into Watchlist:</span>
            <div className="flex items-center gap-1.5 font-mono font-bold">
              {(activeEquities.length > 0 ? activeEquities.map((e) => e.symbol) : ['AXTI', 'BLZE', 'IONQ', 'LUNR', 'NET', 'RTX', 'TSLA']).map((sym) => (
                <span
                  key={sym}
                  className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 text-[10px]"
                >
                  {sym}
                </span>
              ))}
            </div>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">
            {activeEquities.length} Long Holdings &bull; {activeCoveredCalls.length} Covered Calls Linked &bull; {activeCSPs.length} CSP Offset{activeCSPs.length === 1 ? '' : 's'} Active ({activeCspNames})
          </span>
        </div>
      </div>

      {/* 2. Cash Reconciliation Waterfall Strip */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 shadow-xl bg-slate-950/80 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <DollarSign className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Available Cash Position &amp; True Deployable Free Cash Waterfall
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 font-bold">
              Single Equity Limit: $200,000 MAX
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
              100% Cash-Secured (Zero Margin)
            </span>
          </div>
        </div>

        {/* Precalculated Cash Formula Banner */}
        <div className="p-3.5 rounded-xl bg-gradient-to-r from-cyan-950/40 via-slate-900 to-emerald-950/30 border border-cyan-500/30 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono font-bold text-[10px] border border-cyan-500/30">PRECALCULATED CASH</span>
            <span className="text-slate-300">
              Total Cash Pool (Money Market + Sweep): <strong className="text-white font-mono">${capitalState.totalCash.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
              {' '}&minus; Open Put Liabilities: <strong className="text-rose-400 font-mono">${capitalState.committedCollateral.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
              {' '}&#61; <strong className="text-emerald-400 font-mono text-sm">${availableCashBeforeLiving.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong> Available Cash (Before Living Expenses)
            </span>
          </div>
          <div className="text-[11px] font-mono text-slate-400">
            Less Weekly Living Expenses: &minus;${capitalState.totalEncumberedDisbursements.toLocaleString()} &rarr; <span className="text-emerald-400 font-bold">${capitalState.freeCash.toLocaleString(undefined, { minimumFractionDigits: 2 })} Deployable Free Cash</span>
          </div>
        </div>

        {/* 4-Stage Waterfall Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Box 1: Total Cash (Directly Editable / Interactive) */}
          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-400 block font-semibold">1. Total Available Cash</span>
              <button
                onClick={() => setIsEditingInlineCash(!isEditingInlineCash)}
                className="text-[10px] text-cyan-400 hover:text-cyan-300 font-mono font-bold"
              >
                {isEditingInlineCash ? 'Close' : 'Quick Set'}
              </button>
            </div>

            {isEditingInlineCash ? (
              <div className="space-y-1.5">
                <input
                  type="number"
                  step="10000"
                  value={inlineCashValue}
                  onChange={(e) => setInlineCashValue(Number(e.target.value))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleQuickUpdateTotalCash(inlineCashValue);
                    }
                  }}
                  className="w-full bg-slate-950 border border-cyan-500 rounded px-2 py-1 text-sm font-mono font-bold text-white focus:outline-none"
                />
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleQuickUpdateTotalCash(inlineCashValue)}
                    className="px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-500 text-[10px] font-bold text-white"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => handleQuickUpdateTotalCash(500000)}
                    className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[9px] font-mono text-slate-300"
                  >
                    $500k
                  </button>
                  <button
                    onClick={() => handleQuickUpdateTotalCash(600000)}
                    className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[9px] font-mono text-slate-300"
                  >
                    $600k
                  </button>
                  <button
                    onClick={() => handleQuickUpdateTotalCash(750000)}
                    className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[9px] font-mono text-slate-300"
                  >
                    $750k
                  </button>
                  <button
                    onClick={() => handleQuickUpdateTotalCash(1000000)}
                    className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[9px] font-mono text-slate-300"
                  >
                    $1M
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <span className="text-xl font-bold font-mono text-white block">
                  ${capitalState.totalCash.toLocaleString()}
                </span>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-[9px] text-slate-500">Presets:</span>
                  {[250000, 500000, 750000, 1000000].map((amt) => (
                    <button
                      key={amt}
                      onClick={() => handleQuickUpdateTotalCash(amt)}
                      className={`text-[9px] font-mono px-1 py-0.2 rounded transition-colors ${
                        capitalState.totalCash === amt
                          ? 'bg-cyan-500/20 text-cyan-300 font-bold'
                          : 'text-slate-400 hover:text-white bg-slate-800/60'
                      }`}
                    >
                      ${amt >= 1000000 ? `${amt / 1000000}M` : `${amt / 1000}k`}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Box 2: Encumbered Disbursements */}
          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-amber-500/30 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-amber-300 font-semibold block">2. Planned Disbursements</span>
              <button
                onClick={onOpenAddDisbursementModal}
                className="text-[10px] text-amber-400 hover:text-amber-300 font-bold"
              >
                + Add
              </button>
            </div>
            <span className="text-xl font-bold font-mono text-amber-400 block">
              -${capitalState.totalEncumberedDisbursements.toLocaleString()}
            </span>
            <span className="text-[10px] text-amber-200/70 block truncate">
              {capitalState.plannedDisbursements.length} items ($5,000/wk living expenses)
            </span>
          </div>

          {/* Box 3: Committed Put Collateral */}
          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
            <span className="text-[11px] text-slate-400 block font-semibold">3. Committed CSP Collateral</span>
            <span className="text-xl font-bold font-mono text-cyan-400 block">
              -${capitalState.committedCollateral.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] text-slate-400 block truncate" title={activeCSPs.map((p) => `${p.symbol} $${p.strike}P`).join(', ')}>
              Locked in {activeCSPs.length} open put write{activeCSPs.length === 1 ? '' : 's'} ({activeCSPs.map((p) => `${p.symbol} $${p.strike}P`).join(', ') || 'PLTR $160P'})
            </span>
          </div>

          {/* Box 4: True Free Cash Available */}
          <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/40 space-y-1 shadow-lg shadow-emerald-950/50">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-emerald-400 font-bold block">4. True Free Deployable Cash</span>
              <span className="text-[10px] text-cyan-300 font-mono font-bold" title="Available cash prior to $5,000 weekly living expenses deduction">
                ${availableCashBeforeLiving.toLocaleString(undefined, { minimumFractionDigits: 2 })} pre-deduction
              </span>
            </div>
            <span className="text-xl font-bold font-mono text-emerald-300 block">
              ${capitalState.freeCash.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] text-emerald-400/90 font-mono block">
              Max Concurrent: <strong className="text-white font-bold">{capitalState.maxAllowedPositions} positions</strong> (capped at 5)
            </span>
          </div>
        </div>

        {/* Dynamic Position Sizing Control & $200k Single Equity Limit Banner */}
        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-white">
                Dynamic CSP Position Sizing &amp; Allocation Gate
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-rose-500/10 text-rose-300 border border-rose-500/30 font-bold">
                Max $200k / Single Equity Security
              </span>
            </div>
            <div className="flex items-center space-x-1 text-xs">
              <span className="text-slate-400 text-[11px]">Formula:</span>
              <code className="text-cyan-300 bg-slate-950 px-2 py-0.5 rounded text-[10px] font-mono">
                min(5, floor(Free Cash / Target Allocation))
              </code>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 text-xs bg-slate-950/70 p-3 rounded-lg border border-slate-800/80">
            <div className="flex items-center space-x-3">
              <span className="text-slate-300 font-semibold text-[11px]">Target Position Allocation:</span>
              <div className="flex items-center space-x-1.5">
                <span className="text-emerald-400 font-bold font-mono text-sm">
                  ${(capitalState.maxPerPositionAllocation || DEFAULT_PER_POSITION_BUDGET).toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">(Max $200,000)</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-400">Quick Presets:</span>
              <button
                onClick={() =>
                  handleUpdatePositionAllocation(
                    Math.min(MAX_SINGLE_EQUITY_POSITION_LIMIT, Math.max(25000, Math.floor(capitalState.freeCash / 5)))
                  )
                }
                className="px-2 py-1 rounded bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 text-[10px] font-mono font-bold border border-emerald-500/30 transition-colors"
                title="Auto-distribute free cash across 5 equal positions (capped at $200,000)"
              >
                Auto (Free Cash &divide; 5)
              </button>
              {[50000, 100000, 150000, 200000].map((amt) => (
                <button
                  key={amt}
                  onClick={() => handleUpdatePositionAllocation(amt)}
                  className={`px-2 py-1 rounded text-[10px] font-mono transition-colors ${
                    capitalState.maxPerPositionAllocation === amt
                      ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  ${amt / 1000}k
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

LiquidCapitalWaterfall.displayName = 'LiquidCapitalWaterfall';
