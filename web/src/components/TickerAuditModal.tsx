import React, { useState, useMemo } from 'react';
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
  const rawIv = typeof ticker.iv_current === 'number' && !isNaN(ticker.iv_current) ? ticker.iv_current : 25.0;
  const ivCurrent = rawIv <= 1.5 ? rawIv * 100 : rawIv;
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
  const secEdgarUrl = getSecEdgarUrl(ticker.symbol);

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
                {predictionMarkets.length} • {intel.pmciScore ?? 55}% PMCI
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
              ticker={ticker}
              opportunities={opportunities}
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
            />
          )}

          {/* TAB 2: NEWS & ANALYST CONSENSUS */}
          {activeTab === 'NEWS_ANALYST' && (
            <TickerNewsAnalystTab
              ticker={ticker}
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
                symbol={ticker.symbol}
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

          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition-colors cursor-pointer"
          >
            Close Audit
          </button>
        </div>
      </div>
    </div>
  );
};
