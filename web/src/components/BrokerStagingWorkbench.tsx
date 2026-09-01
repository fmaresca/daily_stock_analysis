import React, { useState } from 'react';
import { OptionOpportunity, MultiLegSpread } from '../types/options';
import {
  Zap,
  ShieldCheck,
  CheckCircle2,
  FileSpreadsheet,
  FileText,
  Printer,
  Layers,
  DollarSign,
  TrendingUp,
  Activity,
  Key,
  ExternalLink,
} from './icons';

interface BrokerStagingWorkbenchProps {
  opportunities: OptionOpportunity[];
  spreads: MultiLegSpread[];
  onStageOpportunity: (opp: OptionOpportunity) => void;
  onStageSpread: (spread: MultiLegSpread) => void;
  onOpenSchwabSettings: () => void;
}

export const BrokerStagingWorkbench: React.FC<BrokerStagingWorkbenchProps> = ({
  opportunities,
  spreads,
  onStageOpportunity,
  onStageSpread,
  onOpenSchwabSettings,
}) => {
  const [activeCategory, setActiveCategory] = useState<'ALL' | 'CSP' | 'SPREADS'>('ALL');

  // Top filtered candidates for execution
  const topCSPs = opportunities.filter((o) => o.strategy === 'CSP').slice(0, 10);
  const topSpreads = spreads.slice(0, 10);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800/80 bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-slate-950 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 shadow-lg shadow-amber-500/10">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold text-white tracking-wide">
                  Broker Order Staging &amp; 1-Click Execution Workbench
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                  Institutional Protocols
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                Bridge algorithmic screening directly to broker execution. Generates validated institutional bracket orders with automatic <strong>80% Profit-Taking GTC limits</strong> and <strong>0.50 Delta defensive stops</strong> for Charles Schwab, Interactive Brokers (IBKR), and Thinkorswim.
              </p>
            </div>
          </div>

          <button
            onClick={onOpenSchwabSettings}
            className="px-4 py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 hover:text-blue-300 border border-blue-500/40 text-xs font-bold flex items-center space-x-2 transition-all shadow-sm"
          >
            <Key className="w-4 h-4" />
            <span>Configure Schwab API Credentials</span>
          </button>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
            <div className="flex items-center space-x-2 text-blue-400 font-bold text-xs">
              <span className="w-2 h-2 rounded-full bg-blue-400" />
              <span>Charles Schwab Retail Trader API</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Native REST order payloads using official <code className="text-slate-300">orderLegCollection</code> and <code className="text-slate-300">TRIGGER</code> bracket child orders with 1-click direct API dispatch.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
            <div className="flex items-center space-x-2 text-rose-400 font-bold text-xs">
              <span className="w-2 h-2 rounded-full bg-rose-400" />
              <span>Interactive Brokers (IBKR TWS)</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Drag-and-drop batch <code className="text-slate-300">.csv</code> files for IBKR Trader Workstation BasketTrader + JSON payloads for IBKR Client Portal Web API.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
            <div className="flex items-center space-x-2 text-emerald-400 font-bold text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Thinkorswim (ToS) Syntax</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Standard 1-line copyable execution text formatted for Thinkorswim order entry with pre-calculated bracket profit targets.
            </p>
          </div>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center justify-between">
        <div className="inline-flex p-1 bg-slate-900 rounded-xl border border-slate-800 text-xs font-semibold">
          <button
            onClick={() => setActiveCategory('ALL')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeCategory === 'ALL'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All Candidates ({topCSPs.length + topSpreads.length})
          </button>
          <button
            onClick={() => setActiveCategory('CSP')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeCategory === 'CSP'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Cash-Secured Puts (0.15–0.20Δ)
          </button>
          <button
            onClick={() => setActiveCategory('SPREADS')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeCategory === 'SPREADS'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Defined-Risk Spreads &amp; Iron Condors
          </button>
        </div>

        <span className="text-xs text-slate-400 font-mono">
          Showing vetted liquid candidates
        </span>
      </div>

      {/* Section 1: Single-Leg 0.15 - 0.20 Delta Cash-Secured Puts */}
      {(activeCategory === 'ALL' || activeCategory === 'CSP') && (
        <div className="glass-panel rounded-xl border border-slate-800 overflow-hidden space-y-0">
          <div className="px-5 py-3 bg-slate-900/70 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <h2 className="text-sm font-bold text-white tracking-wide">
                Cash-Secured Puts Ready for Order Staging (0.15–0.20Δ Sweet Spot)
              </h2>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              Auto 80% Take-Profit GTC + 0.50Δ Roll Stop
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/80 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-2.5 px-4">Symbol</th>
                  <th className="py-2.5 px-3">Spot Price</th>
                  <th className="py-2.5 px-3">Strike &amp; Delta</th>
                  <th className="py-2.5 px-3">Expiration &amp; DTE</th>
                  <th className="py-2.5 px-3 text-right">Limit Price (Mid)</th>
                  <th className="py-2.5 px-3 text-right">80% Take-Profit</th>
                  <th className="py-2.5 px-3 text-right">Ann. ROC</th>
                  <th className="py-2.5 px-3 text-center">Safety</th>
                  <th className="py-2.5 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                {topCSPs.map((opp) => {
                  const limitMid = opp.mid;
                  const takeProfitPrice = Math.max(0.01, Math.round(limitMid * 0.20 * 100) / 100);

                  return (
                    <tr key={opp.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-3 px-4 font-sans font-bold text-white flex items-center space-x-2">
                        <span className="text-emerald-400">{opp.symbol}</span>
                        {opp.dte <= 8 && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-400">
                            W
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-slate-300">
                        ${opp.current_price.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-slate-200">
                        ${opp.strike} <span className="text-emerald-400">({opp.delta.toFixed(2)}Δ)</span>
                      </td>
                      <td className="py-3 px-3 text-slate-300">
                        {opp.expiration} ({opp.dte}d)
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-emerald-400">
                        ${limitMid.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-amber-400">
                        ${takeProfitPrice.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-emerald-400">
                        {opp.annualized_roc.toFixed(1)}%
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          {opp.liquidity_tier || 'Tier 1'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => onStageOpportunity(opp)}
                          className="px-3 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 hover:text-amber-200 border border-amber-500/40 font-semibold flex items-center space-x-1 mx-auto transition-all shadow-sm"
                        >
                          <Zap className="w-3 h-3 text-amber-400" />
                          <span>Stage Order</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Section 2: Defined-Risk Spreads & Iron Condors */}
      {(activeCategory === 'ALL' || activeCategory === 'SPREADS') && (
        <div className="glass-panel rounded-xl border border-slate-800 overflow-hidden space-y-0">
          <div className="px-5 py-3 bg-slate-900/70 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
              <h2 className="text-sm font-bold text-white tracking-wide">
                Defined-Risk Spreads Ready for Order Staging (Bull Put, Bear Call, Iron Condor)
              </h2>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              Auto Net-Credit Execution + 80% Bracket
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/80 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-2.5 px-4">Symbol</th>
                  <th className="py-2.5 px-3">Strategy</th>
                  <th className="py-2.5 px-3">Short Leg (0.15–0.20Δ)</th>
                  <th className="py-2.5 px-3">Long Protection</th>
                  <th className="py-2.5 px-3 text-right">Net Credit</th>
                  <th className="py-2.5 px-3 text-right">Max Risk</th>
                  <th className="py-2.5 px-3 text-right">Ann. ROC</th>
                  <th className="py-2.5 px-3 text-right">POP %</th>
                  <th className="py-2.5 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                {topSpreads.map((spread) => {
                  return (
                    <tr key={spread.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-3 px-4 font-sans font-bold text-white">
                        {spread.symbol}
                      </td>
                      <td className="py-3 px-3 font-sans">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30">
                          {spread.strategy_name}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-200">
                        ${spread.short_strike} ({spread.short_delta.toFixed(2)}Δ)
                      </td>
                      <td className="py-3 px-3 text-slate-400">
                        ${spread.long_strike}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-emerald-400">
                        ${spread.net_credit.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-rose-400">
                        ${spread.max_loss.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-emerald-400">
                        {spread.annualized_roc.toFixed(1)}%
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-slate-300">
                        {spread.pop_pct.toFixed(1)}%
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => onStageSpread(spread)}
                          className="px-3 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 hover:text-amber-200 border border-amber-500/40 font-semibold flex items-center space-x-1 mx-auto transition-all shadow-sm"
                        >
                          <Zap className="w-3 h-3 text-amber-400" />
                          <span>Stage Spread</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
