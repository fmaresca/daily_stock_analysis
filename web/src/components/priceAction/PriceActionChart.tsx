/**
 * DeltaHarvest — Al Brooks Price Action Analysis
 * Component: PriceActionChart (web/src/components/priceAction/PriceActionChart.tsx)
 * 
 * Interactive candlestick chart with non-repainting Price Action overlays:
 * - Candlestick series
 * - 20-period Exponential Moving Average (EMA)
 * - Signal-bar & setup markers (H1/H2, L1/L2, BO, FBO, Double Top/Bottom)
 * - Swing trend-leg polylines
 * - Trading range boundary levels
 * - Invalidation & measured-move projection target lines
 * - Hover / click rationale inspection card
 * - Timeframe selector with explicit "Coming Soon" labels for intraday
 * 
 * Compliance Notice:
 * Not Financial Advice. All pattern annotations and targets are probabilistic
 * heuristics for observational and analytical study only.
 */

import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  createChart,
  CandlestickSeries,
  LineSeries,
  ColorType,
  LineStyle,
  IChartApi,
  ISeriesApi,
  Time,
  createSeriesMarkers,
  SeriesMarker,
} from 'lightweight-charts';
import type { CanonicalBar } from '../../priceAction/bars.ts';
import {
  runPriceActionDetection,
  type DetectionResult,
  type PriceActionSetup,
  type PriceActionConfig,
  DEFAULT_PRICE_ACTION_CONFIG,
} from '../../priceAction/detect.ts';
import {
  TrendingUp,
  ShieldAlert,
  RefreshCw,
  Layers,
  Sparkles,
} from '../icons.tsx';

export interface PriceActionChartProps {
  symbol: string;
  bars?: CanonicalBar[];
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  config?: PriceActionConfig;
  height?: number;
  onSelectSetup?: (setup: PriceActionSetup | null) => void;
}

export const PriceActionChart: React.FC<PriceActionChartProps> = ({
  symbol,
  bars = [],
  isLoading = false,
  error = null,
  onRetry,
  config = DEFAULT_PRICE_ACTION_CONFIG,
  height = 540,
  onSelectSetup,
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  // UI state
  const [selectedTimeframe, setSelectedTimeframe] = useState<'1D' | '1H' | '15M' | '5M'>('1D');
  const [activeSetup, setActiveSetup] = useState<PriceActionSetup | null>(null);
  const [showEma, setShowEma] = useState<boolean>(true);
  const [showSwingLegs, setShowSwingLegs] = useState<boolean>(true);
  const [showRanges, setShowRanges] = useState<boolean>(true);
  const [showMarkers, setShowMarkers] = useState<boolean>(true);

  // Run pure detection engine over bars
  const detectionResult: DetectionResult = useMemo(() => {
    if (!bars || bars.length === 0) {
      return {
        classifiedBars: [],
        swingPivots: [],
        trendLegs: [],
        tradingRanges: [],
        setups: [],
        alwaysInState: 'NEUTRAL',
        ema20: [],
      };
    }
    return runPriceActionDetection(bars, config);
  }, [bars, config]);

  // Handle setup selection sync
  const handleSelectSetup = (setup: PriceActionSetup | null) => {
    setActiveSetup(setup);
    if (onSelectSetup) {
      onSelectSetup(setup);
    }
  };

  // Build chart when container or data updates
  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Clean up prior chart instance
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }

    if (bars.length === 0) return;

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height,
      layout: {
        background: { type: ColorType.Solid, color: '#090d16' },
        textColor: '#94a3b8',
        fontSize: 12,
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      },
      grid: {
        vertLines: { color: 'rgba(30, 41, 59, 0.45)' },
        horzLines: { color: 'rgba(30, 41, 59, 0.45)' },
      },
      crosshair: {
        vertLine: {
          color: '#38bdf8',
          width: 1,
          style: LineStyle.Dashed,
          labelBackgroundColor: '#0284c7',
        },
        horzLine: {
          color: '#38bdf8',
          width: 1,
          style: LineStyle.Dashed,
          labelBackgroundColor: '#0284c7',
        },
      },
      rightPriceScale: {
        borderColor: '#1e293b',
        scaleMargins: {
          top: 0.12,
          bottom: 0.15,
        },
      },
      timeScale: {
        borderColor: '#1e293b',
        timeVisible: true,
        secondsVisible: false,
      },
    });

    chartRef.current = chart;

    // 1. Candlestick Series
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#10b981',
      downColor: '#f43f5e',
      borderVisible: false,
      wickUpColor: '#10b981',
      wickDownColor: '#f43f5e',
    });

    const candleData = bars.map((b) => ({
      time: b.time as Time,
      open: b.open,
      high: b.high,
      low: b.low,
      close: b.close,
    }));
    candleSeries.setData(candleData);

    // 2. 20-period EMA Line Series
    if (showEma && detectionResult.ema20.length === bars.length) {
      const emaSeries = chart.addSeries(LineSeries, {
        color: '#f59e0b',
        lineWidth: 2,
        lineStyle: LineStyle.Solid,
        title: 'EMA 20',
        priceLineVisible: false,
      });

      const emaData = bars.map((b, i) => ({
        time: b.time as Time,
        value: Math.round(detectionResult.ema20[i] * 100) / 100,
      }));
      emaSeries.setData(emaData);
    }

    // 3. Swing Trend Leg Polyline Series
    if (showSwingLegs && detectionResult.swingPivots.length > 0) {
      const swingSeries = chart.addSeries(LineSeries, {
        color: '#38bdf8',
        lineWidth: 1,
        lineStyle: LineStyle.Dashed,
        title: 'Swing Legs',
        priceLineVisible: false,
      });

      const swingData = detectionResult.swingPivots.map((p) => ({
        time: bars[p.index].time as Time,
        value: p.price,
      }));
      swingSeries.setData(swingData);
    }

    // 4. Setup Markers (Arrows & Setup Badges)
    if (showMarkers && detectionResult.setups.length > 0) {
      const markers: SeriesMarker<Time>[] = [];

      for (const s of detectionResult.setups) {
        if (s.signalBarIndex < bars.length) {
          const bar = bars[s.signalBarIndex];
          const isBull = s.direction === 'BULL';

          markers.push({
            time: bar.time as Time,
            position: isBull ? 'belowBar' : 'aboveBar',
            color: isBull ? '#10b981' : '#f43f5e',
            shape: isBull ? 'arrowUp' : 'arrowDown',
            text: s.type,
            size: 1,
          });
        }
      }

      // Add markers via createSeriesMarkers in lightweight-charts v5
      createSeriesMarkers(candleSeries, markers);
    }

    // 5. Active / Selected Setup Price Lines (Invalidation & Measured Move Target)
    const displaySetup = activeSetup || (detectionResult.setups.length > 0 ? detectionResult.setups[detectionResult.setups.length - 1] : null);

    if (displaySetup) {
      // Invalidation Line (Red Dotted)
      candleSeries.createPriceLine({
        price: displaySetup.invalidationLevel,
        color: '#ef4444',
        lineWidth: 1,
        lineStyle: LineStyle.Dotted,
        axisLabelVisible: true,
        title: `Stop: $${displaySetup.invalidationLevel.toFixed(2)}`,
      });

      // Measured Move Target Line (Emerald Dashed)
      if (displaySetup.measuredMoveTarget) {
        candleSeries.createPriceLine({
          price: displaySetup.measuredMoveTarget,
          color: '#10b981',
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: `Target: $${displaySetup.measuredMoveTarget.toFixed(2)}`,
        });
      }
    }

    // 6. Confirmed Trading Range Boundaries
    if (showRanges && detectionResult.tradingRanges.length > 0) {
      const activeRange = detectionResult.tradingRanges[detectionResult.tradingRanges.length - 1];
      if (activeRange) {
        candleSeries.createPriceLine({
          price: activeRange.top,
          color: '#64748b',
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: `Range Top: $${activeRange.top.toFixed(2)}`,
        });
        candleSeries.createPriceLine({
          price: activeRange.bottom,
          color: '#64748b',
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: `Range Base: $${activeRange.bottom.toFixed(2)}`,
        });
      }
    }

    // Fit time scale
    chart.timeScale().fitContent();

    // Subscribe to crosshair move to inspect nearest setup
    chart.subscribeClick((param) => {
      if (!param.time) return;
      const clickedTimeStr = String(param.time);
      const clickedSetup = detectionResult.setups.find((s) => s.signalBarDate === clickedTimeStr);
      if (clickedSetup) {
        handleSelectSetup(clickedSetup);
      }
    });

    // Resize observer
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [
    bars,
    height,
    detectionResult,
    showEma,
    showSwingLegs,
    showRanges,
    showMarkers,
    activeSetup,
  ]);

  return (
    <div className="flex flex-col bg-slate-950/90 border border-slate-800 rounded-xl overflow-hidden shadow-2xl backdrop-blur-md">
      {/* Top Header & Workstation Controls */}
      <div className="flex flex-wrap items-center justify-between px-4 py-3 border-b border-slate-800/80 bg-slate-900/60 gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-emerald-400 font-mono text-base font-bold tracking-tight">
              {symbol}
            </span>
            <span className="text-[11px] font-medium text-slate-400 bg-slate-800/70 px-2 py-0.5 rounded border border-slate-700/60">
              Brooks Price Action
            </span>
          </div>

          {/* Always-In Regime Badge */}
          {bars.length > 0 && (
            <span
              className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
                detectionResult.alwaysInState === 'ALWAYS_IN_LONG'
                  ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60'
                  : detectionResult.alwaysInState === 'ALWAYS_IN_SHORT'
                  ? 'bg-rose-950/60 text-rose-400 border-rose-800/60'
                  : 'bg-slate-800/60 text-slate-400 border-slate-700/60'
              }`}
            >
              {detectionResult.alwaysInState === 'ALWAYS_IN_LONG'
                ? 'Always-In Long (AIL)'
                : detectionResult.alwaysInState === 'ALWAYS_IN_SHORT'
                ? 'Always-In Short (AIS)'
                : 'Neutral / Range'}
            </span>
          )}
        </div>

        {/* Timeframe Selector & Overlay Toggles */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Timeframe Buttons */}
          <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800">
            <button
              type="button"
              onClick={() => setSelectedTimeframe('1D')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                selectedTimeframe === '1D'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              1D
            </button>
            <button
              type="button"
              disabled
              title="Intraday 1-Hour bars coming soon"
              className="px-2 py-1 text-xs font-medium text-slate-600 cursor-not-allowed flex items-center gap-1"
            >
              1H <span className="text-[9px] text-amber-500/70 font-mono">Soon</span>
            </button>
            <button
              type="button"
              disabled
              title="Intraday 15-Minute bars coming soon"
              className="px-2 py-1 text-xs font-medium text-slate-600 cursor-not-allowed flex items-center gap-1"
            >
              15M <span className="text-[9px] text-amber-500/70 font-mono">Soon</span>
            </button>
            <button
              type="button"
              disabled
              title="Intraday 5-Minute bars coming soon"
              className="px-2 py-1 text-xs font-medium text-slate-600 cursor-not-allowed flex items-center gap-1"
            >
              5M <span className="text-[9px] text-amber-500/70 font-mono">Soon</span>
            </button>
          </div>

          {/* Layer Overlay Toggles */}
          <div className="flex items-center gap-1 border-l border-slate-800 pl-2">
            <button
              type="button"
              onClick={() => setShowEma(!showEma)}
              title="Toggle 20-period Exponential Moving Average"
              className={`px-2 py-1 text-xs font-medium rounded border transition-colors ${
                showEma
                  ? 'bg-amber-950/40 text-amber-300 border-amber-800/60'
                  : 'bg-slate-900 text-slate-500 border-slate-800'
              }`}
            >
              EMA 20
            </button>
            <button
              type="button"
              onClick={() => setShowSwingLegs(!showSwingLegs)}
              title="Toggle Swing Leg Polylines"
              className={`px-2 py-1 text-xs font-medium rounded border transition-colors ${
                showSwingLegs
                  ? 'bg-sky-950/40 text-sky-300 border-sky-800/60'
                  : 'bg-slate-900 text-slate-500 border-slate-800'
              }`}
            >
              Swings
            </button>
            <button
              type="button"
              onClick={() => setShowRanges(!showRanges)}
              title="Toggle Trading Range Boundary Boxes"
              className={`px-2 py-1 text-xs font-medium rounded border transition-colors ${
                showRanges
                  ? 'bg-indigo-950/40 text-indigo-300 border-indigo-800/60'
                  : 'bg-slate-900 text-slate-500 border-slate-800'
              }`}
            >
              Ranges
            </button>
            <button
              type="button"
              onClick={() => setShowMarkers(!showMarkers)}
              title="Toggle Pattern Setup Markers"
              className={`px-2 py-1 text-xs font-medium rounded border transition-colors ${
                showMarkers
                  ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/60'
                  : 'bg-slate-900 text-slate-500 border-slate-800'
              }`}
            >
              Setups
            </button>
            <button
              type="button"
              onClick={() => chartRef.current?.timeScale().fitContent()}
              title="Reset Zoom & Fit Content"
              className="p-1 text-slate-400 hover:text-slate-200 bg-slate-900 hover:bg-slate-800 rounded border border-slate-800 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Chart Canvas Area */}
      <div className="relative w-full overflow-hidden" style={{ height }}>
        {/* Loading State */}
        {isLoading && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-sm gap-3">
            <RefreshCw className="w-7 h-7 text-emerald-400 animate-spin" />
            <span className="text-sm font-medium text-slate-300">
              Loading {symbol} Price Action Bars...
            </span>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-950/90 gap-3 px-6 text-center">
            <ShieldAlert className="w-8 h-8 text-rose-400" />
            <h4 className="text-sm font-bold text-slate-200">Price Action Feed Error</h4>
            <p className="text-xs text-rose-300/80 max-w-md">{error}</p>
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors shadow"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Retry Fetch
              </button>
            )}
          </div>
        )}

        {/* Empty State / No Bars */}
        {!isLoading && !error && bars.length === 0 && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-950/90 gap-2">
            <Layers className="w-8 h-8 text-slate-600" />
            <span className="text-xs text-slate-400 font-medium">
              No historical price bars available for {symbol}.
            </span>
          </div>
        )}

        {/* Empty Setups Notice (Clean Chart Rendered) */}
        {!isLoading && !error && bars.length > 0 && detectionResult.setups.length === 0 && (
          <div className="absolute top-3 left-4 z-10 bg-slate-900/80 border border-slate-800/80 px-3 py-1 rounded-md text-[11px] text-slate-400 flex items-center gap-1.5 shadow">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>No high-conviction setups detected. Market in consolidation.</span>
          </div>
        )}

        {/* Interactive Rationale Inspection Banner */}
        {activeSetup && !isLoading && !error && (
          <div className="absolute top-3 left-4 z-10 max-w-md bg-slate-900/95 border border-slate-700/80 p-3 rounded-lg shadow-2xl backdrop-blur-md">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-2">
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-bold font-mono px-2 py-0.5 rounded ${
                    activeSetup.direction === 'BULL'
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      : 'bg-rose-950 text-rose-400 border border-rose-800'
                  }`}
                >
                  {activeSetup.type} ({activeSetup.direction})
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  {activeSetup.signalBarDate}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleSelectSetup(null)}
                className="text-xs text-slate-400 hover:text-slate-200"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-slate-200 mb-2 leading-relaxed">
              {activeSetup.rationale}
            </p>
            <div className="grid grid-cols-3 gap-2 text-[11px] font-mono bg-slate-950/70 p-2 rounded border border-slate-800/60 mb-2">
              <div>
                <span className="text-slate-500 block text-[9px]">Entry</span>
                <span className="text-slate-200 font-bold">${activeSetup.entryPrice.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-rose-400/80 block text-[9px]">Invalidation</span>
                <span className="text-rose-300 font-bold">${activeSetup.invalidationLevel.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-emerald-400/80 block text-[9px]">Target</span>
                <span className="text-emerald-300 font-bold">
                  {activeSetup.measuredMoveTarget ? `$${activeSetup.measuredMoveTarget.toFixed(2)}` : 'N/A'}
                </span>
              </div>
            </div>
            <p className="text-[10px] text-slate-400 italic">
              {activeSetup.confidenceNote}
            </p>
          </div>
        )}

        {/* Lightweight Charts Canvas Element */}
        <div ref={chartContainerRef} className="w-full h-full" />
      </div>

      {/* Mandatory Regulatory Disclaimer Footer */}
      <div className="flex flex-wrap items-center justify-between px-4 py-2 border-t border-slate-800/80 bg-slate-900/40 text-[11px] text-slate-400 gap-2">
        <div className="flex items-center gap-1.5">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-500/80 flex-shrink-0" />
          <span>
            <strong className="text-slate-300">Regulatory Notice:</strong> Not financial advice. Patterns and measured-move targets are probabilistic mathematical models.
          </span>
        </div>
        <div className="flex items-center gap-3 font-mono text-[10px] text-slate-500">
          <span>Swings Lag: N=2</span>
          <span>EMA: 20</span>
          <span>Methodology: Al Brooks</span>
        </div>
      </div>
    </div>
  );
};
export default PriceActionChart;
