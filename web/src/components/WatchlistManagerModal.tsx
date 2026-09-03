import React, { useState, useRef } from 'react';
import {
  X,
  Plus,
  Trash2,
  Upload,
  Download,
  FileSpreadsheet,
  FileText,
  Star,
  Check,
  AlertTriangle,
  FolderPlus,
  Copy,
  RefreshCw,
  Activity,
  Edit2,
} from './icons';
import { WatchlistGroup, TickerMeta } from '../types/options';
import { parseUploadedFile, downloadSampleTemplate } from '../utils/exportImport';

interface WatchlistManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  watchlistGroups: WatchlistGroup[];
  activeGroupId: string;
  onSelectGroup: (groupId: string) => void;
  onCreateGroup: (name: string, tickers?: string[]) => void;
  onRenameGroup: (groupId: string, newName: string) => void;
  onDeleteGroup: (groupId: string) => void;
  onUpdateGroupTickers: (groupId: string, tickers: string[]) => void;
  availableUniverse: TickerMeta[];
  onAddCustomTickerMeta: (symbol: string) => void;
  onRecalculateTickers?: (tickers: string[]) => Promise<void>;
  isRecalculating?: boolean;
}

export const WatchlistManagerModal: React.FC<WatchlistManagerModalProps> = ({
  isOpen,
  onClose,
  watchlistGroups,
  activeGroupId,
  onSelectGroup,
  onCreateGroup,
  onRenameGroup,
  onDeleteGroup,
  onUpdateGroupTickers,
  availableUniverse,
  onAddCustomTickerMeta,
  onRecalculateTickers,
  isRecalculating = false,
}) => {
  const [singleTickerInput, setSingleTickerInput] = useState('');
  const [bulkInput, setBulkInput] = useState('');
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [isNewGroupInputOpen, setIsNewGroupInputOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [fileUploadError, setFileUploadError] = useState<string | null>(null);
  const [fileUploadSuccess, setFileUploadSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const activeGroup = watchlistGroups.find((g) => g.id === activeGroupId) || watchlistGroups[0];
  const currentTickers = activeGroup?.tickers || [];

  // Group Selection handler
  const handleSelectGroup = (id: string) => {
    onSelectGroup(id);
    setIsRenaming(false);
    setIsDeleteConfirmOpen(false);
    setRenameValue('');
  };

  // Single ticker add
  const handleAddSingle = (e: React.FormEvent) => {
    e.preventDefault();
    const sym = singleTickerInput.trim().toUpperCase().replace(/[^A-Z]/g, '');
    if (sym && sym.length <= 5) {
      if (!currentTickers.includes(sym)) {
        const updated = [...currentTickers, sym];
        onUpdateGroupTickers(activeGroup.id, updated);
        onAddCustomTickerMeta(sym);
        if (onRecalculateTickers) {
          onRecalculateTickers(updated);
        }
        setFileUploadSuccess(`Added ${sym} and initiated live market data fetch.`);
      }
      setSingleTickerInput('');
    }
  };

  // Bulk tickers add
  const handleAddBulk = () => {
    const rawTokens = bulkInput.split(/[\s,;\n]+/);
    const valid = rawTokens
      .map((t) => t.trim().toUpperCase().replace(/[^A-Z]/g, ''))
      .filter((t) => t.length >= 1 && t.length <= 5);

    if (valid.length > 0) {
      const merged = Array.from(new Set([...currentTickers, ...valid]));
      onUpdateGroupTickers(activeGroup.id, merged);
      valid.forEach((sym) => onAddCustomTickerMeta(sym));
      if (onRecalculateTickers) {
        onRecalculateTickers(merged);
      }
      setBulkInput('');
      setIsBulkOpen(false);
      setFileUploadSuccess(`Added ${valid.length} tickers and initiated live market data calculation.`);
    }
  };

  // Toggle individual ticker
  const handleToggleTicker = (symbol: string) => {
    if (currentTickers.includes(symbol)) {
      const remaining = currentTickers.filter((s) => s !== symbol);
      onUpdateGroupTickers(activeGroup.id, remaining);
      if (onRecalculateTickers && remaining.length > 0) {
        onRecalculateTickers(remaining);
      }
    } else {
      const updated = [...currentTickers, symbol];
      onUpdateGroupTickers(activeGroup.id, updated);
      onAddCustomTickerMeta(symbol);
      if (onRecalculateTickers) {
        onRecalculateTickers(updated);
      }
    }
  };

  // Remove individual ticker
  const handleRemoveTicker = (symbol: string) => {
    const remaining = currentTickers.filter((s) => s !== symbol);
    onUpdateGroupTickers(activeGroup.id, remaining);
    if (onRecalculateTickers && remaining.length > 0) {
      onRecalculateTickers(remaining);
    }
  };

  // Handle File Upload (CSV / Excel)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileUploadError(null);
    setFileUploadSuccess(null);

    try {
      const res = await parseUploadedFile(file);
      if (res.tickers.length === 0) {
        setFileUploadError('No valid ticker symbols found in file.');
        return;
      }

      const merged = Array.from(new Set([...currentTickers, ...res.tickers]));
      onUpdateGroupTickers(activeGroup.id, merged);
      res.tickers.forEach((sym) => onAddCustomTickerMeta(sym));
      if (onRecalculateTickers) {
        onRecalculateTickers(merged);
      }

      setFileUploadSuccess(
        `Successfully imported ${res.tickers.length} tickers from "${file.name}" and initiated live market processing!`
      );
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      setFileUploadError(err.message || 'Error parsing file.');
    }
  };

  // Create new group
  const handleCreateGroupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = newGroupName.trim();
    if (cleanName) {
      onCreateGroup(cleanName, []);
      setNewGroupName('');
      setIsNewGroupInputOpen(false);
      setIsRenaming(false);
      setIsDeleteConfirmOpen(false);
      setFileUploadSuccess(`Created new watchlist "${cleanName}".`);
    }
  };

  // Rename group submit
  const handleRenameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = renameValue.trim();
    if (cleanName && cleanName !== activeGroup.name) {
      onRenameGroup(activeGroup.id, cleanName);
      setFileUploadSuccess(`Watchlist renamed to "${cleanName}".`);
    }
    setIsRenaming(false);
  };

  // Delete group submit
  const handleConfirmDelete = () => {
    if (watchlistGroups.length > 1) {
      const deletedName = activeGroup.name;
      onDeleteGroup(activeGroup.id);
      setIsDeleteConfirmOpen(false);
      setIsRenaming(false);
      setFileUploadSuccess(`Deleted watchlist "${deletedName}".`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div
        className="w-full max-w-3xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
              <Star className="w-5 h-5" filled />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Multi-Watchlist Builder &amp; Data Ingestion</span>
              </h2>
              <p className="text-xs text-slate-400">
                Manage customized ticker universes, bulk paste symbols, and import CSV / Excel files
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

        {/* Watchlist Group Tabs */}
        <div className="p-3 bg-slate-950/40 border-b border-slate-800 flex items-center justify-between gap-2 overflow-x-auto text-xs">
          <div className="flex items-center space-x-1.5 min-w-max">
            {watchlistGroups.map((g) => (
              <button
                key={g.id}
                onClick={() => handleSelectGroup(g.id)}
                className={`px-3 py-1.5 rounded-lg font-semibold flex items-center space-x-1.5 transition-all ${
                  g.id === activeGroupId
                    ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <span>{g.name}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                    g.id === activeGroupId ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {g.tickers.length}
                </span>
              </button>
            ))}

            {/* New Group Button */}
            {!isNewGroupInputOpen ? (
              <button
                onClick={() => {
                  setIsNewGroupInputOpen(true);
                  setIsRenaming(false);
                  setIsDeleteConfirmOpen(false);
                }}
                className="px-2.5 py-1.5 rounded-lg font-semibold text-slate-400 hover:text-amber-300 hover:bg-slate-800 flex items-center space-x-1 transition-all border border-dashed border-slate-700"
              >
                <FolderPlus className="w-3.5 h-3.5" />
                <span>+ New List</span>
              </button>
            ) : (
              <form onSubmit={handleCreateGroupSubmit} className="flex items-center space-x-1">
                <input
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="Watchlist Name..."
                  className="bg-slate-800 text-white px-2 py-1 rounded text-xs focus:outline-none border border-amber-500/50"
                  autoFocus
                />
                <button
                  type="submit"
                  className="px-2 py-1 bg-amber-600 text-white rounded text-xs font-bold"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => setIsNewGroupInputOpen(false)}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Active Watchlist Action Strip (Rename, Delete with Confirmation, Ticker Count) */}
        <div className="px-5 py-2.5 bg-slate-950/70 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2">
            {!isRenaming ? (
              <div className="flex items-center space-x-2">
                <span className="font-bold text-white text-sm flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5 text-amber-400" filled />
                  {activeGroup.name}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                  {currentTickers.length} Tickers
                </span>
                {activeGroup.isDefault && (
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Primary Default
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setRenameValue(activeGroup.name);
                    setIsRenaming(true);
                    setIsDeleteConfirmOpen(false);
                  }}
                  className="p-1 px-2 rounded hover:bg-slate-800 text-slate-400 hover:text-amber-300 transition-colors flex items-center space-x-1 border border-slate-700/60"
                  title="Rename this watchlist"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span className="text-[11px]">Rename</span>
                </button>
              </div>
            ) : (
              <form onSubmit={handleRenameSubmit} className="flex items-center space-x-1.5">
                <input
                  type="text"
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  className="bg-slate-800 text-white px-2.5 py-1 rounded-lg text-xs font-semibold focus:outline-none border border-amber-500/80 w-48"
                  placeholder="Enter new name..."
                  autoFocus
                />
                <button
                  type="submit"
                  className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setIsRenaming(false)}
                  className="p-1 text-slate-400 hover:text-white rounded transition-colors"
                  title="Cancel"
                >
                  <X className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>

          {/* Delete Action with Safety Confirmation */}
          <div className="flex items-center space-x-2">
            {watchlistGroups.length > 1 && (
              !isDeleteConfirmOpen ? (
                <button
                  type="button"
                  onClick={() => setIsDeleteConfirmOpen(true)}
                  className="text-xs text-rose-400 hover:text-rose-300 px-2 py-1 rounded hover:bg-rose-950/30 border border-transparent hover:border-rose-900/50 flex items-center space-x-1.5 transition-colors cursor-pointer"
                  title="Delete this watchlist"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Watchlist</span>
                </button>
              ) : (
                <div className="flex items-center space-x-2 p-1 px-2 bg-rose-950/50 border border-rose-500/50 rounded-lg animate-fade-in">
                  <span className="text-[11px] text-rose-300 font-medium">
                    Delete "{activeGroup.name}"?
                  </span>
                  <button
                    type="button"
                    onClick={handleConfirmDelete}
                    className="px-2 py-0.5 bg-rose-600 hover:bg-rose-500 text-white rounded text-[11px] font-bold transition-colors cursor-pointer"
                  >
                    Confirm
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsDeleteConfirmOpen(false)}
                    className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              )
            )}
          </div>
        </div>


        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1 text-sm text-slate-300">
          {/* Status Notifications */}
          {fileUploadSuccess && (
            <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Check className="w-4 h-4" />
                {fileUploadSuccess}
              </span>
              <button onClick={() => setFileUploadSuccess(null)} className="text-emerald-400">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {fileUploadError && (
            <div className="p-3 bg-rose-950/40 border border-rose-500/40 rounded-xl text-xs text-rose-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" />
                {fileUploadError}
              </span>
              <button onClick={() => setFileUploadError(null)} className="text-rose-400">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Section: Add Tickers Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Single Ticker Ingestion */}
            <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 space-y-2">
              <div className="text-xs font-bold text-white flex items-center justify-between">
                <span>Add Individual Ticker</span>
                <span className="text-[10px] text-slate-500 font-mono">1 to 5 letters</span>
              </div>
              <form onSubmit={handleAddSingle} className="flex space-x-2">
                <input
                  type="text"
                  value={singleTickerInput}
                  onChange={(e) => setSingleTickerInput(e.target.value.toUpperCase())}
                  placeholder="e.g. AMD, META, COIN"
                  maxLength={5}
                  className="flex-1 bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs text-white uppercase focus:outline-none focus:border-amber-500"
                />
                <button
                  type="submit"
                  disabled={!singleTickerInput.trim()}
                  className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white text-xs font-semibold flex items-center space-x-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </form>
            </div>

            {/* Bulk Paste Ingestion */}
            <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 space-y-2">
              <div className="text-xs font-bold text-white flex items-center justify-between">
                <span>Bulk Paste Tickers</span>
                <button
                  onClick={() => setIsBulkOpen(!isBulkOpen)}
                  className="text-[10px] text-amber-400 hover:underline"
                >
                  {isBulkOpen ? 'Collapse' : 'Expand Paste Box'}
                </button>
              </div>
              {isBulkOpen ? (
                <div className="space-y-2">
                  <textarea
                    value={bulkInput}
                    onChange={(e) => setBulkInput(e.target.value)}
                    placeholder="Paste comma or space-separated symbols (e.g. AAPL, NVDA, TSLA, MSFT, GOOGL)..."
                    rows={3}
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-lg p-2 text-xs text-white uppercase focus:outline-none focus:border-amber-500"
                  />
                  <button
                    onClick={handleAddBulk}
                    disabled={!bulkInput.trim()}
                    className="w-full py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-bold transition-colors flex items-center justify-center space-x-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Ingest Bulk Tickers</span>
                  </button>
                </div>
              ) : (
                <p className="text-xs text-slate-400">
                  Quickly add 10+ symbols at once by pasting a comma- or line-separated list.
                </p>
              )}
            </div>
          </div>

          {/* Section: File Upload & Templates (CSV & Excel) */}
          <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Import Watchlist from File (CSV or Excel)</span>
                </div>
                <div className="text-[11px] text-slate-400">
                  Supports .csv, .xlsx, and .xls with standard "Ticker" or "Symbol" column headers.
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => downloadSampleTemplate('csv')}
                  className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-[11px] flex items-center space-x-1"
                  title="Download sample CSV template"
                >
                  <Download className="w-3 h-3 text-slate-400" />
                  <span>Sample CSV</span>
                </button>
                <button
                  onClick={() => downloadSampleTemplate('xlsx')}
                  className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-emerald-300 border border-slate-700 text-[11px] flex items-center space-x-1"
                  title="Download sample Excel template"
                >
                  <FileSpreadsheet className="w-3 h-3 text-emerald-400" />
                  <span>Sample Excel</span>
                </button>
              </div>
            </div>

            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
              onChange={handleFileUpload}
              className="hidden"
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-3 rounded-xl border-2 border-dashed border-slate-700 hover:border-emerald-500 bg-slate-900/50 hover:bg-emerald-950/20 text-slate-300 hover:text-white transition-all flex flex-col items-center justify-center space-y-1 text-xs"
            >
              <Upload className="w-5 h-5 text-emerald-400" />
              <span className="font-semibold">Click to select or drag CSV / Excel file here</span>
              <span className="text-[10px] text-slate-500">Auto-detects Ticker, Name, and Sector columns</span>
            </button>
          </div>

          {/* Section: Current Active Watchlist Tickers Grid */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-white uppercase tracking-wider">
              <span>
                Active List Symbols ({currentTickers.length} Tickers)
              </span>
              <span className="text-[11px] text-slate-400 font-normal">
                Click symbol to toggle inclusion
              </span>
            </div>

            {currentTickers.length === 0 ? (
              <div className="p-6 text-center text-slate-500 bg-slate-950/50 rounded-xl border border-slate-800 text-xs">
                No tickers in this list yet. Use the inputs above to add tickers.
              </div>
            ) : (
              <div className="flex flex-wrap gap-2 p-3 bg-slate-950/70 rounded-xl border border-slate-800 max-h-48 overflow-y-auto">
                {currentTickers.map((sym) => {
                  const meta = availableUniverse.find((u) => u.symbol === sym);
                  return (
                    <div
                      key={sym}
                      className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs font-mono group hover:border-amber-500 transition-colors"
                    >
                      <Star className="w-3 h-3 text-amber-400" filled />
                      <span className="font-bold">{sym}</span>
                      {meta && (
                        <span className="text-[10px] text-slate-400 font-sans">
                          (${meta.spot_price.toFixed(0)})
                        </span>
                      )}
                      <button
                        onClick={() => handleRemoveTicker(sym)}
                        className="text-slate-500 hover:text-rose-400 transition-colors ml-1"
                        title={`Remove ${sym}`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center space-x-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold text-slate-300">Auto-Synced to Local Storage &amp; Live Market Feed</span>
          </div>

          <div className="flex items-center space-x-2">
            {isRecalculating && (
              <span className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/50 text-emerald-300 border border-emerald-500/40 font-mono text-xs">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                <span>Processing Live Market Data...</span>
              </span>
            )}
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold shadow-md shadow-amber-600/30 transition-colors cursor-pointer"
            >
              Apply &amp; Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
