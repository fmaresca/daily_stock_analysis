import React, { useEffect, useState, useMemo } from 'react';
import {
  Calendar,
  AlertTriangle,
  RefreshCw,
  Search,
  Filter,
  Sparkles,
  Flame,
  ShieldAlert,
  BrainCircuit,
  TrendingUp,
  X,
  Check,
  Zap,
} from './icons';
import {
  EconomicIndicator,
  EconomicCalendarResponse,
  IndicatorFilterTier,
  MacroSynthesisOutput,
} from '../types/economicCalendar';

interface EconomicCalendarViewProps {
  onSelectSymbolForChart?: (symbol: string) => void;
  onOpenTickerAudit?: (symbol: string) => void;
}

export const EconomicCalendarView: React.FC<EconomicCalendarViewProps> = ({
  onSelectSymbolForChart,
  onOpenTickerAudit,
}) => {
  const [data, setData] = useState<EconomicCalendarResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Filters
  const [impactFilter, setImpactFilter] = useState<IndicatorFilterTier>('ALL');
  const [sectorFilter, setSectorFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // AI Macro Synthesis States
  const [isAiModalOpen, setIsAiModalOpen] = useState<boolean>(false);
  const [aiJsonInput, setAiJsonInput] = useState<string>('');
  const [copiedPrompt, setCopiedPrompt] = useState<boolean>(false);
  const [macroSynthesis, setMacroSynthesis] = useState<MacroSynthesisOutput | null>(null);

  const fetchCalendar = async (isManualRefresh = false) => {
    if (isManualRefresh) setIsRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      // Dual-runtime: try Cloudflare Pages Edge Function first, fallback to local FastAPI
      let res: Response;
      try {
        res = await fetch('/api/economic-calendar');
        if (!res.ok) throw new Error(`Edge returned ${res.status}`);
      } catch {
        res = await fetch('/api/v1/options/economic-calendar');
      }

      if (!res.ok) {
        throw new Error(`Unable to retrieve economic calendar (HTTP ${res.status})`);
      }

      const json: EconomicCalendarResponse = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message || 'Network error fetching macroeconomic calendar.');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCalendar();
  }, []);

  // Filtered indicators
  const filteredIndicators = useMemo(() => {
    if (!data?.indicators) return [];
    return data.indicators.filter((item) => {
      // Impact Filter
      if (impactFilter !== 'ALL' && item.impact.toUpperCase() !== impactFilter) {
        return false;
      }
      // Sector Filter
      if (sectorFilter !== 'ALL' && !item.sectors.toLowerCase().includes(sectorFilter.toLowerCase())) {
        return false;
      }
      // Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(query);
        const matchesSectors = item.sectors.toLowerCase().includes(query);
        const matchesTickers = item.tickers.toLowerCase().includes(query);
        if (!matchesTitle && !matchesSectors && !matchesTickers) return false;
      }
      return true;
    });
  }, [data, impactFilter, sectorFilter, searchQuery]);

  // Unique sector options for filter dropdown
  const sectorOptions = useMemo(() => {
    if (!data?.indicators) return [];
    const set = new Set<string>();
    data.indicators.forEach((item) => {
      item.sectors.split(',').forEach((s) => {
        const trimmed = s.trim();
        if (trimmed && trimmed !== 'Broad Equities') set.add(trimmed);
      });
    });
    return Array.from(set).sort();
  }, [data]);

  // Statistics
  const totalCount = data?.indicators?.length || 0;
  const highImpactList = useMemo(
    () => (data?.indicators || []).filter((i) => i.impact.toUpperCase() === 'HIGH'),
    [data]
  );
  const moderateImpactCount = useMemo(
    () => (data?.indicators || []).filter((i) => i.impact.toUpperCase() === 'MODERATE').length,
    [data]
  );

  // Generate Zero-Cost AI Macro Prompt for Gemini Pro
  const generateGeminiMacroPrompt = () => {
    if (!data?.indicators) return '';
    const formattedEvents = data.indicators
      .map(
        (e) =>
          `- [${e.impact.toUpperCase()}] ${e.dateET} ${e.timeET}: ${e.title} (Est: ${e.forecast}, Prior: ${e.previous}) | Affected: ${e.sectors} -> ${e.tickers}`
      )
      .join('\n');

    return `ACT AS AN INSTITUTIONAL CHIEF DERIVATIVES STRATEGIST AND MACRO RISK OFFICER.
ANALYZE THE FOLLOWING WEEKLY US ECONOMIC INDICATORS SCHEDULE FOR OPTIONS VOLATILITY & INCOME HARVESTING DEFENSE.

CURRENT WEEK MACRO SCHEDULE:
${formattedEvents}

MANDATORY QUANTITATIVE GUIDANCE TO GENERATE:
1. Identify all binary risk catalysts that will cause IV expansion or sharp gap risk.
2. Outline specific sector transmission channels (e.g. CPI shifting discount rates compressing Tech QQQ and Real Estate VNQ).
3. Provide tactical options defense rules (e.g., minimum downside cushion adjustments, earnings/catalyst blackout periods, recommended delta ranges for cash-secured puts and covered calls).

RESPOND STRICTLY IN VALID JSON FORMAT MATCHING THIS EXACT SCHEMA (NO MARKDOWN TEXT OUTSIDE JSON):
{
  "market_regime_summary": "Concise 2-3 sentence executive macroeconomic overview for this week's options volatility environment.",
  "high_impact_catalysts": [
    {
      "indicator": "Name of indicator (e.g. CPI, FOMC)",
      "date": "Day & Time (ET)",
      "expected_volatility": "High / Extreme",
      "strategic_impact": "Direct options pricing and sector rotation impact description."
    }
  ],
  "options_defense_rules": [
    "Actionable rule 1 for selling Cash-Secured Puts or Covered Calls during this macro week",
    "Actionable rule 2 for margin allocation and theta harvest timing"
  ],
  "recommended_delta_adjustment": "e.g. Tighten delta to -0.12 to -0.16 ahead of Wednesday FOMC; allow IV crush harvest post-presser."
}`;
  };

  const handleCopyAiPrompt = async () => {
    const prompt = generateGeminiMacroPrompt();
    try {
      await navigator.clipboard.writeText(prompt);
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 3000);
    } catch {
      // Fallback
    }
  };

  const handleImportJson = () => {
    try {
      let cleaned = aiJsonInput.trim();
      if (cleaned.startsWith('```json')) cleaned = cleaned.replace(/^```json\s*/, '');
      if (cleaned.endsWith('```')) cleaned = cleaned.replace(/\s*```$/, '');
      const parsed: MacroSynthesisOutput = JSON.parse(cleaned);
      if (parsed.market_regime_summary && Array.isArray(parsed.options_defense_rules)) {
        setMacroSynthesis(parsed);
        setIsAiModalOpen(false);
        setAiJsonInput('');
      } else {
        alert('JSON does not contain the required fields (market_regime_summary, options_defense_rules).');
      }
    } catch (e: any) {
      alert(`Invalid JSON: ${e.message}`);
    }
  };

  const getImpactBadgeClass = (impact: string) => {
    const level = impact.toUpperCase();
    if (level === 'HIGH') {
      return 'bg-rose-500/20 text-rose-300 border border-rose-500/40 ring-1 ring-rose-500/20';
    }
    if (level === 'MODERATE' || level === 'MEDIUM') {
      return 'bg-amber-500/20 text-amber-300 border border-amber-500/40';
    }
    return 'bg-slate-800 text-slate-400 border border-slate-700/60';
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* View Header */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800/80 bg-slate-900/60 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-blue-500/15 text-blue-400 border border-blue-500/30">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <span>Weekly US Economic Indicators &amp; Macro Catalyst Radar</span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30">
                  Forex Factory USD Feed
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                All releases normalized to US Eastern Time (ET). Deterministically mapped to sector transmission channels and proxy ETFs.
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center flex-wrap gap-2.5">
          <button
            onClick={() => setIsAiModalOpen(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-lg shadow-violet-600/30 transition-all border border-violet-400/40 cursor-pointer"
          >
            <BrainCircuit className="w-4 h-4 text-violet-200" />
            <span>AI Macro Catalyst Outlook ($0 Cost)</span>
          </button>

          <button
            onClick={() => fetchCalendar(true)}
            disabled={isRefreshing}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-400' : ''}`} />
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh Feed'}</span>
          </button>
        </div>
      </div>

      {/* Evident Warning Banner when Offline Fallback is Active */}
      {data?.fallback && (
        <div className="p-4 rounded-xl border border-amber-500/50 bg-amber-950/30 text-amber-200 text-xs flex items-start space-x-3 shadow-lg">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-bold text-amber-300 flex items-center gap-2">
              <span>⚠️ Offline Baseline Schedule Active</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300">
                Fallback Mode
              </span>
            </div>
            <p className="text-amber-200/90 leading-relaxed">
              {data.notice || 'The live remote calendar feed is temporarily unreachable. Displaying pre-cached baseline US economic schedule with full sector-impact mappings.'}
            </p>
          </div>
        </div>
      )}

      {/* AI Macro Synthesis Summary Banner (if imported) */}
      {macroSynthesis && (
        <div className="glass-panel p-5 rounded-2xl border border-violet-500/40 bg-gradient-to-r from-violet-950/30 via-slate-900 to-indigo-950/30 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-violet-300 font-bold text-xs uppercase tracking-wider">
              <BrainCircuit className="w-4 h-4 text-violet-400" />
              <span>Gemini Pro Macro Regime Outlook &amp; Defense Guidance</span>
            </div>
            <button
              onClick={() => setMacroSynthesis(null)}
              className="text-slate-500 hover:text-slate-300 text-xs"
            >
              Dismiss
            </button>
          </div>
          <p className="text-xs text-slate-200 leading-relaxed font-medium">
            {macroSynthesis.market_regime_summary}
          </p>
          {macroSynthesis.options_defense_rules.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1 text-xs">
              {macroSynthesis.options_defense_rules.map((rule, idx) => (
                <div key={idx} className="p-2.5 rounded-lg bg-slate-950/70 border border-violet-500/20 text-slate-300 flex items-start space-x-2">
                  <ShieldAlert className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
                  <span>{rule}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* High-Impact Alert Ribbon */}
      {highImpactList.length > 0 && (
        <div className="glass-panel p-4 rounded-xl border border-rose-500/30 bg-rose-950/15 space-y-2">
          <div className="flex items-center space-x-2 text-rose-400 font-bold text-xs uppercase tracking-wider">
            <Flame className="w-4 h-4" />
            <span>High-Impact Volatility Catalysts This Week ({highImpactList.length} Events)</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Major binary macro events can cause significant Implied Volatility (IV) expansion or sharp gap risks. Options sellers are advised to avoid opening narrow spreads or naked positions across vulnerable sectors 24 hours prior to release:
          </p>
          <div className="flex items-center gap-2 flex-wrap pt-1">
            {highImpactList.map((item, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 rounded-lg bg-slate-950/80 border border-rose-500/30 text-xs text-rose-200 font-mono flex items-center space-x-1.5"
              >
                <span className="font-bold text-rose-400">{item.dateET} {item.timeET}:</span>
                <span>{item.title}</span>
                <span className="text-[10px] text-slate-400">({item.tickers})</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Macro Statistics Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="glass-panel p-4 rounded-xl border border-slate-800 bg-slate-900/50">
          <div className="text-[11px] text-slate-400 uppercase font-mono tracking-wider">Total US Releases</div>
          <div className="text-2xl font-black font-mono text-white mt-1">{totalCount} Events</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Current weekly schedule</div>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-rose-500/20 bg-rose-950/10">
          <div className="text-[11px] text-rose-300 uppercase font-mono tracking-wider flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-rose-400" />
            <span>High-Impact Catalysts</span>
          </div>
          <div className="text-2xl font-black font-mono text-rose-400 mt-1">{highImpactList.length}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">FOMC, CPI, NFP, Retail Sales</div>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-amber-500/20 bg-amber-950/10">
          <div className="text-[11px] text-amber-300 uppercase font-mono tracking-wider flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
            <span>Moderate-Impact Releases</span>
          </div>
          <div className="text-2xl font-black font-mono text-amber-400 mt-1">{moderateImpactCount}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">PMI, Jobless Claims, Crude Oil</div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="glass-panel p-3.5 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-3">
        {/* Search Box */}
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search indicator, sector, or ticker (e.g. CPI, QQQ, FOMC)..."
            className="w-full bg-slate-900/90 border border-slate-700/80 rounded-lg pl-9 pr-8 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs"
            >
              ×
            </button>
          )}
        </div>

        {/* Impact Tier Buttons & Sector Filter */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center rounded-lg bg-slate-900 border border-slate-800 p-0.5 text-xs">
            {(['ALL', 'HIGH', 'MODERATE', 'LOW'] as IndicatorFilterTier[]).map((tier) => (
              <button
                key={tier}
                onClick={() => setImpactFilter(tier)}
                className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
                  impactFilter === tier
                    ? tier === 'HIGH'
                      ? 'bg-rose-600 text-white shadow-md'
                      : tier === 'MODERATE'
                      ? 'bg-amber-600 text-white shadow-md'
                      : 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {tier}
              </button>
            ))}
          </div>

          {/* Sector Select */}
          <select
            value={sectorFilter}
            onChange={(e) => setSectorFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-slate-300 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All Sectors</option>
            {sectorOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 rounded-xl border border-rose-500/50 bg-rose-950/20 text-rose-300 text-xs flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={() => fetchCalendar(true)}
            className="underline hover:text-white font-semibold cursor-pointer"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Main Indicators Table */}
      {loading ? (
        <div className="glass-panel p-12 rounded-xl border border-slate-800 text-center space-y-3">
          <RefreshCw className="w-6 h-6 text-blue-400 animate-spin mx-auto" />
          <div className="text-sm font-semibold text-slate-300">Retrieving Macroeconomic Schedule...</div>
          <div className="text-xs text-slate-500">Normalizing Eastern Time and mapping sector transmission channels</div>
        </div>
      ) : filteredIndicators.length === 0 ? (
        <div className="glass-panel p-12 rounded-xl border border-slate-800 text-center space-y-2">
          <div className="text-sm font-semibold text-slate-300">No Economic Indicators Matched Filters</div>
          <div className="text-xs text-slate-500">Try resetting the impact tier or search criteria.</div>
          <button
            onClick={() => {
              setImpactFilter('ALL');
              setSectorFilter('ALL');
              setSearchQuery('');
            }}
            className="mt-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-semibold cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-800 shadow-xl">
          <table className="w-full text-left text-xs text-slate-300 border-collapse bg-slate-900/70">
            <thead>
              <tr className="bg-slate-950/90 text-[11px] text-slate-400 uppercase font-mono tracking-wider border-b border-slate-800">
                <th className="py-3 px-4">Date &amp; Time (ET)</th>
                <th className="py-3 px-4">Economic Indicator</th>
                <th className="py-3 px-4">Market Impact</th>
                <th className="py-3 px-4">Consensus / Prior</th>
                <th className="py-3 px-4">Vulnerable Sectors</th>
                <th className="py-3 px-4">Proxy ETFs &amp; Securities</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filteredIndicators.map((item, index) => (
                <tr
                  key={index}
                  className="hover:bg-slate-800/40 transition-colors group"
                >
                  {/* Date & Time */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="font-bold text-white font-mono">{item.dateET}</div>
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5">{item.timeET} ET</div>
                  </td>

                  {/* Indicator Title */}
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-100 group-hover:text-blue-300 transition-colors">
                      {item.title}
                    </div>
                  </td>

                  {/* Impact */}
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold font-mono inline-block ${getImpactBadgeClass(
                        item.impact
                      )}`}
                    >
                      {item.impact}
                    </span>
                  </td>

                  {/* Consensus / Prior */}
                  <td className="py-3.5 px-4 font-mono text-[11px]">
                    <div>
                      <span className="text-slate-500">Est:</span>{' '}
                      <span className="text-emerald-400 font-bold">{item.forecast}</span>
                    </div>
                    <div className="mt-0.5">
                      <span className="text-slate-500">Prior:</span>{' '}
                      <span className="text-slate-400">{item.previous}</span>
                    </div>
                  </td>

                  {/* Vulnerable Sectors */}
                  <td className="py-3.5 px-4 text-slate-300 text-[11px] leading-relaxed max-w-xs">
                    {item.sectors}
                  </td>

                  {/* Proxy Tickers */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {item.tickers.split(',').map((tick) => {
                        const symbol = tick.trim();
                        return (
                          <button
                            key={symbol}
                            onClick={() => {
                              if (onSelectSymbolForChart) onSelectSymbolForChart(symbol);
                              else if (onOpenTickerAudit) onOpenTickerAudit(symbol);
                            }}
                            title={`Inspect ${symbol} charts and volatility`}
                            className="px-2 py-0.5 rounded bg-slate-950 border border-blue-500/30 text-blue-300 hover:bg-blue-600 hover:text-white hover:border-blue-400 font-mono font-bold text-[11px] transition-all cursor-pointer"
                          >
                            {symbol}
                          </button>
                        );
                      })}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* AI Macro Synthesis Modal ($0 Cost Copy Bridge) */}
      {isAiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div
            className="w-full max-w-2xl bg-slate-900 border border-violet-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
              <div className="flex items-center space-x-2 text-violet-300 font-bold text-sm">
                <BrainCircuit className="w-5 h-5 text-violet-400" />
                <span>AI Macro Catalyst Outlook ($0 Cost Gemini Pro Bridge)</span>
              </div>
              <button
                onClick={() => setIsAiModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 overflow-y-auto text-xs text-slate-300">
              <div className="p-3 rounded-xl bg-violet-950/20 border border-violet-500/30 text-violet-200">
                Generate an institutional macro volatility and options strike defense analysis using your personal consumer Google Gemini Pro plan (<code className="text-amber-300">gemini.google.com</code>) with zero developer API charges.
              </div>

              {/* Step 1: Copy Prompt */}
              <div className="space-y-1.5">
                <div className="font-bold text-white flex items-center justify-between">
                  <span>Step 1: Copy Pre-Formatted Macro Prompt</span>
                  {copiedPrompt && (
                    <span className="text-emerald-400 font-mono flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Copied to Clipboard!
                    </span>
                  )}
                </div>
                <button
                  onClick={handleCopyAiPrompt}
                  className="w-full py-2.5 rounded-xl font-bold bg-violet-600 hover:bg-violet-500 text-white shadow-md shadow-violet-600/30 transition-all flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{copiedPrompt ? 'Copied!' : 'Copy Macro Prompt for Gemini Pro'}</span>
                </button>
              </div>

              {/* Step 2: Open Gemini */}
              <div className="space-y-1">
                <div className="font-bold text-white">Step 2: Paste in Gemini Pro</div>
                <p className="text-slate-400 leading-relaxed">
                  Open <a href="https://gemini.google.com" target="_blank" rel="noreferrer" className="text-blue-400 underline hover:text-blue-300">gemini.google.com</a> in your browser, paste the prompt, and let Gemini generate the structured JSON response.
                </p>
              </div>

              {/* Step 3: Paste JSON Back */}
              <div className="space-y-1.5">
                <div className="font-bold text-white">Step 3: Import Model Output JSON</div>
                <textarea
                  value={aiJsonInput}
                  onChange={(e) => setAiJsonInput(e.target.value)}
                  placeholder="Paste Gemini's output JSON here..."
                  rows={6}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-violet-500"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-end space-x-2">
              <button
                onClick={() => setIsAiModalOpen(false)}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleImportJson}
                disabled={!aiJsonInput.trim()}
                className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-emerald-600/30 transition-all cursor-pointer"
              >
                Apply Macro Synthesis
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
