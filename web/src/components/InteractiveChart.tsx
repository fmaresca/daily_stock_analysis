import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  createChart,
  CandlestickSeries,
  LineSeries,
  HistogramSeries,
  ColorType,
  LineStyle,
  IChartApi,
  ISeriesApi,
  CandlestickData,
  LineData,
  HistogramData,
  Time,
} from 'lightweight-charts';
import * as XLSX from 'xlsx';
import { TickerMeta, OptionOpportunity } from '../types/options';
import {
  Activity,
  ShieldCheck,
  TrendingUp,
  Flame,
  Sliders,
  FileSpreadsheet,
  FileText,
  Printer,
} from './icons';

interface InteractiveChartProps {
  ticker: TickerMeta;
  opportunities?: OptionOpportunity[];
  height?: number;
}

// Generate realistic historical daily candles leading up to current spot, SMA, and Bollinger Bands
function generateSyntheticCandles(
  ticker: TickerMeta,
  numDays = 90
): {
  candles: CandlestickData<Time>[];
  sma: LineData<Time>[];
  upperBb: LineData<Time>[];
  lowerBb: LineData<Time>[];
  volume: HistogramData<Time>[];
} {
  const candles: CandlestickData<Time>[] = [];
  const sma: LineData<Time>[] = [];
  const upperBb: LineData<Time>[] = [];
  const lowerBb: LineData<Time>[] = [];
  const volume: HistogramData<Time>[] = [];

  const today = new Date();
  const spot = ticker.spot_price;
  const currentSma = ticker.sma_20;
  const currentUpper = ticker.upper_bb;
  const currentLower = ticker.lower_bb;
  const dailyVol = Math.max(0.008, (ticker.hv_30 || 25) / 100 / Math.sqrt(252));

  // Anchor ending at today
  const prices: number[] = new Array(numDays);
  prices[numDays - 1] = spot;

  // Walk backwards using random walk with mean reversion toward current SMA
  for (let i = numDays - 2; i >= 0; i--) {
    const meanReversion = (currentSma - prices[i + 1]) * 0.04;
    // Deterministic pseudo-random based on ticker symbol and index
    const seed = (ticker.symbol.charCodeAt(0) * 17 + i * 31) % 100;
    const randNorm = (seed / 50 - 1) * dailyVol;
    prices[i] = Math.max(1, prices[i + 1] * (1 - randNorm - meanReversion));
  }

  // Build daily OHLC bars and moving averages
  let currentVol = ticker.avg_volume_30 || 5000000;

  for (let i = 0; i < numDays; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() - (numDays - 1 - i));
    // Skip weekends
    if (date.getDay() === 0 || date.getDay() === 6) continue;

    const timeStr = date.toISOString().split('T')[0] as Time;
    const baseClose = prices[i];
    const open = i === 0 ? baseClose * 0.995 : prices[i - 1];
    const high = Math.max(open, baseClose) * (1 + dailyVol * 0.6);
    const low = Math.min(open, baseClose) * (1 - dailyVol * 0.6);
    const close = baseClose;

    candles.push({
      time: timeStr,
      open: Math.round(open * 100) / 100,
      high: Math.round(high * 100) / 100,
      low: Math.round(low * 100) / 100,
      close: Math.round(close * 100) / 100,
    });

    // SMA and BB calculation window
    const windowStart = Math.max(0, i - 19);
    const windowSlice = prices.slice(windowStart, i + 1);
    const sliceMean = windowSlice.reduce((a, b) => a + b, 0) / windowSlice.length;

    // Variance
    const variance =
      windowSlice.reduce((sum, p) => sum + Math.pow(p - sliceMean, 2), 0) /
      windowSlice.length;
    const stdDev = Math.sqrt(variance);

    // On the final day, pin to the exact known indicator values
    const finalSma = i === numDays - 1 ? currentSma : sliceMean;
    const finalUpper = i === numDays - 1 ? currentUpper : sliceMean + 2 * stdDev;
    const finalLower = i === numDays - 1 ? currentLower : sliceMean - 2 * stdDev;

    sma.push({ time: timeStr, value: Math.round(finalSma * 100) / 100 });
    upperBb.push({ time: timeStr, value: Math.round(finalUpper * 100) / 100 });
    lowerBb.push({ time: timeStr, value: Math.round(finalLower * 100) / 100 });

    const isUp = close >= open;
    volume.push({
      time: timeStr,
      value: Math.round(currentVol * (0.7 + (i % 5) * 0.15)),
      color: isUp ? 'rgba(16, 185, 129, 0.4)' : 'rgba(244, 63, 94, 0.4)',
    });
  }

  return { candles, sma, upperBb, lowerBb, volume };
}

export const InteractiveChart: React.FC<InteractiveChartProps> = ({
  ticker,
  opportunities = [],
  height = 420,
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  // Indicator Visibility Toggles
  const [showSma, setShowSma] = useState(true);
  const [showBollinger, setShowBollinger] = useState(true);
  const [showVolume, setShowVolume] = useState(true);
  const [showStrikes, setShowStrikes] = useState(true);
  const [timeframe, setTimeframe] = useState<'1M' | '3M' | '6M'>('3M');

  // Find optimal CSP and CC opportunities for visual strike overlays
  const cspOpp = useMemo(
    () => opportunities.find((o) => o.symbol === ticker.symbol && o.strategy === 'CSP'),
    [opportunities, ticker.symbol]
  );
  const ccOpp = useMemo(
    () => opportunities.find((o) => o.symbol === ticker.symbol && o.strategy === 'CC'),
    [opportunities, ticker.symbol]
  );

  const cspStrike = cspOpp?.strike || ticker.lower_bb * 0.98;
  const ccStrike = ccOpp?.strike || ticker.upper_bb * 1.02;

  // Technical Indicators
  const numDays = timeframe === '1M' ? 30 : timeframe === '3M' ? 90 : 180;
  const chartData = useMemo(() => generateSyntheticCandles(ticker, numDays), [ticker, numDays]);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Initialize Lightweight Chart
    const chart = createChart(chartContainerRef.current, {
      height,
      layout: {
        background: { type: ColorType.Solid, color: '#090d16' },
        textColor: '#94a3b8',
        fontSize: 11,
      },
      grid: {
        vertLines: { color: 'rgba(30, 41, 59, 0.5)' },
        horzLines: { color: 'rgba(30, 41, 59, 0.5)' },
      },
      crosshair: {
        vertLine: { color: '#64748b', style: LineStyle.Dashed },
        horzLine: { color: '#64748b', style: LineStyle.Dashed },
      },
      rightPriceScale: {
        borderColor: '#1e293b',
        scaleMargins: {
          top: 0.1,
          bottom: 0.2,
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
    candleSeries.setData(chartData.candles);

    // 2. Volume Series
    if (showVolume) {
      const volumeSeries = chart.addSeries(HistogramSeries, {
        color: '#64748b',
        priceFormat: { type: 'volume' },
        priceScaleId: '', // overlay
      });
      volumeSeries.priceScale().applyOptions({
        scaleMargins: {
          top: 0.82,
          bottom: 0,
        },
      });
      volumeSeries.setData(chartData.volume);
    }

    // 3. 20D SMA
    if (showSma) {
      const smaSeries = chart.addSeries(LineSeries, {
        color: '#38bdf8',
        lineWidth: 2,
        title: '20D SMA',
      });
      smaSeries.setData(chartData.sma);
    }

    // 4. Bollinger Bands (Upper & Lower)
    if (showBollinger) {
      const upperBbSeries = chart.addSeries(LineSeries, {
        color: '#f472b6',
        lineWidth: 1,
        lineStyle: LineStyle.Dashed,
        title: 'Upper BB (2 SD)',
      });
      upperBbSeries.setData(chartData.upperBb);

      const lowerBbSeries = chart.addSeries(LineSeries, {
        color: '#34d399',
        lineWidth: 1,
        lineStyle: LineStyle.Dashed,
        title: 'Lower BB (2 SD)',
      });
      lowerBbSeries.setData(chartData.lowerBb);
    }

    // 5. Strike Price Overlays
    if (showStrikes) {
      // Put Strike Line (Green)
      candleSeries.createPriceLine({
        price: cspStrike,
        color: '#10b981',
        lineWidth: 2,
        lineStyle: LineStyle.Dotted,
        axisLabelVisible: true,
        title: `CSP Strike: $${cspStrike.toFixed(1)}`,
      });

      // Call Strike Line (Cyan)
      candleSeries.createPriceLine({
        price: ccStrike,
        color: '#06b6d4',
        lineWidth: 2,
        lineStyle: LineStyle.Dotted,
        axisLabelVisible: true,
        title: `CC Strike: $${ccStrike.toFixed(1)}`,
      });

      // Spot Price Line (White)
      candleSeries.createPriceLine({
        price: ticker.spot_price,
        color: '#f8fafc',
        lineWidth: 1,
        lineStyle: LineStyle.Solid,
        axisLabelVisible: true,
        title: `Spot: $${ticker.spot_price.toFixed(2)}`,
      });
    }

    chart.timeScale().fitContent();

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
      chart.remove();
    };
  }, [chartData, showSma, showBollinger, showVolume, showStrikes, height, cspStrike, ccStrike, ticker.spot_price]);

  // ATR (14) approx
  const atrApprox = Math.round(ticker.spot_price * ((ticker.hv_30 || 25) / 100 / Math.sqrt(252)) * 1.5 * 100) / 100;

  return (
    <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-3">
      {/* Chart Top Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        {/* Ticker & Indicators Summary */}
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center font-bold text-white font-mono text-sm">
            {ticker.symbol}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-white text-sm">{ticker.name}</span>
              <span className="text-xs font-mono text-emerald-400 font-bold">
                ${ticker.spot_price.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center space-x-2 text-[11px] text-slate-400">
              <span>SMA: ${ticker.sma_20.toFixed(2)}</span>
              <span>•</span>
              <span className="text-emerald-400">Lower BB: ${ticker.lower_bb.toFixed(2)}</span>
              <span>•</span>
              <span className="text-pink-400">Upper BB: ${ticker.upper_bb.toFixed(2)}</span>
              <span>•</span>
              <span>RSI: {ticker.rsi_14.toFixed(1)}</span>
              <span>•</span>
              <span>ATR(14): ±${atrApprox}</span>
            </div>
          </div>
        </div>

        {/* Chart Toggles & Timeframe Strip */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Timeframe selector */}
          <div className="inline-flex p-0.5 bg-slate-900 rounded-lg border border-slate-800 font-mono text-[11px]">
            {(['1M', '3M', '6M'] as const).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-2 py-1 rounded font-semibold transition-all ${
                  timeframe === tf
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          {/* Indicator Toggles */}
          <button
            onClick={() => setShowSma(!showSma)}
            className={`px-2 py-1 rounded text-[11px] font-semibold border transition-all ${
              showSma
                ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                : 'bg-slate-900 text-slate-500 border-slate-800'
            }`}
          >
            20D SMA
          </button>

          <button
            onClick={() => setShowBollinger(!showBollinger)}
            className={`px-2 py-1 rounded text-[11px] font-semibold border transition-all ${
              showBollinger
                ? 'bg-pink-500/20 text-pink-300 border-pink-500/40'
                : 'bg-slate-900 text-slate-500 border-slate-800'
            }`}
          >
            Bollinger (2 SD)
          </button>

          <button
            onClick={() => setShowStrikes(!showStrikes)}
            className={`px-2 py-1 rounded text-[11px] font-semibold border transition-all ${
              showStrikes
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-slate-900 text-slate-500 border-slate-800'
            }`}
          >
            Strike Overlays
          </button>

          <button
            onClick={() => setShowVolume(!showVolume)}
            className={`px-2 py-1 rounded text-[11px] font-semibold border transition-all ${
              showVolume
                ? 'bg-slate-700 text-slate-200 border-slate-600'
                : 'bg-slate-900 text-slate-500 border-slate-800'
            }`}
          >
            Volume
          </button>

          {/* Export & Print actions */}
          <div className="h-4 w-px bg-slate-800 mx-1 hidden sm:block" />
          <button
            onClick={() => {
              const sheetData = chartData.candles.map((c, i) => ({
                Date: String(c.time),
                Open: c.open,
                High: c.high,
                Low: c.low,
                Close: c.close,
                Volume: chartData.volume[i]?.value || 0,
                '20D SMA': chartData.sma[i]?.value || 0,
                'Upper BB': chartData.upperBb[i]?.value || 0,
                'Lower BB': chartData.lowerBb[i]?.value || 0,
              }));
              const ws = XLSX.utils.json_to_sheet(sheetData);
              const wb = XLSX.utils.book_new();
              XLSX.utils.book_append_sheet(wb, ws, `${ticker.symbol} Daily`);
              XLSX.writeFile(wb, `${ticker.symbol}_candlestick_data_${new Date().toISOString().slice(0, 10)}.xlsx`);
            }}
            className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-emerald-400 hover:text-emerald-300 border border-slate-800 text-[11px] font-semibold flex items-center space-x-1 transition-colors"
            title="Export Daily OHLCV to Excel"
          >
            <FileSpreadsheet className="w-3 h-3" />
            <span>Excel</span>
          </button>

          <button
            onClick={() => {
              const headers = ['Date', 'Open', 'High', 'Low', 'Close', 'Volume', '20D SMA', 'Upper BB', 'Lower BB'];
              const rows = chartData.candles.map((c, i) => [
                String(c.time),
                c.open,
                c.high,
                c.low,
                c.close,
                chartData.volume[i]?.value || 0,
                chartData.sma[i]?.value || 0,
                chartData.upperBb[i]?.value || 0,
                chartData.lowerBb[i]?.value || 0,
              ]);
              const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
              const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.setAttribute('download', `${ticker.symbol}_candlestick_data_${new Date().toISOString().slice(0, 10)}.csv`);
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
            className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-[11px] font-semibold flex items-center space-x-1 transition-colors"
            title="Export Daily OHLCV to CSV"
          >
            <FileText className="w-3 h-3" />
            <span>CSV</span>
          </button>

          <button
            onClick={() => window.print()}
            className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-blue-400 hover:text-blue-300 border border-slate-800 text-[11px] font-semibold flex items-center space-x-1 transition-colors"
            title="Print Technical Chart"
          >
            <Printer className="w-3 h-3" />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* Chart Canvas Mount Node */}
      <div
        ref={chartContainerRef}
        className="w-full rounded-xl overflow-hidden border border-slate-800/80 bg-slate-950"
      />

      {/* Strike Overlay Legend Strip */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] px-1 text-slate-400">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>
              Target Put Strike (≤ Lower BB):{' '}
              <strong className="text-white font-mono">${cspStrike.toFixed(1)}</strong>
            </span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
            <span>
              Target Call Strike (≥ Upper BB):{' '}
              <strong className="text-white font-mono">${ccStrike.toFixed(1)}</strong>
            </span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
            <span>
              SMA 20D: <strong className="text-white font-mono">${ticker.sma_20.toFixed(1)}</strong>
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-slate-500">
          <span>TradingView Lightweight Canvas Engine</span>
        </div>
      </div>
    </div>
  );
};
