import React from 'react';
import { DirectActionBanner } from './DirectActionBanner';
import { TrendingUp, BarChart2, Activity } from '../../../icons';
import { MenuTreeType, EquitiesTabType, OptionsTabType } from '../../../../types/options';

export interface ChapterContextSentimentProps {
  onNavigate?: (tree: MenuTreeType, optionsTab?: OptionsTabType, equitiesTab?: EquitiesTabType) => void;
}

export const ChapterContextSentiment: React.FC<ChapterContextSentimentProps> = ({
  onNavigate,
}) => {
  return (
    <div className="space-y-6">
      <div className="border-l-2 border-cyan-500 pl-4 py-1">
        <h3 className="text-base font-bold text-white">Contextual Intelligence: Prediction Markets &amp; Retail Sentiment</h3>
        <p className="text-slate-400 mt-1">
          Layered multi-source signals surfaced inside each ticker's Audit tab — enriching options decisions with crowd wisdom, professional consensus, and social heat.
        </p>
      </div>

      <DirectActionBanner
        actions={[
          {
            label: 'Multi-Agent Trade Auditor',
            location: 'Options > Multi-Agent Audit',
            onClick: () => onNavigate?.('OPTIONS', 'MULTI_AGENT_AUDIT'),
          },
          {
            label: 'Sector Overview & Sentiment',
            location: 'Equities > Sector Overview',
            onClick: () => onNavigate?.('EQUITIES', undefined, 'SECTOR_OVERVIEW'),
          },
        ]}
      />

      {/* Analyst Price Target Bar */}
      <div className="bg-slate-950/70 p-4 rounded-xl border border-emerald-500/30 space-y-3">
        <div className="flex items-center space-x-2 text-emerald-400 font-bold text-xs">
          <TrendingUp className="w-4 h-4" />
          <span>Analyst Price Target Bar (Audit Tab → News &amp; Analyst)</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
            <div className="font-bold text-white">How to Read It</div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              A horizontal track displays the Wall Street <strong>Low / Mean / High</strong> price targets from all covering analysts. A needle marks the current spot price. The consensus upside % callout tells you how far below mean the stock is trading.
            </p>
          </div>
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
            <div className="font-bold text-emerald-400">Why It Matters for CSP Writers</div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              If spot price is at or below the analyst low target, the market is already pricing in extreme pessimism. This context reduces assignment risk for a conservative OTM put writer near the Lower Bollinger Band.
            </p>
          </div>
        </div>
      </div>

      {/* Prediction Market Cards */}
      <div className="bg-slate-950/70 p-4 rounded-xl border border-purple-500/30 space-y-3">
        <div className="flex items-center space-x-2 text-purple-400 font-bold text-xs">
          <BarChart2 className="w-4 h-4" />
          <span>Prediction Market Analytics &amp; Term Structure (Audit Tab → Prediction Markets)</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
            <div className="font-bold text-white">Kalshi (CFTC Regulated) &amp; Polymarket</div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              CFTC-regulated USD contracts and decentralized USDC orderbooks. Binary (Yes/No) contracts representing real capital backing specific corporate combinations, earnings hurdles, and policy timelines.
            </p>
          </div>
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
            <div className="font-bold text-cyan-400">Multi-Year Term Structures</div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Models complex multi-horizon catalysts (such as SPCX / TSLA strategic combination or Robotaxi regulatory clearance) across 2025, 2026, 2027, and 2028+. Computes cumulative odds, marginal density (+Δ%), and annualized hazard rates.
            </p>
          </div>
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
            <div className="font-bold text-blue-400">PMCI Scoring Engine (0-100)</div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Weighted composite score factoring CFTC regulation weighting (1.20x), decentralized orderbook depth (1.15x), and volume logarithmic scaling to compute true market confidence.
            </p>
          </div>
        </div>
        <div className="bg-cyan-950/30 p-3 rounded-lg border border-cyan-500/30 text-xs text-cyan-300">
          <strong>Options Coupling Rule:</strong> When near-term (&lt;12M) catalyst hazard rate is low (&lt;25%), short put assignments are protected, creating an optimal Cash-Secured Put (CSP) harvesting window. When multi-year cumulative odds exceed 60%, long LEAPS call spreads offer asymmetric convexity.
        </div>
      </div>

      {/* Social Sentiment Gauge */}
      <div className="bg-slate-950/70 p-4 rounded-xl border border-cyan-500/30 space-y-3">
        <div className="flex items-center space-x-2 text-amber-400 font-bold text-xs">
          <Activity className="w-4 h-4" />
          <span>Social Sentiment Velocity Score (SSVS) &amp; Multi-Channel Matrix</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
            <div className="font-bold text-emerald-400">StockTwits &amp; Reddit WSB</div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Live ratio of Bullish vs. Bearish Cashtag messages and Reddit /r/wallstreetbets trending rank. Computes retail volume velocity (z-scores) to detect viral momentum surges.
            </p>
          </div>
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
            <div className="font-bold text-amber-400">SSVS Composite (0-100)</div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Blends StockTwits (30%), Reddit (20%), X/Twitter Cashtags (20%), Seeking Alpha Quant (15%), and TradingView 26-Indicator Consensus (15%) into a single momentum index.
            </p>
          </div>
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
            <div className="font-bold text-purple-400">Retail Flow Divergence</div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Flags divergence between retail hype and fundamental/technical factors. Detects FOMO exhaustions, short squeeze warnings, or constructive smart money accumulation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
