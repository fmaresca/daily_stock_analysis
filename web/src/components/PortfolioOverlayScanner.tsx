import React, { useState, useEffect } from 'react';
import {
  CoveredCallCandidate,
  PortfolioPositionInput,
  StockUnderlying,
} from '../types/coveredCall';
import { BuyWritePayoffChart } from './BuyWritePayoffChart';
import { EdgeOptionsDataProvider } from '../services/optionsDataProvider';
import { findOptimalCoveredCalls } from '../services/findOptimalCoveredCalls';

interface PortfolioOverlayScannerProps {
  initialPosition?: PortfolioPositionInput;
  onStageOrder?: (trade: any) => void;
}

export const PortfolioOverlayScanner: React.FC<PortfolioOverlayScannerProps> = ({
  initialPosition = { ticker: 'AAPL', quantity: 300, costBasis: 218.4 },
  onStageOrder,
}) => {
  const [position, setPosition] = useState<PortfolioPositionInput>(initialPosition);
  const [deltaTier, setDeltaTier] = useState<'conservative' | 'balanced' | 'aggressive'>('balanced');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [candidates, setCandidates] = useState<CoveredCallCandidate[]>([]);
  const [underlying, setUnderlying] = useState<StockUnderlying | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<CoveredCallCandidate | null>(null);

  const deltaPresets = {
    conservative: { min: 0.15, max: 0.22, label: 'Conservative (0.15 - 0.22Δ)' },
    balanced: { min: 0.22, max: 0.32, label: 'Balanced (0.22 - 0.32Δ)' },
    aggressive: { min: 0.32, max: 0.42, label: 'Aggressive (0.32 - 0.42Δ)' },
  };

  const runScanner = async () => {
    setIsLoading(true);
    try {
      const activeRange = deltaPresets[deltaTier];
      const params = new URLSearchParams({
        ticker: position.ticker.trim().toUpperCase(),
        minDelta: activeRange.min.toString(),
        maxDelta: activeRange.max.toString(),
        minDte: '21',
        maxDte: '45',
      });

      // Attempt Edge API first; gracefully fallback to client data provider
      try {
        const res = await fetch(`/api/covered-calls?${params.toString()}`);
        if (res.ok) {
          const json = await res.json();
          if (json.success) {
            setCandidates(json.candidates || []);
            setUnderlying(json.underlying || null);
            if (json.candidates && json.candidates.length > 0) {
              setSelectedCandidate(json.candidates[0]);
            }
            setIsLoading(false);
            return;
          }
        }
      } catch {
        // Fallback to client-side provider
      }

      const clientProvider = new EdgeOptionsDataProvider();
      const [und, rawChain] = await Promise.all([
        clientProvider.getUnderlying(position.ticker),
        clientProvider.getOptionChain(position.ticker),
      ]);

      const screened = findOptimalCoveredCalls(und, rawChain, {
        minDelta: activeRange.min,
        maxDelta: activeRange.max,
        minDte: 21,
        maxDte: 45,
      });

      setUnderlying(und);
      setCandidates(screened);
      if (screened.length > 0) {
        setSelectedCandidate(screened[0]);
      }
    } catch (err) {
      console.error('Failed to run covered call screener:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    runScanner();
  }, [position.ticker, deltaTier]);

  const writeCapacityContracts = Math.floor(position.quantity / 100);

  return (
    <div className="w-full space-y-6 font-sans text-slate-100">
      {/* 1. Long Stock Ingestion Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
                Trading-Skills Risk Engine &amp; Optopsy Screener
              </span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">
              Covered Call Portfolio Overlay Scanner
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Screen and rank high-probability covered call overwrites against existing long equity positions.
            </p>
          </div>

          {/* Position Input Controls */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/80 p-3 rounded-xl border border-slate-800">
            <div>
              <label className="text-[10px] font-mono text-slate-400 block mb-1">Ticker</label>
              <input
                type="text"
                value={position.ticker}
                onChange={(e) =>
                  setPosition({ ...position, ticker: e.target.value.toUpperCase() })
                }
                className="w-full bg-slate-900 border border-slate-700/80 rounded px-2.5 py-1.5 text-xs font-mono font-bold text-white uppercase focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="text-[10px] font-mono text-slate-400 block mb-1">Shares Held</label>
              <input
                type="number"
                step="100"
                value={position.quantity}
                onChange={(e) =>
                  setPosition({
                    ...position,
                    quantity: parseInt(e.target.value, 10) || 0,
                  })
                }
                className="w-full bg-slate-900 border border-slate-700/80 rounded px-2.5 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="text-[10px] font-mono text-slate-400 block mb-1">Cost Basis ($)</label>
              <input
                type="number"
                step="0.10"
                value={position.costBasis}
                onChange={(e) =>
                  setPosition({
                    ...position,
                    costBasis: parseFloat(e.target.value) || 0,
                  })
                }
                className="w-full bg-slate-900 border border-slate-700/80 rounded px-2.5 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="text-[10px] font-mono text-slate-400 block mb-1">Write Capacity</label>
              <div className="px-2.5 py-1.5 text-xs font-mono font-bold text-cyan-400 bg-cyan-950/40 border border-cyan-800/60 rounded">
                {writeCapacityContracts} {writeCapacityContracts === 1 ? 'Contract' : 'Contracts'}
              </div>
            </div>
          </div>
        </div>

        {/* Strategy Presets & Market Telemetry */}
        <div className="mt-6 flex flex-wrap items-center justify-between border-t border-slate-800/80 pt-4 gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-mono">Strategy Tier:</span>
            {(['conservative', 'balanced', 'aggressive'] as const).map((tier) => (
              <button
                key={tier}
                onClick={() => setDeltaTier(tier)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
                  deltaTier === tier
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                    : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 border border-transparent'
                }`}
              >
                {deltaPresets[tier].label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            {underlying && (
              <>
                <span className="text-slate-400">
                  IV Rank (52w):{' '}
                  <strong
                    className={
                      underlying.ivRank52w >= 50
                        ? 'text-emerald-400'
                        : underlying.ivRank52w >= 30
                        ? 'text-amber-400'
                        : 'text-slate-400'
                    }
                  >
                    {underlying.ivRank52w}%
                  </strong>
                </span>
                {underlying.dividend && (
                  <span className="text-slate-400">
                    Next Ex-Div:{' '}
                    <strong className="text-purple-400">{underlying.dividend.exDividendDate}</strong> ($
                    {underlying.dividend.amount.toFixed(2)})
                  </span>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* 2. Top 3 Recommended Candidates */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {isLoading ? (
          <div className="col-span-3 py-12 text-center text-slate-500 font-mono animate-pulse">
            Scanning optimal delta contracts &amp; evaluating early assignment risk...
          </div>
        ) : candidates.length === 0 ? (
          <div className="col-span-3 py-12 text-center text-slate-500 font-mono bg-slate-900/40 rounded-xl border border-slate-800">
            No contracts found matching current criteria. Try expanding the delta tier.
          </div>
        ) : (
          candidates.slice(0, 3).map((candidate, idx) => {
            const isSelected = selectedCandidate?.contract.symbol === candidate.contract.symbol;
            const hasEarlyRisk = candidate.earlyAssignmentRisk.hasRisk;
            const totalCashHarvest = candidate.contract.mid * 100 * Math.max(1, writeCapacityContracts);

            return (
              <div
                key={candidate.contract.symbol}
                onClick={() => setSelectedCandidate(candidate)}
                className={`cursor-pointer rounded-2xl p-5 border transition-all relative flex flex-col justify-between ${
                  isSelected
                    ? 'bg-slate-900/90 border-cyan-500 shadow-[0_0_24px_rgba(6,182,212,0.18)] ring-1 ring-cyan-500/50'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Ranking Tag */}
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">
                    Rank #{idx + 1} • Score {candidate.compositeScore}
                  </span>
                  <span className="text-xs font-mono text-cyan-400 font-bold">
                    Δ {candidate.contract.delta.toFixed(2)}
                  </span>
                </div>

                {/* Strike & Expiry */}
                <div className="mb-4">
                  <div className="text-2xl font-black font-mono text-white tracking-tight">
                    ${candidate.contract.strike.toFixed(2)} Call
                  </div>
                  <div className="text-xs text-slate-400 font-mono flex items-center gap-2 mt-0.5">
                    <span>{candidate.contract.expirationDate}</span>
                    <span>•</span>
                    <span className="text-purple-400 font-semibold">{candidate.contract.dte} DTE</span>
                  </div>
                </div>

                {/* Financial Metrics */}
                <div className="grid grid-cols-2 gap-2 bg-slate-900/60 p-3 rounded-xl border border-slate-800/80 mb-4 font-mono text-xs">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Net Premium</span>
                    <span className="font-bold text-emerald-400">${candidate.contract.mid.toFixed(2)} / sh</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Total Cash Harvest</span>
                    <span className="font-bold text-emerald-400">+${totalCashHarvest.toFixed(0)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Annualized Yield</span>
                    <span className="font-bold text-purple-400">{candidate.annualizedYieldPercent.toFixed(1)}%</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Downside Buffer</span>
                    <span className="font-bold text-amber-400">{candidate.downsideProtectionPercent.toFixed(1)}%</span>
                  </div>
                </div>

                {/* Early Assignment Risk Guard (Trading-Skills Requirement) */}
                {hasEarlyRisk ? (
                  <div className="bg-rose-950/40 border border-rose-800/60 p-3 rounded-xl flex items-start gap-2.5 text-xs text-rose-300 font-mono mb-3">
                    <span className="text-rose-400 text-sm">⚠️</span>
                    <div className="leading-tight">
                      <strong className="font-bold text-rose-400 block">Early Assignment Alert</strong>
                      <span className="text-[11px] text-rose-300/80">
                        Ex-Div on {candidate.earlyAssignmentRisk.exDividendDate} (${candidate.earlyAssignmentRisk.dividendAmount?.toFixed(2)}) &gt; Call Time Value (${candidate.earlyAssignmentRisk.callExtrinsicValue.toFixed(2)}).
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-emerald-950/20 border border-emerald-800/40 p-2.5 rounded-xl flex items-center gap-2 text-xs text-emerald-400/90 font-mono mb-3">
                    <span>✓</span>
                    <span className="text-[11px]">No Dividend Assignment Conflict</span>
                  </div>
                )}

                {/* Stage Order Action */}
                {onStageOrder && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onStageOrder({
                        ticker: candidate.contract.ticker,
                        strategy: 'COVERED_CALL',
                        strike: candidate.contract.strike,
                        expiration: candidate.contract.expirationDate,
                        premium: candidate.contract.mid,
                        contracts: Math.max(1, writeCapacityContracts),
                      });
                    }}
                    className="w-full mt-1 py-1.5 px-3 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 text-cyan-300 font-mono text-xs font-semibold transition-colors"
                  >
                    ⚡ Stage Covered Call Order
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* 3. Embedded OptionForge Payoff Visualizer for Selected Trade */}
      {selectedCandidate && underlying && (
        <div className="mt-8">
          <BuyWritePayoffChart
            ticker={underlying.ticker}
            initialStockPrice={underlying.currentPrice}
            initialStrikePrice={selectedCandidate.contract.strike}
            initialPremium={selectedCandidate.contract.mid}
            initialDte={selectedCandidate.contract.dte}
          />
        </div>
      )}
    </div>
  );
};
