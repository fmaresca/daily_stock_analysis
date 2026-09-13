import React, { useState, useMemo } from 'react';
import {
  calculateDCFIntrinsicValue,
  calculateDuPont3Step,
  calculateDuPont5Step,
  calculateValuationMultiples,
  calculateEnterpriseValue,
  calculateFreeCashFlow,
} from '../utils/fundamentalValuation';
import { calculateDynamicRiskReward } from '../utils/securityIntelligence';
import {
  X,
  TrendingUp,
  ShieldCheck,
  Zap,
  Activity,
  DollarSign,
  Layers,
  Sparkles,
  ExternalLink,
} from './icons';

interface FundamentalValuationModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTicker?: string;
  onNavigateToEquities?: () => void;
}

type ValuationTab = 'DCF_SIMULATOR' | 'DUPONT_DECOMPOSITION' | 'MULTIPLES_DEFENSE' | 'DYNAMIC_ATR_RISK';

interface PresetStock {
  symbol: string;
  name: string;
  spot: number;
  baseFCF: number;
  growthRates: number[];
  wacc: number;
  termG: number;
  debt: number;
  cash: number;
  shares: number;
  netIncome: number;
  ebt: number;
  ebit: number;
  revenue: number;
  assets: number;
  equity: number;
  trailingEps: number;
  forwardEps: number;
  growthPct: number;
  atr: number;
}

const PRESET_STOCKS: Record<string, PresetStock> = {
  NVDA: {
    symbol: 'NVDA',
    name: 'Nvidia Corp',
    spot: 125.0,
    baseFCF: 53800,
    growthRates: [0.35, 0.25, 0.20, 0.15, 0.10],
    wacc: 0.095,
    termG: 0.03,
    debt: 11000,
    cash: 31000,
    shares: 24500,
    netIncome: 65000,
    ebt: 72000,
    ebit: 75000,
    revenue: 120000,
    assets: 110000,
    equity: 78000,
    trailingEps: 2.75,
    forwardEps: 4.10,
    growthPct: 35.0,
    atr: 4.85,
  },
  AAPL: {
    symbol: 'AAPL',
    name: 'Apple Inc',
    spot: 230.0,
    baseFCF: 108800,
    growthRates: [0.08, 0.07, 0.06, 0.05, 0.04],
    wacc: 0.085,
    termG: 0.025,
    debt: 105000,
    cash: 65000,
    shares: 15300,
    netIncome: 101000,
    ebt: 122000,
    ebit: 128000,
    revenue: 395000,
    assets: 365000,
    equity: 68000,
    trailingEps: 6.60,
    forwardEps: 7.45,
    growthPct: 8.5,
    atr: 3.40,
  },
  MSFT: {
    symbol: 'MSFT',
    name: 'Microsoft Corp',
    spot: 430.0,
    baseFCF: 74100,
    growthRates: [0.14, 0.13, 0.12, 0.10, 0.08],
    wacc: 0.088,
    termG: 0.028,
    debt: 79000,
    cash: 75000,
    shares: 7430,
    netIncome: 88000,
    ebt: 106000,
    ebit: 110000,
    revenue: 245000,
    assets: 512000,
    equity: 268000,
    trailingEps: 11.80,
    forwardEps: 13.50,
    growthPct: 14.0,
    atr: 6.20,
  },
  PLTR: {
    symbol: 'PLTR',
    name: 'Palantir Technologies',
    spot: 72.0,
    baseFCF: 1100,
    growthRates: [0.30, 0.28, 0.24, 0.20, 0.15],
    wacc: 0.105,
    termG: 0.035,
    debt: 250,
    cash: 4200,
    shares: 2280,
    netIncome: 550,
    ebt: 600,
    ebit: 640,
    revenue: 2800,
    assets: 5600,
    equity: 4800,
    trailingEps: 0.24,
    forwardEps: 0.48,
    growthPct: 30.0,
    atr: 2.85,
  },
  TSLA: {
    symbol: 'TSLA',
    name: 'Tesla Inc',
    spot: 245.0,
    baseFCF: 4400,
    growthRates: [0.25, 0.22, 0.20, 0.18, 0.12],
    wacc: 0.108,
    termG: 0.03,
    debt: 5800,
    cash: 30000,
    shares: 3190,
    netIncome: 7800,
    ebt: 8800,
    ebit: 9200,
    revenue: 97000,
    assets: 115000,
    equity: 70000,
    trailingEps: 2.45,
    forwardEps: 3.60,
    growthPct: 22.0,
    atr: 9.80,
  },
  NET: {
    symbol: 'NET',
    name: 'Cloudflare Inc',
    spot: 98.0,
    baseFCF: 280,
    growthRates: [0.28, 0.25, 0.22, 0.18, 0.14],
    wacc: 0.102,
    termG: 0.035,
    debt: 1400,
    cash: 1800,
    shares: 345,
    netIncome: -65, // Negative EPS demonstration
    ebt: -50,
    ebit: 120,
    revenue: 1650,
    assets: 3400,
    equity: 980,
    trailingEps: -0.19,
    forwardEps: 0.72,
    growthPct: 28.0,
    atr: 3.65,
  },
};

export const FundamentalValuationModal: React.FC<FundamentalValuationModalProps> = ({
  isOpen,
  onClose,
  initialTicker = 'NVDA',
  onNavigateToEquities,
}) => {
  const [activeTab, setActiveTab] = useState<ValuationTab>('DCF_SIMULATOR');
  const [selectedSymbol, setSelectedSymbol] = useState<string>(initialTicker.toUpperCase());

  // Current stock config
  const activeStock = PRESET_STOCKS[selectedSymbol] || PRESET_STOCKS['NVDA'];

  // Tab 1: DCF Inputs
  const [dcfBaseFCF, setDcfBaseFCF] = useState<number>(activeStock.baseFCF);
  const [dcfWacc, setDcfWacc] = useState<number>(Math.round(activeStock.wacc * 1000) / 10);
  const [dcfTermG, setDcfTermG] = useState<number>(Math.round(activeStock.termG * 1000) / 10);
  const [g1, setG1] = useState<number>(Math.round(activeStock.growthRates[0] * 100));
  const [g2, setG2] = useState<number>(Math.round(activeStock.growthRates[1] * 100));
  const [g3, setG3] = useState<number>(Math.round(activeStock.growthRates[2] * 100));
  const [g4, setG4] = useState<number>(Math.round(activeStock.growthRates[3] * 100));
  const [g5, setG5] = useState<number>(Math.round(activeStock.growthRates[4] * 100));

  // Sync state when selected symbol changes
  const handleSelectSymbol = (sym: string) => {
    setSelectedSymbol(sym);
    const stock = PRESET_STOCKS[sym] || PRESET_STOCKS['NVDA'];
    setDcfBaseFCF(stock.baseFCF);
    setDcfWacc(Math.round(stock.wacc * 1000) / 10);
    setDcfTermG(Math.round(stock.termG * 1000) / 10);
    setG1(Math.round(stock.growthRates[0] * 100));
    setG2(Math.round(stock.growthRates[1] * 100));
    setG3(Math.round(stock.growthRates[2] * 100));
    setG4(Math.round(stock.growthRates[3] * 100));
    setG5(Math.round(stock.growthRates[4] * 100));
  };

  // Tab 4: Dynamic ATR Inputs
  const [atrMultiplierK, setAtrMultiplierK] = useState<number>(2.0);
  const [atrMultiplierM, setAtrMultiplierM] = useState<number>(4.0);

  // 1. DCF Engine Calculation
  const dcfResult = useMemo(() => {
    const growthArray = [g1 / 100, g2 / 100, g3 / 100, g4 / 100, g5 / 100];
    return calculateDCFIntrinsicValue({
      baseFCF: dcfBaseFCF,
      forecastGrowthRates: growthArray,
      wacc: dcfWacc / 100,
      terminalGrowthRate: dcfTermG / 100,
      totalDebt: activeStock.debt,
      cashAndEquivalents: activeStock.cash,
      sharesOutstanding: activeStock.shares,
      currentSpotPrice: activeStock.spot,
    });
  }, [dcfBaseFCF, g1, g2, g3, g4, g5, dcfWacc, dcfTermG, activeStock]);

  // 2. DuPont Analysis Calculation
  const dupont3 = useMemo(() => {
    return calculateDuPont3Step({
      netIncome: activeStock.netIncome,
      revenue: activeStock.revenue,
      totalAssets: activeStock.assets,
      shareholdersEquity: activeStock.equity,
    });
  }, [activeStock]);

  const dupont5 = useMemo(() => {
    return calculateDuPont5Step({
      netIncome: activeStock.netIncome,
      ebt: activeStock.ebt,
      ebit: activeStock.ebit,
      sales: activeStock.revenue,
      totalAssets: activeStock.assets,
      shareholdersEquity: activeStock.equity,
    });
  }, [activeStock]);

  // 3. Multiples & Negative Earnings Calculation
  const multiples = useMemo(() => {
    const ev = calculateEnterpriseValue({
      marketCap: activeStock.spot * activeStock.shares,
      totalDebt: activeStock.debt,
      cashAndEquivalents: activeStock.cash,
    });
    return calculateValuationMultiples({
      spotPrice: activeStock.spot,
      epsTrailing: activeStock.trailingEps,
      epsForward: activeStock.forwardEps,
      projectedGrowthRate: activeStock.growthPct,
      enterpriseValue: ev,
      ebitda: activeStock.ebit * 1.15,
    });
  }, [activeStock]);

  // 4. Dynamic ATR Risk-Reward Calculation
  const riskRewardPlan = useMemo(() => {
    return calculateDynamicRiskReward(
      activeStock.spot,
      activeStock.atr,
      atrMultiplierK,
      atrMultiplierM,
      2.0
    );
  }, [activeStock, atrMultiplierK, atrMultiplierM]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>DeltaHarvest Quantitative Equity Valuation &amp; DCF Terminal</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  v3.4
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Midpoint Discounting DCF • DuPont Decomposition • Negative Earnings Defense • Dynamic ATR Risk Hurdle
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Ticker Selector Bar */}
        <div className="px-4 py-3 bg-slate-950/40 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <span className="text-xs text-slate-400 font-medium whitespace-nowrap">Benchmark Equities:</span>
            {Object.keys(PRESET_STOCKS).map((sym) => (
              <button
                key={sym}
                onClick={() => handleSelectSymbol(sym)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  selectedSymbol === sym
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80 hover:text-white border border-slate-700/60'
                }`}
              >
                {sym}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="text-slate-400">
              Market Price: <strong className="text-white font-mono">${activeStock.spot.toFixed(2)}</strong>
            </span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-400">
              ATR(14): <strong className="text-cyan-400 font-mono">${activeStock.atr.toFixed(2)}</strong>
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center space-x-1 p-2 bg-slate-950/30 border-b border-slate-800 overflow-x-auto text-xs">
          <button
            onClick={() => setActiveTab('DCF_SIMULATOR')}
            className={`px-3 py-2 rounded-xl font-semibold flex items-center space-x-1.5 transition-all whitespace-nowrap ${
              activeTab === 'DCF_SIMULATOR'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/30 ring-1 ring-emerald-400/50'
                : 'text-emerald-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>1. DCF Intrinsic Value Simulator</span>
          </button>

          <button
            onClick={() => setActiveTab('DUPONT_DECOMPOSITION')}
            className={`px-3 py-2 rounded-xl font-semibold flex items-center space-x-1.5 transition-all whitespace-nowrap ${
              activeTab === 'DUPONT_DECOMPOSITION'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/30 ring-1 ring-emerald-400/50'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>2. DuPont ROE Decomposition (3 &amp; 5-Step)</span>
          </button>

          <button
            onClick={() => setActiveTab('MULTIPLES_DEFENSE')}
            className={`px-3 py-2 rounded-xl font-semibold flex items-center space-x-1.5 transition-all whitespace-nowrap ${
              activeTab === 'MULTIPLES_DEFENSE'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/30 ring-1 ring-emerald-400/50'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Activity className="w-4 h-4 text-purple-400" />
            <span>3. Valuation Multiples &amp; Negative P/E Defense</span>
          </button>

          <button
            onClick={() => setActiveTab('DYNAMIC_ATR_RISK')}
            className={`px-3 py-2 rounded-xl font-semibold flex items-center space-x-1.5 transition-all whitespace-nowrap ${
              activeTab === 'DYNAMIC_ATR_RISK'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/30 ring-1 ring-emerald-400/50'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span>4. Dynamic ATR Risk-Reward Hurdle (R/R ≥ 2.0)</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm text-slate-300 leading-relaxed">
          {/* TAB 1: DCF SIMULATOR */}
          {activeTab === 'DCF_SIMULATOR' && (
            <div className="space-y-6">
              {/* Hero Valuation Result Banner */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-emerald-500/30 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <span className="text-[11px] font-mono uppercase tracking-wider font-bold text-emerald-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    Gordon Growth &amp; Midpoint Discounting Intrinsic Model
                  </span>
                  <h3 className="text-xl font-bold text-white mt-1">
                    {activeStock.name} ({activeStock.symbol}) Intrinsic Value
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Based on 5-year discrete FCF projections, Midpoint timing $(t - 0.5)$, and asymptotic terminal growth bounded below WACC.
                  </p>
                </div>

                <div className="flex items-center gap-5 bg-slate-900/90 p-4 rounded-xl border border-slate-800 shrink-0">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                      Intrinsic Value / Share
                    </span>
                    <span className="text-2xl font-black font-mono text-emerald-400">
                      ${dcfResult.intrinsicValuePerShare.toFixed(2)}
                    </span>
                  </div>
                  <div className="h-8 w-px bg-slate-800"></div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                      Margin of Safety
                    </span>
                    <span
                      className={`text-lg font-bold font-mono px-2 py-0.5 rounded ${
                        dcfResult.marginOfSafetyPct >= 15
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          : dcfResult.marginOfSafetyPct >= 0
                          ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                      }`}
                    >
                      {dcfResult.marginOfSafetyPct >= 0 ? '+' : ''}
                      {dcfResult.marginOfSafetyPct.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Interactive Assumptions Panel */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-4">
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
                  Interactive DCF Parameters &amp; Sensitivity Sliders
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="text-slate-400 block mb-1">
                      Base FCF ($M): <strong className="text-white">${dcfBaseFCF.toLocaleString()}</strong>
                    </label>
                    <input
                      type="range"
                      min={Math.max(10, activeStock.baseFCF * 0.3)}
                      max={activeStock.baseFCF * 2.5}
                      step={50}
                      value={dcfBaseFCF}
                      onChange={(e) => setDcfBaseFCF(parseFloat(e.target.value))}
                      className="w-full accent-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">
                      Cost of Capital WACC (%): <strong className="text-white">{dcfWacc.toFixed(1)}%</strong>
                    </label>
                    <input
                      type="range"
                      min={6.0}
                      max={14.0}
                      step={0.1}
                      value={dcfWacc}
                      onChange={(e) => {
                        const newWacc = parseFloat(e.target.value);
                        setDcfWacc(newWacc);
                        if (dcfTermG >= newWacc - 1.0) {
                          setDcfTermG(Math.max(1.0, Math.round((newWacc - 1.5) * 10) / 10));
                        }
                      }}
                      className="w-full accent-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">
                      Terminal Growth Rate (%): <strong className="text-white">{dcfTermG.toFixed(1)}%</strong> (Bounded &lt; WACC)
                    </label>
                    <input
                      type="range"
                      min={1.0}
                      max={Math.max(1.5, dcfWacc - 1.0)}
                      step={0.1}
                      value={dcfTermG}
                      onChange={(e) => setDcfTermG(parseFloat(e.target.value))}
                      className="w-full accent-emerald-500"
                    />
                  </div>
                </div>

                {/* 5-Year Growth Rate Inputs */}
                <div className="pt-2 border-t border-slate-800/80">
                  <span className="text-[11px] text-slate-400 font-semibold block mb-2">
                    5-Year Annual FCF Growth Assumptions (%):
                  </span>
                  <div className="grid grid-cols-5 gap-2 text-center text-xs">
                    {[
                      { label: 'Year 1', val: g1, set: setG1 },
                      { label: 'Year 2', val: g2, set: setG2 },
                      { label: 'Year 3', val: g3, set: setG3 },
                      { label: 'Year 4', val: g4, set: setG4 },
                      { label: 'Year 5', val: g5, set: setG5 },
                    ].map((yr, idx) => (
                      <div key={idx} className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                        <span className="text-[10px] text-slate-400 block">{yr.label}</span>
                        <input
                          type="number"
                          value={yr.val}
                          onChange={(e) => yr.set(parseFloat(e.target.value) || 0)}
                          className="w-full bg-transparent text-center font-bold text-emerald-400 font-mono mt-1 text-sm focus:outline-none"
                        />
                        <span className="text-[10px] text-slate-400">%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Discrete Forecast Cash Flows Table */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono mb-3">
                  Midpoint Discounting Cash Flow Breakdown
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                  {dcfResult.forecastFCF.map((fcf, idx) => (
                    <div key={idx} className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block font-mono">Period {idx + 1} (t = {idx + 0.5})</span>
                      <span className="text-sm font-bold text-white block mt-1">${fcf.toLocaleString()}M</span>
                      <span className="text-[10px] text-emerald-400 font-mono block mt-1">
                        PV: ${dcfResult.presentValueFCF[idx].toLocaleString()}M
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-4 p-3 rounded-lg bg-slate-900/50 border border-slate-800 flex flex-wrap items-center justify-between text-xs gap-3">
                  <div>
                    <span className="text-slate-400">Sum of 5-Yr PVs:</span>{' '}
                    <strong className="text-white font-mono">${dcfResult.sumPVForecast.toLocaleString()}M</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Terminal Value:</span>{' '}
                    <strong className="text-white font-mono">${dcfResult.terminalValue.toLocaleString()}M</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">PV of Terminal Value:</span>{' '}
                    <strong className="text-emerald-400 font-mono">${dcfResult.presentValueTerminalValue.toLocaleString()}M</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Implied Equity Value:</span>{' '}
                    <strong className="text-white font-mono">${dcfResult.equityValue.toLocaleString()}M</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DUPONT DECOMPOSITION */}
          {activeTab === 'DUPONT_DECOMPOSITION' && (
            <div className="space-y-6">
              <div className="border-l-2 border-cyan-400 pl-4 py-1">
                <h3 className="text-base font-bold text-white">
                  DuPont ROE Decomposition: Structural Return Analysis
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Deconstructs Return on Equity (ROE) into operating efficiency, asset productivity, and financial leverage to diagnose organic growth vs leverage-driven returns.
                </p>
              </div>

              {/* 3-Step Model */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
                    DuPont 3-Step Decomposition
                  </span>
                  <span className="text-xs font-mono text-cyan-300 font-bold">
                    Implied ROE: {dupont3.roePct.toFixed(2)}%
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">1. Net Profit Margin (NI / Revenue)</span>
                    <span className="text-lg font-bold text-white font-mono mt-1 block">
                      {dupont3.netProfitMarginPct.toFixed(2)}%
                    </span>
                    <p className="text-[10px] text-slate-400 mt-1">Reflects pricing power &amp; operating cost control.</p>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">2. Asset Turnover (Revenue / Assets)</span>
                    <span className="text-lg font-bold text-cyan-400 font-mono mt-1 block">
                      {dupont3.assetTurnover.toFixed(3)}x
                    </span>
                    <p className="text-[10px] text-slate-400 mt-1">Asset efficiency generating revenue per dollar invested.</p>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">3. Financial Leverage (Assets / Equity)</span>
                    <span className="text-lg font-bold text-amber-400 font-mono mt-1 block">
                      {dupont3.financialLeverage.toFixed(2)}x
                    </span>
                    <p className="text-[10px] text-slate-400 mt-1">Balance sheet multiplier and debt amplification.</p>
                  </div>
                </div>
              </div>

              {/* 5-Step Model */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
                    DuPont 5-Step Extended Model
                  </span>
                  <span className="text-xs font-mono text-cyan-300 font-bold">
                    Composite ROE: {dupont5.roePct.toFixed(2)}%
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Tax Burden</span>
                    <span className="text-sm font-bold text-white font-mono mt-1 block">
                      {dupont5.taxBurdenPct.toFixed(1)}%
                    </span>
                    <span className="text-[9px] text-slate-400">NI / EBT</span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Interest Burden</span>
                    <span className="text-sm font-bold text-white font-mono mt-1 block">
                      {dupont5.interestBurdenPct.toFixed(1)}%
                    </span>
                    <span className="text-[9px] text-slate-400">EBT / EBIT</span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Operating Margin</span>
                    <span className="text-sm font-bold text-emerald-400 font-mono mt-1 block">
                      {dupont5.operatingMarginPct.toFixed(1)}%
                    </span>
                    <span className="text-[9px] text-slate-400">EBIT / Sales</span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Asset Turnover</span>
                    <span className="text-sm font-bold text-cyan-400 font-mono mt-1 block">
                      {dupont5.assetTurnover.toFixed(3)}x
                    </span>
                    <span className="text-[9px] text-slate-400">Sales / Assets</span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Financial Leverage</span>
                    <span className="text-sm font-bold text-amber-400 font-mono mt-1 block">
                      {dupont5.financialLeverage.toFixed(2)}x
                    </span>
                    <span className="text-[9px] text-slate-400">Assets / Equity</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: MULTIPLES & NEGATIVE EARNINGS DEFENSE */}
          {activeTab === 'MULTIPLES_DEFENSE' && (
            <div className="space-y-6">
              <div className="border-l-2 border-purple-400 pl-4 py-1">
                <h3 className="text-base font-bold text-white">
                  Valuation Multiples &amp; Negative Earnings Handling
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Protects against misleading negative P/E numbers by converting negative earnings into continuous Earnings Yield $(E/P)$ and automatically normalizing PEG decimal vs percentage inputs.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                    Trailing P/E Ratio
                  </span>
                  <span className="text-2xl font-black font-mono text-white mt-1 block">
                    {multiples.peRatio !== null ? `${multiples.peRatio.toFixed(1)}x` : 'N/A'}
                  </span>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {multiples.peRatio === null ? 'Defensively flagged: EPS ≤ 0' : 'Positive corporate profitability.'}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                    Earnings Yield (E / P)
                  </span>
                  <span
                    className={`text-2xl font-black font-mono mt-1 block ${
                      (multiples.earningsYieldPct || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {multiples.earningsYieldPct !== null ? `${multiples.earningsYieldPct.toFixed(2)}%` : 'N/A'}
                  </span>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Continuous negative return representation without multiple distortion.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                    Forward P/E Ratio
                  </span>
                  <span className="text-2xl font-black font-mono text-cyan-400 mt-1 block">
                    {multiples.forwardPeRatio !== null ? `${multiples.forwardPeRatio.toFixed(1)}x` : 'N/A'}
                  </span>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Consensus Next-Twelve-Months (NTM) forward earnings multiple.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                    Normalized PEG Ratio
                  </span>
                  <span className="text-2xl font-black font-mono text-purple-400 mt-1 block">
                    {multiples.pegRatio !== null ? `${multiples.pegRatio.toFixed(2)}x` : 'N/A'}
                  </span>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Auto-scaled (normalized 0.15 vs 15.0% growth rate inputs).
                  </p>
                </div>
              </div>

              {/* Technical Note */}
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-xs space-y-2">
                <span className="font-bold text-slate-200">Quantitative Rule of Thumb:</span>
                <p className="text-slate-400">
                  When analyzing turnaround high-growth SaaS, biotech, or early-stage tech (e.g. NET, BLZE, AXTI), standard screening filters that query <code>PE &lt; 25</code> will incorrectly exclude unprofitable companies with high cash reserves. DeltaHarvest uses <strong>Earnings Yield</strong> and <strong>EV / Gross Profit</strong> to evaluate solvency.
                </p>
              </div>
            </div>
          )}

          {/* TAB 4: DYNAMIC ATR RISK */}
          {activeTab === 'DYNAMIC_ATR_RISK' && (
            <div className="space-y-6">
              <div className="border-l-2 border-amber-400 pl-4 py-1">
                <h3 className="text-base font-bold text-white">
                  Dynamic Volatility Risk-Reward Hurdle &amp; Position Sizing
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Replaces static arbitrary percentage stop-losses (-5% or -10%) with volatility-adjusted stops based on Wilder&apos;s 14-day Average True Range (ATR), ensuring trades clear the institutional $R/R \ge 2.0$ hurdle.
                </p>
              </div>

              {/* Hurdle Outcome Banner */}
              <div className="p-5 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                    Trade Risk-to-Reward Ratio:
                  </span>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-3xl font-black font-mono text-amber-400">
                      1 : {riskRewardPlan.riskRewardRatio.toFixed(2)}
                    </span>
                    <span
                      className={`text-xs font-bold font-mono px-2.5 py-1 rounded-full ${
                        riskRewardPlan.isActionable
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      }`}
                    >
                      {riskRewardPlan.isActionable ? '✓ Clears Institutional Hurdle' : '✗ Insufficient Risk / Reward'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs shrink-0">
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 block">Entry Spot</span>
                    <span className="font-bold text-white font-mono mt-0.5 block">${riskRewardPlan.entryPrice.toFixed(2)}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 block">ATR Stop Loss</span>
                    <span className="font-bold text-rose-400 font-mono mt-0.5 block">${riskRewardPlan.stopLossPrice.toFixed(2)}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 block">Target Price</span>
                    <span className="font-bold text-emerald-400 font-mono mt-0.5 block">${riskRewardPlan.targetPrice.toFixed(2)}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 block">ATR(14) Vol</span>
                    <span className="font-bold text-cyan-400 font-mono mt-0.5 block">${activeStock.atr.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Sliders */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                  <label className="text-slate-400 block mb-1">
                    Stop-Loss Distance: <strong className="text-white">{atrMultiplierK.toFixed(1)}x ATR</strong> (${(atrMultiplierK * activeStock.atr).toFixed(2)})
                  </label>
                  <input
                    type="range"
                    min={1.0}
                    max={3.5}
                    step={0.1}
                    value={atrMultiplierK}
                    onChange={(e) => setAtrMultiplierK(parseFloat(e.target.value))}
                    className="w-full accent-amber-500"
                  />
                  <p className="text-[10px] text-slate-400 mt-2">
                    Places stop below normal intraday noise band, preventing premature shakeouts.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                  <label className="text-slate-400 block mb-1">
                    Profit Target Distance: <strong className="text-white">{atrMultiplierM.toFixed(1)}x ATR</strong> (${(atrMultiplierM * activeStock.atr).toFixed(2)})
                  </label>
                  <input
                    type="range"
                    min={2.0}
                    max={6.0}
                    step={0.2}
                    value={atrMultiplierM}
                    onChange={(e) => setAtrMultiplierM(parseFloat(e.target.value))}
                    className="w-full accent-emerald-500"
                  />
                  <p className="text-[10px] text-slate-400 mt-2">
                    Ensures expected return significantly outweighs market noise and transaction costs.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="text-xs text-slate-400">
            <span>Active Ticker: <strong className="text-white">{activeStock.name} ({activeStock.symbol})</strong></span>
          </div>

          <div className="flex items-center space-x-2">
            {onNavigateToEquities && (
              <button
                onClick={() => {
                  onNavigateToEquities();
                  onClose();
                }}
                className="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <span>View Full Fundamentals Table</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors"
            >
              Close Terminal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
