import React, { useState } from 'react';
import { VolatilitySkewData } from '../types/options';
import { exportCustomDataToExcel } from '../utils/exportImport';
import {
  Flame,
  Activity,
  AlertTriangle,
  ShieldCheck,
  TrendingUp,
  FileSpreadsheet,
  FileText,
  Printer,
} from './icons';

interface VolatilitySkewRadarProps {
  skewData: VolatilitySkewData[];
}

export const VolatilitySkewRadar: React.FC<VolatilitySkewRadarProps> = ({ skewData }) => {
  const [selectedSymbol, setSelectedSymbol] = useState<string>(skewData[0]?.symbol || 'SPY');

  const activeSkew = skewData.find((s) => s.symbol === selectedSymbol) || skewData[0];

  const exportSkewToCSV = () => {
    const headers = [
      'Symbol',
      'Spot Price',
      '25Δ Put IV %',
      '25Δ Call IV %',
      'Skew Spread (Put-Call) %',
      'Sentiment Bias',
      'Term Inverted (Backwardation)',
      '7D IV %',
      '30D IV %',
      '60D IV %',
      '90D IV %',
    ];
    const rows = skewData.map((s) => [
      s.symbol,
      s.spot_price,
      s.put_iv_25d,
      s.call_iv_25d,
      s.iv_skew_spread,
      s.skew_sentiment,
      s.term_structure.some((t) => t.isInverted) ? 'YES' : 'NO',
      s.term_structure[0]?.iv ?? 'N/A',
      s.term_structure[1]?.iv ?? 'N/A',
      s.term_structure[2]?.iv ?? 'N/A',
      s.term_structure[3]?.iv ?? 'N/A',
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `volatility_skew_radar_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportSkewToExcel = () => {
    const sheetData = skewData.map((s) => ({
      Symbol: s.symbol,
      'Spot Price': s.spot_price,
      '25Δ Put IV %': s.put_iv_25d,
      '25Δ Call IV %': s.call_iv_25d,
      'Skew Spread %': s.iv_skew_spread,
      'Sentiment Bias': s.skew_sentiment,
      'Term Inversion': s.term_structure.some((t) => t.isInverted) ? 'YES' : 'NO',
      '7D Weekly IV': s.term_structure[0]?.iv ?? 'N/A',
      '30D IV': s.term_structure[1]?.iv ?? 'N/A',
      '60D IV': s.term_structure[2]?.iv ?? 'N/A',
      '90D IV': s.term_structure[3]?.iv ?? 'N/A',
    }));
    exportCustomDataToExcel(
      [{ name: '25-Delta Volatility Skew', data: sheetData }],
      `volatility_skew_radar_${new Date().toISOString().slice(0, 10)}.xls`
    );
  };

  return (
    <div className="space-y-4">
      {/* Top Banner & Explanation */}
      <div className="glass-panel p-4 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            <span>25-Delta Volatility Skew &amp; Term Structure Radar</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Compare downside 25Δ Put IV against upside 25Δ Call IV to identify asymmetric fear pricing and term structure inversions.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={exportSkewToExcel}
            className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-emerald-400 hover:text-emerald-300 border border-slate-800 text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-sm"
            title="Export Skew to Excel"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Excel</span>
          </button>
          <button
            onClick={exportSkewToCSV}
            className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-sm"
            title="Export Skew to CSV"
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

      {/* Ticker Selector Strip */}
      <div className="glass-panel p-2.5 rounded-xl border border-slate-800 flex items-center space-x-2 overflow-x-auto">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider pl-2 pr-1 shrink-0">
          Select Asset:
        </span>
        {skewData.map((s) => (
          <button
            key={s.symbol}
            onClick={() => setSelectedSymbol(s.symbol)}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all shrink-0 flex items-center space-x-1.5 ${
              selectedSymbol === s.symbol
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 border border-blue-400'
                : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <span>{s.symbol}</span>
            <span
              className={`text-[10px] font-sans px-1.5 py-0.2 rounded ${
                s.iv_skew_spread >= 4
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              +{s.iv_skew_spread.toFixed(1)}%
            </span>
          </button>
        ))}
      </div>

      {/* Detailed Analysis Cards for Active Asset */}
      {activeSkew && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: 25-Delta Put vs Call Skew */}
          <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-3 md:col-span-1">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="font-bold text-white text-xs uppercase tracking-wider">
                {activeSkew.symbol} 25-Delta Skew
              </div>
              <span className="text-xs font-mono text-emerald-400">
                ${activeSkew.spot_price.toFixed(2)}
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center p-2.5 rounded-lg bg-slate-950/70 border border-slate-800">
                <span className="text-slate-400">25Δ Put IV (Downside Fear):</span>
                <span className="font-mono font-bold text-emerald-400 text-sm">
                  {activeSkew.put_iv_25d.toFixed(1)}%
                </span>
              </div>

              <div className="flex justify-between items-center p-2.5 rounded-lg bg-slate-950/70 border border-slate-800">
                <span className="text-slate-400">25Δ Call IV (Upside Greedy):</span>
                <span className="font-mono font-bold text-cyan-400 text-sm">
                  {activeSkew.call_iv_25d.toFixed(1)}%
                </span>
              </div>

              <div className="flex justify-between items-center p-2.5 rounded-lg bg-slate-950/70 border border-emerald-500/30">
                <span className="text-slate-300 font-medium">Skew Spread (Put - Call):</span>
                <span className="font-mono font-black text-emerald-400 text-base">
                  +{activeSkew.iv_skew_spread.toFixed(1)}%
                </span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
              <div className="text-[11px] font-bold text-white">Skew Sentiment:</div>
              <div className="text-xs font-semibold text-emerald-400">{activeSkew.skew_sentiment}</div>
              <p className="text-[11px] text-slate-400 leading-relaxed mt-1">
                Put options trade at a rich volatility markup. Writing Cash-Secured Puts or Bull Put Spreads captures this institutional downside insurance premium.
              </p>
            </div>
          </div>

          {/* Card 2: Volatility Term Structure */}
          <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-3 md:col-span-2">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="font-bold text-white text-xs uppercase tracking-wider">
                Implied Volatility Term Structure (7D to 90D)
              </div>
              <span className="text-xs text-slate-400">Contango vs Backwardation</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {activeSkew.term_structure.map((item) => (
                <div
                  key={item.label}
                  className={`p-3 rounded-xl border text-center space-y-1.5 ${
                    item.isInverted
                      ? 'bg-rose-950/30 border-rose-500/40 text-rose-300'
                      : 'bg-slate-950/70 border-slate-800 text-slate-200'
                  }`}
                >
                  <div className="text-xs font-bold text-slate-300">{item.label}</div>
                  <div className="text-xl font-mono font-black text-white">{item.iv.toFixed(1)}%</div>
                  <div className="text-[10px] font-mono text-slate-400">{item.dte} DTE</div>
                  {item.isInverted && (
                    <span className="inline-block text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse">
                      Inverted (Backwardation)
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Term Structure Visual Bars */}
            <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-2">
              <div className="text-xs font-bold text-slate-300">Relative IV Curve:</div>
              <div className="space-y-2">
                {activeSkew.term_structure.map((item) => {
                  const maxIv = Math.max(...activeSkew.term_structure.map((x) => x.iv), 50);
                  const barWidthPct = Math.round((item.iv / maxIv) * 100);
                  return (
                    <div key={item.label} className="flex items-center space-x-3 text-xs">
                      <span className="w-20 text-slate-400 text-[11px] shrink-0">{item.label}</span>
                      <div className="flex-1 bg-slate-900 rounded-full h-3 overflow-hidden border border-slate-800">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            item.isInverted
                              ? 'bg-gradient-to-r from-rose-500 to-amber-500'
                              : 'bg-gradient-to-r from-emerald-500 to-cyan-500'
                          }`}
                          style={{ width: `${barWidthPct}%` }}
                        />
                      </div>
                      <span className="w-14 text-right font-mono font-bold text-white text-xs">
                        {item.iv.toFixed(1)}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
