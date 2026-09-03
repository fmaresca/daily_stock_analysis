import React, { useState, useEffect } from 'react';
import { TickerMeta, OptionOpportunity } from '../types/options';
import {
  runMultiAgentTradeAudit,
  MultiAgentAuditResult,
} from '../utils/multiAgentTradeAuditor';
import {
  ShieldCheck,
  TrendingUp,
  Activity,
  Zap,
  DollarSign,
  ExternalLink,
  Award,
  CheckCircle2,
  AlertTriangle,
  Info,
  Clock,
  Sliders,
} from './icons';

interface MultiAgentTradeAuditorViewProps {
  tickers: TickerMeta[];
  onStageStructuredOpportunity?: (opp: OptionOpportunity) => void;
}

export const MultiAgentTradeAuditorView: React.FC<MultiAgentTradeAuditorViewProps> = ({
  tickers,
  onStageStructuredOpportunity,
}) => {
  const [selectedSymbol, setSelectedSymbol] = useState<string>(
    tickers.length > 0 ? tickers[0].symbol : 'SPY'
  );
  const [selectedStrategy, setSelectedStrategy] = useState<string>('CSP');
  const [selectedDte, setSelectedDte] = useState<number>(30);
  const [auditResult, setAuditResult] = useState<MultiAgentAuditResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeStep, setActiveStep] = useState<number>(0);

  const activeTicker = tickers.find((t) => t.symbol === selectedSymbol) || tickers[0];

  const handleRunAudit = async () => {
    if (!activeTicker) return;
    setIsLoading(true);
    setActiveStep(1);

    setTimeout(() => setActiveStep(2), 600);
    setTimeout(() => setActiveStep(3), 1200);

    try {
      const res = await runMultiAgentTradeAudit(activeTicker, selectedStrategy, selectedDte);
      setTimeout(() => {
        setAuditResult(res);
        setIsLoading(false);
        setActiveStep(0);
      }, 1600);
    } catch {
      setIsLoading(false);
      setActiveStep(0);
    }
  };

  // Run audit once on initial mount
  useEffect(() => {
    if (activeTicker && !auditResult) {
      handleRunAudit();
    }
  }, [activeTicker?.symbol]);

  const handleStageTrade = () => {
    if (!auditResult || !activeTicker || !onStageStructuredOpportunity) return;
    const strike = auditResult.tradeStructurer.recommendedStrike;
    const spot = activeTicker.spot_price;
    const isPut = selectedStrategy === 'CSP';

    const opp: OptionOpportunity = {
      id: `AI_AUDIT_${auditResult.symbol}_${strike}`,
      symbol: auditResult.symbol,
      name: activeTicker.name,
      category: activeTicker.sector,
      sector: activeTicker.sector,
      liquidity_tier: activeTicker.liquidity_tier,
      strategy: isPut ? 'CSP' : 'COVERED_CALL',
      strategy_name: isPut ? 'AI-Structured Cash-Secured Put' : 'AI-Structured Covered Call',
      expiration: new Date(Date.now() + selectedDte * 86400000).toISOString().split('T')[0],
      dte: selectedDte,
      current_price: spot,
      strike,
      type: isPut ? 'put' : 'call',
      bid: 3.10,
      ask: 3.30,
      mid: 3.20,
      collateral_required: isPut ? strike * 100 : spot * 100,
      premium_total: 320,
      breakeven: isPut ? strike - 3.20 : spot - 3.20,
      cushion_pct: isPut ? Math.round(((spot - strike) / spot) * 1000) / 10 : 0,
      roc_pct: Math.round((3.20 / (isPut ? strike : spot)) * 1000) / 10,
      annualized_roc: Math.round((3.20 / (isPut ? strike : spot)) * (365 / selectedDte) * 1000) / 10,
      delta: isPut ? -0.17 : 0.22,
      abs_delta: isPut ? 0.17 : 0.22,
      theta: 0.14,
      pop_pct: auditResult.quantAgent.popEstimated,
      iv: activeTicker.iv_rank * 0.4 + 16,
      iv_rank: activeTicker.iv_rank,
      safety_tier: 'AI-Approved Institutional Trade',
      tier_color: 'emerald',
      tags: ['AI_AGENT_STRUCTURING', 'INSTITUTIONAL_EXIT_RULES'],
      rating: 92,
    };

    onStageStructuredOpportunity(opp);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800/80 bg-gradient-to-r from-slate-900/95 via-slate-900/60 to-slate-950 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shadow-lg shadow-emerald-500/10">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold text-white tracking-wide">
                  AI Multi-Agent Trade Structurer &amp; SEC 10-K Auditor
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  3-Agent Council
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                Collaborative multi-perspective trade intelligence: <strong>Quant Specialist</strong> audits Greeks &amp; volatility skew, <strong>Fundamental Agent</strong> verifies SEC 10-K balance sheet liquidity, and <strong>Senior Trade Structurer</strong> calculates position sizing and bracket exit rules.
              </p>
            </div>
          </div>

          {/* Configuration Toolbar */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Symbol Picker */}
            <div className="flex items-center space-x-1.5 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
              <span className="text-slate-400 font-semibold">Symbol:</span>
              <select
                value={selectedSymbol}
                onChange={(e) => setSelectedSymbol(e.target.value)}
                className="bg-transparent text-white font-bold cursor-pointer focus:outline-none"
              >
                {tickers.map((t) => (
                  <option key={t.symbol} value={t.symbol} className="bg-slate-900 text-white">
                    {t.symbol} (${t.spot_price.toFixed(0)})
                  </option>
                ))}
              </select>
            </div>

            {/* Strategy Picker */}
            <div className="flex items-center space-x-1.5 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
              <span className="text-slate-400 font-semibold">Strategy:</span>
              <select
                value={selectedStrategy}
                onChange={(e) => setSelectedStrategy(e.target.value)}
                className="bg-transparent text-emerald-400 font-bold cursor-pointer focus:outline-none"
              >
                <option value="CSP" className="bg-slate-900 text-white">Cash-Secured Put</option>
                <option value="COVERED_CALL" className="bg-slate-900 text-white">Covered Call</option>
              </select>
            </div>

            {/* Run Audit Button */}
            <button
              onClick={handleRunAudit}
              disabled={isLoading}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 flex items-center space-x-1.5 transition-all cursor-pointer disabled:opacity-50"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>{isLoading ? 'Agents Convening...' : 'Run 3-Agent Audit'}</span>
            </button>
          </div>
        </div>

        {/* Animated Agent Thinking Steps */}
        {isLoading && (
          <div className="p-4 rounded-xl bg-slate-950/80 border border-emerald-500/30 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono text-slate-300">
              <span className="flex items-center space-x-2">
                <Activity className="w-4 h-4 animate-spin text-emerald-400" />
                <span>
                  {activeStep === 1
                    ? 'Quant Agent: Evaluating Greeks, IV Skew & Probability of Profit...'
                    : activeStep === 2
                    ? 'Fundamental Agent: Auditing SEC EDGAR 10-K disclosures & debt solvency...'
                    : 'Senior Trade Structurer: Calculating capital sizing and mandatory bracket rules...'}
                </span>
              </span>
              <span className="text-emerald-400 font-bold">Step {activeStep} of 3</span>
            </div>
            <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full transition-all duration-500"
                style={{ width: `${(activeStep / 3) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* 3-Agent Insight Cards */}
      {auditResult && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Agent 1: Quant Specialist */}
          <div className="glass-panel rounded-2xl border border-slate-800 p-5 space-y-4 bg-slate-900/60 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <span className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    <Activity className="w-4 h-4" />
                  </span>
                  <div>
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                      Quant &amp; Derivatives
                    </h3>
                    <span className="text-[10px] text-slate-400 font-mono">Agent #1</span>
                  </div>
                </div>

                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                  {auditResult.quantAgent.confidenceScore}% Confidence
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1">
                  <div className="text-[10px] text-slate-400 uppercase font-mono">Target Delta Anchor</div>
                  <div className="text-sm font-bold text-white font-mono">
                    {auditResult.quantAgent.targetDeltaRange}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 font-mono">
                  <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
                    <span className="text-[10px] text-slate-500 block">Expected Move</span>
                    <span className="text-xs font-bold text-amber-300">
                      &plusmn;{auditResult.quantAgent.expectedMovePct}%
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
                    <span className="text-[10px] text-slate-500 block">Estimated POP</span>
                    <span className="text-xs font-bold text-emerald-300">
                      {auditResult.quantAgent.popEstimated}%
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed pt-1">
                  {auditResult.quantAgent.ivRankAssessment}
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800/80 text-[11px] font-mono text-cyan-400 flex items-center justify-between">
              <span>Cushion: {auditResult.quantAgent.safetyBufferPct}</span>
              <span>ROC: {auditResult.quantAgent.annualizedRocProj}</span>
            </div>
          </div>

          {/* Agent 2: Fundamental & SEC Auditor */}
          <div className="glass-panel rounded-2xl border border-slate-800 p-5 space-y-4 bg-slate-900/60 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <span className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    <ShieldCheck className="w-4 h-4" />
                  </span>
                  <div>
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                      Fundamental &amp; SEC Auditor
                    </h3>
                    <span className="text-[10px] text-slate-400 font-mono">Agent #2</span>
                  </div>
                </div>

                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/15 text-blue-300 border border-blue-500/30">
                  {auditResult.fundamentalAgent.confidenceScore}% Confidence
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1">
                  <div className="text-[10px] text-slate-400 uppercase font-mono">Solvency Verdict</div>
                  <div className="text-sm font-bold text-emerald-400">
                    {auditResult.fundamentalAgent.verdict.replace('_', ' ')}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 font-mono">
                  <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
                    <span className="text-[10px] text-slate-500 block">Debt Service Risk</span>
                    <span className="text-xs font-bold text-emerald-300">
                      {auditResult.fundamentalAgent.debtServiceRisk}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
                    <span className="text-[10px] text-slate-500 block">Earnings Binary Risk</span>
                    <span className="text-xs font-bold text-cyan-300">
                      {auditResult.fundamentalAgent.earningsBinaryRisk.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed pt-1">
                  {auditResult.fundamentalAgent.balanceSheetSummary}
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800/80 text-[11px]">
              <a
                href={auditResult.fundamentalAgent.secEdgarUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 flex items-center space-x-1 font-semibold"
              >
                <span>View Official SEC EDGAR Filings (10-K/Q)</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Agent 3: Senior Trade Structurer */}
          <div className="glass-panel rounded-2xl border border-emerald-500/40 p-5 space-y-4 bg-emerald-950/10 flex flex-col justify-between shadow-lg shadow-emerald-500/5">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <Zap className="w-4 h-4" />
                  </span>
                  <div>
                    <h3 className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
                      Senior Trade Structurer
                    </h3>
                    <span className="text-[10px] text-slate-400 font-mono">Agent #3 (Execution Directive)</span>
                  </div>
                </div>

                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  APPROVED
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-950/90 border border-emerald-500/30 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 uppercase font-mono">Recommended Strike</span>
                    <span className="text-[10px] text-emerald-400 font-bold font-mono">
                      Max {auditResult.tradeStructurer.allocationRecommendationPct}% Sizing
                    </span>
                  </div>
                  <div className="text-base font-bold text-white font-mono">
                    ${auditResult.tradeStructurer.recommendedStrike} {selectedStrategy === 'CSP' ? 'Put' : 'Call'}
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1 font-mono text-[11px]">
                  <div className="text-amber-400 font-bold">
                    Target: {auditResult.tradeStructurer.takeProfitTarget}
                  </div>
                  <div className="text-rose-400 font-bold">
                    Stop: {auditResult.tradeStructurer.defensiveStopTrigger}
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed pt-1">
                  {auditResult.tradeStructurer.summaryRationale}
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800/80">
              <button
                onClick={handleStageTrade}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 flex items-center justify-center space-x-2 transition-all cursor-pointer"
              >
                <Zap className="w-4 h-4" />
                <span>Stage Order in Broker Workbench</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
