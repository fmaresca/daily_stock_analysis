import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  BarChart2,
  CheckCircle2,
  FileText,
  Loader2,
  ShieldAlert,
  Sparkles,
  X,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ColorType, CrosshairMode, LineStyle, createChart } from 'lightweight-charts';
import type { CandleData, TradeSetupItem } from '../../types/tradeSetup';
import type { WatchlistQuoteEntry } from '../../types/marketData';
import { useWatchlistQuoteStore } from '../../stores/watchlistQuoteStore';
import { cn } from '../../utils/cn';

interface StockDetailDrawerProps {
  trade: TradeSetupItem | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenRawReportModal?: (trade: TradeSetupItem) => void;
  quoteEntry?: WatchlistQuoteEntry;
}

type DrawerTab = 'chart' | 'thesis' | 'risks' | 'indicators' | 'raw';

export const StockDetailDrawer: React.FC<StockDetailDrawerProps> = ({
  trade,
  isOpen,
  onClose,
  quoteEntry,
}) => {
  const [activeTab, setActiveTab] = useState<DrawerTab>('chart');
  const chartContainerRef = useRef<HTMLDivElement>(null);

  const storeEntry = useWatchlistQuoteStore((s) =>
    trade ? s.cache[trade.ticker.toUpperCase()] : undefined
  );
  const activeQuoteEntry = quoteEntry ?? storeEntry;

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Generate synthetic candles if not provided
  const candleData = useMemo<CandleData[]>(() => {
    if (!trade) return [];
    if (activeQuoteEntry?.candles && activeQuoteEntry.candles.length > 0) {
      return activeQuoteEntry.candles;
    }
    if (trade.candles && trade.candles.length > 0) return trade.candles;

    const currentPrice =
      (activeQuoteEntry?.quote?.currentPrice ?? 0) > 0
        ? activeQuoteEntry!.quote!.currentPrice
        : (trade.current_price ?? trade.currentPrice ?? 150);
    const tickerSeed = trade.ticker.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const items: CandleData[] = [];
    const baseDate = new Date('2026-08-01T00:00:00Z');

    let price = currentPrice * 0.92;
    for (let i = 0; i < 30; i++) {
      const d = new Date(baseDate);
      d.setUTCDate(baseDate.getUTCDate() + i);
      const dateStr = d.toISOString().split('T')[0];

      const seed = tickerSeed + i * 31;
      const pseudoRand1 = ((Math.sin(seed) * 10000) % 1 + 1) % 1;
      const pseudoRand2 = ((Math.sin(seed + 1) * 10000) % 1 + 1) % 1;
      const pseudoRand3 = ((Math.sin(seed + 2) * 10000) % 1 + 1) % 1;

      const vol = price * 0.025;
      const open = price;
      const change = (pseudoRand1 - 0.48) * vol;
      const close = Math.max(1, +(open + change).toFixed(2));
      const high = Math.max(open, close) + pseudoRand2 * (vol * 0.5);
      const low = Math.min(open, close) - pseudoRand3 * (vol * 0.5);

      items.push({
        time: dateStr,
        open: +open.toFixed(2),
        high: +high.toFixed(2),
        low: +low.toFixed(2),
        close: +close.toFixed(2),
        volume: Math.floor(pseudoRand1 * 5000000 + 1000000),
      });

      price = close;
    }

    // Set the last candle to match currentPrice
    if (items.length > 0) {
      items[items.length - 1].close = currentPrice;
      if (items[items.length - 1].high < currentPrice) {
        items[items.length - 1].high = +(currentPrice * 1.01).toFixed(2);
      }
    }
    return items;
  }, [trade]);

  // TradingView Lightweight Charts initialization
  useEffect(() => {
    if (!isOpen || activeTab !== 'chart' || !chartContainerRef.current || !trade) {
      return;
    }

    const container = chartContainerRef.current;
    container.innerHTML = '';

    const chart = createChart(container, {
      width: container.clientWidth,
      height: 320,
      layout: {
        background: { type: ColorType.Solid, color: '#0B0F17' },
        textColor: '#9CA3AF',
      },
      grid: {
        vertLines: { color: '#1F2937' },
        horzLines: { color: '#1F2937' },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
      },
      rightPriceScale: {
        borderColor: '#1F2937',
        scaleMargins: {
          top: 0.1,
          bottom: 0.2,
        },
      },
      timeScale: {
        borderColor: '#1F2937',
        timeVisible: true,
      },
    });

    const candleSeries = chart.addCandlestickSeries({
      upColor: '#10B981',
      downColor: '#F43F5E',
      borderVisible: false,
      wickUpColor: '#10B981',
      wickDownColor: '#F43F5E',
    });

    candleSeries.setData(candleData);

    const entryPrice = trade.entry_price ?? trade.entryPrice ?? 0;
    const stopLoss = trade.stop_loss ?? trade.stopLoss ?? 0;
    const takeProfit = trade.take_profit ?? trade.takeProfit ?? 0;

    // Entry Price Horizontal Line
    if (entryPrice > 0) {
      candleSeries.createPriceLine({
        price: entryPrice,
        color: '#3B82F6',
        lineWidth: 2,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: true,
        title: 'ENTRY',
      });
    }

    // Stop Loss Line
    if (stopLoss > 0) {
      candleSeries.createPriceLine({
        price: stopLoss,
        color: '#F43F5E',
        lineWidth: 2,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: true,
        title: 'STOP',
      });
    }

    // Take Profit Line
    if (takeProfit > 0) {
      candleSeries.createPriceLine({
        price: takeProfit,
        color: '#10B981',
        lineWidth: 2,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: true,
        title: 'TARGET',
      });
    }

    chart.timeScale().fitContent();

    const handleResize = () => {
      if (container) {
        chart.applyOptions({ width: container.clientWidth });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [isOpen, activeTab, trade, candleData]);

  if (!isOpen || !trade) return null;

  const score = trade.conviction_score ?? trade.convictionScore ?? 5.0;
  const bias = (trade.bias || 'NEUTRAL').toUpperCase();
  const currentPrice = trade.current_price ?? trade.currentPrice ?? 0;
  const entryPrice = trade.entry_price ?? trade.entryPrice ?? 0;
  const stopLoss = trade.stop_loss ?? trade.stopLoss ?? 0;
  const takeProfit = trade.take_profit ?? trade.takeProfit ?? 0;
  const rr = trade.risk_reward_ratio ?? trade.riskRewardRatio ?? 0;
  const checklist = trade.action_checklist || trade.actionChecklist || [];
  const grade =
    trade.setup_grade ||
    trade.setupGrade ||
    (score >= 8 && rr >= 2
      ? 'Tier 1 (High Conviction)'
      : score >= 6.5 && rr >= 1.5
      ? 'Tier 2 (Actionable)'
      : 'Tier 3 (Watch Only)');

  const isBullish = bias === 'BULLISH';
  const isBearish = bias === 'BEARISH';

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Slide-over Drawer */}
      <div
        className="fixed right-0 top-0 h-full w-full md:w-[600px] z-50 bg-card-dark border-l border-border-subtle shadow-2xl flex flex-col font-sans animate-in slide-in-from-right duration-300 select-none"
      >
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-border-subtle bg-surface-dark/95 flex items-start justify-between">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold font-financial text-foreground tracking-tight">
                {trade.ticker}
              </span>
              <span className="text-xs px-1.5 py-0.5 rounded bg-card-dark text-muted-text border border-border-subtle font-mono">
                {trade.market}
              </span>
              <span
                className={cn(
                  'inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase border',
                  isBullish && 'bg-accent-long/15 text-accent-long border-accent-long/30',
                  isBearish && 'bg-accent-short/15 text-accent-short border-accent-short/30',
                  !isBullish && !isBearish && 'bg-accent-neutral/15 text-accent-neutral border-accent-neutral/30'
                )}
              >
                {isBullish && <ArrowUp className="h-3 w-3 stroke-[2.5]" />}
                {isBearish && <ArrowDown className="h-3 w-3 stroke-[2.5]" />}
                {bias}
              </span>
            </div>
            <p className="text-xs text-secondary-text truncate max-w-sm">
              {trade.company_name || trade.companyName || trade.ticker}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right flex flex-col items-end">
              {activeQuoteEntry?.status === 'hydrating' || activeQuoteEntry?.status === 'pending' ? (
                <div className="flex items-center gap-1 text-muted-text text-xs">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Updating...</span>
                </div>
              ) : (
                <div className="flex items-baseline gap-1.5">
                  <span className="text-lg font-bold font-financial text-foreground">
                    ${(activeQuoteEntry?.quote?.currentPrice ?? currentPrice) > 0
                      ? (activeQuoteEntry?.quote?.currentPrice ?? currentPrice).toFixed(2)
                      : '—'}
                  </span>
                  {activeQuoteEntry?.quote?.changePct !== undefined && activeQuoteEntry.quote.changePct !== null && (
                    <span
                      className={cn(
                        'text-xs font-financial font-medium',
                        activeQuoteEntry.quote.changePct >= 0 ? 'text-accent-long' : 'text-accent-short'
                      )}
                    >
                      {activeQuoteEntry.quote.changePct >= 0 ? '+' : ''}
                      {activeQuoteEntry.quote.changePct.toFixed(2)}%
                    </span>
                  )}
                </div>
              )}
              <div className="flex items-center gap-1.5 mt-0.5">
                {activeQuoteEntry?.status === 'failed' && (
                  <span className="text-[10px] text-accent-short font-medium px-1.5 py-0.2 rounded bg-accent-short/10 border border-accent-short/20">
                    Delayed / Offline
                  </span>
                )}
                {activeQuoteEntry?.status === 'ready' && (
                  <span className="text-[10px] text-accent-long font-medium px-1.5 py-0.2 rounded bg-accent-long/10 border border-accent-long/20">
                    Live Data
                  </span>
                )}
                <span
                  className={cn(
                    'text-[10px] font-semibold px-2 py-0.5 rounded border',
                    grade.includes('Tier 1')
                      ? 'text-accent-long bg-accent-long/10 border-accent-long/30'
                      : grade.includes('Tier 2')
                      ? 'text-accent-neutral bg-accent-neutral/10 border-accent-neutral/30'
                      : 'text-muted-text bg-surface-dark border-border-subtle'
                  )}
                >
                  {grade}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="h-8 w-8 rounded-lg border border-border-subtle bg-surface-dark flex items-center justify-center text-muted-text hover:text-foreground hover:bg-card-dark transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Rapid Trade Metric Pill Strip */}
        <div className="grid grid-cols-4 gap-2 p-3 bg-surface-dark/60 border-b border-border-subtle text-xs">
          <div className="flex flex-col rounded bg-card-dark/80 p-2 border border-border-subtle/80">
            <span className="text-[10px] text-muted-text uppercase font-semibold">Entry</span>
            <span className="font-financial font-medium text-secondary-text text-sm">
              ${entryPrice.toFixed(2)}
            </span>
          </div>

          <div className="flex flex-col rounded bg-card-dark/80 p-2 border border-border-subtle/80">
            <span className="text-[10px] text-muted-text uppercase font-semibold">Stop Loss</span>
            <span className="font-financial font-medium text-accent-short text-sm">
              ${stopLoss.toFixed(2)}
            </span>
          </div>

          <div className="flex flex-col rounded bg-card-dark/80 p-2 border border-border-subtle/80">
            <span className="text-[10px] text-muted-text uppercase font-semibold">Target</span>
            <span className="font-financial font-medium text-accent-long text-sm">
              ${takeProfit.toFixed(2)}
            </span>
          </div>

          <div className="flex flex-col rounded bg-card-dark/80 p-2 border border-border-subtle/80">
            <span className="text-[10px] text-muted-text uppercase font-semibold">R:R Ratio</span>
            <span className="font-financial font-bold text-accent-long text-sm">
              1:{rr > 0 ? rr.toFixed(2) : '—'}
            </span>
          </div>
        </div>

        {/* Rapid Trade Checklist */}
        {checklist.length > 0 && (
          <div className="px-4 py-2.5 bg-card-dark border-b border-border-subtle flex flex-col gap-1.5">
            <span className="text-[10px] font-semibold text-muted-text uppercase tracking-wider">
              Execution Validation Checklist
            </span>
            <div className="flex flex-wrap gap-2">
              {checklist.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-1.5 text-xs bg-surface-dark px-2.5 py-1 rounded-md border border-border-subtle text-secondary-text"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 text-accent-long shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Synthesis Tabs Navigation */}
        <div className="flex items-center border-b border-border-subtle bg-surface-dark/95 px-4 gap-1 text-xs overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('chart')}
            className={cn(
              'flex items-center gap-1.5 py-2.5 px-3 border-b-2 font-medium transition-colors whitespace-nowrap',
              activeTab === 'chart'
                ? 'border-accent-long text-accent-long'
                : 'border-transparent text-muted-text hover:text-foreground'
            )}
          >
            <BarChart2 className="h-3.5 w-3.5" />
            <span>Interactive Chart</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('thesis')}
            className={cn(
              'flex items-center gap-1.5 py-2.5 px-3 border-b-2 font-medium transition-colors whitespace-nowrap',
              activeTab === 'thesis'
                ? 'border-accent-long text-accent-long'
                : 'border-transparent text-muted-text hover:text-foreground'
            )}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>AI Thesis</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('risks')}
            className={cn(
              'flex items-center gap-1.5 py-2.5 px-3 border-b-2 font-medium transition-colors whitespace-nowrap',
              activeTab === 'risks'
                ? 'border-accent-long text-accent-long'
                : 'border-transparent text-muted-text hover:text-foreground'
            )}
          >
            <ShieldAlert className="h-3.5 w-3.5" />
            <span>Risk Factors</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('indicators')}
            className={cn(
              'flex items-center gap-1.5 py-2.5 px-3 border-b-2 font-medium transition-colors whitespace-nowrap',
              activeTab === 'indicators'
                ? 'border-accent-long text-accent-long'
                : 'border-transparent text-muted-text hover:text-foreground'
            )}
          >
            <Activity className="h-3.5 w-3.5" />
            <span>Indicators</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('raw')}
            className={cn(
              'flex items-center gap-1.5 py-2.5 px-3 border-b-2 font-medium transition-colors whitespace-nowrap',
              activeTab === 'raw'
                ? 'border-accent-long text-accent-long'
                : 'border-transparent text-muted-text hover:text-foreground'
            )}
          >
            <FileText className="h-3.5 w-3.5" />
            <span>Raw Report</span>
          </button>
        </div>

        {/* Tab Content Panes */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 select-text">
          {/* TAB 1: INTERACTIVE CHART */}
          {activeTab === 'chart' && (
            <div className="flex flex-col gap-4">
              <div className="rounded-xl border border-border-subtle bg-surface-dark p-2 overflow-hidden shadow-inner">
                <div ref={chartContainerRef} className="w-full h-[320px]" />
              </div>

              <div className="flex items-center justify-between text-xs text-muted-text px-1">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-3 bg-blue-500 rounded-xs" />
                    <span>Entry Target (${entryPrice.toFixed(2)})</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-3 bg-accent-short rounded-xs" />
                    <span>Stop Loss (${stopLoss.toFixed(2)})</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-3 bg-accent-long rounded-xs" />
                    <span>Target (${takeProfit.toFixed(2)})</span>
                  </div>
                </div>
                <span className="font-financial text-[11px]">30D DAILY CANDLES</span>
              </div>

              {/* Catalyst Box */}
              <div className="rounded-lg border border-border-subtle bg-surface-dark/80 p-3.5 flex flex-col gap-1.5">
                <span className="text-[10px] font-bold text-accent-long uppercase tracking-wider">
                  Primary Catalyst
                </span>
                <p className="text-xs text-foreground leading-relaxed">{trade.catalyst}</p>
              </div>
            </div>
          )}

          {/* TAB 2: AI THESIS */}
          {activeTab === 'thesis' && (
            <div className="flex flex-col gap-4">
              <div className="rounded-xl border border-border-subtle bg-surface-dark/80 p-4 flex flex-col gap-3">
                <div className="flex items-center gap-2 text-accent-long font-semibold text-xs uppercase tracking-wide">
                  <Sparkles className="h-4 w-4" />
                  <span>Institutional Investment Thesis</span>
                </div>
                <p className="text-xs text-foreground leading-relaxed font-sans">
                  {trade.ai_thesis ||
                    trade.catalyst ||
                    'Strong trend structure aligning with sector accumulation. Technical triggers confirm momentum expansion with acceptable risk-reward profile.'}
                </p>
              </div>

              <div className="rounded-xl border border-border-subtle bg-surface-dark/50 p-4 flex flex-col gap-2">
                <span className="text-[11px] font-semibold text-muted-text uppercase">
                  Conviction Scoring Logic
                </span>
                <div className="flex items-center justify-between py-2 border-b border-border-subtle/60 text-xs">
                  <span className="text-secondary-text">Confidence Level</span>
                  <span className="font-financial font-bold text-foreground">
                    {score.toFixed(1)} / 10.0
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border-subtle/60 text-xs">
                  <span className="text-secondary-text">Classification Grade</span>
                  <span className="font-semibold text-accent-long">{grade}</span>
                </div>
                <div className="flex items-center justify-between py-2 text-xs">
                  <span className="text-secondary-text">Recommended Action</span>
                  <span className="font-semibold text-foreground">
                    {isBullish ? 'Scale into Long at Entry Target' : isBearish ? 'Reduce Exposure / Short' : 'Watch Range'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: RISK FACTORS */}
          {activeTab === 'risks' && (
            <div className="flex flex-col gap-4">
              <div className="rounded-xl border border-accent-short/30 bg-accent-short/5 p-4 flex flex-col gap-2">
                <div className="flex items-center gap-2 text-accent-short font-semibold text-xs uppercase tracking-wide">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Risk Warning &amp; Defense Protocols</span>
                </div>
                <p className="text-xs text-foreground leading-relaxed">
                  {trade.risk_summary || trade.riskSummary || 'Standard market and volatility risks apply.'}
                </p>
              </div>

              <div className="rounded-xl border border-border-subtle bg-surface-dark/60 p-4 flex flex-col gap-2.5">
                <span className="text-[11px] font-semibold text-muted-text uppercase">
                  Risk Containment Parameters
                </span>
                <div className="flex items-center justify-between text-xs py-1.5 border-b border-border-subtle/60">
                  <span className="text-secondary-text">Hard Stop Price</span>
                  <span className="font-financial font-bold text-accent-short">
                    ${stopLoss.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs py-1.5 border-b border-border-subtle/60">
                  <span className="text-secondary-text">Risk Per Share</span>
                  <span className="font-financial text-secondary-text">
                    ${Math.abs(entryPrice - stopLoss).toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs py-1.5">
                  <span className="text-secondary-text">Reward Potential Per Share</span>
                  <span className="font-financial text-accent-long font-medium">
                    ${Math.abs(takeProfit - entryPrice).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: TECHNICAL INDICATORS */}
          {activeTab === 'indicators' && (
            <div className="flex flex-col gap-3">
              {activeQuoteEntry?.status === 'hydrating' || activeQuoteEntry?.status === 'pending' ? (
                <div className="rounded-xl border border-border-subtle bg-surface-dark/70 p-8 flex flex-col items-center justify-center gap-2">
                  <Loader2 className="h-6 w-6 animate-spin text-accent-long" />
                  <span className="text-xs text-muted-text">Computing live indicators from market history...</span>
                </div>
              ) : (
                <div className="rounded-xl border border-border-subtle bg-surface-dark/70 overflow-hidden">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border-subtle bg-card-dark text-[10px] text-muted-text uppercase font-semibold">
                        <th className="py-2.5 px-3 text-left">Indicator</th>
                        <th className="py-2.5 px-3 text-right">Value</th>
                        <th className="py-2.5 px-3 text-right">Interpretation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-subtle/60">
                      <tr>
                        <td className="py-2.5 px-3 font-medium text-foreground">RSI (14)</td>
                        <td className="py-2.5 px-3 text-right font-financial">
                          {activeQuoteEntry?.technicals?.rsi14 ?? '—'}
                        </td>
                        <td
                          className={cn(
                            'py-2.5 px-3 text-right font-medium',
                            activeQuoteEntry?.technicals?.rsiSignal === 'oversold'
                              ? 'text-accent-long'
                              : activeQuoteEntry?.technicals?.rsiSignal === 'overbought'
                              ? 'text-accent-short'
                              : 'text-secondary-text'
                          )}
                        >
                          {activeQuoteEntry?.technicals?.rsiSignal === 'oversold'
                            ? 'Oversold (Rebound Potential)'
                            : activeQuoteEntry?.technicals?.rsiSignal === 'overbought'
                            ? 'Overbought (Caution)'
                            : activeQuoteEntry?.technicals?.rsi14
                            ? 'Neutral'
                            : 'Awaiting data'}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3 font-medium text-foreground">20 EMA</td>
                        <td className="py-2.5 px-3 text-right font-financial">
                          {activeQuoteEntry?.technicals?.ema20
                            ? `$${activeQuoteEntry.technicals.ema20.toFixed(2)}`
                            : '—'}
                        </td>
                        <td
                          className={cn(
                            'py-2.5 px-3 text-right font-medium',
                            activeQuoteEntry?.technicals?.aboveEma20 ? 'text-accent-long' : 'text-accent-short'
                          )}
                        >
                          {activeQuoteEntry?.technicals?.ema20
                            ? activeQuoteEntry.technicals.aboveEma20
                              ? 'Above 20 EMA (Bullish)'
                              : 'Below 20 EMA (Bearish)'
                            : '—'}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3 font-medium text-foreground">50 EMA</td>
                        <td className="py-2.5 px-3 text-right font-financial">
                          {activeQuoteEntry?.technicals?.ema50
                            ? `$${activeQuoteEntry.technicals.ema50.toFixed(2)}`
                            : '—'}
                        </td>
                        <td
                          className={cn(
                            'py-2.5 px-3 text-right font-medium',
                            activeQuoteEntry?.technicals?.aboveEma50 ? 'text-accent-long' : 'text-accent-short'
                          )}
                        >
                          {activeQuoteEntry?.technicals?.ema50
                            ? activeQuoteEntry.technicals.aboveEma50
                              ? 'Above 50 EMA (Trend Intact)'
                              : 'Below 50 EMA (Under Pressure)'
                            : '—'}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3 font-medium text-foreground">ATR (14 Volatility)</td>
                        <td className="py-2.5 px-3 text-right font-financial">
                          {activeQuoteEntry?.technicals?.atr14
                            ? `$${activeQuoteEntry.technicals.atr14.toFixed(2)}`
                            : '—'}
                        </td>
                        <td className="py-2.5 px-3 text-right text-secondary-text font-medium">Daily Range Expectation</td>
                      </tr>
                      {activeQuoteEntry?.quote?.volume && (
                        <tr>
                          <td className="py-2.5 px-3 font-medium text-foreground">Volume</td>
                          <td className="py-2.5 px-3 text-right font-financial">
                            {activeQuoteEntry.quote.volume.toLocaleString()}
                          </td>
                          <td className="py-2.5 px-3 text-right text-secondary-text font-medium">Shares Traded</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: RAW REPORT */}
          {activeTab === 'raw' && (
            <div className="prose prose-invert prose-sm max-w-none text-xs leading-relaxed text-secondary-text">
              {trade.raw_markdown || trade.rawMarkdown ? (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h1: ({ ...props }) => (
                      <h1 className="text-sm font-bold text-foreground border-b border-border-subtle pb-1 mt-3 mb-2" {...props} />
                    ),
                    h2: ({ ...props }) => (
                      <h2 className="text-xs font-bold text-accent-long mt-3 mb-1.5 uppercase tracking-wide" {...props} />
                    ),
                    h3: ({ ...props }) => (
                      <h3 className="text-xs font-semibold text-foreground mt-2 mb-1" {...props} />
                    ),
                    p: ({ ...props }) => <p className="mb-2 leading-relaxed" {...props} />,
                    ul: ({ ...props }) => <ul className="list-disc pl-4 mb-2 space-y-1" {...props} />,
                    li: ({ ...props }) => <li className="text-secondary-text" {...props} />,
                    blockquote: ({ ...props }) => (
                      <blockquote className="border-l-2 border-accent-long pl-3 my-2 italic text-muted-text bg-surface-dark/50 py-1 rounded-r" {...props} />
                    ),
                  }}
                >
                  {trade.raw_markdown || trade.rawMarkdown || ''}
                </ReactMarkdown>
              ) : (
                <div className="py-8 text-center text-muted-text">
                  <span>No raw markdown content available for this record.</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};
