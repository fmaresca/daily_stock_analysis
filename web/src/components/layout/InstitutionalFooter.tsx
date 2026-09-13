import React from 'react';
import { MenuTreeType, OptionsTabType, EquitiesTabType } from '../../types/options';

interface InstitutionalFooterProps {
  navigateTo: (tree: MenuTreeType, optionsTab?: OptionsTabType, equitiesTab?: EquitiesTabType) => void;
  setIsSimulatorModalOpen: (open: boolean) => void;
  openValuation: (ticker: string) => void;
  setIsDiagnosticsOpen: (open: boolean) => void;
  setIsTradierModalOpen: (open: boolean) => void;
}

export const InstitutionalFooter: React.FC<InstitutionalFooterProps> = ({
  navigateTo,
  setIsSimulatorModalOpen,
  openValuation,
  setIsDiagnosticsOpen,
  setIsTradierModalOpen,
}) => {
  return (
    <footer className="border-t border-slate-800/80 bg-slate-950/95 py-10 mt-14 text-xs text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-left">
          {/* Column 1: Brand & Overview */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold">
                Δ
              </div>
              <span className="font-bold text-white tracking-tight text-sm">DeltaHarvest Institutional</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Systematic US equities quantitative analysis, conservative options cash flow harvesting, and institutional risk management.
            </p>
            <div className="text-[10px] font-mono text-emerald-400">
              Tradier API Primary • Schwab Retail Fallback
            </div>
          </div>

          {/* Column 2: Core Workflows */}
          <div className="space-y-2">
            <div className="text-xs font-mono uppercase tracking-wider text-white font-bold">Core Engines</div>
            <ul className="space-y-1.5 text-[11px]">
              <li>
                <a
                  href="/workflow"
                  onClick={(e) => { e.preventDefault(); navigateTo('WORKFLOW', 'WEEKLY_CASH_LEDGER'); }}
                  className="hover:text-emerald-400 transition-colors"
                >
                  End-of-Week Workflow
                </a>
              </li>
              <li>
                <a
                  href="/equities"
                  onClick={(e) => { e.preventDefault(); navigateTo('EQUITIES', undefined, 'TECHNICAL_SCREENER'); }}
                  className="hover:text-emerald-400 transition-colors"
                >
                  Equities Technical Screener
                </a>
              </li>
              <li>
                <a
                  href="/options"
                  onClick={(e) => { e.preventDefault(); navigateTo('OPTIONS', 'WEEKLY_POSITION_AUDIT'); }}
                  className="hover:text-emerald-400 transition-colors"
                >
                  Weekly Options &amp; Position Audit
                </a>
              </li>
              <li>
                <a
                  href="/spreads"
                  onClick={(e) => { e.preventDefault(); navigateTo('OPTIONS', 'MULTI_LEG_SPREADS'); }}
                  className="hover:text-emerald-400 transition-colors"
                >
                  Multi-Leg Spreads Analyzer
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Quantitative Tools */}
          <div className="space-y-2">
            <div className="text-xs font-mono uppercase tracking-wider text-white font-bold">Risk &amp; Margin</div>
            <ul className="space-y-1.5 text-[11px]">
              <li>
                <a
                  href="/margin"
                  onClick={(e) => { e.preventDefault(); navigateTo('OPTIONS', 'PORTFOLIO_MARGIN_SIM'); }}
                  className="hover:text-emerald-400 transition-colors"
                >
                  Portfolio Margin (TIMS) Simulator
                </a>
              </li>
              <li>
                <a
                  href="/calendar"
                  onClick={(e) => { e.preventDefault(); navigateTo('OPTIONS', 'ECONOMIC_CALENDAR'); }}
                  className="hover:text-emerald-400 transition-colors"
                >
                  Economic &amp; Earnings Calendar
                </a>
              </li>
              <li>
                <button
                  onClick={() => setIsSimulatorModalOpen(true)}
                  className="hover:text-emerald-400 transition-colors text-left cursor-pointer"
                >
                  Trade Quality Scoring Simulator
                </button>
              </li>
              <li>
                <button
                  onClick={() => openValuation('NVDA')}
                  className="hover:text-teal-400 text-teal-300 font-medium transition-colors text-left cursor-pointer"
                >
                  DCF Intrinsic Valuation &amp; DuPont (v3.4)
                </button>
              </li>
              <li>
                <button
                  onClick={() => setIsDiagnosticsOpen(true)}
                  className="hover:text-emerald-400 transition-colors text-left cursor-pointer"
                >
                  API Diagnostics &amp; System Health
                </button>
              </li>
            </ul>
          </div>

          {/* Column 4: Institutional Documentation & Disclosures */}
          <div className="space-y-2">
            <div className="text-xs font-mono uppercase tracking-wider text-white font-bold">Governance &amp; Research</div>
            <ul className="space-y-1.5 text-[11px]">
              <li>
                <a
                  href="/methodology"
                  onClick={(e) => { e.preventDefault(); navigateTo('METHODOLOGY'); }}
                  className="hover:text-teal-400 font-medium transition-colors"
                >
                  Quantitative Methodology (2.0 SD Rule)
                </a>
              </li>
              <li>
                <a
                  href="/faq"
                  onClick={(e) => { e.preventDefault(); navigateTo('FAQ'); }}
                  className="hover:text-cyan-400 font-medium transition-colors"
                >
                  Investor FAQ &amp; Handbook
                </a>
              </li>
              <li>
                <a
                  href="/disclaimer"
                  onClick={(e) => { e.preventDefault(); navigateTo('DISCLAIMER'); }}
                  className="hover:text-rose-400 font-medium transition-colors"
                >
                  Regulatory Disclaimers &amp; OCC Risks
                </a>
              </li>
              <li>
                <button
                  onClick={() => setIsTradierModalOpen(true)}
                  className="text-emerald-400 hover:text-emerald-300 transition-colors text-left cursor-pointer"
                >
                  Tradier API Settings (Primary)
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500">
          <p>
            &copy; {new Date().getFullYear()} DeltaHarvest Institutional. Quantitative Equity Analysis &amp; Options Income.
          </p>
          <p>
            Rules: Cash-Secured Put strikes &le; Lower Bollinger Band (2 SD); Covered Call strikes &ge; Upper Bollinger Band (2 SD); 80% Buy-to-Close rule; 0.50 Delta Roll trigger.
          </p>
        </div>
      </div>
    </footer>
  );
};
