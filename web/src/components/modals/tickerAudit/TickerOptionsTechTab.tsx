import React from 'react';
import {
  Activity,
  Flame,
  Layers,
  Target,
  TrendingUp,
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  DollarSign,
  Zap,
} from '../../icons';
import { TickerMeta, OptionOpportunity } from '../../../types/options';
import { InteractiveChart } from '../../InteractiveChart';
import { BarchartOpinionCard } from '../../BarchartOpinionCard';
import { calculateMarketChameleonPattern } from '../../../utils/securityIntelligence';
import { SocialShareToolbar } from '../../trading/SocialShareToolbar';
import { NewsCompactFeed } from '../../NewsCompactFeed';

interface TickerOptionsTechTabProps {
  ticker: TickerMeta;
  opportunities: OptionOpportunity[];
  intel: any;
  barchartOpinion: any;
  spotPrice: number;
  lowerBb: number;
  upperBb: number;
  sma20: number;
  rsi14: number;
  ivCurrent: number;
  hv30: number;
  ivRank: number;
  avgVolume30: number;
  putCushionPct: string;
  callUpsidePct: string;
  bestCSP: OptionOpportunity | null;
  bestCC: OptionOpportunity | null;
  putStrikeTarget: number;
  putCollateral: number;
  estimatedWeeklyPutPremium: number;
  analystTargets: any;
  isTier4: boolean;
  onViewNewsAnalyst: () => void;
  onOpenSimulator?: (ticker: string) => void;
}

export const TickerOptionsTechTab: React.FC<TickerOptionsTechTabProps> = ({
  ticker,
  opportunities,
  intel,
  barchartOpinion,
  spotPrice,
  lowerBb,
  upperBb,
  sma20,
  rsi14,
  ivCurrent,
  hv30,
  ivRank,
  avgVolume30,
  putCushionPct,
  callUpsidePct,
  bestCSP,
  bestCC,
  putStrikeTarget,
  putCollateral,
  estimatedWeeklyPutPremium,
  analystTargets,
  isTier4,
  onViewNewsAnalyst,
  onOpenSimulator,
}) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* SECTION 1: Volatility Profile */}
      <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            <span>Part 1: Volatility Profile &amp; Option Income Edge</span>
          </h3>
          <span
            className={`text-xs px-2.5 py-0.5 rounded font-mono font-bold ${
              ivRank >= 50
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'bg-slate-800 text-slate-300'
            }`}
          >
            IV Rank: {ivRank} / 100
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800">
            <div className="text-[11px] text-slate-400">Current Implied Volatility (IV)</div>
            <div className="text-base font-bold font-mono text-amber-400 mt-1">
              {ivCurrent.toFixed(1)}%
            </div>
            <p className="text-[10px] text-slate-500 mt-1">Market pricing for future 30d swing</p>
          </div>

          <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800">
            <div className="text-[11px] text-slate-400">30-Day Historical Volatility (HV)</div>
            <div className="text-base font-bold font-mono text-cyan-400 mt-1">
              {hv30.toFixed(1)}%
            </div>
            <p className="text-[10px] text-slate-500 mt-1">Realized underlying movement</p>
          </div>

          <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800">
            <div className="text-[11px] text-slate-400">IV / HV Volatility Premium</div>
            <div
              className={`text-base font-bold font-mono mt-1 ${
                ivCurrent > hv30 ? 'text-emerald-400' : 'text-slate-300'
              }`}
            >
              {(ivCurrent - hv30).toFixed(1)}%
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              {ivCurrent > hv30
                ? '✓ Implied volatility rich vs realized'
                : 'Normalized option pricing'}
            </p>
          </div>

          <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800">
            <div className="text-[11px] text-slate-400">Next Earnings Event</div>
            <div
              className={`text-base font-bold font-mono mt-1 ${
                ticker.earnings_within_7d ? 'text-rose-400 animate-pulse' : 'text-white'
              }`}
            >
              {ticker.next_earnings_date || 'N/A'}
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              {ticker.earnings_within_7d
                ? '🚨 High binary risk. Avoid new short delta.'
                : '✓ Safe window for short premium'}
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 2: Liquidity Tier & Cadence */}
      <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-3">
        <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
          <Flame className="w-4 h-4 text-cyan-400" />
          <span>Part 2: Liquidity Tier &amp; Option Cadence</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800">
            <div className="text-[11px] text-slate-400">Option Cadence Profile</div>
            <div className="text-sm font-bold font-mono text-cyan-300 mt-1">
              {ticker.expiration_cadence || ticker.options_cadence || (ticker.has_weeklys === false ? 'Monthly Only' : 'Weekly Expirations')}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {ticker.in_cboe_registry
                ? '✓ Official CBOE Weeklys directory listing.'
                : ticker.has_weeklys === false
                ? 'Standard 3rd-Friday monthly expirations only.'
                : 'Active weekly cycle.'}
            </p>
          </div>

          <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800">
            <div className="text-[11px] text-slate-400">30-Day Average Volume</div>
            <div className="text-base font-bold font-mono text-slate-200 mt-1">
              {avgVolume30.toLocaleString()} shares
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Ensures underlying market-making activity.
            </p>
          </div>

          <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800">
            <div className="text-[11px] text-slate-400">Execution Rule</div>
            <div className="text-sm font-bold font-mono text-emerald-400 mt-1">
              Strict Limit Orders
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {isTier4
                ? '🚨 Always enter at mid price. Never use market orders.'
                : 'Place limit orders at mid for optimal fills.'}
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 2.5: Equity Analysts Consensus & Price Target Snapshot */}
      <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
          <div className="flex items-center space-x-2">
            <Target className="w-4 h-4 text-emerald-400" />
            <div>
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Equity Research Consensus &amp; Price Targets
              </h3>
              <div className="text-[10px] text-slate-400">
                Wall Street Analyst Coverage ({analystTargets?.numberOfAnalysts || analystTargets?.number_of_analysts || 24} Analysts)
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/40">
              {analystTargets?.recommendation || intel.analystConsensus || 'Moderate Buy'}
            </span>
            <button
              onClick={onViewNewsAnalyst}
              className="text-xs text-blue-400 hover:text-blue-300 underline font-medium cursor-pointer"
            >
              View Breakdown &rarr;
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800">
            <span className="text-[10px] text-slate-400 block uppercase font-mono">Low Target</span>
            <span className="text-sm font-bold font-mono text-rose-300">${analystTargets?.low?.toFixed(2) || (spotPrice * 0.88).toFixed(2)}</span>
          </div>
          <div className="p-2.5 rounded-lg bg-blue-950/40 border border-blue-800/50">
            <span className="text-[10px] text-blue-300 block uppercase font-mono">Mean Consensus</span>
            <span className="text-sm font-bold font-mono text-blue-200">${analystTargets?.mean?.toFixed(2) || (spotPrice * 1.12).toFixed(2)}</span>
            <span className="text-[10px] font-mono text-emerald-400 block">
              +{Math.round((((analystTargets?.mean || (spotPrice * 1.12)) - spotPrice) / spotPrice) * 1000) / 10}% Upside
            </span>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800">
            <span className="text-[10px] text-slate-400 block uppercase font-mono">High Target</span>
            <span className="text-sm font-bold font-mono text-emerald-300">${analystTargets?.high?.toFixed(2) || (spotPrice * 1.25).toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* SECTION 3: Technical Boundaries */}
      <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            <span>Part 3: Technical Boundaries, Bollinger Envelope &amp; Interactive Chart</span>
          </h3>
          {/* Social Share Toolbar — share this setup to Telegram, WhatsApp, StockTwits, Discord */}
          <SocialShareToolbar
            ticker={ticker.symbol}
            currentPrice={spotPrice}
            rsi={rsi14}
            ivRank={ivRank}
            strategy={bestCSP ? 'Cash-Secured Put' : bestCC ? 'Covered Call' : 'Stock Analysis'}
            strikePrice={bestCSP?.strike ?? bestCC?.strike}
            expirationDate={bestCSP?.expiration ?? bestCC?.expiration}
          />
        </div>

        {/* Embedded TradingView Lightweight Candlestick Chart */}
        <InteractiveChart ticker={ticker} opportunities={opportunities} height={300} />

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800">
            <div className="text-[11px] text-slate-400">20-Day SMA</div>
            <div className="text-lg font-bold font-mono text-white mt-0.5">
              ${sma20.toFixed(2)}
            </div>
            <div className="text-[10px] text-slate-500">Mean regression line</div>
          </div>

          <div className="bg-slate-950/70 p-2.5 rounded-lg border border-emerald-500/30">
            <div className="text-[11px] text-emerald-400 font-semibold">Lower BB (Put Strike Target)</div>
            <div className="text-lg font-black font-mono text-emerald-400 mt-0.5">
              ${lowerBb.toFixed(2)}
            </div>
            <div className="text-[10px] text-emerald-300">+{putCushionPct}% downside cushion</div>
          </div>

          <div className="bg-slate-950/70 p-2.5 rounded-lg border border-cyan-500/30">
            <div className="text-[11px] text-cyan-400 font-semibold">Upper BB (Call Strike Target)</div>
            <div className="text-lg font-black font-mono text-cyan-400 mt-0.5">
              ${upperBb.toFixed(2)}
            </div>
            <div className="text-[10px] text-cyan-300">+{callUpsidePct}% upside room</div>
          </div>

          <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800">
            <div className="text-[11px] text-slate-400">14-Day RSI</div>
            <div
              className={`text-lg font-black font-mono mt-0.5 ${
                rsi14 < 30
                  ? 'text-emerald-400'
                  : rsi14 > 70
                  ? 'text-rose-400'
                  : 'text-white'
              }`}
            >
              {rsi14}
            </div>
            <div className="text-[10px] text-slate-500">
              {ticker.rsi_14 < 30
                ? 'Oversold Dip'
                : ticker.rsi_14 > 70
                ? 'Overbought'
                : 'Neutral Zone'}
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 4: Barchart 13-Indicator Opinion & Top 1% Signal Strength */}
      {barchartOpinion && (
        <BarchartOpinionCard opinion={barchartOpinion} />
      )}

      {/* SECTION 4.1: MarketChameleon Quantitative Pattern & Stock Ideas */}
      {(() => {
        const mc = intel.marketChameleon || calculateMarketChameleonPattern(ticker);
        return (
          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
              <div className="flex items-center space-x-2">
                <span className="text-lg">🦎</span>
                <div>
                  <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                    <span>MarketChameleon Quantitative Pattern &amp; Stock Ideas</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      MA Rule Engine
                    </span>
                  </h3>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Moving Average Engine (SMA 20/50/250) • Momentum &amp; Reversal Classifications
                  </div>
                </div>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                {mc.stock_ideas_category}
              </span>
            </div>

            {/* Active Technical Pattern Badges */}
            <div className="flex flex-wrap gap-1.5">
              {mc.technical_flags.map((flag: string, idx: number) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-950 border border-emerald-500/40 text-emerald-300 font-mono shadow-sm flex items-center gap-1.5"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>{flag}</span>
                </span>
              ))}
              {mc.is_momentum_stock && (
                <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-950/60 border border-amber-500/40 text-amber-300 font-mono flex items-center gap-1">
                  <span>🔥 Momentum Stock</span>
                </span>
              )}
            </div>

            {/* Moving Average Gaps Grid */}
            <div className="grid grid-cols-3 gap-2 pt-1 text-center">
              <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase font-mono">Price vs SMA 20</div>
                <div className={`text-sm font-bold font-mono mt-0.5 ${mc.moving_average_gaps.price_vs_sma20 >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {mc.moving_average_gaps.price_vs_sma20 >= 0 ? '+' : ''}{mc.moving_average_gaps.price_vs_sma20}%
                </div>
                <div className="text-[9px] text-slate-500 font-mono">SMA 20: ${mc.sma_20.toFixed(2)}</div>
              </div>

              <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase font-mono">SMA 20 vs SMA 50</div>
                <div className={`text-sm font-bold font-mono mt-0.5 ${mc.moving_average_gaps.sma20_vs_sma50 >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {mc.moving_average_gaps.sma20_vs_sma50 >= 0 ? '+' : ''}{mc.moving_average_gaps.sma20_vs_sma50}%
                </div>
                <div className="text-[9px] text-slate-500 font-mono">SMA 50: ${mc.sma_50.toFixed(2)}</div>
              </div>

              <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase font-mono">SMA 50 vs SMA 250</div>
                <div className={`text-sm font-bold font-mono mt-0.5 ${mc.moving_average_gaps.sma50_vs_sma250 >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {mc.moving_average_gaps.sma50_vs_sma250 >= 0 ? '+' : ''}{mc.moving_average_gaps.sma50_vs_sma250}%
                </div>
                <div className="text-[9px] text-slate-500 font-mono">SMA 250: ${mc.sma_250.toFixed(2)}</div>
              </div>
            </div>

            {/* Aligned Options Strategy Allocation */}
            <div className="p-2.5 bg-slate-950/60 rounded-lg border border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="text-slate-400 font-medium">MarketChameleon Strategy Alignment:</span>
              <div className="flex flex-wrap gap-1.5 font-mono text-[11px]">
                {mc.aligned_strategies.map((strat: string, sIdx: number) => (
                  <span key={sIdx} className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                    {strat}
                  </span>
                ))}
              </div>
            </div>
          </div>
        );
      })()}

      {/* SECTION 6: Recent News Stories & Volatility Drivers */}
      <NewsCompactFeed
        ticker={ticker.symbol}
        limit={5}
        onViewAllNews={onViewNewsAnalyst}
      />

      {/* SECTION 7: Proposed Strategy */}
      <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-3">
        <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-emerald-400" />
          <span>
            Part 4: Proposed {ticker.has_weeklys === false ? 'Monthly-Adjusted' : 'Weekly'} Strategy (
            {ticker.has_weeklys === false
              ? `${ticker.days_to_nearest_expiration ?? ticker.target_dte ?? 20}d Monthly Target`
              : '3–7 DTE Targeting ~0.15–0.20 Delta'}
            )
          </span>
        </h3>

        {ticker.has_weeklys === false && (
          <div className="p-3.5 bg-amber-950/40 border border-amber-500/50 rounded-xl text-xs text-amber-200 flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-amber-300">Monthly Expiration Only - Adjusted DTE</div>
              <div className="mt-0.5 text-slate-300 leading-relaxed">
                ⚠️ This ticker does not trade weekly options. The nearest available expiration is{' '}
                <strong className="text-white font-mono">{ticker.nearest_expiration_date || ticker.target_exp || 'Monthly'}</strong>{' '}
                ({ticker.days_to_nearest_expiration ?? ticker.target_dte ?? '?'} DTE). Premium decay (theta) will follow a monthly cycle.
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Cash-Secured Put Play */}
          <div className="bg-slate-950/80 p-3.5 rounded-xl border border-emerald-500/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                <span>Cash-Secured Put (CSP)</span>
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300">
                ≤ Lower BB Target
              </span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-400">Recommended Strike:</span>
              <span className="font-bold font-mono text-white">${putStrikeTarget.toFixed(1)}</span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-400">Safety Cushion to Spot:</span>
              <span className="font-mono text-emerald-400">+{putCushionPct}% buffer</span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-400">Collateral Required (1 ct):</span>
              <span className="font-mono text-amber-300">${putCollateral.toLocaleString()}</span>
            </div>

            <div className="flex justify-between py-1">
              <span className="text-slate-400">Est. Cash Income (Weekly):</span>
              <span className="font-bold font-mono text-emerald-400">+${estimatedWeeklyPutPremium}</span>
            </div>

            {onOpenSimulator && (
              <button
                type="button"
                onClick={() => onOpenSimulator(ticker.symbol)}
                className="w-full mt-2 py-1.5 px-3 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 text-xs font-semibold rounded-lg border border-emerald-500/30 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Simulate Put Strike in Simulator</span>
              </button>
            )}
          </div>

          {/* Covered Call Play */}
          <div className="bg-slate-950/80 p-3.5 rounded-xl border border-cyan-500/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-cyan-400 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4" />
                <span>Covered Call (CC)</span>
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-300">
                ≥ Upper BB Target
              </span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-400">Recommended Strike:</span>
              <span className="font-bold font-mono text-white">
                ${bestCC ? bestCC.strike.toFixed(1) : Math.ceil(upperBb).toFixed(1)}
              </span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-400">Upside Run Room:</span>
              <span className="font-mono text-cyan-400">+{callUpsidePct}% headroom</span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-400">Shares Required (1 ct):</span>
              <span className="font-mono text-slate-200">100 Shares (${(spotPrice * 100).toLocaleString()})</span>
            </div>

            <div className="flex justify-between py-1">
              <span className="text-slate-400">Est. Cash Income (Weekly):</span>
              <span className="font-bold font-mono text-cyan-400">
                +${bestCC ? bestCC.premium_total : Math.round(spotPrice * (ivCurrent / 100) * 0.12 * 100)}
              </span>
            </div>

            {onOpenSimulator && (
              <button
                type="button"
                onClick={() => onOpenSimulator(ticker.symbol)}
                className="w-full mt-2 py-1.5 px-3 bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 text-xs font-semibold rounded-lg border border-cyan-500/30 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Simulate Call Strike in Simulator</span>
              </button>
            )}
          </div>

          {onOpenSimulator && (
            <div className="sm:col-span-2 bg-gradient-to-r from-blue-950/40 via-indigo-950/40 to-slate-900/60 p-3 rounded-xl border border-blue-500/30 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-2">
                    <span>Options Strike Calculator &amp; Trade Simulator</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 bg-blue-500/20 text-blue-300 rounded border border-blue-500/30">
                      {ticker.symbol} Preloaded
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Model custom Delta strikes (0.10–0.40), expiration cycles, POP, and simulated P&amp;L curves.
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onOpenSimulator(ticker.symbol)}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Calculate Strikes ({ticker.symbol}) &rarr;</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* SECTION 8: Risk Mitigation */}
      <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-3">
        <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-amber-400" />
          <span>Part 5: Institutional Risk Mitigation &amp; Assignment Plan</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-slate-950/80 p-3 rounded-lg border border-emerald-500/20">
            <div className="flex items-center space-x-1.5 text-emerald-400 font-bold mb-1">
              <CheckCircle2 className="w-4 h-4" />
              <span>80% Profit BTC Trigger</span>
            </div>
            <p className="text-[11px] text-slate-300">
              When 80% of max upfront premium is captured, <strong>Buy-to-Close (BTC)</strong> immediately. Do not risk weekend gap events.
            </p>
          </div>

          <div className="bg-slate-950/80 p-3 rounded-lg border border-amber-500/20">
            <div className="flex items-center space-x-1.5 text-amber-400 font-bold mb-1">
              <AlertTriangle className="w-4 h-4" />
              <span>0.50 Delta Roll Trigger</span>
            </div>
            <p className="text-[11px] text-slate-300">
              If the underlying reaches <strong>0.50 Delta (ATM)</strong>, roll out 1–2 weeks for credit or prepare for assignment at breakeven.
            </p>
          </div>

          <div className="bg-slate-950/80 p-3 rounded-lg border border-cyan-500/20">
            <div className="flex items-center space-x-1.5 text-cyan-400 font-bold mb-1">
              <DollarSign className="w-4 h-4" />
              <span>5% Portfolio Cap</span>
            </div>
            <p className="text-[11px] text-slate-300">
              Never allocate more than <strong>5% of total liquid collateral</strong> to any single underlying name.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
