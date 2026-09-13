import React from 'react';
import { Target } from '../../icons';
import { OptionStrategyType } from '../../../types/optionsScreener.types';
import { DefendedStrikeResult, StraddleImpliedMoveResult } from '../../../utils/earningsCalendar';

export interface SimulatedContractData {
  spotPrice: number;
  expirationFormatted: string;
  dte: number;
  nearestStrike: number;
  unadjustedStrike: number;
  theoreticalStrike: number;
  straddleMove: StraddleImpliedMoveResult;
  defendedResult: DefendedStrikeResult;
  isEarningsActive: boolean;
  clearsStraddle: boolean;
  targetDelta: number;
  bsDelta: number;
  actualDelta: number;
  popPct: number;
  estimatedMid: number;
  midPrice: number;
  bid: number;
  bidPrice: number;
  ask: number;
  askPrice: number;
  collateral: number;
  collateralPerContract: number;
  premiumTotal: number;
  premiumPerContract: number;
  annualizedRoC: number;
  bufferPct: number;
  breakeven: number;
  breakEven: number;
  cushionPct: number;
  sma50?: number;
  underlyingSma50: number;
  strikeVsSma50: number;
  strikeVsSma50Pct: number;
  strikeVsSmaPct: number;
}

export interface SimulatorBlueprintCardProps {
  ticker: string;
  strategy: OptionStrategyType;
  delta: number;
  simulatedContract: SimulatedContractData;
  factorEarningsInStrike: boolean;
  setFactorEarningsInStrike: (val: boolean) => void;
}

export const SimulatorBlueprintCard: React.FC<SimulatorBlueprintCardProps> = ({
  ticker,
  strategy,
  delta,
  simulatedContract,
  factorEarningsInStrike,
  setFactorEarningsInStrike,
}) => {
  return (
    <div className="mb-5 bg-gradient-to-r from-slate-900/95 via-slate-900/80 to-slate-950 border border-emerald-500/30 rounded-xl p-4 shadow-lg shadow-emerald-950/20 backdrop-blur-md">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Simulated Nearest Strike &amp; Contract Blueprint
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700">
                {strategy === 'COVERED_CALL' ? 'Covered Call (CC)' : 'Cash Secured Put (CSP)'}
              </span>
            </div>
            <div className="text-sm font-medium text-slate-200 flex items-center gap-2 mt-0.5">
              <span className="font-bold text-white font-mono">{ticker || 'UNDERLYING'}</span>
              <span className="text-slate-500">•</span>
              <span>Spot: <strong className="text-slate-200 font-mono">${simulatedContract.spotPrice.toFixed(2)}</strong></span>
              <span className="text-slate-500">•</span>
              <span>Exp: <strong className="text-slate-200">{simulatedContract.expirationFormatted}</strong> ({simulatedContract.dte} DTE)</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {simulatedContract.isEarningsActive && factorEarningsInStrike && simulatedContract.unadjustedStrike !== simulatedContract.nearestStrike && (
            <div className="text-right hidden sm:block pr-3 border-r border-slate-800">
              <div className="flex items-center justify-end gap-1.5">
                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
                  Pure {delta.toFixed(2)}Δ Strike
                </span>
                <span className="text-[9px] bg-slate-800 text-slate-400 px-1 py-0.2 rounded border border-slate-700">
                  Unadjusted
                </span>
              </div>
              <div className="flex items-center gap-1.5 justify-end">
                <span className="text-lg font-bold text-slate-400 font-mono line-through decoration-rose-500/60">
                  ${simulatedContract.unadjustedStrike.toFixed(2)}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setFactorEarningsInStrike(false)}
                className="text-[10px] text-cyan-400 hover:text-cyan-300 underline font-sans cursor-pointer block mt-0.5"
                title="Ignore earnings straddle defense and use pure delta strike"
              >
                Use Pure Delta Strike
              </button>
            </div>
          )}

          <div className="text-right">
            <div className="flex items-center justify-end gap-1.5">
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
                {simulatedContract.isEarningsActive && factorEarningsInStrike ? 'Recommended Defended Strike' : 'Nearest Exch. Strike'}
              </span>
              {simulatedContract.isEarningsActive && factorEarningsInStrike && (
                <span className="text-[9px] bg-emerald-500/20 text-emerald-300 font-bold px-1.5 py-0.2 rounded border border-emerald-500/30">
                  🛡️ Earnings-Defended
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 justify-end">
              <span className="text-2xl font-black text-emerald-400 font-mono tracking-tight">
                ${simulatedContract.nearestStrike.toFixed(2)}
              </span>
              <span className={`px-1.5 py-0.5 rounded text-[11px] font-black uppercase ${
                strategy === 'COVERED_CALL' 
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' 
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              }`}>
                {strategy === 'COVERED_CALL' ? 'CALL' : 'PUT'}
              </span>
            </div>
            {simulatedContract.isEarningsActive && factorEarningsInStrike && simulatedContract.unadjustedStrike !== simulatedContract.nearestStrike ? (
              <span className="text-[10px] font-mono text-amber-400/90 block">
                Defended past ±${simulatedContract.straddleMove.impliedMoveDollar.toFixed(1)} jump
              </span>
            ) : !factorEarningsInStrike && simulatedContract.isEarningsActive ? (
              <button
                type="button"
                onClick={() => setFactorEarningsInStrike(true)}
                className="text-[10px] text-emerald-400 hover:text-emerald-300 underline font-sans cursor-pointer block"
              >
                Enable Earnings Defense (${simulatedContract.defendedResult.defendedStrike.toFixed(2)})
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {/* Metric Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5 text-xs">
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-2.5">
          <span className="text-slate-400 text-[10px] block">Strike Cushion (OTM)</span>
          <span className="font-mono font-bold text-emerald-400 text-sm">
            {simulatedContract.bufferPct >= 0 ? '+' : ''}{simulatedContract.bufferPct.toFixed(1)}%
          </span>
          <span className="text-[9px] text-slate-500 block truncate">
            Theor: ${simulatedContract.theoreticalStrike.toFixed(2)}
          </span>
        </div>

        <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-2.5">
          <span className="text-slate-400 text-[10px] block">Target / Actual Δ</span>
          <span className="font-mono font-bold text-cyan-400 text-sm">
            {simulatedContract.targetDelta.toFixed(2)} / {simulatedContract.bsDelta.toFixed(2)}
          </span>
          <span className="text-[9px] text-slate-500 block truncate">
            PoP ~{simulatedContract.popPct.toFixed(0)}%
          </span>
        </div>

        <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-2.5">
          <span className="text-slate-400 text-[10px] block">Est. Option Premium</span>
          <span className="font-mono font-bold text-amber-400 text-sm">
            ${simulatedContract.midPrice.toFixed(2)}
          </span>
          <span className="text-[9px] text-slate-500 block truncate">
            Bid ${simulatedContract.bidPrice.toFixed(2)} / Ask ${simulatedContract.askPrice.toFixed(2)}
          </span>
        </div>

        <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-2.5">
          <span className="text-slate-400 text-[10px] block">Premium Income (1x)</span>
          <span className="font-mono font-bold text-emerald-400 text-sm">
            +${simulatedContract.premiumPerContract.toFixed(0)}
          </span>
          <span className="text-[9px] text-slate-500 block truncate">
            Per 100-share lot
          </span>
        </div>

        <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-2.5">
          <span className="text-slate-400 text-[10px] block">Capital / Collateral</span>
          <span className="font-mono font-bold text-slate-200 text-sm">
            ${simulatedContract.collateralPerContract.toLocaleString()}
          </span>
          <span className="text-[9px] text-slate-500 block truncate">
            {strategy === 'COVERED_CALL' ? '100 shares held' : 'Cash held in reserve'}
          </span>
        </div>

        <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-2.5">
          <span className="text-slate-400 text-[10px] block">Break-Even / SMA50</span>
          <span className="font-mono font-bold text-indigo-300 text-sm">
            ${simulatedContract.breakEven.toFixed(2)}
          </span>
          <span className="text-[9px] text-slate-500 block truncate">
            SMA50: ${simulatedContract.underlyingSma50.toFixed(2)} ({simulatedContract.strikeVsSmaPct >= 0 ? '+' : ''}{simulatedContract.strikeVsSmaPct.toFixed(1)}%)
          </span>
        </div>

        {/* Institutional Dual-Yield & Income Engine Enhancements */}
        {strategy === 'COVERED_CALL' && (
          <>
            <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-lg p-2.5">
              <span className="text-emerald-400/80 text-[10px] block font-semibold">Static Yield (Ann.)</span>
              <span className="font-mono font-bold text-emerald-400 text-sm">
                +{((simulatedContract.midPrice / simulatedContract.spotPrice) * (365 / Math.max(1, simulatedContract.dte)) * 100).toFixed(1)}%
              </span>
              <span className="text-[9px] text-slate-500 block truncate">
                Uncalled flat return
              </span>
            </div>

            <div className="bg-cyan-950/20 border border-cyan-500/30 rounded-lg p-2.5">
              <span className="text-cyan-400/80 text-[10px] block font-semibold">If-Called Return (Ann.)</span>
              <span className="font-mono font-bold text-cyan-400 text-sm">
                +{(((simulatedContract.midPrice + Math.max(0, simulatedContract.nearestStrike - simulatedContract.spotPrice)) / simulatedContract.spotPrice) * (365 / Math.max(1, simulatedContract.dte)) * 100).toFixed(1)}%
              </span>
              <span className="text-[9px] text-slate-500 block truncate">
                With cap upside
              </span>
            </div>

            <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-2.5">
              <span className="text-slate-400 text-[10px] block font-semibold">Downside Cushion</span>
              <span className="font-mono font-bold text-slate-200 text-sm">
                {((simulatedContract.midPrice / simulatedContract.spotPrice) * 100).toFixed(1)}%
              </span>
              <span className="text-[9px] text-slate-500 block truncate">
                Premium buffer
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
