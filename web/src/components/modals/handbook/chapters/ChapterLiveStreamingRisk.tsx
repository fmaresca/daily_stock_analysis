import React from 'react';
import { DirectActionBanner } from './DirectActionBanner';
import { Zap, ShieldCheck, Activity, ShieldAlert } from '../../../icons';
import { MenuTreeType, EquitiesTabType, OptionsTabType } from '../../../../types/options';

export interface ChapterLiveStreamingRiskProps {
  onNavigate?: (tree: MenuTreeType, optionsTab?: OptionsTabType, equitiesTab?: EquitiesTabType) => void;
  onOpenAlerts?: () => void;
}

export const ChapterLiveStreamingRisk: React.FC<ChapterLiveStreamingRiskProps> = ({
  onNavigate,
  onOpenAlerts,
}) => {
  return (
    <div className="space-y-6">
      <div className="border-l-2 border-rose-500 pl-4 py-1">
        <h3 className="text-base font-bold text-white">Live API Streaming, FastAPI Backend &amp; Quantitative Risk Circuit-Breakers</h3>
        <p className="text-slate-400 mt-1">
          How the system fetches real-time data, calculates high-precision Greeks, and enforces portfolio-level safety gates before you place any order.
        </p>
      </div>

      <DirectActionBanner
        actions={[
          {
            label: 'Executive Portfolio Digest',
            location: 'Options > Executive Digest',
            onClick: () => onNavigate?.('OPTIONS', 'EXECUTIVE_DIGEST'),
          },
          {
            label: 'Risk Alert Settings & Thresholds',
            location: 'Modal: Alert Settings',
            onClick: onOpenAlerts,
          },
        ]}
      />

      {/* Live Data Architecture */}
      <div className="bg-slate-950/70 p-4 rounded-xl border border-blue-500/30 space-y-3">
        <div className="flex items-center space-x-2 text-blue-400 font-bold text-xs">
          <Zap className="w-4 h-4" />
          <span>FastAPI Live Snapshot &amp; WebSocket Stream</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
            <div className="font-bold text-white">REST Snapshot: <code className="text-slate-400">/api/v1/options/snapshot</code></div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              When the FastAPI backend is running (<code>python main.py --serve</code>), the Web UI fetches a live enriched options snapshot via REST. This includes real IV rank, current Greeks, and latest news context directly from market data providers.
            </p>
          </div>
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
            <div className="font-bold text-cyan-400">WebSocket Stream: <code className="text-slate-400">/api/v1/ws/stream</code></div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              A persistent WebSocket connection pushes real-time option chain updates to the UI. When disconnected (backend offline), the UI automatically falls back to the last cached local JSON snapshot — no hard crash.
            </p>
          </div>
        </div>
      </div>

      {/* Tradier Primary API Architecture */}
      <div className="bg-slate-950/70 p-4 rounded-xl border border-emerald-500/40 space-y-2">
        <div className="flex items-center space-x-2 text-emerald-400 font-bold text-xs">
          <Zap className="w-4 h-4" />
          <span>Tradier API — Primary Real-Time Market Data &amp; Options Provider</span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-700/50">Primary</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          DeltaHarvest utilizes <strong>Tradier API</strong> as the primary engine for real-time NBBO equity quotes and live option chains with institutional Greeks. Tradier provides native CORS support (<code className="text-emerald-300 bg-emerald-950/60 px-1 rounded">Access-Control-Allow-Origin: *</code>), enabling zero-latency client-side streaming on Cloudflare Pages without requiring proxy servers.
        </p>
        <div className="text-[11px] text-slate-400 space-y-1 pt-1 border-t border-slate-800">
          <div className="flex items-center gap-1.5 text-emerald-300 font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Privacy &amp; Security Architecture:</span>
          </div>
          <p>
            Your Tradier API Key is kept <strong>strictly private</strong>. It is masked by default with bullet dots in the settings modal and stored exclusively in private client-side <code className="text-slate-300">localStorage</code> or local gitignored <code className="text-slate-300">.env</code>. It is never committed to GitHub or exposed in public deployments.
          </p>
          <p>
            <strong>Automatic Failover:</strong> If Tradier is offline or unconfigured, the system automatically falls back to <strong>Charles Schwab Retail Trader API</strong> (secondary fallback) and Yahoo Finance / CBOE directory snapshots.
          </p>
          <p>
            <strong>Cloudflare Edge Market Price Proxy:</strong> When deployed on Cloudflare Pages, requests to <code className="text-emerald-300 bg-emerald-950/60 px-1 rounded">/api/market-price</code> run directly on edge worker functions with zero CORS restrictions. The edge proxy queries broker-grade Tradier NBBO quotes and historical bars first, and falls back to server-side Yahoo Finance edge fetches, delivering lightning-fast price convergence to the browser.
          </p>
        </div>
      </div>

      {/* Automated Live Sync Frequency & Rate Limits */}
      <div className="bg-slate-950/70 p-4 rounded-xl border border-sky-500/40 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-sky-400 font-bold text-xs">
            <Zap className="w-4 h-4" />
            <span>Automated Live Sync Frequency &amp; API Block Prevention Architecture</span>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-950/80 text-sky-300 border border-sky-800/60">
            Safe Limit: &le;2,000 reqs/hr
          </span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          To keep your options chain, Bollinger Bands, and RSI-14 indicators continuously updated without ever risking an external API ban or HTTP 429 throttling lockout, DeltaHarvest incorporates quantitative rate-limit budgeting:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
          <div className="p-2.5 rounded-lg bg-slate-900 border border-emerald-500/30">
            <div className="font-bold text-emerald-400 flex items-center justify-between">
              <span>5 Min (Default)</span>
              <span className="text-[10px] text-emerald-300 font-mono">12.6% Quota</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              12 syncs/hr &times; 21 tickers = <strong>252 reqs/hr</strong> (1,638 reqs/day). Zero block risk. Recommended baseline for swing and income trading.
            </p>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-900 border border-blue-500/30">
            <div className="font-bold text-blue-400 flex items-center justify-between">
              <span>10 Min (Ultra-Safe)</span>
              <span className="text-[10px] text-blue-300 font-mono">6.3% Quota</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              6 syncs/hr &times; 21 tickers = <strong>126 reqs/hr</strong> (819 reqs/day). Minimum bandwidth overhead with 100% block-free resilience.
            </p>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-900 border border-amber-500/30">
            <div className="font-bold text-amber-400 flex items-center justify-between">
              <span>2 Min (Day-Trade)</span>
              <span className="text-[10px] text-amber-300 font-mono">31.5% Quota</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              30 syncs/hr &times; 21 tickers = <strong>630 reqs/hr</strong>. Rapid price discovery for volatile intraday sessions.
            </p>
          </div>
        </div>
        <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 text-[11px] text-slate-300 space-y-1">
          <div className="font-bold text-slate-200">🛡️ Built-in Anti-Blocking Safeguards:</div>
          <ul className="list-disc list-inside space-y-0.5 text-slate-400 pl-1">
            <li><strong>Market Hours Gating:</strong> Sync automatically pauses outside 9:30 AM – 4:00 PM US Eastern Time and on weekends when options prices do not update, saving over 4,000 unnecessary calls/day.</li>
            <li><strong>Rate-Limit Circuit-Breaker:</strong> If any upstream proxy returns HTTP 429, auto-sync halts and falls back to local cached snapshots to preserve IP reputation.</li>
            <li><strong>Batch Pacing:</strong> Outgoing requests are dispatched in staggered concurrency batches of 5 with 6.5s AbortSignal deadlines, preventing burst-limit trips.</li>
          </ul>
        </div>
      </div>

      {/* Automated API Self-Test Diagnostic Suite */}
      <div className="bg-slate-950/70 p-4 rounded-xl border border-emerald-500/40 space-y-3">
        <div className="flex items-center space-x-2 text-emerald-400 font-bold text-xs">
          <Activity className="w-4 h-4" />
          <span>Interactive API Self-Test &amp; Health Suite (Header → API Self-Test)</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          DeltaHarvest includes an integrated, zero-script <strong>Automated Self-Test Engine</strong> accessible anytime from the top navigation bar. In a single click, it sends live probe requests across all 4 system feeds:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
            <span className="font-bold text-blue-400">1. Charles Schwab Trader API:</span>
            <p className="text-[11px] text-slate-400 mt-0.5">Validates OAuth credentials, token expiration, and probes live NBBO quotes &amp; Greeks with millisecond latency measurement.</p>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
            <span className="font-bold text-emerald-400">2. Market Data &amp; Bollinger Engine:</span>
            <p className="text-[11px] text-slate-400 mt-0.5">Pings live tick streams, validating 20 SMA, 2-SD Bollinger Bands, and Blended 14-RSI calculations.</p>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
            <span className="font-bold text-cyan-400">3. Prediction Markets Oracle:</span>
            <p className="text-[11px] text-slate-400 mt-0.5">Probes Polymarket &amp; Manifold decentralized contract order books and verifies real-time probability resolution.</p>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
            <span className="font-bold text-amber-400">4. Social Sentiment NLP Pipeline:</span>
            <p className="text-[11px] text-slate-400 mt-0.5">Tests StockTwits message streams and Reddit WSB sentiment parsers, extracting live crowd volume rankings.</p>
          </div>
        </div>
      </div>

      {/* QuantLib Greeks */}
      <div className="bg-slate-950/70 p-4 rounded-xl border border-purple-500/30 space-y-3">
        <div className="flex items-center space-x-2 text-purple-400 font-bold text-xs">
          <Activity className="w-4 h-4" />
          <span>High-Precision Greeks Engine (BSM/BAW Analytical)</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
            <div className="font-bold text-white">Black-Scholes-Merton (European)</div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Used for index options (SPX, XSP) and European-style contracts. Delivers exact closed-form Delta, Gamma, Theta, Vega, and Rho. IV is solved by bisection on market price.
            </p>
          </div>
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
            <div className="font-bold text-amber-300">Barone-Adesi-Whaley (American)</div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Used for all equity options (SPY, NVDA, AAPL, etc.) that carry <strong>early exercise risk</strong>. The BAW model calculates an early exercise premium above BSM value. Deep in-the-money puts near ex-dividend dates are flagged with an early assignment probability score.
            </p>
          </div>
        </div>
      </div>

      {/* Risk Circuit-Breakers */}
      <div className="bg-slate-950/80 p-4 rounded-xl border border-rose-500/40 space-y-3">
        <div className="font-bold text-rose-300 text-xs uppercase tracking-wider flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-rose-400" />
          <span>Portfolio Risk Circuit-Breakers — Automatic Order Gates</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-slate-900 border border-rose-500/30 space-y-1">
            <div className="font-bold text-rose-300">Max Drawdown Halt</div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              If the portfolio's unrealized mark-to-market drawdown exceeds a configurable threshold (default: 15%), the circuit-breaker blocks all new order staging and raises a visible red alert. No new positions until drawdown recovers.
            </p>
          </div>
          <div className="p-3 rounded-lg bg-slate-900 border border-amber-500/30 space-y-1">
            <div className="font-bold text-amber-300">Delta Neutrality Bounds</div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Tracks aggregate portfolio net Delta. If the portfolio drifts too directional (e.g. aggregate Delta below -0.30 or above +0.30), new orders in the same direction are blocked to maintain near-neutral risk posture.
            </p>
          </div>
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-700 space-y-1">
            <div className="font-bold text-slate-200">Single-Underlying Concentration Cap</div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              No single ticker may represent more than <strong>10% of total portfolio equity at risk</strong>. The staging engine calculates required collateral against account size and warns (yellow) or blocks (red) the order if the concentration limit would be breached.
            </p>
          </div>
        </div>
        <div className="bg-rose-950/30 p-3 rounded-lg border border-rose-500/30 text-xs text-rose-300">
          <strong>Rule:</strong> Circuit-breaker thresholds are set in <code className="text-rose-200">.env</code> via <code className="text-rose-200">RISK_MAX_DRAWDOWN_PCT</code>, <code className="text-rose-200">RISK_MAX_DELTA_EXPOSURE</code>, and <code className="text-rose-200">RISK_MAX_SINGLE_UNDERLYING_PCT</code>. All default to conservative values — tighten them, never loosen beyond your personal risk tolerance.
        </div>
      </div>

      {/* Executive Portfolio Digest & Interactive Threat Register */}
      <div className="bg-slate-950/70 p-4 rounded-xl border border-amber-500/30 space-y-3">
        <div className="flex items-center space-x-2 text-amber-400 font-bold text-xs">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Executive Portfolio Digest: Interactive Threat Register &amp; Binary Events Shock Buffer</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          The <strong>Executive Portfolio Digest</strong> acts as your top-level command center for portfolio health, combining automated 24/7 contract monitoring with interactive inspection modals:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1.5">
            <div className="font-bold text-emerald-300 flex items-center gap-1.5">
              <span>Position Health &amp; Threat Register Modal</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Click the card to open a full breakdown categorized by Delta stress:
            </p>
            <ul className="text-[11px] text-slate-400 space-y-1 list-disc list-inside">
              <li><strong className="text-rose-300">Critical (&ge;0.50Δ):</strong> Triggers immediate 0.50Δ Net-Credit Roll Protocol (roll out &amp; down before market close).</li>
              <li><strong className="text-rose-400">Threatened (&ge;0.40Δ):</strong> Queued on active watch as strike is tested.</li>
              <li><strong className="text-amber-300">On Watch (&ge;0.30Δ):</strong> Drifting near 2 SD Bollinger boundaries.</li>
              <li><strong className="text-emerald-400">Safe (&lt;0.30Δ):</strong> Well within statistical safety margin.</li>
            </ul>
          </div>
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1.5">
            <div className="font-bold text-amber-300 flex items-center gap-1.5">
              <span>Upcoming Binary Events &amp; 90-Day Rolling Fallback</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Click the card to inspect contracts with pending earnings releases:
            </p>
            <ul className="text-[11px] text-slate-400 space-y-1 list-disc list-inside">
              <li><strong className="text-rose-300">Inside Expiration Warning:</strong> Flags any open CSP/CC where an earnings announcement occurs between trade date and expiration.</li>
              <li><strong className="text-amber-300">Sizing Throttle:</strong> Caps single-ticker allocation to 2% max when binary events are active.</li>
              <li><strong className="text-blue-300">90-Day Rolling Fallback:</strong> If unannounced, estimates the next report date using last known release + 90 days (marked as ~ Estimated) rather than generic quarter-end dates.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
