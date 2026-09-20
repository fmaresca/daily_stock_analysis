import React from 'react';
import {
  ShieldCheck,
  Sparkles,
  BrainCircuit,
  Zap,
  ExternalLink,
  CheckCircle2,
  Copy,
} from '../../icons';
import { SortableTh } from '../../ui/SortableTh';
import { SortOrder } from '../../../utils/tableSort';
import {
  OptionOpportunity,
  AccountCapitalState,
  GeminiScreenResult,
  GeminiRecommendedTrade,
} from '../../../types/options';

export interface GeminiDecisionHubTabProps {
  capitalState: AccountCapitalState;
  geminiCandidateSource: 'ALL_SCREENED' | 'BARCHART' | 'MC' | 'TOS' | 'PORTFOLIO';
  onGeminiCandidateSourceChange: (val: 'ALL_SCREENED' | 'BARCHART' | 'MC' | 'TOS' | 'PORTFOLIO') => void;
  strictCboeWeeklysOnly: boolean;
  onStrictCboeWeeklysOnlyToggle: () => void;
  minIvRank: number;
  onMinIvRankChange: (val: number) => void;
  minDelta: number;
  maxDelta: number;
  maxPositionCollateral: number;
  maxAffordablePositions: number;
  parsedGeminiResult: GeminiScreenResult | null;
  sortedGeminiTrades: GeminiRecommendedTrade[];
  geminiTradesSortKey: string;
  geminiTradesSortOrder: SortOrder;
  requestGeminiTradesSort: (key: string) => void;
  onStageGeminiTrade: (trade: GeminiRecommendedTrade) => void;
  finalCandidates: OptionOpportunity[];
  sortedFinalCandidates: OptionOpportunity[];
  sortBy: keyof OptionOpportunity | 'annualized_roc';
  sortOrder: SortOrder;
  setSortBy: (key: keyof OptionOpportunity | 'annualized_roc') => void;
  setSortOrder: React.Dispatch<React.SetStateAction<'asc' | 'desc'>>;
  onStageOpportunity?: (opp: OptionOpportunity) => void;
  onOpenBrokerStaging?: (symbol: string, strategy: string) => void;
  onSelectSymbolForChart?: (symbol: string) => void;
  showToast: (msg: string) => void;
  isAiModalOpen: boolean;
  setIsAiModalOpen: (val: boolean) => void;
  generateGeminiThinkingPrompt: () => string;
  candidatePromptCount?: number;
  copiedPrompt: boolean;
  handleCopyPrompt: () => void;
  importedBriefing: string;
  handleParseMarkdown: (val: string) => void;
}

export const GeminiDecisionHubTab: React.FC<GeminiDecisionHubTabProps> = React.memo(({
  capitalState,
  geminiCandidateSource,
  onGeminiCandidateSourceChange,
  strictCboeWeeklysOnly,
  onStrictCboeWeeklysOnlyToggle,
  minIvRank,
  onMinIvRankChange,
  minDelta,
  maxDelta,
  maxPositionCollateral,
  maxAffordablePositions,
  parsedGeminiResult,
  sortedGeminiTrades,
  geminiTradesSortKey,
  geminiTradesSortOrder,
  requestGeminiTradesSort,
  onStageGeminiTrade,
  finalCandidates,
  sortedFinalCandidates,
  sortBy,
  sortOrder,
  setSortBy,
  setSortOrder,
  onStageOpportunity,
  onOpenBrokerStaging,
  onSelectSymbolForChart,
  showToast,
  isAiModalOpen,
  setIsAiModalOpen,
  generateGeminiThinkingPrompt,
  candidatePromptCount,
  copiedPrompt,
  handleCopyPrompt,
  importedBriefing,
  handleParseMarkdown,
}) => {
  return (
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
            onChange={(e) => onGeminiCandidateSourceChange(e.target.value as any)}
            className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-1.5 text-xs font-mono"
          >
            <option value="ALL_SCREENED">All Tri-Screen Sources Combined</option>
            <option value="BARCHART">Barchart Top 1% Only (53)</option>
            <option value="MC">MarketChameleon Momentum Only (60)</option>
            <option value="TOS">ThinkorSwim View 190898 Only</option>
          </select>
          <button
            type="button"
            onClick={onStrictCboeWeeklysOnlyToggle}
            className={`w-full py-1 px-2 rounded-lg text-[10px] font-bold border flex items-center justify-between transition-all cursor-pointer ${
              strictCboeWeeklysOnly
                ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
                : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300'
            }`}
            title="When active, strictly eliminates any equities without weekly options (like monthly-only stocks AMCX, MUFG, NMM) from the Gemini AI prompt"
          >
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span>CBOE Weeklys Gate</span>
            </span>
            <span className="font-mono">{strictCboeWeeklysOnly ? 'Strict (Enforced)' : 'All Chains'}</span>
          </button>
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
                onClick={() => onMinIvRankChange(val)}
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

          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/80 shadow-xl max-h-[620px] 2xl:max-h-[720px] overflow-y-auto relative table-scroll-container">
            <table className="w-full text-left text-xs font-mono border-collapse table-sticky-header">
              <thead className="sticky top-0 z-10 bg-slate-950/95 backdrop-blur">
                <tr className="border-b border-slate-800 text-slate-400 text-[11px]">
                  <SortableTh label="Rank" sortKey="riskRank" currentSortKey={geminiTradesSortKey} currentSortOrder={geminiTradesSortOrder} onSort={requestGeminiTradesSort} />
                  <SortableTh label="Ticker" sortKey="symbol" currentSortKey={geminiTradesSortKey} currentSortOrder={geminiTradesSortOrder} onSort={requestGeminiTradesSort} />
                  <SortableTh label="Current Spot" sortKey="currentPrice" currentSortKey={geminiTradesSortKey} currentSortOrder={geminiTradesSortOrder} onSort={requestGeminiTradesSort} />
                  <SortableTh label="Put Strike" sortKey="suggestedStrike" currentSortKey={geminiTradesSortKey} currentSortOrder={geminiTradesSortOrder} onSort={requestGeminiTradesSort} />
                  <SortableTh label="Delta" sortKey="delta" currentSortKey={geminiTradesSortKey} currentSortOrder={geminiTradesSortOrder} onSort={requestGeminiTradesSort} />
                  <SortableTh label="Est. Premium" sortKey="estPremiumAnnualized" currentSortKey={geminiTradesSortKey} currentSortOrder={geminiTradesSortOrder} onSort={requestGeminiTradesSort} />
                  <SortableTh label="Cash Collateral" sortKey="capitalCommitted" currentSortKey={geminiTradesSortKey} currentSortOrder={geminiTradesSortOrder} onSort={requestGeminiTradesSort} />
                  <th className="sticky top-0 z-10 bg-slate-950/98 backdrop-blur py-2.5 px-3 text-slate-400 font-bold uppercase tracking-wider text-[11px] border-b border-slate-800">Rationale &amp; Support Level</th>
                  <th className="sticky top-0 z-10 bg-slate-950/98 backdrop-blur py-2.5 px-3 text-right text-slate-400 font-bold uppercase tracking-wider text-[11px] border-b border-slate-800">Workbench Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {sortedGeminiTrades.map((trade, idx) => (
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
                        onClick={() => onStageGeminiTrade(trade)}
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
      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/80 shadow-xl max-h-[620px] 2xl:max-h-[720px] overflow-y-auto relative table-scroll-container">
        <table className="w-full text-left text-xs font-mono border-collapse table-sticky-header">
          <thead className="sticky top-0 z-10 bg-slate-950/95 backdrop-blur">
            <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 text-[11px]">
              <SortableTh label="Symbol & Tier" sortKey="symbol" currentSortKey={sortBy} currentSortOrder={sortOrder} onSort={(k) => { if (sortBy === k) setSortOrder(o => o === 'asc' ? 'desc' : 'asc'); else { setSortBy(k as any); setSortOrder('asc'); } }} />
              <SortableTh label="Spot Price" sortKey="current_price" currentSortKey={sortBy} currentSortOrder={sortOrder} onSort={(k) => { if (sortBy === k) setSortOrder(o => o === 'asc' ? 'desc' : 'asc'); else { setSortBy(k as any); setSortOrder('asc'); } }} />
              <SortableTh label="Strike (Cushion)" sortKey="strike" currentSortKey={sortBy} currentSortOrder={sortOrder} onSort={(k) => { if (sortBy === k) setSortOrder(o => o === 'asc' ? 'desc' : 'asc'); else { setSortBy(k as any); setSortOrder('asc'); } }} />
              <SortableTh label="DTE (Exp)" sortKey="dte" currentSortKey={sortBy} currentSortOrder={sortOrder} onSort={(k) => { if (sortBy === k) setSortOrder(o => o === 'asc' ? 'desc' : 'asc'); else { setSortBy(k as any); setSortOrder('asc'); } }} />
              <SortableTh label="Delta (POP)" sortKey="abs_delta" currentSortKey={sortBy} currentSortOrder={sortOrder} onSort={(k) => { if (sortBy === k) setSortOrder(o => o === 'asc' ? 'desc' : 'asc'); else { setSortBy(k as any); setSortOrder('asc'); } }} />
              <SortableTh label="Premium (Cash)" sortKey="mid" currentSortKey={sortBy} currentSortOrder={sortOrder} onSort={(k) => { if (sortBy === k) setSortOrder(o => o === 'asc' ? 'desc' : 'asc'); else { setSortBy(k as any); setSortOrder('asc'); } }} />
              <SortableTh label="Collateral" sortKey="collateral_required" currentSortKey={sortBy} currentSortOrder={sortOrder} onSort={(k) => { if (sortBy === k) setSortOrder(o => o === 'asc' ? 'desc' : 'asc'); else { setSortBy(k as any); setSortOrder('asc'); } }} />
              <SortableTh label="Annualized ROC" sortKey="annualized_roc" currentSortKey={sortBy} currentSortOrder={sortOrder} onSort={(k) => { if (sortBy === k) setSortOrder(o => o === 'asc' ? 'desc' : 'asc'); else { setSortBy(k as any); setSortOrder('asc'); } }} align="right" />
              <th className="sticky top-0 z-10 bg-slate-950/98 backdrop-blur py-3 px-3 text-center text-slate-400 font-bold uppercase tracking-wider text-[11px] border-b border-slate-800">Affordable</th>
              <th className="sticky top-0 z-10 bg-slate-950/98 backdrop-blur py-3 px-4 text-center text-slate-400 font-bold uppercase tracking-wider text-[11px] border-b border-slate-800">Stage Order</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-800/60">
            {sortedFinalCandidates.length === 0 ? (
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
                    {candidatePromptCount ?? finalCandidates.length} candidate contracts pre-formatted
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
  );
});

GeminiDecisionHubTab.displayName = 'GeminiDecisionHubTab';
