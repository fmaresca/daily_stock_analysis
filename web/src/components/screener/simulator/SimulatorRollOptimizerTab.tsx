import React, { useMemo } from 'react';
import { OptionStrategyType } from '../../../types/optionsScreener.types';
import { SimulatedContractData } from './SimulatorBlueprintCard';
import { ShieldCheck, TrendingUp, RefreshCw, AlertTriangle } from '../../icons';

interface SimulatorRollOptimizerTabProps {
  ticker: string;
  strategy: OptionStrategyType;
  contract: SimulatedContractData;
}

interface RollTactic {
  title: string;
  type: 'ROLL_OUT' | 'ROLL_UP_OUT' | 'ROLL_DEFENSIVE';
  targetExpiration: string;
  targetDte: number;
  newStrike: number;
  netCreditPerShare: number;
  netCreditPerContract: number;
  newCushionPct: number;
  newAnnualizedYield: number;
  recommendedDelta: number;
  badge: string;
  rationale: string;
}

export const SimulatorRollOptimizerTab: React.FC<SimulatorRollOptimizerTabProps> = ({
  ticker,
  strategy,
  contract,
}) => {
  const { spotPrice, nearestStrike: currentStrike, dte, midPrice: currentPremium, bufferPct } = contract;

  const isCC = strategy === 'COVERED_CALL';

  const rollTactics = useMemo<RollTactic[]>(() => {
    const nextDteA = dte + 14;
    const nextDteB = dte + 28;
    const nextDteC = dte + 45;

    // Tactic 1: Pure Time Roll (Same strike, +14d DTE)
    // Additional time value estimated from sqrt(time) scaling
    const rollCreditA = currentPremium * (Math.sqrt(nextDteA / Math.max(1, dte)) - 1) * 0.9;
    const yieldA = ((rollCreditA / spotPrice) * (365 / 14)) * 100;

    // Tactic 2: Roll Up & Out (for CC) or Down & Out (for CSP)
    const strikeStep = spotPrice > 150 ? 5 : spotPrice > 50 ? 2.5 : 1;
    const newStrikeB = isCC ? currentStrike + strikeStep : currentStrike - strikeStep;
    const distPctB = Math.abs((newStrikeB - spotPrice) / spotPrice) * 100;
    const rollCreditB = Math.max(0.20, currentPremium * 0.45);
    const yieldB = ((rollCreditB / spotPrice) * (365 / 28)) * 100;

    // Tactic 3: Maximum Theta Defensive Roll (+45d DTE)
    const rollCreditC = currentPremium * (Math.sqrt(nextDteC / Math.max(1, dte)) - 0.9);
    const yieldC = ((rollCreditC / spotPrice) * (365 / 45)) * 100;

    return [
      {
        title: isCC ? 'Roll Out (+14 DTE, Same Strike)' : 'Roll Out (+14 DTE, Same Strike)',
        type: 'ROLL_OUT',
        targetExpiration: `+14 Days (~${nextDteA} DTE)`,
        targetDte: nextDteA,
        newStrike: currentStrike,
        netCreditPerShare: Math.round(rollCreditA * 100) / 100,
        netCreditPerContract: Math.round(rollCreditA * 100),
        newCushionPct: Math.round(bufferPct * 10) / 10,
        newAnnualizedYield: Math.round(yieldA * 10) / 10,
        recommendedDelta: Math.max(0.12, Math.round((contract.bsDelta * 0.9) * 100) / 100),
        badge: 'Recommended',
        rationale: 'Harvests additional extrinsic value while locking in original strike level and resetting theta decay.',
      },
      {
        title: isCC ? 'Roll Up & Out (+28 DTE, Higher Strike)' : 'Roll Down & Out (+28 DTE, Lower Strike)',
        type: 'ROLL_UP_OUT',
        targetExpiration: `+28 Days (~${nextDteB} DTE)`,
        targetDte: nextDteB,
        newStrike: newStrikeB,
        netCreditPerShare: Math.round(rollCreditB * 100) / 100,
        netCreditPerContract: Math.round(rollCreditB * 100),
        newCushionPct: Math.round(distPctB * 10) / 10,
        newAnnualizedYield: Math.round(yieldB * 10) / 10,
        recommendedDelta: Math.max(0.15, Math.round((contract.bsDelta * 0.8) * 100) / 100),
        badge: isCC ? 'Expand Upside' : 'Widen Safety Cushion',
        rationale: isCC
          ? `Rolls strike up from $${currentStrike.toFixed(2)} to $${newStrikeB.toFixed(2)}, capturing an extra $${strikeStep.toFixed(2)} capital appreciation if called.`
          : `Rolls strike down from $${currentStrike.toFixed(2)} to $${newStrikeB.toFixed(2)}, lowering assignment cost basis while still taking a net credit.`,
      },
      {
        title: 'Defensive Reset (+45 DTE, Theta Sweet Spot)',
        type: 'ROLL_DEFENSIVE',
        targetExpiration: `+45 Days (~${nextDteC} DTE)`,
        targetDte: nextDteC,
        newStrike: isCC ? currentStrike + strikeStep : currentStrike - strikeStep,
        netCreditPerShare: Math.round(rollCreditC * 100) / 100,
        netCreditPerContract: Math.round(rollCreditC * 100),
        newCushionPct: Math.round((bufferPct + 3.5) * 10) / 10,
        newAnnualizedYield: Math.round(yieldC * 10) / 10,
        recommendedDelta: 0.20,
        badge: 'Maximum Buffer',
        rationale: 'Deep theta harvest with large extrinsic credit. Ideal if underlying is testing strike or during high volatility regimes.',
      },
    ];
  }, [currentStrike, currentPremium, dte, spotPrice, bufferPct, isCC, contract.bsDelta]);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-cyan-400" />
            <span>Defensive Roll Optimizer Matrix</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              Contract Lifecycle Management
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time algorithmic roll tactics to defend positions, capture additional credits, and expand safety buffers.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">Current Position:</span>
          <span className="font-mono font-bold text-white bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
            {ticker || 'UNDERLYING'} ${currentStrike.toFixed(2)} {isCC ? 'CALL' : 'PUT'}
          </span>
          <span className="font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
            {bufferPct >= 0 ? `+${bufferPct.toFixed(1)}% OTM` : `${bufferPct.toFixed(1)}% ITM`}
          </span>
        </div>
      </div>

      {/* Tactic Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 mb-4">
        {rollTactics.map((tactic, idx) => (
          <div
            key={idx}
            className="bg-slate-950/80 border border-slate-800 hover:border-cyan-500/50 rounded-xl p-3.5 flex flex-col justify-between transition-all group"
          >
            <div>
              <div className="flex items-center justify-between gap-1.5 mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                  {tactic.badge}
                </span>
                <span className="text-[10px] font-mono text-slate-400">{tactic.targetExpiration}</span>
              </div>

              <h4 className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors mb-2">
                {tactic.title}
              </h4>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono my-3 bg-slate-900/80 p-2.5 rounded-lg border border-slate-800/80">
                <div>
                  <span className="text-[10px] text-slate-400 font-sans block">New Strike</span>
                  <span className="font-bold text-slate-200">${tactic.newStrike.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-sans block">Est. Net Credit</span>
                  <span className="font-bold text-emerald-400">+${tactic.netCreditPerShare.toFixed(2)}/sh</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-sans block">Cash / Contract</span>
                  <span className="font-bold text-emerald-300">+${tactic.netCreditPerContract.toFixed(0)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-sans block">Target Delta</span>
                  <span className="font-bold text-indigo-300">{tactic.recommendedDelta.toFixed(2)}Δ</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
                {tactic.rationale}
              </p>
            </div>

            <div className="pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
              <span className="text-slate-400">Yield On Roll:</span>
              <span className="font-mono font-bold text-emerald-400">+{tactic.newAnnualizedYield.toFixed(1)}% APY</span>
            </div>
          </div>
        ))}
      </div>

      {/* Institutional Roll Protocols */}
      <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3 text-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-slate-300 font-medium">
            <strong>Roll Defense Rule:</strong> Initiate roll when option delta reaches <strong>0.50Δ (ATM)</strong> or with 7–10 days remaining to avoid pin risk.
          </span>
        </div>
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-cyan-400 shrink-0" />
          <span className="text-slate-400 font-mono text-[11px]">
            Never roll for a net debit; always demand net credit or hold for assignment.
          </span>
        </div>
      </div>
    </div>
  );
};
