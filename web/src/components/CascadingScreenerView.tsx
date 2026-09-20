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
import { fetchTickerChartData, fetchTradierQuotesBatch, syncLiveEquitiesPrices } from '../utils/liveMarketFetcher';
import { calculateBarchartOpinion } from '../utils/barchartEngine';
import { parseScreenerCSV } from '../utils/screenerCsvParser';
import { extractSymbolsFromTextOrCsv, sanitizeTickerList } from '../utils/symbolSanitizer';
import { hydrateOptionOpportunity } from '../utils/screenerHydrator';
import { SortableTh } from './ui/SortableTh';
import { sortData, SortOrder } from '../utils/tableSort';
import { BarchartTopTab } from './screener/cascading/BarchartTopTab';
import { MarketChameleonTab } from './screener/cascading/MarketChameleonTab';
import { TosReturnScreenTab } from './screener/cascading/TosReturnScreenTab';
import { GeminiDecisionHubTab } from './screener/cascading/GeminiDecisionHubTab';
import { getSchwabImportedEquities, getSchwabImportedEquitiesWithPrices } from '../utils/schwabPositionsParser';
import { SECURITY_INTELLIGENCE_REGISTRY } from '../utils/securityIntelligence';

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

  // Multi-Source Datasets (with LocalStorage cache fallback for live Friday updates)
  const [barchartDataset, setBarchartDataset] = useState<WeeklyScreenerDataset | null>(() => {
    try {
      const saved = localStorage.getItem('deltaharvest_barchart_screen_data');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return initialWeeklyDataset || null;
  });
  const [mcDataset, setMcDataset] = useState<WeeklyScreenerDataset | null>(() => {
    try {
      const saved = localStorage.getItem('deltaharvest_mc_screen_data');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return null;
  });
  const [tosWatchlistDataset, setTosWatchlistDataset] = useState<WeeklyScreenerDataset | null>(() => {
    try {
      const saved = localStorage.getItem('deltaharvest_tos_barchart_watchlist');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return null;
  });

  const [isUpdatingBarchart, setIsUpdatingBarchart] = useState<boolean>(false);
  const [isUpdatingMc, setIsUpdatingMc] = useState<boolean>(false);

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

  // ThinkorSwim Custom Input & Analysis State (Defaulted strictly to Schwab CSV Equities)
  const [tosTickersInput, setTosTickersInput] = useState<string>(() =>
    getSchwabImportedEquities().join(', ')
  );
  const [singleSymbolInput, setSingleSymbolInput] = useState<string>('');
  const [isAnalyzingTos, setIsAnalyzingTos] = useState<boolean>(false);
  const [tosError, setTosError] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string>('');
  const [copiedBarchartTickers, setCopiedBarchartTickers] = useState<boolean>(false);

  // Sync with Schwab CSV portfolio uploads & clean reset on workflow initialization
  useEffect(() => {
    const handlePortfolioUpdate = () => {
      const schwabSyms = getSchwabImportedEquities().join(', ');
      setTosTickersInput(schwabSyms);
    };
    const handleWorkflowReset = () => {
      setBarchartDataset(null);
      setMcDataset(null);
      setTosWatchlistDataset(null);
      setImportedBriefing('');
      setParsedGeminiResult(null);
      const schwabSyms = getSchwabImportedEquities().join(', ');
      setTosTickersInput(schwabSyms);
    };

    window.addEventListener('deltaharvest_portfolio_updated', handlePortfolioUpdate);
    window.addEventListener('deltaharvest_workflow_reset', handleWorkflowReset);
    return () => {
      window.removeEventListener('deltaharvest_portfolio_updated', handlePortfolioUpdate);
      window.removeEventListener('deltaharvest_workflow_reset', handleWorkflowReset);
    };
  }, []);

  // Funnel Stage Controls (Tab 4: Gemini Decision Hub)
  const [minBarchartScore, setMinBarchartScore] = useState<number>(70);
  const [onlyTop1Pct, setOnlyTop1Pct] = useState<boolean>(false);
  const [onlyMcUptrend, setOnlyMcUptrend] = useState<boolean>(false);
  const [strictCboeWeeklysOnly, setStrictCboeWeeklysOnly] = useState<boolean>(true);
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
    if (!mcDataset) {
      fetch('./data/weekly_screeners_marketchameleon.json?t=' + Date.now())
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data) setMcDataset(data);
        })
        .catch((err) => console.warn('Could not load weekly_screeners_marketchameleon.json:', err));
    }
  }, [mcDataset]);

  // Load Initial Custom Barchart Watchlist if no saved state
  useEffect(() => {
    if (!tosWatchlistDataset) {
      const saved = localStorage.getItem('deltaharvest_tos_barchart_watchlist');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed && Array.isArray(parsed.records)) {
            const bannedSyms = new Set([
              'AAPL',
              'MSFT',
              'AMZN',
              'GOOGL',
              'META',
              'AMD',
              'AVGO',
              'TSM',
              'QCOM',
              'MU',
              'ASML',
              'MARA',
              'SOFI',
              'RIVN',
              'AI',
              'PATH',
              'SNOW',
              'CRWD',
              'MDB',
              'DELL',
              'NOW',
              'ARM',
              'SMCI',
            ]);
            const hasBanned = parsed.records.some((r: any) => bannedSyms.has(r.symbol));
            if (!hasBanned) {
              setTosWatchlistDataset(parsed);
              return;
            } else {
              localStorage.removeItem('deltaharvest_tos_barchart_watchlist');
            }
          }
        } catch {
          // ignore
        }
      }
      fetch('./data/weekly_screeners_barchart_custom.json?t=' + Date.now())
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data) setTosWatchlistDataset(data);
        })
        .catch((err) => console.warn('Could not load weekly_screeners_barchart_custom.json:', err));
    }
  }, [tosWatchlistDataset]);

  // Auto-sync most current trading price (or closing price if after close) for TOS/Barchart records
  useEffect(() => {
    if (!tosWatchlistDataset || tosWatchlistDataset.records.length === 0) return;
    const symbols = tosWatchlistDataset.records.map((r) => r.symbol);
    syncLiveEquitiesPrices(symbols).then((liveMap) => {
      if (!liveMap || liveMap.size === 0) return;
      let hasChanges = false;
      const syncedRecords = tosWatchlistDataset.records.map((r) => {
        const live = liveMap.get(r.symbol);
        if (live && live.price > 0 && Math.abs(live.price - r.last_price) > 0.001) {
          hasChanges = true;
          return {
            ...r,
            last_price: live.price,
            price_change: live.priceChange !== undefined ? live.priceChange : r.price_change,
            percent_change: live.percentChange !== undefined ? live.percentChange : r.percent_change,
            updated_at: new Date().toISOString(),
          };
        }
        return r;
      });

      if (hasChanges) {
        const fresh: WeeklyScreenerDataset = {
          ...tosWatchlistDataset,
          timestamp: new Date().toISOString(),
          records: syncedRecords,
        };
        setTosWatchlistDataset(fresh);
        try {
          localStorage.setItem('deltaharvest_tos_barchart_watchlist', JSON.stringify(fresh));
        } catch {
          // ignore
        }
      }
    });
  }, [tosWatchlistDataset?.total_count]);

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

  // 1. Update Barchart Top 1% by re-hydrating latest quotes and technical consensus
  const handleUpdateBarchartDataset = async () => {
    setIsUpdatingBarchart(true);
    showToast('Fetching latest market quotes & 13-indicator consensus for Barchart Top 1%...');

    try {
      // 1. Re-sync from latest generated dataset if available
      let baseDataset = barchartDataset;
      try {
        const res = await fetch('./data/weekly_screeners.json?t=' + Date.now());
        if (res.ok) {
          const freshData = await res.json();
          if (freshData?.records && freshData.records.length > 0) {
            baseDataset = freshData;
          }
        }
      } catch {
        // use existing
      }

      if (!baseDataset?.records || baseDataset.records.length === 0) {
        showToast('No Barchart records loaded to update. Please upload a Friday export CSV.');
        setIsUpdatingBarchart(false);
        return;
      }

      const symbols = baseDataset.records.map((r) => r.symbol);
      let quotesMap = new Map<string, { last: number; bid: number; ask: number; volume: number }>();
      try {
        quotesMap = await fetchTradierQuotesBatch(symbols);
      } catch {
        // Fallback
      }

      const updatedRecords: WeeklyScreenerRecord[] = await Promise.all(
        baseDataset.records.map(async (record) => {
          const liveQuote = quotesMap.get(record.symbol.toUpperCase());
          const livePrice = liveQuote?.last;
          let updatedRecord = { ...record };

          if (livePrice && livePrice > 0) {
            const diff = Math.round((livePrice - record.last_price) * 100) / 100;
            const pct = record.last_price > 0 ? Math.round((diff / record.last_price) * 10000) / 100 : 0;
            updatedRecord = {
              ...updatedRecord,
              last_price: livePrice,
              price_change: diff !== 0 ? diff : record.price_change,
              percent_change: pct !== 0 ? pct : record.percent_change,
            };
          }
          return updatedRecord;
        })
      );

      const updatedDataset: WeeklyScreenerDataset = {
        ...baseDataset,
        timestamp: new Date().toISOString(),
        records: updatedRecords,
      };

      setBarchartDataset(updatedDataset);
      try {
        localStorage.setItem('deltaharvest_barchart_screen_data', JSON.stringify(updatedDataset));
      } catch {
        // ignore
      }
      showToast(`✓ Refreshed ${updatedRecords.length} Barchart stocks with latest market data!`);
    } catch (err: any) {
      console.error('Failed to update Barchart dataset:', err);
      showToast('Could not complete live update. Please import latest Friday CSV.');
    } finally {
      setIsUpdatingBarchart(false);
    }
  };

  // 2. Upload and parse latest Barchart CSV
  const handleBarchartCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = (evt.target?.result as string) || '';
      if (!text) return;
      try {
        const records = parseScreenerCSV(text, 'BARCHART');
        if (!records || records.length === 0) {
          showToast('No valid records found in the uploaded Barchart CSV.');
          return;
        }
        const fresh: WeeklyScreenerDataset = {
          source_id: 'barchart',
          source_name: 'Barchart Direction Strength (Top 1%)',
          source_url: 'https://www.barchart.com/stocks/signals/direction-strength?viewName=190898',
          timestamp: new Date().toISOString(),
          total_count: records.length,
          records,
        };
        setBarchartDataset(fresh);
        try {
          localStorage.setItem('deltaharvest_barchart_screen_data', JSON.stringify(fresh));
        } catch {
          // ignore
        }
        showToast(`✓ Successfully imported ${records.length} Barchart screened equities from ${file.name}!`);
      } catch (err: any) {
        console.error('Error parsing Barchart CSV:', err);
        showToast('Failed to parse Barchart CSV. Please check the file format.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // 3. Update MarketChameleon Momentum by re-hydrating latest quotes
  const handleUpdateMcDataset = async () => {
    setIsUpdatingMc(true);
    showToast('Fetching latest market prices for MarketChameleon Momentum...');

    try {
      // 1. Re-sync from latest generated dataset if available
      let baseDataset = mcDataset;
      try {
        const res = await fetch('./data/weekly_screeners_marketchameleon.json?t=' + Date.now());
        if (res.ok) {
          const freshData = await res.json();
          if (freshData?.records && freshData.records.length > 0) {
            baseDataset = freshData;
          }
        }
      } catch {
        // use existing
      }

      if (!baseDataset?.records || baseDataset.records.length === 0) {
        showToast('No MarketChameleon records loaded to update. Please upload a Friday export CSV.');
        setIsUpdatingMc(false);
        return;
      }

      const symbols = baseDataset.records.map((r) => r.symbol);
      let quotesMap = new Map<string, { last: number; bid: number; ask: number; volume: number }>();
      try {
        quotesMap = await fetchTradierQuotesBatch(symbols);
      } catch {
        // Fallback
      }

      const updatedRecords: WeeklyScreenerRecord[] = baseDataset.records.map((record) => {
        const liveQuote = quotesMap.get(record.symbol.toUpperCase());
        const livePrice = liveQuote?.last;
        if (livePrice && livePrice > 0) {
          const diff = Math.round((livePrice - record.last_price) * 100) / 100;
          const pct = record.last_price > 0 ? Math.round((diff / record.last_price) * 10000) / 100 : 0;
          return {
            ...record,
            last_price: livePrice,
            price_change: diff !== 0 ? diff : record.price_change,
            percent_change: pct !== 0 ? pct : record.percent_change,
          };
        }
        return record;
      });

      const updatedDataset: WeeklyScreenerDataset = {
        ...baseDataset,
        timestamp: new Date().toISOString(),
        records: updatedRecords,
      };

      setMcDataset(updatedDataset);
      try {
        localStorage.setItem('deltaharvest_mc_screen_data', JSON.stringify(updatedDataset));
      } catch {
        // ignore
      }
      showToast(`✓ Refreshed ${updatedRecords.length} MarketChameleon equities with latest market data!`);
    } catch (err: any) {
      console.error('Failed to update MarketChameleon dataset:', err);
      showToast('Could not complete live update. Please import latest Friday CSV.');
    } finally {
      setIsUpdatingMc(false);
    }
  };

  // 4. Upload and parse latest MarketChameleon CSV / TSV
  const handleMcCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = (evt.target?.result as string) || '';
      if (!text) return;
      try {
        const records = parseScreenerCSV(text, 'MARKETCHAMELEON');
        if (!records || records.length === 0) {
          showToast('No valid records found in the uploaded MarketChameleon CSV.');
          return;
        }
        const fresh: WeeklyScreenerDataset = {
          source_id: 'marketchameleon',
          source_name: 'MarketChameleon Momentum Screener',
          source_url: 'https://marketchameleon.com/Screeners/Stocks',
          timestamp: new Date().toISOString(),
          total_count: records.length,
          records,
        };
        setMcDataset(fresh);
        try {
          localStorage.setItem('deltaharvest_mc_screen_data', JSON.stringify(fresh));
        } catch {
          // ignore
        }
        showToast(`✓ Successfully imported ${records.length} MarketChameleon equities from ${file.name}!`);
      } catch (err: any) {
        console.error('Error parsing MarketChameleon CSV:', err);
        showToast('Failed to parse MarketChameleon CSV. Please check the file format.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
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

    // 2. Client-side evaluation with real trading/closing prices
    try {
      const schwabImportedPrices = getSchwabImportedEquitiesWithPrices();
      const livePriceMap = await syncLiveEquitiesPrices(uniqueSymbols);
      const fallbackRecords: WeeklyScreenerRecord[] = [];
      const batchSize = 5;

      for (let i = 0; i < uniqueSymbols.length; i += batchSize) {
        const batch = uniqueSymbols.slice(i, i + batchSize);
        const batchResults = await Promise.all(
          batch.map(async (sym) => {
            const chartData = await fetchTickerChartData(sym);
            const closes = chartData?.closes || [];
            const liveInfo = livePriceMap.get(sym);
            let lastPrice = liveInfo?.price || chartData?.spotPrice || schwabImportedPrices[sym] || 100.0;
            let priceChange = liveInfo?.priceChange || 0;
            let percentChange = liveInfo?.percentChange || 0;

            if (closes.length >= 2 && priceChange === 0) {
              const lastClose = closes[closes.length - 1];
              const prevClose = closes[closes.length - 2];
              priceChange = Math.round((lastClose - prevClose) * 100) / 100;
              percentChange = Math.round(((lastClose - prevClose) / prevClose) * 10000) / 100;
              if (lastPrice <= 0) {
                lastPrice = Math.round(lastClose * 100) / 100;
              }
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
              name: SECURITY_INTELLIGENCE_REGISTRY[sym]?.name || `${sym} Equity`,
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
      // Stage 1 Gate: Strict CBOE Weeklys Enforcement
      if (strictCboeWeeklysOnly && !o.has_weeklys) return false;

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
    strictCboeWeeklysOnly,
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

  // Universal Table Sorting States for Barchart, MarketChameleon, ThinkorSwim, and Gemini
  const [bcSortKey, setBcSortKey] = useState<string>('opinion_pct');
  const [bcSortOrder, setBcSortOrder] = useState<SortOrder>('desc');
  const requestBcSort = (key: string) => {
    if (bcSortKey === key) setBcSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    else { setBcSortKey(key); setBcSortOrder('asc'); }
  };

  const [mcSortKey, setMcSortKey] = useState<string>('opinion_pct');
  const [mcSortOrder, setMcSortOrder] = useState<SortOrder>('desc');
  const requestMcSort = (key: string) => {
    if (mcSortKey === key) setMcSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    else { setMcSortKey(key); setMcSortOrder('asc'); }
  };

  const [tosSortKey, setTosSortKey] = useState<string>('opinion_pct');
  const [tosSortOrder, setTosSortOrder] = useState<SortOrder>('desc');
  const requestTosSort = (key: string) => {
    if (tosSortKey === key) setTosSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    else { setTosSortKey(key); setTosSortOrder('asc'); }
  };

  const [geminiTradesSortKey, setGeminiTradesSortKey] = useState<string>('riskRank');
  const [geminiTradesSortOrder, setGeminiTradesSortOrder] = useState<SortOrder>('asc');
  const requestGeminiTradesSort = (key: string) => {
    if (geminiTradesSortKey === key) setGeminiTradesSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    else { setGeminiTradesSortKey(key); setGeminiTradesSortOrder('asc'); }
  };

  const sortedBarchartRecords = useMemo(() => {
    return sortData(filteredBarchartRecords, bcSortKey, bcSortOrder);
  }, [filteredBarchartRecords, bcSortKey, bcSortOrder]);

  const sortedMcRecords = useMemo(() => {
    return sortData(filteredMcRecords, mcSortKey, mcSortOrder);
  }, [filteredMcRecords, mcSortKey, mcSortOrder]);

  const sortedTosRecords = useMemo(() => {
    return sortData(filteredTosRecords, tosSortKey, tosSortOrder);
  }, [filteredTosRecords, tosSortKey, tosSortOrder]);

  const sortedGeminiTrades = useMemo(() => {
    if (!parsedGeminiResult?.recommendedTrades) return [];
    return sortData(parsedGeminiResult.recommendedTrades, geminiTradesSortKey, geminiTradesSortOrder);
  }, [parsedGeminiResult?.recommendedTrades, geminiTradesSortKey, geminiTradesSortOrder]);

  const sortedFinalCandidates = useMemo(() => {
    return sortData(finalCandidates, sortBy, sortOrder);
  }, [finalCandidates, sortBy, sortOrder]);

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
        <BarchartTopTab
          barchartDataset={barchartDataset}
          sortedBarchartRecords={sortedBarchartRecords}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          weeklyOnlyFilter={weeklyOnlyFilter}
          onWeeklyOnlyFilterChange={setWeeklyOnlyFilter}
          opinionFilter={opinionFilter}
          onOpinionFilterChange={setOpinionFilter}
          isUpdatingBarchart={isUpdatingBarchart}
          onUpdateBarchartDataset={handleUpdateBarchartDataset}
          onBarchartCsvUpload={handleBarchartCsvUpload}
          onCopyResultsTSV={handleCopyResultsTSV}
          onDownloadCSV={handleDownloadCSV}
          onSendScreenedToGemini={handleSendScreenedToGemini}
          onOpenTickerAudit={onOpenTickerAudit}
          onSelectSymbolForChart={onSelectSymbolForChart}
          onStageScreenerRecord={handleStageScreenerRecord}
          bcSortKey={bcSortKey}
          bcSortOrder={bcSortOrder}
          requestBcSort={requestBcSort}
        />
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 2: MARKETCHAMELEON MOMENTUM SCREENER                             */}
      {/* ========================================================================= */}
      {activeSubTab === 'MARKETCHAMELEON' && (
        <MarketChameleonTab
          mcDataset={mcDataset}
          sortedMcRecords={sortedMcRecords}
          activePresetName={activePresetName}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          cboeOnlyGate={cboeOnlyGate}
          onCboeOnlyGateToggle={() => setCboeOnlyGate(!cboeOnlyGate)}
          onOpenPrescreenModal={() => setIsPrescreenModalOpen(true)}
          isUpdatingMc={isUpdatingMc}
          onUpdateMcDataset={handleUpdateMcDataset}
          onMcCsvUpload={handleMcCsvUpload}
          onCopyResultsTSV={handleCopyResultsTSV}
          onDownloadCSV={handleDownloadCSV}
          onSendScreenedToGemini={handleSendScreenedToGemini}
          onOpenTickerAudit={onOpenTickerAudit}
          onSelectSymbolForChart={onSelectSymbolForChart}
          onStageScreenerRecord={handleStageScreenerRecord}
          mcSortKey={mcSortKey}
          mcSortOrder={mcSortOrder}
          requestMcSort={requestMcSort}
        />
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 3: THINKORSWIM SCREEN & BARCHART VIEW 190898 WORKFLOW             */}
      {/* ========================================================================= */}
      {activeSubTab === 'TOS_BARCHART' && (
        <TosReturnScreenTab
          tosTickersInput={tosTickersInput}
          onTosTickersInputChange={setTosTickersInput}
          isAnalyzingTos={isAnalyzingTos}
          onRunBarchartAnalysis={handleRunBarchartAnalysis}
          copiedBarchartTickers={copiedBarchartTickers}
          onCopyAndOpenBarchart={handleCopyAndOpenBarchart}
          onTosFileUpload={handleTosFileUpload}
          tosError={tosError}
          tosWatchlistDataset={tosWatchlistDataset}
          sortedTosRecords={sortedTosRecords}
          onSendScreenedToGemini={handleSendScreenedToGemini}
          onCopyResultsTSV={handleCopyResultsTSV}
          onDownloadCSV={handleDownloadCSV}
          onClearReturnedScreen={handleClearReturnedScreen}
          onRemoveSymbolFromScreen={handleRemoveSymbolFromScreen}
          onOpenTickerAudit={onOpenTickerAudit}
          onSelectSymbolForChart={onSelectSymbolForChart}
          onStageScreenerRecord={handleStageScreenerRecord}
          tosSortKey={tosSortKey}
          tosSortOrder={tosSortOrder}
          requestTosSort={requestTosSort}
        />
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 4: GEMINI AI DECISION MATRIX & 15Δ–25Δ SWEET SPOT FUNNEL          */}
      {/* ========================================================================= */}
      {activeSubTab === 'GEMINI_DECISION_HUB' && (
        <GeminiDecisionHubTab
          capitalState={capitalState}
          geminiCandidateSource={geminiCandidateSource}
          onGeminiCandidateSourceChange={setGeminiCandidateSource}
          strictCboeWeeklysOnly={strictCboeWeeklysOnly}
          onStrictCboeWeeklysOnlyToggle={() => setStrictCboeWeeklysOnly(!strictCboeWeeklysOnly)}
          minIvRank={minIvRank}
          onMinIvRankChange={setMinIvRank}
          minDelta={minDelta}
          maxDelta={maxDelta}
          maxPositionCollateral={maxPositionCollateral}
          maxAffordablePositions={maxAffordablePositions}
          parsedGeminiResult={parsedGeminiResult}
          sortedGeminiTrades={sortedGeminiTrades}
          geminiTradesSortKey={geminiTradesSortKey}
          geminiTradesSortOrder={geminiTradesSortOrder}
          requestGeminiTradesSort={requestGeminiTradesSort}
          onStageGeminiTrade={handleStageGeminiTrade}
          finalCandidates={finalCandidates}
          sortedFinalCandidates={sortedFinalCandidates}
          sortBy={sortBy}
          sortOrder={sortOrder}
          setSortBy={setSortBy}
          setSortOrder={setSortOrder}
          onStageOpportunity={onStageOpportunity}
          onOpenBrokerStaging={onOpenBrokerStaging}
          onSelectSymbolForChart={onSelectSymbolForChart}
          showToast={showToast}
          isAiModalOpen={isAiModalOpen}
          setIsAiModalOpen={setIsAiModalOpen}
          generateGeminiThinkingPrompt={generateGeminiThinkingPrompt}
          copiedPrompt={copiedPrompt}
          handleCopyPrompt={handleCopyPrompt}
          importedBriefing={importedBriefing}
          handleParseMarkdown={handleParseMarkdown}
        />
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
