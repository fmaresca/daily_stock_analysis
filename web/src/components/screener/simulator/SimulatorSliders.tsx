import React from 'react';
import { OptionStrategyType } from '../../../types/optionsScreener.types';

export interface SimulatorSlidersProps {
  strategy: OptionStrategyType;
  ivRank: number;
  setIvRank: (val: number) => void;
  delta: number;
  setDelta: (val: number) => void;
  distTo50Sma: number;
  setDistTo50Sma: (val: number) => void;
  hasEarningsAlert: boolean;
  setHasEarningsAlert: (val: boolean) => void;
  clearsStraddle: boolean;
  isEarningsActive: boolean;
  factorEarningsInStrike: boolean;
  setFactorEarningsInStrike: (val: boolean) => void;
  unadjustedStrike: number;
  nearestStrike: number;
  straddleMoveDollar: number;
}

export const SimulatorSliders: React.FC<SimulatorSlidersProps> = ({
  strategy,
  ivRank,
  setIvRank,
  delta,
  setDelta,
  distTo50Sma,
  setDistTo50Sma,
  hasEarningsAlert,
  setHasEarningsAlert,
  clearsStraddle,
  isEarningsActive,
  factorEarningsInStrike,
  setFactorEarningsInStrike,
  unadjustedStrike,
  nearestStrike,
  straddleMoveDollar,
}) => {
  return (
    <div className="space-y-3.5 flex flex-col justify-between h-full">
      {/* Slider 1: IV Rank */}
      <div className="bg-slate-900/80 border border-slate-800/90 rounded-xl p-3.5 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 14v-4" />
              <path d="M3.34 19a10 10 0 1 1 17.32 0" />
            </svg>
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wide">
              IV Rank (0-100%)
            </span>
          </div>
          <span className="text-xs font-bold font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
            {ivRank}%
          </span>
        </div>

        <div className="relative py-1">
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            value={ivRank}
            onChange={(e) => setIvRank(Number(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400 focus:outline-none"
          />
          <div className="flex justify-between items-center text-[10px] text-slate-500 mt-1 font-mono">
            <span>0%</span>
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              ▲ Optimal Range (35%-70%) ▲
            </span>
            <span>100%</span>
          </div>
        </div>
      </div>

      {/* Slider 2: Option Delta */}
      <div className="bg-slate-900/80 border border-slate-800/90 rounded-xl p-3.5 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-emerald-400 font-serif text-sm leading-none">Σ</span>
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wide">
              Option Delta (0.10-0.45)
            </span>
          </div>
          <div className="flex items-center gap-2">
            {isEarningsActive && factorEarningsInStrike && unadjustedStrike !== nearestStrike && (
              <span className="text-[10px] font-mono text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/30" title="Pure Black-Scholes Delta Strike before earnings defense">
                Pure Δ Strike: ${unadjustedStrike.toFixed(2)}
              </span>
            )}
            <span className="text-xs font-bold font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              {delta.toFixed(2)}
            </span>
          </div>
        </div>

        <div className="relative py-1">
          <input
            type="range"
            min="0.10"
            max="0.45"
            step="0.01"
            value={delta}
            onChange={(e) => setDelta(Number(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400 focus:outline-none"
          />
          <div className="flex justify-between items-center text-[10px] text-slate-500 mt-1 font-mono">
            <span>0.10Δ</span>
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              ▲ Optimal Range ({strategy === 'CASH_SECURED_PUT' ? '0.15-0.25Δ' : '0.20-0.30Δ'}) ▲
            </span>
            <span>0.45Δ</span>
          </div>
        </div>

        {/* Live Earnings Defense Status Pill */}
        {isEarningsActive && factorEarningsInStrike && unadjustedStrike !== nearestStrike && (
          <div className="mt-2 text-[10px] text-amber-300/90 bg-amber-500/10 px-2.5 py-1.5 rounded-lg border border-amber-500/20 flex flex-wrap items-center justify-between gap-1.5">
            <span>
              🛡️ Pure {delta.toFixed(2)}Δ strike is <strong>${unadjustedStrike.toFixed(2)}</strong>, but contract is defended at <strong>${nearestStrike.toFixed(2)}</strong> past the ±${straddleMoveDollar.toFixed(1)} earnings jump.
            </span>
            <button
              type="button"
              onClick={() => setFactorEarningsInStrike(false)}
              className="underline text-amber-200 hover:text-white font-bold cursor-pointer"
            >
              Use ${unadjustedStrike.toFixed(2)}
            </button>
          </div>
        )}
      </div>

      {/* Slider 3: Distance to 50 SMA */}
      <div className="bg-slate-900/80 border border-slate-800/90 rounded-xl p-3.5 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
              <polyline points="16 7 22 7 22 13" />
            </svg>
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wide">
              Dist. to 50 SMA (%)
            </span>
          </div>
          <span className="text-xs font-bold font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
            {distTo50Sma > 0 ? `+${distTo50Sma.toFixed(1)}%` : `${distTo50Sma.toFixed(1)}%`}
          </span>
        </div>

        <div className="relative py-1">
          <input
            type="range"
            min="-15"
            max="15"
            step="0.1"
            value={distTo50Sma}
            onChange={(e) => setDistTo50Sma(Number(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400 focus:outline-none"
          />
          <div className="flex justify-between items-center text-[10px] text-slate-500 mt-1 font-mono">
            <span>-15% (Under)</span>
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              ▲ Optimal (Strike &lt; 50 SMA) ▲
            </span>
            <span>+15% (Over)</span>
          </div>
        </div>
      </div>

      {/* Additional risk gate quick toggle */}
      <div className="flex items-center justify-between px-3.5 py-2 bg-slate-900/40 rounded-xl border border-slate-800/60 text-xs">
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            checked={hasEarningsAlert}
            onChange={(e) => setHasEarningsAlert(e.target.checked)}
            className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-rose-500 focus:ring-rose-500/30 cursor-pointer"
          />
          <span className="text-slate-300">Earnings Within Expiration Window</span>
        </label>
        {hasEarningsAlert && (
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
            clearsStraddle
              ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
              : 'text-rose-400 bg-rose-500/10 border-rose-500/20'
          }`}>
            {clearsStraddle ? '-12 PTS (DEFENDED)' : '-40 PTS PENALTY'}
          </span>
        )}
      </div>
    </div>
  );
};
