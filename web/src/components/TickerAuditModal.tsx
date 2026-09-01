import React, { useState, useMemo } from 'react';
import {
  X,
  ShieldCheck,
  ShieldAlert,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Activity,
  Flame,
  Layers,
  ArrowRight,
  Award,
  Newspaper,
  Building,
  ExternalLink,
  Target,
  BarChart2,
  MessageSquare,
} from './icons';
import { TickerMeta, OptionOpportunity } from '../types/options';
import { InteractiveChart } from './InteractiveChart';
import { getSecurityIntelligence } from '../utils/securityIntelligence';
import { AnalystPriceTargetBar } from './AnalystPriceTargetBar';
import { PredictionMarketCards } from './PredictionMarketCards';
import { SocialSentimentGauge } from './SocialSentimentGauge';

type TickerDetailTab = 'OPTIONS_TECH' | 'NEWS_ANALYST' | 'PREDICTION_MARKETS' | 'SOCIAL_SENTIMENT';

interface TickerAuditModalProps {
  ticker: TickerMeta | null;
  opportunities: OptionOpportunity[];
  onClose: () => void;
}

export const TickerAuditModal: React.FC<TickerAuditModalProps> = ({
  ticker,
  opportunities,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<TickerDetailTab>('OPTIONS_TECH');
  const intel = useMemo(() => getSecurityIntelligence(ticker?.symbol || 'ASSET', ticker || undefined), [ticker]);

  if (!ticker) return null;

  const liquidityTier = ticker.liquidity_tier || 'Tier 2/3 (Moderate)';
  const isTier1 = liquidityTier.includes('Tier 1');
  const isTier4 = liquidityTier.includes('Tier 4');

  const spotPrice = typeof ticker.spot_price === 'number' && !isNaN(ticker.spot_price) && ticker.spot_price > 0 ? ticker.spot_price : 100.0;
  const lowerBb = typeof ticker.lower_bb === 'number' && !isNaN(ticker.lower_bb) ? ticker.lower_bb : spotPrice * 0.93;
  const upperBb = typeof ticker.upper_bb === 'number' && !isNaN(ticker.upper_bb) ? ticker.upper_bb : spotPrice * 1.07;
  const sma20 = typeof ticker.sma_20 === 'number' && !isNaN(ticker.sma_20) ? ticker.sma_20 : spotPrice;
  const rsi14 = typeof ticker.rsi_14 === 'number' && !isNaN(ticker.rsi_14) ? ticker.rsi_14 : 50;
  const ivCurrent = typeof ticker.iv_current === 'number' && !isNaN(ticker.iv_current) ? ticker.iv_current : 25.0;
  const hv30 = typeof ticker.hv_30 === 'number' && !isNaN(ticker.hv_30) ? ticker.hv_30 : 25.0;
  const ivRank = typeof ticker.iv_rank === 'number' && !isNaN(ticker.iv_rank) ? ticker.iv_rank : 35;
  const avgVolume30 = typeof ticker.avg_volume_30 === 'number' && !isNaN(ticker.avg_volume_30) ? ticker.avg_volume_30 : 1000000;

  // Put Cushion % to Lower BB
  const putCushionPct = spotPrice > 0 ? (((spotPrice - lowerBb) / spotPrice) * 100).toFixed(1) : '7.0';
  const callUpsidePct = spotPrice > 0 ? (((upperBb - spotPrice) / spotPrice) * 100).toFixed(1) : '7.0';

  // Associated option opportunities for this ticker
  const tickerOpps = (opportunities || []).filter((o) => o?.symbol === ticker?.symbol);
  const bestCSP = tickerOpps.find((o) => o.strategy === 'CSP') || null;
  const bestCC = tickerOpps.find((o) => o.strategy === 'CC') || null;

  // Merge context data from ticker meta or fallback
  const analystTargets = ticker.analyst_intelligence || intel.analystTargets;
  const corporateActions = ticker.corporate_actions || intel.corporateActions;
  const predictionMarkets = ticker.prediction_markets || intel.predictionMarkets || [];
  const socialSentiment = ticker.social_sentiment || intel.socialSentiment;

  // Assignment collateral for 1 put contract at Lower BB
  const putStrikeTarget = bestCSP ? bestCSP.strike : Math.max(1, Math.floor(lowerBb));
  const putCollateral = putStrikeTarget * 100;
  const estimatedWeeklyPutPremium = bestCSP ? bestCSP.premium_total : Math.round(putStrikeTarget * (ivCurrent / 100) * 0.12 * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="glass-panel w-full max-w-4xl rounded-2xl border border-slate-700/80 shadow-2xl overflow-hidden text-slate-200 flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <div className="flex items-center space-x-3.5">
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-white shadow-md ${
                isTier4
                  ? 'bg-rose-600 shadow-rose-600/30'
                  : isTier1
                  ? 'bg-emerald-600 shadow-emerald-600/30'
                  : 'bg-cyan-600 shadow-cyan-600/30'
              }`}
            >
              {isTier4 ? <ShieldAlert className="w-6 h-6" /> : <ShieldCheck className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center space-x-2.5">
                <span className="text-2xl font-black font-mono text-white tracking-tight">
                  {ticker.symbol}
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-md bg-slate-800 text-slate-300 font-medium">
                  ${spotPrice.toFixed(2)}
                </span>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-md font-semibold border ${
                    isTier1
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : isTier4
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                      : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                  }`}
                >
                  {liquidityTier}
                </span>
                {ticker.earnings_within_7d && (
                  <span className="text-xs px-2 py-0.5 rounded-md font-bold bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse">
                    Earnings ≤7d
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {ticker.name || ticker.symbol} • {ticker.sector || 'Equities'} • Comprehensive AI Intelligence &amp; Options Audit
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* AI Composite Score Ribbon */}
            <div className="hidden sm:flex items-center space-x-3 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800">
              <div className="text-right">
                <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">AI Composite Score</div>
                <div className="text-xs font-bold text-slate-200">{intel.sentimentLabel}</div>
              </div>
              <div className={`px-2.5 py-1 rounded-lg font-black font-mono text-sm border flex items-center gap-1 ${
                intel.compositeScore >= 85
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : intel.compositeScore >= 75
                  ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              }`}>
                <Award className="w-4 h-4" />
                <span>{intel.compositeScore}/100</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation Selector */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 px-6 overflow-x-auto gap-2">
          <button
            onClick={() => setActiveTab('OPTIONS_TECH')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'OPTIONS_TECH'
                ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>🎯 Options &amp; Technicals</span>
          </button>

          <button
            onClick={() => setActiveTab('NEWS_ANALYST')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'NEWS_ANALYST'
                ? 'border-blue-500 text-blue-400 bg-blue-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>📰 News &amp; Analyst Consensus</span>
          </button>

          <button
            onClick={() => setActiveTab('PREDICTION_MARKETS')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'PREDICTION_MARKETS'
                ? 'border-cyan-500 text-cyan-400 bg-cyan-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>🎲 Prediction Markets</span>
            {predictionMarkets.length > 0 && (
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-cyan-500/20 text-cyan-300">
                {predictionMarkets.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('SOCIAL_SENTIMENT')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'SOCIAL_SENTIMENT'
                ? 'border-amber-500 text-amber-400 bg-amber-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>💬 Social &amp; Forum Sentiment</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs max-h-[75vh]">
          {/* TAB 1: OPTIONS STRATEGY & TECHNICALS */}
          {activeTab === 'OPTIONS_TECH' && (
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

              {/* SECTION 3: Technical Boundaries */}
              <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-4">
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-400" />
                  <span>Part 3: Technical Boundaries, Bollinger Envelope &amp; Interactive Chart</span>
                </h3>

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
                  </div>
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
          )}

          {/* TAB 2: NEWS & ANALYST CONSENSUS */}
          {activeTab === 'NEWS_ANALYST' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Wall Street Price Target Visualizer */}
              {analystTargets && (
                <AnalystPriceTargetBar
                  currentPrice={spotPrice}
                  targets={analystTargets}
                  currencySymbol="$"
                />
              )}

              {/* Corporate Financial Ratios */}
              {corporateActions && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
                    <span className="text-xs text-slate-400 block">Dividend Yield</span>
                    <span className="text-sm font-semibold font-mono text-emerald-400 mt-0.5 block">
                      {corporateActions.dividend_yield
                        ? `${(corporateActions.dividend_yield * 100).toFixed(2)}%`
                        : 'N/A'}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
                    <span className="text-xs text-slate-400 block">Payout Ratio</span>
                    <span className="text-sm font-semibold font-mono text-slate-200 mt-0.5 block">
                      {corporateActions.payout_ratio
                        ? `${(corporateActions.payout_ratio * 100).toFixed(1)}%`
                        : 'N/A'}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
                    <span className="text-xs text-slate-400 block">Trailing P/E</span>
                    <span className="text-sm font-semibold font-mono text-slate-200 mt-0.5 block">
                      {corporateActions.trailing_pe ? corporateActions.trailing_pe.toFixed(1) : 'N/A'}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
                    <span className="text-xs text-slate-400 block">Forward P/E</span>
                    <span className="text-sm font-semibold font-mono text-slate-200 mt-0.5 block">
                      {corporateActions.forward_pe ? corporateActions.forward_pe.toFixed(1) : 'N/A'}
                    </span>
                  </div>
                </div>
              )}

              {/* AI Factor Scores Grid */}
              <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-400" />
                    <span>AI Decision Factor Rating</span>
                  </h3>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                    Consensus: <strong className="text-emerald-400">{intel.analystConsensus}</strong>
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                    <div className="text-[11px] text-slate-400">Technical Momentum</div>
                    <div className="text-xl font-black font-mono text-blue-400 mt-1">
                      {intel.technicalScore} / 100
                    </div>
                  </div>

                  <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                    <div className="text-[11px] text-slate-400">Fundamental Solvency</div>
                    <div className="text-xl font-black font-mono text-emerald-400 mt-1">
                      {intel.fundamentalScore} / 100
                    </div>
                  </div>

                  <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                    <div className="text-[11px] text-slate-400">Liquidity &amp; Depth</div>
                    <div className="text-xl font-black font-mono text-cyan-400 mt-1">
                      {intel.liquidityScore} / 100
                    </div>
                  </div>

                  <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                    <div className="text-[11px] text-slate-400">Volatility Edge</div>
                    <div className="text-xl font-black font-mono text-amber-400 mt-1">
                      {intel.volatilityEdgeScore} / 100
                    </div>
                  </div>
                </div>
              </div>

              {/* News Catalyst Feed */}
              <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                    <Newspaper className="w-4 h-4 text-blue-400" />
                    <span>Recent News Stories &amp; Volatility Drivers</span>
                  </h3>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {(intel.recentNews || []).length} verified news items
                  </span>
                </div>

                <div className="space-y-3">
                  {(intel.recentNews || []).map((item) => (
                    <div
                      key={item.id}
                      className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80 hover:border-slate-700 transition-colors space-y-2"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                            {item.category}
                          </span>
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                              item.sentiment === 'Bullish' || item.sentiment === 'Strong Bullish'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                : item.sentiment === 'Neutral'
                                ? 'bg-slate-800 text-slate-300 border-slate-700'
                                : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                            }`}
                          >
                            {item.sentiment}
                          </span>
                          <span className="text-slate-500 text-[11px] font-mono">{item.source}</span>
                        </div>
                        <span className="text-slate-500 text-[11px] font-mono">{item.timeAgo}</span>
                      </div>

                      <h4 className="text-xs font-bold text-white leading-snug">{item.headline}</h4>
                      <p className="text-[11px] text-slate-300 leading-relaxed">{item.summary}</p>

                      <div className="p-2.5 rounded-lg bg-indigo-950/30 border border-indigo-500/30 text-[11px] text-indigo-200 flex items-start gap-2">
                        <Flame className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                        <span>
                          <strong className="text-indigo-300">Options Catalyst:</strong> {item.optionsImplication}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Institutional 13F Ownership & SEC EDGAR */}
              <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                    <Building className="w-4 h-4 text-emerald-400" />
                    <span>Institutional 13F Ownership &amp; SEC EDGAR Disclosures</span>
                  </h3>
                  <a
                    href={intel.secEdgarUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 font-mono text-[10px] flex items-center space-x-1 transition-colors"
                  >
                    <span>SEC EDGAR Filings</span>
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                  </a>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-slate-400 text-[11px]">
                      <span>Total Institutional Float:</span>
                      <span className="font-bold font-mono text-emerald-400 text-sm">
                        {intel.institutionalOwnershipPct}%
                      </span>
                    </div>
                    <div className="border-t border-slate-800/80 pt-1.5 space-y-1">
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">
                        Top 13F Asset Managers:
                      </span>
                      {(intel.topHolders || []).map((holder, idx) => (
                        <div key={idx} className="flex items-center justify-between text-[11px] py-0.5">
                          <span className="text-slate-300 truncate max-w-[200px]">{holder.name}</span>
                          <span className="font-mono text-slate-400">{holder.stakePct}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 space-y-2">
                    <div className="text-slate-400 text-[11px]">Latest Regulatory Disclosure:</div>
                    <div className="flex items-center justify-between bg-slate-900 p-2 rounded-lg border border-slate-800 font-mono text-xs">
                      <span className="font-bold text-white">Form {intel.latestFilingType}</span>
                      <span className="text-slate-400">Filed: {intel.latestFilingDate}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-relaxed">
                      Audited financial statements and corporate filings from SEC EDGAR.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PREDICTION MARKETS */}
          {activeTab === 'PREDICTION_MARKETS' && (
            <div className="animate-in fade-in duration-150">
              <PredictionMarketCards events={predictionMarkets} />
            </div>
          )}

          {/* TAB 4: SOCIAL & FORUM SENTIMENT */}
          {activeTab === 'SOCIAL_SENTIMENT' && (
            <div className="animate-in fade-in duration-150">
              <SocialSentimentGauge sentiment={socialSentiment} />
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-[11px] text-slate-400">
            <HelpCircle className="w-4 h-4 text-slate-500" />
            <span>Black-Scholes Mathematical Modeling • Bollinger Band (2 SD) Strike Envelope</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition-colors"
          >
            Close Audit
          </button>
        </div>
      </div>
    </div>
  );
};
