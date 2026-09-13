import React from 'react';
import { PortfolioPosition } from '../../utils/portfolioStressTest';
import { getOptionExpirationStatus } from '../../utils/optionExpirationEngine';
import { Zap, Trash2 } from '../icons';

export interface PositionAuditRowProps {
  position: PortfolioPosition;
  onNavigateToRollAssistant?: (symbol: string) => void;
  onDeletePosition: (id: string) => void;
}

export const PositionAuditRow: React.FC<PositionAuditRowProps> = React.memo(({
  position: p,
  onNavigateToRollAssistant,
  onDeletePosition,
}) => {
  const isCsp = p.type === 'CSP';
  const isCc = p.type === 'COVERED_CALL';
  const isOption = isCsp || isCc;
  const isStock = p.type === 'STOCK';
  const isCash = p.type === 'CASH';
  const isMmf = p.type === 'MMF';
  const isLiquid = isCash || isMmf;

  const expStatus = getOptionExpirationStatus(p.expiration, p.dte);

  const collateral = isCsp
    ? p.strike * 100 * (p.quantity || 1)
    : isStock
    ? (p.marketValueTotal || p.spotPrice * p.quantity)
    : isLiquid
    ? (p.marketValueTotal || p.quantity)
    : p.spotPrice * 100 * (p.quantity || 1);

  const profitPct =
    p.entryPrice > 0 && p.currentOptionPrice !== undefined
      ? ((p.entryPrice - p.currentOptionPrice) / p.entryPrice) * 100
      : 0;

  const cushionPct =
    isCsp && p.strike > 0 && p.spotPrice > 0
      ? ((p.spotPrice - p.strike) / p.spotPrice) * 100
      : isCc && p.strike > 0 && p.spotPrice > 0
      ? ((p.strike - p.spotPrice) / p.spotPrice) * 100
      : null;

  return (
    <tr className="hover:bg-slate-800/40 transition-colors">
      <td className="py-3 px-4 font-mono">
        <div className="flex items-center space-x-2">
          <span className="font-bold text-white text-sm block">{p.symbol}</span>
          {isCash && <span className="text-[10px] text-emerald-400 font-normal">Core Sweep</span>}
          {isMmf && <span className="text-[10px] text-cyan-400 font-normal">{p.symbol === 'SNYXX' ? 'NY Municipal' : 'Premier Ultra'}</span>}
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span
            className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
              isCsp
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : isCc
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                : isStock
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                : isMmf
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
            }`}
          >
            {isMmf ? 'MONEY MARKET' : isCash ? 'BANK CASH' : p.type.replace(/_/g, ' ')}
          </span>
          {p.companyName && (
            <span className="text-[10px] text-slate-400 truncate max-w-[180px]" title={p.companyName}>
              {p.companyName}
            </span>
          )}
        </div>
      </td>

      <td className="py-3 px-3 font-mono text-slate-300">
        {isLiquid
          ? `$${p.quantity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
          : `${p.quantity.toLocaleString()} ${isStock ? 'shs' : 'cts'}`}
      </td>

      <td className="py-3 px-3 font-mono text-slate-200">
        ${p.spotPrice.toFixed(2)}
      </td>

      <td className="py-3 px-3 font-mono">
        {isLiquid ? (
          <span className="text-cyan-400 text-[11px] font-semibold">100% Cash Collateral</span>
        ) : isStock ? (
          <span className="text-slate-500">—</span>
        ) : (
          <div>
            <span className="text-white font-bold">${p.strike.toFixed(2)}</span>
            {cushionPct !== null && (
              <span
                className={`text-[10px] block ${
                  cushionPct <= 2.5 ? 'text-rose-400 font-bold' : 'text-slate-400'
                }`}
              >
                {cushionPct.toFixed(1)}% cushion
              </span>
            )}
          </div>
        )}
      </td>

      <td className="py-3 px-3 font-mono">
        {isLiquid ? (
          <span className="text-emerald-400 font-semibold">{isCash ? 'Instant Sweep' : 'T+1 Daily'}</span>
        ) : isStock ? (
          <span className="text-slate-500">Hold</span>
        ) : (
          <div>
            <span
              className={`font-semibold ${
                expStatus.isExpired
                  ? 'text-slate-400 text-[11px]'
                  : expStatus.isToday
                  ? 'text-rose-400 font-bold'
                  : expStatus.dte <= 5
                  ? 'text-amber-400 font-bold'
                  : 'text-slate-200'
              }`}
            >
              {expStatus.shortLabel}
            </span>
            {p.expiration && (
              <span
                className={`text-[10px] block ${
                  expStatus.isExpired ? 'text-slate-500 line-through' : 'text-slate-400'
                }`}
              >
                {expStatus.formattedExpiration}
              </span>
            )}
          </div>
        )}
      </td>

      <td className="py-3 px-3 font-mono">
        {isLiquid ? (
          <span className="text-slate-500">0.00</span>
        ) : isStock ? (
          <span className="text-slate-400">1.00</span>
        ) : (
          <span
            className={`px-1.5 py-0.5 rounded ${
              Math.abs(p.delta) >= 0.15 && Math.abs(p.delta) <= 0.25
                ? 'bg-emerald-500/20 text-emerald-300 font-bold'
                : Math.abs(p.delta) > 0.35
                ? 'bg-rose-500/20 text-rose-300 font-bold'
                : 'text-slate-400'
            }`}
          >
            {p.delta.toFixed(2)}
          </span>
        )}
      </td>

      <td className="py-3 px-3 font-mono text-slate-300">
        {isLiquid
          ? '$1.00 / $1.00'
          : `$${p.entryPrice.toFixed(2)} / ${(p.currentOptionPrice || p.entryPrice).toFixed(2)}`}
      </td>

      <td className="py-3 px-3 font-mono text-slate-300">
        <div className="font-bold text-white">${collateral.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        {isLiquid && <span className="text-[10px] text-emerald-400 block font-normal">Liquid Cash Pool</span>}
      </td>

      <td className="py-3 px-3 font-mono">
        {isLiquid ? (
          <span className="text-cyan-300 text-[11px] font-medium">
            {p.symbol === 'SNYXX' ? 'Municipal Tax-Free' : 'Yield Accrual'}
          </span>
        ) : isStock ? (
          <span className="text-slate-500">—</span>
        ) : (
          <span
            className={`font-bold ${
              profitPct >= 80
                ? 'text-emerald-400'
                : profitPct >= 50
                ? 'text-cyan-400'
                : 'text-slate-300'
            }`}
          >
            {profitPct.toFixed(0)}%
          </span>
        )}
      </td>

      <td className="py-3 px-3">
        {isLiquid ? (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
            Cash Reserve
          </span>
        ) : isOption && expStatus.isExpired ? (
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
              (isCsp && p.spotPrice >= p.strike) || (isCc && p.spotPrice <= p.strike)
                ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/40'
                : 'bg-slate-900 text-slate-400 border-slate-700'
            }`}
          >
            {(isCsp && p.spotPrice >= p.strike) || (isCc && p.spotPrice <= p.strike)
              ? 'Expired (100% Win)'
              : 'Expired / Settled'}
          </span>
        ) : profitPct >= 80 ? (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
            80% Hit
          </span>
        ) : cushionPct !== null && cushionPct <= 2.5 ? (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
            Threatened
          </span>
        ) : expStatus.dte <= 5 && !isStock ? (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
            Expiring
          </span>
        ) : (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400">
            Normal
          </span>
        )}
      </td>

      <td className="py-3 px-4 text-center">
        <div className="flex items-center justify-center space-x-1.5">
          {isCsp && !expStatus.isExpired && onNavigateToRollAssistant && (
            <button
              onClick={() => onNavigateToRollAssistant(p.symbol)}
              title="Evaluate Defensive Roll"
              className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-amber-400 hover:text-amber-300 border border-slate-700 transition-colors"
            >
              <Zap className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={() => onDeletePosition(p.id)}
            title="Remove Position"
            className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-500 hover:text-rose-400 border border-slate-700 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
});
