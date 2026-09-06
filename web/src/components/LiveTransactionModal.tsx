import React, { useState, useMemo } from 'react';
import {
  LiveTransactionEntry,
  recordLiveTransaction,
} from '../utils/capitalAndTaxLedger';
import {
  DollarSign,
  TrendingUp,
  ShieldCheck,
  Zap,
  Sparkles,
  Layers,
  ArrowRight,
} from './icons';

interface LiveTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (message: string) => void;
  defaultCategory?: 'PUT_WRITTEN' | 'CALL_WRITTEN' | 'STOCK_BUY' | 'STOCK_SELL';
  defaultSymbol?: string;
}

export const LiveTransactionModal: React.FC<LiveTransactionModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  defaultCategory = 'PUT_WRITTEN',
  defaultSymbol = '',
}) => {
  const [category, setCategory] = useState<'PUT_WRITTEN' | 'CALL_WRITTEN' | 'STOCK_BUY' | 'STOCK_SELL'>(
    defaultCategory
  );
  const [symbol, setSymbol] = useState(defaultSymbol || 'PLTR');
  const [strike, setStrike] = useState<number>(165);
  const [quantity, setQuantity] = useState<number>(10);
  const [price, setPrice] = useState<number>(1.25);
  const [spotPrice, setSpotPrice] = useState<number>(170.20);
  const [delta, setDelta] = useState<number>(-0.20);
  const [dte, setDte] = useState<number>(6);
  const [expiration, setExpiration] = useState<string>('2026-09-11');
  const [costBasisPerShare, setCostBasisPerShare] = useState<number>(150);
  const [notes, setNotes] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Preset portfolio equities
  const knownPortfolioEquities = ['PANW', 'PLTR', 'TSLA', 'NET', 'BLZE', 'AXTI', 'IONQ', 'RTX', 'LUNR'];

  // Calculations for options
  const isPut = category === 'PUT_WRITTEN';
  const isCall = category === 'CALL_WRITTEN';
  const isOption = isPut || isCall;
  const isStockBuy = category === 'STOCK_BUY';
  const isStockSell = category === 'STOCK_SELL';

  const optionCollateral = useMemo(() => {
    if (!isPut) return 0;
    return (Number(strike) || 0) * (Number(quantity) || 0) * 100;
  }, [isPut, strike, quantity]);

  const totalPremiumCollected = useMemo(() => {
    if (!isOption) return 0;
    return (Number(price) || 0) * (Number(quantity) || 0) * 100;
  }, [isOption, price, quantity]);

  const annualizedRoc = useMemo(() => {
    if (!isPut || strike <= 0 || dte <= 0) return 0;
    return ((price / strike) * (365 / dte)) * 100;
  }, [isPut, price, strike, dte]);

  const downsideBuffer = useMemo(() => {
    if (spotPrice <= 0 || strike <= 0) return 0;
    return ((spotPrice - strike) / spotPrice) * 100;
  }, [spotPrice, strike]);

  const stockTotal = useMemo(() => {
    return (Number(quantity) || 0) * (Number(price) || 0);
  }, [quantity, price]);

  const realizedStockPnl = useMemo(() => {
    if (!isStockSell) return 0;
    return ((Number(price) || 0) - (Number(costBasisPerShare) || 0)) * (Number(quantity) || 0);
  }, [isStockSell, price, costBasisPerShare, quantity]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!symbol.trim()) {
      setErrorMsg('Please enter a valid stock ticker symbol.');
      return;
    }

    if (quantity <= 0) {
      setErrorMsg('Quantity must be greater than zero.');
      return;
    }

    if (price <= 0) {
      setErrorMsg('Price / Premium must be greater than zero.');
      return;
    }

    const tx: LiveTransactionEntry = {
      category,
      symbol: symbol.toUpperCase().trim(),
      strike: isOption ? Number(strike) : undefined,
      expiration: isOption ? expiration : undefined,
      dte: isOption ? Number(dte) : undefined,
      quantity: Number(quantity),
      price: Number(price),
      spotPrice: Number(spotPrice) || undefined,
      delta: isOption ? Number(delta) : undefined,
      costBasisPerShare: isStockSell ? Number(costBasisPerShare) : undefined,
      notes: notes.trim() || undefined,
    };

    try {
      const res = recordLiveTransaction(tx);
      if (res.success) {
        if (onSuccess) onSuccess(res.message);
        onClose();
      } else {
        setErrorMsg('Failed to record transaction.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error processing transaction.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 max-w-xl w-full shadow-2xl space-y-5 bg-slate-950 text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2.5">
            <span className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Zap className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
                Record Live Mid-Week Transaction
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Dynamic Sync
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Log equities, short puts (CSPs), and covered calls written during the trading week. Updates cash, collateral, and tax ledger instantly.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-xl font-bold p-1 cursor-pointer"
          >
            ×
          </button>
        </div>

        {/* Category Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 bg-slate-900/90 rounded-xl border border-slate-800 text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setCategory('PUT_WRITTEN');
              setStrike(165);
              setDelta(-0.20);
            }}
            className={`py-2 px-2 rounded-lg transition-all text-center cursor-pointer ${
              category === 'PUT_WRITTEN'
                ? 'bg-amber-600 text-white shadow-md font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Sell Put (CSP)
          </button>
          <button
            type="button"
            onClick={() => {
              setCategory('CALL_WRITTEN');
              setStrike(375);
              setDelta(-0.20);
            }}
            className={`py-2 px-2 rounded-lg transition-all text-center cursor-pointer ${
              category === 'CALL_WRITTEN'
                ? 'bg-emerald-600 text-white shadow-md font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Sell Call (CC)
          </button>
          <button
            type="button"
            onClick={() => setCategory('STOCK_BUY')}
            className={`py-2 px-2 rounded-lg transition-all text-center cursor-pointer ${
              category === 'STOCK_BUY'
                ? 'bg-blue-600 text-white shadow-md font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Buy Stock
          </button>
          <button
            type="button"
            onClick={() => setCategory('STOCK_SELL')}
            className={`py-2 px-2 rounded-lg transition-all text-center cursor-pointer ${
              category === 'STOCK_SELL'
                ? 'bg-rose-600 text-white shadow-md font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Sell Stock
          </button>
        </div>

        {errorMsg && (
          <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono">
            {errorMsg}
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Quick symbol presets */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-slate-300 font-semibold">Underlying Symbol / Ticker</label>
              <div className="flex flex-wrap gap-1 text-[10px] font-mono">
                {knownPortfolioEquities.map((sym) => (
                  <button
                    key={sym}
                    type="button"
                    onClick={() => setSymbol(sym)}
                    className={`px-1.5 py-0.5 rounded border ${
                      symbol.toUpperCase() === sym
                        ? 'bg-emerald-500/30 border-emerald-500 text-emerald-300 font-bold'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {sym}
                  </button>
                ))}
              </div>
            </div>
            <input
              type="text"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              placeholder="e.g. PANW, PLTR, TSLA, NET"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono font-bold tracking-wider"
              required
            />
          </div>

          {/* Option Inputs */}
          {isOption && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="text-slate-300 block mb-1 font-semibold">
                  {isPut ? 'Put Strike ($)' : 'Call Strike ($)'}
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={strike}
                  onChange={(e) => setStrike(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono font-bold"
                  required
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Contracts</label>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono font-bold"
                  required
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Premium / sh ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono font-bold text-emerald-400"
                  required
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Underlying Spot ($)</label>
                <input
                  type="number"
                  step="0.1"
                  value={spotPrice}
                  onChange={(e) => setSpotPrice(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Expiration Date</label>
                <input
                  type="date"
                  value={expiration}
                  onChange={(e) => setExpiration(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
                  required
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Days to Exp (DTE)</label>
                <input
                  type="number"
                  value={dte}
                  onChange={(e) => setDte(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
                  required
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Delta (&Delta;)</label>
                <input
                  type="number"
                  step="0.01"
                  value={delta}
                  onChange={(e) => setDelta(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Weekly Target</label>
                <div className="flex items-center h-[38px]">
                  <span className="text-[11px] text-emerald-400 font-mono font-bold">
                    ✓ Friday Weekly
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Stock Inputs */}
          {!isOption && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Number of Shares</label>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono font-bold"
                  required
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">
                  {isStockBuy ? 'Purchase Price ($)' : 'Sale Execution Price ($)'}
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono font-bold"
                  required
                />
              </div>

              {isStockSell && (
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Original Cost Basis ($/sh)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={costBasisPerShare}
                    onChange={(e) => setCostBasisPerShare(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
                    required
                  />
                </div>
              )}
            </div>
          )}

          {/* Dynamic Real-time Calculations Card */}
          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              Dynamic Execution Impact Preview
            </span>

            {isPut && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-slate-500 text-[10px] block">Committed Collateral</span>
                  <span className="text-amber-400 font-bold text-sm block">
                    ${optionCollateral.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-slate-500">100% Cash-Backed</span>
                </div>

                <div className="p-2 rounded-lg bg-slate-950 border border-emerald-500/30">
                  <span className="text-slate-500 text-[10px] block">Premium Collected</span>
                  <span className="text-emerald-400 font-bold text-sm block">
                    +${totalPremiumCollected.toFixed(2)}
                  </span>
                  <span className="text-[10px] text-emerald-500/70">Immediate Cash Inflow</span>
                </div>

                <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-slate-500 text-[10px] block">Annualized Return (AROC)</span>
                  <span className="text-emerald-300 font-bold text-sm block">
                    {annualizedRoc.toFixed(1)}%
                  </span>
                  <span className="text-[10px] text-slate-500">{dte} DTE Runway</span>
                </div>

                <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-slate-500 text-[10px] block">Downside Cushion</span>
                  <span className="text-cyan-400 font-bold text-sm block">
                    {downsideBuffer.toFixed(1)}%
                  </span>
                  <span className="text-[10px] text-slate-500">Safety Margin</span>
                </div>
              </div>
            )}

            {isCall && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-mono">
                <div className="p-2 rounded-lg bg-slate-950 border border-emerald-500/30">
                  <span className="text-slate-500 text-[10px] block">Premium Collected</span>
                  <span className="text-emerald-400 font-bold text-sm block">
                    +${totalPremiumCollected.toFixed(2)}
                  </span>
                  <span className="text-[10px] text-emerald-500/70">Current Week Harvest</span>
                </div>

                <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-slate-500 text-[10px] block">Call Covered Units</span>
                  <span className="text-white font-bold text-sm block">
                    {quantity * 100} Shares
                  </span>
                  <span className="text-[10px] text-slate-500">{quantity} Contracts</span>
                </div>

                <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-slate-500 text-[10px] block">Effective Strike</span>
                  <span className="text-indigo-300 font-bold text-sm block">
                    ${strike.toFixed(2)} Call
                  </span>
                  <span className="text-[10px] text-slate-500">Exp {expiration}</span>
                </div>
              </div>
            )}

            {!isOption && (
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-slate-500 text-[10px] block">Total Order Capital</span>
                  <span className="text-white font-bold text-sm block">
                    ${stockTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span className="text-[10px] text-slate-500">{quantity} shares @ ${price.toFixed(2)}</span>
                </div>

                {isStockSell && (
                  <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-slate-500 text-[10px] block">Realized Capital Gain / Loss</span>
                    <span className={`font-bold text-sm block ${realizedStockPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {realizedStockPnl >= 0 ? '+' : ''}${realizedStockPnl.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-slate-500">Tax Ledger Impact</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="text-slate-300 block mb-1 font-semibold">Notes / Execution Thesis</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. 0.20 Delta 6-day weekly put write after support test"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold shadow-lg shadow-emerald-600/30 transition-all flex items-center space-x-1.5 cursor-pointer"
            >
              <Zap className="w-4 h-4" />
              <span>Record &amp; Sync Ledger</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
