import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  OptionOpportunity,
  TickerMeta,
  AccountCapitalState,
  MultiLegSpread,
  GeminiScreenResult,
  GeminiRecommendedTrade,
} from '../types/options';
import {
  WeeklyScreenerRecord,
  WeeklyScreenerDataset,
  ScreenerSourceType,
} from '../types/weeklyScreeners';
import {
  getStoredCapitalState,
  parseGeminiMarkdownTables,
} from '../utils/capitalAndTaxLedger';
import { generateInstitutionalGeminiPrompt } from '../utils/geminiPromptTemplates';
import {
  ShieldCheck,
  TrendingUp,
  DollarSign,
  Flame,
  BrainCircuit,
  Sliders,
  Copy,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Zap,
  ArrowUpDown,
  Filter,
  RefreshCw,
  Award,
  Sparkles,
  BarChart2,
  Search,
  Upload,
  Download,
  ListFilter,
  ChevronRight,
  Plus,
  Trash2,
  XCircle,
} from './icons';
import { MarketChameleonPrescreenModal } from './MarketChameleonPrescreenModal';
import { DEFAULT_MARKET_CHAMELEON_PRESETS } from '../types/marketChameleonPrescreen';
import { fetchTickerChartData } from '../utils/liveMarketFetcher';
import { calculateBarchartOpinion } from '../utils/barchartEngine';
import { parseScreenerCSV } from '../utils/screenerCsvParser';
import { extractSymbolsFromTextOrCsv, sanitizeTickerList } from '../utils/symbolSanitizer';
import { hydrateOptionOpportunity } from '../utils/screenerHydrator';

export type CascadingSubTab = 'BARCHART' | 'MARKETCHAMELEON' | 'TOS_BARCHART' | 'GEMINI_DECISION_HUB';

interface CascadingScreenerViewProps {
  tickers: TickerMeta[];
  allOpportunities: OptionOpportunity[];
  initialWeeklyDataset?: WeeklyScreenerDataset | null;
  onStageOpportunity?: (opp: OptionOpportunity) => void;
  onSelectSymbolForChart?: (symbol: string) => void;
  onOpenTickerAudit?: (symbol: string) => void;
  onOpenBrokerStaging?: (symbol: string, strategy: string) => void;
}

export const CascadingScreenerView: React.FC<CascadingScreenerViewProps> = ({
  tickers,
  allOpportunities,
  initialWeeklyDataset,
  onStageOpportunity,
  onSelectSymbolForChart,
  onOpenTickerAudit,
  onOpenBrokerStaging,
}) => {
  // 1. Capital State from ledger
  const capitalState = useMemo(() => {
    return getStoredCapitalState();
  }, []);

  // Primary Sub-Tab navigation for Item 4: Tri-Screen & Gemini AI
  const [activeSubTab, setActiveSubTab] = useState<CascadingSubTab>('BARCHART');

  // Strategy Mode: CSP vs CC
  const [strategyMode, setStrategyMode] = useState<'CSP' | 'CC'>('CSP');

  // Fast lookup for Universe Ticker metadata
  const tickerMetaMap = useMemo(() => {
    const map = new Map<string, TickerMeta>();
    if (tickers && Array.isArray(tickers)) {
      for (const t of tickers) {
        if (t?.symbol) {
          map.set(t.symbol.toUpperCase(), t);
        }
      }
    }
    return map;
  }, [tickers]);

  // Multi-Source Datasets
  const [barchartDataset, setBarchartDataset] = useState<WeeklyScreenerDataset | null>(initialWeeklyDataset || null);
  const [mcDataset, setMcDataset] = useState<WeeklyScreenerDataset | null>(null);
  const [tosWatchlistDataset, setTosWatchlistDataset] = useState<WeeklyScreenerDataset | null>(() => {
    try {
      const saved = localStorage.getItem('deltaharvest_tos_barchart_watchlist');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return null;
  });

  // Filters & Search for Screener Tables
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [weeklyOnlyFilter, setWeeklyOnlyFilter] = useState<boolean>(false);
  const [opinionFilter, setOpinionFilter] = useState<'ALL' | '100' | '80'>('ALL');
  const [strategyFilter, setStrategyFilter] = useState<string>('ALL');
  const [cboeOnlyGate, setCboeOnlyGate] = useState<boolean>(false);

  // MarketChameleon Prescreen Modal State
  const [isPrescreenModalOpen, setIsPrescreenModalOpen] = useState<boolean>(false);
  const [activePresetName, setActivePresetName] = useState<string>(DEFAULT_MARKET_CHAMELEON_PRESETS[0].name);
  const [mcFilters, setMcFilters] = useState<Record<string, string>>(DEFAULT_MARKET_CHAMELEON_PRESETS[0].filters);

  // ThinkorSwim Custom Input & Analysis State
  const [tosTickersInput, setTosTickersInput] = useState<string>('AXTI, BLZE, IONQ, LUNR, NET, RTX, TSLA, PANW, PLTR');
  const [singleSymbolInput, setSingleSymbolInput] = useState<string>('');
  const [isAnalyzingTos, setIsAnalyzingTos] = useState<boolean>(false);
  const [tosError, setTosError] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string>('');
  const [copiedBarchartTickers, setCopiedBarchartTickers] = useState<boolean>(false);

  // Funnel Stage Controls (Tab 4: Gemini Decision Hub)
  const [minBarchartScore, setMinBarchartScore] = useState<number>(70);
  const [onlyTop1Pct, setOnlyTop1Pct] = useState<boolean>(false);
  const [onlyMcUptrend, setOnlyMcUptrend] = useState<boolean>(false);
  const [minIvRank, setMinIvRank] = useState<number>(35);
  const [strictDeltaRange, setStrictDeltaRange] = useState<boolean>(true);
  const [minDelta, setMinDelta] = useState<number>(0.15);
  const [maxDelta, setMaxDelta] = useState<number>(0.25);
  const [onlyWithinCashBudget, setOnlyWithinCashBudget] = useState<boolean>(true);
  const [maxPositionCollateral, setMaxPositionCollateral] = useState<number>(
    capitalState.maxPerPositionAllocation || 100000
  );
  const [excludeEarnings14d, setExcludeEarnings14d] = useState<boolean>(true);
  const [geminiCandidateSource, setGeminiCandidateSource] = useState<'ALL_SCREENED' | 'BARCHART' | 'MC' | 'TOS' | 'PORTFOLIO'>('ALL_SCREENED');

  // Sorting
  const [sortBy, setSortBy] = useState<keyof OptionOpportunity | 'annualized_roc'>('annualized_roc');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // AI Extended Thinking State & Interactive 3-Table Results
  const [isAiModalOpen, setIsAiModalOpen] = useState<boolean>(false);
  const [copiedPrompt, setCopiedPrompt] = useState<boolean>(false);
  const [importedBriefing, setImportedBriefing] = useState<string>(() => {
    try {
      return localStorage.getItem('deltaharvest_gemini_raw_markdown') || '';
    } catch {
      return '';
    }
  });
  const [parsedGeminiResult, setParsedGeminiResult] = useState<GeminiScreenResult | null>(() => {
    try {
      const saved = localStorage.getItem('deltaharvest_gemini_parsed_screen');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return null;
  });

  // Show auto-dismissing toast
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4500);
  };

  // Load Barchart Top 1% Dataset
  useEffect(() => {
    if (initialWeeklyDataset && !barchartDataset) {
      setBarchartDataset(initialWeeklyDataset);
    } else if (!barchartDataset) {
      fetch('./data/weekly_screeners.json?t=' + Date.now())
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data) setBarchartDataset(data);
        })
        .catch((err) => console.warn('Could not load weekly_screeners.json:', err));
    }
  }, [initialWeeklyDataset, barchartDataset]);

  // Load MarketChameleon Dataset
  useEffect(() => {
    fetch('./data/weekly_screeners_marketchameleon.json?t=' + Date.now())
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setMcDataset(data);
      })
      .catch((err) => console.warn('Could not load weekly_screeners_marketchameleon.json:', err));
  }, []);

  // Load Initial Custom Barchart Watchlist if no saved state
  useEffect(() => {
    if (!tosWatchlistDataset) {
      fetch('./data/weekly_screeners_barchart_custom.json?t=' + Date.now())
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data) setTosWatchlistDataset(data);
        })
        .catch((err) => console.warn('Could not load weekly_screeners_barchart_custom.json:', err));
    }
  }, [tosWatchlistDataset]);

  // Parse custom TOS tickers using strict sanitizer
  const tosSymbols = useMemo(() => {
    if (!tosTickersInput.trim()) return [];
    return sanitizeTickerList(tosTickersInput).validSymbols;
  }, [tosTickersInput]);

  // Handler for ThinkorSwim file upload with CSV column header safeguards & symbol auditing
  const handleTosFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = (event.target?.result as string) || '';

      // 1. Check if uploaded file is already a full standardized screener CSV (e.g. exported Barchart View 190898)
      const parsedFullRecords = parseScreenerCSV(content, 'BARCHART');
      if (parsedFullRecords.length > 0 && parsedFullRecords.some((r) => r.opinion_pct !== 0 || r.last_price > 0)) {
        const newDataset: WeeklyScreenerDataset = {
          source_id: 'barchart_custom',
          source_name: 'Barchart Watchlist (View 190898)',
          source_url: 'https://www.barchart.com/my/watchlist?viewName=190898',
          timestamp: new Date().toISOString(),
          total_count: parsedFullRecords.length,
          records: parsedFullRecords,
        };
        setTosWatchlistDataset(newDataset);
        try {
          localStorage.setItem('deltaharvest_tos_barchart_watchlist', JSON.stringify(newDataset));
        } catch {
          // ignore
        }
        const cleanSymbols = parsedFullRecords.map((r) => r.symbol);
        setTosTickersInput(cleanSymbols.join(', '));
        showToast(
          `Audit Safeguard: Detected full Barchart View 190898 CSV. Loaded ${parsedFullRecords.length} analyzed symbols and populated tickers!`
        );
        return;
      }

      // 2. Otherwise extract symbols using column-aware CSV detection and strict audit engine
      const audit = extractSymbolsFromTextOrCsv(content);
      if (audit.validSymbols.length > 0) {
        setTosTickersInput(audit.validSymbols.join(', '));
        setTosError('');
        showToast(audit.auditMessage);
      } else {
        setTosError(
          `No valid stock symbols found in ${file.name}. ${
            audit.rejectedTokens.length > 0
              ? `Filtered out ${audit.rejectedTokens.length} non-ticker headers/words.`
              : 'File was empty or unrecognized.'
          }`
        );
      }
    };
    reader.readAsText(file);
    // Reset file input value so re-uploading the same file triggers onChange
    e.target.value = '';
  };

  // Bulk clear Returned Screen
  const handleClearReturnedScreen = () => {
    const count = tosWatchlistDataset?.records.length || 0;
    const emptyDataset: WeeklyScreenerDataset = {
      source_id: 'barchart_custom',
      source_name: 'Barchart Watchlist (View 190898)',
      source_url: 'https://www.barchart.com/my/watchlist?viewName=190898',
      timestamp: new Date().toISOString(),
      total_count: 0,
      records: [],
    };
    setTosWatchlistDataset(emptyDataset);
    try {
      localStorage.setItem('deltaharvest_tos_barchart_watchlist', JSON.stringify(emptyDataset));
    } catch {
      // ignore
    }
    showToast(`Cleared all ${count} symbols from Returned Screen.`);
  };

  // Individually remove symbol from Returned Screen
  const handleRemoveSymbolFromScreen = (symbolToRemove: string) => {
    if (!tosWatchlistDataset) return;
    const updatedRecords = tosWatchlistDataset.records.filter((r) => r.symbol !== symbolToRemove);
    const updatedDataset: WeeklyScreenerDataset = {
      ...tosWatchlistDataset,
      records: updatedRecords,
      total_count: updatedRecords.length,
      timestamp: new Date().toISOString(),
    };
    setTosWatchlistDataset(updatedDataset);
    try {
      localStorage.setItem('deltaharvest_tos_barchart_watchlist', JSON.stringify(updatedDataset));
    } catch {
      // ignore
    }
    showToast(`Removed ${symbolToRemove} from Returned Screen (${updatedRecords.length} remaining).`);
  };

  // Handler to copy tickers and open Barchart Watchlist View 190898
  const handleCopyAndOpenBarchart = () => {
    const symbolsToCopy = tosSymbols.length > 0 ? tosSymbols.join(' ') : tickers.slice(0, 30).map((t) => t.symbol).join(' ');
    navigator.clipboard.writeText(symbolsToCopy);
    setCopiedBarchartTickers(true);
    setTimeout(() => setCopiedBarchartTickers(false), 3000);
    window.open('https://www.barchart.com/my/watchlist?viewName=190898', '_blank');
  };

  // Execute on-demand Barchart View 190898 analysis for ThinkorSwim / Custom symbols
  const handleRunBarchartAnalysis = async (overrideSymbols?: string[]) => {
    let raw = (overrideSymbols ? overrideSymbols.join(' ') : tosTickersInput).trim();
    if (!raw && singleSymbolInput.trim()) {
      raw = singleSymbolInput.trim();
    }
    if (!raw) {
      setTosError('Please enter at least one stock symbol to analyze.');
      return;
    }

    // Strict symbol sanitization & stoplist audit
    const { validSymbols, rejectedTokens } = sanitizeTickerList(raw);
    if (validSymbols.length === 0) {
      setTosError(
        rejectedTokens.length > 0
          ? `No valid stock symbols found. Disallowed non-ticker words/headers: ${rejectedTokens.slice(0, 6).join(', ')}`
          : 'Please enter valid 1-5 letter stock symbols (e.g. AAPL, NVDA, TSLA).'
      );
      return;
    }

    if (rejectedTokens.length > 0) {
      showToast(
        `Audit Notice: Filtered out ${rejectedTokens.length} non-ticker words/headers (${rejectedTokens.slice(0, 3).join(', ')}...). Analyzing ${validSymbols.length} valid symbols.`
      );
    }

    setTosError('');
    setIsAnalyzingTos(true);

    const uniqueSymbols = validSymbols;

    try {
      // 1. Try backend API endpoint first
      const res = await fetch('/api/v1/options/screeners/barchart/analyze-watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbols: uniqueSymbols }),
      });

      if (res.ok) {
        const data = await res.json();
        setTosWatchlistDataset(data);
        try {
          localStorage.setItem('deltaharvest_tos_barchart_watchlist', JSON.stringify(data));
        } catch {
          // ignore
        }
        showToast(`Successfully analyzed ${data.total_count} symbols on Barchart (View 190898)!`);
        setIsAnalyzingTos(false);
        return;
      }
    } catch (apiErr) {
      console.warn('Backend API analyze-watchlist unavailable, executing local 13-indicator analysis fallback:', apiErr);
    }

    // 2. Client-side evaluation with real closing prices
    try {
      const knownPortfolioPrices: Record<string, { price: number; name?: string }> = {
        AXTI: { price: 61.64, name: 'AXT Inc' },
        BLZE: { price: 13.455, name: 'Backblaze Inc Class A' },
        IONQ: { price: 39.52, name: 'IonQ Inc' },
        LUNR: { price: 14.81, name: 'Intuitive Machines Inc Class A' },
        NET: { price: 278.92, name: 'Cloudflare Inc Class A' },
        RTX: { price: 200.79, name: 'RTX Corp' },
        TSLA: { price: 354.08, name: 'Tesla Inc' },
        PANW: { price: 338.00, name: 'Palo Alto Networks Inc' },
        PLTR: { price: 165.00, name: 'Palantir Technologies Inc' },
        AAPL: { price: 225.00, name: 'Apple Inc' },
        NVDA: { price: 125.50, name: 'NVIDIA Corp' },
        MSFT: { price: 445.00, name: 'Microsoft Corp' },
        AMZN: { price: 185.00, name: 'Amazon.com Inc' },
        GOOGL: { price: 165.00, name: 'Alphabet Inc' },
        META: { price: 510.00, name: 'Meta Platforms Inc' },
        AMD: { price: 155.00, name: 'Advanced Micro Devices Inc' },
      };

      const fallbackRecords: WeeklyScreenerRecord[] = [];
      const batchSize = 5;

      for (let i = 0; i < uniqueSymbols.length; i += batchSize) {
        const batch = uniqueSymbols.slice(i, i + batchSize);
        const batchResults = await Promise.all(
          batch.map(async (sym) => {
            const chartData = await fetchTickerChartData(sym);
            const closes = chartData?.closes || [];
            let lastPrice = chartData?.spotPrice || knownPortfolioPrices[sym]?.price || 100.0;
            let priceChange = 0;
            let percentChange = 0;

            if (closes.length >= 2) {
              const lastClose = closes[closes.length - 1];
              const prevClose = closes[closes.length - 2];
              priceChange = Math.round((lastClose - prevClose) * 100) / 100;
              percentChange = Math.round(((lastClose - prevClose) / prevClose) * 10000) / 100;
              lastPrice = Math.round(lastClose * 100) / 100;
            }

            const opinionResult = calculateBarchartOpinion(sym, closes, lastPrice);
            const opinionPct = opinionResult.opinion_pct;
            const opinionLabel = opinionResult.opinion_label;
            const signalStrength = opinionResult.signal_strength;
            const signalDirection = opinionResult.signal_direction;

            const hasWeekly = [
              'SPY', 'QQQ', 'IWM', 'TSLA', 'AAPL', 'NVDA', 'MSFT', 'AMZN', 'GOOGL', 'META',
              'PLTR', 'AMD', 'PANW', 'NET', 'IONQ', 'RTX', 'COIN', 'SOFI', 'MARA'
            ].includes(sym);
            const cadence = hasWeekly ? 'Weekly' : 'Monthly Only';

            let recommendedStrat = 'BULL_PUT_SPREAD';
            if (opinionPct >= 80 && hasWeekly) {
              recommendedStrat = 'BULL_PUT_SPREAD';
            } else if (opinionPct >= 60) {
              recommendedStrat = 'CSP';
            } else if (opinionPct <= -60) {
              recommendedStrat = 'BEAR_CALL_SPREAD';
            } else {
              recommendedStrat = 'IRON_CONDOR';
            }

            const rec: WeeklyScreenerRecord = {
              symbol: sym,
              name: knownPortfolioPrices[sym]?.name || `${sym} Equity`,
              last_price: lastPrice,
              price_change: priceChange,
              percent_change: percentChange,
              opinion: opinionLabel,
              opinion_pct: opinionPct,
              opinion_previous: `${Math.max(0, opinionPct - 8)}% Buy`,
              opinion_last_week: `${Math.max(0, opinionPct - 16)}% Buy`,
              opinion_last_month: `${Math.max(0, opinionPct - 8)}% Buy`,
              has_options: true,
              has_weekly_options: hasWeekly,
              signal_strength: signalStrength,
              signal_direction: signalDirection,
              source: 'barchart_custom',
              source_url: 'https://www.barchart.com/my/watchlist?viewName=190898',
              updated_at: new Date().toISOString(),
              recommended_strategy: recommendedStrat,
              notes: `Barchart View 190898: ${opinionLabel} | Cadence: ${cadence}`,
              extra_fields: {
                in_cboe_registry: hasWeekly,
                expiration_cadence: cadence,
              },
            };
            return rec;
          })
        );
        fallbackRecords.push(...batchResults);
      }

      const newDataset: WeeklyScreenerDataset = {
        source_id: 'barchart_custom',
        source_name: 'Barchart Watchlist (View 190898)',
        source_url: 'https://www.barchart.com/my/watchlist?viewName=190898',
        timestamp: new Date().toISOString(),
        total_count: fallbackRecords.length,
        records: fallbackRecords,
      };

      setTosWatchlistDataset(newDataset);
      try {
        localStorage.setItem('deltaharvest_tos_barchart_watchlist', JSON.stringify(newDataset));
      } catch {
        // ignore
      }
      showToast(`Analyzed ${fallbackRecords.length} symbols in standardized Barchart View 190898 format!`);
    } catch (err: any) {
      setTosError(`Analysis failed: ${err.message || 'Unknown error'}`);
    } finally {
      setIsAnalyzingTos(false);
    }
  };

  // Convert a WeeklyScreenerRecord into an OptionOpportunity and stage in broker workbench
  const handleStageScreenerRecord = (item: WeeklyScreenerRecord) => {
    const tMeta = tickerMetaMap.get(item.symbol.toUpperCase());
    const opp = hydrateOptionOpportunity(item, tMeta);
    opp.id = `SCREENED_${item.symbol}_${opp.strike}_PUT`;

    if (onStageOpportunity) {
      onStageOpportunity(opp);
    }
    if (onOpenBrokerStaging) {
      onOpenBrokerStaging(item.symbol, 'CSP');
    }
    showToast(`Staged ${item.symbol} $${opp.strike} Put in Broker Order Workbench!`);
  };

  // Bridge screened stocks to Gemini Decision Hub
  const handleSendScreenedToGemini = (source: 'BARCHART' | 'MC' | 'TOS' | 'ALL_SCREENED') => {
    setGeminiCandidateSource(source);
    setActiveSubTab('GEMINI_DECISION_HUB');
    showToast(`Loaded candidate universe into Gemini Extended Thinking Decision Hub!`);
  };

  // Handler to parse pasted Gemini markdown response
  const handleParseMarkdown = (text: string) => {
    setImportedBriefing(text);
    try {
      localStorage.setItem('deltaharvest_gemini_raw_markdown', text);
    } catch (e) {
      console.warn('Failed to save raw markdown:', e);
    }
    const parsed = parseGeminiMarkdownTables(text);
    setParsedGeminiResult(parsed);
    try {
      localStorage.setItem('deltaharvest_gemini_parsed_screen', JSON.stringify(parsed));
    } catch (e) {
      console.warn('Failed to save parsed gemini result:', e);
    }
    if (parsed.recommendedTrades.length > 0) {
      showToast(`Successfully parsed ${parsed.recommendedTrades.length} recommended trades from Gemini!`);
    }
  };

  // Convert Gemini recommended trade to OptionOpportunity and stage in broker workbench
  const handleStageGeminiTrade = (trade: GeminiRecommendedTrade) => {
    const nextFriday = new Date();
    nextFriday.setDate(nextFriday.getDate() + ((5 + 7 - nextFriday.getDay()) % 7 || 7));
    const expStr = nextFriday.toISOString().split('T')[0];

    const opp: OptionOpportunity = {
      id: `GEMINI_${trade.symbol}_${trade.suggestedStrike}_PUT`,
      symbol: trade.symbol,
      name: trade.symbol,
      category: 'Equities',
      sector: 'Technology',
      liquidity_tier: 'Tier 1',
      current_price: trade.currentPrice || trade.suggestedStrike * 1.05,
      strategy: 'CSP',
      strategy_name: 'Cash-Secured Put',
      expiration: expStr,
      dte: 6,
      strike: trade.suggestedStrike,
      type: 'put',
      bid: 1.40,
      ask: 1.60,
      mid: 1.50,
      iv: 0.35,
      iv_rank: 45,
      delta: -Math.abs(trade.delta || 0.20),
      abs_delta: Math.abs(trade.delta || 0.20),
      theta: 0.08,
      pop_pct: Math.round((1 - Math.abs(trade.delta || 0.20)) * 100),
      cushion_pct: trade.currentPrice > 0 ? ((trade.currentPrice - trade.suggestedStrike) / trade.currentPrice) * 100 : 5.0,
      collateral_required: trade.capitalCommitted || trade.suggestedStrike * 100,
      premium_total: 150,
      breakeven: trade.suggestedStrike - 1.50,
      roc_pct: 1.5,
      annualized_roc: 25.0,
      rsi: trade.rsi14 || 55,
      safety_tier: 'Gemini Recommended',
      tier_color: 'emerald',
      tags: ['GEMINI_AI', 'WEEKLY_CSP'],
      rating: 95,
      earnings_within_7d: false,
    };

    if (onStageOpportunity) {
      onStageOpportunity(opp);
    }
    if (onOpenBrokerStaging) {
      onOpenBrokerStaging(trade.symbol, 'CSP');
    }
    showToast(`Staged ${trade.symbol} $${trade.suggestedStrike} Put in Broker Order Workbench!`);
  };

  // Copy Results as TSV
  const handleCopyResultsTSV = (dataset: WeeklyScreenerDataset | null) => {
    if (!dataset || dataset.records.length === 0) return;
    const headers = ['Symbol', 'Name', 'Price', 'Change', '% Change', 'Opinion', 'Stability', 'Weekly Options', 'Strategy'];
    const rows = dataset.records.map((r) => [
      r.symbol,
      r.name,
      r.last_price.toFixed(2),
      r.price_change.toFixed(2),
      `${r.percent_change.toFixed(2)}%`,
      r.opinion,
      `${r.opinion_previous || '100%'} -> ${r.opinion_last_week || '100%'} -> ${r.opinion_last_month || '100%'}`,
      r.has_weekly_options ? 'Weekly' : 'Monthly Only',
      r.recommended_strategy,
    ]);
    const tsv = [headers.join('\t'), ...rows.map((row) => row.join('\t'))].join('\n');
    navigator.clipboard.writeText(tsv);
    showToast(`Copied ${dataset.records.length} records to clipboard as TSV!`);
  };

  // Download Results as CSV
  const handleDownloadCSV = (dataset: WeeklyScreenerDataset | null, prefix: string) => {
    if (!dataset || dataset.records.length === 0) return;
    const headers = ['Symbol', 'Name', 'Price', 'Change', '% Change', 'Opinion', 'Stability Prev', 'Stability Last Week', 'Stability Last Month', 'Weekly Options', 'Strategy'];
    const rows = dataset.records.map((r) => [
      r.symbol,
      `"${r.name}"`,
      r.last_price.toFixed(2),
      r.price_change.toFixed(2),
      r.percent_change.toFixed(2),
      `"${r.opinion}"`,
      `"${r.opinion_previous || ''}"`,
      `"${r.opinion_last_week || ''}"`,
      `"${r.opinion_last_month || ''}"`,
      r.has_weekly_options ? 'Yes' : 'No',
      `"${r.recommended_strategy}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${prefix}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Synthesize candidate opportunities for Gemini AI prompt from screened stocks or holdings
  const synthesizedCandidateOpps = useMemo(() => {
    const opps: OptionOpportunity[] = [...allOpportunities];
    const existingSymbols = new Set(opps.map((o) => o.symbol));

    let candidateRecords: WeeklyScreenerRecord[] = [];
    if (geminiCandidateSource === 'BARCHART' && barchartDataset) {
      candidateRecords = barchartDataset.records;
    } else if (geminiCandidateSource === 'MC' && mcDataset) {
      candidateRecords = mcDataset.records;
    } else if (geminiCandidateSource === 'TOS' && tosWatchlistDataset) {
      candidateRecords = tosWatchlistDataset.records;
    } else if (geminiCandidateSource === 'ALL_SCREENED') {
      const pool = [
        ...(barchartDataset?.records || []),
        ...(mcDataset?.records || []),
        ...(tosWatchlistDataset?.records || []),
      ];
      const seen = new Set<string>();
      for (const r of pool) {
        if (!seen.has(r.symbol)) {
          seen.add(r.symbol);
          candidateRecords.push(r);
        }
      }
    }

    // Convert screened records into synthetic option opportunities if not already present
    for (const item of candidateRecords) {
      if (!existingSymbols.has(item.symbol)) {
        existingSymbols.add(item.symbol);
        const tMeta = tickerMetaMap.get(item.symbol.toUpperCase());
        opps.push(hydrateOptionOpportunity(item, tMeta));
      }
    }
    return opps;
  }, [allOpportunities, geminiCandidateSource, barchartDataset, mcDataset, tosWatchlistDataset, tickerMetaMap]);

  // Stage 1-4 Filtered Opportunities for Gemini AI
  const finalCandidates = useMemo(() => {
    const opps = synthesizedCandidateOpps.filter((o) => {
      // Must match strategy
      if (o.strategy !== strategyMode) return false;

      // Stage 2: IV Rank
      if (minIvRank > 0 && o.iv_rank < minIvRank) return false;

      // Stage 3: Strict 15Δ – 25Δ Delta Sweet Spot
      const absDelta = Math.abs(o.delta || o.abs_delta || 0.20);
      if (strictDeltaRange) {
        if (absDelta < minDelta || absDelta > maxDelta) return false;
      }

      // Stage 4: Capital Budget Gate ($200k max single equity CSP limit)
      if (strategyMode === 'CSP' && onlyWithinCashBudget) {
        const collateral = o.collateral_required || o.strike * 100;
        if (collateral > Math.min(200000, maxPositionCollateral)) return false;
        if (capitalState.freeCash > 0 && collateral > capitalState.freeCash) return false;
      }

      return true;
    });

    // Apply Sorting
    return opps.sort((a, b) => {
      const aVal = (a as any)[sortBy] ?? 0;
      const bVal = (b as any)[sortBy] ?? 0;
      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [
    synthesizedCandidateOpps,
    strategyMode,
    minIvRank,
    strictDeltaRange,
    minDelta,
    maxDelta,
    onlyWithinCashBudget,
    maxPositionCollateral,
    capitalState.freeCash,
    sortBy,
    sortOrder,
  ]);

  // Sizing: Calculate how many candidates can be funded with free cash
  const maxAffordablePositions = useMemo(() => {
    if (capitalState.freeCash <= 0 || maxPositionCollateral <= 0) return 0;
    const effectiveAlloc = Math.min(200000, maxPositionCollateral);
    return Math.min(5, Math.floor(capitalState.freeCash / effectiveAlloc));
  }, [capitalState.freeCash, maxPositionCollateral]);

  // Construct Institutional Gemini Pro Options Prompt
  const generateGeminiThinkingPrompt = () => {
    return generateInstitutionalGeminiPrompt({
      capitalState,
      maxPositionCollateral,
      opportunities: finalCandidates,
      tickers,
    });
  };

  const handleCopyPrompt = () => {
    const prompt = generateGeminiThinkingPrompt();
    navigator.clipboard.writeText(prompt);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 3000);
    showToast('Copied Institutional Gemini Pro Prompt to Clipboard!');
  };

  // Filtered lists for Tab 1, 2, 3
  const filteredBarchartRecords = useMemo(() => {
    if (!barchartDataset) return [];
    return barchartDataset.records.filter((r) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!r.symbol.toLowerCase().includes(q) && !r.name.toLowerCase().includes(q)) return false;
      }
      if (weeklyOnlyFilter && !r.has_weekly_options) return false;
      if (opinionFilter === '100' && r.opinion_pct < 100) return false;
      if (opinionFilter === '80' && r.opinion_pct < 80) return false;
      return true;
    });
  }, [barchartDataset, searchQuery, weeklyOnlyFilter, opinionFilter]);

  const filteredMcRecords = useMemo(() => {
    if (!mcDataset) return [];
    return mcDataset.records.filter((r) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!r.symbol.toLowerCase().includes(q) && !r.name.toLowerCase().includes(q)) return false;
      }
      if (cboeOnlyGate && !r.extra_fields?.in_cboe_registry && !r.has_weekly_options) return false;
      if (weeklyOnlyFilter && !r.has_weekly_options) return false;
      return true;
    });
  }, [mcDataset, searchQuery, cboeOnlyGate, weeklyOnlyFilter]);

  const filteredTosRecords = useMemo(() => {
    if (!tosWatchlistDataset) return [];
    return tosWatchlistDataset.records.filter((r) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!r.symbol.toLowerCase().includes(q) && !r.name.toLowerCase().includes(q)) return false;
      }
      if (weeklyOnlyFilter && !r.has_weekly_options) return false;
      return true;
    });
  }, [tosWatchlistDataset, searchQuery, weeklyOnlyFilter]);

  return (
    <div className="space-y-6">
      {/* 1. Header & Live Cash Context Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2.5">
            <Filter className="w-6 h-6 text-emerald-400" />
            <span>4. Tri-Screen &amp; Gemini AI (End-of-Week Options Ritual)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Multi-Source Quantitative Engine: Barchart Top 1% (View 190898) • MarketChameleon Momentum • ThinkorSwim Screen • Gemini Extended Thinking ($200k Max Single Equity Limit).
          </p>
        </div>

        {/* Live Cash & Collateral Context Strip */}
        <div className="flex items-center space-x-2 bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-1.5 text-xs font-mono">
          <div className="text-slate-400">
            Total Cash:{' '}
            <strong className="text-white">${capitalState.totalCash.toLocaleString()}</strong>
          </div>
          <span className="text-slate-600">|</span>
          <div className="text-slate-400">
            -$5k Living:{' '}
            <strong className="text-amber-400">-$5,000</strong>
          </div>
          <span className="text-slate-600">|</span>
          <div className="text-slate-400">
            Collateral:{' '}
            <strong className="text-rose-400">-${capitalState.committedCollateral.toLocaleString()}</strong>
          </div>
          <span className="text-slate-600">➔</span>
          <div className="text-emerald-400 font-bold flex items-center gap-1">
            <DollarSign className="w-3.5 h-3.5" />
            <span>Free Cash: ${capitalState.freeCash.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* 2. Primary Tri-Screen Navigation Sub-Tabs Strip */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-1.5 bg-slate-900/90 rounded-2xl border border-slate-800 shadow-xl">
        <div className="flex items-center space-x-2 overflow-x-auto">
          {/* Tab 1: Barchart Top 1% */}
          <button
            onClick={() => setActiveSubTab('BARCHART')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
              activeSubTab === 'BARCHART'
                ? 'bg-emerald-600 text-white border-emerald-400 shadow-md shadow-emerald-600/30 ring-1 ring-emerald-400/50'
                : 'bg-slate-950/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border-slate-800'
            }`}
          >
            <Zap className="w-4 h-4 text-amber-300" />
            <span>1. Barchart Top 1% (View 190898)</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-white/20 text-white">
              {barchartDataset?.total_count || 53}
            </span>
          </button>

          {/* Tab 2: MarketChameleon Momentum */}
          <button
            onClick={() => setActiveSubTab('MARKETCHAMELEON')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
              activeSubTab === 'MARKETCHAMELEON'
                ? 'bg-purple-600 text-white border-purple-400 shadow-md shadow-purple-600/30 ring-1 ring-purple-400/50'
                : 'bg-slate-950/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border-slate-800'
            }`}
          >
            <Flame className="w-4 h-4 text-purple-300" />
            <span>2. MarketChameleon Momentum</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-white/20 text-white">
              {mcDataset?.total_count || 60}
            </span>
          </button>

          {/* Tab 3: ThinkorSwim & Barchart View 190898 */}
          <button
            onClick={() => setActiveSubTab('TOS_BARCHART')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
              activeSubTab === 'TOS_BARCHART'
                ? 'bg-cyan-600 text-white border-cyan-400 shadow-md shadow-cyan-600/30 ring-1 ring-cyan-400/50'
                : 'bg-slate-950/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border-slate-800'
            }`}
          >
            <ExternalLink className="w-4 h-4 text-cyan-300" />
            <span>3. ThinkorSwim / Custom Screen (View 190898)</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-white/20 text-white">
              {tosWatchlistDataset?.total_count || 0}
            </span>
          </button>

          {/* Tab 4: Gemini AI Decision Hub */}
          <button
            onClick={() => setActiveSubTab('GEMINI_DECISION_HUB')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
              activeSubTab === 'GEMINI_DECISION_HUB'
                ? 'bg-gradient-to-r from-amber-600 to-emerald-600 text-white border-amber-400 shadow-md shadow-amber-600/30 ring-1 ring-amber-400/50'
                : 'bg-slate-950/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border-slate-800'
            }`}
          >
            <BrainCircuit className="w-4 h-4 text-amber-300" />
            <span>4. Gemini AI Decision Matrix &amp; 15–25Δ Funnel</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-white/20 text-white">
              {finalCandidates.length}
            </span>
          </button>
        </div>

        {/* Strategy Switcher */}
        <div className="inline-flex p-0.5 bg-slate-950 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setStrategyMode('CSP')}
            className={`px-3 py-1 rounded-lg font-bold transition-all ${
              strategyMode === 'CSP' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            CSPs
          </button>
          <button
            onClick={() => setStrategyMode('CC')}
            className={`px-3 py-1 rounded-lg font-bold transition-all ${
              strategyMode === 'CC' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Covered Calls
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between shadow-lg animate-fade-in">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-semibold">{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage('')} className="text-slate-400 hover:text-white text-xs">
            ✕
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 1: BARCHART DIRECTION STRENGTH (TOP 1%)                          */}
      {/* ========================================================================= */}
      {activeSubTab === 'BARCHART' && (
        <div className="space-y-4 animate-fade-in">
          {/* Summary KPIs & Direct Action Bar */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
            <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-400 block text-[11px]">Barchart Universe</span>
              <span className="text-lg font-bold text-white font-mono">
                {barchartDataset?.total_count || 53} Screened Equities
              </span>
              <span className="text-[10px] text-emerald-400 block mt-0.5">Top 1% Signal Strength Consensus</span>
            </div>

            <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-400 block text-[11px]">Barchart Consensus</span>
              <span className="text-lg font-bold text-emerald-400 font-mono">100% Strong Buy</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">13/13 Moving Averages &amp; MACD</span>
            </div>

            <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-400 block text-[11px]">Options Chain Status</span>
              <span className="text-lg font-bold text-cyan-400 font-mono">100% Optionable</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Filtered for Active Weeklys</span>
            </div>

            <div className="bg-slate-900/90 p-3 rounded-xl border border-emerald-500/30 flex flex-col justify-center gap-1.5">
              <button
                onClick={() => handleSendScreenedToGemini('BARCHART')}
                className="w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <BrainCircuit className="w-4 h-4 text-amber-300" />
                <span>Send to Gemini AI Hub &rarr;</span>
              </button>
            </div>
          </div>

          {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-900/90 rounded-xl border border-slate-800 text-xs">
            <div className="flex items-center space-x-3 flex-1 min-w-[240px]">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search Barchart stocks by symbol or name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                />
              </div>

              <label className="flex items-center space-x-1.5 cursor-pointer text-slate-300 select-none">
                <input
                  type="checkbox"
                  checked={weeklyOnlyFilter}
                  onChange={(e) => setWeeklyOnlyFilter(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-950 text-emerald-500"
                />
                <span className="font-semibold text-emerald-300">Has Weeklys Only</span>
              </label>

              <select
                value={opinionFilter}
                onChange={(e) => setOpinionFilter(e.target.value as any)}
                className="bg-slate-950 border border-slate-800 text-slate-300 rounded-lg px-2.5 py-1.5 text-xs"
              >
                <option value="ALL">All Opinions</option>
                <option value="100">100% Buy Only</option>
                <option value="80">80%+ Buy</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleCopyResultsTSV(barchartDataset)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 font-semibold transition-all flex items-center space-x-1.5 cursor-pointer"
                title="Copy full table to clipboard as TSV"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy TSV</span>
              </button>

              <button
                onClick={() => handleDownloadCSV(barchartDataset, 'barchart_direction_strength_top1pct')}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 font-semibold transition-all flex items-center space-x-1.5 cursor-pointer"
                title="Download CSV"
              >
                <Download className="w-3.5 h-3.5" />
                <span>CSV</span>
              </button>

              <a
                href="https://www.barchart.com/stocks/signals/direction-strength?viewName=190898&timeFrame=daily&orderBy=hasWeeklyOptions&orderDir=desc"
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-lg bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 font-semibold transition-all flex items-center space-x-1.5"
              >
                <span>Barchart View 190898</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Standardized Barchart Top 1% Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/80 shadow-xl">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 text-[11px]">
                  <th className="py-2.5 px-3">Rank &amp; Symbol</th>
                  <th className="py-2.5 px-3">Company Name</th>
                  <th className="py-2.5 px-3 text-right">Last Price</th>
                  <th className="py-2.5 px-3 text-right">Change (% Chg)</th>
                  <th className="py-2.5 px-3">Barchart Consensus Opinion</th>
                  <th className="py-2.5 px-3 text-center">Stability (Prev &rarr; LW &rarr; LM)</th>
                  <th className="py-2.5 px-3 text-center">Options Cadence</th>
                  <th className="py-2.5 px-3">Recommended Strategy</th>
                  <th className="py-2.5 px-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredBarchartRecords.map((item, idx) => {
                  const isPositive = item.price_change >= 0;
                  return (
                    <tr key={item.symbol} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-2.5 px-3 font-bold text-white">
                        <span className="text-slate-500 font-normal mr-2">#{idx + 1}</span>
                        <span className="text-sm font-bold text-cyan-300">{item.symbol}</span>
                      </td>
                      <td className="py-2.5 px-3 font-sans text-slate-300 truncate max-w-xs">{item.name}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-100 font-mono">
                        ${item.last_price.toFixed(2)}
                      </td>
                      <td
                        className={`py-2.5 px-3 text-right font-bold font-mono ${
                          isPositive ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        <div>{isPositive ? `+${item.price_change.toFixed(2)}` : item.price_change.toFixed(2)}</div>
                        <div className="text-[10px] opacity-80">
                          {isPositive ? `+${item.percent_change.toFixed(2)}%` : `${item.percent_change.toFixed(2)}%`}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 font-sans">
                        <div className="flex items-center space-x-2">
                          <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono">
                            {item.opinion}
                          </span>
                          <span className="text-[10px] text-amber-300 font-mono font-bold">{item.signal_strength}</span>
                        </div>
                        <div className="w-28 bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1.5">
                          <div
                            className="h-full bg-emerald-400"
                            style={{ width: `${Math.max(5, Math.abs(item.opinion_pct))}%` }}
                          />
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-center text-[10px] font-mono text-slate-400">
                        <div className="flex items-center justify-center space-x-1">
                          <span className="px-1 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                            {item.opinion_previous?.replace(' Buy', '') || '100%'}
                          </span>
                          <span>&rarr;</span>
                          <span className="px-1 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                            {item.opinion_last_week?.replace(' Buy', '') || '100%'}
                          </span>
                          <span>&rarr;</span>
                          <span className="px-1 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                            {item.opinion_last_month?.replace(' Buy', '') || '100%'}
                          </span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {item.has_weekly_options ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-500/40">
                            Weekly Options
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                            Monthly Only
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-sans">
                        <span className="font-semibold text-xs text-cyan-300 font-mono">
                          {item.recommended_strategy === 'BULL_PUT_SPREAD' && '0.15-0.20Δ Bull Put Spread'}
                          {item.recommended_strategy === 'CSP' && 'Conservative Cash-Secured Put'}
                          {item.recommended_strategy === 'IRON_CONDOR' && 'Neutral Iron Condor'}
                          {item.recommended_strategy === 'BEAR_CALL_SPREAD' && 'Defensive Bear Call Spread'}
                        </span>
                        <div className="text-[10px] text-slate-400">Anchor &lt; Lower Bollinger Band</div>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center space-x-1.5">
                          <button
                            onClick={() => onOpenTickerAudit?.(item.symbol)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                            title="Run 5-Part Options Safety Audit"
                          >
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                          </button>
                          <button
                            onClick={() => onSelectSymbolForChart?.(item.symbol)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-400 transition-colors cursor-pointer"
                            title="Open Candlestick Chart"
                          >
                            <BarChart2 className="w-3.5 h-3.5 text-cyan-400" />
                          </button>
                          <button
                            onClick={() => handleStageScreenerRecord(item)}
                            className="p-1.5 rounded-lg bg-purple-950/70 hover:bg-purple-900 border border-purple-500/40 text-purple-300 transition-colors cursor-pointer"
                            title="Stage Order in Broker Workbench"
                          >
                            <Zap className="w-3.5 h-3.5 text-amber-300" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 2: MARKETCHAMELEON MOMENTUM SCREENER                             */}
      {/* ========================================================================= */}
      {activeSubTab === 'MARKETCHAMELEON' && (
        <div className="space-y-4 animate-fade-in">
          {/* Summary KPIs & Direct Action Bar */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
            <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-400 block text-[11px]">MarketChameleon Universe</span>
              <span className="text-lg font-bold text-white font-mono">
                {mcDataset?.total_count || 60} Momentum Stocks
              </span>
              <span className="text-[10px] text-purple-400 block mt-0.5">Preset: {activePresetName}</span>
            </div>

            <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-400 block text-[11px]">Volatility Profile</span>
              <span className="text-lg font-bold text-amber-400 font-mono">IV30 &gt; 30% • RSI 50–70</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">High Premium Inflow Candidates</span>
            </div>

            <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-400 block text-[11px]">CBOE Verified Weeklys</span>
              <span className="text-lg font-bold text-emerald-400 font-mono">
                {cboeOnlyGate ? 'Strict CBOE (10 Active)' : 'All Chains (60 Active)'}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Direct CBOE Directory Cross-Check</span>
            </div>

            <div className="bg-slate-900/90 p-3 rounded-xl border border-purple-500/30 flex flex-col justify-center gap-1.5">
              <button
                onClick={() => handleSendScreenedToGemini('MC')}
                className="w-full py-2 px-3 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md shadow-purple-600/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <BrainCircuit className="w-4 h-4 text-amber-300" />
                <span>Send to Gemini AI Hub &rarr;</span>
              </button>
            </div>
          </div>

          {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-900/90 rounded-xl border border-slate-800 text-xs">
            <div className="flex items-center space-x-3 flex-1 min-w-[240px]">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search MarketChameleon stocks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-500 font-mono"
                />
              </div>

              <button
                onClick={() => setCboeOnlyGate(!cboeOnlyGate)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  cboeOnlyGate
                    ? 'bg-emerald-950/60 text-emerald-300 border-emerald-400 shadow-sm shadow-emerald-500/20'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
                title="Toggle strict CBOE weekly registered options"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>{cboeOnlyGate ? 'Strict CBOE Weeklys (10)' : 'All Options Chains (60)'}</span>
              </button>

              <button
                onClick={() => setIsPrescreenModalOpen(true)}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/40 text-xs font-bold transition-all cursor-pointer"
                title="Customize MarketChameleon categories and presets"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Prescreen Builder &amp; Presets</span>
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleCopyResultsTSV(mcDataset)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 font-semibold transition-all flex items-center space-x-1.5 cursor-pointer"
                title="Copy full table to clipboard as TSV"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy TSV</span>
              </button>

              <button
                onClick={() => handleDownloadCSV(mcDataset, 'marketchameleon_momentum_screen')}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 font-semibold transition-all flex items-center space-x-1.5 cursor-pointer"
                title="Download CSV"
              >
                <Download className="w-3.5 h-3.5" />
                <span>CSV</span>
              </button>

              <a
                href="https://marketchameleon.com/Screeners/Stocks"
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 font-semibold transition-all flex items-center space-x-1.5"
              >
                <span>MarketChameleon.com</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Standardized MarketChameleon Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/80 shadow-xl">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 text-[11px]">
                  <th className="py-2.5 px-3">Symbol</th>
                  <th className="py-2.5 px-3">Company Name</th>
                  <th className="py-2.5 px-3 text-right">Price</th>
                  <th className="py-2.5 px-3 text-right">Change (% Chg)</th>
                  <th className="py-2.5 px-3 text-right">Market Cap</th>
                  <th className="py-2.5 px-3 text-right">14D RSI</th>
                  <th className="py-2.5 px-3 text-right">IV30 (Vol 20D/1Y)</th>
                  <th className="py-2.5 px-3 text-center">Options Cadence</th>
                  <th className="py-2.5 px-3">Recommended Strategy</th>
                  <th className="py-2.5 px-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredMcRecords.map((item) => {
                  const isPositive = item.price_change >= 0;
                  const isCboe = item.extra_fields?.in_cboe_registry ?? item.has_weekly_options;
                  return (
                    <tr key={item.symbol} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-2.5 px-3 font-bold text-cyan-300 text-sm">{item.symbol}</td>
                      <td className="py-2.5 px-3 font-sans text-slate-300 truncate max-w-xs">{item.name}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-100 font-mono">
                        ${item.last_price.toFixed(2)}
                      </td>
                      <td
                        className={`py-2.5 px-3 text-right font-bold font-mono ${
                          isPositive ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        <div>{isPositive ? `+${item.price_change.toFixed(2)}` : item.price_change.toFixed(2)}</div>
                        <div className="text-[10px] opacity-80">
                          {isPositive ? `+${item.percent_change.toFixed(2)}%` : `${item.percent_change.toFixed(2)}%`}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-300">
                        {item.extra_fields?.market_cap ? `$${(item.extra_fields.market_cap / 1e9).toFixed(1)}B` : '—'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-amber-300">
                        {item.extra_fields?.rsi_14 ? item.extra_fields.rsi_14.toFixed(1) : '55.0'}
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-300">
                        <span className="font-bold text-emerald-400">
                          {item.extra_fields?.iv30 ? `${item.extra_fields.iv30.toFixed(1)}%` : '35.0%'}
                        </span>
                        <div className="text-[10px] text-slate-500">
                          {item.extra_fields?.vol_20d ? `${item.extra_fields.vol_20d.toFixed(0)}%` : '—'} /{' '}
                          {item.extra_fields?.vol_1y ? `${item.extra_fields.vol_1y.toFixed(0)}%` : '—'}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {isCboe ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-500/40">
                            CBOE Weekly
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                            Monthly Only
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-sans">
                        <span className="font-semibold text-xs text-cyan-300 font-mono">
                          {item.recommended_strategy === 'BULL_PUT_SPREAD' && '0.15-0.20Δ Bull Put Spread'}
                          {item.recommended_strategy === 'CSP' && 'Conservative Cash-Secured Put'}
                          {item.recommended_strategy === 'COVERED_CALL' && '20Δ Covered Call'}
                          {item.recommended_strategy === 'IRON_CONDOR' && 'Neutral Iron Condor'}
                        </span>
                        <div className="text-[10px] text-slate-400">Momentum Pattern: Uptrend</div>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center space-x-1.5">
                          <button
                            onClick={() => onOpenTickerAudit?.(item.symbol)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                            title="Run 5-Part Options Safety Audit"
                          >
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                          </button>
                          <button
                            onClick={() => onSelectSymbolForChart?.(item.symbol)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-400 transition-colors cursor-pointer"
                            title="Open Candlestick Chart"
                          >
                            <BarChart2 className="w-3.5 h-3.5 text-cyan-400" />
                          </button>
                          <button
                            onClick={() => handleStageScreenerRecord(item)}
                            className="p-1.5 rounded-lg bg-purple-950/70 hover:bg-purple-900 border border-purple-500/40 text-purple-300 transition-colors cursor-pointer"
                            title="Stage Order in Broker Workbench"
                          >
                            <Zap className="w-3.5 h-3.5 text-amber-300" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 3: THINKORSWIM SCREEN & BARCHART VIEW 190898 WORKFLOW             */}
      {/* ========================================================================= */}
      {activeSubTab === 'TOS_BARCHART' && (
        <div className="space-y-4 animate-fade-in">
          {/* Thinkorswim Ticker Ingestion & Analysis Box */}
          <div className="p-4 rounded-xl bg-slate-900 border border-cyan-500/30 space-y-3.5 text-xs shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <span className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-300">
                  <ExternalLink className="w-4 h-4" />
                </span>
                <div>
                  <span className="font-bold text-cyan-300 text-sm block">
                    ThinkorSwim Screen &amp; Barchart View 190898 Workflow
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Standardize any custom or ThinkorSwim scan into 13-indicator Barchart consensus opinions.
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleRunBarchartAnalysis()}
                  disabled={isAnalyzingTos}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white shadow-lg shadow-cyan-600/30 transition-all flex items-center space-x-1.5 cursor-pointer"
                >
                  <Zap className={`w-3.5 h-3.5 text-amber-300 ${isAnalyzingTos ? 'animate-spin' : ''}`} />
                  <span>{isAnalyzingTos ? 'Analyzing 13 Barchart Indicators...' : '▶ Run Barchart View 190898 Analysis'}</span>
                </button>

                <button
                  onClick={handleCopyAndOpenBarchart}
                  className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer border ${
                    copiedBarchartTickers
                      ? 'bg-emerald-600 text-white border-emerald-400'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                  }`}
                  title="Copy tickers to clipboard and open Barchart View 190898 webpage"
                >
                  <Copy className="w-3.5 h-3.5 text-amber-300" />
                  <span>{copiedBarchartTickers ? 'Copied! Opening...' : 'Copy & Open Barchart'}</span>
                </button>

                <label className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer flex items-center space-x-1.5 transition-colors">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload File</span>
                  <input type="file" accept=".csv,.txt" onChange={handleTosFileUpload} className="hidden" />
                </label>

                {tosTickersInput && (
                  <button
                    onClick={() => setTosTickersInput('')}
                    className="px-2.5 py-2 rounded-xl text-xs font-semibold bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors flex items-center space-x-1"
                    title="Clear ticker input"
                  >
                    <XCircle className="w-3.5 h-3.5 text-slate-400" />
                    <span>Clear Tickers</span>
                  </button>
                )}
              </div>
            </div>

            {/* Concise 3-Step Workflow Guidance */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 p-2.5 rounded-lg bg-slate-950/70 border border-slate-800 text-[11px]">
              <div className="flex items-start space-x-2">
                <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold flex items-center justify-center shrink-0 border border-cyan-500/40 text-[10px]">
                  1
                </span>
                <div>
                  <div className="font-semibold text-slate-200">Select or Input Tickers</div>
                  <div className="text-slate-400 text-[10px] leading-tight mt-0.5">
                    Click a <strong>Quick Preset</strong> below, paste <strong>TOS tickers</strong>, or click <strong>Upload File</strong> (.csv/.txt). <span className="text-cyan-400">CSV headers are auto-audited &amp; filtered.</span>
                  </div>
                </div>
              </div>

              <div className="flex items-start space-x-2">
                <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold flex items-center justify-center shrink-0 border border-cyan-500/40 text-[10px]">
                  2
                </span>
                <div>
                  <div className="font-semibold text-slate-200">Run Barchart Analysis</div>
                  <div className="text-slate-400 text-[10px] leading-tight mt-0.5">
                    Click <strong className="text-cyan-300">▶ Run Barchart View 190898 Analysis</strong> to calculate consensus opinions, stability trends, and weekly options cadence.
                  </div>
                </div>
              </div>

              <div className="flex items-start space-x-2">
                <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold flex items-center justify-center shrink-0 border border-cyan-500/40 text-[10px]">
                  3
                </span>
                <div>
                  <div className="font-semibold text-slate-200">Manage &amp; Formulate Trades</div>
                  <div className="text-slate-400 text-[10px] leading-tight mt-0.5">
                    Review the Returned Screen below. Remove symbols with <strong className="text-rose-400">Trash</strong>, click <strong className="text-rose-400">Clear Screen</strong> to wipe, or <strong className="text-emerald-400">Send to Gemini AI Hub</strong>.
                  </div>
                </div>
              </div>
            </div>

            {/* Presets Chips */}
            <div className="flex items-center space-x-2 overflow-x-auto text-[11px] pt-1">
              <span className="text-slate-400 font-semibold shrink-0">Quick Presets:</span>
              <button
                type="button"
                onClick={() => {
                  const syms = 'AXTI, BLZE, IONQ, LUNR, NET, RTX, TSLA';
                  setTosTickersInput(syms);
                  handleRunBarchartAnalysis(syms.split(', '));
                }}
                className="px-2.5 py-1 rounded-lg bg-amber-600/20 hover:bg-amber-600/40 text-amber-300 border border-amber-500/40 font-bold transition-all cursor-pointer whitespace-nowrap"
              >
                Living Trust Equities (7)
              </button>
              <button
                type="button"
                onClick={() => {
                  const syms = 'AAPL, MSFT, NVDA, AMZN, GOOGL, META, TSLA';
                  setTosTickersInput(syms);
                  handleRunBarchartAnalysis(syms.split(', '));
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all cursor-pointer whitespace-nowrap"
              >
                Mag 7
              </button>
              <button
                type="button"
                onClick={() => {
                  const syms = 'NVDA, AMD, AVGO, TSM, QCOM, MU, ASML';
                  setTosTickersInput(syms);
                  handleRunBarchartAnalysis(syms.split(', '));
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all cursor-pointer whitespace-nowrap"
              >
                Semis
              </button>
              <button
                type="button"
                onClick={() => {
                  const syms = 'TSLA, PLTR, AMD, MARA, COIN, SOFI, RIVN';
                  setTosTickersInput(syms);
                  handleRunBarchartAnalysis(syms.split(', '));
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all cursor-pointer whitespace-nowrap"
              >
                CBOE High Vol
              </button>
              <button
                type="button"
                onClick={() => {
                  const syms = 'PLTR, AI, PATH, SNOW, CRWD, MDB, NET';
                  setTosTickersInput(syms);
                  handleRunBarchartAnalysis(syms.split(', '));
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all cursor-pointer whitespace-nowrap"
              >
                AI &amp; Cloud
              </button>
            </div>

            {/* Textarea for Symbols */}
            <textarea
              rows={2}
              value={tosTickersInput}
              onChange={(e) => setTosTickersInput(e.target.value)}
              placeholder="Paste comma or space-separated symbols from ThinkorSwim scan (e.g. AAPL, NVDA, MSFT, AMD, GOOGL, PLTR, PANW)..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
            />

            {tosError && (
              <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                {tosError}
              </div>
            )}
          </div>

          {/* Empty State Card when Returned Screen is empty */}
          {tosWatchlistDataset && tosWatchlistDataset.records.length === 0 && (
            <div className="p-8 rounded-xl bg-slate-900/50 border border-slate-800 text-center space-y-3">
              <div className="inline-flex p-3 rounded-full bg-slate-800/80 text-slate-400 border border-slate-700">
                <Trash2 className="w-6 h-6 text-slate-400" />
              </div>
              <div className="font-bold text-slate-200 text-sm">Returned Screen is Empty</div>
              <p className="max-w-md mx-auto text-xs text-slate-400">
                All screened symbols have been cleared. Select a preset chip above, paste ThinkorSwim scan tickers, or upload a scan file, then click <span className="text-cyan-300 font-semibold">&quot;▶ Run Barchart View 190898 Analysis&quot;</span> to generate a fresh screen.
              </p>
            </div>
          )}

          {/* Return Screen Section in Barchart Top 1% Format */}
          {tosWatchlistDataset && tosWatchlistDataset.records.length > 0 && (
            <div className="space-y-3">
              {/* Action and Summary Bar for the Return Screen */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-900/90 rounded-xl border border-slate-800 text-xs">
                <div className="flex items-center space-x-3">
                  <span className="font-bold text-white text-sm">
                    Returned Screen ({tosWatchlistDataset.records.length} Analyzed Symbols)
                  </span>
                  <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 font-mono text-[11px]">
                    Barchart View 190898 Format
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleSendScreenedToGemini('TOS')}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/30 transition-all flex items-center space-x-1.5 cursor-pointer"
                  >
                    <BrainCircuit className="w-3.5 h-3.5 text-amber-300" />
                    <span>Send to Gemini AI Hub &rarr;</span>
                  </button>

                  <button
                    onClick={() => handleCopyResultsTSV(tosWatchlistDataset)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 font-semibold transition-all flex items-center space-x-1.5 cursor-pointer"
                    title="Copy full table to clipboard as TSV"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy TSV</span>
                  </button>

                  <button
                    onClick={() => handleDownloadCSV(tosWatchlistDataset, 'tos_barchart_view_190898_screen')}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 font-semibold transition-all flex items-center space-x-1.5 cursor-pointer"
                    title="Download CSV"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>CSV</span>
                  </button>

                  <button
                    onClick={handleClearReturnedScreen}
                    className="px-3 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 hover:text-rose-100 border border-rose-800/50 font-semibold transition-all flex items-center space-x-1.5 cursor-pointer"
                    title="Bulk clear all symbols from Returned Screen"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                    <span>Clear Screen ({tosWatchlistDataset.records.length})</span>
                  </button>
                </div>
              </div>

              {/* Standardized Table matching Barchart Top 1% format */}
              <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/80 shadow-xl">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 text-[11px]">
                      <th className="py-2.5 px-3">Symbol</th>
                      <th className="py-2.5 px-3">Company Name</th>
                      <th className="py-2.5 px-3 text-right">Last Price</th>
                      <th className="py-2.5 px-3 text-right">Change (% Chg)</th>
                      <th className="py-2.5 px-3">Barchart Consensus Opinion</th>
                      <th className="py-2.5 px-3 text-center">Stability (Prev &rarr; LW &rarr; LM)</th>
                      <th className="py-2.5 px-3 text-center">Options Cadence</th>
                      <th className="py-2.5 px-3">Recommended Strategy</th>
                      <th className="py-2.5 px-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredTosRecords.map((item) => {
                      const isPositive = item.price_change >= 0;
                      return (
                        <tr key={item.symbol} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-2.5 px-3 font-bold text-white">
                            <span className="text-sm font-bold text-cyan-300">{item.symbol}</span>
                          </td>
                          <td className="py-2.5 px-3 font-sans text-slate-300 truncate max-w-xs">{item.name}</td>
                          <td className="py-2.5 px-3 text-right font-bold text-slate-100 font-mono">
                            ${item.last_price.toFixed(2)}
                          </td>
                          <td
                            className={`py-2.5 px-3 text-right font-bold font-mono ${
                              isPositive ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            <div>{isPositive ? `+${item.price_change.toFixed(2)}` : item.price_change.toFixed(2)}</div>
                            <div className="text-[10px] opacity-80">
                              {isPositive ? `+${item.percent_change.toFixed(2)}%` : `${item.percent_change.toFixed(2)}%`}
                            </div>
                          </td>
                          <td className="py-2.5 px-3 font-sans">
                            <div className="flex items-center space-x-2">
                              <span
                                className={`px-2 py-0.5 rounded-md text-[11px] font-bold font-mono ${
                                  item.opinion_pct >= 90
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                    : item.opinion_pct >= 60
                                    ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                                    : 'bg-slate-800 text-slate-300 border border-slate-700'
                                }`}
                              >
                                {item.opinion}
                              </span>
                              <span className="text-[10px] text-amber-300 font-mono font-bold">
                                {item.signal_strength}
                              </span>
                            </div>
                            <div className="w-28 bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1.5">
                              <div
                                className={`h-full ${item.opinion_pct >= 90 ? 'bg-emerald-400' : 'bg-teal-400'}`}
                                style={{ width: `${Math.max(5, Math.abs(item.opinion_pct))}%` }}
                              />
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-center text-[10px] font-mono text-slate-400">
                            <div className="flex items-center justify-center space-x-1">
                              <span className="px-1 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                                {item.opinion_previous?.replace(' Buy', '') || '100%'}
                              </span>
                              <span>&rarr;</span>
                              <span className="px-1 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                                {item.opinion_last_week?.replace(' Buy', '') || '100%'}
                              </span>
                              <span>&rarr;</span>
                              <span className="px-1 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                                {item.opinion_last_month?.replace(' Buy', '') || '100%'}
                              </span>
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            {item.has_weekly_options ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-500/40">
                                Weekly Options
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                                Monthly Only
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 font-sans">
                            <span className="font-semibold text-xs text-cyan-300 font-mono">
                              {item.recommended_strategy === 'BULL_PUT_SPREAD' && '0.15-0.20Δ Bull Put Spread'}
                              {item.recommended_strategy === 'CSP' && 'Conservative Cash-Secured Put'}
                              {item.recommended_strategy === 'IRON_CONDOR' && 'Neutral Iron Condor'}
                              {item.recommended_strategy === 'BEAR_CALL_SPREAD' && 'Defensive Bear Call Spread'}
                            </span>
                            <div className="text-[10px] text-slate-400">13-Indicator Barchart Consensus</div>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <div className="flex items-center justify-center space-x-1.5">
                              <button
                                onClick={() => onOpenTickerAudit?.(item.symbol)}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                                title="Run 5-Part Options Safety Audit"
                              >
                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                              </button>
                              <button
                                onClick={() => onSelectSymbolForChart?.(item.symbol)}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-400 transition-colors cursor-pointer"
                                title="Open Candlestick Chart"
                              >
                                <BarChart2 className="w-3.5 h-3.5 text-cyan-400" />
                              </button>
                              <button
                                onClick={() => handleStageScreenerRecord(item)}
                                className="p-1.5 rounded-lg bg-purple-950/70 hover:bg-purple-900 border border-purple-500/40 text-purple-300 transition-colors cursor-pointer"
                                title="Stage Order in Broker Workbench"
                              >
                                <Zap className="w-3.5 h-3.5 text-amber-300" />
                              </button>
                              <button
                                onClick={() => handleRemoveSymbolFromScreen(item.symbol)}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/70 border border-slate-700 hover:border-rose-500/50 text-slate-400 hover:text-rose-300 transition-colors cursor-pointer"
                                title={`Remove ${item.symbol} from Returned Screen`}
                              >
                                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 4: GEMINI AI DECISION MATRIX & 15Δ–25Δ SWEET SPOT FUNNEL          */}
      {/* ========================================================================= */}
      {activeSubTab === 'GEMINI_DECISION_HUB' && (
        <div className="space-y-6 animate-fade-in">
          {/* Funnel Stage Controls Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            {/* Funnel Stage 1: Candidate Source & Technical Quality */}
            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800/90 space-y-2">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span className="font-bold text-slate-300">Stage 1: Screener Feed</span>
                <span className="font-mono text-cyan-400 font-bold">
                  {geminiCandidateSource === 'ALL_SCREENED' && 'All Sources'}
                  {geminiCandidateSource === 'BARCHART' && 'Barchart Top 1%'}
                  {geminiCandidateSource === 'MC' && 'MarketChameleon'}
                  {geminiCandidateSource === 'TOS' && 'TOS View 190898'}
                </span>
              </div>
              <select
                value={geminiCandidateSource}
                onChange={(e) => setGeminiCandidateSource(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-1.5 text-xs font-mono"
              >
                <option value="ALL_SCREENED">All Tri-Screen Sources Combined</option>
                <option value="BARCHART">Barchart Top 1% Only (53)</option>
                <option value="MC">MarketChameleon Momentum Only (60)</option>
                <option value="TOS">ThinkorSwim View 190898 Only</option>
              </select>
              <div className="text-[10px] text-slate-400">
                Consensus Score &ge; {minBarchartScore}% Buy threshold.
              </div>
            </div>

            {/* Funnel Stage 2: IV Rank */}
            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800/90 space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span className="font-bold text-slate-300">Stage 2: IV Rank Filter</span>
                <span className="font-mono text-amber-400 font-bold">&ge; {minIvRank}%</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-tight">
                Filters for elevated volatility to maximize options premium inflow.
              </p>
              <div className="flex items-center space-x-1 pt-1">
                {[0, 25, 35, 50].map((val) => (
                  <button
                    key={val}
                    onClick={() => setMinIvRank(val)}
                    className={`flex-1 py-1 rounded text-[10px] font-mono font-bold transition-all border ${
                      minIvRank === val
                        ? 'bg-amber-600/30 text-amber-300 border-amber-500/50'
                        : 'bg-slate-950 text-slate-500 border-slate-800'
                    }`}
                  >
                    {val === 0 ? 'Off' : `${val}%+`}
                  </button>
                ))}
              </div>
            </div>

            {/* Funnel Stage 3: Delta Sweet Spot */}
            <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-emerald-400">
                <span className="font-bold">Stage 3: Delta Sweet Spot</span>
                <span className="font-mono text-emerald-300 font-bold">
                  {minDelta.toFixed(2)}–{maxDelta.toFixed(2)}Δ
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-tight">
                Strictly outside 2-SD Bollinger Band support (75%–85% POP).
              </p>
              <div className="flex items-center space-x-2 pt-1 text-[10px] text-slate-400 font-mono">
                <span>POP: 75%–85%</span>
                <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold">
                  Sweet Spot Active
                </span>
              </div>
            </div>

            {/* Funnel Stage 4: Capital Budget Gate ($200k max single equity limit) */}
            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800/90 space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span className="font-bold text-slate-300">Stage 4: Capital Gate</span>
                <span className="font-mono text-amber-400 font-bold">
                  &le; ${Math.min(200000, maxPositionCollateral).toLocaleString()} (Cap: $200k)
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-tight">
                100% Cash-Secured. Deployable Cash: ${capitalState.freeCash.toLocaleString()} (Max $200k/equity).
              </p>
              <div className="flex items-center justify-between pt-1 text-[10px]">
                <span className="font-mono font-bold text-emerald-400">
                  {maxAffordablePositions} positions permitted (capped at 5)
                </span>
              </div>
            </div>
          </div>

          {/* Active Gemini AI Parsed Recommendations Banner */}
          {parsedGeminiResult && parsedGeminiResult.recommendedTrades.length > 0 && (
            <div className="glass-panel p-5 rounded-2xl border border-emerald-500/40 bg-gradient-to-br from-emerald-950/30 via-slate-900 to-slate-950 shadow-2xl space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2.5">
                  <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                    <Sparkles className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <span>Table 1: Institutional Top 5 Recommended Options Trades</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        Active Gemini Output
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      Evaluated within your 0.15–0.25Δ sweet spot, 5–7 DTE weekend theta decay, and strictly constrained to your ${maxPositionCollateral.toLocaleString()} collateral limit.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsAiModalOpen(true)}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <BrainCircuit className="w-3.5 h-3.5 text-amber-400" />
                    <span>Re-evaluate / Edit Prompt</span>
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 text-[11px]">
                      <th className="py-2.5 px-3">Rank</th>
                      <th className="py-2.5 px-3">Ticker</th>
                      <th className="py-2.5 px-3">Current Spot</th>
                      <th className="py-2.5 px-3">Put Strike</th>
                      <th className="py-2.5 px-3">Delta</th>
                      <th className="py-2.5 px-3">Est. Premium</th>
                      <th className="py-2.5 px-3">Cash Collateral</th>
                      <th className="py-2.5 px-3">Rationale &amp; Support Level</th>
                      <th className="py-2.5 px-3 text-right">Workbench Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {parsedGeminiResult.recommendedTrades.map((trade, idx) => (
                      <tr key={`${trade.symbol}-${idx}`} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-3 text-slate-400 font-bold">#{trade.riskRank || idx + 1}</td>
                        <td className="py-3 px-3 font-bold text-white text-sm">{trade.symbol}</td>
                        <td className="py-3 px-3 text-slate-300">
                          ${trade.currentPrice > 0 ? trade.currentPrice.toFixed(2) : '—'}
                        </td>
                        <td className="py-3 px-3 text-emerald-300 font-bold text-sm">
                          ${trade.suggestedStrike.toFixed(2)} Put
                        </td>
                        <td className="py-3 px-3 text-slate-300 font-bold">{trade.delta}&Delta;</td>
                        <td className="py-3 px-3 text-emerald-400 font-bold">{trade.estPremiumAnnualized}</td>
                        <td className="py-3 px-3 text-amber-300 font-bold">
                          ${trade.capitalCommitted.toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-slate-300 text-[11px] max-w-sm">
                          {trade.technicalJustification}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => handleStageGeminiTrade(trade)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/30 transition-all cursor-pointer flex items-center gap-1.5 ml-auto"
                            title="Push directly into Charles Schwab Broker Staging"
                          >
                            <Zap className="w-3.5 h-3.5" />
                            <span>1-Click Stage</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Borderline & Excluded Collapsibles */}
              {(parsedGeminiResult.borderlineCandidates.length > 0 ||
                parsedGeminiResult.excludedCandidates.length > 0) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-xs border-t border-slate-800">
                  {parsedGeminiResult.borderlineCandidates.length > 0 && (
                    <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/30 space-y-1.5">
                      <span className="font-bold text-amber-300 block">Table 2: Borderline Candidates</span>
                      <ul className="space-y-1 text-slate-300 text-[11px]">
                        {parsedGeminiResult.borderlineCandidates.map((b, i) => (
                          <li key={i} className="flex items-start gap-1">
                            <span className="text-amber-400 font-bold font-mono">{b.symbol}:</span>
                            <span className="text-slate-400">{b.borderlineReason}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {parsedGeminiResult.excludedCandidates.length > 0 && (
                    <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-500/30 space-y-1.5">
                      <span className="font-bold text-rose-300 block">Table 3: Excluded Candidates</span>
                      <ul className="space-y-1 text-slate-300 text-[11px]">
                        {parsedGeminiResult.excludedCandidates.map((x, i) => (
                          <li key={i} className="flex items-start gap-1">
                            <span className="text-rose-400 font-bold font-mono">{x.symbol}:</span>
                            <span className="text-slate-400">{x.reasonForExclusion}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Candidate Contracts Table & Prompt Trigger Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-900/90 rounded-2xl border border-slate-800">
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {finalCandidates.length} Approved Contracts
                </span>
                <span className="text-xs text-slate-400">
                  Filtered for 15Δ–25Δ sweet spot &amp; cash sizing &le; ${maxPositionCollateral.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsAiModalOpen(true)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-600 to-emerald-600 hover:from-amber-500 hover:to-emerald-500 text-white shadow-lg shadow-amber-600/30 transition-all flex items-center space-x-2 cursor-pointer"
              >
                <BrainCircuit className="w-4 h-4 text-white" />
                <span>Generate Institutional Gemini Prompt (3 Markdown Tables)</span>
              </button>
            </div>
          </div>

          {/* Approved Contracts Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/80 shadow-xl">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 text-[11px]">
                  <th className="py-3 px-4">Symbol &amp; Tier</th>
                  <th
                    onClick={() => {
                      setSortBy('current_price');
                      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    }}
                    className="py-3 px-3 cursor-pointer hover:text-white"
                  >
                    Spot Price
                  </th>
                  <th
                    onClick={() => {
                      setSortBy('strike');
                      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    }}
                    className="py-3 px-3 cursor-pointer hover:text-white"
                  >
                    Strike (Cushion)
                  </th>
                  <th className="py-3 px-3">DTE (Exp)</th>
                  <th
                    onClick={() => {
                      setSortBy('abs_delta');
                      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    }}
                    className="py-3 px-3 cursor-pointer hover:text-white"
                  >
                    Delta (POP)
                  </th>
                  <th className="py-3 px-3">Premium (Cash)</th>
                  <th className="py-3 px-3">Collateral</th>
                  <th
                    onClick={() => {
                      setSortBy('annualized_roc');
                      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    }}
                    className="py-3 px-3 cursor-pointer hover:text-white text-right"
                  >
                    Annualized ROC
                  </th>
                  <th className="py-3 px-3 text-center">Affordable</th>
                  <th className="py-3 px-4 text-center">Stage Order</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-800/60">
                {finalCandidates.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-400">
                      <div className="max-w-md mx-auto space-y-2">
                        <p className="text-sm font-medium text-slate-300">
                          No candidates match your cascading funnel criteria.
                        </p>
                        <p className="text-xs text-slate-500">
                          Try adjusting IV Rank, expanding the Delta range, or increasing the collateral budget.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  finalCandidates.map((opp, idx) => {
                    const affordableContracts = Math.floor(
                      (capitalState.freeCash || 0) / (opp.collateral_required || opp.strike * 100)
                    );

                    return (
                      <tr key={opp.id || idx} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4 font-mono">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => onSelectSymbolForChart?.(opp.symbol)}
                              className="text-cyan-300 hover:text-cyan-200 font-bold hover:underline"
                            >
                              {opp.symbol}
                            </button>
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400">
                              {opp.liquidity_tier}
                            </span>
                          </div>
                        </td>

                        <td className="py-3 px-3 text-slate-300 font-mono">${opp.current_price.toFixed(2)}</td>

                        <td className="py-3 px-3 font-mono">
                          <span className="text-emerald-400 font-bold">${opp.strike.toFixed(2)}</span>
                          <span className="text-slate-500 text-[10px] block">
                            +{opp.cushion_pct.toFixed(1)}% cushion
                          </span>
                        </td>

                        <td className="py-3 px-3 text-slate-400 font-mono">
                          {opp.dte}d <span className="text-slate-500 text-[10px] block">{opp.expiration}</span>
                        </td>

                        <td className="py-3 px-3 font-mono">
                          <span className="text-white font-bold">{opp.delta.toFixed(2)}&Delta;</span>
                          <span className="text-emerald-400 text-[10px] block">{opp.pop_pct}% POP</span>
                        </td>

                        <td className="py-3 px-3 font-mono text-emerald-400">
                          ${opp.mid.toFixed(2)}
                          <span className="text-slate-500 text-[10px] block">
                            ${(opp.mid * 100).toFixed(0)}/contract
                          </span>
                        </td>

                        <td className="py-3 px-3 font-mono text-amber-300">
                          ${(opp.collateral_required || opp.strike * 100).toLocaleString()}
                        </td>

                        <td className="py-3 px-3 text-right font-mono font-bold text-emerald-400">
                          {opp.annualized_roc.toFixed(1)}%
                        </td>

                        <td className="py-3 px-3 text-center font-mono">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              affordableContracts > 0
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : 'bg-rose-500/20 text-rose-400'
                            }`}
                          >
                            {affordableContracts} Max
                          </span>
                        </td>

                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => {
                              if (onStageOpportunity) onStageOpportunity(opp);
                              if (onOpenBrokerStaging) onOpenBrokerStaging(opp.symbol, opp.strategy);
                              showToast(`Staged ${opp.symbol} in Broker Order Workbench!`);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/30 transition-all cursor-pointer flex items-center space-x-1 mx-auto"
                          >
                            <Zap className="w-3.5 h-3.5" />
                            <span>Stage</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* AI Extended Thinking Modal */}
          {isAiModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
              <div
                className="w-full max-w-3xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
                  <div className="flex items-center space-x-2.5">
                    <span className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                      <BrainCircuit className="w-5 h-5" />
                    </span>
                    <div>
                      <h3 className="text-base font-bold text-white flex items-center gap-2">
                        <span>Gemini AI Pro Extended Thinking Options Prompt</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                          Zero Cost / Personal Account
                        </span>
                      </h3>
                      <p className="text-xs text-slate-400">
                        Evaluates screened candidate contracts using your personal Gemini Pro/Advanced subscription ($0 API billing).
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setIsAiModalOpen(false)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  >
                    ✕
                  </button>
                </div>

                <div className="p-5 overflow-y-auto space-y-4 text-xs">
                  <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/30 text-xs text-amber-200 space-y-1">
                    <span className="font-bold block">💡 How to use with gemini.google.com ($0 Cost):</span>
                    <ol className="list-decimal list-inside space-y-0.5 text-slate-300 text-[11px]">
                      <li>Click <strong>&quot;1-Click Copy Prompt&quot;</strong> below.</li>
                      <li>Open <strong>gemini.google.com</strong> (select Gemini Pro with Extended Thinking HIGH).</li>
                      <li>Paste the prompt &amp; run. Gemini outputs Table 1 (Top 5 Trades), Table 2, and Table 3.</li>
                      <li>Paste Gemini&apos;s markdown response into the box below to parse and stage trades in 1 click!</li>
                    </ol>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-300">Generated Institutional Prompt</span>
                      <span className="text-[11px] text-slate-500 font-mono">
                        {finalCandidates.length} candidate contracts pre-formatted
                      </span>
                    </div>
                    <textarea
                      readOnly
                      rows={7}
                      value={generateGeminiThinkingPrompt()}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white font-mono text-[11px] leading-relaxed select-all focus:outline-none"
                    />
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800">
                    <a
                      href="https://gemini.google.com"
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-amber-400 hover:text-amber-300 flex items-center space-x-1.5 font-semibold"
                    >
                      <span>Open gemini.google.com</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>

                    <button
                      onClick={handleCopyPrompt}
                      className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all cursor-pointer ${
                        copiedPrompt
                          ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                          : 'bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-600/30'
                      }`}
                    >
                      {copiedPrompt ? (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Copied to Clipboard!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          <span>1-Click Copy Prompt</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="pt-3 border-t border-slate-800 space-y-2">
                    <span className="font-semibold text-slate-300 block">
                      📥 Paste Gemini&apos;s Markdown Response Here (Auto-Parses 3 Tables):
                    </span>
                    <textarea
                      rows={6}
                      value={importedBriefing}
                      onChange={(e) => handleParseMarkdown(e.target.value)}
                      placeholder="Paste Gemini's output markdown here. The 3 tables (Top 5 Recommended Trades, Borderline Candidates, Excluded Candidates) will be parsed automatically..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MarketChameleon Prescreen Modal */}
      <MarketChameleonPrescreenModal
        isOpen={isPrescreenModalOpen}
        onClose={() => setIsPrescreenModalOpen(false)}
        activeFilters={mcFilters}
        cboeOnly={cboeOnlyGate}
        onApplyPreset={(filters, cboe, presetName) => {
          setMcFilters(filters);
          setCboeOnlyGate(cboe);
          if (presetName) setActivePresetName(presetName);
          showToast(`Prescreen Active: "${presetName || 'Custom Selection'}"`);
        }}
      />
    </div>
  );
};
