import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldAlert,
  ShieldCheck,
  Lock,
  FileText,
  AlertTriangle,
  ExternalLink,
} from '../icons';

export type LegalTab = 'TERMS' | 'PRIVACY' | 'DISCLAIMER';

interface LegalDisclosuresModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: LegalTab;
}

export const LegalDisclosuresModal: React.FC<LegalDisclosuresModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'TERMS',
}) => {
  const [activeTab, setActiveTab] = useState<LegalTab>(initialTab);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="legal-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold text-sm">
              Δ
            </div>
            <div>
              <h2 id="legal-modal-title" className="text-base font-bold text-white tracking-tight">
                DeltaHarvest Institutional Legal &amp; Regulatory Disclosures
              </h2>
              <p className="text-xs text-slate-400">
                Institutional Quantitative Research, Data Privacy &amp; Options Risk Standards
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close legal disclosures"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Bar */}
        <div className="flex items-center px-6 pt-3 pb-2 border-b border-slate-800 bg-slate-900/50 space-x-2">
          <button
            onClick={() => setActiveTab('TERMS')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center space-x-2 ${
              activeTab === 'TERMS'
                ? 'bg-blue-600/20 text-blue-300 border border-blue-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Terms of Service</span>
          </button>
          <button
            onClick={() => setActiveTab('PRIVACY')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center space-x-2 ${
              activeTab === 'PRIVACY'
                ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>Privacy Policy</span>
          </button>
          <button
            onClick={() => setActiveTab('DISCLAIMER')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center space-x-2 ${
              activeTab === 'DISCLAIMER'
                ? 'bg-rose-600/20 text-rose-300 border border-rose-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Risk Disclaimer &amp; OCC</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-300 leading-relaxed font-sans">
          {activeTab === 'TERMS' && (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-blue-950/20 border border-blue-500/30 flex items-start space-x-3 text-blue-200">
                <FileText className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-sm text-blue-300">Terms of Institutional Service</h4>
                  <p className="text-[11px] text-blue-200/90 mt-0.5">
                    Authorized Professional &amp; Institutional Research Terminal Agreement
                  </p>
                </div>
              </div>

              <section className="space-y-1.5">
                <h5 className="font-bold text-white text-xs uppercase tracking-wide">1. Scope of Service</h5>
                <p>
                  DeltaHarvest Institutional (&quot;DeltaHarvest&quot;) is a proprietary quantitative decision support,
                  volatility analytics, and options income screening platform. The terminal is licensed strictly for
                  authorized institutional, proprietary trading, and professional research purposes.
                </p>
              </section>

              <section className="space-y-1.5">
                <h5 className="font-bold text-white text-xs uppercase tracking-wide">2. Client-Side Execution &amp; Non-Custodial Architecture</h5>
                <p>
                  DeltaHarvest does not operate as a registered broker-dealer, investment advisor, commodity trading advisor,
                  or custodial institution. All orders staged through the platform require manual confirmation and are
                  transmitted directly to third-party brokerages (e.g., Tradier Technologies, Charles Schwab) via customer-authenticated
                  API endpoints or local workflows.
                </p>
              </section>

              <section className="space-y-1.5">
                <h5 className="font-bold text-white text-xs uppercase tracking-wide">3. Proprietary Intellectual Property</h5>
                <p>
                  All mathematical models, ranking algorithms, 2.0 SD Bollinger Band envelope filters, DuPont decomposition
                  engines, and automated prompt engineering templates are the exclusive intellectual property of DeltaHarvest.
                  Reverse engineering, unauthorized scraping, redistribution, or commercial sub-licensing is strictly prohibited.
                </p>
              </section>

              <section className="space-y-1.5">
                <h5 className="font-bold text-white text-xs uppercase tracking-wide">4. Limitation of Liability &amp; Disclaimers</h5>
                <p>
                  DeltaHarvest is provided on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis without warranty of any kind.
                  In no event shall DeltaHarvest, its developers, or affiliates be liable for any direct, indirect, incidental,
                  consequential, or punitive damages arising from algorithmic calculation anomalies, API transmission latency,
                  broker downtime, or financial market losses.
                </p>
              </section>
            </div>
          )}

          {activeTab === 'PRIVACY' && (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/30 flex items-start space-x-3 text-emerald-200">
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-sm text-emerald-300">Privacy &amp; Data Protection Policy</h4>
                  <p className="text-[11px] text-emerald-200/90 mt-0.5">
                    Zero-Tracker, Non-Monetized Institutional Security Architecture
                  </p>
                </div>
              </div>

              <section className="space-y-1.5">
                <h5 className="font-bold text-white text-xs uppercase tracking-wide">1. Zero Third-Party Tracking</h5>
                <p>
                  DeltaHarvest employs no third-party tracking pixels, external telemetry beacons, behavioral advertising SDKs,
                  or third-party analytics cookies. Your research queries, screener selections, and portfolio simulations remain
                  strictly confidential.
                </p>
              </section>

              <section className="space-y-1.5">
                <h5 className="font-bold text-white text-xs uppercase tracking-wide">2. Brokerage Credential Isolation</h5>
                <p>
                  Brokerage credentials, API access tokens, and refresh tokens (including Tradier and Charles Schwab OAuth keys)
                  are never transmitted to external marketing servers or non-essential third parties. Client-provided tokens
                  are stored in your private browser local storage or isolated within Cloudflare D1 encrypted server-side configurations.
                </p>
              </section>

              <section className="space-y-1.5">
                <h5 className="font-bold text-white text-xs uppercase tracking-wide">3. Server-Scoped Administrative Routing</h5>
                <p>
                  Administrative inquiries, account provisioning requests, and system notification dispatches are routed
                  through secure server-side workers. Internal administrative email addresses and account identifiers are never
                  exposed in public client bundles or UI elements.
                </p>
              </section>

              <section className="space-y-1.5">
                <h5 className="font-bold text-white text-xs uppercase tracking-wide">4. Data Retention &amp; Erasure</h5>
                <p>
                  Users may clear their locally persisted watchlists, portfolio ledger entries, and cached market data at any
                  time through browser local storage reset or the in-app Reset All Data workflow.
                </p>
              </section>
            </div>
          )}

          {activeTab === 'DISCLAIMER' && (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-500/30 flex items-start space-x-3 text-rose-200">
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-sm text-rose-300">Regulatory Disclaimers &amp; OCC Options Risk</h4>
                  <p className="text-[11px] text-rose-200/90 mt-0.5">
                    Mandatory Standardized Options Disclosure &amp; Non-Solicitation Statement
                  </p>
                </div>
              </div>

              <section className="space-y-1.5">
                <h5 className="font-bold text-white text-xs uppercase tracking-wide">1. Characteristics and Risks of Standardized Options (OCC)</h5>
                <p>
                  Derivative options trading involves substantial risk of loss and is not appropriate for all investors.
                  Prior to opening any option position, investors must read the publication{' '}
                  <em>Characteristics and Risks of Standardized Options</em> published by The Options Clearing Corporation (OCC).
                </p>
                <p className="pt-1">
                  <a
                    href="https://www.theocc.com/company-information/documents-and-archives/options-disclosure-document"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center space-x-1 text-emerald-400 hover:text-emerald-300 font-semibold underline underline-offset-2"
                  >
                    <span>View Official OCC Disclosure Document</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </p>
              </section>

              <section className="space-y-1.5">
                <h5 className="font-bold text-white text-xs uppercase tracking-wide">2. Substantial Risk of Capital Loss</h5>
                <p>
                  Options strategies, including Cash-Secured Puts, Covered Calls, and Credit Spreads, carry real assignment
                  and drawdown risks. Sellers of put options assume the obligation to purchase underlying shares at the strike
                  price regardless of how far the market price declines. Sellers of covered calls cap potential upside while
                  remaining fully exposed to stock depreciations.
                </p>
              </section>

              <section className="space-y-1.5">
                <h5 className="font-bold text-white text-xs uppercase tracking-wide">3. Educational &amp; Informational Research Only</h5>
                <p>
                  All probability of profit (POP) estimates, Delta targets, annualized return on capital (AROC) calculations,
                  and Greek sensitivities displayed in DeltaHarvest are mathematical models intended solely for educational
                  and research purposes. Nothing constitutes personal investment advice, a guarantee of future returns, or a solicitation
                  to purchase or sell any security.
                </p>
              </section>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-800 bg-slate-950/70 text-[11px] text-slate-500">
          <span>&copy; {new Date().getFullYear()} DeltaHarvest Institutional. All rights reserved.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition-colors cursor-pointer"
          >
            Acknowledge &amp; Close
          </button>
        </div>
      </div>
    </div>
  );
};
