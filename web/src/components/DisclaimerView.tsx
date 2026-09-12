import React from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  FileText,
  Activity,
  Lock,
  ArrowRight,
  TrendingUp,
} from './icons';

interface DisclaimerViewProps {
  onNavigateToScreener?: () => void;
  onNavigateToMethodology?: () => void;
}

export const DisclaimerView: React.FC<DisclaimerViewProps> = ({
  onNavigateToScreener,
  onNavigateToMethodology,
}) => {
  return (
    <div className="space-y-8 animate-fadeIn max-w-7xl mx-auto px-2 sm:px-4 py-4">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-950 to-rose-950/30 p-6 sm:p-8 border border-rose-500/30 shadow-2xl">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-rose-950/80 border border-rose-500/40 text-rose-300 text-xs font-semibold tracking-wide">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
              <span>Regulatory Compliance, Risk Disclosures &amp; Terms of Use</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white">
              Institutional Risk Disclaimers &amp; Regulatory Notices
            </h1>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              DeltaHarvest is an automated quantitative research, options screening, and decision support platform. Options trading involves substantial risk of loss and is not suitable for all investors.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {onNavigateToMethodology && (
              <button
                onClick={onNavigateToMethodology}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs sm:text-sm border border-slate-700 transition-all cursor-pointer"
              >
                <span>Quantitative Methodology</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
            {onNavigateToScreener && (
              <button
                onClick={onNavigateToScreener}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
              >
                <span>Live Screener</span>
                <Activity className="w-4 h-4 text-white" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Structured Disclosure Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. OCC Options Disclosure */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-6 space-y-3">
          <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
            <ShieldAlert className="w-4 h-4" />
            <span>1. Characteristics &amp; Risks of Standardized Options (OCC)</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Options involve significant financial risk and are not suitable for all investors. Prior to buying or selling options, investors must read the booklet entitled <em>Characteristics and Risks of Standardized Options</em> published by The Options Clearing Corporation (OCC).
          </p>
          <p className="text-xs text-slate-400 leading-relaxed">
            A copy of this document may be obtained from your broker or by visiting{' '}
            <a
              href="https://www.theocc.com/company-information/documents-and-archives/options-disclosure-document"
              target="_blank"
              rel="noreferrer"
              className="text-emerald-400 underline hover:text-emerald-300"
            >
              theocc.com
            </a>.
          </p>
        </div>

        {/* 2. Educational & Research Purpose */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-6 space-y-3">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
            <AlertTriangle className="w-4 h-4" />
            <span>2. No Investment, Legal, or Tax Advice</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            All content, quantitative rankings, probability of profit metrics, delta thresholds, and trade quality scores provided by DeltaHarvest are for <strong>educational and informational research purposes only</strong>.
          </p>
          <p className="text-xs text-slate-400 leading-relaxed">
            Nothing contained herein constitutes an endorsement, recommendation, or solicitation to buy, sell, or hold any security, option contract, or financial instrument. Consult a licensed financial advisor before executing trades.
          </p>
        </div>

        {/* 3. Market Data & Latency */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-6 space-y-3">
          <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
            <Activity className="w-4 h-4" />
            <span>3. Market Data Accuracy &amp; Latency</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Market quotes, option chains, and Greeks are retrieved via third-party APIs (including Tradier Technologies and Charles Schwab). While data is sourced from reputable institutional feeds, DeltaHarvest makes no warranty as to the timeliness, accuracy, or completeness of such data.
          </p>
          <p className="text-xs text-slate-400 leading-relaxed">
            Execution prices at your brokerage may differ due to market volatility, exchange latency, and bid-ask slippage. Always verify orders with your broker prior to transmission.
          </p>
        </div>

        {/* 4. Model Limitations & Backtest Assumptions */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-6 space-y-3">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
            <TrendingUp className="w-4 h-4" />
            <span>4. Hypothetical Performance &amp; Backtesting</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Simulated, hypothetical, or backtested performance metrics (such as the 80% Buy-to-Close rule and 0.50 Delta roll) have inherent limitations. Unlike actual market performance, simulated results do not represent actual trading and may not account for certain market factors such as illiquidity or assignment risk.
          </p>
          <p className="text-xs text-slate-400 leading-relaxed">
            Past performance is no guarantee of future investment returns.
          </p>
        </div>
      </div>

      {/* Security and Privacy Statement */}
      <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 space-y-2">
        <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
          <Lock className="w-4 h-4" />
          <span>Privacy &amp; Credential Protection Commitment</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          DeltaHarvest does not store, transmit, or monetize your brokerage credentials or API keys on external servers. All authentication keys (Tradier API Tokens, Schwab OAuth Tokens) reside strictly in your private local browser storage or local environment variables.
        </p>
      </div>
    </div>
  );
};
