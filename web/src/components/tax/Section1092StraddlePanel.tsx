/**
 * Section 1092 Tax Straddle Review, QCC Benchmarks & Loss Deferral Panel
 *
 * Attribution:
 * Ported from MIT-licensed `net_alpha` (https://github.com/chen-star/net_alpha, PyPI `wash-alpha`),
 * straddles module and confidence taxonomy (Confirmed / Probable / Unclear),
 * source-verified 2026-10 against:
 *  - IRC §1092 (Straddles, Loss Deferral, Identified Straddles)
 *  - IRC §1092(c)(4) & Treas. Reg. §1.1092(c)-1 through -4 (Qualified Covered Calls)
 *  - Temp. Treas. Reg. §1.1092(b)-1T & §1.1092(b)-2T (Holding Period & Loss Character)
 *  - IRS Publication 550 (2025/2026), Chapter 4 (Straddles, QCC Table 4-3, Form 6781 Part II)
 *
 * MIT License Notice:
 * Copyright (c) net_alpha contributors / chen-star
 *
 * IMPORTANT LEGAL & TAX DISCLAIMER:
 * Modelling assumptions for backtests and portfolio analysis, NOT tax advice.
 * Always consult a qualified CPA or licensed tax professional regarding your
 * specific tax situation, Form 6781 filings, and identified straddle elections.
 *
 * IRON RULES (Non-negotiable):
 * 1. Never auto-classify a straddle: automated detection proposes candidates; the user
 *    confirms or rejects each one. Unconfirmed candidates stay labeled 'Unclear'.
 * 2. Mixed straddle guard: any straddle overlapping an IRC §1256 contract is flagged
 *    as 'Mixed straddle — CPA review required' and excluded from automated arithmetic.
 * 3. Qualified covered calls (QCC) meeting statutory criteria are exempt from §1092.
 */

import React, { useState, useMemo } from 'react';
import {
  StraddlePosition,
  DetectedStraddle,
  detectStraddles,
  computeDeferredLoss,
  tollHoldingPeriod,
  netIdentifiedStraddle,
  IdentifiedStraddle,
  LossDeferralResult,
  HoldingPeriodTollingResult,
  IdentifiedNettingResult,
} from '../../utils/section1092';
import { getSampleStraddlePositions } from '../../utils/taxAlphaOptimizer';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Zap,
  Activity,
  Info,
} from '../icons';

interface Section1092StraddlePanelProps {
  initialPositions?: StraddlePosition[];
  onSelectAuthority?: (auth: { label: string; text: string }) => void;
}

export const Section1092StraddlePanel: React.FC<Section1092StraddlePanelProps> = ({
  initialPositions,
  onSelectAuthority,
}) => {
  const [positions] = useState<StraddlePosition[]>(
    () => initialPositions ?? getSampleStraddlePositions()
  );

  // Raw detections from pure engine
  const initialDetections = useMemo(() => detectStraddles(positions), [positions]);

  // User-confirmed / rejected / identified overlay state
  const [straddleStates, setStraddleStates] = useState<
    Record<string, { status: 'candidate' | 'confirmed' | 'rejected'; identified?: IdentifiedStraddle }>
  >(() => {
    const init: Record<string, { status: 'candidate' | 'confirmed' | 'rejected'; identified?: IdentifiedStraddle }> = {};
    for (const d of initialDetections) {
      init[d.id] = { status: 'candidate' };
    }
    return init;
  });

  // Active straddles merged with user decisions
  const activeStraddles: DetectedStraddle[] = useMemo(() => {
    return initialDetections.map((d) => {
      const state = straddleStates[d.id];
      const status = state?.status ?? 'candidate';
      const identifiedElection = state?.identified;
      return {
        ...d,
        status,
        identifiedElection,
      };
    });
  }, [initialDetections, straddleStates]);

  const handleConfirm = (id: string) => {
    setStraddleStates((prev) => ({
      ...prev,
      [id]: { ...prev[id], status: 'confirmed' },
    }));
  };

  const handleReject = (id: string) => {
    setStraddleStates((prev) => ({
      ...prev,
      [id]: { ...prev[id], status: 'rejected' },
    }));
  };

  const handleToggleIdentified = (straddle: DetectedStraddle) => {
    setStraddleStates((prev) => {
      const current = prev[straddle.id];
      if (current?.identified) {
        // remove election
        const { identified, ...rest } = current;
        return { ...prev, [straddle.id]: rest };
      } else {
        // add election
        const newElection: IdentifiedStraddle = {
          straddleId: straddle.id,
          identifiedAt: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' ET',
          positions: straddle.legs.map((l) => l.id),
          notes: `Identified straddle election recorded pursuant to IRC §1092(a)(2) on same-day entry.`,
        };
        return {
          ...prev,
          [straddle.id]: { ...current, status: 'confirmed', identified: newElection },
        };
      }
    });
  };

  // Only CONFIRMED straddles enter calculation math; candidate and rejected are strictly excluded
  const confirmedStraddles = useMemo(() => {
    return activeStraddles.filter((s) => s.status === 'confirmed');
  }, [activeStraddles]);

  // Aggregate loss deferrals across confirmed, non-mixed, non-QCC straddles
  const deferralCalculations = useMemo(() => {
    const items: Array<{
      straddle: DetectedStraddle;
      deferral?: LossDeferralResult;
      netting?: IdentifiedNettingResult;
      tolling?: HoldingPeriodTollingResult;
    }> = [];

    for (const straddle of confirmedStraddles) {
      // Mixed straddles are blocked from automated calculation
      if (straddle.isMixedStraddle) {
        items.push({ straddle });
        continue;
      }

      // QCC safe-harbor covered calls do not defer losses
      if (straddle.qcc?.isQualified) {
        items.push({ straddle });
        continue;
      }

      // Find realized loss on closed legs
      const closedLossLegs = straddle.legs.filter((l) => (l.realizedLoss ?? 0) > 0);
      const totalRealizedLoss = closedLossLegs.reduce((sum, l) => sum + (l.realizedLoss ?? 0), 0);

      // Find unrecognized gains on remaining offsetting open legs
      const openGains = straddle.legs
        .filter((l) => !l.closedAt)
        .map((l) => Math.max(0, l.unrealizedGain ?? 0));

      // 1. If Identified Straddle election exists -> Netting treatment
      if (straddle.identifiedElection) {
        const nettingLegs = straddle.legs.map((l) => ({
          id: l.id,
          realizedPnl: (l.realizedLoss ?? 0) > 0 ? -(l.realizedLoss ?? 0) : (l.unrealizedGain ?? 0),
          isClosed: !!l.closedAt,
        }));
        const netting = netIdentifiedStraddle(nettingLegs);
        items.push({ straddle, netting });
        continue;
      }

      // 2. Regular §1092(a)(1) Loss Deferral
      if (totalRealizedLoss > 0) {
        const deferral = computeDeferredLoss(totalRealizedLoss, openGains);
        items.push({ straddle, deferral });
      } else {
        items.push({ straddle });
      }
    }

    return items;
  }, [confirmedStraddles]);

  return (
    <div className="space-y-6">
      {/* Disclaimer & Attribution Banner */}
      <div className="p-3.5 rounded-xl bg-cyan-950/40 border border-cyan-500/30 flex items-start justify-between gap-3 text-xs">
        <div className="flex items-start space-x-2.5">
          <ShieldAlert className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <div className="text-cyan-200/90 leading-relaxed">
            <strong className="text-cyan-300 font-semibold">
              IRC §1092 Tax Straddle &amp; QCC Safe Harbor Review:
            </strong>{' '}
            Automated detection proposes candidate offsetting positions. <strong>You must confirm or reject each candidate.</strong>{' '}
            Unconfirmed candidates stay labeled <em>Unclear</em> and are excluded from tax math. QCC options that satisfy statutory benchmarks are exempt from straddle loss-deferral rules.
            <div className="text-[11px] text-amber-300/90 mt-1">
              <strong>Modelling Assumptions — NOT Tax Advice:</strong> Consult your licensed CPA regarding Form 6781 Part II reporting and formal identified-straddle elections.
            </div>
          </div>
        </div>
        <div className="text-[10px] text-cyan-400/80 font-mono shrink-0 text-right">
          Ported from MIT-licensed: net_alpha (wash-alpha)
        </div>
      </div>

      {/* Main Review Straddles Container */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 bg-slate-950/80 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
                <span>Active Straddle Candidates &amp; QCC Review</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                  {activeStraddles.length} Detected
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Review automated proposals below. Confirm verified offsetting pairs to activate loss-deferral calculations, or mark as Identified Straddles.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
              {confirmedStraddles.length} Confirmed
            </span>
            <span className="px-2 py-1 rounded bg-slate-800 text-slate-400">
              {activeStraddles.filter((s) => s.status === 'candidate').length} Pending
            </span>
          </div>
        </div>

        {/* Candidate List Cards */}
        <div className="space-y-3">
          {activeStraddles.map((straddle) => {
            const isConfirmed = straddle.status === 'confirmed';
            const isRejected = straddle.status === 'rejected';
            const isIdentified = !!straddle.identifiedElection;

            return (
              <div
                key={straddle.id}
                className={`p-4 rounded-xl border transition-all text-xs space-y-3 ${
                  isRejected
                    ? 'bg-slate-900/30 border-slate-800/40 opacity-60'
                    : isConfirmed
                    ? 'bg-slate-900/80 border-cyan-500/40 shadow-sm shadow-cyan-500/5'
                    : 'bg-slate-900/60 border-slate-700/60'
                }`}
              >
                {/* Header Row */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-white text-sm font-mono">{straddle.underlying}</span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase bg-slate-800 text-slate-300 border border-slate-700">
                      {straddle.kind.replace('-', ' ')}
                    </span>

                    {/* Confidence Label (net_alpha taxonomy) */}
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold ${
                        straddle.confidence === 'Confirmed'
                          ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                          : straddle.confidence === 'Probable'
                          ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                          : 'bg-slate-700 text-slate-300 border border-slate-600'
                      }`}
                    >
                      {straddle.confidence} Match
                    </span>

                    {/* QCC Safe Harbor Badge */}
                    {straddle.qcc && (
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold flex items-center gap-1 ${
                          straddle.qcc.isQualified
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        }`}
                      >
                        {straddle.qcc.isQualified ? (
                          <>
                            <ShieldCheck className="w-3 h-3 text-emerald-400" />
                            <span>QCC Safe Harbor (Not a Straddle)</span>
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="w-3 h-3 text-rose-400" />
                            <span>Non-QCC (§1092 Straddle)</span>
                          </>
                        )}
                      </span>
                    )}

                    {/* Mixed Straddle Badge */}
                    {straddle.isMixedStraddle && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-purple-400" />
                        <span>Mixed Straddle — CPA Review Required</span>
                      </span>
                    )}

                    {/* Identified Straddle Badge */}
                    {isIdentified && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-cyan-400" />
                        <span>Identified Straddle (§1092(a)(2))</span>
                      </span>
                    )}
                  </div>

                  {/* Review Actions */}
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => handleConfirm(straddle.id)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                        isConfirmed
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                      }`}
                    >
                      {isConfirmed ? '✓ Confirmed' : 'Confirm Straddle'}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleReject(straddle.id)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                        isRejected
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-400 border-slate-700'
                      }`}
                    >
                      {isRejected ? '✕ Rejected' : 'Reject (Unrelated)'}
                    </button>

                    {isConfirmed && !straddle.isMixedStraddle && (
                      <button
                        type="button"
                        onClick={() => handleToggleIdentified(straddle)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                          isIdentified
                            ? 'bg-cyan-500/25 text-cyan-200 border-cyan-400'
                            : 'bg-slate-800 hover:bg-slate-700 text-cyan-300 border-cyan-500/30'
                        }`}
                        title="Elect identified straddle treatment under IRC §1092(a)(2)"
                      >
                        {isIdentified ? '★ Identified Elected' : '+ Elect Identified'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Straddle Legs Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-mono text-[11px] bg-slate-950/60 rounded-lg overflow-hidden border border-slate-800/60">
                    <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="py-1.5 px-3">Position</th>
                        <th className="py-1.5 px-3">Type</th>
                        <th className="py-1.5 px-3">Strike / Expiry</th>
                        <th className="py-1.5 px-3">Opened</th>
                        <th className="py-1.5 px-3 text-right">Basis / Price</th>
                        <th className="py-1.5 px-3 text-right">Gain / Loss</th>
                        <th className="py-1.5 px-3">Holding Period (Tolled vs Actual)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/40">
                      {straddle.legs.map((leg) => {
                        const isStock = leg.kind === 'stock';
                        const isCall = leg.kind === 'call';
                        const strikeStr = leg.strike ? `$${leg.strike}` : '—';
                        const expiryStr = leg.expiry ?? '—';
                        const isQccItm = straddle.qcc?.isQualified && straddle.qcc.isInTheMoney;
                        const isNonQcc = straddle.qcc && !straddle.qcc.isQualified;

                        // Calculate holding period tolling
                        const tolling = tollHoldingPeriod(
                          leg.openedAt,
                          straddle.legs[0]?.openedAt ?? leg.openedAt,
                          leg.closedAt ?? '2026-10-09',
                          isQccItm,
                          isNonQcc
                        );

                        return (
                          <tr key={leg.id} className="hover:bg-slate-900/30">
                            <td className="py-2 px-3 font-sans font-semibold text-slate-200">
                              {leg.id}
                            </td>
                            <td className="py-2 px-3">
                              <span
                                className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold ${
                                  leg.side === 'long' ? 'text-emerald-400' : 'text-amber-400'
                                }`}
                              >
                                {leg.side} {leg.kind}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-slate-300">
                              {strikeStr} {expiryStr !== '—' && <span className="text-slate-500">exp {expiryStr}</span>}
                            </td>
                            <td className="py-2 px-3 text-slate-400">{leg.openedAt}</td>
                            <td className="py-2 px-3 text-right text-slate-300">
                              {leg.currentPrice ? `$${leg.currentPrice}` : `$${leg.basis}`}
                            </td>
                            <td className="py-2 px-3 text-right">
                              {(leg.realizedLoss ?? 0) > 0 ? (
                                <span className="text-rose-400 font-bold">
                                  -${leg.realizedLoss?.toLocaleString()} (Realized)
                                </span>
                              ) : (leg.unrealizedGain ?? 0) > 0 ? (
                                <span className="text-emerald-400 font-bold">
                                  +${leg.unrealizedGain?.toLocaleString()} (Unrealized)
                                </span>
                              ) : (
                                <span className="text-slate-500">$0</span>
                              )}
                            </td>
                            <td className="py-2 px-3 font-sans text-[10px]">
                              {isStock ? (
                                <div>
                                  <span className="text-cyan-300 font-mono font-bold">
                                    {tolling.adjustedDays}d
                                  </span>{' '}
                                  <span className="text-slate-500 font-mono">
                                    ({tolling.originalDays}d calendar)
                                  </span>
                                  {tolling.resetsToZero && (
                                    <span className="text-rose-400 ml-1 block">
                                      ⚠ Resets to zero (Non-QCC straddle)
                                    </span>
                                  )}
                                  {tolling.suspendedDays > 0 && !tolling.resetsToZero && (
                                    <span className="text-amber-400 ml-1 block">
                                      ⏸ Suspended {tolling.suspendedDays}d (ITM QCC)
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-slate-500 font-mono">
                                  {tolling.originalDays}d term
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Rationale & Authority footer */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span>{straddle.rationale}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      onSelectAuthority?.({
                        label: `${straddle.underlying} Straddle Authority`,
                        text: `${straddle.authority}\n\n${straddle.rationale}`,
                      })
                    }
                    className="text-cyan-400 hover:text-cyan-300 underline font-mono text-[10px] shrink-0"
                  >
                    View Statutory Authority
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Loss Deferral & Netting Preview Panel (Confirmed Only) */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 bg-slate-950/80 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <Zap className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white tracking-wide">
              Loss-Deferral Calculations &amp; Identified Netting Preview (Form 6781 Part II)
            </h3>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            Computed strictly on confirmed straddles
          </span>
        </div>

        {deferralCalculations.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400 bg-slate-900/40 rounded-xl border border-slate-800">
            No active loss deferrals. Confirm a straddle with realized losses to view statutory loss deferrals under IRC §1092(a)(1) or identified straddle basis adjustments.
          </div>
        ) : (
          <div className="space-y-4">
            {deferralCalculations.map(({ straddle, deferral, netting }) => {
              if (straddle.isMixedStraddle) {
                return (
                  <div
                    key={`deferral-${straddle.id}`}
                    className="p-4 rounded-xl bg-purple-950/30 border border-purple-500/40 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-purple-300 flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-purple-400" />
                        <span>{straddle.underlying} — Mixed Straddle Detected (IRC §1092(b) / §1256 Overlap)</span>
                      </span>
                      <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[10px] font-mono font-bold">
                        CPA Review Required
                      </span>
                    </div>
                    <p className="text-slate-300 text-[11px] leading-relaxed">
                      This straddle contains one or more IRC §1256 contracts (such as broad-based index options). Under IRC §1092(b) and §1256(a)(4), mixed straddles are subject to complex elective regimes (Straddle-by-Straddle Identification Election or Mixed Straddle Account Election). Automated calculation is disabled.
                    </p>
                  </div>
                );
              }

              if (straddle.qcc?.isQualified) {
                return (
                  <div
                    key={`deferral-${straddle.id}`}
                    className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center space-x-2 text-emerald-300 font-semibold">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>{straddle.underlying} Covered Call satisfies QCC Safe Harbor</span>
                    </div>
                    <span className="text-[11px] text-emerald-400/90 font-mono">
                      No §1092 loss deferral applied
                    </span>
                  </div>
                );
              }

              // Identified Straddle Netting Display
              if (netting) {
                return (
                  <div
                    key={`deferral-${straddle.id}`}
                    className="p-4 rounded-xl bg-slate-900 border border-cyan-500/40 space-y-3 text-xs"
                  >
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="font-bold text-cyan-300 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                        <span>{straddle.underlying} — Identified Straddle Netting (IRC §1092(a)(2))</span>
                      </span>
                      <span className="text-[10px] font-mono text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/30">
                        Basis-Adjustment Regime
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 font-mono text-center">
                      <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                        <span className="text-[10px] text-slate-400 block uppercase">Total Realized Loss</span>
                        <span className="text-base font-bold text-rose-400">
                          -${netting.totalRealizedLoss.toLocaleString()}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                        <span className="text-[10px] text-slate-400 block uppercase">Total Realized Gain</span>
                        <span className="text-base font-bold text-emerald-400">
                          +${netting.totalRealizedGain.toLocaleString()}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                        <span className="text-[10px] text-slate-400 block uppercase">Currently Deductible</span>
                        <span className="text-base font-bold text-slate-200">
                          ${netting.netDeductible.toLocaleString()}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                        <span className="text-[10px] text-slate-400 block uppercase">Basis Adjustment</span>
                        <span className="text-base font-bold text-cyan-400">
                          +${netting.basisAdjustment.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                      {netting.notes}
                    </p>
                  </div>
                );
              }

              // Regular Loss Deferral Display
              if (deferral) {
                return (
                  <div
                    key={`deferral-${straddle.id}`}
                    className="p-4 rounded-xl bg-slate-900 border border-rose-500/30 space-y-3 text-xs"
                  >
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="font-bold text-rose-300 flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-rose-400" />
                        <span>{straddle.underlying} — Loss Deferral Breakdown (IRC §1092(a)(1))</span>
                      </span>
                      <span className="text-[10px] font-mono text-rose-300 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/30">
                        Form 6781 Part II
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 font-mono text-center">
                      <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                        <span className="text-[10px] text-slate-400 block uppercase">Realized Loss</span>
                        <span className="text-base font-bold text-rose-400">
                          -${deferral.realizedLoss.toLocaleString()}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                        <span className="text-[10px] text-slate-400 block uppercase">Unrecognized Gains</span>
                        <span className="text-base font-bold text-emerald-400">
                          +${deferral.totalUnrecognizedGains.toLocaleString()}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                        <span className="text-[10px] text-slate-400 block uppercase">Deductible Now</span>
                        <span className="text-base font-bold text-cyan-400">
                          ${deferral.deductible.toLocaleString()}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                        <span className="text-[10px] text-slate-400 block uppercase">Deferred Carryforward</span>
                        <span className="text-base font-bold text-amber-400">
                          ${deferral.deferred.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-300 font-sans leading-relaxed">
                      <strong>Tax Impact:</strong> Under §1092(a)(1), your ${deferral.realizedLoss.toLocaleString()} realized loss is deductible only up to the excess over offsetting unrecognized gains (${deferral.totalUnrecognizedGains.toLocaleString()}). The remaining <strong>${deferral.deferred.toLocaleString()}</strong> is disallowed this year and carried forward to <strong>Tax Year {deferral.carryforwardYear}</strong> on IRS Form 6781 Line 4(k).
                    </div>
                  </div>
                );
              }

              return null;
            })}
          </div>
        )}
      </div>
    </div>
  );
};
