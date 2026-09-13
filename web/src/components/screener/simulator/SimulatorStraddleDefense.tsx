import React from 'react';
import { DefendedStrikeResult, StraddleImpliedMoveResult, EarningsExpirationAnalysis } from '../../../utils/earningsCalendar';
import { AlertTriangle, RefreshCw } from '../../icons';

export interface SimulatorStraddleDefenseProps {
  ticker: string;
  isFetchingEarnings: boolean;
  earningsAnalysis: EarningsExpirationAnalysis | null;
  simulatedContract: {
    clearsStraddle: boolean;
    straddleMove: StraddleImpliedMoveResult;
    defendedResult: DefendedStrikeResult;
    isEarningsActive: boolean;
  };
  factorEarningsInStrike: boolean;
  setFactorEarningsInStrike: (val: boolean) => void;
}

export const SimulatorStraddleDefense: React.FC<SimulatorStraddleDefenseProps> = ({
  ticker,
  isFetchingEarnings,
  earningsAnalysis,
  simulatedContract,
  factorEarningsInStrike,
  setFactorEarningsInStrike,
}) => {
  return (
    <>
      {/* Live Earnings Fetch In-Flight Banner */}
      {isFetchingEarnings && !simulatedContract.isEarningsActive && (
        <div className="mb-3.5 p-3.5 rounded-xl border border-amber-500/40 bg-amber-950/20 text-amber-200 text-xs shadow-sm shadow-amber-500/10">
          <div className="flex items-center gap-2.5">
            <RefreshCw className="w-4 h-4 animate-spin text-amber-400 shrink-0" />
            <div>
              <span className="font-bold text-amber-300 text-xs flex items-center gap-2">
                <span>Synchronizing Corporate Earnings Calendar for {ticker || 'Underlying'}...</span>
                <span className="text-[9px] bg-amber-500/20 text-amber-200 px-1.5 py-0.5 rounded border border-amber-500/30 font-mono uppercase">
                  In Progress
                </span>
              </span>
              <p className="text-[11px] text-amber-400/80 mt-0.5 font-sans">
                The simulator is pausing to query live event feeds for announcement dates. The ATM Straddle Implied Move and Defended Strike will update as soon as the date is retrieved.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Earnings Straddle Implied Move Alert & Defense Banner */}
      {simulatedContract.isEarningsActive && (
        <div className={`mb-3.5 p-3.5 rounded-xl border ${
          simulatedContract.clearsStraddle
            ? 'bg-emerald-950/25 border-emerald-500/40 text-emerald-200'
            : 'bg-rose-950/25 border-rose-500/40 text-rose-200'
        }`}>
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/60 pb-2.5">
            <div className="flex items-center space-x-2">
              <AlertTriangle className={`w-4 h-4 shrink-0 ${simulatedContract.clearsStraddle ? 'text-emerald-400' : 'text-rose-400 animate-pulse'}`} />
              <span className="font-bold text-xs text-white flex items-center flex-wrap gap-1.5">
                <span>Earnings Announcement Inside Expiration Window: {earningsAnalysis?.earningsDate || 'Imminent'}</span>
                {earningsAnalysis?.fiscalQuarter && (
                  <span className="text-slate-300">({earningsAnalysis.fiscalQuarter})</span>
                )}
                {earningsAnalysis?.timeOfDay && (
                  <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded border border-slate-700 font-mono">
                    {earningsAnalysis.timeOfDay === 'AMC' ? 'After Close (AMC)' : earningsAnalysis.timeOfDay === 'BMO' ? 'Before Open (BMO)' : earningsAnalysis.timeOfDay}
                  </span>
                )}
                {earningsAnalysis?.isConfirmed ? (
                  <span className="text-[9px] bg-emerald-500/20 text-emerald-300 font-bold px-1.5 py-0.5 rounded border border-emerald-500/30">
                    Confirmed Live
                  </span>
                ) : (
                  <span className="text-[9px] bg-amber-500/20 text-amber-300 font-medium px-1.5 py-0.5 rounded border border-amber-500/30">
                    Projected Cycle
                  </span>
                )}
                {earningsAnalysis?.daysBeforeExpiration !== null && earningsAnalysis?.daysBeforeExpiration !== undefined && (
                  <span className="text-slate-300 font-normal">
                    &bull; Reports {earningsAnalysis.daysBeforeExpiration} days before expiration
                  </span>
                )}
              </span>
            </div>
            <label className="flex items-center space-x-2 text-xs cursor-pointer font-medium select-none bg-slate-900/90 px-2.5 py-1 rounded-lg border border-slate-800">
              <input
                type="checkbox"
                checked={factorEarningsInStrike}
                onChange={(e) => setFactorEarningsInStrike(e.target.checked)}
                className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-emerald-500 focus:ring-emerald-500/30 cursor-pointer"
              />
              <span className="text-slate-200">Factor Straddle Implied Move into Recommended Strike</span>
            </label>
          </div>

          <div className="mt-2.5 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-mono">
            <div className="bg-slate-950/70 p-2 rounded-lg border border-slate-800">
              <span className="text-slate-400 text-[10px] block">ATM STRADDLE IMPLIED MOVE</span>
              <span className="text-amber-400 font-bold text-sm">
                &plusmn;${simulatedContract.straddleMove.impliedMoveDollar.toFixed(2)} (&plusmn;{simulatedContract.straddleMove.impliedMovePct.toFixed(1)}%)
              </span>
              <span className="text-[9px] text-slate-500 block truncate">
                Expected 1-SD event jump
              </span>
            </div>
            <div className="bg-slate-950/70 p-2 rounded-lg border border-slate-800">
              <span className="text-slate-400 text-[10px] block">EXPECTED POST-EARNINGS RANGE</span>
              <span className="text-slate-200 font-bold text-sm">
                ${simulatedContract.straddleMove.lowerExpectedBound.toFixed(2)} &ndash; ${simulatedContract.straddleMove.upperExpectedBound.toFixed(2)}
              </span>
              <span className="text-[9px] text-slate-500 block truncate">
                Downside / Upside jump envelope
              </span>
            </div>
            <div className="bg-slate-950/70 p-2 rounded-lg border border-slate-800">
              <span className="text-slate-400 text-[10px] block">EARNINGS STRIKE DEFENSE</span>
              <span className={`font-bold text-sm flex items-center gap-1 ${
                simulatedContract.clearsStraddle ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {simulatedContract.clearsStraddle ? '🛡️ Clears Straddle Bounds' : '⚠️ Inside Straddle Breach Zone'}
              </span>
              <span className="text-[9px] text-slate-400 block truncate">
                {simulatedContract.clearsStraddle
                  ? `Cushion: $${simulatedContract.defendedResult.cushionPastStraddleDollar.toFixed(2)} (${simulatedContract.defendedResult.cushionPastStraddlePct.toFixed(1)}%) past bounds`
                  : `Risk: Strike is $${Math.abs(simulatedContract.defendedResult.cushionPastStraddleDollar).toFixed(2)} within move`}
              </span>
            </div>
          </div>

          <p className="mt-2 text-[11px] text-slate-300 leading-relaxed font-sans">
            {simulatedContract.defendedResult.recommendationNote}
          </p>
        </div>
      )}
    </>
  );
};
