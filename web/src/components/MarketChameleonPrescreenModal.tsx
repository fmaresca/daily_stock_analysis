import React, { useState, useEffect } from 'react';
import {
  MARKET_CHAMELEON_CATEGORIES,
  DEFAULT_MARKET_CHAMELEON_PRESETS,
  MarketChameleonPreset,
  CategorySpec,
} from '../types/marketChameleonPrescreen';
import {
  Sliders,
  CheckCircle2,
  Bookmark,
  Plus,
  Trash2,
  RotateCcw,
  Zap,
  Layers,
  ShieldCheck,
  TrendingUp,
  Award,
  ExternalLink,
} from './icons';

interface MarketChameleonPrescreenModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeFilters?: Record<string, string>;
  currentFilters?: Record<string, string>;
  cboeOnly?: boolean;
  currentCboeOnly?: boolean;
  onApplyPreset: (filters: Record<string, string>, cboeOnly: boolean, presetName?: string) => void;
}

const STORAGE_KEY = 'deltaharvest_mc_screener_presets';

export const MarketChameleonPrescreenModal: React.FC<MarketChameleonPrescreenModalProps> = ({
  isOpen,
  onClose,
  activeFilters: activeFiltersProp,
  currentFilters: currentFiltersProp,
  cboeOnly = false,
  currentCboeOnly: currentCboeOnlyProp,
  onApplyPreset,
}) => {
  const incomingFilters = currentFiltersProp || activeFiltersProp || DEFAULT_MARKET_CHAMELEON_PRESETS[0].filters;
  const incomingCboe = currentCboeOnlyProp !== undefined ? currentCboeOnlyProp : cboeOnly;

  const [presets, setPresets] = useState<MarketChameleonPreset[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Failed to load saved MarketChameleon presets:', e);
    }
    return DEFAULT_MARKET_CHAMELEON_PRESETS;
  });

  const [selectedPresetId, setSelectedPresetId] = useState<string>(DEFAULT_MARKET_CHAMELEON_PRESETS[0].id);
  const [currentFilters, setCurrentFilters] = useState<Record<string, string>>(incomingFilters);
  const [currentCboeOnly, setCurrentCboeOnly] = useState<boolean>(incomingCboe);
  const [newPresetName, setNewPresetName] = useState<string>('');
  const [showSaveNew, setShowSaveNew] = useState<boolean>(false);
  const [statusMsg, setStatusMsg] = useState<string>('');

  // Sync state when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentFilters(incomingFilters);
      setCurrentCboeOnly(incomingCboe);
    }
  }, [isOpen, incomingFilters, incomingCboe]);

  // Persist presets
  const savePresetsToStorage = (updated: MarketChameleonPreset[]) => {
    setPresets(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to save MarketChameleon presets:', e);
    }
  };

  if (!isOpen) return null;

  // Handle Preset Switching
  const handleSelectPreset = (presetId: string) => {
    const target = presets.find((p) => p.id === presetId);
    if (!target) return;
    setSelectedPresetId(target.id);
    setCurrentFilters({ ...target.filters });
    setCurrentCboeOnly(target.cboeOnly);
    setStatusMsg(`Loaded preset "${target.name}"`);
    setTimeout(() => setStatusMsg(''), 3000);
  };

  // Handle Value Change
  const handleFilterChange = (key: string, value: string) => {
    setCurrentFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // Save New Custom Preset
  const handleSaveNewPreset = () => {
    const trimmed = newPresetName.trim();
    if (!trimmed) return;

    const newPreset: MarketChameleonPreset = {
      id: `mc_custom_${Date.now()}`,
      name: trimmed,
      description: 'Custom user prescreen configured via MarketChameleon Prescreen Builder',
      filters: { ...currentFilters },
      cboeOnly: currentCboeOnly,
      isDefault: false,
      updatedAt: new Date().toISOString(),
    };

    const updated = [...presets, newPreset];
    savePresetsToStorage(updated);
    setSelectedPresetId(newPreset.id);
    setNewPresetName('');
    setShowSaveNew(false);
    setStatusMsg(`Saved new preset "${trimmed}"!`);
    setTimeout(() => setStatusMsg(''), 4000);
  };

  // Overwrite Current Preset
  const handleOverwriteCurrentPreset = () => {
    const active = presets.find((p) => p.id === selectedPresetId);
    if (!active || active.isDefault) {
      alert('Default built-in presets cannot be overwritten. Click "+ Save as New Preset" instead.');
      return;
    }

    const updated = presets.map((p) =>
      p.id === selectedPresetId
        ? {
            ...p,
            filters: { ...currentFilters },
            cboeOnly: currentCboeOnly,
            updatedAt: new Date().toISOString(),
          }
        : p
    );
    savePresetsToStorage(updated);
    setStatusMsg(`Updated preset "${active.name}"!`);
    setTimeout(() => setStatusMsg(''), 4000);
  };

  // Delete Custom Preset
  const handleDeletePreset = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const target = presets.find((p) => p.id === id);
    if (target?.isDefault) {
      alert('Built-in presets cannot be removed.');
      return;
    }
    if (!confirm(`Are you sure you want to delete preset "${target?.name}"?`)) return;

    const updated = presets.filter((p) => p.id !== id);
    savePresetsToStorage(updated);
    setSelectedPresetId(updated[0]?.id || DEFAULT_MARKET_CHAMELEON_PRESETS[0].id);
    setStatusMsg('Preset deleted.');
    setTimeout(() => setStatusMsg(''), 3000);
  };

  // Reset to Factory Default Momentum
  const handleResetToDefault = () => {
    const def = DEFAULT_MARKET_CHAMELEON_PRESETS[0];
    setSelectedPresetId(def.id);
    setCurrentFilters({ ...def.filters });
    setCurrentCboeOnly(def.cboeOnly);
    setStatusMsg('Reset to default MarketChameleon criteria.');
    setTimeout(() => setStatusMsg(''), 3000);
  };

  // Apply and Run Screener
  const handleApplyAndRun = () => {
    const activePreset = presets.find((p) => p.id === selectedPresetId);
    const presetName = activePreset?.name || 'Custom Prescreen';
    onApplyPreset(currentFilters, currentCboeOnly, presetName);
    onClose();
  };

  // Group Categories
  const stockAttrs = MARKET_CHAMELEON_CATEGORIES.filter((c) => c.category === 'Stock Attributes');
  const techAttrs = MARKET_CHAMELEON_CATEGORIES.filter((c) => c.category === 'Technical' || c.category === 'Price, Volume & Technical');
  const volAttrs = MARKET_CHAMELEON_CATEGORIES.filter((c) => c.category === 'Volatility');
  const optAttrs = MARKET_CHAMELEON_CATEGORIES.filter((c) => c.category === 'Options Liquidity');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="glass-panel w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl border border-purple-800/80 shadow-2xl bg-gradient-to-b from-slate-900/98 via-slate-900/95 to-slate-950/98 overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800/90 flex items-center justify-between bg-purple-950/30">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600/30 border border-purple-500/50 flex items-center justify-center shadow-lg shadow-purple-600/20">
              <Sliders className="w-5 h-5 text-purple-300" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-black text-white tracking-tight">
                  MarketChameleon Prescreen Builder &amp; Preset Manager
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                  Native Filter Mapping
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Configure native MarketChameleon categories, verify weekly options against CBOE, save presets, and run screener.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Preset Selector & Action Strip */}
        <div className="p-4 bg-slate-900/90 border-b border-slate-800/70 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2 flex-1 min-w-[300px]">
            <span className="text-xs font-bold text-slate-300 flex items-center space-x-1.5">
              <Bookmark className="w-3.5 h-3.5 text-purple-400" />
              <span>Saved Preset:</span>
            </span>
            <select
              value={selectedPresetId}
              onChange={(e) => handleSelectPreset(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-none focus:border-purple-500"
            >
              {presets.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.isDefault ? '⭐ ' : '💾 '}
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2">
            {!showSaveNew ? (
              <button
                onClick={() => setShowSaveNew(true)}
                className="flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-purple-950/70 hover:bg-purple-900 border border-purple-500/50 text-purple-200 transition-colors cursor-pointer"
              >
                <Plus className="w-3 h-3 text-purple-300" />
                <span>Save As New Preset</span>
              </button>
            ) : (
              <div className="flex items-center space-x-1.5 animate-fade-in">
                <input
                  type="text"
                  value={newPresetName}
                  onChange={(e) => setNewPresetName(e.target.value)}
                  placeholder="Enter preset name..."
                  className="bg-slate-950 border border-purple-500/70 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none w-48"
                  autoFocus
                />
                <button
                  onClick={handleSaveNewPreset}
                  disabled={!newPresetName.trim()}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white transition-colors cursor-pointer disabled:opacity-50"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setShowSaveNew(false);
                    setNewPresetName('');
                  }}
                  className="text-xs text-slate-400 hover:text-white px-1.5"
                >
                  Cancel
                </button>
              </div>
            )}

            <button
              onClick={handleResetToDefault}
              className="p-1.5 rounded-lg text-slate-400 hover:text-amber-300 hover:bg-slate-800 transition-colors cursor-pointer"
              title="Reset to default criteria"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {statusMsg && (
          <div className="px-5 py-1.5 bg-emerald-500/10 border-b border-emerald-500/20 text-emerald-300 text-xs flex items-center space-x-2 animate-fade-in">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>{statusMsg}</span>
          </div>
        )}

        {/* Form Body - Scrollable */}
        <div className="p-5 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* SECTION 1: CBOE Weekly Options Verification Gate */}
          <div className="p-4 rounded-xl border border-emerald-500/40 bg-emerald-950/20 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-black text-emerald-200 uppercase tracking-wider">
                  CBOE Available Weeklys Directory &amp; Expiration Cadence Screen
                </span>
              </div>
              <span className="text-[10px] font-mono text-emerald-300/80">
                Live CBOE Registry Check
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Cross-reference candidates against the official <strong>CBOE Available Weeklys Directory</strong> and real-time expiration cadence. When enabled, all standard monthly-only stocks (3rd Friday only) are filtered out, displaying only stocks with verified <strong>Weekly</strong> or <strong>Daily / Multi-Weekly</strong> expirations.
            </p>
            <label className="flex items-center space-x-2.5 mt-2 cursor-pointer select-none bg-slate-900/80 p-2.5 rounded-lg border border-emerald-500/30 w-fit">
              <input
                type="checkbox"
                checked={currentCboeOnly}
                onChange={(e) => setCurrentCboeOnly(e.target.checked)}
                className="rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-emerald-500/50 w-4 h-4 cursor-pointer"
              />
              <span className="font-bold text-xs text-emerald-300">
                Strict CBOE Weeklys &amp; Multi-Weekly Expirations Only
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                Recommended
              </span>
            </label>
          </div>

          {/* SECTION 2: Stock Attributes */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2 border-b border-slate-800 pb-1.5">
              <Award className="w-3.5 h-3.5 text-cyan-400" />
              <h4 className="font-bold text-slate-200 text-xs uppercase tracking-wider">
                1. Stock Attributes
              </h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {stockAttrs.map((cat) => (
                <div key={cat.key} className="space-y-1 bg-slate-900/50 p-3 rounded-xl border border-slate-800">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-300 text-xs">{cat.label}</label>
                    <span className="text-[10px] font-mono text-purple-400">{cat.key}</span>
                  </div>
                  <select
                    value={currentFilters[cat.key] || '-Any-'}
                    onChange={(e) => handleFilterChange(cat.key, e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-purple-500 font-sans"
                  >
                    {cat.options.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  {cat.description && (
                    <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">{cat.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 3: Technical & Moving Averages */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2 border-b border-slate-800 pb-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
              <h4 className="font-bold text-slate-200 text-xs uppercase tracking-wider">
                2. Technical &amp; Moving Average Signals
              </h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {techAttrs.map((cat) => (
                <div key={cat.key} className="space-y-1 bg-slate-900/50 p-3 rounded-xl border border-slate-800">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-300 text-xs">{cat.label}</label>
                    <span className="text-[10px] font-mono text-purple-400">{cat.key}</span>
                  </div>
                  <select
                    value={currentFilters[cat.key] || '-Any-'}
                    onChange={(e) => handleFilterChange(cat.key, e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-purple-500 font-sans"
                  >
                    {cat.options.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  {cat.description && (
                    <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">{cat.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 4: Volatility & IV30 */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2 border-b border-slate-800 pb-1.5">
              <Zap className="w-3.5 h-3.5 text-purple-400" />
              <h4 className="font-bold text-slate-200 text-xs uppercase tracking-wider">
                3. Volatility &amp; Implied Volatility (IV30 &amp; Rank)
              </h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
              {volAttrs.map((cat) => (
                <div key={cat.key} className="space-y-1 bg-slate-900/50 p-3 rounded-xl border border-slate-800">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-300 text-xs">{cat.label}</label>
                    <span className="text-[10px] font-mono text-purple-400">{cat.key}</span>
                  </div>
                  <select
                    value={currentFilters[cat.key] || '-Any-'}
                    onChange={(e) => handleFilterChange(cat.key, e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-purple-500 font-sans"
                  >
                    {cat.options.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  {cat.description && (
                    <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">{cat.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3">
          <div className="text-[11px] text-slate-400 font-mono hidden sm:block">
            Endpoint: <code className="text-purple-300">EquityScreener/EquityScreenerData</code>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              onClick={handleApplyAndRun}
              className="flex items-center space-x-2 px-5 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-600/30 transition-all cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 text-amber-300" />
              <span>Save &amp; Run Screener</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
