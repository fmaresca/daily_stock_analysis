/**
 * Section 1256 Tax-Alpha & Wash-Sale Shield Optimizer View
 *
 * Attribution:
 * Ported from MIT-licensed `howard-lynn-ye/Fin-RSI`
 * (`fin_skills/_skills/section-1256-and-derivatives-tax/SKILL.md`,
 * source-verified 2026-09-09 against IRC §1256, IRS Pub 550 (2025),
 * 15 U.S.C. §78c(a)(55), and Rev. Rul. 2026-16).
 *
 * IMPORTANT LEGAL & TAX DISCLAIMER:
 * Modelling assumptions for backtests and portfolio analysis, NOT tax advice.
 * Always consult a qualified CPA or licensed tax professional regarding your
 * specific tax situation and filing of IRS Form 6781.
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  TaxBracketProfile,
  calculateSection1256Comparison,
  getSampleWashSaleCandidates,
  getSampleTaxAlphaPositions,
  getStoredTaxProfile,
  saveStoredTaxProfile,
  WashSaleHarvestCandidate,
  TaxAlphaHoldingPosition,
} from '../utils/taxAlphaOptimizer';
import { getStoredCapitalState } from '../utils/capitalAndTaxLedger';
import { sixtyForty } from '../utils/section1256';
import {
  DollarSign,
  ShieldCheck,
  TrendingUp,
  Activity,
  Zap,
  Sliders,
  CheckCircle2,
  Award,
  AlertTriangle,
  Info,
} from './icons';
import { Section1092StraddlePanel } from './tax/Section1092StraddlePanel';

export const TaxAlphaOptimizerView: React.FC = () => {
  const storedYtd = useMemo(() => {
    try {
      const cap = getStoredCapitalState();
      return cap.ytdPremiumsEarned ?? 0;
    } catch {
      return 0;
    }
  }, []);

  // Tax rates are user inputs, never defaults. Persisted per user in localStorage.
  const [taxProfile, setTaxProfile] = useState<TaxBracketProfile>(() => getStoredTaxProfile());
  const [annualProfit, setAnnualProfit] = useState<number>(storedYtd > 0 ? storedYtd : 45000);
  const [positions, setPositions] = useState<TaxAlphaHoldingPosition[]>(() => getSampleTaxAlphaPositions());
  const [harvestCandidates] = useState<WashSaleHarvestCandidate[]>(() =>
    getSampleWashSaleCandidates(taxProfile)
  );

  // Active hover/tap authority modal or popover
  const [activeAuthority, setActiveAuthority] = useState<{ label: string; text: string } | null>(null);

  // Persist tax rate changes
  const handleRateChange = (field: keyof TaxBracketProfile, value: number) => {
    const updated = { ...taxProfile, [field]: value };
    setTaxProfile(updated);
    saveStoredTaxProfile(updated);
  };

  // Calculate sum of unrealized gains for open Section 1256 positions at year end
  const open1256UnrealizedGains = useMemo(() => {
    return positions
      .filter((p) => p.isOpenAtYearEnd && p.classification.regime === 'section1256' && p.unrealizedPnl > 0)
      .reduce((sum, p) => sum + p.unrealizedPnl, 0);
  }, [positions]);

  // Section 1256 detailed comparison with Rate Effect and Timing Effect separated
  const comparison = useMemo(() => {
    return calculateSection1256Comparison(annualProfit, taxProfile, open1256UnrealizedGains);
  }, [annualProfit, taxProfile, open1256UnrealizedGains]);

  const totalHarvestableLosses = useMemo(() => {
    return harvestCandidates.reduce((acc, c) => acc + c.unrealizedLossDollars, 0);
  }, [harvestCandidates]);

  const totalTaxSavingsBanked = useMemo(() => {
    return harvestCandidates.reduce((acc, c) => acc + c.estimatedTaxDeductionValue, 0);
  }, [harvestCandidates]);

  // Simulated loss schedule for net loss years (Form 6781 carryback)
  const [simulatedLoss, setSimulatedLoss] = useState<number>(12000);
  const simulatedLossSplit = useMemo(() => {
    return sixtyForty(simulatedLoss);
  }, [simulatedLoss]);

  const handleExecuteSwap = (id: string) => {
    alert(`Tax-loss swap order staged for candidate ${id}! Loss deduction recorded for Form 8949.`);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Framing & Mandatory Disclaimer Banner */}
      <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start justify-between gap-3 text-xs">
        <div className="flex items-start space-x-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-amber-200/90 leading-relaxed">
            <strong className="text-amber-300 font-semibold">Modelling Assumptions — Not Tax Advice:</strong>{' '}
            All calculations reflect mathematical modeling of IRC §1256, IRS Pub 550 (2025), and Rev. Rul. 2026-16.
            Derivatives tax rules evolve and vary by jurisdiction. Always have your licensed CPA verify contract classification and IRS Form 6781 filings.
          </div>
        </div>
        <div className="text-[10px] text-amber-400/80 font-mono shrink-0 text-right">
          MIT Attribution: howard-lynn-ye/Fin-RSI
        </div>
      </div>

      {/* Main Header & Engine Control Card */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800/80 bg-gradient-to-r from-slate-900/95 via-slate-900/60 to-slate-950 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shadow-lg shadow-emerald-500/10">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold text-white tracking-wide">
                  Section 1256 Tax-Alpha &amp; Wash-Sale Shield Optimizer
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  IRC §1256 60/40 Rule
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                Statutory 60/40 blended tax modeling for <strong>SPX, NDX, RUT broad-based index contracts</strong> with rate and timing effects separated, year-end mark-to-market forecasting, and 30-day wash-sale shield (§1091).
              </p>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="flex items-center space-x-4 bg-slate-950/80 p-3 rounded-xl border border-slate-800 text-xs font-mono">
            <div>
              <span className="text-[10px] text-slate-500 uppercase block">Blended 1256 Rate</span>
              <span className="text-base font-bold text-emerald-400">
                {comparison.blendedRatePct}%
              </span>
            </div>
            <div className="h-7 w-px bg-slate-800" />
            <div>
              <span className="text-[10px] text-slate-500 uppercase block">Net Tax Alpha</span>
              <span className="text-base font-bold text-cyan-400">
                +${comparison.netTaxAlpha.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Marginal Tax Rates: User Inputs (Never Hardcoded Defaults) */}
        <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-slate-300 font-semibold block">
                Annual Options Net Profit ($):
              </label>
              {storedYtd > 0 && (
                <button
                  type="button"
                  onClick={() => setAnnualProfit(storedYtd)}
                  className="text-[10px] text-emerald-400 hover:text-emerald-300 underline font-mono"
                  title="Reset to verified YTD Premiums from portfolio storage"
                >
                  Sync YTD (${Math.round(storedYtd).toLocaleString()})
                </button>
              )}
            </div>
            <input
              type="number"
              step="1000"
              value={annualProfit}
              onChange={(e) => setAnnualProfit(Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono font-bold focus:border-emerald-500 focus:outline-none"
            />
            <span className="text-[10px] text-slate-500 mt-1 block">Total annual net options trading gains</span>
          </div>

          <div>
            <label className="text-slate-300 font-semibold block mb-1">
              Frank's Marginal Short-Term Rate (%):
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.5"
                min="0"
                max="60"
                value={taxProfile.marginalOrdinaryRatePct}
                onChange={(e) => handleRateChange('marginalOrdinaryRatePct', Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono font-bold focus:border-emerald-500 focus:outline-none"
                placeholder="e.g. 37"
              />
              <span className="absolute right-3 top-2 text-slate-500 font-mono text-xs">%</span>
            </div>
            <span className="text-[10px] text-slate-500 mt-1 block">
              Ordinary income bracket (e.g. 37% federal top marginal)
            </span>
          </div>

          <div>
            <label className="text-slate-300 font-semibold block mb-1">
              Frank's Long-Term Capital Gains Rate (%):
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.5"
                min="0"
                max="40"
                value={taxProfile.longTermCapGainsRatePct}
                onChange={(e) => handleRateChange('longTermCapGainsRatePct', Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono font-bold focus:border-emerald-500 focus:outline-none"
                placeholder="e.g. 20"
              />
              <span className="absolute right-3 top-2 text-slate-500 font-mono text-xs">%</span>
            </div>
            <span className="text-[10px] text-slate-500 mt-1 block">
              Statutory long-term rate (e.g. 20% federal + NIIT)
            </span>
          </div>
        </div>

        {/* After-Tax P&L: The Two Opposing Effects Broken Out */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono flex items-center space-x-1.5">
              <span>After-Tax P&amp;L Analysis (Counteracting Effects Decomposition)</span>
            </span>
            <button
              type="button"
              onClick={() =>
                setActiveAuthority({
                  label: 'Rate Effect vs Timing Effect Invariant',
                  text: 'IRC §1256(a)(3) grants a 60/40 blended tax rate saving (Rate Effect). Concurrently, IRC §1256(a)(1) mandates marking open positions to market on Dec 31 (Timing Effect), causing tax due on unrealized gains before cash realization. A truthful model never obscures this timing cost.',
                })
              }
              className="text-[11px] text-emerald-400 hover:text-emerald-300 underline font-mono flex items-center space-x-1"
            >
              <Info className="w-3 h-3" />
              <span>Authority Details</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-1">
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase font-mono block">Equity Option Regime Tax</span>
              <div className="text-base font-bold font-mono text-rose-400 mt-0.5">
                ${comparison.equityOptionTax.toLocaleString()}
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Taxed @ {taxProfile.marginalOrdinaryRatePct}% short-term
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-emerald-500/40">
              <span className="text-[10px] text-emerald-400 uppercase font-mono block">
                1. Rate Effect (Statutory Savings)
              </span>
              <div className="text-base font-bold font-mono text-emerald-300 mt-0.5">
                +${comparison.rateEffect.toLocaleString()}
              </div>
              <span className="text-[10px] text-emerald-400/80 mt-0.5 block">
                §1256(a)(3): 60/40 blended rate ({comparison.blendedRatePct}%)
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-amber-500/40">
              <span className="text-[10px] text-amber-400 uppercase font-mono block">
                2. Timing Effect (Early MTM Tax)
              </span>
              <div className="text-base font-bold font-mono text-amber-300 mt-0.5">
                -${comparison.timingEffect.toLocaleString()}
              </div>
              <span className="text-[10px] text-amber-400/80 mt-0.5 block">
                §1256(a)(1): Accelerated cash outflow on Dec 31
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/60 shadow-lg shadow-emerald-950/20">
              <span className="text-[10px] text-emerald-400 uppercase font-mono block font-bold">
                Net Tax Alpha Retained
              </span>
              <div className="text-lg font-bold font-mono text-emerald-300 mt-0.5">
                +${comparison.netTaxAlpha.toLocaleString()}
              </div>
              <span className="text-[10px] text-emerald-300/80 mt-0.5 block">
                Rate effect minus cash timing drag
              </span>
            </div>
          </div>
        </div>

        {/* Year-End Mark Ledger Warning Banner */}
        {comparison.decemberMtmWarning && (
          <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/50 flex items-start space-x-3 text-xs shadow-lg">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-bold text-rose-300 flex items-center space-x-2">
                <span>YEAR-END MARK-TO-MARKET CASH-FLOW WARNING</span>
                <span className="px-2 py-0.5 text-[9px] font-mono bg-rose-900/60 text-rose-200 rounded border border-rose-700/50">
                  IRC §1256(a)(1)
                </span>
              </div>
              <p className="text-rose-200/90 leading-relaxed font-sans">
                {comparison.decemberMtmWarning}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Portfolio Holdings & Regime Classification Table */}
      <div className="glass-panel rounded-xl border border-slate-800 overflow-hidden shadow-2xl">
        <div className="px-5 py-3.5 bg-slate-900/80 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <h2 className="text-sm font-bold text-white tracking-wide">
              Portfolio Holdings &amp; Statutory Tax Regime Classification
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Strict verified rules • ETF options stay equity-option per Rev. Rul. 2026-16
          </span>
        </div>

        <div className="overflow-x-auto max-h-[480px] overflow-y-auto table-scroll-container">
          <table className="w-full text-left border-collapse text-xs table-sticky-header">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/90 text-[10px] font-bold text-slate-400 uppercase font-mono sticky top-0 z-10">
                <th className="py-3 px-4">Position / Underlying</th>
                <th className="py-3 px-3">Contract Description</th>
                <th className="py-3 px-3">Unrealized P&amp;L</th>
                <th className="py-3 px-3">Dec 31 Status</th>
                <th className="py-3 px-3 text-center">Tax Regime Badge</th>
                <th className="py-3 px-4">Statutory Authority (Hover/Tap)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
              {positions.map((pos) => {
                const is1256 = pos.classification.regime === 'section1256';
                const isUnclear = pos.classification.regime === 'unclear';
                return (
                  <tr key={pos.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3 px-4 font-sans font-bold text-white">
                      <div className="flex items-center space-x-2">
                        <span>{pos.symbol}</span>
                      </div>
                    </td>

                    <td className="py-3 px-3 font-sans text-slate-300">
                      {pos.description}
                    </td>

                    <td className={`py-3 px-3 font-bold ${pos.unrealizedPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {pos.unrealizedPnl >= 0 ? '+' : ''}${pos.unrealizedPnl.toLocaleString()}
                    </td>

                    <td className="py-3 px-3">
                      {pos.isOpenAtYearEnd ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/10 text-amber-300 border border-amber-500/30">
                          Open (MTM Taxable)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-400">
                          Closed / Realized
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-3 text-center">
                      <button
                        type="button"
                        onClick={() =>
                          setActiveAuthority({
                            label: `${pos.symbol} — ${pos.classification.badgeLabel}`,
                            text: `${pos.classification.authority}: ${pos.classification.explanation}`,
                          })
                        }
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold font-mono border transition-all cursor-pointer ${
                          pos.classification.badgeLabel === '§1256'
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/25'
                            : pos.classification.badgeLabel === 'Equity option'
                            ? 'bg-blue-500/15 text-blue-300 border-blue-500/40 hover:bg-blue-500/25'
                            : 'bg-amber-500/15 text-amber-300 border-amber-500/40 hover:bg-amber-500/25'
                        }`}
                        title="Click to view statutory legal authority"
                      >
                        {pos.classification.badgeLabel}
                      </button>
                    </td>

                    <td className="py-3 px-4 text-[10px] font-sans text-slate-400 truncate max-w-xs">
                      <span
                        className="cursor-pointer hover:text-slate-200 underline decoration-slate-700"
                        onClick={() =>
                          setActiveAuthority({
                            label: `${pos.symbol} Statutory Authority`,
                            text: pos.classification.authority,
                          })
                        }
                      >
                        {pos.classification.authority}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 1092 Straddle & QCC Detection Engine Panel */}
      <Section1092StraddlePanel
        onSelectAuthority={(auth) => setActiveAuthority(auth)}
      />

      {/* 3-Year Loss Carryback Schedule Panel */}
      <div className="glass-panel p-5 rounded-xl border border-slate-800 bg-slate-950/70 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <Activity className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm font-bold text-white tracking-wide">
              IRC §1212(c) 3-Year Section 1256 Net Loss Carryback Schedule
            </h3>
          </div>
          <span className="text-[11px] text-purple-300 font-mono">
            For your CPA — Carryback not computed here (Form 6781 required)
          </span>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed max-w-3xl">
          Unlike standard equity options which only carry losses forward ($3,000/year limit), non-corporate taxpayers holding §1256 contracts can elect under <strong>IRC §1212(c)</strong> to carry net Section 1256 losses back up to 3 preceding calendar tax years against prior §1256 net gains, securing immediate cash refunds from past taxes paid.
        </p>

        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs font-mono">
          <div>
            <label className="text-slate-400 block mb-1">Simulated Net §1256 Loss ($):</label>
            <input
              type="number"
              step="1000"
              value={simulatedLoss}
              onChange={(e) => setSimulatedLoss(Math.abs(Number(e.target.value)))}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-rose-400 font-mono font-bold"
            />
          </div>

          <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800">
            <span className="text-[10px] text-slate-500 uppercase block">60% Long-Term Loss</span>
            <div className="text-sm font-bold text-rose-400 mt-1">
              -${simulatedLossSplit.longTerm.toLocaleString()}
            </div>
            <span className="text-[9px] text-slate-500">Offsets prior 60% LT gains</span>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800">
            <span className="text-[10px] text-slate-500 uppercase block">40% Short-Term Loss</span>
            <div className="text-sm font-bold text-rose-400 mt-1">
              -${simulatedLossSplit.shortTerm.toLocaleString()}
            </div>
            <span className="text-[9px] text-slate-500">Offsets prior 40% ST gains</span>
          </div>

          <div className="p-2.5 rounded-lg bg-purple-950/30 border border-purple-500/40">
            <span className="text-[10px] text-purple-300 uppercase block">Estimated Tax Refund</span>
            <div className="text-sm font-bold text-purple-300 mt-1">
              +${Math.round(simulatedLoss * (comparison.blendedRatePct / 100)).toLocaleString()}
            </div>
            <span className="text-[9px] text-purple-400">Via 3-Year Carryback Election</span>
          </div>
        </div>
      </div>

      {/* Wash-Sale Tax-Loss Harvesting Candidates Table */}
      <div className="glass-panel rounded-xl border border-slate-800 overflow-hidden shadow-2xl">
        <div className="px-5 py-3.5 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
            <h2 className="text-sm font-bold text-white tracking-wide">
              Active Wash-Sale Tax-Loss Harvesting Opportunities
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Banks ${totalTaxSavingsBanked.toLocaleString()} in immediate tax deductions
          </span>
        </div>

        <div className="overflow-x-auto max-h-[680px] overflow-y-auto table-scroll-container">
          <table className="w-full text-left border-collapse text-xs table-sticky-header">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/90 text-[10px] font-bold text-slate-400 uppercase font-mono sticky top-0 z-10">
                <th className="py-3 px-4">Underwater Position</th>
                <th className="py-3 px-3">Unrealized Loss</th>
                <th className="py-3 px-3">Non-Substantially Identical Proxy</th>
                <th className="py-3 px-3">Correlation (R²)</th>
                <th className="py-3 px-3 text-right">Tax Deduction Banked</th>
                <th className="py-3 px-3">Strategic Rationale</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
              {harvestCandidates.map((cand) => (
                <tr key={cand.id} className="hover:bg-slate-900/40 transition-colors">
                  <td className="py-3 px-4 font-sans font-bold text-white">
                    <div>{cand.symbol}</div>
                    <span className="text-[10px] text-slate-400 block font-normal">{cand.positionType}</span>
                  </td>

                  <td className="py-3 px-3 text-rose-400 font-bold">
                    -${cand.unrealizedLossDollars.toLocaleString()}
                  </td>

                  <td className="py-3 px-3">
                    <div className="text-cyan-300 font-bold">{cand.recommendedProxy}</div>
                    <span className="text-[10px] text-slate-400 block font-normal">{cand.proxyName}</span>
                  </td>

                  <td className="py-3 px-3 text-emerald-400 font-bold">
                    {cand.correlationR2.toFixed(3)}
                  </td>

                  <td className="py-3 px-3 text-right text-emerald-300 font-bold">
                    +${cand.estimatedTaxDeductionValue.toLocaleString()}
                  </td>

                  <td className="py-3 px-3 font-sans text-slate-300 text-[11px] max-w-xs leading-relaxed">
                    {cand.rationale}
                  </td>

                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => handleExecuteSwap(cand.id)}
                      className="px-3 py-1.5 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 hover:text-cyan-200 border border-cyan-500/40 font-semibold flex items-center space-x-1 mx-auto transition-all shadow-sm cursor-pointer"
                    >
                      <Zap className="w-3 h-3 text-cyan-400" />
                      <span>Execute Swap</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Popover / Modal for Authority Citing */}
      {activeAuthority && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-2xl border border-slate-700 bg-slate-900 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-sm flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>{activeAuthority.label}</span>
              </h3>
              <button
                type="button"
                onClick={() => setActiveAuthority(null)}
                className="text-slate-400 hover:text-white font-mono text-sm"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed font-sans whitespace-pre-wrap">
              {activeAuthority.text}
            </p>
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setActiveAuthority(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
