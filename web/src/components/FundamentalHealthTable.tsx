import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { FundamentalHealthData } from '../types/options';
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  ExternalLink,
  Activity,
  TrendingUp,
  FileSpreadsheet,
  FileText,
  Printer,
} from './icons';

interface FundamentalHealthTableProps {
  data: FundamentalHealthData[];
  onSelectTicker?: (symbol: string) => void;
}

export const FundamentalHealthTable: React.FC<FundamentalHealthTableProps> = ({ data, onSelectTicker }) => {
  const [filterZone, setFilterZone] = useState<'ALL' | 'SAFE' | 'GREY' | 'DISTRESS'>('ALL');
  const [sortBy, setSortBy] = useState<keyof FundamentalHealthData>('altman_z_score');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const filteredData = data
    .filter((d) => (filterZone === 'ALL' ? true : d.altman_zone === filterZone))
    .sort((a, b) => {
      const valA = a[sortBy] ?? 0;
      const valB = b[sortBy] ?? 0;
      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortOrder === 'asc' ? valA - valB : valB - valA;
      }
      return sortOrder === 'asc'
        ? String(valA).localeCompare(String(valB))
        : String(valB).localeCompare(String(valA));
    });

  const handleSort = (col: keyof FundamentalHealthData) => {
    if (sortBy === col) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(col);
      setSortOrder('desc');
    }
  };

  const exportToCSV = () => {
    const headers = [
      'Symbol',
      'Name',
      'Sector',
      'Spot Price',
      'Market Cap',
      'Altman Z-Score',
      'Solvency Zone',
      'Piotroski F-Score',
      'Trailing PE',
      'Forward PE',
      'YoY Rev Growth %',
      'Free Cash Flow',
      'Current Ratio',
      'Institutional 13F %',
      'Latest 10-K',
      'Latest 10-Q',
    ];
    const rows = filteredData.map((d) => [
      d.symbol,
      `"${d.name}"`,
      d.sector,
      d.spot_price,
      d.market_cap,
      d.altman_z_score,
      d.altman_zone,
      d.piotroski_f_score,
      d.pe_ratio ?? 'N/A',
      d.forward_pe ?? 'N/A',
      d.revenue_growth_yoy,
      d.free_cash_flow,
      d.current_ratio,
      d.institutional_ownership_pct,
      d.latest_10k_date,
      d.latest_10q_date,
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `fundamental_solvency_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToExcel = () => {
    const sheetData = filteredData.map((d) => ({
      Symbol: d.symbol,
      Name: d.name,
      Sector: d.sector,
      'Spot Price': d.spot_price,
      'Market Cap': d.market_cap,
      'Altman Z-Score': d.altman_z_score,
      'Solvency Zone': d.altman_zone,
      'Piotroski F-Score': d.piotroski_f_score,
      'Trailing P/E': d.pe_ratio ?? 'N/A',
      'Forward P/E': d.forward_pe ?? 'N/A',
      'YoY Rev Growth %': d.revenue_growth_yoy,
      'Free Cash Flow': d.free_cash_flow,
      'Current Ratio': d.current_ratio,
      '13F Ownership %': d.institutional_ownership_pct,
      'Latest 10-K': d.latest_10k_date,
      'Latest 10-Q': d.latest_10q_date,
    }));
    const ws = XLSX.utils.json_to_sheet(sheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Fundamental Solvency');
    XLSX.writeFile(wb, `fundamental_solvency_report_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="space-y-4">
      {/* Solvency Filter Toolbar */}
      <div className="glass-panel p-3 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider hidden sm:inline">
            Altman Z-Score Solvency Filter:
          </span>
          <div className="inline-flex p-1 bg-slate-900 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setFilterZone('ALL')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
                filterZone === 'ALL'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All Assets ({data.length})
            </button>
            <button
              onClick={() => setFilterZone('SAFE')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-all flex items-center space-x-1.5 ${
                filterZone === 'SAFE'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-emerald-400'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Safe Zone (Z &gt; 2.99)</span>
            </button>
            <button
              onClick={() => setFilterZone('GREY')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-all flex items-center space-x-1.5 ${
                filterZone === 'GREY'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                  : 'text-slate-400 hover:text-amber-400'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>Grey Zone (1.81–2.99)</span>
            </button>
            <button
              onClick={() => setFilterZone('DISTRESS')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-all flex items-center space-x-1.5 ${
                filterZone === 'DISTRESS'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                  : 'text-slate-400 hover:text-rose-400'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-rose-400" />
              <span>Distress Alert (Z &lt; 1.81)</span>
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={exportToExcel}
            className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-emerald-400 hover:text-emerald-300 border border-slate-800 text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-sm"
            title="Export Solvency Data to Excel"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Excel (.xlsx)</span>
          </button>
          <button
            onClick={exportToCSV}
            className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-sm"
            title="Export Solvency Data to CSV"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>CSV</span>
          </button>
          <button
            onClick={() => window.print()}
            className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-blue-400 hover:text-blue-300 border border-slate-800 text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-sm"
            title="Print or Save PDF"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print PDF</span>
          </button>
        </div>
      </div>

      {/* Fundamental & Solvency Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto max-h-[72vh] overflow-y-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="sticky top-0 z-20 bg-slate-950 border-b border-slate-800 shadow-md">
              <tr className="border-b border-slate-800 bg-slate-950 text-[11px] font-bold text-slate-400 uppercase tracking-wider select-none">
                <th onClick={() => handleSort('symbol')} className="sticky top-0 bg-slate-950/95 backdrop-blur-md py-3.5 px-3.5 cursor-pointer hover:text-white z-20">
                  Symbol
                </th>
                <th onClick={() => handleSort('altman_z_score')} className="sticky top-0 bg-slate-950/95 backdrop-blur-md py-3.5 px-3 cursor-pointer hover:text-white text-center z-20">
                  Altman Z-Score
                </th>
                <th onClick={() => handleSort('piotroski_f_score')} className="sticky top-0 bg-slate-950/95 backdrop-blur-md py-3.5 px-3 cursor-pointer hover:text-white text-center z-20">
                  Piotroski F
                </th>
                <th onClick={() => handleSort('pe_ratio')} className="sticky top-0 bg-slate-950/95 backdrop-blur-md py-3.5 px-3 cursor-pointer hover:text-white text-right z-20">
                  Trailing P/E
                </th>
                <th onClick={() => handleSort('forward_pe')} className="sticky top-0 bg-slate-950/95 backdrop-blur-md py-3.5 px-3 cursor-pointer hover:text-white text-right z-20">
                  Forward P/E
                </th>
                <th onClick={() => handleSort('revenue_growth_yoy')} className="sticky top-0 bg-slate-950/95 backdrop-blur-md py-3.5 px-3 cursor-pointer hover:text-white text-right z-20">
                  Rev. Growth
                </th>
                <th onClick={() => handleSort('free_cash_flow')} className="sticky top-0 bg-slate-950/95 backdrop-blur-md py-3.5 px-3 cursor-pointer hover:text-white text-right z-20">
                  FCF
                </th>
                <th onClick={() => handleSort('current_ratio')} className="sticky top-0 bg-slate-950/95 backdrop-blur-md py-3.5 px-3 cursor-pointer hover:text-white text-right z-20">
                  Current Ratio
                </th>
                <th onClick={() => handleSort('institutional_ownership_pct')} className="sticky top-0 bg-slate-950/95 backdrop-blur-md py-3.5 px-3 cursor-pointer hover:text-white text-right z-20">
                  Inst. 13F %
                </th>
                <th className="sticky top-0 bg-slate-950/95 backdrop-blur-md py-3.5 px-3 text-center z-20">Latest 10-K / 10-Q</th>
                <th className="sticky top-0 bg-slate-950/95 backdrop-blur-md py-3.5 px-3 text-center z-20">SEC EDGAR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filteredData.map((item) => {
                const isSafe = item.altman_zone === 'SAFE';
                const isGrey = item.altman_zone === 'GREY';
                const isDistress = item.altman_zone === 'DISTRESS';

                return (
                  <tr key={item.symbol} className="hover:bg-slate-800/40 transition-colors">
                    {/* Symbol */}
                    <td className="py-3 px-3.5">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => onSelectTicker && onSelectTicker(item.symbol)}
                          className="font-bold text-white text-xs hover:text-emerald-400 hover:underline flex items-center gap-1 group text-left"
                          title={`Click to open full AI audit for ${item.symbol}`}
                        >
                          <span>{item.symbol}</span>
                          <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-emerald-400 transition-colors" />
                        </button>
                        <span className="text-[10px] text-slate-400 font-sans">
                          ${item.spot_price.toFixed(2)}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 truncate max-w-[130px] font-sans">
                        {item.name}
                      </div>
                    </td>

                    {/* Altman Z-Score */}
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-xs font-black ${
                          isSafe
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : isGrey
                            ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        }`}
                      >
                        {item.altman_z_score.toFixed(2)}
                      </span>
                      <span className="text-[9px] text-slate-500 block font-sans uppercase">
                        {item.altman_zone}
                      </span>
                    </td>

                    {/* Piotroski F-Score */}
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-block w-6 h-6 leading-6 rounded-full font-black text-xs ${
                          item.piotroski_f_score >= 7
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                            : item.piotroski_f_score >= 4
                            ? 'bg-slate-800 text-slate-300 border border-slate-700'
                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                        }`}
                      >
                        {item.piotroski_f_score}
                      </span>
                    </td>

                    {/* Trailing P/E */}
                    <td className="py-3 px-3 text-right">
                      {item.pe_ratio !== null ? (
                        <span className="text-slate-200 font-bold">{item.pe_ratio}x</span>
                      ) : (
                        <span className="text-slate-500 text-[10px]">ETF / N/A</span>
                      )}
                    </td>

                    {/* Forward P/E */}
                    <td className="py-3 px-3 text-right">
                      {item.forward_pe !== null ? (
                        <span className="text-cyan-400 font-bold">{item.forward_pe}x</span>
                      ) : (
                        <span className="text-slate-500 text-[10px]">N/A</span>
                      )}
                    </td>

                    {/* Rev Growth */}
                    <td className="py-3 px-3 text-right">
                      {item.revenue_growth_yoy > 0 ? (
                        <span className="text-emerald-400 font-bold">+{item.revenue_growth_yoy}%</span>
                      ) : (
                        <span className="text-slate-500 text-[10px]">Fund</span>
                      )}
                    </td>

                    {/* Free Cash Flow */}
                    <td className="py-3 px-3 text-right font-bold text-slate-300">
                      {item.free_cash_flow}
                    </td>

                    {/* Current Ratio */}
                    <td className="py-3 px-3 text-right">
                      <span className={item.current_ratio >= 1.5 ? 'text-emerald-400' : 'text-slate-300'}>
                        {item.current_ratio.toFixed(2)}
                      </span>
                    </td>

                    {/* Institutional 13F Ownership */}
                    <td className="py-3 px-3 text-right font-bold text-indigo-400">
                      {item.institutional_ownership_pct.toFixed(1)}%
                    </td>

                    {/* Latest SEC Filing Dates */}
                    <td className="py-3 px-3 text-center text-[10px] text-slate-400">
                      <div>10-K: {item.latest_10k_date}</div>
                      <div>10-Q: {item.latest_10q_date}</div>
                    </td>

                    {/* SEC EDGAR Link */}
                    <td className="py-3 px-3 text-center">
                      <a
                        href={item.sec_edgar_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center space-x-1 px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-blue-400 hover:text-blue-300 border border-slate-800 text-[11px] transition-colors"
                      >
                        <span>EDGAR</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
