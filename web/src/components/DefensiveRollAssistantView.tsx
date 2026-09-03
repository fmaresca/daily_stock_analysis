import React, { useState, useMemo } from 'react';
import { OptionOpportunity, MultiLegSpread } from '../types/options';
import {
  ThreatenedPositionInfo,
  DefensiveRepairTactic,
  generateDefensiveRepairTactics,
  getSampleThreatenedPositions,
  evaluateThreatLevel,
} from '../utils/defensiveRollAssistant';
import {
  ShieldCheck,
  AlertTriangle,
  Zap,
  TrendingUp,
  Activity,
  Sliders,
  DollarSign,
  Clock,
  RefreshCw,
  CheckCircle2,
} from './icons';

interface DefensiveRollAssistantViewProps {
  onStageRollOrder?: (spread: MultiLegSpread) => void;
}

export const DefensiveRollAssistantView: React.FC<DefensiveRollAssistantViewProps> = ({
  onStageRollOrder,
}) => {
  const availablePositions = useMemo(() => {
    const presets = getSampleThreatenedPositions();
    try {
      const raw = localStorage.getItem('deltaharvest_portfolio_book');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const ledgerPositions: ThreatenedPositionInfo[] = parsed
            .filter((p: any) => p.type === 'CSP' || p.type === 'COVERED_CALL')
            .map((p: any) => {
              const { threatLevel, distancePct } = evaluateThreatLevel(
                p.spotPrice,
                p.strike,
                p.delta,
                p.type === 'CSP' ? 'CSP' : 'COVERED_CALL'
              );
              return {
                id: p.id,
                symbol: p.symbol,
                strategy: p.type === 'CSP' ? 'CSP' : 'COVERED_CALL',
                spotPrice: p.spotPrice,
                strike: p.strike,
                dte: p.dte,
                currentDelta: p.delta,
                distanceToStrikePct: distancePct,
                currentOptionPrice: p.currentOptionPrice || p.entryPrice,
                originalCredit: p.entryPrice,
                threatLevel,
              };
            });
          const existingIds = new Set(ledgerPositions.map((p) => p.id));
          return [...ledgerPositions, ...presets.filter((p) => !existingIds.has(p.id))];
        }
      }
    } catch (e) {
      console.warn('Failed to load portfolio positions for roll assistant:', e);
    }
    return presets;
  }, []);

  const [selectedPosId, setSelectedPosId] = useState<string>(availablePositions[0].id);

  const activePosition = useMemo(() => {
    return availablePositions.find((p) => p.id === selectedPosId) || availablePositions[0];
  }, [availablePositions, selectedPosId]);

  const report = useMemo(() => {
    return generateDefensiveRepairTactics(activePosition);
  }, [activePosition]);

  // Stage roll as a diagonal spread bracket in Broker Staging Modal
  const handleStageTactic = (tactic: DefensiveRepairTactic) => {
    if (!onStageRollOrder) return;

    const spread: MultiLegSpread = {
      id: `DEFENSE_ROLL_${activePosition.symbol}_${tactic.newStrike}`,
      symbol: activePosition.symbol,
      strategy: 'BEAR_CALL_SPREAD',
      strategy_name: `Defensive Roll (${tactic.name})`,
      expiration: new Date(Date.now() + tactic.newDte * 86400000).toISOString().split('T')[0],
      dte: tactic.newDte,
      current_price: activePosition.spotPrice,
      short_strike: tactic.newStrike,
      short_delta: -0.22,
      short_type: 'call',
      long_strike: activePosition.strike,
      long_delta: activePosition.currentDelta,
      long_type: 'call',
      spread_width: Math.abs(activePosition.strike - tactic.newStrike),
      net_credit: tactic.netCredit,
      max_loss: Math.abs(activePosition.strike - tactic.newStrike),
      max_profit: tactic.netCredit,
      roc_pct: 10,
      annualized_roc: Math.round((tactic.netCredit / (tactic.newStrike || 100)) * (365 / tactic.newDte) * 1000) / 10,
      pop_pct: tactic.recoveryProbabilityPct,
      cushion_pct: tactic.breakevenImprovement,
      iv_rank: 30,
    };

    onStageRollOrder(spread);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800/80 bg-gradient-to-r from-slate-900/95 via-slate-900/60 to-slate-950 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 shadow-lg shadow-amber-500/10">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold text-white tracking-wide">
                  Dynamic Rolling &amp; Defensive Repair Engine
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                  0.50Δ Defense Rule
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                Algorithmic damage control for threatened Cash-Secured Puts and Covered Calls. Evaluates 4 institutional protocols: <strong>Roll Out &amp; Down for Net Credit</strong>, <strong>Roll Flat Duration Extension</strong>, <strong>Inverted Wings</strong>, and <strong>1:2 Ratio Repair Spreads</strong>.
              </p>
            </div>
          </div>

          {/* Position Selector */}
          <div className="flex items-center space-x-2 bg-slate-950/80 px-3.5 py-2 rounded-xl border border-slate-800 text-xs">
            <span className="text-slate-400 font-semibold">Select Position:</span>
            <select
              value={selectedPosId}
              onChange={(e) => setSelectedPosId(e.target.value)}
              className="bg-transparent text-white font-bold cursor-pointer focus:outline-none font-mono"
            >
              {availablePositions.map((p) => (
                <option key={p.id} value={p.id} className="bg-slate-900 text-white">
                  {p.symbol} ${p.strike} {p.strategy} ({p.threatLevel.replace('_', ' ')})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Threat Diagnostic Summary Card */}
        <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
            <div className="flex items-center space-x-2">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold ${
                activePosition.threatLevel === 'BREACHED_DEFEND'
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                  : activePosition.threatLevel === 'THREATENED'
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                  : 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
              }`}>
                {activePosition.threatLevel.replace('_', ' ')}
              </span>
              <span className="text-xs font-bold text-white">
                {activePosition.symbol} ${activePosition.strike} {activePosition.strategy === 'CSP' ? 'Cash-Secured Put' : 'Covered Call'}
              </span>
            </div>

            <div className="flex items-center space-x-4 text-xs font-mono">
              <span className="text-slate-400">Spot: <strong className="text-white">${activePosition.spotPrice.toFixed(2)}</strong></span>
              <span className="text-slate-400">Delta: <strong className="text-rose-400">{activePosition.currentDelta}Δ</strong></span>
              <span className="text-slate-400">DTE: <strong className="text-cyan-400">{activePosition.dte}d</strong></span>
              <span className="text-slate-400">Dist: <strong className="text-amber-400">{activePosition.distanceToStrikePct}%</strong></span>
            </div>
          </div>

          <div className="flex items-start space-x-2 text-xs text-slate-300">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="font-semibold leading-relaxed">
              {report.threatVerdict}
            </p>
          </div>
        </div>
      </div>

      {/* Repair Tactics Comparison Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <h2 className="text-sm font-bold text-white tracking-wide">
              Ranked Defensive Repair Protocols ({report.tactics.length} Mathematically Viable Tactics)
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            All tactics enforce Net Credit generation
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {report.tactics.map((tactic, idx) => (
            <div
              key={tactic.id}
              className={`glass-panel p-5 rounded-2xl border transition-all ${
                idx === 0
                  ? 'border-emerald-500/40 bg-emerald-950/10 shadow-lg shadow-emerald-500/5'
                  : 'border-slate-800 bg-slate-900/50 hover:bg-slate-900/80'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                <div className="flex items-center space-x-3">
                  <span className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs font-mono ${
                    idx === 0 ? 'bg-emerald-500 text-slate-950 shadow-md' : 'bg-slate-800 text-slate-300'
                  }`}>
                    #{idx + 1}
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      {tactic.name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {tactic.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <span className="px-2.5 py-1 rounded-xl text-xs font-bold font-mono bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                    +{tactic.netCredit >= 0 ? `$${tactic.netCredit.toFixed(2)} Net Credit` : `$${Math.abs(tactic.netCredit).toFixed(2)} Debit`}
                  </span>

                  <button
                    onClick={() => handleStageTactic(tactic)}
                    className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-md shadow-amber-600/30 flex items-center space-x-1.5 transition-all cursor-pointer"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>Stage Repair Order</span>
                  </button>
                </div>
              </div>

              {/* Action Details & Metric Chips */}
              <div className="pt-3 grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1 md:col-span-2">
                  <span className="text-[10px] text-slate-500 uppercase font-mono block">Order Routing Instructions</span>
                  <div className="text-xs font-bold text-emerald-300 font-mono">
                    {tactic.actionInstruction}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase font-mono block">New Breakeven</span>
                  <div className="text-sm font-bold text-white font-mono">
                    ${tactic.newBreakeven.toFixed(2)}
                  </div>
                  <span className="text-[10px] text-emerald-400 font-mono block">
                    +${tactic.breakevenImprovement.toFixed(2)} cushion
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase font-mono block">Recovery Probability</span>
                  <div className="text-sm font-bold text-cyan-400 font-mono">
                    {tactic.recoveryProbabilityPct}%
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono block">
                    {tactic.suitabilityScore}/100 Match
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
