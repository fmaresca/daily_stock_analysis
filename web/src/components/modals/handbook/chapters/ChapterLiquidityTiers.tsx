import React from 'react';
import { DirectActionBanner } from './DirectActionBanner';
import { MenuTreeType, EquitiesTabType, OptionsTabType } from '../../../../types/options';

export interface ChapterLiquidityTiersProps {
  onNavigate?: (tree: MenuTreeType, optionsTab?: OptionsTabType, equitiesTab?: EquitiesTabType) => void;
}

export const ChapterLiquidityTiers: React.FC<ChapterLiquidityTiersProps> = ({
  onNavigate,
}) => {
  return (
    <div className="space-y-6">
      <div className="border-l-2 border-amber-500 pl-4 py-1">
        <h3 className="text-base font-bold text-white">Liquidity Tiers &amp; Execution Slippage Rules</h3>
        <p className="text-slate-400 mt-1">
          Bid-ask spread widths determine your real-world fill prices. Never use market orders on illiquid options chains.
        </p>
      </div>

      <DirectActionBanner
        actions={[
          {
            label: 'Technical Screener (Tier Filter)',
            location: 'Equities > Technical Screener',
            onClick: () => onNavigate?.('EQUITIES', undefined, 'TECHNICAL_SCREENER'),
          },
          {
            label: 'Options Income Screener Table',
            location: 'Options > Income Screener',
            onClick: () => onNavigate?.('OPTIONS', 'INCOME_SCREENER'),
          },
        ]}
      />

      <div className="space-y-3">
        <div className="bg-slate-950/70 p-3.5 rounded-xl border border-emerald-500/30 flex items-start space-x-3">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 mt-1 shrink-0" />
          <div>
            <div className="font-bold text-white text-xs">Tier 1: Ultra-Liquid (SPY, QQQ, NVDA, AAPL, MSFT, TSLA)</div>
            <p className="text-xs text-slate-300 mt-0.5">
              Penny-wide bid/ask spreads ($0.01–$0.03). Instant fills near mid price with institutional market maker depth. Low execution friction.
            </p>
          </div>
        </div>

        <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 flex items-start space-x-3">
          <div className="w-2.5 h-2.5 rounded-full bg-blue-400 mt-1 shrink-0" />
          <div>
            <div className="font-bold text-white text-xs">Tier 2/3: Moderate Retail Liquidity (PLTR, IONQ, NET, RTX, SCHD, SPCX)</div>
            <p className="text-xs text-slate-300 mt-0.5">
              Spreads generally $0.05 to $0.15. Work limit orders at midpoint. If unfilled after 5 minutes, adjust by 1–2 cents toward the bid/ask.
            </p>
          </div>
        </div>

        <div className="bg-slate-950/70 p-3.5 rounded-xl border border-rose-500/40 flex items-start space-x-3">
          <div className="w-2.5 h-2.5 rounded-full bg-rose-400 mt-1 shrink-0" />
          <div>
            <div className="font-bold text-rose-300 text-xs">Tier 4: Small-Cap &amp; Wide Spread Warning (AXTI, BLZE, ZETA)</div>
            <p className="text-xs text-slate-300 mt-0.5">
              Spreads can reach $0.20 to $0.60, representing 10%–25% of the total option premium. <strong>STRICT RULE:</strong> Always use limit orders at the midpoint. NEVER submit market orders, or slippage will eliminate your profit margin.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
