import React, { useState } from 'react';
import { PortfolioPosition, PositionType } from '../../utils/portfolioStressTest';
import { Plus } from '../icons';

export interface AddPositionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddPosition: (pos: PortfolioPosition) => void;
}

export const AddPositionModal: React.FC<AddPositionModalProps> = ({
  isOpen,
  onClose,
  onAddPosition,
}) => {
  const [newSymbol, setNewSymbol] = useState('SPY');
  const [newType, setNewType] = useState<PositionType>('CSP');
  const [newQuantity, setNewQuantity] = useState(1);
  const [newSpot, setNewSpot] = useState(550);
  const [newStrike, setNewStrike] = useState(535);
  const [newDte, setNewDte] = useState(28);
  const [newEntryPrice, setNewEntryPrice] = useState(3.50);
  const [newDelta, setNewDelta] = useState(0.18);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const sym = newSymbol.toUpperCase().trim();
    const isLiquid = newType === 'CASH' || newType === 'MMF';
    const isStock = newType === 'STOCK';
    const pos: PortfolioPosition = {
      id: `POS_${sym}_${Date.now().toString().slice(-4)}`,
      symbol: sym,
      type: newType,
      quantity: Number(newQuantity),
      spotPrice: isLiquid ? 1.0 : Number(newSpot),
      strike: isLiquid || isStock ? 0 : Number(newStrike),
      dte: isLiquid || isStock ? 0 : Number(newDte),
      entryPrice: isLiquid ? 1.0 : Number(newEntryPrice),
      currentOptionPrice: isLiquid || isStock ? 0 : Number(newEntryPrice),
      iv: isLiquid ? 0 : 22,
      delta: isLiquid ? 0 : newType === 'CSP' ? -Math.abs(Number(newDelta)) : isStock ? 1.0 : Number(newDelta),
      theta: isLiquid ? 0 : 0.12,
      vega: isLiquid ? 0 : -0.15,
      beta: isLiquid ? 0 : 1.0,
      costBasisTotal: isLiquid ? Number(newQuantity) : undefined,
      marketValueTotal: isLiquid ? Number(newQuantity) : undefined,
      account: 'Living Trust-Options ...609',
    };
    onAddPosition(pos);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 max-w-lg w-full shadow-2xl space-y-4 bg-slate-950">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-base font-bold text-white flex items-center space-x-2">
            <Plus className="w-5 h-5 text-emerald-400" />
            <span>Add Position to Active Ledger</span>
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-lg font-bold"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <label className="text-slate-300 block mb-1 font-semibold">Symbol</label>
            <input
              type="text"
              value={newSymbol}
              onChange={(e) => setNewSymbol(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
              required
            />
          </div>

          <div>
            <label className="text-slate-300 block mb-1 font-semibold">Position Type</label>
            <select
              value={newType}
              onChange={(e) => setNewType(e.target.value as PositionType)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
            >
              <option value="CSP">Cash-Secured Put (CSP)</option>
              <option value="COVERED_CALL">Covered Call (CC)</option>
              <option value="STOCK">Stock (Long Shares)</option>
              <option value="MMF">Money Market Fund (MMF)</option>
              <option value="CASH">Bank Cash Sweep (CASH)</option>
            </select>
          </div>

          <div>
            <label className="text-slate-300 block mb-1 font-semibold">Quantity</label>
            <input
              type="number"
              value={newQuantity}
              onChange={(e) => setNewQuantity(Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
              required
            />
          </div>

          <div>
            <label className="text-slate-300 block mb-1 font-semibold">Mkt Price ($)</label>
            <input
              type="number"
              step="0.01"
              value={newSpot}
              onChange={(e) => setNewSpot(Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
              required
            />
          </div>

          {newType !== 'STOCK' && newType !== 'CASH' && newType !== 'MMF' && (
            <>
              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Strike ($)</label>
                <input
                  type="number"
                  step="0.5"
                  value={newStrike}
                  onChange={(e) => setNewStrike(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
                  required
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">DTE</label>
                <input
                  type="number"
                  value={newDte}
                  onChange={(e) => setNewDte(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
                  required
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Entry Premium ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={newEntryPrice}
                  onChange={(e) => setNewEntryPrice(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
                  required
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Delta</label>
                <input
                  type="number"
                  step="0.01"
                  value={newDelta}
                  onChange={(e) => setNewDelta(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
                  required
                />
              </div>
            </>
          )}

          <div className="col-span-2 flex justify-end space-x-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-md shadow-emerald-600/30 cursor-pointer"
            >
              Add Position
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
