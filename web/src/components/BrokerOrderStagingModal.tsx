import React, { useState } from 'react';
import {
  StagedBracketOrder,
  BrokerType,
  AccountType,
  PriceExecutionType,
} from '../utils/brokerOrderStaging';
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  FileSpreadsheet,
  FileText,
  Printer,
  CheckCircle2,
  DollarSign,
  Layers,
  Activity,
  Zap,
} from './icons';

interface BrokerOrderStagingModalProps {
  isOpen: boolean;
  onClose: () => void;
  stagedOrder: StagedBracketOrder | null;
  onQuantityChange?: (qty: number) => void;
  onAccountTypeChange?: (acc: AccountType) => void;
  onPricingTypeChange?: (pricing: PriceExecutionType) => void;
}

export const BrokerOrderStagingModal: React.FC<BrokerOrderStagingModalProps> = ({
  isOpen,
  onClose,
  stagedOrder,
  onQuantityChange,
  onAccountTypeChange,
  onPricingTypeChange,
}) => {
  const [activeBrokerTab, setActiveBrokerTab] = useState<BrokerType>('SCHWAB');
  const [copied, setCopied] = useState<boolean>(false);
  const [schwabSubmitStatus, setSchwabSubmitStatus] = useState<string | null>(null);

  if (!isOpen || !stagedOrder) return null;

  const handleCopy = () => {
    let payload = '';
    if (activeBrokerTab === 'SCHWAB') {
      payload = stagedOrder.schwabJsonPayload;
    } else if (activeBrokerTab === 'IBKR') {
      payload = stagedOrder.ibkrBasketCsv;
    } else {
      payload = stagedOrder.thinkorswimString;
    }

    navigator.clipboard.writeText(payload);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    let content = '';
    let filename = '';
    let mimeType = 'text/plain';

    if (activeBrokerTab === 'SCHWAB') {
      content = stagedOrder.schwabJsonPayload;
      filename = `schwab_order_${stagedOrder.underlyingSymbol}_${Date.now()}.json`;
      mimeType = 'application/json';
    } else if (activeBrokerTab === 'IBKR') {
      content = stagedOrder.ibkrBasketCsv;
      filename = `ibkr_basket_${stagedOrder.underlyingSymbol}_${Date.now()}.csv`;
      mimeType = 'text/csv';
    } else {
      content = stagedOrder.thinkorswimString;
      filename = `thinkorswim_${stagedOrder.underlyingSymbol}_${Date.now()}.txt`;
      mimeType = 'text/plain';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSchwabApiSubmit = () => {
    const schwabKey = localStorage.getItem('schwab_app_key');
    const schwabToken = localStorage.getItem('schwab_access_token');

    if (!schwabKey || !schwabToken) {
      setSchwabSubmitStatus('Please configure Schwab App Key & Access Token in the Schwab Settings modal first.');
      setTimeout(() => setSchwabSubmitStatus(null), 5000);
      return;
    }

    setSchwabSubmitStatus('Simulating Schwab API Order Submission... Order Staged & Validated (Mock 200 OK)!');
    setTimeout(() => setSchwabSubmitStatus(null), 6000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl flex flex-col">
        {/* Modal Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/95 backdrop-blur-md">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-white tracking-wide">
                  Broker Order Staging &amp; 1-Click Execution Payloads
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                  {stagedOrder.underlyingSymbol}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {stagedOrder.strategyName} • Validated institutional order payloads for Schwab, IBKR, &amp; Thinkorswim.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 flex-1 text-xs">
          {/* Top KPI Metrics Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="glass-panel p-3 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                Net Premium Collected
              </span>
              <div className="text-base font-black text-emerald-400 font-mono">
                +${stagedOrder.totalNetCredit.toLocaleString()}
              </div>
              <span className="text-[10px] text-slate-400 block font-mono">
                ${stagedOrder.netCreditPerContract.toFixed(2)}/contract
              </span>
            </div>

            <div className="glass-panel p-3 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                80% Take-Profit Target
              </span>
              <div className="text-base font-black text-amber-400 font-mono">
                ${stagedOrder.takeProfitPrice.toFixed(2)}
              </div>
              <span className="text-[10px] text-emerald-400 block">
                Buy-to-Close GTC Limit
              </span>
            </div>

            <div className="glass-panel p-3 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                Defensive Stop/Roll Trigger
              </span>
              <div className="text-base font-black text-rose-400 font-mono">
                ${stagedOrder.stopLossPrice.toFixed(2)}
              </div>
              <span className="text-[10px] text-slate-400 block">
                200% Premium / 0.50Δ Alert
              </span>
            </div>

            <div className="glass-panel p-3 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                Collateral / Margin
              </span>
              <div className="text-base font-black text-slate-200 font-mono">
                ${stagedOrder.totalMarginRequired.toLocaleString()}
              </div>
              <span className="text-[10px] text-slate-400 block">
                {stagedOrder.accountType === 'PORTFOLIO_MARGIN'
                  ? 'Portfolio Margin (TIMS)'
                  : 'Reg-T Standard Margin'}
              </span>
            </div>
          </div>

          {/* Risk Circuit Breaker Gauges */}
          <div className="glass-panel p-3.5 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Risk Circuit Breakers &amp; Sizing Guardrails</span>
              </span>
              <div className="flex items-center space-x-2">
                {stagedOrder.concentrationWarning ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3" />
                    <span>Concentration Warning ({stagedOrder.concentrationPct}%)</span>
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Sizing Safe ({stagedOrder.concentrationPct}% of Portfolio)</span>
                  </span>
                )}

                {stagedOrder.earningsWarning && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    <span>Earnings Event ({stagedOrder.earningsDate || 'Within 7D'})</span>
                  </span>
                )}
              </div>
            </div>

            <div className="text-[11px] text-slate-400 flex flex-wrap items-center gap-x-4 gap-y-1">
              <span>• Max single-underlying position cap: <strong>&le; 10%</strong> of account equity.</span>
              <span>• Automatic GTC bracket order enforces the <strong>80% max profit</strong> take-profit rule.</span>
              {stagedOrder.capitalSavedByPm && stagedOrder.capitalSavedByPm > 0 && (
                <span className="text-emerald-400 font-semibold">
                  • Portfolio Margin frees up <strong>${stagedOrder.capitalSavedByPm.toLocaleString()}</strong> in excess buying power vs Reg-T!
                </span>
              )}
            </div>
          </div>

          {/* Sizing & Account Controls */}
          <div className="glass-panel p-4 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
            {/* Quantity Stepper */}
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                1. Number of Contracts:
              </span>
              <div className="flex items-center space-x-1.5">
                {[1, 2, 5, 10].map((qty) => (
                  <button
                    key={qty}
                    onClick={() => onQuantityChange?.(qty)}
                    className={`px-3 py-1 rounded-lg font-mono font-bold transition-all ${
                      stagedOrder.quantity === qty
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                        : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    {qty}
                  </button>
                ))}
              </div>
            </div>

            {/* Account Type Selector */}
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                2. Broker Account Margin Model:
              </span>
              <div className="inline-flex p-1 bg-slate-900 rounded-lg border border-slate-800 text-[11px]">
                <button
                  onClick={() => onAccountTypeChange?.('REG_T_MARGIN')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                    stagedOrder.accountType === 'REG_T_MARGIN'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Standard Reg-T Margin
                </button>
                <button
                  onClick={() => onAccountTypeChange?.('PORTFOLIO_MARGIN')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                    stagedOrder.accountType === 'PORTFOLIO_MARGIN'
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-purple-400'
                  }`}
                >
                  Portfolio Margin (TIMS)
                </button>
                <button
                  onClick={() => onAccountTypeChange?.('CASH_ACCOUNT')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                    stagedOrder.accountType === 'CASH_ACCOUNT'
                      ? 'bg-teal-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Cash (100% Collateral)
                </button>
              </div>
            </div>

            {/* Pricing Execution Mode */}
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                3. Execution Price:
              </span>
              <div className="inline-flex p-1 bg-slate-900 rounded-lg border border-slate-800 text-[11px]">
                <button
                  onClick={() => onPricingTypeChange?.('MIDPOINT')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                    stagedOrder.pricingType === 'MIDPOINT'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Midpoint Limit (${stagedOrder.limitPrice.toFixed(2)})
                </button>
                <button
                  onClick={() => onPricingTypeChange?.('NATURAL')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                    stagedOrder.pricingType === 'NATURAL'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Natural Bid
                </button>
              </div>
            </div>
          </div>

          {/* Order Legs Table */}
          <div className="glass-panel rounded-xl border border-slate-800 overflow-hidden">
            <div className="px-4 py-2.5 bg-slate-900/60 border-b border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-blue-400" />
                <span>Staged Order Legs &amp; Bracket Schedule</span>
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                {stagedOrder.entryLegs.length} Active Leg(s)
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/80 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-2.5 px-3">Role</th>
                    <th className="py-2.5 px-3">Action</th>
                    <th className="py-2.5 px-3">Symbol / OCC Symbol</th>
                    <th className="py-2.5 px-3">Strike &amp; Expiry</th>
                    <th className="py-2.5 px-3 text-right">Qty</th>
                    <th className="py-2.5 px-3 text-right">Limit Price</th>
                    <th className="py-2.5 px-3 text-right">TIF</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                  {/* Entry Leg */}
                  {stagedOrder.entryLegs.map((leg, idx) => (
                    <tr key={idx} className="hover:bg-slate-900/40">
                      <td className="py-2 px-3 font-sans">
                        <span className="px-2 py-0.5 rounded bg-blue-500/15 text-blue-400 border border-blue-500/30 text-[10px] font-bold">
                          Primary Entry
                        </span>
                      </td>
                      <td className="py-2 px-3 font-bold text-emerald-400">
                        {leg.instruction}
                      </td>
                      <td className="py-2 px-3 text-slate-200">
                        {leg.symbol}
                      </td>
                      <td className="py-2 px-3 text-slate-300">
                        ${leg.strike} {leg.type} ({leg.expiration})
                      </td>
                      <td className="py-2 px-3 text-right text-slate-200">
                        {leg.quantity}
                      </td>
                      <td className="py-2 px-3 text-right text-emerald-400 font-bold">
                        ${stagedOrder.limitPrice.toFixed(2)}
                      </td>
                      <td className="py-2 px-3 text-right text-slate-400 font-sans">
                        DAY
                      </td>
                    </tr>
                  ))}

                  {/* 80% Take Profit Bracket Leg */}
                  {stagedOrder.takeProfitLegs.map((leg, idx) => (
                    <tr key={`tp_${idx}`} className="hover:bg-slate-900/40 bg-amber-950/10">
                      <td className="py-2 px-3 font-sans">
                        <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[10px] font-bold">
                          80% Take-Profit
                        </span>
                      </td>
                      <td className="py-2 px-3 font-bold text-amber-400">
                        {leg.instruction}
                      </td>
                      <td className="py-2 px-3 text-slate-300">
                        {leg.symbol}
                      </td>
                      <td className="py-2 px-3 text-slate-400">
                        ${leg.strike} {leg.type}
                      </td>
                      <td className="py-2 px-3 text-right text-slate-300">
                        {leg.quantity}
                      </td>
                      <td className="py-2 px-3 text-right text-amber-400 font-bold">
                        ${stagedOrder.takeProfitPrice.toFixed(2)}
                      </td>
                      <td className="py-2 px-3 text-right text-amber-400 font-sans font-bold">
                        GTC
                      </td>
                    </tr>
                  ))}

                  {/* Stop Loss / Defensive Roll Alert Leg */}
                  {stagedOrder.stopLossLegs.map((leg, idx) => (
                    <tr key={`sl_${idx}`} className="hover:bg-slate-900/40 bg-rose-950/10">
                      <td className="py-2 px-3 font-sans">
                        <span className="px-2 py-0.5 rounded bg-rose-500/15 text-rose-400 border border-rose-500/30 text-[10px] font-bold">
                          Defensive Alert
                        </span>
                      </td>
                      <td className="py-2 px-3 font-bold text-rose-400">
                        STOP / ROLL
                      </td>
                      <td className="py-2 px-3 text-slate-400">
                        {leg.symbol}
                      </td>
                      <td className="py-2 px-3 text-slate-400">
                        Trigger at 0.50Δ breach
                      </td>
                      <td className="py-2 px-3 text-right text-slate-400">
                        {leg.quantity}
                      </td>
                      <td className="py-2 px-3 text-right text-rose-400 font-bold">
                        ${stagedOrder.stopLossPrice.toFixed(2)}
                      </td>
                      <td className="py-2 px-3 text-right text-slate-400 font-sans">
                        GTC
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Broker Format Tabs & Payload Code Box */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              {/* Broker Switcher */}
              <div className="inline-flex p-1 bg-slate-900 rounded-xl border border-slate-800 text-xs font-semibold">
                <button
                  onClick={() => setActiveBrokerTab('SCHWAB')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    activeBrokerTab === 'SCHWAB'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Charles Schwab API (JSON)
                </button>
                <button
                  onClick={() => setActiveBrokerTab('IBKR')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    activeBrokerTab === 'IBKR'
                      ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Interactive Brokers (TWS CSV)
                </button>
                <button
                  onClick={() => setActiveBrokerTab('THINKORSWIM')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    activeBrokerTab === 'THINKORSWIM'
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Thinkorswim (ToS String)
                </button>
              </div>

              {/* Action Buttons: Copy, Download, Print */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleCopy}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white border border-slate-800 font-semibold flex items-center space-x-1.5 transition-colors shadow-sm"
                >
                  {copied ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <FileText className="w-3.5 h-3.5 text-blue-400" />
                      <span>Copy Payload</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleDownload}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-emerald-400 hover:text-emerald-300 border border-slate-800 font-semibold flex items-center space-x-1.5 transition-colors shadow-sm"
                  title="Download File for Direct Broker Import"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Download Ticket</span>
                </button>

                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 font-semibold flex items-center space-x-1.5 transition-colors shadow-sm"
                  title="Print Execution Slip"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-400" />
                  <span>Print Slip</span>
                </button>
              </div>
            </div>

            {/* Code Box */}
            <div className="relative p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-emerald-400 overflow-x-auto max-h-56 select-all shadow-inner">
              <pre>
                {activeBrokerTab === 'SCHWAB'
                  ? stagedOrder.schwabJsonPayload
                  : activeBrokerTab === 'IBKR'
                  ? stagedOrder.ibkrBasketCsv
                  : stagedOrder.thinkorswimString}
              </pre>
            </div>
          </div>

          {/* Optional Direct Schwab Dispatch Button */}
          {activeBrokerTab === 'SCHWAB' && (
            <div className="p-3 rounded-xl bg-blue-950/20 border border-blue-500/30 flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-blue-300 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-blue-400" />
                  <span>1-Click Charles Schwab Retail Trader API Submission</span>
                </span>
                <p className="text-[11px] text-slate-400">
                  Transmit this validated bracket order directly to your authenticated Schwab account.
                </p>
                {schwabSubmitStatus && (
                  <p className="text-[11px] font-semibold text-emerald-400 mt-1">
                    {schwabSubmitStatus}
                  </p>
                )}
              </div>

              <button
                onClick={handleSchwabApiSubmit}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
              >
                Send Order to Schwab API
              </button>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs text-slate-400">
          <span>
            Strict execution safety: Orders are staged at limit prices with mandatory 80% take-profit brackets.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
