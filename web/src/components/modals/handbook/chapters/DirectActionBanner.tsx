import React from 'react';
import { ExternalLink } from '../../../icons';

export interface DirectActionItem {
  label: string;
  location: string;
  onClick?: () => void;
  badge?: string;
}

export interface DirectActionBannerProps {
  title?: string;
  actions: DirectActionItem[];
}

export const DirectActionBanner: React.FC<DirectActionBannerProps> = ({
  title = 'Direct In-App Navigation',
  actions,
}) => {
  return (
    <div className="mb-4 p-3 bg-gradient-to-r from-slate-900/95 via-slate-800/80 to-slate-900/95 border border-emerald-500/30 rounded-xl shadow-lg shadow-black/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <span className="flex h-2 w-2 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 font-mono">
            {title}
          </span>
          <p className="text-[11px] text-slate-400">
            Click any live action below to jump directly to this functionality in DeltaHarvest:
          </p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {actions.map((act, idx) => (
          <button
            key={idx}
            onClick={act.onClick}
            disabled={!act.onClick}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 hover:text-white border border-emerald-500/40 hover:border-emerald-400 text-xs font-medium transition-all shadow-sm group cursor-pointer disabled:opacity-50"
            title={`Navigate directly to ${act.location}`}
          >
            <span>{act.label}</span>
            <span className="text-[10px] text-slate-400 font-mono group-hover:text-emerald-200">
              [{act.location}]
            </span>
            <ExternalLink className="w-3 h-3 text-emerald-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </button>
        ))}
      </div>
    </div>
  );
};
