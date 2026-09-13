import React from 'react';
import { DirectActionBanner } from './DirectActionBanner';
import { DollarSign, ShieldCheck, AlertTriangle, CheckCircle2, TrendingUp, Zap } from '../../../icons';
import { MenuTreeType, EquitiesTabType, OptionsTabType } from '../../../../types/options';

export interface ChapterTaxAlphaAuditProps {
  onNavigate?: (tree: MenuTreeType, optionsTab?: OptionsTabType, equitiesTab?: EquitiesTabType) => void;
  onOpenSimulator?: () => void;
}

export const ChapterTaxAlphaAudit: React.FC<ChapterTaxAlphaAuditProps> = ({
  onNavigate,
  onOpenSimulator,
}) => {
  return (
    <div className="space-y-6">
      {/* Title & Badge */}
      <div className="border-l-2 border-emerald-400 pl-4 py-1">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-emerald-400" />
          <span>Institutional Derivatives Tax Alpha &amp; IRC Subchapter P Audit (v3.4)</span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
            IRS Form 6781 &amp; Form 8949
          </span>
        </h3>
        <p className="text-slate-300 mt-1 text-xs leading-relaxed">
          Comprehensive statutory guide for institutional options traders, covered call writers, and high-net-worth investors. Details federal tax classification, 60/40 capital gain splits, straddle loss deferrals, wash sales, and constructive sale rules across IRC Sections 1256, 1092, 1091, 1233, and 1259.
        </p>
      </div>

      {/* Direct Action Hyperlinks */}
      <DirectActionBanner
        title="Institutional Tax &amp; Execution Direct Access"
        actions={[
          {
            label: 'Section 1256 Tax Alpha Optimizer',
            location: 'Options > Section 1256 Tax Alpha',
            onClick: () => onNavigate?.('OPTIONS', 'TAX_ALPHA_OPTIMIZER'),
          },
          {
            label: 'Launch Trade Quality Simulator',
            location: 'Interactive 4-Tab Modal',
            onClick: onOpenSimulator,
          },
          {
            label: 'Cash & Tax Alpha Ledger Panel',
            location: 'Workflow > Cash Ledger (Step 2)',
            onClick: () => onNavigate?.('WORKFLOW', 'WEEKLY_CASH_LEDGER'),
          },
          {
            label: 'Defensive Roll Assistant',
            location: 'Options > Defensive Rolling',
            onClick: () => onNavigate?.('OPTIONS', 'DEFENSIVE_ROLL_ASSISTANT'),
          },
        ]}
      />

      {/* The 5 Statutory Evaluation Gateways */}
      <div className="space-y-4">
        <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>The 5 Statutory Evaluation Gateways (IRC Subchapter P)</span>
        </h4>

        {/* Gate 1: IRC 1256 */}
        <div className="bg-slate-950/80 p-4 rounded-xl border border-emerald-500/30 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-emerald-400 flex items-center gap-1.5">
              <span>Gate 1: IRC &sect;1256 Non-Equity Options &amp; Regulated Futures</span>
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
              60% LTCG / 40% STCG
            </span>
          </div>
          <p className="text-slate-300 text-[11px] leading-relaxed">
            Contracts qualifying under IRC &sect;1256 include regulated futures and cash-settled <strong>broad-based index options</strong> (e.g., SPX, NDX, RUT, XSP, VIX, OEX). 
            <span className="text-amber-300 font-semibold"> Critical distinction:</span> ETF options (SPY, QQQ, IWM) and single-stock equity options do <strong>NOT</strong> qualify under &sect;1256 and are taxed under standard &sect;1221 capital gain rules.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 font-mono text-[10px] pt-1">
            <div className="p-2 rounded bg-slate-900 border border-slate-800">
              <span className="text-slate-400 block font-sans">Tax Treatment</span>
              <span className="text-emerald-300 font-bold">60% Long-Term / 40% Short-Term</span>
              <span className="text-slate-500 block">Regardless of actual holding period</span>
            </div>
            <div className="p-2 rounded bg-slate-900 border border-slate-800">
              <span className="text-slate-400 block font-sans">Year-End MTM</span>
              <span className="text-cyan-300 font-bold">Mark-to-Market Required</span>
              <span className="text-slate-500 block">Deemed closed at 12/31 settlement</span>
            </div>
            <div className="p-2 rounded bg-slate-900 border border-slate-800">
              <span className="text-slate-400 block font-sans">Form Routing &amp; Exemptions</span>
              <span className="text-amber-300 font-bold">IRS Form 6781 Part I</span>
              <span className="text-slate-500 block">Exempt from &sect;1091 Wash Sales &amp; &sect;1092</span>
            </div>
          </div>
        </div>

        {/* Gate 2: IRC 1092(c)(4) QCC */}
        <div className="bg-slate-950/80 p-4 rounded-xl border border-cyan-500/30 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-cyan-300 flex items-center gap-1.5">
              <span>Gate 2: IRC &sect;1092(c)(4) Qualified Covered Call (QCC) Test</span>
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold">
              Straddle Exemption Guard
            </span>
          </div>
          <p className="text-slate-300 text-[11px] leading-relaxed">
            When short call options are written against long stock, the trade creates an offsetting position that would normally trigger &sect;1092 straddle loss deferrals. To qualify for the statutory QCC safe harbor:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[11px] pt-1">
            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
              <span className="font-bold text-slate-200 block">1. Term Test (DTE &gt; 30)</span>
              <p className="text-slate-400 text-[10px]">
                Must be granted more than 30 days before expiration, with a maximum allowable term of 33 months. Weekly options (DTE &le; 30) fail the QCC test!
              </p>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
              <span className="font-bold text-slate-200 block">2. Benchmark Strike Test</span>
              <p className="text-slate-400 text-[10px]">
                Strike cannot be lower than the &quot;lowest qualified benchmark&quot; (the highest available strike price less than the preceding day's closing stock price).
              </p>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
              <span className="font-bold text-slate-200 block">3. Deep-in-the-Money (DITM)</span>
              <p className="text-slate-400 text-[10px]">
                If strike falls below the benchmark, it is DITM, disqualifying QCC status and resetting the underlying stock holding period to zero!
              </p>
            </div>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 text-[10px] font-mono text-slate-300">
            <strong className="text-cyan-400">Holding Period Impact:</strong> OTM/ATM QCC = stock holding period continues to accrue. ITM QCC = stock holding period is SUSPENDED during option life. Non-Qualified Covered Call = holding period terminates/resets to zero if held &le; 1 year.
          </div>
        </div>

        {/* Gate 3: IRC 1091 Wash Sales */}
        <div className="bg-slate-950/80 p-4 rounded-xl border border-amber-500/30 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-amber-300 flex items-center gap-1.5">
              <span>Gate 3: IRC &sect;1091 Wash Sale 61-Day Cross-Asset Window</span>
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
              Form 8949 Code W
            </span>
          </div>
          <p className="text-slate-300 text-[11px] leading-relaxed">
            A wash sale occurs if stock or equity options are closed at a realized loss and, within a <strong>61-day window</strong> (30 days before through 30 days after disposition), the taxpayer acquires &quot;substantially identical stock or securities&quot; or contracts/options to acquire them.
          </p>
          <ul className="text-slate-400 text-[10px] space-y-1 list-disc pl-4 font-mono">
            <li><strong>Option-to-Stock Ingestion:</strong> Closing stock at a loss and buying call options within 30 days triggers &sect;1091.</li>
            <li><strong>Deep-in-the-Money CSPs:</strong> Writing a short put with &Delta; &ge; 0.70 within 30 days of a stock loss triggers wash sale disallowance (treated as economic acquisition of stock).</li>
            <li><strong>Basis Adjustment:</strong> Disallowed loss is added to the cost basis of the replacement position, postponing tax deduction until replacement is liquidated.</li>
          </ul>
        </div>

        {/* Gate 4: IRC 1233 & Protective Puts */}
        <div className="bg-slate-950/80 p-4 rounded-xl border border-purple-500/30 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-purple-300 flex items-center gap-1.5">
              <span>Gate 4: IRC &sect;1233 Protective Put Holding Period Termination</span>
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold">
              Short-Term Reset
            </span>
          </div>
          <p className="text-slate-300 text-[11px] leading-relaxed">
            Buying a put option on an underlying stock held for 1 year or less terminates the accrued holding period of the stock under &sect;1233(b). The holding period starts over on the date the put option is disposed of or expires.
          </p>
          <p className="text-[10px] text-purple-300 font-mono">
            <strong>Exception (&sect;1233(c) Married Put):</strong> If the put is acquired on the same day as the stock and formally identified in tax records as intended to hedge that specific stock lot, the holding period is NOT terminated.
          </p>
        </div>

        {/* Gate 5: IRC 1259 Constructive Sales */}
        <div className="bg-slate-950/80 p-4 rounded-xl border border-rose-500/30 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-rose-300 flex items-center gap-1.5">
              <span>Gate 5: IRC &sect;1259 Constructive Sales of Appreciated Positions</span>
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold">
              Immediate Realization
            </span>
          </div>
          <p className="text-slate-300 text-[11px] leading-relaxed">
            If an investor holds appreciated stock and enters into an offsetting short sale, deep ITM collar, or forward contract that eliminates substantially all risk of loss and opportunity for gain, IRC &sect;1259 deems the position <strong>constructively sold</strong> on that date.
          </p>
          <p className="text-[10px] text-rose-400 font-mono">
            Immediate capital gain is recognized on the full appreciation as if sold at fair market value, establishing a new holding period and stepped-up cost basis.
          </p>
        </div>
      </div>

      {/* Tax Reporting Summary Table */}
      <div className="glass-panel rounded-xl border border-slate-800 overflow-hidden text-xs">
        <div className="p-3 bg-slate-950/80 border-b border-slate-800 font-bold text-white flex items-center justify-between">
          <span>Federal Income Tax Form Routing Matrix</span>
          <span className="text-[10px] font-mono text-emerald-400">IRS Compliance Reference</span>
        </div>
        <table className="w-full text-left border-collapse text-[11px]">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 font-semibold uppercase">
              <th className="py-2.5 px-3">Instrument / Transaction</th>
              <th className="py-2.5 px-3">Statutory Code</th>
              <th className="py-2.5 px-3">Tax Form</th>
              <th className="py-2.5 px-3">Character &amp; Rate Advantage</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-300">
            <tr className="hover:bg-slate-800/30">
              <td className="py-2.5 px-3 font-semibold text-white">Broad-Based Index Options (SPX, NDX)</td>
              <td className="py-2.5 px-3 font-mono text-emerald-400">IRC &sect;1256</td>
              <td className="py-2.5 px-3 font-mono text-cyan-300">Form 6781, Part I</td>
              <td className="py-2.5 px-3">Blended 60% LTCG / 40% STCG (~26.8% max fed rate vs 37% ordinary)</td>
            </tr>
            <tr className="hover:bg-slate-800/30">
              <td className="py-2.5 px-3 font-semibold text-white">Qualified Covered Call (QCC)</td>
              <td className="py-2.5 px-3 font-mono text-emerald-400">IRC &sect;1092(c)(4)</td>
              <td className="py-2.5 px-3 font-mono text-cyan-300">Form 8949 / Sched D</td>
              <td className="py-2.5 px-3">Exempt from straddle deferral; LTCG preserved if held &gt; 1 yr</td>
            </tr>
            <tr className="hover:bg-slate-800/30">
              <td className="py-2.5 px-3 font-semibold text-white">Non-Qualified Covered Call / Straddle</td>
              <td className="py-2.5 px-3 font-mono text-rose-400">IRC &sect;1092</td>
              <td className="py-2.5 px-3 font-mono text-cyan-300">Form 6781, Part II</td>
              <td className="py-2.5 px-3">Realized call losses deferred at year-end to extent of unrealized stock gains</td>
            </tr>
            <tr className="hover:bg-slate-800/30">
              <td className="py-2.5 px-3 font-semibold text-white">Disallowed Wash Sale Position</td>
              <td className="py-2.5 px-3 font-mono text-amber-400">IRC &sect;1091</td>
              <td className="py-2.5 px-3 font-mono text-cyan-300">Form 8949 (Code W)</td>
              <td className="py-2.5 px-3">Loss disallowed; added to replacement basis; holding period tacked</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
