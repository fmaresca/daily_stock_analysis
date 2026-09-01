import React, { useState, useMemo } from 'react';
import {
  X,
  FileSpreadsheet,
  FileText,
  Printer,
  Download,
  Filter,
  TrendingUp,
  ShieldCheck,
  Flame,
  Layers,
  Check,
} from './icons';
import { OptionOpportunity, TickerMeta, ScreenerSummary } from '../types/options';
import {
  exportOpportunitiesToCSV,
  exportTickersToCSV,
  exportToExcel,
  triggerPrintReport,
} from '../utils/exportImport';

interface ReportQueryModalProps {
  isOpen: boolean;
  onClose: () => void;
  tickers: TickerMeta[];
  opportunities: OptionOpportunity[];
  summary: ScreenerSummary | null;
}

export const ReportQueryModal: React.FC<ReportQueryModalProps> = ({
  isOpen,
  onClose,
  tickers,
  opportunities,
  summary,
}) => {
  const [strategy, setStrategy] = useState<'ALL' | 'CSP' | 'CC'>('ALL');
  const [cadence, setCadence] = useState<'ALL' | 'WEEKLY_ONLY' | 'MONTHLY_ONLY'>('ALL');
  const [minIvr, setMinIvr] = useState<number>(0);
  const [minYield, setMinYield] = useState<number>(0);
  const [maxDte, setMaxDte] = useState<number>(999);
  const [liquidityTier, setLiquidityTier] = useState<string>('ALL');
  const [hideEarningsRisk, setHideEarningsRisk] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleResetFilters = () => {
    setStrategy('ALL');
    setCadence('ALL');
    setMinIvr(0);
    setMinYield(0);
    setMaxDte(999);
    setLiquidityTier('ALL');
    setHideEarningsRisk(false);
  };

  // Filtered Opportunities based on query configuration
  const filteredOpps = useMemo(() => {
    return opportunities.filter((o) => {
      if (strategy !== 'ALL' && o.strategy !== strategy) return false;
      if ((o.iv_rank ?? 0) < minIvr) return false;
      if ((o.annualized_roc ?? 0) < minYield) return false;
      if (maxDte !== 999 && (o.dte ?? 0) > maxDte) return false;
      if (liquidityTier !== 'ALL' && !(o.liquidity_tier || '').includes(liquidityTier)) return false;
      if (hideEarningsRisk && o.earnings_within_7d) return false;

      if (cadence !== 'ALL') {
        const tMeta = tickers.find((t) => t.symbol === o.symbol);
        const isWeekly = tMeta ? tMeta.has_weeklys !== false : true;
        if (cadence === 'WEEKLY_ONLY' && !isWeekly) return false;
        if (cadence === 'MONTHLY_ONLY' && isWeekly) return false;
      }

      return true;
    });
  }, [opportunities, tickers, strategy, cadence, minIvr, minYield, maxDte, liquidityTier, hideEarningsRisk]);

  // Aggregate Metrics
  const totalCollateral = useMemo(() => {
    return filteredOpps.reduce((sum, o) => sum + (o.collateral_required || 0), 0);
  }, [filteredOpps]);

  const totalPremium = useMemo(() => {
    return filteredOpps.reduce((sum, o) => sum + (o.premium_total || 0), 0);
  }, [filteredOpps]);

  const avgAnnualizedYield = useMemo(() => {
    if (filteredOpps.length === 0) return 0;
    const sum = filteredOpps.reduce((acc, o) => acc + (o.annualized_roc || 0), 0);
    return Math.round((sum / filteredOpps.length) * 10) / 10;
  }, [filteredOpps]);

  // Export handlers
  const handleExportCSV = () => {
    exportOpportunitiesToCSV(filteredOpps, `deltaharvest_query_report_${Date.now()}.csv`);
  };

  const handleExportExcel = () => {
    const matchingSymbols = new Set(filteredOpps.map((o) => o.symbol));
    const matchingTickers = tickers.filter((t) => matchingSymbols.has(t.symbol));

    exportToExcel(
      {
        tickers: matchingTickers.length > 0 ? matchingTickers : tickers,
        opportunities: filteredOpps,
        summary,
      },
      `deltaharvest_executive_report_${Date.now()}.xlsx`
    );
  };

  const handleExportFullExcel = () => {
    exportToExcel(
      {
        tickers,
        opportunities,
        summary,
      },
      `deltaharvest_full_database_${Date.now()}.xlsx`
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div
        className="w-full max-w-5xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
              <Filter className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Executive Report Query Builder &amp; Export Suite</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                  CSV • Excel • PDF
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Filter customized options strategies and export institutional reports across multiple formats
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Query Controls Grid */}
        <div className="p-4 bg-slate-950/40 border-b border-slate-800 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
          {/* Strategy */}
          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Strategy
            </label>
            <select
              value={strategy}
              onChange={(e) => setStrategy(e.target.value as any)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">All Strategies (CSP + CC)</option>
              <option value="CSP">Cash-Secured Puts Only</option>
              <option value="CC">Covered Calls Only</option>
            </select>
          </div>

          {/* Expiration Cadence */}
          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Options Cadence
            </label>
            <select
              value={cadence}
              onChange={(e) => setCadence(e.target.value as any)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">All Expiration Cycles</option>
              <option value="WEEKLY_ONLY">Weekly Options Only</option>
              <option value="MONTHLY_ONLY">Monthly Only (Adjusted DTE)</option>
            </select>
          </div>

          {/* Minimum IV Rank */}
          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Min IV Rank: {minIvr}%
            </label>
            <select
              value={minIvr}
              onChange={(e) => setMinIvr(Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-indigo-500"
            >
              <option value={0}>Any IV Rank (0%+)</option>
              <option value={25}>IVR &ge; 25% (Moderate)</option>
              <option value={45}>IVR &ge; 45% (Elevated Edge)</option>
              <option value={60}>IVR &ge; 60% (High Premium)</option>
            </select>
          </div>

          {/* Min Annualized Yield */}
          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Min Ann. Yield %
            </label>
            <select
              value={minYield}
              onChange={(e) => setMinYield(Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-indigo-500"
            >
              <option value={0}>Any Yield (0%+)</option>
              <option value={15}>&ge; 15% Annualized</option>
              <option value={25}>&ge; 25% Annualized</option>
              <option value={35}>&ge; 35% Annualized</option>
              <option value={50}>&ge; 50% Annualized</option>
            </select>
          </div>

          {/* Liquidity Tier */}
          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Liquidity Tier
            </label>
            <select
              value={liquidityTier}
              onChange={(e) => setLiquidityTier(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">All Tiers</option>
              <option value="Tier 1">Tier 1 (Ultra-Liquid)</option>
              <option value="Tier 2/3">Tier 2/3 (Moderate)</option>
              <option value="Tier 4">Tier 4 (Small-Cap)</option>
            </select>
          </div>

          {/* Max DTE */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Max DTE: {maxDte === 999 ? 'All' : `${maxDte}d`}
              </label>
              <button
                onClick={handleResetFilters}
                className="text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold underline"
                title="Reset all query filters to defaults"
              >
                Reset
              </button>
            </div>
            <select
              value={maxDte}
              onChange={(e) => setMaxDte(Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-indigo-500"
            >
              <option value={999}>Any DTE (All Expirations)</option>
              <option value={7}>&le; 7 Days (Ultra-Short)</option>
              <option value={14}>&le; 14 Days (Bi-Weekly)</option>
              <option value={35}>&le; 35 Days (Weekly / Monthly)</option>
              <option value={60}>&le; 60 Days (Extended)</option>
            </select>
          </div>
        </div>

        {/* Aggregated KPI Ribbon */}
        <div className="p-3 bg-slate-950/60 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center space-x-6">
            <div>
              <span className="text-slate-500 text-[11px] block">Matching Trades</span>
              <span className="text-white font-mono font-bold text-sm">{filteredOpps.length}</span>
            </div>
            <div>
              <span className="text-slate-500 text-[11px] block">Total Capital Collateral</span>
              <span className="text-white font-mono font-bold text-sm">
                ${totalCollateral.toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-slate-500 text-[11px] block">Total Cash Premium</span>
              <span className="text-emerald-400 font-mono font-bold text-sm">
                +${totalPremium.toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-slate-500 text-[11px] block">Weighted Avg Ann. ROC</span>
              <span className="text-emerald-400 font-mono font-bold text-sm">
                {avgAnnualizedYield}%
              </span>
            </div>
          </div>

          {/* Export Buttons Suite */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handleExportCSV}
              disabled={filteredOpps.length === 0}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 border border-slate-700 font-semibold flex items-center space-x-1.5 transition-all text-xs"
              title="Download results as CSV"
            >
              <FileText className="w-4 h-4 text-slate-300" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={handleExportExcel}
              disabled={filteredOpps.length === 0}
              className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 disabled:opacity-40 text-white font-semibold flex items-center space-x-1.5 shadow-md shadow-emerald-700/30 transition-all text-xs"
              title="Download filtered query spreadsheet"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
              <span>Export Query (.xlsx)</span>
            </button>

            <button
              onClick={handleExportFullExcel}
              className="px-3 py-1.5 rounded-lg bg-indigo-700 hover:bg-indigo-600 text-white font-semibold flex items-center space-x-1.5 shadow-md shadow-indigo-700/30 transition-all text-xs"
              title="Download complete database with all 132 trades and 18 equities"
            >
              <FileSpreadsheet className="w-4 h-4 text-indigo-200" />
              <span>Full Database (.xlsx)</span>
            </button>

            <button
              onClick={triggerPrintReport}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center space-x-1.5 shadow-md shadow-indigo-600/30 transition-all text-xs"
              title="Print executive report or save as PDF"
            >
              <Printer className="w-4 h-4" />
              <span>Print / PDF</span>
            </button>
          </div>
        </div>

        {/* Opportunities Table Preview */}
        <div className="p-4 overflow-y-auto flex-1 text-xs">
          {filteredOpps.length === 0 ? (
            <div className="py-16 text-center text-slate-500">
              <p className="text-sm font-semibold text-slate-400">No opportunities match the query parameters</p>
              <p className="text-xs mt-1">Try lowering the minimum IV Rank or Annualized Yield threshold</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950 border-b border-slate-800 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    <th className="py-2.5 px-3">Strategy</th>
                    <th className="py-2.5 px-3">Ticker</th>
                    <th className="py-2.5 px-3">Strike ($)</th>
                    <th className="py-2.5 px-3">Spot ($)</th>
                    <th className="py-2.5 px-3">Buffer Cushion</th>
                    <th className="py-2.5 px-3">Exp (DTE)</th>
                    <th className="py-2.5 px-3">Premium ($)</th>
                    <th className="py-2.5 px-3">Delta</th>
                    <th className="py-2.5 px-3">POP %</th>
                    <th className="py-2.5 px-3">Ann. ROC %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {filteredOpps.map((o) => (
                    <tr key={o.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-2 px-3">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                            o.strategy === 'CSP'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : 'bg-cyan-500/20 text-cyan-300'
                          }`}
                        >
                          {o.strategy}
                        </span>
                      </td>
                      <td className="py-2 px-3 font-bold text-white">{o.symbol}</td>
                      <td className="py-2 px-3 font-bold text-white">${o.strike.toFixed(1)}</td>
                      <td className="py-2 px-3 text-slate-300">${o.current_price.toFixed(2)}</td>
                      <td className="py-2 px-3 text-emerald-400">+{o.cushion_pct.toFixed(1)}%</td>
                      <td className="py-2 px-3 text-slate-400">
                        {o.expiration} ({o.dte}d)
                      </td>
                      <td className="py-2 px-3 text-emerald-400">+${o.premium_total.toFixed(0)}</td>
                      <td className="py-2 px-3 text-slate-300">{Math.abs(o.delta).toFixed(3)}</td>
                      <td className="py-2 px-3 text-slate-300">{o.pop_pct}%</td>
                      <td className="py-2 px-3 font-bold text-emerald-400">{o.annualized_roc.toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div>Exported reports include full technical indicators, Greeks, and liquidity risk audits.</div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
