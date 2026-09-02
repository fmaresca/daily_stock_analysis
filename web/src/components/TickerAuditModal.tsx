import React, { useState, useMemo } from 'react';
import {
  X,
  ShieldCheck,
  ShieldAlert,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Activity,
  Flame,
  Layers,
  ArrowRight,
  Award,
  Newspaper,
  Building,
  ExternalLink,
  Target,
  BarChart2,
  MessageSquare,
  Printer,
  FileSpreadsheet,
  FileText,
  Download,
} from './icons';
import { TickerMeta, OptionOpportunity } from '../types/options';
import { InteractiveChart } from './InteractiveChart';
import { getSecurityIntelligence, calculateMarketChameleonPattern } from '../utils/securityIntelligence';
import { AnalystPriceTargetBar } from './AnalystPriceTargetBar';
import { PredictionMarketCards } from './PredictionMarketCards';
import { SocialSentimentGauge } from './SocialSentimentGauge';
import { BarchartOpinionCard } from './BarchartOpinionCard';
import { calculateBarchartOpinion } from '../utils/barchartEngine';
import { exportToExcel } from '../utils/exportImport';

type TickerDetailTab = 'OPTIONS_TECH' | 'NEWS_ANALYST' | 'PREDICTION_MARKETS' | 'SOCIAL_SENTIMENT';

interface TickerAuditModalProps {
  ticker: TickerMeta | null;
  opportunities: OptionOpportunity[];
  onClose: () => void;
}

export const TickerAuditModal: React.FC<TickerAuditModalProps> = ({
  ticker,
  opportunities,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<TickerDetailTab>('OPTIONS_TECH');
  const intel = useMemo(() => getSecurityIntelligence(ticker?.symbol || 'ASSET', ticker || undefined), [ticker]);

  const barchartOpinion = useMemo(() => {
    if (!ticker) return null;
    if (ticker.barchart_opinion) return ticker.barchart_opinion;
    const spot = ticker.spot_price || 100;
    const sma = ticker.sma_20 || spot;
    return calculateBarchartOpinion(ticker.symbol, [sma * 0.96, sma * 0.98, sma, spot], spot);
  }, [ticker]);

  if (!ticker) return null;

  const liquidityTier = ticker.liquidity_tier || 'Tier 2/3 (Moderate)';
  const isTier1 = liquidityTier.includes('Tier 1');
  const isTier4 = liquidityTier.includes('Tier 4');

  const spotPrice = typeof ticker.spot_price === 'number' && !isNaN(ticker.spot_price) && ticker.spot_price > 0 ? ticker.spot_price : 100.0;
  const lowerBb = typeof ticker.lower_bb === 'number' && !isNaN(ticker.lower_bb) ? ticker.lower_bb : spotPrice * 0.93;
  const upperBb = typeof ticker.upper_bb === 'number' && !isNaN(ticker.upper_bb) ? ticker.upper_bb : spotPrice * 1.07;
  const sma20 = typeof ticker.sma_20 === 'number' && !isNaN(ticker.sma_20) ? ticker.sma_20 : spotPrice;
  const rsi14 = typeof ticker.rsi_14 === 'number' && !isNaN(ticker.rsi_14) ? ticker.rsi_14 : 50;
  const ivCurrent = typeof ticker.iv_current === 'number' && !isNaN(ticker.iv_current) ? ticker.iv_current : 25.0;
  const hv30 = typeof ticker.hv_30 === 'number' && !isNaN(ticker.hv_30) ? ticker.hv_30 : 25.0;
  const ivRank = typeof ticker.iv_rank === 'number' && !isNaN(ticker.iv_rank) ? ticker.iv_rank : 35;
  const avgVolume30 = typeof ticker.avg_volume_30 === 'number' && !isNaN(ticker.avg_volume_30) ? ticker.avg_volume_30 : 1000000;

  // Put Cushion % to Lower BB
  const putCushionPct = spotPrice > 0 ? (((spotPrice - lowerBb) / spotPrice) * 100).toFixed(1) : '7.0';
  const callUpsidePct = spotPrice > 0 ? (((upperBb - spotPrice) / spotPrice) * 100).toFixed(1) : '7.0';

  // Associated option opportunities for this ticker
  const tickerOpps = (opportunities || []).filter((o) => o?.symbol === ticker?.symbol);
  const bestCSP = tickerOpps.find((o) => o.strategy === 'CSP') || null;
  const bestCC = tickerOpps.find((o) => o.strategy === 'CC') || null;

  // Merge context data from ticker meta or fallback
  const analystTargets = ticker.analyst_intelligence || intel.analystTargets;
  const corporateActions = ticker.corporate_actions || intel.corporateActions;
  const predictionMarkets = ticker.prediction_markets || intel.predictionMarkets || [];
  const socialSentiment = ticker.social_sentiment || intel.socialSentiment;

  // Assignment collateral for 1 put contract at Lower BB
  const putStrikeTarget = bestCSP ? bestCSP.strike : Math.max(1, Math.floor(lowerBb));
  const putCollateral = putStrikeTarget * 100;
  const estimatedWeeklyPutPremium = bestCSP ? bestCSP.premium_total : Math.round(putStrikeTarget * (ivCurrent / 100) * 0.12 * 100);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (!ticker) return;
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
      '30-Day Avg Volume',
      'Liquidity Tier',
      'Earnings Within 7d',
      'Barchart Overall Opinion',
      'AI Composite Score',
      'Analyst Target Mean',
      'Analyst Recommendation',
      'Best CSP Strike',
      'Best CSP DTE',
      'Best CSP Annualized ROC %',
      'Best CSP Cushion %',
      'Best CC Strike',
      'Best CC Annualized ROC %',
    ];

    const values = [
      ticker.symbol,
      `"${ticker.name || ticker.symbol}"`,
      `"${ticker.sector || 'Equities'}"`,
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
      ticker.earnings_within_7d ? 'YES' : 'NO',
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
    link.setAttribute('download', `${ticker.symbol}_options_audit_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportExcel = () => {
    if (!ticker) return;
    const summaryData = [
      { Parameter: 'Ticker Symbol', Value: ticker.symbol },
      { Parameter: 'Company Name', Value: ticker.name || ticker.symbol },
      { Parameter: 'Sector', Value: ticker.sector || 'Equities' },
      { Parameter: 'Spot Price ($)', Value: spotPrice },
      { Parameter: '20-Day SMA ($)', Value: sma20 },
      { Parameter: 'Lower Bollinger Band ($)', Value: lowerBb },
      { Parameter: 'Upper Bollinger Band ($)', Value: upperBb },
      { Parameter: '14-Day Blended RSI', Value: rsi14 },
      { Parameter: 'Current Implied Volatility (IV %)', Value: ivCurrent },
      { Parameter: '30-Day Historical Volatility (HV %)', Value: hv30 },
      { Parameter: 'IV Rank (IVR %)', Value: ivRank },
      { Parameter: '30-Day Average Volume', Value: avgVolume30 },
      { Parameter: 'Liquidity Classification', Value: liquidityTier },
      { Parameter: 'Earnings Within 7 Days', Value: ticker.earnings_within_7d ? 'YES' : 'NO' },
      { Parameter: 'Barchart Technical Opinion', Value: barchartOpinion?.opinion_label || 'Neutral' },
      { Parameter: 'AI Composite Score', Value: `${intel.compositeScore}/100 (${intel.sentimentLabel})` },
      { Parameter: 'Analyst Mean Target ($)', Value: analystTargets?.mean ?? 'N/A' },
      { Parameter: 'Analyst Consensus Rating', Value: analystTargets?.recommendation ?? 'N/A' },
      { Parameter: 'Best CSP Strike ($)', Value: bestCSP?.strike ?? 'N/A' },
      { Parameter: 'Best CSP Expiration', Value: bestCSP?.expiration ?? 'N/A' },
      { Parameter: 'Best CSP Annualized ROC %', Value: bestCSP?.annualized_roc ?? 'N/A' },
      { Parameter: 'Best CC Strike ($)', Value: bestCC?.strike ?? 'N/A' },
      { Parameter: 'Best CC Annualized ROC %', Value: bestCC?.annualized_roc ?? 'N/A' },
    ];

    exportToExcel(
      {
        tickers: [ticker],
        opportunities: tickerOpps,
      },
      `${ticker.symbol}_full_audit_${new Date().toISOString().slice(0, 10)}.xls`
    );
  };

  // Identify if security is an Equity vs. ETF / Closed-End / Income Fund
  const isFundOrETF =
    ticker.sector?.toLowerCase().includes('etf') ||
    ticker.sector?.toLowerCase().includes('fund') ||
    ticker.sector?.toLowerCase().includes('trust') ||
    [
      'SPY', 'QQQ', 'IWM', 'DIA', 'TLT', 'HYG', 'LQD', 'ARKK', 'JEPI', 'JEPQ',
      'SVOL', 'XLF', 'XLK', 'XLE', 'XBI', 'SMH', 'GDX', 'FXI', 'KWEB', 'GLD',
      'SLV', 'USO', 'UNG', 'EEM', 'EFA', 'VXX', 'UVXY', 'TQQQ', 'SQQQ', 'SOXL',
      'SOXS', 'BITO', 'IBIT', 'ETHE', 'VNQ', 'SCHD', 'VOO', 'VTI', 'BND',
    ].includes(ticker.symbol.toUpperCase());

  const primaryFilingLabel = isFundOrETF ? 'N-CSR / N-CSRS' : '10-K / 10-Q';
  const secEdgarUrl = `https://www.sec.gov/edgar/browse/?CIK=${encodeURIComponent(ticker.symbol)}`;
  const secSearchUrl = `https://www.sec.gov/edgar/searchedgar/companysearch?companyName=${encodeURIComponent(ticker.symbol)}`;

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
                  {ticker.symbol}
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
                {ticker.earnings_within_7d && (
                  <span className="text-xs px-2 py-0.5 rounded-md font-bold bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse">
                    Earnings ≤7d
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {ticker.name || ticker.symbol} • {ticker.sector || 'Equities'} • Comprehensive AI Intelligence &amp; Options Audit
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            {/* Action Buttons: Print, CSV, Excel, SEC EDGAR */}
            <div className="hidden sm:flex items-center gap-1.5 mr-1">
              <a
                href={secEdgarUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-purple-950/50 hover:bg-purple-900/70 text-purple-300 hover:text-white border border-purple-500/40 transition-colors flex items-center gap-1 cursor-pointer"
                title={`Open SEC EDGAR Filings (${primaryFilingLabel}) for ${ticker.symbol}`}
              >
                <FileText className="w-3.5 h-3.5 text-purple-400" />
                <span>SEC {isFundOrETF ? 'N-CSR' : '10-Q/K'}</span>
                <ExternalLink className="w-3 h-3 text-purple-400/80" />
              </a>
              <button
                onClick={handlePrint}
                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
                title="Print Ticker Intelligence Report"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print</span>
              </button>
              <button
                onClick={handleExportCSV}
                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
                title="Export Selected Ticker Data to CSV"
              >
                <FileText className="w-3.5 h-3.5 text-blue-400" />
                <span>CSV</span>
              </button>
              <button
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
              <div className={`px-2 py-0.5 rounded-lg font-black font-mono text-sm border flex items-center gap-1 ${
                intel.compositeScore >= 85
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : intel.compositeScore >= 75
                  ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              }`}>
                <Award className="w-3.5 h-3.5" />
                <span>{intel.compositeScore}/100</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation Selector - Locked Full-Height Bar */}
        <div className="flex items-center min-h-[64px] border-b border-slate-800 bg-slate-950 px-4 sm:px-6 overflow-x-auto gap-3 py-3 shrink-0 z-10 shadow-inner">
          <button
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
                {predictionMarkets.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('SOCIAL_SENTIMENT')}
            className={`h-[44px] shrink-0 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap border cursor-pointer ${
              activeTab === 'SOCIAL_SENTIMENT'
                ? 'bg-amber-600 text-white border-amber-400 shadow-lg shadow-amber-600/30 ring-1 ring-amber-400/50'
                : 'bg-slate-900/90 text-slate-300 hover:text-white hover:bg-slate-800 border-slate-700/80 shadow-sm'
            }`}
          >
            <span>💬 Social &amp; Forum Sentiment</span>
          </button>
        </div>

        {/* Modal Scrollable Body - Independent Scroll Region */}
        <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-6 text-xs">
          {/* TAB 1: OPTIONS STRATEGY & TECHNICALS */}
          {activeTab === 'OPTIONS_TECH' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* SECTION 1: Volatility Profile */}
              <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-400" />
                    <span>Part 1: Volatility Profile &amp; Option Income Edge</span>
                  </h3>
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded font-mono font-bold ${
                      ivRank >= 50
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    IV Rank: {ivRank} / 100
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800">
                    <div className="text-[11px] text-slate-400">Current Implied Volatility (IV)</div>
                    <div className="text-base font-bold font-mono text-amber-400 mt-1">
                      {ivCurrent.toFixed(1)}%
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">Market pricing for future 30d swing</p>
                  </div>

                  <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800">
                    <div className="text-[11px] text-slate-400">30-Day Historical Volatility (HV)</div>
                    <div className="text-base font-bold font-mono text-cyan-400 mt-1">
                      {hv30.toFixed(1)}%
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">Realized underlying movement</p>
                  </div>

                  <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800">
                    <div className="text-[11px] text-slate-400">IV / HV Volatility Premium</div>
                    <div
                      className={`text-base font-bold font-mono mt-1 ${
                        ivCurrent > hv30 ? 'text-emerald-400' : 'text-slate-300'
                      }`}
                    >
                      {(ivCurrent - hv30).toFixed(1)}%
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">
                      {ivCurrent > hv30
                        ? '✓ Implied volatility rich vs realized'
                        : 'Normalized option pricing'}
                    </p>
                  </div>

                  <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800">
                    <div className="text-[11px] text-slate-400">Next Earnings Event</div>
                    <div
                      className={`text-base font-bold font-mono mt-1 ${
                        ticker.earnings_within_7d ? 'text-rose-400 animate-pulse' : 'text-white'
                      }`}
                    >
                      {ticker.next_earnings_date || 'N/A'}
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">
                      {ticker.earnings_within_7d
                        ? '🚨 High binary risk. Avoid new short delta.'
                        : '✓ Safe window for short premium'}
                    </p>
                  </div>
                </div>
              </div>

              {/* SECTION 2: Liquidity Tier & Cadence */}
              <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-3">
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <Flame className="w-4 h-4 text-cyan-400" />
                  <span>Part 2: Liquidity Tier &amp; Option Cadence</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800">
                    <div className="text-[11px] text-slate-400">Option Cadence Profile</div>
                    <div className="text-sm font-bold font-mono text-cyan-300 mt-1">
                      {ticker.expiration_cadence || ticker.options_cadence || (ticker.has_weeklys === false ? 'Monthly Only' : 'Weekly Expirations')}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      {ticker.in_cboe_registry
                        ? '✓ Official CBOE Weeklys directory listing.'
                        : ticker.has_weeklys === false
                        ? 'Standard 3rd-Friday monthly expirations only.'
                        : 'Active weekly cycle.'}
                    </p>
                  </div>

                  <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800">
                    <div className="text-[11px] text-slate-400">30-Day Average Volume</div>
                    <div className="text-base font-bold font-mono text-slate-200 mt-1">
                      {avgVolume30.toLocaleString()} shares
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Ensures underlying market-making activity.
                    </p>
                  </div>

                  <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800">
                    <div className="text-[11px] text-slate-400">Execution Rule</div>
                    <div className="text-sm font-bold font-mono text-emerald-400 mt-1">
                      Strict Limit Orders
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      {isTier4
                        ? '🚨 Always enter at mid price. Never use market orders.'
                        : 'Place limit orders at mid for optimal fills.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* SECTION 2.5: Equity Analysts Consensus & Price Target Snapshot */}
              <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
                  <div className="flex items-center space-x-2">
                    <Target className="w-4 h-4 text-emerald-400" />
                    <div>
                      <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                        Equity Research Consensus &amp; Price Targets
                      </h3>
                      <div className="text-[10px] text-slate-400">
                        Wall Street Analyst Coverage ({analystTargets?.numberOfAnalysts || analystTargets?.number_of_analysts || 24} Analysts)
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/40">
                      {analystTargets?.recommendation || intel.analystConsensus || 'Moderate Buy'}
                    </span>
                    <button
                      onClick={() => setActiveTab('NEWS_ANALYST')}
                      className="text-xs text-blue-400 hover:text-blue-300 underline font-medium"
                    >
                      View Breakdown &rarr;
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block uppercase font-mono">Low Target</span>
                    <span className="text-sm font-bold font-mono text-rose-300">${analystTargets?.low?.toFixed(2) || (spotPrice * 0.88).toFixed(2)}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-blue-950/40 border border-blue-800/50">
                    <span className="text-[10px] text-blue-300 block uppercase font-mono">Mean Consensus</span>
                    <span className="text-sm font-bold font-mono text-blue-200">${analystTargets?.mean?.toFixed(2) || (spotPrice * 1.12).toFixed(2)}</span>
                    <span className="text-[10px] font-mono text-emerald-400 block">
                      +{Math.round((((analystTargets?.mean || (spotPrice * 1.12)) - spotPrice) / spotPrice) * 1000) / 10}% Upside
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block uppercase font-mono">High Target</span>
                    <span className="text-sm font-bold font-mono text-emerald-300">${analystTargets?.high?.toFixed(2) || (spotPrice * 1.25).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* SECTION 3: Technical Boundaries */}
              <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-4">
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-400" />
                  <span>Part 3: Technical Boundaries, Bollinger Envelope &amp; Interactive Chart</span>
                </h3>

                {/* Embedded TradingView Lightweight Candlestick Chart */}
                <InteractiveChart ticker={ticker} opportunities={opportunities} height={300} />

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800">
                    <div className="text-[11px] text-slate-400">20-Day SMA</div>
                    <div className="text-lg font-bold font-mono text-white mt-0.5">
                      ${sma20.toFixed(2)}
                    </div>
                    <div className="text-[10px] text-slate-500">Mean regression line</div>
                  </div>

                  <div className="bg-slate-950/70 p-2.5 rounded-lg border border-emerald-500/30">
                    <div className="text-[11px] text-emerald-400 font-semibold">Lower BB (Put Strike Target)</div>
                    <div className="text-lg font-black font-mono text-emerald-400 mt-0.5">
                      ${lowerBb.toFixed(2)}
                    </div>
                    <div className="text-[10px] text-emerald-300">+{putCushionPct}% downside cushion</div>
                  </div>

                  <div className="bg-slate-950/70 p-2.5 rounded-lg border border-cyan-500/30">
                    <div className="text-[11px] text-cyan-400 font-semibold">Upper BB (Call Strike Target)</div>
                    <div className="text-lg font-black font-mono text-cyan-400 mt-0.5">
                      ${upperBb.toFixed(2)}
                    </div>
                    <div className="text-[10px] text-cyan-300">+{callUpsidePct}% upside room</div>
                  </div>

                  <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800">
                    <div className="text-[11px] text-slate-400">14-Day RSI</div>
                    <div
                      className={`text-lg font-black font-mono mt-0.5 ${
                        rsi14 < 30
                          ? 'text-emerald-400'
                          : rsi14 > 70
                          ? 'text-rose-400'
                          : 'text-white'
                      }`}
                    >
                      {rsi14}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {ticker.rsi_14 < 30
                        ? 'Oversold Dip'
                        : ticker.rsi_14 > 70
                        ? 'Overbought'
                        : 'Neutral Zone'}
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 4: Barchart 13-Indicator Opinion & Top 1% Signal Strength */}
              {barchartOpinion && (
                <BarchartOpinionCard opinion={barchartOpinion} />
              )}

              {/* SECTION 4.1: MarketChameleon Quantitative Pattern & Stock Ideas */}
              {(() => {
                const mc = intel.marketChameleon || calculateMarketChameleonPattern(ticker);
                return (
                  <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">🦎</span>
                        <div>
                          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                            <span>MarketChameleon Quantitative Pattern &amp; Stock Ideas</span>
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                              MA Rule Engine
                            </span>
                          </h3>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            Moving Average Engine (SMA 20/50/250) • Momentum &amp; Reversal Classifications
                          </div>
                        </div>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                        {mc.stock_ideas_category}
                      </span>
                    </div>

                    {/* Active Technical Pattern Badges */}
                    <div className="flex flex-wrap gap-1.5">
                      {mc.technical_flags.map((flag, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-950 border border-emerald-500/40 text-emerald-300 font-mono shadow-sm flex items-center gap-1.5"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          <span>{flag}</span>
                        </span>
                      ))}
                      {mc.is_momentum_stock && (
                        <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-950/60 border border-amber-500/40 text-amber-300 font-mono flex items-center gap-1">
                          <span>🔥 Momentum Stock</span>
                        </span>
                      )}
                    </div>

                    {/* Moving Average Gaps Grid */}
                    <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                      <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800">
                        <div className="text-[10px] text-slate-400 uppercase font-mono">Price vs SMA 20</div>
                        <div className={`text-sm font-bold font-mono mt-0.5 ${mc.moving_average_gaps.price_vs_sma20 >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {mc.moving_average_gaps.price_vs_sma20 >= 0 ? '+' : ''}{mc.moving_average_gaps.price_vs_sma20}%
                        </div>
                        <div className="text-[9px] text-slate-500 font-mono">SMA 20: ${mc.sma_20.toFixed(2)}</div>
                      </div>

                      <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800">
                        <div className="text-[10px] text-slate-400 uppercase font-mono">SMA 20 vs SMA 50</div>
                        <div className={`text-sm font-bold font-mono mt-0.5 ${mc.moving_average_gaps.sma20_vs_sma50 >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {mc.moving_average_gaps.sma20_vs_sma50 >= 0 ? '+' : ''}{mc.moving_average_gaps.sma20_vs_sma50}%
                        </div>
                        <div className="text-[9px] text-slate-500 font-mono">SMA 50: ${mc.sma_50.toFixed(2)}</div>
                      </div>

                      <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800">
                        <div className="text-[10px] text-slate-400 uppercase font-mono">SMA 50 vs SMA 250</div>
                        <div className={`text-sm font-bold font-mono mt-0.5 ${mc.moving_average_gaps.sma50_vs_sma250 >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {mc.moving_average_gaps.sma50_vs_sma250 >= 0 ? '+' : ''}{mc.moving_average_gaps.sma50_vs_sma250}%
                        </div>
                        <div className="text-[9px] text-slate-500 font-mono">SMA 250: ${mc.sma_250.toFixed(2)}</div>
                      </div>
                    </div>

                    {/* Aligned Options Strategy Allocation */}
                    <div className="p-2.5 bg-slate-950/60 rounded-lg border border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span className="text-slate-400 font-medium">MarketChameleon Strategy Alignment:</span>
                      <div className="flex flex-wrap gap-1.5 font-mono text-[11px]">
                        {mc.aligned_strategies.map((strat, sIdx) => (
                          <span key={sIdx} className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                            {strat}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* SECTION 7: Proposed Strategy */}
              <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-3">
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  <span>
                    Part 4: Proposed {ticker.has_weeklys === false ? 'Monthly-Adjusted' : 'Weekly'} Strategy (
                    {ticker.has_weeklys === false
                      ? `${ticker.days_to_nearest_expiration ?? ticker.target_dte ?? 20}d Monthly Target`
                      : '3–7 DTE Targeting ~0.15–0.20 Delta'}
                    )
                  </span>
                </h3>

                {ticker.has_weeklys === false && (
                  <div className="p-3.5 bg-amber-950/40 border border-amber-500/50 rounded-xl text-xs text-amber-200 flex items-start gap-2.5">
                    <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-amber-300">Monthly Expiration Only - Adjusted DTE</div>
                      <div className="mt-0.5 text-slate-300 leading-relaxed">
                        ⚠️ This ticker does not trade weekly options. The nearest available expiration is{' '}
                        <strong className="text-white font-mono">{ticker.nearest_expiration_date || ticker.target_exp || 'Monthly'}</strong>{' '}
                        ({ticker.days_to_nearest_expiration ?? ticker.target_dte ?? '?'} DTE). Premium decay (theta) will follow a monthly cycle.
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Cash-Secured Put Play */}
                  <div className="bg-slate-950/80 p-3.5 rounded-xl border border-emerald-500/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4" />
                        <span>Cash-Secured Put (CSP)</span>
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300">
                        ≤ Lower BB Target
                      </span>
                    </div>

                    <div className="flex justify-between py-1 border-b border-slate-800">
                      <span className="text-slate-400">Recommended Strike:</span>
                      <span className="font-bold font-mono text-white">${putStrikeTarget.toFixed(1)}</span>
                    </div>

                    <div className="flex justify-between py-1 border-b border-slate-800">
                      <span className="text-slate-400">Safety Cushion to Spot:</span>
                      <span className="font-mono text-emerald-400">+{putCushionPct}% buffer</span>
                    </div>

                    <div className="flex justify-between py-1 border-b border-slate-800">
                      <span className="text-slate-400">Collateral Required (1 ct):</span>
                      <span className="font-mono text-amber-300">${putCollateral.toLocaleString()}</span>
                    </div>

                    <div className="flex justify-between py-1">
                      <span className="text-slate-400">Est. Cash Income (Weekly):</span>
                      <span className="font-bold font-mono text-emerald-400">+${estimatedWeeklyPutPremium}</span>
                    </div>
                  </div>

                  {/* Covered Call Play */}
                  <div className="bg-slate-950/80 p-3.5 rounded-xl border border-cyan-500/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-cyan-400 flex items-center gap-1.5">
                        <TrendingUp className="w-4 h-4" />
                        <span>Covered Call (CC)</span>
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-300">
                        ≥ Upper BB Target
                      </span>
                    </div>

                    <div className="flex justify-between py-1 border-b border-slate-800">
                      <span className="text-slate-400">Recommended Strike:</span>
                      <span className="font-bold font-mono text-white">
                        ${bestCC ? bestCC.strike.toFixed(1) : Math.ceil(upperBb).toFixed(1)}
                      </span>
                    </div>

                    <div className="flex justify-between py-1 border-b border-slate-800">
                      <span className="text-slate-400">Upside Run Room:</span>
                      <span className="font-mono text-cyan-400">+{callUpsidePct}% headroom</span>
                    </div>

                    <div className="flex justify-between py-1 border-b border-slate-800">
                      <span className="text-slate-400">Shares Required (1 ct):</span>
                      <span className="font-mono text-slate-200">100 Shares (${(spotPrice * 100).toLocaleString()})</span>
                    </div>

                    <div className="flex justify-between py-1">
                      <span className="text-slate-400">Est. Cash Income (Weekly):</span>
                      <span className="font-bold font-mono text-cyan-400">
                        +${bestCC ? bestCC.premium_total : Math.round(spotPrice * (ivCurrent / 100) * 0.12 * 100)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 8: Risk Mitigation */}
              <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-3">
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <span>Part 5: Institutional Risk Mitigation &amp; Assignment Plan</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-slate-950/80 p-3 rounded-lg border border-emerald-500/20">
                    <div className="flex items-center space-x-1.5 text-emerald-400 font-bold mb-1">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>80% Profit BTC Trigger</span>
                    </div>
                    <p className="text-[11px] text-slate-300">
                      When 80% of max upfront premium is captured, <strong>Buy-to-Close (BTC)</strong> immediately. Do not risk weekend gap events.
                    </p>
                  </div>

                  <div className="bg-slate-950/80 p-3 rounded-lg border border-amber-500/20">
                    <div className="flex items-center space-x-1.5 text-amber-400 font-bold mb-1">
                      <AlertTriangle className="w-4 h-4" />
                      <span>0.50 Delta Roll Trigger</span>
                    </div>
                    <p className="text-[11px] text-slate-300">
                      If the underlying reaches <strong>0.50 Delta (ATM)</strong>, roll out 1–2 weeks for credit or prepare for assignment at breakeven.
                    </p>
                  </div>

                  <div className="bg-slate-950/80 p-3 rounded-lg border border-cyan-500/20">
                    <div className="flex items-center space-x-1.5 text-cyan-400 font-bold mb-1">
                      <DollarSign className="w-4 h-4" />
                      <span>5% Portfolio Cap</span>
                    </div>
                    <p className="text-[11px] text-slate-300">
                      Never allocate more than <strong>5% of total liquid collateral</strong> to any single underlying name.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: NEWS & ANALYST CONSENSUS */}
          {activeTab === 'NEWS_ANALYST' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Wall Street Price Target Visualizer */}
              {analystTargets && (
                <AnalystPriceTargetBar
                  currentPrice={spotPrice}
                  targets={analystTargets}
                  currencySymbol="$"
                />
              )}

              {/* Corporate Financial Ratios */}
              {corporateActions && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
                    <span className="text-xs text-slate-400 block">Dividend Yield</span>
                    <span className="text-sm font-semibold font-mono text-emerald-400 mt-0.5 block">
                      {corporateActions.dividend_yield
                        ? `${(corporateActions.dividend_yield * 100).toFixed(2)}%`
                        : 'N/A'}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
                    <span className="text-xs text-slate-400 block">Payout Ratio</span>
                    <span className="text-sm font-semibold font-mono text-slate-200 mt-0.5 block">
                      {corporateActions.payout_ratio
                        ? `${(corporateActions.payout_ratio * 100).toFixed(1)}%`
                        : 'N/A'}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
                    <span className="text-xs text-slate-400 block">Trailing P/E</span>
                    <span className="text-sm font-semibold font-mono text-slate-200 mt-0.5 block">
                      {corporateActions.trailing_pe ? corporateActions.trailing_pe.toFixed(1) : 'N/A'}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
                    <span className="text-xs text-slate-400 block">Forward P/E</span>
                    <span className="text-sm font-semibold font-mono text-slate-200 mt-0.5 block">
                      {corporateActions.forward_pe ? corporateActions.forward_pe.toFixed(1) : 'N/A'}
                    </span>
                  </div>
                </div>
              )}

              {/* AI Factor Scores Grid */}
              <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-400" />
                    <span>AI Decision Factor Rating</span>
                  </h3>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                    Consensus: <strong className="text-emerald-400">{intel.analystConsensus}</strong>
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                    <div className="text-[11px] text-slate-400">Technical Momentum</div>
                    <div className="text-xl font-black font-mono text-blue-400 mt-1">
                      {intel.technicalScore} / 100
                    </div>
                  </div>

                  <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                    <div className="text-[11px] text-slate-400">Fundamental Solvency</div>
                    <div className="text-xl font-black font-mono text-emerald-400 mt-1">
                      {intel.fundamentalScore} / 100
                    </div>
                  </div>

                  <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                    <div className="text-[11px] text-slate-400">Liquidity &amp; Depth</div>
                    <div className="text-xl font-black font-mono text-cyan-400 mt-1">
                      {intel.liquidityScore} / 100
                    </div>
                  </div>

                  <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                    <div className="text-[11px] text-slate-400">Volatility Edge</div>
                    <div className="text-xl font-black font-mono text-amber-400 mt-1">
                      {intel.volatilityEdgeScore} / 100
                    </div>
                  </div>
                </div>
              </div>

              {/* News Catalyst Feed */}
              <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                    <Newspaper className="w-4 h-4 text-blue-400" />
                    <span>Recent News Stories &amp; Volatility Drivers</span>
                  </h3>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {(intel.recentNews || []).length} verified news items
                  </span>
                </div>

                <div className="space-y-3">
                  {(intel.recentNews || []).map((item) => (
                    <div
                      key={item.id}
                      className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80 hover:border-slate-700 transition-colors space-y-2"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                            {item.category}
                          </span>
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                              item.sentiment === 'Bullish' || item.sentiment === 'Strong Bullish'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                : item.sentiment === 'Neutral'
                                ? 'bg-slate-800 text-slate-300 border-slate-700'
                                : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                            }`}
                          >
                            {item.sentiment}
                          </span>
                          <span className="text-slate-500 text-[11px] font-mono">{item.source}</span>
                        </div>
                        <span className="text-slate-500 text-[11px] font-mono">{item.timeAgo}</span>
                      </div>

                      <h4 className="text-xs font-bold text-white leading-snug">{item.headline}</h4>
                      <p className="text-[11px] text-slate-300 leading-relaxed">{item.summary}</p>

                      <div className="p-2.5 rounded-lg bg-indigo-950/30 border border-indigo-500/30 text-[11px] text-indigo-200 flex items-start gap-2">
                        <Flame className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                        <span>
                          <strong className="text-indigo-300">Options Catalyst:</strong> {item.optionsImplication}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Institutional 13F Ownership & SEC EDGAR Compliance Matrix */}
              <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                    <Building className="w-4 h-4 text-emerald-400" />
                    <span>Official SEC EDGAR Regulatory &amp; Financial Filings</span>
                  </h3>
                  <a
                    href={secEdgarUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-purple-950/60 hover:bg-purple-900/80 text-purple-300 hover:text-white border border-purple-500/50 font-mono text-[11px] font-bold flex items-center space-x-1.5 transition-colors shadow-sm"
                    title={`Open Official SEC EDGAR Profile for ${ticker.symbol}`}
                  >
                    <span>SEC EDGAR CIK Profile ({ticker.symbol})</span>
                    <ExternalLink className="w-3.5 h-3.5 text-purple-400" />
                  </a>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-slate-400 text-[11px]">
                      <span>Total Institutional Float (13F):</span>
                      <span className="font-bold font-mono text-emerald-400 text-sm">
                        {intel.institutionalOwnershipPct}%
                      </span>
                    </div>
                    <div className="border-t border-slate-800/80 pt-2 space-y-1">
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">
                        Top 13F Institutional Holders:
                      </span>
                      {(intel.topHolders || []).map((holder, idx) => (
                        <div key={idx} className="flex items-center justify-between text-[11px] py-0.5">
                          <span className="text-slate-300 truncate max-w-[200px]">{holder.name}</span>
                          <span className="font-mono text-slate-400">{holder.stakePct}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300 font-bold text-xs">
                        {isFundOrETF ? 'Fund & Trust Regulatory Filings' : 'Corporate SEC Filings'}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-purple-300 border border-purple-500/30">
                        {primaryFilingLabel}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      {isFundOrETF ? (
                        <>
                          <a
                            href={`https://www.sec.gov/edgar/search/#/q=${encodeURIComponent(ticker.symbol)}&forms=N-CSR`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-purple-500/50 transition-colors flex items-center justify-between text-[11px] font-medium text-slate-200"
                          >
                            <span>Form N-CSR (Annual)</span>
                            <ExternalLink className="w-3 h-3 text-purple-400" />
                          </a>
                          <a
                            href={`https://www.sec.gov/edgar/search/#/q=${encodeURIComponent(ticker.symbol)}&forms=N-CSRS`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-purple-500/50 transition-colors flex items-center justify-between text-[11px] font-medium text-slate-200"
                          >
                            <span>Form N-CSRS (Semi-Ann)</span>
                            <ExternalLink className="w-3 h-3 text-purple-400" />
                          </a>
                          <a
                            href={`https://www.sec.gov/edgar/search/#/q=${encodeURIComponent(ticker.symbol)}&forms=N-PORT`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-purple-500/50 transition-colors flex items-center justify-between text-[11px] font-medium text-slate-200"
                          >
                            <span>Form N-PORT (Holdings)</span>
                            <ExternalLink className="w-3 h-3 text-purple-400" />
                          </a>
                          <a
                            href={`https://www.sec.gov/edgar/search/#/q=${encodeURIComponent(ticker.symbol)}&forms=485BPOS`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-purple-500/50 transition-colors flex items-center justify-between text-[11px] font-medium text-slate-200"
                          >
                            <span>Prospectus (485BPOS)</span>
                            <ExternalLink className="w-3 h-3 text-purple-400" />
                          </a>
                        </>
                      ) : (
                        <>
                          <a
                            href={`https://www.sec.gov/edgar/search/#/q=${encodeURIComponent(ticker.symbol)}&forms=10-K`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-purple-500/50 transition-colors flex items-center justify-between text-[11px] font-medium text-slate-200"
                          >
                            <span>Form 10-K (Annual)</span>
                            <ExternalLink className="w-3 h-3 text-purple-400" />
                          </a>
                          <a
                            href={`https://www.sec.gov/edgar/search/#/q=${encodeURIComponent(ticker.symbol)}&forms=10-Q`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-purple-500/50 transition-colors flex items-center justify-between text-[11px] font-medium text-slate-200"
                          >
                            <span>Form 10-Q (Quarterly)</span>
                            <ExternalLink className="w-3 h-3 text-purple-400" />
                          </a>
                          <a
                            href={`https://www.sec.gov/edgar/search/#/q=${encodeURIComponent(ticker.symbol)}&forms=8-K`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-purple-500/50 transition-colors flex items-center justify-between text-[11px] font-medium text-slate-200"
                          >
                            <span>Form 8-K (Events)</span>
                            <ExternalLink className="w-3 h-3 text-purple-400" />
                          </a>
                          <a
                            href={`https://www.sec.gov/edgar/search/#/q=${encodeURIComponent(ticker.symbol)}&forms=DEF%2014A`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-purple-500/50 transition-colors flex items-center justify-between text-[11px] font-medium text-slate-200"
                          >
                            <span>Proxy DEF 14A</span>
                            <ExternalLink className="w-3 h-3 text-purple-400" />
                          </a>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PREDICTION MARKETS */}
          {activeTab === 'PREDICTION_MARKETS' && (
            <div className="animate-in fade-in duration-150">
              <PredictionMarketCards events={predictionMarkets} />
            </div>
          )}

          {/* TAB 4: SOCIAL & FORUM SENTIMENT */}
          {activeTab === 'SOCIAL_SENTIMENT' && (
            <div className="animate-in fade-in duration-150">
              <SocialSentimentGauge sentiment={socialSentiment} />
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-[11px] text-slate-400">
            <HelpCircle className="w-4 h-4 text-slate-500" />
            <span>Black-Scholes Mathematical Modeling • Bollinger Band (2 SD) Strike Envelope</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition-colors"
          >
            Close Audit
          </button>
        </div>
      </div>
    </div>
  );
};
