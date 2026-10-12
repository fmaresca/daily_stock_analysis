/**
 * DeltaHarvest — Al Brooks Price Action Analysis
 * Component: PriceActionView (web/src/components/PriceActionView.tsx)
 * 
 * Comprehensive Price Action Analysis Workspace:
 * - Ticker selector with watchlist context prefill & quick-picks
 * - Integrated PriceActionChart with non-repainting overlays (20 EMA, Swings, Setups)
 * - Detailed Setup List Panel with entry, invalidation, target, and human-readable rationale
 * - Filtering and inspection synchronization
 * - Regulatory and educational methodology citations
 * 
 * Notice:
 * Not Financial Advice. All pattern annotations and targets are probabilistic
 * heuristics for observational and analytical study only.
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { CanonicalBar } from '../priceAction/bars.ts';
import { fetchCanonicalBars } from '../priceAction/bars.ts';
import {
  runPriceActionDetection,
  type DetectionResult,
  type PriceActionSetup,
  type PriceActionConfig,
  DEFAULT_PRICE_ACTION_CONFIG,
} from '../priceAction/detect.ts';
import {
  evaluateMarketRegime,
  getRegimeHistory,
  recordRegimeHistory,
  type MarketRegime,
  type RegimeHistoryEntry,
} from '../priceAction/regime.ts';
import {
  loadAlertSettings,
  saveAlertSettings,
  type PriceActionAlertSettings,
} from '../priceAction/alerts.ts';
import { PriceActionChart } from './priceAction/PriceActionChart.tsx';
import {
  TrendingUp,
  ShieldAlert,
  ShieldCheck,
  RefreshCw,
  Search,
  Sliders,
  Filter,
  Sparkles,
  ExternalLink,
  Bell,
} from './icons.tsx';

export interface PriceActionViewProps {
  initialSymbol?: string;
  watchlistSymbols?: string[];
  initialRegime?: MarketRegime;
  onOpenTickerAudit?: (symbol: string) => void;
}

const DEFAULT_POPULAR_TICKERS = ['SPY', 'QQQ', 'AAPL', 'MSFT', 'NVDA', 'TSLA', 'AMZN', 'META'];

export const PriceActionView: React.FC<PriceActionViewProps> = ({
  initialSymbol = 'SPY',
  watchlistSymbols = [],
  initialRegime,
  onOpenTickerAudit,
}) => {
  const [symbol, setSymbol] = useState<string>(() => {
    return (initialSymbol || 'SPY').trim().toUpperCase();
  });
  const [inputSymbol, setInputSymbol] = useState<string>(symbol);

  // Synchronize when initialSymbol changes from upstream deep-link
  useEffect(() => {
    if (initialSymbol && initialSymbol.trim().toUpperCase() !== symbol) {
      const clean = initialSymbol.trim().toUpperCase();
      setSymbol(clean);
      setInputSymbol(clean);
    }
  }, [initialSymbol]);

  // Data fetching state
  const [bars, setBars] = useState<CanonicalBar[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSetup, setActiveSetup] = useState<PriceActionSetup | null>(null);
  const [setupFilter, setSetupFilter] = useState<'ALL' | 'BULL' | 'BEAR'>('ALL');

  // Config state
  const [config, setConfig] = useState<PriceActionConfig>(DEFAULT_PRICE_ACTION_CONFIG);
  const [showConfigDrawer, setShowConfigDrawer] = useState<boolean>(false);

  // Alert settings state (Prompt 8)
  const [alertSettings, setAlertSettings] = useState<PriceActionAlertSettings>(() => loadAlertSettings());
  const [showAlertDrawer, setShowAlertDrawer] = useState<boolean>(false);

  const handleUpdateAlertSettings = (updated: PriceActionAlertSettings) => {
    setAlertSettings(updated);
    saveAlertSettings(updated);
  };

  // Market Regime state (Prompt 7)
  const [regime, setRegime] = useState<MarketRegime | null>(() => initialRegime || null);
  const [, setRegimeHistory] = useState<RegimeHistoryEntry[]>(() => getRegimeHistory());

  useEffect(() => {
    let isMounted = true;
    async function loadRegime() {
      try {
        const resp = await fetch('/api/price-action/regime');
        if (resp.ok) {
          const data = await resp.json();
          if (data?.success && data?.regime && isMounted) {
            setRegime(data.regime);
            const updated = recordRegimeHistory(data.regime.asOfBarDate, data.regime);
            setRegimeHistory(updated);
            return;
          }
        }
      } catch {
        // Fallback to client evaluation below
      }

      // Client-side fallback using SPY and QQQ
      try {
        const [spyRes, qqqRes] = await Promise.all([
          fetchCanonicalBars('SPY'),
          fetchCanonicalBars('QQQ'),
        ]);
        if (isMounted && spyRes.bars.length > 0 && qqqRes.bars.length > 0) {
          const evalRegime = evaluateMarketRegime(spyRes.bars, qqqRes.bars);
          setRegime(evalRegime);
          const updated = recordRegimeHistory(evalRegime.asOfBarDate, evalRegime);
          setRegimeHistory(updated);
        }
      } catch (err) {
        console.warn('Market regime evaluation notice:', err);
      }
    }
    loadRegime();
    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch price action bars
  const loadBars = useCallback(async (targetSymbol: string) => {
    const cleanSym = targetSymbol.trim().toUpperCase();
    if (!cleanSym) return;

    setIsLoading(true);
    setError(null);
    setActiveSetup(null);

    try {
      const report = await fetchCanonicalBars(cleanSym);
      if (report.isValid && report.bars.length > 0) {
        setBars(report.bars);
      } else if (report.bars.length > 0) {
        // Tolerated bars with minor warnings
        setBars(report.bars);
      } else {
        setError(`Unable to load price action history for ${cleanSym}. ${report.issues[0] || 'No daily bars returned.'}`);
        setBars([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to load market data for ${cleanSym}`);
      setBars([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Trigger load on symbol change
  useEffect(() => {
    loadBars(symbol);
  }, [symbol, loadBars]);

  // Handle ticker search form submission
  const handleSubmitSymbol = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = inputSymbol.trim().toUpperCase();
    if (clean && clean !== symbol) {
      setSymbol(clean);
    }
  };

  // Run detection
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

  // Filtered setups list
  const filteredSetups = useMemo(() => {
    if (setupFilter === 'ALL') return detectionResult.setups;
    return detectionResult.setups.filter((s) => s.direction === setupFilter);
  }, [detectionResult.setups, setupFilter]);

  const bullCount = useMemo(
    () => detectionResult.setups.filter((s) => s.direction === 'BULL').length,
    [detectionResult.setups]
  );
  const bearCount = useMemo(
    () => detectionResult.setups.filter((s) => s.direction === 'BEAR').length,
    [detectionResult.setups]
  );

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* Top Controls & Ticker Selection Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-4 bg-slate-900/80 border border-slate-800 rounded-2xl shadow-xl backdrop-blur-md">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-600/30">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">Price Action Lab</h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  Al Brooks Method
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Bar-by-bar trend swings, pullbacks, breakouts &amp; measured moves
              </p>
            </div>
          </div>

          {/* Quick-Pick Pills */}
          <div className="hidden sm:flex items-center gap-1.5 pl-2 border-l border-slate-800 overflow-x-auto">
            {DEFAULT_POPULAR_TICKERS.map((sym) => (
              <button
                key={sym}
                type="button"
                onClick={() => {
                  setSymbol(sym);
                  setInputSymbol(sym);
                }}
                className={`px-2.5 py-1 text-xs font-mono font-bold rounded-lg transition-all ${
                  symbol === sym
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-1 ring-emerald-400'
                    : 'bg-slate-950/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
                }`}
              >
                {sym}
              </button>
            ))}
          </div>
        </div>

        {/* Ticker Search & Config Buttons */}
        <div className="flex items-center gap-2">
          <form onSubmit={handleSubmitSymbol} className="relative flex items-center">
            <input
              type="text"
              value={inputSymbol}
              onChange={(e) => setInputSymbol(e.target.value.toUpperCase())}
              placeholder="Ticker (e.g. AAPL)"
              className="w-36 sm:w-44 px-3 py-1.5 pl-8 text-xs font-mono font-bold uppercase rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 pointer-events-none" />
            <button
              type="submit"
              className="ml-1.5 px-3 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-all shadow"
            >
              Analyze
            </button>
          </form>

          {onOpenTickerAudit && (
            <button
              type="button"
              onClick={() => onOpenTickerAudit(symbol)}
              title={`Open comprehensive audit modal for ${symbol}`}
              className="px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 flex items-center gap-1 transition-colors"
            >
              <span>Audit</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </button>
          )}

          <button
            type="button"
            onClick={() => loadBars(symbol)}
            title="Refresh Price Bars"
            className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
          </button>

          <button
            type="button"
            onClick={() => setShowConfigDrawer(!showConfigDrawer)}
            title="Adjust Detection Parameters"
            className={`p-2 rounded-xl border transition-colors ${
              showConfigDrawer
                ? 'bg-emerald-950/60 text-emerald-400 border-emerald-700'
                : 'text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 border-slate-700'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => setShowAlertDrawer(!showAlertDrawer)}
            title="Configure Price Action Alerts & Regime Filters"
            className={`p-2 rounded-xl border transition-colors ${
              showAlertDrawer
                ? 'bg-emerald-950/60 text-emerald-400 border-emerald-700'
                : 'text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 border-slate-700'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Optional Detection Parameters Drawer */}
      {showConfigDrawer && (
        <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl space-y-3 backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-400" />
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Detection Parameter Tuning
              </h4>
            </div>
            <button
              type="button"
              onClick={() => setConfig(DEFAULT_PRICE_ACTION_CONFIG)}
              className="text-[11px] text-emerald-400 hover:underline"
            >
              Reset to Defaults
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="text-slate-400 block mb-1">Trend Body Min Ratio</label>
              <input
                type="number"
                step="0.05"
                min="0.3"
                max="0.8"
                value={config.trendBodyMinRatio}
                onChange={(e) =>
                  setConfig({ ...config, trendBodyMinRatio: parseFloat(e.target.value) || 0.5 })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-slate-200 font-mono"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Swing Lag Lookback (N)</label>
              <input
                type="number"
                step="1"
                min="1"
                max="5"
                value={config.swingPivotLookback}
                onChange={(e) =>
                  setConfig({ ...config, swingPivotLookback: parseInt(e.target.value, 10) || 2 })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-slate-200 font-mono"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">EMA Period</label>
              <input
                type="number"
                step="1"
                min="5"
                max="50"
                value={config.emaPeriod}
                onChange={(e) =>
                  setConfig({ ...config, emaPeriod: parseInt(e.target.value, 10) || 20 })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-slate-200 font-mono"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Max Pullback Bars</label>
              <input
                type="number"
                step="1"
                min="3"
                max="15"
                value={config.maxPullbackBars}
                onChange={(e) =>
                  setConfig({ ...config, maxPullbackBars: parseInt(e.target.value, 10) || 8 })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-slate-200 font-mono"
              />
            </div>
          </div>
        </div>
      )}

      {/* Alert Preferences Drawer (Prompt 8) */}
      {showAlertDrawer && (
        <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl space-y-4 backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-emerald-400" />
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Setup Alerts &amp; Regime Filter Preferences
              </h4>
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={alertSettings.enabled}
                  onChange={(e) =>
                    handleUpdateAlertSettings({ ...alertSettings, enabled: e.target.checked })
                  }
                  className="rounded border-slate-700 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="font-semibold">Enable Price Action Alerts</span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            {/* Column 1: Universe & Cooldown */}
            <div className="space-y-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
              <h5 className="font-bold text-slate-200">Alert Scope &amp; Timing</h5>
              <div>
                <label className="text-slate-400 block mb-1">Alert Universe</label>
                <select
                  value={alertSettings.alertUniverse}
                  onChange={(e) =>
                    handleUpdateAlertSettings({
                      ...alertSettings,
                      alertUniverse: e.target.value as 'WATCHLIST' | 'TOP_TICKERS' | 'CUSTOM',
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-slate-200 font-medium"
                >
                  <option value="WATCHLIST">Watchlist Symbols (Recommended)</option>
                  <option value="TOP_TICKERS">Mega-Cap Index Leaders (SPY, QQQ, AAPL...)</option>
                  <option value="CUSTOM">Custom Symbol List</option>
                </select>
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Directional Cooldown (Bars)</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={alertSettings.cooldownBars}
                  onChange={(e) =>
                    handleUpdateAlertSettings({
                      ...alertSettings,
                      cooldownBars: parseInt(e.target.value, 10) || 5,
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-slate-200 font-mono"
                />
                <span className="text-[10px] text-slate-500">Suppresses duplicate alerts within N bars</span>
              </div>
              <div>
                <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={alertSettings.respectQuietHours}
                    onChange={(e) =>
                      handleUpdateAlertSettings({ ...alertSettings, respectQuietHours: e.target.checked })
                    }
                    className="rounded border-slate-700 text-emerald-600"
                  />
                  <span>Respect Quiet Hours (22:00 - 07:00)</span>
                </label>
              </div>
            </div>

            {/* Column 2: Regime Filter Toggles */}
            <div className="space-y-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
              <h5 className="font-bold text-slate-200">Market Regime Filters</h5>
              <div className="space-y-2">
                <label className="flex items-start gap-2 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={alertSettings.filterLongByRegime}
                    onChange={(e) =>
                      handleUpdateAlertSettings({ ...alertSettings, filterLongByRegime: e.target.checked })
                    }
                    className="mt-0.5 rounded border-slate-700 text-emerald-600"
                  />
                  <div>
                    <span className="font-medium">Filter Long Setups</span>
                    <p className="text-[10px] text-slate-400">Requires SPX bull trend (or range with agreement)</p>
                  </div>
                </label>
                <label className="flex items-start gap-2 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={alertSettings.filterShortByRegime}
                    onChange={(e) =>
                      handleUpdateAlertSettings({ ...alertSettings, filterShortByRegime: e.target.checked })
                    }
                    className="mt-0.5 rounded border-slate-700 text-emerald-600"
                  />
                  <div>
                    <span className="font-medium">Filter Short Setups</span>
                    <p className="text-[10px] text-slate-400">Requires SPX bear trend</p>
                  </div>
                </label>
                <label className="flex items-start gap-2 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={alertSettings.blockBreakoutsInRange}
                    onChange={(e) =>
                      handleUpdateAlertSettings({ ...alertSettings, blockBreakoutsInRange: e.target.checked })
                    }
                    className="mt-0.5 rounded border-slate-700 text-emerald-600"
                  />
                  <div>
                    <span className="font-medium">Block Breakouts in Range</span>
                    <p className="text-[10px] text-slate-400">Suppresses breakout alerts during market consolidation</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Column 3: Dispatch Channels */}
            <div className="space-y-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
              <h5 className="font-bold text-slate-200">Notification Channels</h5>
              <div className="space-y-2">
                <div>
                  <label className="flex items-center gap-2 text-slate-300 cursor-pointer mb-1">
                    <input
                      type="checkbox"
                      checked={alertSettings.enableDiscord}
                      onChange={(e) =>
                        handleUpdateAlertSettings({ ...alertSettings, enableDiscord: e.target.checked })
                      }
                      className="rounded border-slate-700 text-emerald-600"
                    />
                    <span className="font-medium">Discord Webhook</span>
                  </label>
                  {alertSettings.enableDiscord && (
                    <input
                      type="url"
                      placeholder="https://discord.com/api/webhooks/..."
                      value={alertSettings.discordWebhookUrl}
                      onChange={(e) =>
                        handleUpdateAlertSettings({ ...alertSettings, discordWebhookUrl: e.target.value })
                      }
                      className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-[11px] text-slate-200"
                    />
                  )}
                </div>

                <div>
                  <label className="flex items-center gap-2 text-slate-300 cursor-pointer mb-1">
                    <input
                      type="checkbox"
                      checked={alertSettings.enableBrowser}
                      onChange={(e) =>
                        handleUpdateAlertSettings({ ...alertSettings, enableBrowser: e.target.checked })
                      }
                      className="rounded border-slate-700 text-emerald-600"
                    />
                    <span className="font-medium">Browser Push Notification</span>
                  </label>
                </div>

                <div>
                  <label className="flex items-center gap-2 text-slate-300 cursor-pointer mb-1">
                    <input
                      type="checkbox"
                      checked={alertSettings.enableEmail}
                      onChange={(e) =>
                        handleUpdateAlertSettings({ ...alertSettings, enableEmail: e.target.checked })
                      }
                      className="rounded border-slate-700 text-emerald-600"
                    />
                    <span className="font-medium">Email Alerts (Admin Relay)</span>
                  </label>
                  {alertSettings.enableEmail && (
                    <input
                      type="email"
                      placeholder="user@example.com"
                      value={alertSettings.alertEmailAddress}
                      onChange={(e) =>
                        handleUpdateAlertSettings({ ...alertSettings, alertEmailAddress: e.target.value })
                      }
                      className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-[11px] text-slate-200"
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Market Regime Banner (Prompt 7) */}
      {regime && (
        <div className="flex flex-wrap items-center justify-between px-4 py-3 bg-slate-900/90 border border-slate-800 rounded-xl shadow-lg backdrop-blur-md gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700/60">
              Broad Market
            </span>

            {/* SPX Indicator with direct chart link */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setSymbol('SPY');
                  setInputSymbol('SPY');
                }}
                className="font-mono font-bold text-slate-200 hover:text-emerald-400 underline decoration-slate-600 hover:decoration-emerald-400 transition-colors"
                title="Switch chart to SPX (SPY proxy)"
              >
                SPX
              </button>
              <span className="text-slate-500">:</span>
              <span
                className={`font-semibold ${
                  regime.spx.direction === 'BULL'
                    ? 'text-emerald-400'
                    : regime.spx.direction === 'BEAR'
                    ? 'text-rose-400'
                    : 'text-amber-400'
                }`}
              >
                {regime.spx.direction === 'BULL' ? 'bull trend' : regime.spx.direction === 'BEAR' ? 'bear trend' : 'trading range'}
              </span>
              <span className="text-[11px] text-slate-400 font-mono">({regime.spx.phase})</span>
            </div>

            <span className="text-slate-700">·</span>

            {/* NDX Indicator with direct chart link */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setSymbol('QQQ');
                  setInputSymbol('QQQ');
                }}
                className="font-mono font-bold text-slate-200 hover:text-emerald-400 underline decoration-slate-600 hover:decoration-emerald-400 transition-colors"
                title="Switch chart to NDX (QQQ proxy)"
              >
                NDX
              </button>
              <span className="text-slate-500">:</span>
              <span
                className={`font-semibold ${
                  regime.ndx.direction === 'BULL'
                    ? 'text-emerald-400'
                    : regime.ndx.direction === 'BEAR'
                    ? 'text-rose-400'
                    : 'text-amber-400'
                }`}
              >
                {regime.ndx.direction === 'BULL' ? 'bull trend' : regime.ndx.direction === 'BEAR' ? 'bear trend' : 'trading range'}
              </span>
              <span className="text-[11px] text-slate-400 font-mono">({regime.ndx.phase})</span>
            </div>

            <span className="text-slate-700">·</span>

            {/* Agreement Badge */}
            <div className="flex items-center gap-1.5">
              <span
                className={`px-2 py-0.5 rounded-full font-bold uppercase text-[10px] tracking-wide border ${
                  regime.agreement === 'AGREE'
                    ? 'bg-emerald-950/70 text-emerald-400 border-emerald-800/80'
                    : regime.agreement === 'MIXED'
                    ? 'bg-amber-950/70 text-amber-400 border-amber-800/80'
                    : 'bg-rose-950/70 text-rose-400 border-rose-800/80'
                }`}
              >
                {regime.agreement === 'AGREE' ? 'agree' : regime.agreement === 'MIXED' ? 'mixed' : 'conflict'}
              </span>
              {regime.agreement !== 'AGREE' && (
                <span className="text-[11px] text-amber-400/90 font-medium">
                  ({regime.agreement === 'MIXED' ? 'reduce size / wait' : 'sit on hands / hedge'})
                </span>
              )}
            </div>

            <span className="text-slate-400 text-[11px]">
              — as of {regime.asOfBarDate} close
            </span>
          </div>

          {/* Guidance Note */}
          <div className="hidden lg:flex items-center text-[11px] text-slate-400 italic max-w-sm truncate" title={regime.guidanceNote}>
            {regime.guidanceNote}
          </div>
        </div>
      )}

      {/* Main Analysis Grid: Chart Canvas (Left/Top) & Setup List Panel (Right/Bottom) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        {/* Left Column: Lightweight Charts Candlestick Workspace (8 Cols) */}
        <div className="xl:col-span-8">
          <PriceActionChart
            symbol={symbol}
            bars={bars}
            isLoading={isLoading}
            error={error}
            onRetry={() => loadBars(symbol)}
            config={config}
            height={560}
            onSelectSetup={(setup) => setActiveSetup(setup)}
          />
        </div>

        {/* Right Column: Detected Setup Inspection Panel (4 Cols) */}
        <div className="xl:col-span-4 flex flex-col bg-slate-950/90 border border-slate-800 rounded-xl overflow-hidden shadow-2xl backdrop-blur-md">
          {/* Panel Header */}
          <div className="p-3.5 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Pattern Setups ({detectionResult.setups.length})
              </h3>
            </div>

            {/* Filter Buttons */}
            <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[11px]">
              <button
                type="button"
                onClick={() => setSetupFilter('ALL')}
                className={`px-2 py-0.5 font-semibold rounded ${
                  setupFilter === 'ALL'
                    ? 'bg-slate-800 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                All ({detectionResult.setups.length})
              </button>
              <button
                type="button"
                onClick={() => setSetupFilter('BULL')}
                className={`px-2 py-0.5 font-semibold rounded ${
                  setupFilter === 'BULL'
                    ? 'bg-emerald-950 text-emerald-300 shadow'
                    : 'text-slate-400 hover:text-emerald-400'
                }`}
              >
                Bull ({bullCount})
              </button>
              <button
                type="button"
                onClick={() => setSetupFilter('BEAR')}
                className={`px-2 py-0.5 font-semibold rounded ${
                  setupFilter === 'BEAR'
                    ? 'bg-rose-950 text-rose-300 shadow'
                    : 'text-slate-400 hover:text-rose-400'
                }`}
              >
                Bear ({bearCount})
              </button>
            </div>
          </div>

          {/* Setup List Scroll Area */}
          <div className="p-3 flex-1 overflow-y-auto max-h-[500px] space-y-2.5">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-500 gap-2">
                <RefreshCw className="w-5 h-5 animate-spin text-emerald-400" />
                <span className="text-xs">Scanning {symbol} price bars...</span>
              </div>
            ) : filteredSetups.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-500 text-center px-4">
                <ShieldCheck className="w-8 h-8 text-slate-600 mb-2" />
                <span className="text-xs font-semibold text-slate-300">
                  No {setupFilter !== 'ALL' ? setupFilter : ''} Setups Detected
                </span>
                <p className="text-[11px] text-slate-500 mt-1 max-w-xs leading-relaxed">
                  Market is consolidating or bar action does not meet quantitative threshold requirements.
                </p>
              </div>
            ) : (
              filteredSetups.map((s, idx) => {
                const isSelected = activeSetup?.signalBarDate === s.signalBarDate && activeSetup?.type === s.type;
                const isBull = s.direction === 'BULL';

                return (
                  <div
                    key={`${s.type}-${s.signalBarDate}-${idx}`}
                    onClick={() => setActiveSetup(isSelected ? null : s)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? isBull
                          ? 'bg-emerald-950/40 border-emerald-500 ring-1 ring-emerald-400/50 shadow-lg'
                          : 'bg-rose-950/40 border-rose-500 ring-1 ring-rose-400/50 shadow-lg'
                        : 'bg-slate-900/60 hover:bg-slate-900 border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    {/* Setup Header Row */}
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded border ${
                            isBull
                              ? 'bg-emerald-950/80 text-emerald-400 border-emerald-700/60'
                              : 'bg-rose-950/80 text-rose-400 border-rose-700/60'
                          }`}
                        >
                          {s.type}
                        </span>
                        <span className="text-xs font-bold text-white font-mono">{symbol}</span>
                      </div>
                      <span className="text-[11px] font-mono text-slate-400">{s.signalBarDate}</span>
                    </div>

                    {/* Numeric Boundaries: Entry, Invalidation, Target */}
                    <div className="grid grid-cols-3 gap-1.5 text-[11px] font-mono bg-slate-950/60 p-2 rounded-lg border border-slate-800/60 mb-2">
                      <div>
                        <span className="text-slate-500 block text-[9px] uppercase">Entry</span>
                        <span className="text-slate-200 font-bold">${s.entryPrice.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-rose-400/80 block text-[9px] uppercase">Invalidation</span>
                        <span className="text-rose-300 font-bold">${s.invalidationLevel.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-emerald-400/80 block text-[9px] uppercase">Target</span>
                        <span className="text-emerald-300 font-bold">
                          {s.measuredMoveTarget ? `$${s.measuredMoveTarget.toFixed(2)}` : 'N/A'}
                        </span>
                      </div>
                    </div>

                    {/* Detection Rationale */}
                    <p className="text-xs text-slate-300 leading-relaxed mb-1.5">{s.rationale}</p>

                    {/* Probabilistic Confidence Note */}
                    <div className="flex items-center gap-1 text-[10px] text-slate-400 italic">
                      <ShieldAlert className="w-3 h-3 text-amber-500/80 shrink-0" />
                      <span>{s.confidenceNote}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Panel Footer */}
          <div className="p-3 border-t border-slate-800/80 bg-slate-900/40 text-[10px] text-slate-400 flex items-center justify-between">
            <span>Click any setup to inspect levels on chart</span>
            <span className="font-mono text-slate-400">Lag: N=2</span>
          </div>
        </div>
      </div>

      {/* Regulatory & Methodology Citation Card */}
      <div className="p-4 bg-slate-900/40 border border-slate-800 rounded-2xl text-xs text-slate-400 space-y-1.5">
        <div className="flex items-center gap-2 text-slate-300 font-semibold">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Al Brooks Price Action Methodology &amp; Compliance Statement</span>
        </div>
        <p className="leading-relaxed">
          This module implements quantitative heuristics derived from the published concepts of Al Brooks,
          author of <em className="text-slate-300">Reading Price Charts Bar by Bar</em> and the{' '}
          <em className="text-slate-300">Trading Price Action</em> trilogy (John Wiley &amp; Sons).
          All swing pivots, trend legs, and pattern markers are calculated deterministically with a 2-bar lag
          to prevent historical repainting.
        </p>
        <p className="text-[11px] text-amber-400/90 leading-relaxed font-mono">
          Regulatory Notice: Not financial advice. Pattern detections, invalidation boundaries, and measured moves
          are educational mathematical models and do not guarantee future price movement.
        </p>
      </div>
    </div>
  );
};

export default PriceActionView;
