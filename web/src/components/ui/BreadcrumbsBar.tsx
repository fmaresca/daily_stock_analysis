import React from 'react';
import { MenuTreeType, EquitiesTabType, OptionsTabType } from '../../types/options';
import { Printer } from '../icons';

interface BreadcrumbsBarProps {
  activeTree: MenuTreeType;
  activeEquitiesTab: EquitiesTabType;
  activeOptionsTab: OptionsTabType;
  onNavigateTo: (tree: MenuTreeType, optionsTab?: OptionsTabType, equitiesTab?: EquitiesTabType) => void;
  onOpenCommandPalette: () => void;
  onOpenWatchlist: () => void;
  onOpenReports: () => void;
  onOpenHelp: () => void;
  onPrint: () => void;
}

export const BreadcrumbsBar: React.FC<BreadcrumbsBarProps> = ({
  activeTree,
  activeEquitiesTab,
  activeOptionsTab,
  onNavigateTo,
  onOpenCommandPalette,
  onOpenWatchlist,
  onOpenReports,
  onOpenHelp,
  onPrint,
}) => {
  return (
    <div className="glass-panel px-4 py-2.5 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
      {/* Breadcrumb path */}
      <div className="flex items-center space-x-2 text-slate-400">
        <span className="text-slate-500 font-semibold">📍 Location:</span>
        <button
          onClick={() => onNavigateTo('WORKFLOW', 'SCHWAB_POSITIONS_UPLOAD')}
          className={`hover:underline font-semibold cursor-pointer ${
            activeTree === 'WORKFLOW' ? 'text-emerald-400 font-bold' : 'text-slate-400'
          }`}
        >
          Weekly Workflow
        </button>
        <span>/</span>
        <button
          onClick={() => onNavigateTo('OPTIONS', 'WEEKLY_POSITION_AUDIT')}
          className={`hover:underline font-semibold cursor-pointer ${
            activeTree === 'OPTIONS' ? 'text-indigo-400 font-bold' : 'text-slate-400'
          }`}
        >
          Strategy Labs
        </button>
        <span>/</span>
        <button
          onClick={() => onNavigateTo('EQUITIES', undefined, 'TECHNICAL_SCREENER')}
          className={`hover:underline font-semibold cursor-pointer ${
            activeTree === 'EQUITIES' ? 'text-blue-400 font-bold' : 'text-slate-400'
          }`}
        >
          US Equities
        </button>
        <span>/</span>
        <span className="text-white font-bold font-mono">
          {activeTree === 'METHODOLOGY'
            ? 'QUANTITATIVE METHODOLOGY'
            : activeTree === 'FAQ'
            ? 'INVESTOR FAQ'
            : activeTree === 'DISCLAIMER'
            ? 'REGULATORY DISCLAIMERS'
            : activeTree === 'EQUITIES'
            ? activeEquitiesTab.replace(/_/g, ' ')
            : activeOptionsTab.replace(/_/g, ' ')}
        </span>
      </div>

      {/* Quick-Jump Shortcuts */}
      <div className="flex items-center space-x-2">
        <span className="text-slate-500 text-[11px] hidden md:inline">Jump:</span>
        <button
          onClick={onOpenCommandPalette}
          className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-[11px] font-mono flex items-center space-x-1 transition-colors cursor-pointer"
        >
          <span>Search</span>
          <kbd className="px-1 py-0.2 bg-slate-800 rounded text-[9px] text-slate-400">Ctrl+K</kbd>
        </button>
        <button
          onClick={onOpenWatchlist}
          className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-amber-400 hover:text-amber-300 text-[11px] font-mono flex items-center space-x-1 transition-colors cursor-pointer"
        >
          <span>Watchlist</span>
          <kbd className="px-1 py-0.2 bg-slate-800 rounded text-[9px] text-slate-400">W</kbd>
        </button>
        <button
          onClick={onOpenReports}
          className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-indigo-400 hover:text-indigo-300 text-[11px] font-mono flex items-center space-x-1 transition-colors cursor-pointer"
        >
          <span>Reports</span>
          <kbd className="px-1 py-0.2 bg-slate-800 rounded text-[9px] text-slate-400">R</kbd>
        </button>
        <button
          onClick={onOpenHelp}
          className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-emerald-400 hover:text-emerald-300 text-[11px] font-mono flex items-center space-x-1 transition-colors cursor-pointer"
        >
          <span>Help</span>
          <kbd className="px-1 py-0.2 bg-slate-800 rounded text-[9px] text-slate-400">?</kbd>
        </button>
        <button
          onClick={onPrint}
          className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-blue-400 hover:text-blue-300 text-[11px] font-mono flex items-center space-x-1 transition-colors cursor-pointer"
          title="Print Report / Save PDF"
        >
          <span>Print</span>
          <Printer className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
