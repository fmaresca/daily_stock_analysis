import React from 'react';
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
} from './icons';
import { TickerMeta, OptionOpportunity } from '../types/options';
import { InteractiveChart } from './InteractiveChart';

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
  if (!ticker) return null;

  const isTier1 = ticker.liquidity_tier.includes('Tier 1');
  const isTier4 = ticker.liquidity_tier.includes('Tier 4');

  // Put Cushion % to Lower BB
  const putCushionPct = (((ticker.spot_price - ticker.lower_bb) / ticker.spot_price) * 100).toFixed(1);
  const callUpsidePct = (((ticker.upper_bb - ticker.spot_price) / ticker.spot_price) * 100).toFixed(1);

  // Associated option opportunities for this ticker
  const tickerOpps = opportunities.filter((o) => o.symbol === ticker.symbol);
  const bestCSP = tickerOpps.find((o) => o.strategy === 'CSP') || null;
  const bestCC = tickerOpps.find((o) => o.strategy === 'CC') || null;

  // Assignment collateral for 1 put contract at Lower BB
  const putStrikeTarget = bestCSP ? bestCSP.strike : Math.floor(ticker.lower_bb);
  const putCollateral = putStrikeTarget * 100;
  const estimatedWeeklyPutPremium = bestCSP ? bestCSP.premium_total : Math.round(putStrikeTarget * (ticker.iv_current / 100) * 0.12 * 100);

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
                  ${ticker.spot_price.toFixed(2)}
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
                  {ticker.liquidity_tier}
                </span>
                {ticker.earnings_within_7d && (
                  <span className="text-xs px-2 py-0.5 rounded-md font-bold bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse">
                    Earnings ≤7d
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {ticker.name} • {ticker.sector} • Comprehensive 5-Part Options & Volatility Audit
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body: The 5-Part Audit */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs">
          {/* SECTION 1: Volatility Profile */}
          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Flame className="w-4 h-4 text-emerald-400" />
                <span>Part 1: Volatility Profile &amp; Earnings Risk</span>
              </h3>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                  ticker.iv_rank >= 45
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}
              >
                {ticker.iv_rank >= 45 ? 'ELEVATED PREMIUM (IVR ≥ 45%)' : 'COMPRESSED PREMIUM (IVR < 45%)'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800">
                <div className="text-[11px] text-slate-400">52-Wk IV Rank (IVR)</div>
                <div className="text-xl font-black font-mono text-emerald-400 mt-0.5">
                  {ticker.iv_rank} / 100
                </div>
                <div className="text-[10px] text-slate-500">Relative volatility tier</div>
              </div>

              <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800">
                <div className="text-[11px] text-slate-400">Current Implied Vol (IV)</div>
                <div className="text-xl font-black font-mono text-cyan-400 mt-0.5">
                  {ticker.iv_current}%
                </div>
                <div className="text-[10px] text-slate-500">Option market pricing</div>
              </div>

              <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800">
                <div className="text-[11px] text-slate-400">30-Day Historical Vol (HV)</div>
                <div className="text-xl font-black font-mono text-white mt-0.5">
                  {ticker.hv_30}%
                </div>
                <div className="text-[10px] text-slate-500">Realized 30d price swings</div>
              </div>

              <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800">
                <div className="text-[11px] text-slate-400">Earnings Status</div>
                <div
                  className={`text-xl font-black font-mono mt-0.5 ${
                    ticker.earnings_within_7d ? 'text-rose-400' : 'text-emerald-400'
                  }`}
                >
                  {ticker.earnings_within_7d ? '⚠️ RISK' : 'CLEAR'}
                </div>
                <div className="text-[10px] text-slate-500">
                  {ticker.next_earnings_date !== 'N/A' ? ticker.next_earnings_date : 'No earnings near'}
                </div>
              </div>
            </div>

            {ticker.earnings_within_7d && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-400" />
                <span>
                  <strong>Earnings Alert:</strong> Earnings are expected within 7 days. Selling weekly options during earnings carries severe binary gap risk and potential post-announcement IV crush. Consider waiting until after the report.
                </span>
              </div>
            )}
          </div>

          {/* SECTION 2: Liquidity & Slippage Audit */}
          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-3">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <span>Part 2: Liquidity &amp; Slippage Audit</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800">
                <div className="text-[11px] text-slate-400">Liquidity Tier Rating</div>
                <div className="text-sm font-bold font-mono text-white mt-1">
                  {ticker.liquidity_tier}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  {isTier1
                    ? 'Penny-wide bid/ask spreads. Frictionless entries.'
                    : isTier4
                    ? 'Wide spreads ($0.10–$0.50). High slippage risk.'
                    : 'Standard retail options liquidity.'}
                </p>
              </div>

              <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800">
                <div className="text-[11px] text-slate-400">Options Cadence (CBOE)</div>
                <div className={`text-sm font-bold font-mono mt-1 ${ticker.has_weeklys === false ? 'text-amber-300' : 'text-emerald-400'}`}>
                  {ticker.options_cadence || (ticker.has_weeklys === false ? 'Monthly Only' : 'Weekly')}
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
                  {ticker.avg_volume_30.toLocaleString()} shares
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
                  ${ticker.sma_20.toFixed(2)}
                </div>
                <div className="text-[10px] text-slate-500">Mean regression line</div>
              </div>

              <div className="bg-slate-950/70 p-2.5 rounded-lg border border-emerald-500/30">
                <div className="text-[11px] text-emerald-400 font-semibold">Lower BB (Put Strike Target)</div>
                <div className="text-lg font-black font-mono text-emerald-400 mt-0.5">
                  ${ticker.lower_bb.toFixed(2)}
                </div>
                <div className="text-[10px] text-emerald-300">+{putCushionPct}% downside cushion</div>
              </div>

              <div className="bg-slate-950/70 p-2.5 rounded-lg border border-cyan-500/30">
                <div className="text-[11px] text-cyan-400 font-semibold">Upper BB (Call Strike Target)</div>
                <div className="text-lg font-black font-mono text-cyan-400 mt-0.5">
                  ${ticker.upper_bb.toFixed(2)}
                </div>
                <div className="text-[10px] text-cyan-300">+{callUpsidePct}% upside room</div>
              </div>

              <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800">
                <div className="text-[11px] text-slate-400">14-Day RSI</div>
                <div
                  className={`text-lg font-black font-mono mt-0.5 ${
                    ticker.rsi_14 < 30
                      ? 'text-emerald-400'
                      : ticker.rsi_14 > 70
                      ? 'text-rose-400'
                      : 'text-white'
                  }`}
                >
                  {ticker.rsi_14}
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

          {/* SECTION 4: Proposed Weekly Strategy */}
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
                    ${bestCC ? bestCC.strike.toFixed(1) : Math.ceil(ticker.upper_bb).toFixed(1)}
                  </span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Upside Run Room:</span>
                  <span className="font-mono text-cyan-400">+{callUpsidePct}% headroom</span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Shares Required (1 ct):</span>
                  <span className="font-mono text-slate-200">100 Shares (${(ticker.spot_price * 100).toLocaleString()})</span>
                </div>

                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Est. Cash Income (Weekly):</span>
                  <span className="font-bold font-mono text-cyan-400">
                    +${bestCC ? bestCC.premium_total : Math.round(ticker.spot_price * (ticker.iv_current / 100) * 0.12 * 100)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 5: Risk Mitigation & Assignment Plan */}
          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-3">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>Part 5: Institutional Risk Mitigation &amp; Assignment Plan</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Trigger 1: 80% Profit Rule */}
              <div className="bg-slate-950/80 p-3 rounded-lg border border-emerald-500/20">
                <div className="flex items-center space-x-1.5 text-emerald-400 font-bold mb-1">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>80% Profit BTC Trigger</span>
                </div>
                <p className="text-[11px] text-slate-300">
                  When 80% of max upfront premium is captured (e.g. option value drops to 20% of sale price), 
                  <strong> Buy-to-Close (BTC)</strong> immediately. Do not risk weekend gap events for the final pennies.
                </p>
              </div>

              {/* Trigger 2: 0.50 Delta Roll Trigger */}
              <div className="bg-slate-950/80 p-3 rounded-lg border border-amber-500/20">
                <div className="flex items-center space-x-1.5 text-amber-400 font-bold mb-1">
                  <AlertTriangle className="w-4 h-4" />
                  <span>0.50 Delta Roll Trigger</span>
                </div>
                <p className="text-[11px] text-slate-300">
                  If the underlying breaches support and the option reaches <strong>0.50 Delta (At-The-Money)</strong>, 
                  roll out 1–2 weeks in time for an additional net credit, or prepare to accept assignment at the discounted breakeven price.
                </p>
              </div>

              {/* Trigger 3: Collateral Management */}
              <div className="bg-slate-950/80 p-3 rounded-lg border border-cyan-500/20">
                <div className="flex items-center space-x-1.5 text-cyan-400 font-bold mb-1">
                  <DollarSign className="w-4 h-4" />
                  <span>5% Portfolio Cap</span>
                </div>
                <p className="text-[11px] text-slate-300">
                  Never allocate more than <strong>5% of total liquid portfolio collateral</strong> to any single underlying name. 
                  Diversify across Tier 1 index ETFs and defensive mega-caps.
                </p>
              </div>
            </div>
          </div>
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
