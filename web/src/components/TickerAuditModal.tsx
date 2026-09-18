import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  ShieldAlert,
  Award,
  ExternalLink,
  Printer,
  FileSpreadsheet,
  FileText,
  HelpCircle,
  Search,
  RefreshCw,
  Zap,
} from './icons';
import { TickerMeta, OptionOpportunity } from '../types/options';
import { getSecurityIntelligence } from '../utils/securityIntelligence';
import { PredictionMarketCards } from './PredictionMarketCards';
import { SocialSentimentGauge } from './SocialSentimentGauge';
import { calculateBarchartOpinion } from '../utils/barchartEngine';
import { exportToExcel } from '../utils/exportImport';
import { getSecEdgarUrl } from '../utils/secEdgarRegistry';
import { TickerOptionsTechTab } from './modals/tickerAudit/TickerOptionsTechTab';
import { TickerNewsAnalystTab } from './modals/tickerAudit/TickerNewsAnalystTab';
import { fetchTickerChartData } from '../utils/liveMarketFetcher';
import { calculateRSI, calculateSMA, calculateBollingerBands } from '../utils/technicalIndicators';
import { classifySectorAndBaseVol } from '../utils/screenerHydrator';
import { calculateBlackScholesGreeks } from '../utils/financeMath';

type TickerDetailTab = 'OPTIONS_TECH' | 'NEWS_ANALYST' | 'PREDICTION_MARKETS' | 'SOCIAL_SENTIMENT';

interface TickerAuditModalProps {
  ticker: TickerMeta | null;
  opportunities: OptionOpportunity[];
  availableTickers?: TickerMeta[];
  onClose: () => void;
  onOpenSimulator?: (ticker: string) => void;
}

/**
 * Generates synthetic CSP & CC Option Opportunities for any newly fetched equity
 * utilizing analytical Black-Scholes Greeks, 2-SD Bollinger targets, and 7 DTE cycles.
 */
function generateSyntheticOpportunities(
  sym: string,
  spot: number,
  ivCurrent: number,
  lowerBb: number,
  upperBb: number
): OptionOpportunity[] {
  const dte = 7;
  const putStrike = Math.max(1, Math.floor(lowerBb));
  const callStrike = Math.max(putStrike + 1, Math.ceil(upperBb));

  const putGreeks = calculateBlackScholesGreeks(spot, putStrike, dte, ivCurrent);
  const callGreeks = calculateBlackScholesGreeks(spot, callStrike, dte, ivCurrent);

  const putPrice = Math.max(0.15, Math.round(putGreeks.putPrice * 100) / 100);
  const callPrice = Math.max(0.15, Math.round(callGreeks.callPrice * 100) / 100);

  const nextFriday = new Date();
  nextFriday.setDate(nextFriday.getDate() + ((5 + 7 - nextFriday.getDay()) % 7 || 7));
  const expStr = nextFriday.toISOString().split('T')[0];

  const csp: OptionOpportunity = {
    id: `${sym}-CSP-${putStrike}`,
    symbol: sym,
    name: `${sym} Equity`,
    category: 'Tier 1 Equities',
    sector: 'Equities',
    strategy: 'CSP',
    strategy_name: 'Cash-Secured Put',
    strike: putStrike,
    expiration: expStr,
    dte: dte,
    current_price: spot,
    type: 'put',
    bid: Math.max(0.05, Math.round((putPrice - 0.05) * 100) / 100),
    ask: Math.round((putPrice + 0.05) * 100) / 100,
    mid: putPrice,
    collateral_required: putStrike * 100,
    premium_total: Math.round(putPrice * 100),
    breakeven: Math.round((putStrike - putPrice) * 100) / 100,
    cushion_pct: spot > 0 ? Math.round((((spot - putStrike) / spot) * 100) * 10) / 10 : 7.2,
    roc_pct: putStrike > 0 ? Math.round(((putPrice / putStrike) * 100) * 10) / 10 : 1.5,
    annualized_roc: putStrike > 0 ? Math.round(((putPrice / putStrike) * (365 / dte) * 100) * 10) / 10 : 18.5,
    delta: putGreeks.putDelta,
    abs_delta: Math.abs(putGreeks.putDelta),
    theta: putGreeks.putTheta,
    pop_pct: Math.round((1.0 - Math.abs(putGreeks.putDelta)) * 1000) / 10,
    iv: ivCurrent > 1 ? ivCurrent / 100 : ivCurrent,
    iv_rank: 45,
    rsi: 50,
    safety_tier: 'Low Risk',
    tier_color: 'emerald',
    tags: ['Synthetic Opportunity', 'Delta ~ 0.18', 'Bollinger Lower'],
    rating: 4.8,
  };

  const cc: OptionOpportunity = {
    id: `${sym}-CC-${callStrike}`,
    symbol: sym,
    name: `${sym} Equity`,
    category: 'Tier 1 Equities',
    sector: 'Equities',
    strategy: 'CC',
    strategy_name: 'Covered Call',
    strike: callStrike,
    expiration: expStr,
    dte: dte,
    current_price: spot,
    type: 'call',
    bid: Math.max(0.05, Math.round((callPrice - 0.05) * 100) / 100),
    ask: Math.round((callPrice + 0.05) * 100) / 100,
    mid: callPrice,
    collateral_required: spot * 100,
    premium_total: Math.round(callPrice * 100),
    breakeven: Math.round((spot - callPrice) * 100) / 100,
    cushion_pct: spot > 0 ? Math.round((((callStrike - spot) / spot) * 100) * 10) / 10 : 6.8,
    roc_pct: spot > 0 ? Math.round(((callPrice / spot) * 100) * 10) / 10 : 1.4,
    annualized_roc: spot > 0 ? Math.round(((callPrice / spot) * (365 / dte) * 100) * 10) / 10 : 16.2,
    delta: callGreeks.callDelta,
    abs_delta: Math.abs(callGreeks.callDelta),
    theta: callGreeks.callTheta,
    pop_pct: Math.round((1.0 - Math.abs(callGreeks.callDelta)) * 1000) / 10,
    iv: ivCurrent > 1 ? ivCurrent / 100 : ivCurrent,
    iv_rank: 45,
    rsi: 50,
    safety_tier: 'Low Risk',
    tier_color: 'cyan',
    tags: ['Synthetic Opportunity', 'Delta ~ 0.22', 'Bollinger Upper'],
    rating: 4.6,
  };

  return [csp, cc];
}

export const TickerAuditModal: React.FC<TickerAuditModalProps> = ({
  ticker,
  opportunities,
  availableTickers,
  onClose,
  onOpenSimulator,
}) => {
  const [activeTicker, setActiveTicker] = useState<TickerMeta | null>(ticker);
  const [activeOpportunities, setActiveOpportunities] = useState<OptionOpportunity[]>(opportunities || []);
  const [inputSymbol, setInputSymbol] = useState<string>(ticker?.symbol || '');
  const [isFetching, setIsFetching] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TickerDetailTab>('OPTIONS_TECH');

  useEffect(() => {
    if (ticker) {
      setActiveTicker(ticker);
      setInputSymbol(ticker.symbol);
      const matchedOpps = (opportunities || []).filter((o) => o?.symbol.toUpperCase() === ticker.symbol.toUpperCase());
      if (matchedOpps.length > 0) {
        setActiveOpportunities(opportunities);
      } else {
        const spot = ticker.spot_price || 100;
        const iv = ticker.iv_current || 25;
        const lower = ticker.lower_bb || spot * 0.93;
        const upper = ticker.upper_bb || spot * 1.07;
        setActiveOpportunities([...opportunities, ...generateSyntheticOpportunities(ticker.symbol, spot, iv, lower, upper)]);
      }
    }
  }, [ticker, opportunities]);

  const intel = useMemo(
    () => getSecurityIntelligence(activeTicker?.symbol || 'ASSET', activeTicker || undefined),
    [activeTicker]
  );

  const barchartOpinion = useMemo(() => {
    if (!activeTicker) return null;
    if (activeTicker.barchart_opinion) return activeTicker.barchart_opinion;
    const spot = activeTicker.spot_price || 100;
    const sma = activeTicker.sma_20 || spot;
    return calculateBarchartOpinion(activeTicker.symbol, [sma * 0.96, sma * 0.98, sma, spot], spot);
  }, [activeTicker]);

  if (!activeTicker) return null;

  const liquidityTier = activeTicker.liquidity_tier || 'Tier 2/3 (Moderate)';
  const isTier1 = liquidityTier.includes('Tier 1');
  const isTier4 = liquidityTier.includes('Tier 4');

  const spotPrice =
    typeof activeTicker.spot_price === 'number' && !isNaN(activeTicker.spot_price) && activeTicker.spot_price > 0
      ? activeTicker.spot_price
      : 100.0;
  const lowerBb =
    typeof activeTicker.lower_bb === 'number' && !isNaN(activeTicker.lower_bb)
      ? activeTicker.lower_bb
      : spotPrice * 0.93;
  const upperBb =
    typeof activeTicker.upper_bb === 'number' && !isNaN(activeTicker.upper_bb)
      ? activeTicker.upper_bb
      : spotPrice * 1.07;
  const sma20 =
    typeof activeTicker.sma_20 === 'number' && !isNaN(activeTicker.sma_20)
      ? activeTicker.sma_20
      : spotPrice;
  const rsi14 =
    typeof activeTicker.rsi_14 === 'number' && !isNaN(activeTicker.rsi_14)
      ? activeTicker.rsi_14
      : 50.0;
  const rawIv =
    typeof activeTicker.iv_current === 'number' && !isNaN(activeTicker.iv_current)
      ? activeTicker.iv_current
      : 25.0;
  const ivCurrent = rawIv <= 1.5 ? rawIv * 100 : rawIv;
  const hv30 =
    typeof activeTicker.hv_30 === 'number' && !isNaN(activeTicker.hv_30)
      ? activeTicker.hv_30
      : 25.0;
  const ivRank =
    typeof activeTicker.iv_rank === 'number' && !isNaN(activeTicker.iv_rank)
      ? activeTicker.iv_rank
      : 35;
  const avgVolume30 =
    typeof activeTicker.avg_volume_30 === 'number' && !isNaN(activeTicker.avg_volume_30)
      ? activeTicker.avg_volume_30
      : 1000000;

  // Put Cushion % to Lower BB
  const putCushionPct = spotPrice > 0 ? (((spotPrice - lowerBb) / spotPrice) * 100).toFixed(1) : '7.0';
  const callUpsidePct = spotPrice > 0 ? (((upperBb - spotPrice) / spotPrice) * 100).toFixed(1) : '7.0';

  // Associated option opportunities for this active ticker
  const tickerOpps = (activeOpportunities || []).filter(
    (o) => o?.symbol.toUpperCase() === activeTicker?.symbol.toUpperCase()
  );
  const bestCSP = tickerOpps.find((o) => o.strategy === 'CSP') || null;
  const bestCC = tickerOpps.find((o) => o.strategy === 'CC') || null;

  // Merge context data from activeTicker or fallback
  const analystTargets = activeTicker.analyst_intelligence || intel.analystTargets;
  const corporateActions = activeTicker.corporate_actions || intel.corporateActions;
  const predictionMarkets = activeTicker.prediction_markets || intel.predictionMarkets || [];
  const socialSentiment = activeTicker.social_sentiment || intel.socialSentiment;

  // Assignment collateral for 1 put contract at Lower BB
  const putStrikeTarget = bestCSP ? bestCSP.strike : Math.max(1, Math.floor(lowerBb));
  const putCollateral = putStrikeTarget * 100;
  const estimatedWeeklyPutPremium = bestCSP
    ? bestCSP.premium_total
    : Math.round(putStrikeTarget * (ivCurrent / 100) * 0.12 * 100);

  /**
   * Fetches real-time market data for any target ticker symbol, calculates Wilder RSI,
   * 20 SMA, 2-SD Bollinger Bands, and synthetic options opportunities across all tabs.
   */
  const handleFetchSymbol = async (targetSymbol: string) => {
    const sym = targetSymbol.toUpperCase().trim();
    if (!sym) return;

    setIsFetching(true);
    setFetchError(null);

    try {
      // 1. Check if present in universe
      const matched = availableTickers?.find((t) => t.symbol.toUpperCase() === sym);

      // 2. Query real-time chart data & quotes
      const chartData = await fetchTickerChartData(sym);

      if (!chartData && !matched) {
        setFetchError(`Could not find real-time market quote for "${sym}". Please verify ticker symbol.`);
        setIsFetching(false);
        return;
      }

      const spot = chartData?.spotPrice || matched?.spot_price || 100.0;
      const closes = chartData?.closes || [];
      const profile = classifySectorAndBaseVol(sym, matched?.name || '');

      let newRsi = matched?.rsi_14 || 50.0;
      if (closes.length >= 15) {
        newRsi = calculateRSI(closes, 14);
      }

      let newSma = matched?.sma_20 || spot;
      if (closes.length >= 20) {
        newSma = calculateSMA(closes, 20);
      }

      let newLowerBb = matched?.lower_bb || spot * 0.93;
      let newUpperBb = matched?.upper_bb || spot * 1.07;
      if (closes.length >= 20) {
        const bb = calculateBollingerBands(closes, 20, 2);
        newLowerBb = bb.lower;
        newUpperBb = bb.upper;
      }

      // Calculate HV30 from closes if available
      let newHv30 = profile.baseIv * 0.9;
      if (closes.length >= 20) {
        const recent = closes.slice(-30);
        const logReturns: number[] = [];
        for (let i = 1; i < recent.length; i++) {
          if (recent[i - 1] > 0 && recent[i] > 0) {
            logReturns.push(Math.log(recent[i] / recent[i - 1]));
          }
        }
        if (logReturns.length >= 10) {
          const mean = logReturns.reduce((a, b) => a + b, 0) / logReturns.length;
          const variance = logReturns.reduce((acc, r) => acc + Math.pow(r - mean, 2), 0) / (logReturns.length - 1);
          newHv30 = Math.sqrt(variance) * Math.sqrt(252);
        }
      }

      const rawIvVal = matched?.iv_current || Math.round(newHv30 * 1.15 * 100);
      const newIvCurrent = rawIvVal <= 1.5 ? rawIvVal * 100 : rawIvVal;
      const newIvRank = matched?.iv_rank || profile.baseIvRank;
      const newAvgVolume = chartData?.avgVolume || matched?.avg_volume_30 || 1500000;

      const updatedTicker: TickerMeta = {
        symbol: sym,
        name: matched?.name || `${sym} Equity`,
        sector: matched?.sector || profile.sector,
        spot_price: spot,
        lower_bb: newLowerBb,
        upper_bb: newUpperBb,
        bb_width_pct: spot > 0 ? Math.round((((newUpperBb - newLowerBb) / spot) * 100) * 10) / 10 : 14.0,
        sma_20: newSma,
        rsi_14: newRsi,
        rsi_flag: newRsi >= 70 ? 'OVERBOUGHT' : newRsi <= 30 ? 'OVERSOLD' : 'NEUTRAL',
        iv_current: newIvCurrent,
        hv_30: Math.round(newHv30 * 1000) / 10,
        iv_rank: newIvRank,
        avg_volume_30: newAvgVolume,
        liquidity_tier: matched?.liquidity_tier || (newAvgVolume > 5000000 ? 'Tier 1 (High)' : 'Tier 2/3 (Moderate)'),
        earnings_within_7d: matched?.earnings_within_7d || false,
        next_earnings_date: matched?.next_earnings_date || 'N/A',
      };

      // Match or generate synthetic opportunities
      const existingOpps = (opportunities || []).filter((o) => o?.symbol.toUpperCase() === sym);
      const activeOpps =
        existingOpps.length > 0
          ? existingOpps
          : generateSyntheticOpportunities(sym, spot, newIvCurrent, newLowerBb, newUpperBb);

      setActiveTicker(updatedTicker);
      setActiveOpportunities((prev) => [...prev.filter((o) => o.symbol.toUpperCase() !== sym), ...activeOpps]);
      setInputSymbol(sym);
    } catch (err: any) {
      setFetchError(`Error fetching quote for "${sym}": ${err?.message || 'Network error'}`);
    } finally {
      setIsFetching(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (!activeTicker) return;
    const headers = [
      'Symbol',
      'Name',
      'Sector',
      'Spot Price',
      '20-Day SMA',
      'Lower BB (2-SD)',
      'Upper BB (2-SD)',
      '14-Day RSI',
      'IV Current %',
      '30-Day HV %',
      'IV Rank',
      'Avg 30-Day Volume',
      'Liquidity Tier',
      'Earnings ≤7d',
      'Barchart Signal',
      'AI Score',
      'Analyst Target Mean',
      'Analyst Consensus',
      'Best CSP Strike',
      'Best CSP DTE',
      'Best CSP ROC %',
      'Best CSP Cushion %',
      'Best CC Strike',
      'Best CC ROC %',
    ];

    const values = [
      `"${activeTicker.symbol}"`,
      `"${(activeTicker.name || activeTicker.symbol).replace(/"/g, '""')}"`,
      `"${activeTicker.sector || 'Equities'}"`,
      spotPrice,
      sma20,
      lowerBb,
      upperBb,
      rsi14,
      ivCurrent,
      hv30,
      ivRank,
      avgVolume30,
      `"${liquidityTier}"`,
      activeTicker.earnings_within_7d ? 'YES' : 'NO',
      `"${barchartOpinion?.opinion_label || 'Neutral'}"`,
      intel.compositeScore,
      analystTargets?.mean ?? 'N/A',
      `"${analystTargets?.recommendation ?? 'N/A'}"`,
      bestCSP?.strike ?? 'N/A',
      bestCSP?.dte ?? 'N/A',
      bestCSP?.annualized_roc ?? 'N/A',
      bestCSP?.cushion_pct ?? 'N/A',
      bestCC?.strike ?? 'N/A',
      bestCC?.annualized_roc ?? 'N/A',
    ];

    const csvContent = [headers.join(','), values.join(',')].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${activeTicker.symbol}_options_audit_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportExcel = () => {
    if (!activeTicker) return;
    exportToExcel(
      {
        tickers: [activeTicker],
        opportunities: tickerOpps,
      },
      `${activeTicker.symbol}_full_audit_${new Date().toISOString().slice(0, 10)}.xls`
    );
  };

  // Identify if security is an Equity vs. ETF / Closed-End / Income Fund
  const isFundOrETF =
    activeTicker.sector?.toLowerCase().includes('etf') ||
    activeTicker.sector?.toLowerCase().includes('fund') ||
    activeTicker.sector?.toLowerCase().includes('trust') ||
    [
      'SPY', 'QQQ', 'IWM', 'DIA', 'TLT', 'HYG', 'LQD', 'ARKK', 'JEPI', 'JEPQ',
      'SVOL', 'XLF', 'XLK', 'XLE', 'XBI', 'SMH', 'GDX', 'FXI', 'KWEB', 'GLD',
      'SLV', 'USO', 'UNG', 'EEM', 'EFA', 'VXX', 'UVXY', 'TQQQ', 'SQQQ', 'SOXL',
      'SOXS', 'BITO', 'IBIT', 'ETHE', 'VNQ', 'SCHD', 'VOO', 'VTI', 'BND',
    ].includes(activeTicker.symbol.toUpperCase());

  const primaryFilingLabel = isFundOrETF ? 'N-CSR / N-CSRS' : '10-K / 10-Q';
  const secEdgarUrl = getSecEdgarUrl(activeTicker.symbol);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="glass-panel w-full max-w-4xl rounded-2xl border border-slate-700/80 shadow-2xl overflow-hidden text-slate-200 flex flex-col h-[90vh] max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-900/95 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3.5">
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-white shadow-md shrink-0 ${
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
              <div className="flex items-center space-x-2.5 flex-wrap gap-y-1">
                <span className="text-2xl font-black font-mono text-white tracking-tight">
                  {activeTicker.symbol}
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-md bg-slate-800 text-slate-300 font-medium">
                  ${spotPrice.toFixed(2)}
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
                  {liquidityTier}
                </span>
                {activeTicker.earnings_within_7d && (
                  <span className="text-xs px-2 py-0.5 rounded-md font-bold bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse">
                    Earnings ≤7d
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {activeTicker.name || activeTicker.symbol} • {activeTicker.sector || 'Equities'} • Comprehensive AI Intelligence &amp; Options Audit
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            {/* Action Buttons: Simulator, SEC EDGAR, Print, CSV, Excel */}
            <div className="hidden sm:flex items-center gap-1.5 mr-1">
              {onOpenSimulator && (
                <button
                  type="button"
                  onClick={() => onOpenSimulator(activeTicker.symbol)}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer border border-blue-400/50"
                  title={`Open Trade Simulator preloaded with ${activeTicker.symbol} to calculate put and call strikes`}
                >
                  <Zap className="w-3.5 h-3.5 text-amber-300" />
                  <span>Simulator</span>
                </button>
              )}
              <a
                href={secEdgarUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-purple-950/50 hover:bg-purple-900/70 text-purple-300 hover:text-white border border-purple-500/40 transition-colors flex items-center gap-1 cursor-pointer"
                title={`Open SEC EDGAR Filings (${primaryFilingLabel}) for ${activeTicker.symbol}`}
              >
                <FileText className="w-3.5 h-3.5 text-purple-400" />
                <span>SEC {isFundOrETF ? 'N-CSR' : '10-Q/K'}</span>
                <ExternalLink className="w-3 h-3 text-purple-400/80" />
              </a>
              <button
                type="button"
                onClick={handlePrint}
                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
                title="Print Ticker Intelligence Report"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print</span>
              </button>
              <button
                type="button"
                onClick={handleExportCSV}
                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
                title="Export Selected Ticker Data to CSV"
              >
                <FileText className="w-3.5 h-3.5 text-blue-400" />
                <span>CSV</span>
              </button>
              <button
                type="button"
                onClick={handleExportExcel}
                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
                title="Export Formatted Multi-Sheet Excel Workbook (.xlsx)"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                <span>Excel</span>
              </button>
            </div>

            {/* AI Composite Score Ribbon */}
            <div className="hidden md:flex items-center space-x-3 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800">
              <div className="text-right">
                <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">AI Score</div>
                <div className="text-xs font-bold text-slate-200">{intel.sentimentLabel}</div>
              </div>
              <div
                className={`px-2 py-0.5 rounded-lg font-black font-mono text-sm border flex items-center gap-1 ${
                  intel.compositeScore >= 85
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : intel.compositeScore >= 75
                    ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                }`}
              >
                <Award className="w-3.5 h-3.5" />
                <span>{intel.compositeScore}/100</span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Interactive Symbol Search & Live Market Quote Bar */}
        <div className="bg-slate-900/90 border-b border-slate-800 px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-2.5 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleFetchSymbol(inputSymbol);
            }}
            className="flex items-center gap-2 flex-1 max-w-md"
          >
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={inputSymbol}
                onChange={(e) => setInputSymbol(e.target.value.toUpperCase())}
                placeholder="Enter symbol (e.g. NVDA, TSLA, AAPL, AMD, SPY)..."
                className="w-full bg-slate-950 border border-slate-700/80 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono font-bold tracking-wider"
              />
            </div>
            <button
              type="submit"
              disabled={isFetching || !inputSymbol.trim()}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
              <span>{isFetching ? 'Fetching...' : 'Fetch Price'}</span>
            </button>
          </form>

          {/* Quick Ticker Chips */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] text-slate-400 uppercase font-mono mr-1">Quick Select:</span>
            {['NVDA', 'TSLA', 'AAPL', 'MSFT', 'PLTR', 'AMD', 'SPY', 'QQQ'].map((sym) => (
              <button
                key={sym}
                type="button"
                onClick={() => handleFetchSymbol(sym)}
                disabled={isFetching}
                className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold transition-all cursor-pointer ${
                  activeTicker.symbol === sym
                    ? 'bg-blue-600 text-white border border-blue-400 shadow-sm'
                    : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/60'
                }`}
              >
                {sym}
              </button>
            ))}
          </div>
        </div>

        {/* Error Notification Banner if symbol fetch fails */}
        {fetchError && (
          <div className="bg-rose-950/80 border-b border-rose-800/80 px-4 sm:px-6 py-2 flex items-center justify-between text-xs text-rose-300">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{fetchError}</span>
            </div>
            <button
              type="button"
              onClick={() => setFetchError(null)}
              className="text-rose-400 hover:text-white text-xs underline cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Tab Navigation Selector - Locked Full-Height Bar */}
        <div className="flex items-center min-h-[64px] border-b border-slate-800 bg-slate-950 px-4 sm:px-6 overflow-x-auto gap-3 py-3 shrink-0 z-10 shadow-inner">
          <button
            type="button"
            onClick={() => setActiveTab('OPTIONS_TECH')}
            className={`h-[44px] shrink-0 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap border cursor-pointer ${
              activeTab === 'OPTIONS_TECH'
                ? 'bg-emerald-600 text-white border-emerald-400 shadow-lg shadow-emerald-600/30 ring-1 ring-emerald-400/50'
                : 'bg-slate-900/90 text-slate-300 hover:text-white hover:bg-slate-800 border-slate-700/80 shadow-sm'
            }`}
          >
            <span>🎯 Options &amp; Technicals</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('NEWS_ANALYST')}
            className={`h-[44px] shrink-0 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap border cursor-pointer ${
              activeTab === 'NEWS_ANALYST'
                ? 'bg-blue-600 text-white border-blue-400 shadow-lg shadow-blue-600/30 ring-1 ring-blue-400/50'
                : 'bg-slate-900/90 text-slate-300 hover:text-white hover:bg-slate-800 border-slate-700/80 shadow-sm'
            }`}
          >
            <span>📰 News, Filings &amp; Consensus</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('PREDICTION_MARKETS')}
            className={`h-[44px] shrink-0 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap border cursor-pointer ${
              activeTab === 'PREDICTION_MARKETS'
                ? 'bg-cyan-600 text-white border-cyan-400 shadow-lg shadow-cyan-600/30 ring-1 ring-cyan-400/50'
                : 'bg-slate-900/90 text-slate-300 hover:text-white hover:bg-slate-800 border-slate-700/80 shadow-sm'
            }`}
          >
            <span>🎲 Prediction Markets</span>
            {predictionMarkets.length > 0 && (
              <span
                className={`text-[11px] font-mono px-2 py-0.5 rounded-full font-bold ${
                  activeTab === 'PREDICTION_MARKETS'
                    ? 'bg-white/20 text-white'
                    : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                }`}
              >
                {predictionMarkets.length} • {intel.pmciScore ?? 55}% PMCI
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('SOCIAL_SENTIMENT')}
            className={`h-[44px] shrink-0 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap border cursor-pointer ${
              activeTab === 'SOCIAL_SENTIMENT'
                ? 'bg-amber-600 text-white border-amber-400 shadow-lg shadow-amber-600/30 ring-1 ring-amber-400/50'
                : 'bg-slate-900/90 text-slate-300 hover:text-white hover:bg-slate-800 border-slate-700/80 shadow-sm'
            }`}
          >
            <span>💬 Social &amp; Forum Sentiment</span>
            {intel.ssvsScore !== undefined && (
              <span
                className={`text-[11px] font-mono px-2 py-0.5 rounded-full font-bold ${
                  activeTab === 'SOCIAL_SENTIMENT'
                    ? 'bg-white/20 text-white'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}
              >
                {intel.ssvsScore}% SSVS
              </span>
            )}
          </button>
        </div>

        {/* Modal Scrollable Body - Independent Scroll Region */}
        <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-6 text-xs">
          {/* TAB 1: OPTIONS STRATEGY & TECHNICALS */}
          {activeTab === 'OPTIONS_TECH' && (
            <TickerOptionsTechTab
              ticker={activeTicker}
              opportunities={activeOpportunities}
              intel={intel}
              barchartOpinion={barchartOpinion}
              spotPrice={spotPrice}
              lowerBb={lowerBb}
              upperBb={upperBb}
              sma20={sma20}
              rsi14={rsi14}
              ivCurrent={ivCurrent}
              hv30={hv30}
              ivRank={ivRank}
              avgVolume30={avgVolume30}
              putCushionPct={putCushionPct}
              callUpsidePct={callUpsidePct}
              bestCSP={bestCSP}
              bestCC={bestCC}
              putStrikeTarget={putStrikeTarget}
              putCollateral={putCollateral}
              estimatedWeeklyPutPremium={estimatedWeeklyPutPremium}
              analystTargets={analystTargets}
              isTier4={isTier4}
              onViewNewsAnalyst={() => setActiveTab('NEWS_ANALYST')}
              onOpenSimulator={onOpenSimulator}
            />
          )}

          {/* TAB 2: NEWS & ANALYST CONSENSUS */}
          {activeTab === 'NEWS_ANALYST' && (
            <TickerNewsAnalystTab
              ticker={activeTicker}
              intel={intel}
              spotPrice={spotPrice}
              analystTargets={analystTargets}
              corporateActions={corporateActions}
              isFundOrETF={isFundOrETF}
              primaryFilingLabel={primaryFilingLabel}
              secEdgarUrl={secEdgarUrl}
            />
          )}

          {/* TAB 3: PREDICTION MARKETS */}
          {activeTab === 'PREDICTION_MARKETS' && (
            <div className="animate-in fade-in duration-150">
              <PredictionMarketCards
                events={predictionMarkets}
                termStructure={intel.termStructure}
                pmciScore={intel.pmciScore}
                symbol={activeTicker.symbol}
              />
            </div>
          )}

          {/* TAB 4: SOCIAL & FORUM SENTIMENT */}
          {activeTab === 'SOCIAL_SENTIMENT' && (
            <div className="animate-in fade-in duration-150">
              <SocialSentimentGauge
                sentiment={socialSentiment}
                technicalScore={intel.technicalScore}
                fundamentalScore={intel.fundamentalScore}
              />
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-[11px] text-slate-400">
            <HelpCircle className="w-4 h-4 text-slate-500" />
            <span>Black-Scholes Mathematical Modeling • Bollinger Band (2 SD) Strike Envelope</span>
          </div>

          <div className="flex items-center gap-3">
            {onOpenSimulator && (
              <button
                type="button"
                onClick={() => onOpenSimulator(activeTicker.symbol)}
                className="px-4 py-2 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5 text-amber-300" />
                <span>Simulate Strikes ({activeTicker.symbol})</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition-colors cursor-pointer"
            >
              Close Audit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
