import React from 'react';
import { DirectActionBanner } from './DirectActionBanner';
import { BrainCircuit, ShieldCheck, TrendingUp, Zap, Layers } from '../../../icons';
import { MenuTreeType, EquitiesTabType, OptionsTabType } from '../../../../types/options';

export interface ChapterAiOptionsIncomeProps {
  onNavigate?: (tree: MenuTreeType, optionsTab?: OptionsTabType, equitiesTab?: EquitiesTabType) => void;
}

export const ChapterAiOptionsIncome: React.FC<ChapterAiOptionsIncomeProps> = ({
  onNavigate,
}) => {
  return (
    <div className="space-y-6">
      <div className="border-l-2 border-violet-400 pl-4 py-1">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <BrainCircuit className="w-5 h-5 text-violet-400" />
          <span>AI Options Income Screener (Gemini Extended Thinking)</span>
        </h3>
        <p className="text-slate-400 mt-1">
          Automated institutional quantitative engine that filters stock screeners (Barchart Direction Strength View 190898, MarketChameleon, or custom CSVs) into high-probability Cash-Secured Put (CSP) and Covered Call (CC) candidates using Gemini 2.5 Flash / 2.0 Pro with extended chain-of-thought reasoning.
        </p>
      </div>

      <DirectActionBanner
        title="AI Options Income Direct Access"
        actions={[
          {
            label: 'AI Options Income Analyzer',
            location: 'Options > AI Options Income',
            onClick: () => onNavigate?.('OPTIONS', 'AI_OPTIONS_INCOME'),
          },
          {
            label: 'Gemini Decision Hub (Extended Thinking)',
            location: 'Workflow > Cascading Screener',
            onClick: () => onNavigate?.('WORKFLOW', 'CASCADING_SCREENER'),
          },
        ]}
      />

      {/* 4 Quantitative Mandates */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-950/70 p-4 rounded-xl border border-violet-500/30 space-y-2">
          <div className="flex items-center space-x-2 text-violet-300 font-bold text-xs uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-violet-400" />
            <span>Cash-Secured Put (CSP) Constraints</span>
          </div>
          <ul className="space-y-1.5 text-xs text-slate-300">
            <li><strong>DTE:</strong> 5–10 DTE (nearest weekly expiration) for rapid theta decay.</li>
            <li><strong>Delta:</strong> -0.15 to -0.30 (80%–85% win probability).</li>
            <li><strong>Downside Cushion:</strong> 3.5% to 6.0% below current spot price.</li>
            <li><strong>Technical Anchor:</strong> Strike &le; major support (20/50 SMA, swing low).</li>
            <li><strong>Volatility:</strong> IV Rank &gt; 35% for rich premium harvest.</li>
            <li><strong>Min AROC:</strong> &ge; 15.0% annualized return on capital.</li>
          </ul>
        </div>

        <div className="bg-slate-950/70 p-4 rounded-xl border border-indigo-500/30 space-y-2">
          <div className="flex items-center space-x-2 text-indigo-300 font-bold text-xs uppercase tracking-wider">
            <TrendingUp className="w-4 h-4 text-indigo-400" />
            <span>Covered Call (CC) Constraints</span>
          </div>
          <ul className="space-y-1.5 text-xs text-slate-300">
            <li><strong>DTE:</strong> 5–10 DTE (nearest weekly expiration).</li>
            <li><strong>Delta:</strong> +0.15 to +0.30 (preserving upside while harvesting theta).</li>
            <li><strong>Upside Cushion:</strong> Strike &ge; dynamic resistance (upper BB, 50 SMA, swing high).</li>
            <li><strong>Min AROC:</strong> &ge; 12.0% annualized return on capital.</li>
            <li><strong>Earnings Blackout:</strong> Absolute rejection if earnings date occurs during cycle.</li>
            <li><strong>Liquidity:</strong> Open interest &gt; 100, bid/ask spread &le; 10% of bid.</li>
          </ul>
        </div>
      </div>

      {/* Zero-Billing Guarantee & Pro Plan Bridge */}
      <div className="bg-gradient-to-r from-amber-500/10 via-slate-900 to-amber-500/10 p-4 rounded-xl border border-amber-500/40 space-y-3">
        <div className="flex items-center space-x-2 text-amber-300 font-bold text-xs uppercase tracking-wider">
          <Zap className="w-4 h-4 text-amber-400" />
          <span>Zero-Billing Guarantee &amp; Personal Pro Plan Bridge ($0 Cost)</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          Google Gemini Pro web subscriptions (<code className="px-1.5 py-0.5 rounded bg-slate-800 text-amber-300 font-mono">gemini.google.com</code>) are consumer accounts and are completely separate from developer API billing (<code className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">ai.google.dev</code>). To guarantee you never incur developer API overages, DeltaHarvest offers a 1-click zero-cost workflow:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
          <div className="p-3 rounded-lg bg-slate-950/80 border border-amber-500/30 space-y-1">
            <div className="font-bold text-amber-400">Step 1: Copy Prompt</div>
            <div className="text-[11px] text-slate-300">Click &quot;Copy Prompt for Gemini Pro Plan ($0 Cost)&quot; in the screener header. The system bundles your dataset with the complete institutional quantitative prompt.</div>
          </div>
          <div className="p-3 rounded-lg bg-slate-950/80 border border-amber-500/30 space-y-1">
            <div className="font-bold text-amber-400">Step 2: Paste in Gemini Pro</div>
            <div className="text-[11px] text-slate-300">Open gemini.google.com in your browser and paste. With Thinking Mode active, Gemini performs deep calculation and outputs valid JSON.</div>
          </div>
          <div className="p-3 rounded-lg bg-slate-950/80 border border-amber-500/30 space-y-1">
            <div className="font-bold text-amber-400">Step 3: Import JSON</div>
            <div className="text-[11px] text-slate-300">Click &quot;Import Gemini JSON&quot; in the app and paste the model output. The interactive decision matrix and audit log populate instantly!</div>
          </div>
        </div>
      </div>

      {/* Gemini Extended Thinking Mode */}
      <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
        <div className="flex items-center space-x-2 text-white font-bold">
          <BrainCircuit className="w-4 h-4 text-violet-400" />
          <span>Gemini Extended Thinking Architecture (thinking_level: HIGH)</span>
        </div>
        <p className="text-slate-300 leading-relaxed">
          When analyzing option surfaces, standard LLMs often hallucinate delta-to-strike ratios or miss subtle earnings blackout windows. By setting <code className="px-1 py-0.5 rounded bg-slate-800 text-cyan-300 font-mono">thinking_level: HIGH</code>, Gemini spends thousands of internal reasoning tokens cross-referencing support levels, validating AROC math <code className="px-1 py-0.5 rounded bg-slate-800 text-emerald-300 font-mono">((Premium/Strike) * (365/DTE)) * 100</code>, and auditing rejected symbols with clear diagnostic rationale.
        </p>
      </div>

      {/* Dual-Runtime Architecture */}
      <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
        <div className="flex items-center space-x-2 text-white font-bold">
          <Layers className="w-4 h-4 text-emerald-400" />
          <span>Dual-Runtime Production &amp; Local Parity</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
            <div className="font-bold text-emerald-400">Production (Cloudflare Pages)</div>
            <div className="text-[11px] text-slate-400 mt-1">Executes on Cloudflare Edge (<code className="text-slate-300 font-mono">/functions/api/analyze-options.js</code>) with 0 server cold starts and automatic free-tier rate limit protection.</div>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
            <div className="font-bold text-cyan-400">Local Development (FastAPI)</div>
            <div className="text-[11px] text-slate-400 mt-1">Executes on FastAPI backend (<code className="text-slate-300 font-mono">POST /api/v1/options/analyze-options</code>) automatically fallback-routed if running without Wrangler.</div>
          </div>
        </div>
      </div>
    </div>
  );
};
