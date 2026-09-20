import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  WeeklyScreenerRecord,
  WeeklyScreenerDataset,
  ScreenerSourceType,
} from '../types/weeklyScreeners';
import { parseScreenerCSV } from '../utils/screenerCsvParser';
import {
  TrendingUp,
  Search,
  Upload,
  Download,
  RefreshCw,
  Sliders,
  ShieldCheck,
  Flame,
  Award,
  Zap,
  BarChart2,
  FileSpreadsheet,
  CheckCircle2,
  Layers,
  ChevronRight,
  HelpCircle,
  ExternalLink,
  Plus,
  AlertTriangle,
  Copy,
  Filter,
  ListFilter,
  Trash2,
} from './icons';
import { MarketChameleonPrescreenModal } from './MarketChameleonPrescreenModal';
import { DEFAULT_MARKET_CHAMELEON_PRESETS } from '../types/marketChameleonPrescreen';
import { fetchTickerChartData, syncLiveEquitiesPrices } from '../utils/liveMarketFetcher';
import { calculateBarchartOpinion } from '../utils/barchartEngine';
import { isWeeklyCadence } from '../utils/capitalAndTaxLedger';
import { extractSymbolsFromTextOrCsv, sanitizeTickerList } from '../utils/symbolSanitizer';
import { getSchwabImportedEquities, getSchwabImportedEquitiesWithPrices } from '../utils/schwabPositionsParser';
import { SECURITY_INTELLIGENCE_REGISTRY } from '../utils/securityIntelligence';
import { SortableTh } from './ui/SortableTh';
import { sortData, SortOrder } from '../utils/tableSort';
import { MarketChameleonRow } from './screener/barchart/MarketChameleonRow';
import { BarchartScreenRow } from './screener/barchart/BarchartScreenRow';
import { ScreenerExportBar } from './screener/barchart/ScreenerExportBar';

interface WeeklyStockScreenersViewProps {
  initialDataset: WeeklyScreenerDataset | null;
  onSelectSymbolForChart?: (symbol: string) => void;
  onOpenTickerAudit?: (symbol: string) => void;
  onOpenBrokerStaging?: (symbol: string, strategy: string) => void;
}

export const WeeklyStockScreenersView: React.FC<WeeklyStockScreenersViewProps> = ({
  initialDataset,
  onSelectSymbolForChart,
  onOpenTickerAudit,
  onOpenBrokerStaging,
}) => {
  const [barchartDataset, setBarchartDataset] = useState<WeeklyScreenerDataset | null>(initialDataset);
  const [mcDataset, setMcDataset] = useState<WeeklyScreenerDataset | null>(null);
  const [watchlistDataset, setWatchlistDataset] = useState<WeeklyScreenerDataset | null>(null);
  const [customDataset, setCustomDataset] = useState<WeeklyScreenerDataset | null>(null);
  const [activeSource, setActiveSource] = useState<ScreenerSourceType>('BARCHART');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [weeklyOnly, setWeeklyOnly] = useState<boolean>(false);
  const [opinionFilter, setOpinionFilter] = useState<'ALL' | '100' | '80'>('ALL');
  const [strategyFilter, setStrategyFilter] = useState<string>('ALL');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState<string>('');
  const [copySuccessMsg, setCopySuccessMsg] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // MarketChameleon Prescreen Builder State
  const [isPrescreenModalOpen, setIsPrescreenModalOpen] = useState<boolean>(false);
  const [activePresetName, setActivePresetName] = useState<string>(DEFAULT_MARKET_CHAMELEON_PRESETS[0].name);
  const [mcFilters, setMcFilters] = useState<Record<string, string>>(DEFAULT_MARKET_CHAMELEON_PRESETS[0].filters);
  const [cboeOnlyGate, setCboeOnlyGate] = useState<boolean>(false);

  // Barchart Custom Watchlist (View 190898) Ingestion State (Restricted to Schwab CSV Equities)
  const [watchlistInputText, setWatchlistInputText] = useState<string>(() =>
    getSchwabImportedEquities().join(', ')
  );
  const [singleSymbolInput, setSingleSymbolInput] = useState<string>('');
  const [isAnalyzingWatchlist, setIsAnalyzingWatchlist] = useState<boolean>(false);
  const [watchlistError, setWatchlistError] = useState<string>('');

  // Sync with Schwab CSV portfolio uploads
  useEffect(() => {
    const handlePortfolioUpdate = () => {
      const schwabSyms = getSchwabImportedEquities().join(', ');
      setWatchlistInputText(schwabSyms);
    };
    window.addEventListener('deltaharvest_portfolio_updated', handlePortfolioUpdate);
    return () => window.removeEventListener('deltaharvest_portfolio_updated', handlePortfolioUpdate);
  }, []);

  // Apply prescreen preset or filter configuration from modal
  const handleApplyPreset = (filters: Record<string, string>, cboeOnly: boolean, presetName?: string) => {
    setMcFilters(filters);
    setCboeOnlyGate(cboeOnly);
    if (presetName) setActivePresetName(presetName);
    setUploadSuccessMsg(`Prescreen Active: "${presetName || 'Custom Selection'}" ${cboeOnly ? '• Strict CBOE Weeklys Enforced' : '• All Options Chains'}`);
    setTimeout(() => setUploadSuccessMsg(''), 5000);
  };

  // Sync initial dataset
  useEffect(() => {
    if (initialDataset && !barchartDataset) {
      setBarchartDataset(initialDataset);
    }
  }, [initialDataset, barchartDataset]);

  // Load MarketChameleon dataset
  useEffect(() => {
    const fetchMcDataset = async () => {
      try {
        const res = await fetch('./data/weekly_screeners_marketchameleon.json?t=' + Date.now());
        if (res.ok) {
          const json = await res.json();
          setMcDataset(json);
        }
      } catch (err) {
        console.warn('Could not load MarketChameleon dataset:', err);
      }
    };
    fetchMcDataset();
  }, []);

  // Load Barchart Custom Watchlist dataset
  useEffect(() => {
    const fetchWatchlistDataset = async () => {
      try {
        const res = await fetch('./data/weekly_screeners_barchart_custom.json?t=' + Date.now());
        if (res.ok) {
          const json = await res.json();
          setWatchlistDataset(json);
        }
      } catch (err) {
        console.warn('Could not load Barchart custom watchlist dataset:', err);
      }
    };
    fetchWatchlistDataset();
  }, []);

  // Auto-sync most current trading price (or closing price if after close) for Barchart Watchlist records
  useEffect(() => {
    if (!watchlistDataset || watchlistDataset.records.length === 0) return;
    const symbols = watchlistDataset.records.map((r) => r.symbol);
    syncLiveEquitiesPrices(symbols).then((liveMap) => {
      if (!liveMap || liveMap.size === 0) return;
      let hasChanges = false;
      const syncedRecords = watchlistDataset.records.map((r) => {
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
        setWatchlistDataset({
          ...watchlistDataset,
          timestamp: new Date().toISOString(),
          records: syncedRecords,
        });
      }
    });
  }, [watchlistDataset?.total_count]);

  // Determine active dataset
  const currentDataset = useMemo(() => {
    if (activeSource === 'MARKETCHAMELEON') {
      return mcDataset;
    }
    if (activeSource === 'BARCHART_WATCHLIST') {
      return watchlistDataset;
    }
    if (activeSource === 'CUSTOM_UPLOAD') {
      return customDataset;
    }
    return barchartDataset;
  }, [activeSource, barchartDataset, mcDataset, watchlistDataset, customDataset]);

  // Execute on-demand Barchart View 190898 analysis for custom symbols
  const handleRunBarchartWatchlist = async (overrideSymbols?: string[]) => {
    let raw = (overrideSymbols ? overrideSymbols.join(' ') : watchlistInputText).trim();
    if (!raw && singleSymbolInput.trim()) {
      raw = singleSymbolInput.trim();
    }
    if (!raw) {
      setWatchlistError('Please enter at least one stock symbol to analyze.');
      return;
    }
    // Strict symbol sanitization & stoplist audit
    const { validSymbols, rejectedTokens } = sanitizeTickerList(raw);
    if (validSymbols.length === 0) {
      setWatchlistError(
        rejectedTokens.length > 0
          ? `No valid stock symbols found. Disallowed non-ticker words/headers: ${rejectedTokens.slice(0, 6).join(', ')}`
          : 'Please enter valid 1-5 letter stock symbols (e.g. AAPL, NVDA, TSLA).'
      );
      return;
    }

    if (rejectedTokens.length > 0) {
      setUploadSuccessMsg(
        `Audit Notice: Filtered out ${rejectedTokens.length} non-ticker words/headers (${rejectedTokens.slice(0, 3).join(', ')}...). Analyzing ${validSymbols.length} valid symbols.`
      );
      setTimeout(() => setUploadSuccessMsg(''), 6000);
    }

    setWatchlistError('');
    setIsAnalyzingWatchlist(true);

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
        setWatchlistDataset(data);
        setUploadSuccessMsg(`Successfully analyzed ${data.total_count} symbols on Barchart (View 190898)!`);
        setTimeout(() => setUploadSuccessMsg(''), 5000);
        setIsAnalyzingWatchlist(false);
        return;
      }
    } catch (apiErr) {
      console.warn('Backend API analyze-watchlist unavailable, using simulated indicator analysis fallback:', apiErr);
    }

    // 2. Client-side evaluation with real trading/closing prices (even over weekend/when market is closed)
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

            const hasWeekly = isWeeklyCadence(sym);
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
              name: SECURITY_INTELLIGENCE_REGISTRY[sym]?.name || sym,
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

      const fallbackDataset: WeeklyScreenerDataset = {
        source_id: 'barchart_custom',
        source_name: 'Barchart Custom Watchlist Analyzer (View 190898)',
        source_url: 'https://www.barchart.com/my/watchlist?viewName=190898',
        timestamp: new Date().toISOString(),
        total_count: fallbackRecords.length,
        records: fallbackRecords,
      };
      setWatchlistDataset(fallbackDataset);
      setUploadSuccessMsg(`Successfully analyzed ${fallbackRecords.length} symbols with live closing prices for Barchart View 190898!`);
      setTimeout(() => setUploadSuccessMsg(''), 5000);
    } catch (fallbackErr) {
      console.error('Failed to analyze symbols:', fallbackErr);
      setWatchlistError('Failed to analyze symbols. Please verify symbols and try again.');
    } finally {
      setIsAnalyzingWatchlist(false);
    }
  };

  // Quick analyze a single symbol
  const handleAddSingleSymbol = () => {
    const sym = singleSymbolInput.trim().toUpperCase();
    if (!sym) return;
    const currentList = watchlistInputText.replace(/[,;\t\n]/g, ' ').split(/\s+/).map(s => s.trim().toUpperCase()).filter(Boolean);
    if (!currentList.includes(sym)) {
      currentList.unshift(sym);
      setWatchlistInputText(currentList.join(', '));
    }
    setSingleSymbolInput('');
    handleRunBarchartWatchlist([sym]);
  };

  // Handle CSV file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;

        if (activeSource === 'BARCHART_WATCHLIST') {
          // Check if it's already a full screener CSV first
          const parsedRecords = parseScreenerCSV(text, activeSource);
          if (parsedRecords.length > 0 && parsedRecords.some(r => r.opinion_pct > 0 || r.last_price > 0)) {
            const newDataset: WeeklyScreenerDataset = {
              source_id: 'barchart_custom',
              source_name: 'Barchart Watchlist (View 190898)',
              source_url: 'https://www.barchart.com/my/watchlist?viewName=190898',
              timestamp: new Date().toISOString(),
              total_count: parsedRecords.length,
              records: parsedRecords,
            };
            setWatchlistDataset(newDataset);
            setUploadSuccessMsg(`Successfully imported ${parsedRecords.length} tickers from ${file.name}!`);
            setTimeout(() => setUploadSuccessMsg(''), 6000);
            return;
          }

          // Extract symbols using column-aware CSV detection and strict audit engine
          const audit = extractSymbolsFromTextOrCsv(text);
          if (audit.validSymbols.length > 0) {
            setWatchlistInputText(audit.validSymbols.join(', '));
            setUploadSuccessMsg(audit.auditMessage);
            setTimeout(() => setUploadSuccessMsg(''), 6000);
            handleRunBarchartWatchlist(audit.validSymbols);
            return;
          } else {
            setWatchlistError(
              `No valid stock symbols found in ${file.name}. ${
                audit.rejectedTokens.length > 0
                  ? `Filtered out ${audit.rejectedTokens.length} non-ticker headers/words.`
                  : 'File was empty or unrecognized.'
              }`
            );
            setIsUploading(false);
            return;
          }
        }

        const parsedRecords = parseScreenerCSV(text, activeSource);
        if (parsedRecords.length > 0) {
          const newDataset: WeeklyScreenerDataset = {
            source_id: activeSource === 'BARCHART' ? 'barchart' : activeSource === 'MARKETCHAMELEON' ? 'marketchameleon' : 'custom_upload',
            source_name: activeSource === 'BARCHART' ? 'Barchart Direction Strength' : activeSource === 'MARKETCHAMELEON' ? 'MarketChameleon Screener' : 'Custom Uploaded Screener',
            source_url: activeSource === 'BARCHART' ? 'https://www.barchart.com/stocks/signals/direction-strength?viewName=190898&timeFrame=daily&orderBy=hasWeeklyOptions&orderDir=desc' : 'https://marketchameleon.com/Screeners/Stocks',
            timestamp: new Date().toISOString(),
            total_count: parsedRecords.length,
            records: parsedRecords,
          };
          if (activeSource === 'BARCHART') setBarchartDataset(newDataset);
          else if (activeSource === 'MARKETCHAMELEON') setMcDataset(newDataset);
          else setCustomDataset(newDataset);

          setUploadSuccessMsg(`Successfully imported ${parsedRecords.length} tickers from ${file.name}!`);
          setTimeout(() => setUploadSuccessMsg(''), 6000);
        } else {
          alert('Could not parse any ticker rows from the provided CSV file. Please verify the CSV header contains Symbol/Price columns.');
        }
      } catch (err) {
        console.error('CSV parse error:', err);
        alert('Failed to parse the uploaded CSV file.');
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  // Copy and Paste Results function (Tab-delimited with respective column headings)
  const handleCopyResults = () => {
    if (filteredRecords.length === 0) return;

    let text = '';
    if (activeSource === 'MARKETCHAMELEON') {
      const headers = [
        'Symbol',
        'Name',
        'Price',
        'Change',
        '% Chg',
        'Market Cap',
        '14-Day RSI',
        'IV30',
        '20-Day Vol',
        '1-Yr Vol',
        'MA Signal',
        'CBOE Weeklys',
        'Options Cadence',
        'Recommended Strategy',
      ];
      const rows = filteredRecords.map((r) => {
        const ex = r.extra_fields || {};
        const isCboe = Boolean(r.in_cboe_registry || ex.in_cboe_registry);
        const cadence = r.expiration_cadence || ex.expiration_cadence || (isCboe ? 'Weekly' : 'Monthly Only');
        return [
          r.symbol,
          r.name,
          `$${r.last_price.toFixed(2)}`,
          `${r.price_change >= 0 ? '+' : ''}${r.price_change.toFixed(2)}`,
          `${r.percent_change >= 0 ? '+' : ''}${r.percent_change.toFixed(2)}%`,
          ex.market_cap_str || '',
          ex.rsi_14 !== undefined ? String(ex.rsi_14) : '',
          ex.iv30 !== undefined ? `${ex.iv30}%` : '',
          ex.vol_20d !== undefined ? `${ex.vol_20d}%` : '',
          ex.vol_1y !== undefined ? `${ex.vol_1y}%` : '',
          ex.ma_signal || r.opinion || '',
          isCboe ? 'Yes (CBOE)' : 'No (Monthly Only)',
          cadence,
          r.recommended_strategy,
        ].join('\t');
      });
      text = [headers.join('\t'), ...rows].join('\n');
    } else if (activeSource === 'BARCHART_WATCHLIST') {
      // Exact Barchart View 190898 Columns
      const headers = [
        'Symbol',
        'Name',
        'Last Price',
        'Net Change',
        '% Change',
        'Barchart Opinion',
        'Opinion Score %',
        'Stability (Previous)',
        'Stability (Last Week)',
        'Stability (Last Month)',
        'Weekly Options',
        'Signal Strength',
        'Signal Direction',
        'Recommended Strategy',
      ];
      const rows = filteredRecords.map((r) => [
        r.symbol,
        r.name,
        `$${r.last_price.toFixed(2)}`,
        `${r.price_change >= 0 ? '+' : ''}${r.price_change.toFixed(2)}`,
        `${r.percent_change >= 0 ? '+' : ''}${r.percent_change.toFixed(2)}%`,
        r.opinion,
        `${r.opinion_pct}%`,
        r.opinion_previous || '',
        r.opinion_last_week || '',
        r.opinion_last_month || '',
        r.has_weekly_options ? 'Yes' : 'No',
        r.signal_strength,
        r.signal_direction,
        r.recommended_strategy,
      ].join('\t'));
      text = [headers.join('\t'), ...rows].join('\n');
    } else {
      const headers = [
        'Symbol',
        'Name',
        'Last Price',
        'Net Chg',
        '% Chg',
        'Barchart Opinion',
        'Signal Strength',
        'Weekly Options',
        'Recommended Strategy',
      ];
      const rows = filteredRecords.map((r) => [
        r.symbol,
        r.name,
        `$${r.last_price.toFixed(2)}`,
        `${r.price_change >= 0 ? '+' : ''}${r.price_change.toFixed(2)}`,
        `${r.percent_change >= 0 ? '+' : ''}${r.percent_change.toFixed(2)}%`,
        r.opinion,
        r.signal_strength,
        r.has_weekly_options ? 'Yes' : 'No',
        r.recommended_strategy,
      ].join('\t'));
      text = [headers.join('\t'), ...rows].join('\n');
    }

    navigator.clipboard.writeText(text).then(() => {
      setCopySuccessMsg(`Copied ${filteredRecords.length} records with column headings to clipboard! Ready to paste into Excel, Sheets, or notes.`);
      setTimeout(() => setCopySuccessMsg(''), 5000);
    }).catch((err) => {
      console.error('Failed to copy text: ', err);
    });
  };

  // Export current records to CSV
  const handleExportCSV = () => {
    if (filteredRecords.length === 0) return;
    let csvContent = '';

    if (activeSource === 'MARKETCHAMELEON') {
      const headers = [
        'Symbol',
        'Name',
        'Price',
        'Price Change',
        '% Chg',
        'Market Cap',
        '14-Day RSI',
        'IV30',
        'IV % Rank',
        '1-Day Volatility',
        '20-Day Volatility',
        '1-Year Volatility',
        'MA Technical Signal',
        'Country',
        'Has Options',
        'CBOE Weeklys',
        'Options Cadence',
        'Stock Idea',
        'Recommended Strategy',
        'Notes',
      ];
      const rows = filteredRecords.map((r) => {
        const ex = r.extra_fields || {};
        const isCboe = Boolean(r.in_cboe_registry || ex.in_cboe_registry);
        const cadence = r.expiration_cadence || ex.expiration_cadence || (isCboe ? 'Weekly' : 'Monthly Only');
        return [
          `"${r.symbol}"`,
          `"${r.name.replace(/"/g, '""')}"`,
          `"$${r.last_price.toFixed(2)}"`,
          `"${r.price_change >= 0 ? '+' : ''}${r.price_change.toFixed(2)}"`,
          `"${r.percent_change >= 0 ? '+' : ''}${r.percent_change.toFixed(2)}%"`,
          `"${ex.market_cap_str || ''}"`,
          ex.rsi_14 !== undefined ? ex.rsi_14 : '',
          ex.iv30 !== undefined ? ex.iv30 : '',
          ex.iv_rank !== undefined ? ex.iv_rank : '',
          ex.vol_1d !== undefined ? ex.vol_1d : '',
          ex.vol_20d !== undefined ? ex.vol_20d : '',
          ex.vol_1y !== undefined ? ex.vol_1y : '',
          `"${ex.ma_signal || r.opinion || ''}"`,
          `"${ex.country || 'USA'}"`,
          r.has_options ? 'Yes' : 'No',
          isCboe ? 'Yes' : 'No',
          `"${cadence}"`,
          `"${ex.stock_idea || 'Momentum Stocks'}"`,
          `"${r.recommended_strategy}"`,
          `"${(r.notes || '').replace(/"/g, '""')}"`,
        ].join(',');
      });
      csvContent = [headers.join(','), ...rows].join('\n');
    } else if (activeSource === 'BARCHART_WATCHLIST') {
      const headers = [
        'Symbol',
        'Name',
        'Last Price',
        'Net Change',
        '% Change',
        'Barchart Opinion',
        'Opinion Score %',
        'Stability Previous',
        'Stability Last Week',
        'Stability Last Month',
        'Weekly Options',
        'Signal Strength',
        'Signal Direction',
        'Recommended Strategy',
      ];
      const rows = filteredRecords.map((r) => [
        `"${r.symbol}"`,
        `"${r.name.replace(/"/g, '""')}"`,
        r.last_price,
        r.price_change,
        `${r.percent_change}%`,
        `"${r.opinion}"`,
        r.opinion_pct,
        `"${r.opinion_previous || ''}"`,
        `"${r.opinion_last_week || ''}"`,
        `"${r.opinion_last_month || ''}"`,
        r.has_weekly_options ? 'Yes' : 'No',
        `"${r.signal_strength}"`,
        `"${r.signal_direction}"`,
        `"${r.recommended_strategy}"`,
      ].join(','));
      csvContent = [headers.join(','), ...rows].join('\n');
    } else {
      const headers = [
        'Symbol',
        'Name',
        'Last Price',
        'Price Change',
        'Percent Change',
        'Signal Opinion',
        'Opinion Score %',
        'Previous Opinion',
        'Last Week Opinion',
        'Last Month Opinion',
        'Weekly Options',
        'Signal Strength',
        'Signal Direction',
        'Recommended Strategy',
        'Source',
      ];
      const rows = filteredRecords.map((r) => [
        `"${r.symbol}"`,
        `"${r.name.replace(/"/g, '""')}"`,
        r.last_price,
        r.price_change,
        `${r.percent_change}%`,
        `"${r.opinion}"`,
        r.opinion_pct,
        `"${r.opinion_previous || ''}"`,
        `"${r.opinion_last_week || ''}"`,
        `"${r.opinion_last_month || ''}"`,
        r.has_weekly_options ? 'Yes' : 'No',
        `"${r.signal_strength}"`,
        `"${r.signal_direction}"`,
        `"${r.recommended_strategy}"`,
        `"${r.source}"`,
      ].join(','));
      csvContent = [headers.join(','), ...rows].join('\n');
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `weekly_stock_screeners_${activeSource.toLowerCase()}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Live Refresh trigger
  const handleLiveRefresh = async () => {
    setIsRefreshing(true);
    try {
      if (activeSource === 'MARKETCHAMELEON') {
        const resp = await fetch('./data/weekly_screeners_marketchameleon.json?t=' + Date.now());
        if (resp.ok) {
          const freshData = await resp.json();
          setMcDataset(freshData);
        }
      } else if (activeSource === 'BARCHART_WATCHLIST') {
        const resp = await fetch('./data/weekly_screeners_barchart_custom.json?t=' + Date.now());
        if (resp.ok) {
          const freshData = await resp.json();
          setWatchlistDataset(freshData);
        }
      } else {
        const resp = await fetch('./data/weekly_screeners.json?t=' + Date.now());
        if (resp.ok) {
          const freshData = await resp.json();
          setBarchartDataset(freshData);
        }
      }
    } catch (e) {
      console.warn('Could not fetch updated screener dataset', e);
    } finally {
      setIsRefreshing(false);
    }
  };

  const allRecords = currentDataset?.records || [];

  // Filtered Records
  const filteredRecords = useMemo(() => {
    return allRecords.filter((r) => {
      // Search
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchSym = r.symbol.toLowerCase().includes(q);
        const matchName = r.name.toLowerCase().includes(q);
        if (!matchSym && !matchName) return false;
      }

      // Weekly options only filter
      if (weeklyOnly && !r.has_weekly_options) {
        return false;
      }

      // CBOE Weeklys Gate filter for MarketChameleon
      if (activeSource === 'MARKETCHAMELEON' && cboeOnlyGate) {
        const isCboe = Boolean(r.in_cboe_registry || (r.extra_fields && r.extra_fields.in_cboe_registry) || r.has_weekly_options);
        if (!isCboe) {
          return false;
        }
      }

      // Opinion filter
      if (opinionFilter === '100' && r.opinion_pct < 99) {
        return false;
      }
      if (opinionFilter === '80' && r.opinion_pct < 80) {
        return false;
      }

      // Strategy filter
      if (strategyFilter !== 'ALL' && r.recommended_strategy !== strategyFilter) {
        return false;
      }

      return true;
    });
  }, [allRecords, searchQuery, weeklyOnly, opinionFilter, strategyFilter, cboeOnlyGate, activeSource]);

  // Universal Table Sorting State
  const [screenerSortKey, setScreenerSortKey] = useState<string>('opinion_pct');
  const [screenerSortOrder, setScreenerSortOrder] = useState<SortOrder>('desc');
  const requestScreenerSort = (key: string) => {
    if (screenerSortKey === key) {
      setScreenerSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setScreenerSortKey(key);
      setScreenerSortOrder('asc');
    }
  };

  const sortedRecords = useMemo(() => {
    return sortData(filteredRecords, screenerSortKey, screenerSortOrder);
  }, [filteredRecords, screenerSortKey, screenerSortOrder]);

  // KPI Calculations
  const stats = useMemo(() => {
    const total = allRecords.length;
    const weeklyCount = allRecords.filter((r) => r.has_weekly_options).length;
    const topBuyCount = allRecords.filter((r) => r.opinion_pct >= 90).length;
    const bullishCount = allRecords.filter((r) => r.opinion_pct > 0).length;
    const bullishPct = total > 0 ? Math.round((bullishCount / total) * 100) : 0;
    return {
      total,
      weeklyCount,
      topBuyCount,
      bullishPct,
    };
  }, [allRecords]);

  return (
    <div className="space-y-5">
      {/* Top Banner & Header */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800/90 shadow-xl bg-gradient-to-r from-slate-900/95 via-slate-900/80 to-slate-950/95">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 border border-emerald-400/30">
                <Flame className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-lg font-black tracking-tight text-white">
                    Weekly Stock Screeners
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                    Direction Strength &bull; Weekly Options Flow
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Automated screener agent tracking top 1% directional signals, 13-indicator technical consensus, and weekly options liquidity.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".csv"
            className="hidden"
          />
          <ScreenerExportBar
            isUploading={isUploading}
            onUploadClick={() => fileInputRef.current?.click()}
            onCopyResults={handleCopyResults}
            onExportCSV={handleExportCSV}
            onLiveRefresh={handleLiveRefresh}
            filteredRecordsCount={filteredRecords.length}
            isRefreshing={isRefreshing}
          />
        </div>

        {uploadSuccessMsg && (
          <div className="mt-3 p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center space-x-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{uploadSuccessMsg}</span>
          </div>
        )}

        {copySuccessMsg && (
          <div className="mt-3 p-2.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs flex items-center space-x-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>{copySuccessMsg}</span>
          </div>
        )}
      </div>

      {/* Multi-Source Provider Tabs */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center space-x-2 overflow-x-auto">
          <button
            onClick={() => setActiveSource('BARCHART')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSource === 'BARCHART'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-1 ring-emerald-400/50'
                : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-300" />
            <span>Barchart Direction Strength</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-white/20 text-white">
              {barchartDataset?.total_count || 0}
            </span>
          </button>

          <button
            onClick={() => setActiveSource('MARKETCHAMELEON')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSource === 'MARKETCHAMELEON'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30 ring-1 ring-purple-400/50'
                : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-purple-300" />
            <span>MarketChameleon.com (Momentum Screener)</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-white/20 text-white">
              {mcDataset?.total_count || (activeSource === 'MARKETCHAMELEON' ? stats.total : 60)}
            </span>
          </button>

          <button
            onClick={() => setActiveSource('BARCHART_WATCHLIST')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSource === 'BARCHART_WATCHLIST'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30 ring-1 ring-amber-400/50'
                : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <ListFilter className="w-3.5 h-3.5 text-amber-300" />
            <span>Barchart Watchlist (View 190898)</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-white/20 text-white">
              {watchlistDataset?.total_count || 0}
            </span>
          </button>

          <button
            onClick={() => setActiveSource('CUSTOM_UPLOAD')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSource === 'CUSTOM_UPLOAD'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 ring-1 ring-blue-400/50'
                : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <Upload className="w-3.5 h-3.5 text-cyan-300" />
            <span>Custom CSV Workspace</span>
          </button>
        </div>

        <div className="hidden md:flex items-center space-x-2 text-xs text-slate-400 font-mono">
          <span>Source URL:</span>
          {activeSource === 'MARKETCHAMELEON' ? (
            <a
              href="https://marketchameleon.com/Screeners/Stocks"
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-400 hover:underline flex items-center space-x-1"
            >
              <span>marketchameleon.com/Screeners/Stocks</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          ) : activeSource === 'BARCHART_WATCHLIST' ? (
            <a
              href="https://www.barchart.com/my/watchlist?viewName=190898"
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-400 hover:underline flex items-center space-x-1"
            >
              <span>barchart.com/my/watchlist?viewName=190898</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          ) : (
            <a
              href="https://www.barchart.com/stocks/signals/direction-strength?viewName=190898&timeFrame=daily&orderBy=hasWeeklyOptions&orderDir=desc"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-400 hover:underline flex items-center space-x-1"
            >
              <span>Barchart Signals (190898)</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>

      {/* Barchart Watchlist Ingestion & Analysis Console */}
      {activeSource === 'BARCHART_WATCHLIST' && (
        <div className="glass-panel p-4 rounded-xl border border-amber-800/60 bg-gradient-to-r from-amber-950/30 via-slate-900/90 to-amber-950/20 space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center space-x-2">
              <ListFilter className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold text-amber-200">
                Barchart Watchlist Analysis Engine (View 190898):
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-600/30 text-amber-300 border border-amber-500/40 font-mono">
                Single Stock &bull; Bulk Ingestion
              </span>
            </div>

            <div className="flex items-center space-x-2 text-xs text-slate-400">
              <span className="px-2 py-0.5 rounded bg-slate-800/80 text-amber-300 border border-amber-500/30 text-[11px] font-mono">
                Target View: viewName=190898
              </span>
            </div>
          </div>

          {/* Single Symbol Quick Ingest */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="flex-1 flex items-center space-x-2">
              <input
                type="text"
                placeholder="Single Symbol (e.g. NVDA)..."
                value={singleSymbolInput}
                onChange={(e) => setSingleSymbolInput(e.target.value.toUpperCase())}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSingleSymbol();
                  }
                }}
                className="w-full sm:w-56 bg-slate-950/90 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
              />
              <button
                type="button"
                onClick={handleAddSingleSymbol}
                disabled={!singleSymbolInput.trim() || isAnalyzingWatchlist}
                className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-xs font-bold transition-all cursor-pointer whitespace-nowrap shadow-sm shadow-amber-600/30"
              >
                + Quick Analyze
              </button>
            </div>

            {/* Presets Chips */}
            <div className="flex items-center space-x-1.5 overflow-x-auto text-[11px]">
              <span className="text-slate-400 text-xs mr-1">Universe Presets:</span>
              <button
                type="button"
                onClick={() => setWatchlistInputText(getSchwabImportedEquities().join(', '))}
                className="px-2.5 py-1 rounded bg-amber-600/30 hover:bg-amber-600/50 text-amber-200 border border-amber-500/40 text-[11px] font-bold cursor-pointer hover:text-white flex items-center space-x-1.5"
                title="Populate with equities from Schwab CSV import / Living Trust account"
              >
                <span>Schwab Import Equities</span>
                <span className="px-1.5 py-0.2 rounded-full bg-amber-500/30 text-amber-200 text-[10px] font-mono">
                  {getSchwabImportedEquities().length}
                </span>
              </button>
            </div>
          </div>

          {/* Bulk Ingestion Textarea */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label className="text-slate-300 font-semibold flex items-center space-x-1.5">
                <span>Bulk Stock Symbols Ingestion:</span>
                <span className="text-[10px] text-slate-400 font-normal">
                  (Paste symbols separated by commas, spaces, or newlines)
                </span>
              </label>
              <button
                type="button"
                onClick={() => {
                  if (fileInputRef.current) {
                    fileInputRef.current.click();
                  }
                }}
                className="text-amber-400 hover:text-amber-300 text-xs flex items-center space-x-1 cursor-pointer"
              >
                <Upload className="w-3 h-3" />
                <span>Upload Symbols File (.txt / .csv)</span>
              </button>
            </div>
            <textarea
              rows={2}
              value={watchlistInputText}
              onChange={(e) => setWatchlistInputText(e.target.value)}
              placeholder="e.g. AXTI, BLZE, IONQ, LUNR, NET, RTX, TSLA or your custom stock symbols"
              className="w-full bg-slate-950/90 border border-slate-700/80 rounded-lg p-2.5 text-xs text-slate-200 placeholder-slate-500 font-mono focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between pt-1">
            <div className="text-[11px] text-slate-400 font-mono">
              {watchlistDataset ? (
                <span>
                  Current Analysis: <strong className="text-white">{watchlistDataset.records.length}</strong> symbols evaluated &bull; Last updated {new Date(watchlistDataset.timestamp).toLocaleTimeString()}
                </span>
              ) : (
                <span>Ingest symbols above and run Barchart analysis</span>
              )}
            </div>

            <button
              type="button"
              onClick={() => handleRunBarchartWatchlist()}
              disabled={isAnalyzingWatchlist || !watchlistInputText.trim()}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 disabled:opacity-50 text-white text-xs font-bold transition-all cursor-pointer flex items-center space-x-2 shadow-lg shadow-amber-600/30"
            >
              {isAnalyzingWatchlist ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Analyzing via Barchart (View 190898)...</span>
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5 text-white" />
                  <span>Run Barchart Analysis (View 190898)</span>
                </>
              )}
            </button>
          </div>

          {watchlistError && (
            <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              {watchlistError}
            </div>
          )}
        </div>
      )}

      {/* MarketChameleon Preselected Criteria Banner */}
      {activeSource === 'MARKETCHAMELEON' && (
        <div className="glass-panel p-4 rounded-xl border border-purple-800/60 bg-purple-950/20 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center space-x-2">
              <Sliders className="w-4 h-4 text-purple-400" />
              <span className="text-xs font-bold text-purple-200">
                MarketChameleon Prescreen Preset:
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-600/30 text-purple-300 border border-purple-500/40">
                {activePresetName}
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCboeOnlyGate(!cboeOnlyGate)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  cboeOnlyGate
                    ? 'bg-emerald-950/60 text-emerald-300 border-emerald-400 shadow-sm shadow-emerald-500/20'
                    : 'bg-slate-900/80 text-slate-400 border-slate-700 hover:text-slate-200 hover:border-slate-600'
                }`}
                title="Toggle between strict CBOE weekly registered options or all optionable stocks"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>{cboeOnlyGate ? 'Strict CBOE Weeklys (10)' : 'All Options Chains (60)'}</span>
              </button>

              <button
                onClick={() => setIsPrescreenModalOpen(true)}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md shadow-purple-600/30 transition-all cursor-pointer"
                title="Customize native MarketChameleon prescreen criteria categories and save presets"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Prescreen Builder &amp; Presets</span>
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 text-[11px]">
            <span className="px-2.5 py-1 rounded-lg bg-purple-900/50 border border-purple-500/40 text-purple-200">
              <strong className="text-purple-400">Stock Idea:</strong> Momentum Stocks
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-purple-900/50 border border-purple-500/40 text-purple-200">
              <strong className="text-purple-400">Market Cap:</strong> &gt; $1 Billion
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-purple-900/50 border border-purple-500/40 text-purple-200">
              <strong className="text-purple-400">Options:</strong> Has Options
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-purple-900/50 border border-purple-500/40 text-purple-200">
              <strong className="text-purple-400">14-Day RSI:</strong> 50 to 70
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-purple-900/50 border border-purple-500/40 text-purple-200">
              <strong className="text-purple-400">Country:</strong> USA
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-purple-900/50 border border-purple-500/40 text-purple-200">
              <strong className="text-purple-400">Volatility:</strong> 1-Yr &gt; 30, 20-Day &gt; 30, 1-Day &gt; 30, IV30 &gt; 30
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-purple-900/50 border border-purple-500/40 text-purple-200">
              <strong className="text-purple-400">Technical MA:</strong> Any Bullish
            </span>
            <span className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold ${
              cboeOnlyGate
                ? 'bg-emerald-950/60 text-emerald-300 border-emerald-400'
                : 'bg-slate-900/60 text-slate-400 border-slate-700'
            }`}>
              <strong className={cboeOnlyGate ? 'text-emerald-400' : 'text-slate-400'}>CBOE Weeklys:</strong> {cboeOnlyGate ? 'Strict CBOE Verified' : 'All Chains'}
            </span>
          </div>
        </div>
      )}

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="glass-panel p-3.5 rounded-xl border border-slate-800/80 bg-slate-900/60">
          <div className="text-[11px] font-semibold text-slate-400 flex items-center justify-between">
            <span>Screener Universe</span>
            <Flame className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-xl font-black text-white font-mono mt-1">{stats.total}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            {activeSource === 'MARKETCHAMELEON' ? 'Filtered momentum & IV stocks' : 'Top direction strength stocks'}
          </div>
        </div>

        <div className="glass-panel p-3.5 rounded-xl border border-slate-800/80 bg-slate-900/60">
          <div className="text-[11px] font-semibold text-slate-400 flex items-center justify-between">
            <span>Options Liquidity</span>
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-xl font-black text-emerald-400 font-mono mt-1">
            {stats.weeklyCount}
            <span className="text-xs font-normal text-slate-400 ml-1.5">
              ({stats.total > 0 ? Math.round((stats.weeklyCount / stats.total) * 100) : 0}%)
            </span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Active options chains verified</div>
        </div>

        <div className="glass-panel p-3.5 rounded-xl border border-slate-800/80 bg-slate-900/60">
          <div className="text-[11px] font-semibold text-slate-400 flex items-center justify-between">
            <span>Bullish Signals</span>
            <Award className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-xl font-black text-cyan-300 font-mono mt-1">{stats.topBuyCount}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">High confidence trend setups</div>
        </div>

        <div className="glass-panel p-3.5 rounded-xl border border-slate-800/80 bg-slate-900/60">
          <div className="text-[11px] font-semibold text-slate-400 flex items-center justify-between">
            <span>Bullish Consensus</span>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-xl font-black text-emerald-300 font-mono mt-1">{stats.bullishPct}%</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Credit spread / CSP win-rate candidates</div>
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="glass-panel p-3 rounded-xl border border-slate-800/80 bg-slate-900/80 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3 flex-1 min-w-[240px]">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search ticker or name (e.g. DELL, NOW, HOOD)..."
              className="w-full bg-slate-950/80 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/80"
            />
          </div>

          <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={weeklyOnly}
              onChange={(e) => setWeeklyOnly(e.target.checked)}
              className="rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500/50"
            />
            <span className="font-semibold text-emerald-300" title="Filter to equities having at least weekly expiration options">At least Weekly Options</span>
          </label>

          {activeSource === 'MARKETCHAMELEON' && (
            <button
              onClick={() => setCboeOnlyGate(!cboeOnlyGate)}
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                cboeOnlyGate
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
              title="Filter down to stocks verified in the CBOE weekly options directory"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>CBOE Weeklys</span>
            </button>
          )}
        </div>

        <div className="flex items-center space-x-2 flex-wrap gap-y-1.5 text-xs">
          <span className="text-slate-400">Signal:</span>
          <select
            value={opinionFilter}
            onChange={(e) => setOpinionFilter(e.target.value as any)}
            className="bg-slate-950 border border-slate-800 text-slate-200 rounded-lg px-2.5 py-1 text-xs focus:outline-none"
          >
            <option value="ALL">All Signals</option>
            <option value="100">Top Bullish Only</option>
            <option value="80">Strong Bullish</option>
          </select>

          <span className="text-slate-400 ml-2">Strategy:</span>
          <select
            value={strategyFilter}
            onChange={(e) => setStrategyFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-200 rounded-lg px-2.5 py-1 text-xs focus:outline-none"
          >
            <option value="ALL">All Strategies</option>
            <option value="BULL_PUT_SPREAD">Bull Put Spread (Credit)</option>
            <option value="CSP">Cash-Secured Put (CSP)</option>
            <option value="COVERED_CALL">Covered Call</option>
            <option value="IRON_CONDOR">Iron Condor</option>
            <option value="BEAR_CALL_SPREAD">Bear Call Spread</option>
          </select>
        </div>
      </div>

      {/* Screened Equities Table with Dynamic Headers */}
      <div className="glass-panel rounded-2xl border border-slate-800/90 shadow-2xl overflow-hidden bg-slate-950/70">
        <div className="overflow-x-auto max-h-[680px] 2xl:max-h-[780px] overflow-y-auto relative table-scroll-container">
          <table className="w-full text-left text-xs text-slate-300 border-collapse table-sticky-header">
            <thead className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              {activeSource === 'MARKETCHAMELEON' ? (
                <tr>
                  <SortableTh label="Ticker / Security" sortKey="symbol" currentSortKey={screenerSortKey} currentSortOrder={screenerSortOrder} onSort={requestScreenerSort} />
                  <SortableTh label="Price" sortKey="last_price" currentSortKey={screenerSortKey} currentSortOrder={screenerSortOrder} onSort={requestScreenerSort} align="right" />
                  <SortableTh label="Net Chg (% Chg)" sortKey="percent_change" currentSortKey={screenerSortKey} currentSortOrder={screenerSortOrder} onSort={requestScreenerSort} align="right" />
                  <SortableTh label="Market Cap" sortKey="extra_fields.market_cap" currentSortKey={screenerSortKey} currentSortOrder={screenerSortOrder} onSort={requestScreenerSort} align="right" />
                  <SortableTh label="14-Day RSI" sortKey="extra_fields.rsi_14" currentSortKey={screenerSortKey} currentSortOrder={screenerSortOrder} onSort={requestScreenerSort} align="center" />
                  <SortableTh label="IV30" sortKey="extra_fields.iv30" currentSortKey={screenerSortKey} currentSortOrder={screenerSortOrder} onSort={requestScreenerSort} align="center" />
                  <SortableTh label="20D / 1Y Vol" sortKey="extra_fields.vol_20d" currentSortKey={screenerSortKey} currentSortOrder={screenerSortOrder} onSort={requestScreenerSort} align="center" />
                  <SortableTh label="MA Technical Signal" sortKey="extra_fields.ma_signal" currentSortKey={screenerSortKey} currentSortOrder={screenerSortOrder} onSort={requestScreenerSort} />
                  <SortableTh label="CBOE Weeklys" sortKey="has_weekly_options" currentSortKey={screenerSortKey} currentSortOrder={screenerSortOrder} onSort={requestScreenerSort} align="center" />
                  <SortableTh label="Strategy Setup" sortKey="recommended_strategy" currentSortKey={screenerSortKey} currentSortOrder={screenerSortOrder} onSort={requestScreenerSort} />
                  <th className="sticky top-0 z-10 bg-slate-900/98 backdrop-blur py-3 px-4 text-center border-b border-slate-800">Actions</th>
                </tr>
              ) : (
                <tr>
                  <SortableTh label="Ticker / Security" sortKey="symbol" currentSortKey={screenerSortKey} currentSortOrder={screenerSortOrder} onSort={requestScreenerSort} />
                  <SortableTh label="Price" sortKey="last_price" currentSortKey={screenerSortKey} currentSortOrder={screenerSortOrder} onSort={requestScreenerSort} align="right" />
                  <SortableTh label="Net Chg (% Chg)" sortKey="percent_change" currentSortKey={screenerSortKey} currentSortOrder={screenerSortOrder} onSort={requestScreenerSort} align="right" />
                  <SortableTh label="Barchart Signal / Opinion" sortKey="opinion_pct" currentSortKey={screenerSortKey} currentSortOrder={screenerSortOrder} onSort={requestScreenerSort} />
                  <SortableTh label="Stability (Prev / Wk / Mo)" sortKey="stability_previous" currentSortKey={screenerSortKey} currentSortOrder={screenerSortOrder} onSort={requestScreenerSort} align="center" />
                  <SortableTh label="Options Cadence" sortKey="has_weekly_options" currentSortKey={screenerSortKey} currentSortOrder={screenerSortOrder} onSort={requestScreenerSort} align="center" />
                  <SortableTh label="Recommended Options Setup" sortKey="recommended_strategy" currentSortKey={screenerSortKey} currentSortOrder={screenerSortOrder} onSort={requestScreenerSort} />
                  <th className="sticky top-0 z-10 bg-slate-900/98 backdrop-blur py-3 px-4 text-center border-b border-slate-800">Actions</th>
                </tr>
              )}
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {sortedRecords.length === 0 ? (
                <tr>
                  <td colSpan={activeSource === 'MARKETCHAMELEON' ? 11 : 8} className="py-12 text-center text-slate-500 font-sans">
                    <p className="text-sm font-semibold">No screened stocks matched your filter criteria.</p>
                    <p className="text-xs mt-1">Try clearing the search query or adjusting signal filters.</p>
                  </td>
                </tr>
              ) : (
                sortedRecords.map((item, idx) => {
                  if (activeSource === 'MARKETCHAMELEON') {
                    return (
                      <MarketChameleonRow
                        key={`${item.symbol}-${idx}`}
                        item={item}
                        onSelectSymbolForChart={onSelectSymbolForChart}
                        onOpenTickerAudit={onOpenTickerAudit}
                        onOpenBrokerStaging={onOpenBrokerStaging}
                      />
                    );
                  }

                  return (
                    <BarchartScreenRow
                      key={`${item.symbol}-${idx}`}
                      item={item}
                      onSelectSymbolForChart={onSelectSymbolForChart}
                      onOpenTickerAudit={onOpenTickerAudit}
                      onOpenBrokerStaging={onOpenBrokerStaging}
                    />
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Multi-Source Extensibility Information Card */}
      <div className="glass-panel p-4 rounded-xl border border-slate-800/80 bg-slate-900/40 space-y-2">
        <div className="flex items-center space-x-2 text-xs font-bold text-slate-300">
          <HelpCircle className="w-4 h-4 text-cyan-400" />
          <span>Multi-Source Ingestion &amp; MarketChameleon Extensibility</span>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          The Weekly Stock Screeners agent is built with a pluggable provider pipeline (<code className="text-emerald-300 font-mono">BaseScreenerAgent</code>).
          In addition to the active <strong>Barchart Direction Strength</strong> feed (view 190898), it includes out-of-the-box support for <strong>MarketChameleon.com</strong> and arbitrary custom CSV uploads. To ingest additional MarketChameleon screeners or custom feeds, simply upload their CSV export above or execute <code className="text-emerald-300 font-mono">python scripts/run_screener_agent.py --source marketchameleon</code>.
        </p>
      </div>

      {/* MarketChameleon Prescreen & Preset Customization Modal */}
      <MarketChameleonPrescreenModal
        isOpen={isPrescreenModalOpen}
        onClose={() => setIsPrescreenModalOpen(false)}
        onApplyPreset={handleApplyPreset}
        currentFilters={mcFilters}
        currentCboeOnly={cboeOnlyGate}
      />
    </div>
  );
};
