import React from 'react';
import {
  Award,
  Building,
  ExternalLink,
} from '../../icons';
import { TickerMeta } from '../../../types/options';
import { AnalystPriceTargetBar } from '../../AnalystPriceTargetBar';
import { getSecFilingSearchUrl } from '../../../utils/secEdgarRegistry';
import { CompanyNewsFeed } from '../../CompanyNewsFeed';

interface TickerNewsAnalystTabProps {
  ticker: TickerMeta;
  intel: any;
  spotPrice: number;
  analystTargets: any;
  corporateActions: any;
  isFundOrETF: boolean;
  primaryFilingLabel: string;
  secEdgarUrl: string;
}

export const TickerNewsAnalystTab: React.FC<TickerNewsAnalystTabProps> = ({
  ticker,
  intel,
  spotPrice,
  analystTargets,
  corporateActions,
  isFundOrETF,
  primaryFilingLabel,
  secEdgarUrl,
}) => {
  return (
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

      {/* Live News Feed — multi-source with filter tabs */}
      <CompanyNewsFeed ticker={ticker.symbol} />

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
              {(intel.topHolders || []).map((holder: any, idx: number) => (
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
                    href={getSecFilingSearchUrl(ticker.symbol, 'N-CSR')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-purple-500/50 transition-colors flex items-center justify-between text-[11px] font-medium text-slate-200"
                  >
                    <span>Form N-CSR (Annual)</span>
                    <ExternalLink className="w-3 h-3 text-purple-400" />
                  </a>
                  <a
                    href={getSecFilingSearchUrl(ticker.symbol, 'N-CSRS')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-purple-500/50 transition-colors flex items-center justify-between text-[11px] font-medium text-slate-200"
                  >
                    <span>Form N-CSRS (Semi-Ann)</span>
                    <ExternalLink className="w-3 h-3 text-purple-400" />
                  </a>
                  <a
                    href={getSecFilingSearchUrl(ticker.symbol, 'N-PORT')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-purple-500/50 transition-colors flex items-center justify-between text-[11px] font-medium text-slate-200"
                  >
                    <span>Form N-PORT (Holdings)</span>
                    <ExternalLink className="w-3 h-3 text-purple-400" />
                  </a>
                  <a
                    href={getSecFilingSearchUrl(ticker.symbol, '485BPOS')}
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
                    href={getSecFilingSearchUrl(ticker.symbol, '10-K')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-purple-500/50 transition-colors flex items-center justify-between text-[11px] font-medium text-slate-200"
                  >
                    <span>Form 10-K (Annual)</span>
                    <ExternalLink className="w-3 h-3 text-purple-400" />
                  </a>
                  <a
                    href={getSecFilingSearchUrl(ticker.symbol, '10-Q')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-purple-500/50 transition-colors flex items-center justify-between text-[11px] font-medium text-slate-200"
                  >
                    <span>Form 10-Q (Quarterly)</span>
                    <ExternalLink className="w-3 h-3 text-purple-400" />
                  </a>
                  <a
                    href={getSecFilingSearchUrl(ticker.symbol, '8-K')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-purple-500/50 transition-colors flex items-center justify-between text-[11px] font-medium text-slate-200"
                  >
                    <span>Form 8-K (Events)</span>
                    <ExternalLink className="w-3 h-3 text-purple-400" />
                  </a>
                  <a
                    href={getSecFilingSearchUrl(ticker.symbol, 'DEF 14A')}
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
  );
};
