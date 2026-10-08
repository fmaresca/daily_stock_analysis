import React, { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  Plus,
  DollarSign,
  Layers,
  X,
} from '../icons';
import { ParsedHoldingsRow } from '../../utils/holdingsOcrParser';

export interface HoldingsOcrReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialRows: ParsedHoldingsRow[];
  detectedCash: number;
  onConfirm: (confirmedRows: ParsedHoldingsRow[], cashAmount: number) => void;
}

export const HoldingsOcrReviewModal: React.FC<HoldingsOcrReviewModalProps> = ({
  isOpen,
  onClose,
  initialRows,
  detectedCash: initCash,
  onConfirm,
}) => {
  const [rows, setRows] = useState<ParsedHoldingsRow[]>(initialRows);
  const [cash, setCash] = useState<number>(initCash);

  if (!isOpen) return null;

  const handleUpdateRow = (id: string, field: keyof ParsedHoldingsRow, value: any) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const updated = { ...r, [field]: value };
        if (field === 'quantity' || field === 'costBasis' || field === 'currentPrice') {
          const qty = Number(updated.quantity) || 0;
          const price = Number(updated.currentPrice || updated.costBasis) || 0;
          updated.marketValue = Math.round(qty * price * 100) / 100;
          // Re-evaluate confidence if user edited row
          if (updated.symbol && qty > 0 && price > 0) {
            updated.confidence = 95;
            updated.isLowConfidence = false;
            updated.issues = [];
          }
        }
        return updated;
      })
    );
  };

  const handleDeleteRow = (id: string) => {
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  const handleAddRow = () => {
    const newId = `manual_row_${Date.now()}`;
    const newRow: ParsedHoldingsRow = {
      id: newId,
      symbol: '',
      quantity: 100,
      costBasis: 100,
      currentPrice: 100,
      marketValue: 10000,
      account: 'Manual Entry',
      confidence: 100,
      isLowConfidence: false,
      issues: [],
    };
    setRows((prev) => [...prev, newRow]);
  };

  const lowConfidenceCount = rows.filter((r) => r.isLowConfidence).length;
  const validRows = rows.filter((r) => r.symbol.trim() && r.quantity > 0);
  const totalValue = validRows.reduce((sum, r) => sum + (r.marketValue || 0), 0) + (Number(cash) || 0);

  const handleConfirm = () => {
    onConfirm(validRows, Number(cash) || 0);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-slate-100">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <span>Holdings Screenshot Review &amp; Edit Gate</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-500/40 text-cyan-300">
                  Human-in-the-Loop
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Review OCR-extracted brokerage holdings before ingestion. Edit any row or flag below.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Warning Banner for Low-Confidence Rows */}
        {lowConfidenceCount > 0 && (
          <div className="px-4 py-2.5 bg-amber-950/40 border-b border-amber-500/30 text-amber-300 text-xs flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span>
                {lowConfidenceCount} row{lowConfidenceCount > 1 ? 's' : ''} flagged with lower confidence or missing data. Please verify highlighted fields before confirming.
              </span>
            </div>
          </div>
        )}

        {/* Table Container */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px]">
                <th className="p-2">Symbol</th>
                <th className="p-2">Quantity</th>
                <th className="p-2">Price / Cost ($)</th>
                <th className="p-2">Est. Value ($)</th>
                <th className="p-2">Confidence</th>
                <th className="p-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {rows.map((row) => (
                <tr
                  key={row.id}
                  className={`hover:bg-slate-800/40 transition-colors ${
                    row.isLowConfidence ? 'bg-amber-950/10' : ''
                  }`}
                >
                  {/* Symbol */}
                  <td className="p-2">
                    <input
                      type="text"
                      value={row.symbol}
                      onChange={(e) => handleUpdateRow(row.id, 'symbol', e.target.value.toUpperCase())}
                      className="w-20 px-2 py-1 bg-slate-950 border border-slate-700 text-slate-100 font-mono font-bold rounded focus:border-cyan-400 focus:outline-none"
                    />
                  </td>

                  {/* Quantity */}
                  <td className="p-2">
                    <input
                      type="number"
                      value={row.quantity || ''}
                      onChange={(e) => handleUpdateRow(row.id, 'quantity', parseFloat(e.target.value) || 0)}
                      className="w-24 px-2 py-1 bg-slate-950 border border-slate-700 text-slate-100 font-mono rounded focus:border-cyan-400 focus:outline-none"
                    />
                  </td>

                  {/* Cost Basis / Price */}
                  <td className="p-2">
                    <input
                      type="number"
                      step="0.01"
                      value={row.currentPrice || row.costBasis || ''}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        handleUpdateRow(row.id, 'currentPrice', val);
                        handleUpdateRow(row.id, 'costBasis', val);
                      }}
                      className="w-28 px-2 py-1 bg-slate-950 border border-slate-700 text-slate-100 font-mono rounded focus:border-cyan-400 focus:outline-none"
                    />
                  </td>

                  {/* Est. Value */}
                  <td className="p-2 font-mono text-slate-200">
                    ${(row.marketValue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>

                  {/* Confidence Badge */}
                  <td className="p-2">
                    <div className="flex flex-col">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold w-fit ${
                          row.confidence >= 80
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                            : row.confidence >= 60
                            ? 'bg-amber-950 text-amber-300 border border-amber-500/40'
                            : 'bg-rose-950 text-rose-300 border border-rose-500/40'
                        }`}
                      >
                        {row.confidence}%
                      </span>
                      {row.issues && row.issues.length > 0 && (
                        <span className="text-[9px] text-amber-400 mt-0.5 truncate max-w-[140px]">
                          {row.issues.join(', ')}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Delete */}
                  <td className="p-2 text-right">
                    <button
                      onClick={() => handleDeleteRow(row.id)}
                      className="p-1 text-slate-500 hover:text-rose-400 rounded transition-colors"
                      title="Remove row"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="pt-3 flex items-center justify-between">
            <button
              onClick={handleAddRow}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
            >
              <Plus className="w-3.5 h-3.5 text-cyan-400" />
              <span>Add Position Row</span>
            </button>

            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-400">Cash &amp; Money Market Balance:</span>
              <input
                type="number"
                step="100"
                value={cash}
                onChange={(e) => setCash(parseFloat(e.target.value) || 0)}
                className="w-32 px-2.5 py-1 bg-slate-950 border border-slate-700 text-emerald-300 font-mono font-bold text-xs rounded focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-4 text-xs font-mono text-slate-300">
            <span>Valid Positions: <strong className="text-white">{validRows.length}</strong></span>
            <span>Total Value: <strong className="text-emerald-400">${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong></span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={validRows.length === 0}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-40 text-white shadow-lg shadow-emerald-900/30 flex items-center space-x-1.5 transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirm &amp; Ingest Holdings</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
