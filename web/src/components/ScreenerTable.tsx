import React from 'react';
import { ArrowUpDown } from './icons';
import { OptionOpportunity } from '../types/options';
import { ScreenerRow } from './screener/ScreenerRow';

interface ScreenerTableProps {
  opportunities: OptionOpportunity[];
  sortBy: keyof OptionOpportunity | 'annualized_roc';
  sortOrder: 'asc' | 'desc';
  onSort: (column: keyof OptionOpportunity | 'annualized_roc') => void;
  onSelectOpportunity: (opportunity: OptionOpportunity) => void;
  onOpenCalculator: (opportunity: OptionOpportunity) => void;
  onStageOrder?: (opportunity: OptionOpportunity) => void;
  onOpenSimulator?: (opportunity: OptionOpportunity) => void;
}

export const ScreenerTable: React.FC<ScreenerTableProps> = ({
  opportunities,
  sortBy,
  sortOrder,
  onSort,
  onSelectOpportunity,
  onOpenCalculator,
  onStageOrder,
  onOpenSimulator,
}) => {
  const renderSortArrow = (column: keyof OptionOpportunity | 'annualized_roc') => {
    if (sortBy !== column) {
      return <ArrowUpDown className="w-3 h-3 text-slate-500 opacity-50" />;
    }
    return (
      <span className="text-emerald-400 font-bold text-xs">
        {sortOrder === 'asc' ? '↑' : '↓'}
      </span>
    );
  };

  return (
    <div className="glass-panel rounded-xl border border-slate-800/80 overflow-hidden shadow-2xl">
      <div className="overflow-x-auto max-h-[720px] overflow-y-auto table-scroll-container">
        <table className="w-full text-left border-collapse table-sticky-header">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/90 text-[11px] font-semibold text-slate-400 uppercase tracking-wider select-none sticky top-0 z-10">
              <th
                onClick={() => onSort('symbol')}
                className="py-3 px-4 cursor-pointer hover:text-slate-200 transition-colors"
              >
                <div className="flex items-center space-x-1.5">
                  <span>Ticker / Asset</span>
                  {renderSortArrow('symbol')}
                </div>
              </th>

              <th
                onClick={() => onSort('strategy')}
                className="py-3 px-3 cursor-pointer hover:text-slate-200 transition-colors"
              >
                <div className="flex items-center space-x-1.5">
                  <span>Strategy</span>
                  {renderSortArrow('strategy')}
                </div>
              </th>

              <th
                onClick={() => onSort('current_price')}
                className="py-3 px-3 cursor-pointer hover:text-slate-200 transition-colors"
              >
                <div className="flex items-center space-x-1.5">
                  <span>Spot / Support</span>
                  {renderSortArrow('current_price')}
                </div>
              </th>

              <th
                onClick={() => onSort('strike')}
                className="py-3 px-3 cursor-pointer hover:text-slate-200 transition-colors"
              >
                <div className="flex items-center space-x-1.5">
                  <span>Strike (Cushion)</span>
                  {renderSortArrow('strike')}
                </div>
              </th>

              <th
                onClick={() => onSort('dte')}
                className="py-3 px-3 cursor-pointer hover:text-slate-200 transition-colors"
              >
                <div className="flex items-center space-x-1.5">
                  <span>DTE (Exp)</span>
                  {renderSortArrow('dte')}
                </div>
              </th>

              <th
                onClick={() => onSort('mid')}
                className="py-3 px-3 cursor-pointer hover:text-slate-200 transition-colors"
              >
                <div className="flex items-center space-x-1.5">
                  <span>Premium (Cash)</span>
                  {renderSortArrow('mid')}
                </div>
              </th>

              <th
                onClick={() => onSort('abs_delta')}
                className="py-3 px-3 cursor-pointer hover:text-slate-200 transition-colors"
              >
                <div className="flex items-center space-x-1.5">
                  <span>Delta (POP)</span>
                  {renderSortArrow('abs_delta')}
                </div>
              </th>

              <th
                onClick={() => onSort('iv_rank')}
                className="py-3 px-3 cursor-pointer hover:text-slate-200 transition-colors"
              >
                <div className="flex items-center space-x-1.5">
                  <span>IV Rank</span>
                  {renderSortArrow('iv_rank')}
                </div>
              </th>

              <th
                onClick={() => onSort('rsi')}
                className="py-3 px-3 cursor-pointer hover:text-slate-200 transition-colors"
              >
                <div className="flex items-center space-x-1.5">
                  <span>RSI (14)</span>
                  {renderSortArrow('rsi')}
                </div>
              </th>

              <th
                onClick={() => onSort('annualized_roc')}
                className="py-3 px-4 cursor-pointer hover:text-slate-200 transition-colors text-right"
              >
                <div className="flex items-center justify-end space-x-1.5">
                  <span>Annualized ROC</span>
                  {renderSortArrow('annualized_roc')}
                </div>
              </th>

              <th className="py-3 px-4 text-center">Action</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-800/60 text-xs">
            {opportunities.length === 0 ? (
              <tr>
                <td colSpan={11} className="py-12 text-center text-slate-400">
                  <div className="max-w-md mx-auto space-y-2">
                    <p className="text-sm font-medium text-slate-300">
                      No options contracts match your current filters.
                    </p>
                    <p className="text-xs text-slate-400">
                      Try increasing Max Delta, lowering Min Annualized Yield, or expanding the DTE window.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              opportunities.map((opp) => (
                <ScreenerRow
                  key={opp.id}
                  opportunity={opp}
                  onSelectOpportunity={onSelectOpportunity}
                  onOpenCalculator={onOpenCalculator}
                  onStageOrder={onStageOrder}
                  onOpenSimulator={onOpenSimulator}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
