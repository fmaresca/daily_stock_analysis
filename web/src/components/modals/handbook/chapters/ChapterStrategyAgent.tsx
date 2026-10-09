import React from 'react';
import { DirectActionBanner } from './DirectActionBanner';
import { BrainCircuit, Globe, Sliders, TrendingUp, AlertTriangle } from '../../../icons';
import { MenuTreeType, EquitiesTabType, OptionsTabType } from '../../../../types/options';

export interface ChapterStrategyAgentProps {
  onNavigate?: (tree: MenuTreeType, optionsTab?: OptionsTabType, equitiesTab?: EquitiesTabType) => void;
}

export const ChapterStrategyAgent: React.FC<ChapterStrategyAgentProps> = ({ onNavigate }) => {
  return (
    <div className="space-y-6">
      <div className="border-l-2 border-purple-500 pl-4 py-1">
        <h3 className="text-base font-bold text-white">
          Ask Strategy Agent &amp; Daily Market Recap
        </h3>
        <p className="text-slate-400 mt-1 text-xs leading-relaxed">
          Two AI-powered Research tools added in the October 2026 update: a conversational institutional
          strategy assistant and a live daily market recap panel — both accessible from the top of the
          Research sidebar group.
        </p>
      </div>

      <DirectActionBanner
        actions={[
          {
            label: 'Ask Strategy Agent',
            location: 'Research → Ask Strategy Agent',
            onClick: () => onNavigate?.('AGENT_CHAT'),
          },
          {
            label: 'Daily Market Recap',
            location: 'Research → Market Recap',
            onClick: () => onNavigate?.('MARKET_RECAP'),
          },
        ]}
      />

      {/* ── Strategy Agent ──────────────────────────────────────────── */}
      <div className="bg-slate-950/70 p-4 rounded-xl border border-purple-500/30 space-y-4">
        <div className="flex items-center space-x-2 text-purple-400 font-bold text-xs">
          <BrainCircuit className="w-4 h-4" />
          <span>Ask Strategy Agent — Conversational Quantitative Q&amp;A</span>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          The Strategy Agent is a tool-grounded institutional equity assistant. Every number it
          cites — price, RSI, moving average, sentiment score — is fetched live by a server-side tool
          call. <strong className="text-white">Zero numbers are fabricated.</strong> Ask it any
          question and it will pull the data, analyze it under your chosen lens, and explain its
          reasoning with inline citations.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-2">
            <div className="font-bold text-white flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-purple-400" />
              8 Strategy Lenses
            </div>
            <ul className="text-slate-400 space-y-0.5 list-disc list-inside text-[11px] leading-relaxed">
              <li><strong className="text-slate-300">Trend / Momentum</strong> — SMA, RSI, volume</li>
              <li><strong className="text-slate-300">Mean-Reversion</strong> — Bollinger Bands, overbought/oversold</li>
              <li><strong className="text-slate-300">Breakout</strong> — consolidation &amp; resistance tests</li>
              <li><strong className="text-slate-300">Quality / Value</strong> — drawdown resilience, margin of safety</li>
              <li><strong className="text-slate-300">Growth</strong> — relative strength vs SPY/QQQ</li>
              <li><strong className="text-slate-300">Event-Driven (Earnings)</strong> — IV crush, binary risk</li>
              <li><strong className="text-slate-300">Sentiment / Positioning</strong> — Adanos crowd signals</li>
              <li><strong className="text-slate-300">Risk / Defensive</strong> — capital preservation, stop-loss</li>
            </ul>
          </div>

          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-2">
            <div className="font-bold text-white">How to Use It</div>
            <ol className="text-slate-400 space-y-1.5 list-decimal list-inside text-[11px] leading-relaxed">
              <li>Set the <strong className="text-slate-300">Focus Ticker</strong> (e.g. NVDA) at the top of the chat panel.</li>
              <li>Select a <strong className="text-slate-300">Strategy Lens</strong> pill — each lens biases the analysis toward a specific framework.</li>
              <li>Type your question or click a <strong className="text-slate-300">Quick Prompt</strong> to start.</li>
              <li>Watch the tool-call status banner as live data is fetched.</li>
              <li>Responses stream progressively with inline metric citations.</li>
              <li>Use the left panel to revisit past strategy conversations or start a new session.</li>
            </ol>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-2 text-xs">
          <div className="font-bold text-white">Live Tools the Agent Calls</div>
          <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400">
            <div>📈 <strong className="text-slate-300">Market Price &amp; Technicals</strong> — Yahoo Finance (spot price, SMA-20/50, RSI-14, Bollinger Bands)</div>
            <div>🗞️ <strong className="text-slate-300">Ticker News</strong> — Google News RSS (top 5 recent headlines)</div>
            <div>🧠 <strong className="text-slate-300">Adanos Sentiment</strong> — Reddit, X, Polymarket, News buzz scores (requires backend sentiment API key)</div>
            <div>📅 <strong className="text-slate-300">Economic Calendar</strong> — Upcoming FOMC, CPI, NFP, and high-impact macro events</div>
          </div>
        </div>

        <div className="flex items-start space-x-2 p-3 rounded-lg bg-amber-950/40 border border-amber-500/30 text-[11px] text-amber-300">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
          <span>
            The agent is rate-limited to 30 requests/minute per user. Sentiment data requires the
            Adanos sentiment service key to be configured in Cloudflare Pages environment secrets. If not set, the agent gracefully reports
            sentiment as unavailable and proceeds with technical and news data only.
          </span>
        </div>
      </div>

      {/* ── Market Recap ─────────────────────────────────────────────── */}
      <div className="bg-slate-950/70 p-4 rounded-xl border border-cyan-500/30 space-y-4">
        <div className="flex items-center space-x-2 text-cyan-400 font-bold text-xs">
          <Globe className="w-4 h-4" />
          <span>Daily Market Recap — Indices, Sectors &amp; Macro Pulse</span>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          The Market Recap panel delivers a consolidated daily snapshot of broad US market conditions,
          cached at the edge for 6 hours to avoid redundant upstream calls.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          {[
            { label: 'Index Pulse', desc: 'S&P 500, Nasdaq, and Dow Jones daily price change, prior close, and percentage move.' },
            { label: 'VIX & Volatility', desc: 'CBOE VIX reading with contextual label (calm / elevated / fearful) and 10-Year Treasury yield.' },
            { label: 'Sector Heat Strip', desc: 'All 11 GICS sectors color-coded by daily performance from best to worst.' },
          ].map(({ label, desc }) => (
            <div key={label} className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
              <div className="font-bold text-cyan-300 text-[11px]">{label}</div>
              <p className="text-slate-400 text-[11px] leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

        <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-400 space-y-1">
          <div className="font-bold text-white">Data Sources</div>
          <p>
            Index and VIX data fetched from Yahoo Finance. Sector data aggregated from ETF proxies
            (XLK, XLF, XLE, XLV, XLY, XLP, XLI, XLB, XLRE, XLC, XLU). Edge-cached with
            <code className="mx-1 px-1 py-0.5 rounded bg-slate-800 text-cyan-200">s-maxage=21600</code>
            (6 hours) and <code className="px-1 py-0.5 rounded bg-slate-800 text-cyan-200">stale-while-revalidate=3600</code> for
            instant loads without stale blanks.
          </p>
          <p className="mt-1 text-slate-500">
            Force a fresh fetch by clicking the Refresh button in the recap panel header.
            No authentication required — the recap endpoint is public.
          </p>
        </div>
      </div>

      {/* ── Multi-LLM ─────────────────────────────────────────────────── */}
      <div className="bg-slate-950/70 p-4 rounded-xl border border-indigo-500/30 space-y-3">
        <div className="flex items-center space-x-2 text-indigo-400 font-bold text-xs">
          <TrendingUp className="w-4 h-4" />
          <span>Multi-LLM Provider Abstraction (Admin Configuration)</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          All AI features (Strategy Agent, AI Options Screener) now route through a unified server-side
          LLM abstraction layer that supports Google Gemini (default), any OpenAI-compatible endpoint
          (DeepSeek, Qwen, Ollama, OpenAI), and Anthropic Claude — selectable via Cloudflare Pages
          environment variables. No code changes required to switch providers.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
          {[
            { env: 'GEMINI_API_KEY', desc: 'Google Gemini (default, gemini-3.8-flash)' },
            { env: 'LLM_PROVIDER + LLM_API_KEY + LLM_BASE_URL', desc: 'OpenAI-compatible (DeepSeek, Qwen, Ollama, OpenAI)' },
            { env: 'ANTHROPIC_API_KEY', desc: 'Anthropic Claude (claude-3-5-sonnet)' },
            { env: 'LLM_FALLBACK_PROVIDER', desc: 'Automatic failover if primary provider errors' },
          ].map(({ env, desc }) => (
            <div key={env} className="p-2 rounded bg-slate-900 border border-slate-800 space-y-0.5">
              <code className="text-indigo-300 text-[10px]">{env}</code>
              <p className="text-slate-400">{desc}</p>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-slate-500">
          All keys are stored exclusively as Cloudflare Pages secrets — never in code, client bundles, or logs.
        </p>
      </div>
    </div>
  );
};
