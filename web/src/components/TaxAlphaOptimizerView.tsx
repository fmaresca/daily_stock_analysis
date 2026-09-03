import React, { useState, useMemo } from 'react';
import {
  TaxBracketProfile,
  DEFAULT_TAX_PROFILE,
  calculateSection1256Comparison,
  getSampleWashSaleCandidates,
  WashSaleHarvestCandidate,
} from '../utils/taxAlphaOptimizer';
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

export const TaxAlphaOptimizerView: React.FC = () => {
  const [annualProfit, setAnnualProfit] = useState<number>(50000);
  const [taxProfile, setTaxProfile] = useState<TaxBracketProfile>(DEFAULT_TAX_PROFILE);
  const [harvestCandidates, setHarvestCandidates] = useState<WashSaleHarvestCandidate[]>(() =>
    getSampleWashSaleCandidates(taxProfile)
  );

  const taxComparison = useMemo(() => {
    return calculateSection1256Comparison(annualProfit, taxProfile);
  }, [annualProfit, taxProfile]);

  const totalHarvestableLosses = useMemo(() => {
    return harvestCandidates.reduce((acc, c) => acc + c.unrealizedLossDollars, 0);
  }, [harvestCandidates]);

  const totalTaxSavingsBanked = useMemo(() => {
    return harvestCandidates.reduce((acc, c) => acc + c.estimatedTaxDeductionValue, 0);
  }, [harvestCandidates]);

  const handleExecuteSwap = (id: string) => {
    alert('Tax-loss swap order staged! Loss deduction recorded for Form 8949 reporting.');
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800/80 bg-gradient-to-r from-slate-900/95 via-slate-900/60 to-slate-950 space-y-4">
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
                  IRS 60/40 Rule
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                Harvest maximum post-tax alpha using <strong>IRS Section 1256 Index Options (SPX / XSP / NDX)</strong> with statutory 60/40 capital gains tax relief, while algorithmically executing <strong>non-substantially identical tax-loss swaps</strong> to bank deductions without triggering the 30-day wash-sale rule (§ 1091).
              </p>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="flex items-center space-x-4 bg-slate-950/80 p-3 rounded-xl border border-slate-800 text-xs font-mono">
            <div>
              <span className="text-[10px] text-slate-500 uppercase block">1256 Tax Savings</span>
              <span className="text-base font-bold text-emerald-400">
                +${taxComparison.taxAlphaSavingsDollars.toLocaleString()}
              </span>
            </div>
            <div className="h-7 w-px bg-slate-800" />
            <div>
              <span className="text-[10px] text-slate-500 uppercase block">Harvestable Losses</span>
              <span className="text-base font-bold text-cyan-400">
                ${totalHarvestableLosses.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Tax Profile Inputs & Simulator */}
        <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="text-slate-400 block mb-1">Annual Options Net Profit ($):</label>
            <input
              type="number"
              step="5000"
              value={annualProfit}
              onChange={(e) => setAnnualProfit(Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono font-bold"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1">Marginal Short-Term Rate (%):</label>
            <select
              value={taxProfile.marginalOrdinaryRatePct}
              onChange={(e) =>
                setTaxProfile({ ...taxProfile, marginalOrdinaryRatePct: Number(e.target.value) })
              }
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono cursor-pointer"
            >
              <option value="24">24% Federal Bracket</option>
              <option value="32">32% Federal Bracket</option>
              <option value="35">35% Federal Bracket</option>
              <option value="37">37% Top Federal Bracket</option>
            </select>
          </div>

          <div>
            <label className="text-slate-400 block mb-1">Long-Term Capital Gains Rate (%):</label>
            <select
              value={taxProfile.longTermCapGainsRatePct}
              onChange={(e) =>
                setTaxProfile({ ...taxProfile, longTermCapGainsRatePct: Number(e.target.value) })
              }
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono cursor-pointer"
            >
              <option value="15">15% Standard Rate</option>
              <option value="20">20% Top Rate (+3.8% NIIT)</option>
            </select>
          </div>
        </div>

        {/* Tax Alpha Comparison Results Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-1">
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-[10px] text-slate-500 uppercase font-mono block">Single-Stock / ETF Options</span>
            <div className="text-base font-bold font-mono text-rose-400 mt-0.5">
              ${taxComparison.equityOptionTax.toLocaleString()}
            </div>
            <span className="text-[10px] text-slate-500">100% Ordinary Income Tax</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-emerald-500/30">
            <span className="text-[10px] text-emerald-400 uppercase font-mono block">Section 1256 Contracts</span>
            <div className="text-base font-bold font-mono text-emerald-300 mt-0.5">
              ${taxComparison.section1256Tax.toLocaleString()}
            </div>
            <span className="text-[10px] text-emerald-400">60% Long-Term / 40% Short-Term</span>
          </div>

          <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/50">
            <span className="text-[10px] text-emerald-400 uppercase font-mono block">Net Tax Alpha Saved</span>
            <div className="text-base font-bold font-mono text-emerald-400 mt-0.5">
              +${taxComparison.taxAlphaSavingsDollars.toLocaleString()}
            </div>
            <span className="text-[10px] text-emerald-300">Pure post-tax cash retained</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-cyan-500/30">
            <span className="text-[10px] text-cyan-400 uppercase font-mono block">Effective Tax Relief</span>
            <div className="text-base font-bold font-mono text-cyan-300 mt-0.5">
              {taxComparison.effectiveTaxReliefPct}% Less Tax
            </div>
            <span className="text-[10px] text-cyan-400">Without holding for 1 year</span>
          </div>
        </div>
      </div>

      {/* Section 1256 Institutional Advantages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-1.5 bg-slate-950/60">
          <div className="flex items-center space-x-2 text-emerald-400 font-bold text-xs">
            <Award className="w-4 h-4" />
            <span>60/40 Capital Gains Blend</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Every dollar of profit in SPX, XSP, or NDX is taxed as 60% long-term capital gains even if the trade was held for only 3 days. Saves up to 10.2% in taxes.
          </p>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-1.5 bg-slate-950/60">
          <div className="flex items-center space-x-2 text-cyan-400 font-bold text-xs">
            <ShieldCheck className="w-4 h-4" />
            <span>European Cash-Settlement</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Index options settle in cash and cannot be exercised early. Eliminates dividend assignment risk and catastrophic overnight assignment gaps.
          </p>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-1.5 bg-slate-950/60">
          <div className="flex items-center space-x-2 text-purple-400 font-bold text-xs">
            <Sliders className="w-4 h-4" />
            <span>Wash-Sale Rule Exemption</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Section 1256 contracts are marked-to-market at year-end and are exempt from the tedious 30-day IRS wash-sale rule (§ 1091), radically simplifying tax reporting.
          </p>
        </div>
      </div>

      {/* Wash-Sale Tax-Loss Harvesting Candidates Table */}
      <div className="glass-panel rounded-xl border border-slate-800 overflow-hidden shadow-2xl">
        <div className="px-5 py-3 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between">
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

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/90 text-[10px] font-bold text-slate-400 uppercase font-mono">
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
    </div>
  );
};
