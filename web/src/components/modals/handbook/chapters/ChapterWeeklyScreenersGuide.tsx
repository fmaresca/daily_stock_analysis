import React from 'react';
import { DirectActionBanner } from './DirectActionBanner';
import { Flame, TrendingUp, Zap, Layers } from '../../../icons';
import { MenuTreeType, EquitiesTabType, OptionsTabType } from '../../../../types/options';

export interface ChapterWeeklyScreenersGuideProps {
  onNavigate?: (tree: MenuTreeType, optionsTab?: OptionsTabType, equitiesTab?: EquitiesTabType) => void;
}

export const ChapterWeeklyScreenersGuide: React.FC<ChapterWeeklyScreenersGuideProps> = ({
  onNavigate,
}) => {
  return (
    <div className="space-y-6">
      <div className="border-l-2 border-amber-400 pl-4 py-1">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <span>🔥 Weekly Stock Screeners &amp; Multi-Source Ingestion Engine</span>
        </h3>
        <p className="text-slate-400 mt-1">
          Automated screener agent tracking Top 1% Direction Strength, 13-indicator technical consensus, and weekly options availability from Barchart.com (with pluggable MarketChameleon.com integration).
        </p>
      </div>

      <DirectActionBanner
        actions={[
          {
            label: 'Weekly Stock Screeners (Barchart 190898)',
            location: 'Equities > Weekly Stock Screeners',
            onClick: () => onNavigate?.('EQUITIES', undefined, 'WEEKLY_STOCK_SCREENERS'),
          },
          {
            label: 'Cascading Screener Funnel (Barchart Tab)',
            location: 'Workflow > Cascading Screener',
            onClick: () => onNavigate?.('WORKFLOW', 'CASCADING_SCREENER'),
          },
        ]}
      />

      {/* What is Barchart Direction Strength */}
      <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-3">
        <h4 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-1.5 text-emerald-400">
          <Flame className="w-4 h-4 text-amber-400" />
          <span>1. Barchart Top 1% Direction Strength &amp; 13 Technical Indicators</span>
        </h4>
        <p className="text-xs text-slate-300 leading-relaxed">
          Barchart’s Direction Strength evaluates a stock across <strong>13 distinct technical indicators</strong> categorized into short-term (20-day), medium-term (50-day), and long-term (100/150/200-day) moving averages and MACD oscillators.
          When a stock achieves a <strong>100% Buy</strong> composite rating, all 13 indicators have unanimously triggered bullish trend confirmations:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
            <div className="font-bold text-cyan-300">Short-Term (4 Indicators)</div>
            <div className="text-[11px] text-slate-400 mt-1">20-Day SMA, 20-50 MACD, 20-100 MACD, 20-200 MACD Oscillators</div>
          </div>
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
            <div className="font-bold text-emerald-300">Medium-Term (4 Indicators)</div>
            <div className="text-[11px] text-slate-400 mt-1">50-Day SMA, 50-100 MACD, 50-150 MACD, 50-200 MACD Oscillators</div>
          </div>
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
            <div className="font-bold text-indigo-300">Long-Term (5 Indicators)</div>
            <div className="text-[11px] text-slate-400 mt-1">100/150/200-Day SMAs, 100-200 MACD, and 200 SMA 20-Day Slope</div>
          </div>
        </div>
      </div>

      {/* Why Weekly Options */}
      <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-3">
        <h4 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-1.5 text-cyan-400">
          <TrendingUp className="w-4 h-4 text-emerald-400" />
          <span>2. The Power of Weekly Options (Expiry Cadence &amp; Gamma Defense)</span>
        </h4>
        <p className="text-xs text-slate-300 leading-relaxed">
          Stocks equipped with <strong>At least Weekly Options</strong> (confirmed via the weekly options gate checkbox) allow income traders to execute options contracts expiring every Friday or daily, rather than only once a month (3rd Friday). This unlocks three critical advantages:
        </p>
        <ul className="list-disc list-inside text-xs text-slate-300 space-y-1.5 pl-1">
          <li><strong>Rapid Theta Acceleration:</strong> Time decay exponentially accelerates inside 7–14 DTE, allowing fast profit realization at 50% max profit.</li>
          <li><strong>Tighter Strike Selection:</strong> Weekly options provide tighter dollar-interval strikes ($0.50 or $1 increments), enabling precise delta anchoring (0.15–0.20Δ).</li>
          <li><strong>Tactical Rolling Flexibility:</strong> If an underlying equity tests support, weekly contracts can be rolled down and out week-by-week for continuous net credit.</li>
        </ul>
      </div>

      {/* Automated Agent Architecture & CSV Upload */}
      <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-3">
        <h4 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-1.5 text-amber-300">
          <Zap className="w-4 h-4 text-amber-400" />
          <span>3. Automated Screener Agent Architecture &amp; CSV Pipelines</span>
        </h4>
        <div className="space-y-2 text-xs text-slate-300">
          <p>
            The screener agent (<code className="text-emerald-300 font-mono">src/screener_agents/</code>) uses headless Playwright Chromium to bypass AWS WAF challenges and fetch the exact Barchart view (view 190898).
          </p>
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 font-mono text-[11px] text-slate-300 space-y-1">
            <div className="text-emerald-400 font-bold"># CLI Commands:</div>
            <div>python scripts/run_screener_agent.py --source barchart</div>
            <div>python scripts/run_screener_agent.py --import-csv path/to/screener.csv</div>
          </div>
          <p>
            <strong>In-Browser CSV Dropzone:</strong> You can also drag-and-drop or upload any CSV downloaded from Barchart or MarketChameleon directly on the <em>Weekly Stock Screeners</em> page for instant client-side parsing and analysis.
          </p>
        </div>
      </div>

      {/* MarketChameleon.com Screener & Copy-Paste Results */}
      <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-3">
        <h4 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-1.5 text-purple-400">
          <Layers className="w-4 h-4 text-purple-400" />
          <span>4. MarketChameleon.com Screener &amp; 1-Click Copy-Paste Results</span>
        </h4>
        <p className="text-xs text-slate-300 leading-relaxed">
          The <strong>MarketChameleon Screener Agent</strong> (<code className="text-purple-300 font-mono">MarketChameleonScreenerAgent</code>) automatically queries <code className="text-purple-300 font-mono">marketchameleon.com/Screeners/Stocks</code> with the preselected criteria:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
            <span className="font-bold text-purple-300">Stock Idea:</span> Momentum Stocks<br />
            <span className="font-bold text-purple-300">Market Cap:</span> Over $1 Billion<br />
            <span className="font-bold text-purple-300">Options:</span> Has Options Listed
          </div>
          <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
            <span className="font-bold text-purple-300">14-Day RSI:</span> 50 to 70 (Sweet Spot)<br />
            <span className="font-bold text-purple-300">Volatility:</span> 1-Yr, 20-Day, 1-Day, IV30 &gt; 30<br />
            <span className="font-bold text-purple-300">MA Technical:</span> Any Bullish (Uptrend / Cross)
          </div>
        </div>
        <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 font-mono text-[11px] text-slate-300 space-y-1">
          <div className="text-purple-400 font-bold"># CLI Run &amp; Sync:</div>
          <div>python scripts/run_screener_agent.py --source marketchameleon</div>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          <strong>1-Click Copy Results:</strong> Click <strong>Copy Results (TSV)</strong> in the top toolbar to copy all visible records along with their respective column headings directly to your clipboard, formatted for instant pasting into Excel, Google Sheets, or your trade log.
        </p>
      </div>

      {/* Barchart Custom Watchlist & View 190898 Analysis Engine */}
      <div className="bg-slate-950/60 p-4 rounded-xl border border-amber-800/60 space-y-3">
        <h4 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-1.5 text-amber-400">
          <Flame className="w-4 h-4 text-amber-400" />
          <span>5. Barchart Custom Watchlist Agent &amp; View 190898 Analysis Engine</span>
        </h4>
        <p className="text-xs text-slate-300 leading-relaxed">
          The <strong>Barchart Custom Watchlist Agent</strong> (<code className="text-amber-300 font-mono">BarchartCustomWatchlistAgent</code>) lets you ingest any custom set of stock symbols in bulk or individually, querying Barchart to perform analysis and return output identical to <code className="text-amber-300 font-mono">barchart.com/my/watchlist?viewName=190898</code>.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
            <span className="font-bold text-amber-300">Ingestion Modes:</span> Quick Single Symbol or Bulk Textarea (commas, spaces, newlines, or .txt/.csv file upload).<br />
            <span className="font-bold text-amber-300">Curated Presets:</span> Schwab Import Equities (Living Trust) or custom pasted tickers.
          </div>
          <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
            <span className="font-bold text-amber-300">View 190898 Columns:</span> Symbol, Name, Last Price, Net Change, % Change, Barchart Opinion, Opinion Score %, Stability (Previous / Last Week / Last Month), Weekly Options, Options Cadence, Signal Strength, Signal Direction, Recommended Strategy.<br />
            <span className="font-bold text-amber-300">Resilience:</span> Online WAF-bypass query with automatic fallback to local 13-indicator consensus engine.
          </div>
        </div>
        <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 font-mono text-[11px] text-slate-300 space-y-1">
          <div className="text-amber-400 font-bold"># CLI Commands:</div>
          <div>python scripts/run_screener_agent.py --source barchart_custom --symbols &quot;AXTI,BLZE,IONQ,LUNR,NET,RTX,TSLA&quot;</div>
          <div>python scripts/run_screener_agent.py --source barchart_custom --symbols-file symbols.txt</div>
        </div>
      </div>
    </div>
  );
};
