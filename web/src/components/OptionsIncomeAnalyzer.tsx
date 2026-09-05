import React, { useState } from 'react';
import {
  BrainCircuit,
  Flame,
  CheckCircle2,
  Copy,
  ExternalLink,
  Upload,
  RefreshCw,
  AlertTriangle,
  BarChart2,
  ShieldCheck,
  TrendingUp,
  Sliders,
  FileText,
  HelpCircle,
  X,
} from './icons';
import {
  OptionsCandidate,
  RejectedCandidate,
  OptionsAnalysisResponse,
} from '../types/optionsAnalyzer';

interface OptionsIncomeAnalyzerProps {
  onSelectSymbolForChart?: (symbol: string) => void;
  onOpenTickerAudit?: (symbol: string) => void;
}

export const OptionsIncomeAnalyzer: React.FC<OptionsIncomeAnalyzerProps> = ({
  onSelectSymbolForChart,
  onOpenTickerAudit,
}) => {
  const [screenerInput, setScreenerInput] = useState<string>('');
  const [strategy, setStrategy] = useState<'CSP' | 'COVERED_CALL' | 'BOTH'>('CSP');
  const [minAroc, setMinAroc] = useState<number>(15);
  const [selectedModel, setSelectedModel] = useState<string>('gemini-2.5-flash');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<OptionsAnalysisResponse | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [jsonImportText, setJsonImportText] = useState<string>('');
  const [importError, setImportError] = useState<string | null>(null);

  // Load current screener data from local JSONs (Barchart / MarketChameleon / Custom Watchlist)
  const handleLoadCurrentScreenerData = async (source: 'barchart' | 'marketchameleon' | 'custom') => {
    try {
      let url = './data/weekly_screeners.json';
      if (source === 'marketchameleon') url = './data/weekly_screeners_marketchameleon.json';
      if (source === 'custom') url = './data/weekly_screeners_barchart_custom.json';

      const resp = await fetch(url + '?t=' + Date.now());
      if (!resp.ok) {
        throw new Error(`Could not load screener dataset from ${url}`);
      }
      const json = await resp.json();
      const records = json.records || [];
      if (records.length === 0) {
        alert('No records found in current screener dataset.');
        return;
      }

      // Convert records into clean CSV format
      const headers = [
        'Symbol',
        'Name',
        'Last Price',
        'Net Change',
        '% Change',
        'Barchart Opinion',
        'Opinion Score %',
        'Weekly Options',
        'Signal Strength',
        'Recommended Strategy',
      ];
      const rows = records.slice(0, 35).map((r: any) => [
        r.symbol,
        `"${(r.name || '').replace(/"/g, '""')}"`,
        r.last_price,
        r.price_change,
        `${r.percent_change}%`,
        `"${r.opinion || ''}"`,
        r.opinion_pct,
        r.has_weekly_options ? 'Yes' : 'No',
        `"${r.signal_strength || ''}"`,
        r.recommended_strategy || '',
      ].join(','));

      const csv = [headers.join(','), ...rows].join('\n');
      setScreenerInput(csv);
      setError(null);
    } catch (e: any) {
      setError(`Failed to load screener data: ${e.message}`);
    }
  };

  // Generates the quantitative prompt enforcing institutional income discipline & extended thinking
  const generatePromptText = () => {
    return `You are an institutional derivatives portfolio manager and quantitative options analyst specializing in conservative weekly income generation through Cash-Secured Puts (CSPs) and Covered Calls (CCs).

### OBJECTIVE
Analyze the provided weekly stock screener data and generate an institutional shortlist of optimal weekly option candidates to write for immediate income, prioritizing capital preservation, probability of expiring out-of-the-money (PoP > 75%), and favorable risk-adjusted yield.

### THINKING & REASONING MANDATE (THINKING MODE: ACTIVE)
Activate deep quantitative thinking. Systematically evaluate cross-sectional volatility, moving average cushions (20-day and 50-day SMA), swing support/resistance levels, earnings announcement calendar risk, and annualized return on capital (AROC).

### SCREENING RULES & CONSTRAINTS
1. EXPIRATION: Focus strictly on the nearest weekly expiration (5 to 10 Days to Expiration [DTE]).
2. EARNINGS RISK: STRICT BLACKOUT. If an earnings announcement occurs prior to or during the expiration cycle, immediately reject the candidate or flag it with a score of 0.
3. CASH-SECURED PUTS (CSPs):
   - Delta Range: -0.15 to -0.30 (approx. 70-85% out-of-the-money probability).
   - Technical Anchor: Strike must be set AT or BELOW verified technical support (e.g., 20-day or 50-day SMA, recent swing low).
   - Downside Cushion: Minimum 3.5% to 6.0% buffer between current underlying stock price and strike.
   - IV Regime: Prefer elevated IV Rank (> 35th percentile) where option premium is rich relative to historical volatility, excluding binary events.
4. COVERED CALLS (CCs):
   - Delta Range: +0.15 to +0.30.
   - Technical Anchor: Strike must be set AT or ABOVE overhead resistance (e.g., upper Bollinger Band, 50-day SMA, or major swing high).
5. LIQUIDITY & SPREAD:
   - Minimum Open Interest: > 100 contracts on the selected strike.
   - Bid/Ask Spread: Bid/Ask spread must not exceed 10% of the bid price (favor penny/nickel tick spreads).
6. ANNUALIZED RETURN FORMULA:
   - Annualized Return on Capital (AROC) = ((Premium / Strike Price) * (365 / DTE)) * 100.
   - Target Minimum AROC: >= ${minAroc}% for puts; >= 12.0% for calls (excluding capital gain to strike).

### INPUT DATA
User Strategy Preference: ${strategy}
Target Minimum Annualized Yield: ${minAroc}%
Screener Payload:
${screenerInput}

### REQUIRED JSON OUTPUT STRUCTURE
Return ONLY a valid, raw JSON object (no surrounding Markdown wrappers, no \`\`\`json prefixes) adhering to this schema:
{
  "market_regime_context": "Brief 2-sentence macro/volatility backdrop assessment",
  "candidates": [
    {
      "ticker": "AAPL",
      "strategy": "CSP",
      "current_price": 224.50,
      "recommended_strike": 217.50,
      "expiration_date": "YYYY-MM-DD",
      "dte": 7,
      "delta": -0.21,
      "bid_ask": "1.15 / 1.18",
      "expected_premium": 1.15,
      "downside_cushion_pct": 3.12,
      "annualized_yield_pct": 27.55,
      "iv_rank": 42.0,
      "technical_anchor": "Strike sits 1.2% below the 20-day SMA ($220.10) and above horizontal swing low support.",
      "earnings_date": "None during cycle",
      "selection_tier": "PRIMARY",
      "risk_factors": "Potential tech sector beta drawdown if NDX breaks 50 SMA."
    }
  ],
  "rejected_candidates": [
    {
      "ticker": "XYZ",
      "reason": "Earnings announcement within 3 days; excessive binary gap risk."
    }
  ]
}`;
  };

  // Copy Prompt to Clipboard for Gemini Pro Web Interface
  const handleCopyPrompt = () => {
    if (!screenerInput.trim()) {
      setError('Please paste or load screener data first before copying the prompt.');
      return;
    }
    const promptText = generatePromptText();
    navigator.clipboard.writeText(promptText).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 4000);
    }).catch((err) => {
      console.error('Failed to copy: ', err);
    });
  };

  // Run in-app analysis via Edge Function or FastAPI fallback
  const handleAnalyzeAPI = async () => {
    if (!screenerInput.trim()) {
      setError('Please paste or load weekly screener data first.');
      return;
    }
    setLoading(true);
    setError(null);
    setAnalysisResult(null);

    try {
      // 1. Try Cloudflare Pages edge function first (/api/analyze-options)
      let res = await fetch('/api/analyze-options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          screenerData: screenerInput,
          strategy,
          minAroc: Number(minAroc),
          modelOverride: selectedModel,
        }),
      }).catch(() => null);

      // 2. If Cloudflare Pages edge is not available (e.g. running on local FastAPI), try /api/v1/options/analyze-options
      if (!res || !res.ok) {
        res = await fetch('/api/v1/options/analyze-options', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            screenerData: screenerInput,
            strategy,
            minAroc: Number(minAroc),
            modelOverride: selectedModel,
          }),
        });
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || data.detail || 'Analysis request failed.');
      }
      setAnalysisResult(data);
    } catch (err: any) {
      setError(err.message || 'Failed to complete options analysis.');
    } finally {
      setLoading(false);
    }
  };

  // Handle parsing pasted JSON from Gemini Pro web
  const handleImportJSON = () => {
    setImportError(null);
    if (!jsonImportText.trim()) {
      setImportError('Please paste the JSON response from Gemini Pro.');
      return;
    }
    try {
      let cleaned = jsonImportText.trim();
      // Remove any surrounding markdown block backticks
      cleaned = cleaned.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleaned);
      if (!parsed || (!parsed.candidates && !parsed.rejected_candidates)) {
        throw new Error("JSON must contain 'candidates' or 'rejected_candidates' keys.");
      }
      setAnalysisResult(parsed);
      setIsImportModalOpen(false);
      setJsonImportText('');
    } catch (e: any) {
      setImportError(`Invalid JSON format: ${e.message}`);
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Banner & Header */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800/90 shadow-xl bg-gradient-to-r from-slate-900/95 via-slate-900/80 to-slate-950/95">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 border border-indigo-400/30">
                <BrainCircuit className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-lg font-black tracking-tight text-white">
                    Options Income Screener
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center space-x-1">
                    <Flame className="w-3 h-3 text-amber-400" />
                    <span>Thinking Mode Active (HIGH)</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hidden sm:inline-block">
                    Zero-Billing Protection
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Institutional quantitative engine utilizing deep multi-step reasoning to isolate high-conviction Cash-Secured Puts (CSPs) and Covered Calls (CCs) with strict earnings blackout and technical support anchors.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Zero-Billing Bridge Actions */}
          <div className="flex items-center space-x-2 flex-wrap gap-y-2">
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="flex items-center space-x-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-cyan-300 hover:border-cyan-400/50 shadow-sm transition-all cursor-pointer"
              title="Paste JSON output generated from your Gemini Pro Plan interface"
            >
              <FileText className="w-3.5 h-3.5 text-cyan-400" />
              <span>Import Gemini JSON</span>
            </button>

            <a
              href="https://gemini.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-purple-300 hover:border-purple-400/50 shadow-sm transition-all"
              title="Open Google Gemini Pro web interface"
            >
              <span>gemini.google.com</span>
              <ExternalLink className="w-3 h-3 text-purple-400" />
            </a>
          </div>
        </div>

        {/* Zero-Billing Safety Notice Banner */}
        <div className="mt-3 p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-300 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              <strong>Gemini Pro Subscription Protection:</strong> Your monthly consumer plan at <code className="text-purple-300">gemini.google.com</code> is separate from developer API credits. Click <strong>&ldquo;Copy Prompt for Gemini Pro Plan&rdquo;</strong> to run unlimited analyses inside your web app at <strong>$0.00 incremental cost</strong>.
            </span>
          </div>
        </div>
      </div>

      {/* Control Panel & Ingestion Workspace */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800/90 shadow-xl bg-slate-950/70 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          {/* Strategy Selection */}
          <div>
            <label className="block text-slate-300 font-bold mb-1 flex items-center space-x-1">
              <span>Strategy Preference</span>
            </label>
            <select
              value={strategy}
              onChange={(e) => setStrategy(e.target.value as any)}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              <option value="CSP">Cash-Secured Puts (CSPs) &bull; Delta -0.15 to -0.30</option>
              <option value="COVERED_CALL">Covered Calls (CCs) &bull; Delta +0.15 to +0.30</option>
              <option value="BOTH">Evaluate Both Strategies</option>
            </select>
          </div>

          {/* Min AROC (%) */}
          <div>
            <label className="block text-slate-300 font-bold mb-1">
              Target Minimum AROC (%)
            </label>
            <input
              type="number"
              value={minAroc}
              onChange={(e) => setMinAroc(Number(e.target.value))}
              min={5}
              max={100}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          {/* Model Specification */}
          <div>
            <label className="block text-slate-300 font-bold mb-1 flex items-center justify-between">
              <span>Gemini Model Engine</span>
              <span className="text-[10px] text-amber-400 font-mono">Thinking Level: HIGH</span>
            </label>
            <input
              type="text"
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              placeholder="e.g. gemini-2.5-flash or gemini-3.8-flash"
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>
        </div>

        {/* Screener Ingestion Area */}
        <div className="space-y-1.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <label className="text-slate-300 font-bold flex items-center space-x-1.5">
              <span>Raw Screener Data Payload:</span>
              <span className="text-[10px] text-slate-400 font-normal">
                (CSV, tab-delimited, Barchart View 190898, or MarketChameleon output)
              </span>
            </label>

            {/* Pre-fill Dataset Chips */}
            <div className="flex items-center space-x-1.5 overflow-x-auto text-[11px]">
              <span className="text-slate-400 text-xs">Load Active Data:</span>
              <button
                type="button"
                onClick={() => handleLoadCurrentScreenerData('barchart')}
                className="px-2 py-0.5 rounded bg-slate-800/80 hover:bg-slate-700 text-emerald-300 border border-emerald-500/30 text-[11px] cursor-pointer"
              >
                Barchart Direction (190898)
              </button>
              <button
                type="button"
                onClick={() => handleLoadCurrentScreenerData('marketchameleon')}
                className="px-2 py-0.5 rounded bg-slate-800/80 hover:bg-slate-700 text-purple-300 border border-purple-500/30 text-[11px] cursor-pointer"
              >
                MarketChameleon Screener
              </button>
              <button
                type="button"
                onClick={() => handleLoadCurrentScreenerData('custom')}
                className="px-2 py-0.5 rounded bg-slate-800/80 hover:bg-slate-700 text-amber-300 border border-amber-500/30 text-[11px] cursor-pointer"
              >
                Custom Watchlist
              </button>
            </div>
          </div>

          <textarea
            rows={6}
            value={screenerInput}
            onChange={(e) => setScreenerInput(e.target.value)}
            placeholder="Paste raw Barchart or MarketChameleon table text, or click 'Load Active Data' above...&#10;Symbol, Name, Last Price, 20-SMA, 50-SMA, RSI, IV Rank, Volume, Earnings Date..."
            className="w-full bg-slate-950/90 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-500 font-mono focus:outline-none focus:ring-1 focus:ring-amber-500 leading-relaxed"
          />
        </div>

        {/* Execution & Bridge Buttons Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-1">
          <div className="flex items-center space-x-2 flex-wrap gap-y-2">
            <button
              onClick={handleAnalyzeAPI}
              disabled={loading || !screenerInput.trim()}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 disabled:opacity-50 text-white text-xs font-bold transition-all cursor-pointer flex items-center space-x-2 shadow-lg shadow-amber-600/20"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Evaluating Thinking Mode (HIGH)...</span>
                </>
              ) : (
                <>
                  <BrainCircuit className="w-3.5 h-3.5 text-white" />
                  <span>Run Analysis (Free API)</span>
                </>
              )}
            </button>

            <button
              onClick={handleCopyPrompt}
              type="button"
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-2 border ${
                copySuccess
                  ? 'bg-emerald-600 text-white border-emerald-400 shadow-md shadow-emerald-600/30'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700 hover:border-slate-600'
              }`}
            >
              {copySuccess ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                  <span>Prompt Copied! Paste in Gemini Pro</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-amber-300" />
                  <span>Copy Prompt for Gemini Pro Plan ($0 Cost)</span>
                </>
              )}
            </button>
          </div>

          <div className="text-[11px] text-slate-400 font-mono flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Target: 5–10 DTE &bull; Strict Earnings Blackout</span>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start space-x-2 animate-fade-in">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">{error}</p>
              <p className="text-[11px] text-rose-300/80 mt-1">
                Tip: You can avoid all API restrictions by clicking <strong>&ldquo;Copy Prompt for Gemini Pro Plan&rdquo;</strong> and pasting it into your free or subscription-backed Gemini interface.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Analysis Output Section */}
      {analysisResult && (
        <div className="space-y-4 animate-fade-in">
          {/* Market Regime Context */}
          <div className="glass-panel p-4 rounded-xl border border-indigo-800/50 bg-indigo-950/20 text-xs text-indigo-200 flex items-start space-x-3">
            <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-300 shrink-0 mt-0.5">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-white uppercase tracking-wider text-[11px]">
                Macro Regime &amp; Volatility Context:
              </span>
              <p className="text-slate-300 mt-1 leading-relaxed">
                {analysisResult.market_regime_context || 'Balanced market regime with elevated single-stock dispersion.'}
              </p>
            </div>
          </div>

          {/* Recommended Candidates Table */}
          <div className="glass-panel rounded-2xl border border-slate-800/90 shadow-2xl overflow-hidden bg-slate-950/70">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">
                  Institutional Shortlist Candidates ({analysisResult.candidates?.length || 0})
                </h3>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                PoP &gt; 75% &bull; Cushion &ge; 3.5% &bull; AROC &ge; {minAroc}%
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300 border-collapse">
                <thead className="bg-slate-900/90 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-3 text-center">Tier</th>
                    <th className="py-3 px-4">Ticker</th>
                    <th className="py-3 px-3 text-center">Strategy</th>
                    <th className="py-3 px-3 text-right">Spot / Strike</th>
                    <th className="py-3 px-3 text-center">DTE &bull; Delta</th>
                    <th className="py-3 px-3 text-right">Premium (Bid/Ask)</th>
                    <th className="py-3 px-3 text-center">Downside Cushion</th>
                    <th className="py-3 px-3 text-right">Annualized AROC</th>
                    <th className="py-3 px-4">Technical Anchor Thesis</th>
                    <th className="py-3 px-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {(!analysisResult.candidates || analysisResult.candidates.length === 0) ? (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-slate-500 font-sans">
                        <p className="text-sm font-semibold">No candidates passed all quantitative income gates.</p>
                        <p className="text-xs mt-1">Review screening exclusions below for earnings or cushion violation details.</p>
                      </td>
                    </tr>
                  ) : (
                    analysisResult.candidates.map((c, idx) => {
                      const isPrimary = c.selection_tier === 'PRIMARY';
                      return (
                        <tr
                          key={`${c.ticker}-${idx}`}
                          className="hover:bg-slate-900/60 transition-colors group"
                        >
                          {/* Tier */}
                          <td className="py-3 px-3 text-center">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                isPrimary
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                  : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                              }`}
                            >
                              {c.selection_tier || 'PRIMARY'}
                            </span>
                          </td>

                          {/* Ticker */}
                          <td className="py-3 px-4 font-bold text-white text-sm">
                            <div className="flex items-center space-x-1.5">
                              <span>{c.ticker}</span>
                              {isPrimary && (
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Primary Conviction" />
                              )}
                            </div>
                          </td>

                          {/* Strategy */}
                          <td className="py-3 px-3 text-center">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                c.strategy === 'CSP'
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                  : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                              }`}
                            >
                              {c.strategy === 'CSP' ? 'Cash-Secured Put' : 'Covered Call'}
                            </span>
                          </td>

                          {/* Stock vs Strike */}
                          <td className="py-3 px-3 text-right text-slate-200">
                            <div>${c.current_price?.toFixed(2)}</div>
                            <div className="text-xs font-bold text-amber-300">
                              Strike: ${c.recommended_strike?.toFixed(2)}
                            </div>
                          </td>

                          {/* DTE & Delta */}
                          <td className="py-3 px-3 text-center text-slate-300">
                            <div>{c.dte} DTE</div>
                            <div className="text-[11px] text-slate-400">
                              &Delta; {c.delta}
                            </div>
                          </td>

                          {/* Expected Premium */}
                          <td className="py-3 px-3 text-right">
                            <div className="text-emerald-400 font-bold">
                              ${c.expected_premium?.toFixed(2)}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {c.bid_ask || `$${c.expected_premium?.toFixed(2)}`}
                            </div>
                          </td>

                          {/* Downside Cushion */}
                          <td className="py-3 px-3 text-center">
                            <span className="px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 font-bold text-xs">
                              {c.downside_cushion_pct?.toFixed(1)}%
                            </span>
                          </td>

                          {/* Annualized AROC */}
                          <td className="py-3 px-3 text-right">
                            <div className="text-sm font-black text-cyan-300">
                              {c.annualized_yield_pct?.toFixed(1)}%
                            </div>
                            <div className="text-[9px] text-slate-500 font-sans">
                              Annualized ROC
                            </div>
                          </td>

                          {/* Technical Anchor Thesis */}
                          <td className="py-3 px-4 font-sans text-xs text-slate-300 max-w-xs leading-relaxed">
                            <p className="line-clamp-2" title={c.technical_anchor}>
                              {c.technical_anchor}
                            </p>
                            {c.risk_factors && (
                              <div className="text-[10px] text-slate-400 mt-1 italic">
                                Risk: {c.risk_factors}
                              </div>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-3 text-center font-sans">
                            <div className="flex items-center justify-center space-x-1.5">
                              {onSelectSymbolForChart && (
                                <button
                                  onClick={() => onSelectSymbolForChart(c.ticker)}
                                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-400 transition-colors cursor-pointer"
                                  title="Open Interactive Candlestick Chart"
                                >
                                  <BarChart2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                              {onOpenTickerAudit && (
                                <button
                                  onClick={() => onOpenTickerAudit(c.ticker)}
                                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-emerald-400 transition-colors cursor-pointer"
                                  title="Open 5-Part Options Safety Audit"
                                >
                                  <ShieldCheck className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Screening Exclusions Audit */}
          {analysisResult.rejected_candidates && analysisResult.rejected_candidates.length > 0 && (
            <div className="glass-panel p-4 rounded-xl border border-slate-800/80 bg-slate-950/60 space-y-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span>Screening Exclusions &amp; Rejection Audit ({analysisResult.rejected_candidates.length})</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
                {analysisResult.rejected_candidates.map((r, i) => (
                  <div
                    key={i}
                    className="p-2.5 rounded-lg bg-slate-900 border border-slate-800/80 space-y-0.5"
                  >
                    <span className="font-bold text-white font-mono">{r.ticker}:</span>{' '}
                    <span className="text-slate-400">{r.reason}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* JSON Import Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div
            className="w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">
                  Import Gemini Pro Plan JSON Output
                </h3>
              </div>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3 overflow-y-auto">
              <p className="text-xs text-slate-300">
                Paste the raw JSON response generated by Google Gemini Pro (from <code className="text-purple-300">gemini.google.com</code>). The app will parse and render the decision table with zero API fees.
              </p>

              <textarea
                rows={10}
                value={jsonImportText}
                onChange={(e) => setJsonImportText(e.target.value)}
                placeholder='{&#10;  "market_regime_context": "...",&#10;  "candidates": [...],&#10;  "rejected_candidates": [...]&#10;}'
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-600 font-mono focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />

              {importError && (
                <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                  {importError}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleImportJSON}
                disabled={!jsonImportText.trim()}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-md shadow-cyan-600/30 cursor-pointer"
              >
                Render Analysis Matrix
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
