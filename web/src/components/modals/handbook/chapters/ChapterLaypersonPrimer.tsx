import React from 'react';
import { DirectActionBanner } from './DirectActionBanner';
import { MenuTreeType, EquitiesTabType, OptionsTabType } from '../../../../types/options';

export interface ChapterLaypersonPrimerProps {
  onNavigate?: (tree: MenuTreeType, optionsTab?: OptionsTabType, equitiesTab?: EquitiesTabType) => void;
  onOpenSimulator?: () => void;
  onOpenValuation?: (ticker?: string) => void;
}

export const ChapterLaypersonPrimer: React.FC<ChapterLaypersonPrimerProps> = ({
  onNavigate,
  onOpenSimulator,
  onOpenValuation,
}) => {
  return (
    <div className="space-y-6">
      <div className="border-l-2 border-emerald-400 pl-4 py-1">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <span>🌟 Welcome to DeltaHarvest: Plain-English Guide for Everyday Investors</span>
        </h3>
        <p className="text-slate-300 mt-1">
          You don&apos;t need to be a Wall Street day-trader to use this platform. DeltaHarvest is an automated conservative income system that lets you collect recurring cash flow from high-quality stocks with high statistical odds of success.
        </p>
      </div>

      <DirectActionBanner
        actions={[
          {
            label: 'Options Income Screener',
            location: 'Options > Income Screener',
            onClick: () => onNavigate?.('OPTIONS', 'INCOME_SCREENER'),
          },
          {
            label: '100-Point Trade Quality Simulator',
            location: 'Interactive Modal',
            onClick: onOpenSimulator,
          },
          {
            label: 'DCF Intrinsic Valuation & DuPont (v3.4)',
            location: 'Valuation Terminal',
            onClick: () => onOpenValuation?.('NVDA'),
          },
          {
            label: 'Weekly 7-Step Workflow Ritual',
            location: 'Workflow > Step 1',
            onClick: () => onNavigate?.('WORKFLOW', 'SCHWAB_POSITIONS_UPLOAD'),
          },
        ]}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Concept 1: What is an Option? */}
        <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-2">
          <div className="font-bold text-white text-xs flex items-center gap-1.5">
            <span className="text-emerald-400">1.</span> What is an Option Contract?
          </div>
          <p className="text-xs text-slate-300">
            Think of an option like an <strong>insurance contract</strong> or an <strong>earnest money deposit on real estate</strong>. When you sell an option, someone pays you cash today in exchange for a promise that expires in a few days or weeks.
          </p>
        </div>

        {/* Concept 2: Cash-Secured Put (CSP) */}
        <div className="bg-slate-950/70 p-4 rounded-xl border border-emerald-500/30 space-y-2">
          <div className="font-bold text-emerald-300 text-xs flex items-center gap-1.5">
            <span className="text-emerald-400">2.</span> Cash-Secured Put (CSP) = Getting Paid to Buy on Sale
          </div>
          <p className="text-xs text-slate-300">
            You set aside cash to buy 100 shares of a great company (like Apple or Microsoft) at a <strong>steep discount price you choose</strong>. You get paid real cash upfront today. If the stock never drops to your discount price, you keep 100% of the cash for free!
          </p>
        </div>

        {/* Concept 3: Covered Call (CC) */}
        <div className="bg-slate-950/70 p-4 rounded-xl border border-cyan-500/30 space-y-2">
          <div className="font-bold text-cyan-300 text-xs flex items-center gap-1.5">
            <span className="text-cyan-400">3.</span> Covered Call (CC) = Collecting Rental Income
          </div>
          <p className="text-xs text-slate-300">
            If you own 100 shares of a stock, selling a Covered Call is like collecting monthly rental income on your house while agreeing that if someone offers you a massive jackpot price, you&apos;ll sell it for huge profits.
          </p>
        </div>

        {/* Concept 4: Delta and Probabilities */}
        <div className="bg-slate-950/70 p-4 rounded-xl border border-indigo-500/30 space-y-2">
          <div className="font-bold text-indigo-300 text-xs flex items-center gap-1.5">
            <span className="text-indigo-400">4.</span> Delta (&Delta;) = The Statistical Odds
          </div>
          <p className="text-xs text-slate-300">
            Delta measures the probability of a stock reaching your strike price. When we target <strong>0.15 Delta</strong>, math says there is an <strong>~85% statistical probability</strong> that the trade will finish fully profitable with zero stock purchase required.
          </p>
        </div>

        {/* Concept 5: Bollinger Bands */}
        <div className="bg-slate-950/70 p-4 rounded-xl border border-amber-500/30 space-y-2">
          <div className="font-bold text-amber-300 text-xs flex items-center gap-1.5">
            <span className="text-amber-400">5.</span> Bollinger Bands = Price Highway Guardrails
          </div>
          <p className="text-xs text-slate-300">
            Bollinger Bands show the statistical normal price boundaries of a stock (2 Standard Deviations = 95% of all price action). We sell puts <strong>below the Lower Band floor</strong> and calls <strong>above the Upper Band ceiling</strong> for maximum safety margin.
          </p>
        </div>

        {/* Concept 6: IV Rank */}
        <div className="bg-slate-950/70 p-4 rounded-xl border border-purple-500/30 space-y-2">
          <div className="font-bold text-purple-300 text-xs flex items-center gap-1.5">
            <span className="text-purple-400">6.</span> IV Rank (IVR %) = Volatility Thermometer
          </div>
          <p className="text-xs text-slate-300">
            Implied Volatility (IV) measures market panic or excitement. When IV Rank is high (&ge; 45%), option buyers overpay for insurance, allowing conservative option sellers to harvest unusually high cash yields.
          </p>
        </div>

        {/* Concept 7: Institutional Redesign & Adaptive Logo */}
        <div className="bg-slate-950/70 p-4 rounded-xl border border-emerald-500/40 space-y-2.5 col-span-full">
          <div className="font-bold text-white text-xs flex items-center gap-1.5">
            <span className="text-emerald-400">✨</span> Official Institutional Redesign &amp; Adaptive Logo
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            DeltaHarvest features an institutional trading desk aesthetic inspired by quantitative execution terminals:
          </p>
          <ul className="text-xs text-slate-300 list-disc list-inside space-y-1.5 pl-1">
            <li><strong>3D Faceted Delta Emblem:</strong> Chiseled Greek Delta (&Delta;) symbol in emerald, cyan, and oceanic teal facets paired with a dynamic orbital swoosh representing systematic options cash flow harvesting.</li>
            <li><strong>Adaptive Dark &amp; Light Theming:</strong> The logo and entire UI automatically adapt between Night Mode (dark obsidian with luminous cyan/emerald accents) and Day Mode (clean crisp white with deep navy slate typography).</li>
            <li><strong>Institutional Sidebar Navigation:</strong> Sleek left navigation rail providing one-click access to the End-of-Week Ritual, Portfolio Digest, US Equities Universe, Strategy Labs, Broker Order Staging, Reports, and System Diagnostics.</li>
            <li><strong>Financial Dashboard Hero Banner:</strong> High-level real-time KPI overview featuring Net Liquidity, Daily Theta velocity, Compliance Health Score, and Portfolio Graph yield trajectory curve.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
