import React from 'react';
import { ShieldCheck, TrendingUp, Layers } from './icons';
import { StrategyType } from '../types/options';

interface StrategyToggleProps {
  selectedStrategy: 'ALL' | StrategyType;
  onChange: (strategy: 'ALL' | StrategyType) => void;
  cspCount: number;
  ccCount: number;
  totalCount: number;
}

export const StrategyToggle: React.FC<StrategyToggleProps> = ({
  selectedStrategy,
  onChange,
  cspCount,
  ccCount,
  totalCount,
}) => {
  return (
    <div className="glass-panel p-2 rounded-xl mb-6 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
      {/* Segmented Button Group */}
      <div className="flex items-center p-1 bg-slate-900/90 rounded-lg border border-slate-800 w-full md:w-auto">
        <button
          onClick={() => onChange('ALL')}
          className={`flex-1 md:flex-none flex items-center justify-center space-x-2 px-4 py-2 rounded-md text-xs font-semibold transition-all ${
            selectedStrategy === 'ALL'
              ? 'bg-slate-800 text-white shadow-md border border-slate-700'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>All Strategies</span>
          <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-slate-700/60 text-slate-300">
            {totalCount}
          </span>
        </button>

        <button
          onClick={() => onChange('CSP')}
          className={`flex-1 md:flex-none flex items-center justify-center space-x-2 px-4 py-2 rounded-md text-xs font-semibold transition-all ${
            selectedStrategy === 'CSP'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
              : 'text-slate-400 hover:text-emerald-400'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Cash-Secured Puts (CSPs)</span>
          <span
            className={`ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
              selectedStrategy === 'CSP'
                ? 'bg-emerald-700 text-emerald-100'
                : 'bg-slate-800 text-slate-400'
            }`}
          >
            {cspCount}
          </span>
        </button>

        <button
          onClick={() => onChange('CC')}
          className={`flex-1 md:flex-none flex items-center justify-center space-x-2 px-4 py-2 rounded-md text-xs font-semibold transition-all ${
            selectedStrategy === 'CC'
              ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/30'
              : 'text-slate-400 hover:text-cyan-400'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Covered Calls (CCs)</span>
          <span
            className={`ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
              selectedStrategy === 'CC'
                ? 'bg-cyan-700 text-cyan-100'
                : 'bg-slate-800 text-slate-400'
            }`}
          >
            {ccCount}
          </span>
        </button>
      </div>

      {/* Explanatory Strategy Subtitle */}
      <div className="text-xs text-slate-400 hidden lg:block pr-2">
        {selectedStrategy === 'CSP' && (
          <span className="text-emerald-400/90 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"></span>
            <strong>Cash-Secured Put Playbook:</strong> Sell OTM puts at support on blue-chips you want to own. Collect pure theta decay.
          </span>
        )}
        {selectedStrategy === 'CC' && (
          <span className="text-cyan-400/90 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 inline-block"></span>
            <strong>Covered Call Playbook:</strong> Monetize existing stock/ETF holdings. Generate high single/double-digit weekly yield.
          </span>
        )}
        {selectedStrategy === 'ALL' && (
          <span className="text-slate-400">
            Comparing Cash-Secured Puts (income on cash) vs. Covered Calls (income on equity holdings).
          </span>
        )}
      </div>
    </div>
  );
};
