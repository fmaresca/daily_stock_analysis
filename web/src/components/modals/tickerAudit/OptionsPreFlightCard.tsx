import React, { useState } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Zap,
  Bookmark,
  ChevronDown,
  ChevronUp,
} from '../../icons';
import { OptionsPreFlightAudit, PreFlightCheckItem } from '../../../utils/optionsPreFlightEvaluator';

interface OptionsPreFlightCardProps {
  audit: OptionsPreFlightAudit;
  onPinToJournal?: () => void;
  isPinned?: boolean;
}

export const OptionsPreFlightCard: React.FC<OptionsPreFlightCardProps> = ({
  audit,
  onPinToJournal,
  isPinned = false,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  const toggleCheck = (id: string) => {
    setCheckedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const getStatusBadge = (status: PreFlightCheckItem['status']) => {
    if (status === 'PASS') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
          <span>PASS</span>
        </span>
      );
    }
    if (status === 'CAUTION') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
          <AlertTriangle className="w-3 h-3 text-amber-400" />
          <span>CAUTION</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
        <ShieldAlert className="w-3 h-3 text-rose-400" />
        <span>FAIL</span>
      </span>
    );
  };

  const isPrime = audit.overallRating === 'PRIME';
  const isAvoid = audit.overallRating === 'AVOID';

  return (
    <div
      className={`rounded-xl border transition-all ${
        isPrime
          ? 'bg-gradient-to-br from-emerald-950/40 via-slate-900/80 to-slate-950 border-emerald-500/30 shadow-lg shadow-emerald-950/20'
          : isAvoid
          ? 'bg-gradient-to-br from-rose-950/30 via-slate-900/80 to-slate-950 border-rose-500/30'
          : 'bg-gradient-to-br from-amber-950/30 via-slate-900/80 to-slate-950 border-amber-500/30'
      }`}
    >
      {/* Header Banner */}
      <div className="p-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div
            className={`p-2 rounded-lg border ${
              isPrime
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                : isAvoid
                ? 'bg-rose-500/20 border-rose-500/40 text-rose-400'
                : 'bg-amber-500/20 border-amber-500/40 text-amber-400'
            }`}
          >
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
                <span>Options Pre-Flight Execution Scorecard</span>
              </h3>
              <span
                className={`text-[10px] px-2 py-0.5 rounded font-black font-mono border ${
                  isPrime
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : isAvoid
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                }`}
              >
                {audit.scoreLabel}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Institutional 5-point verification matrix for {audit.symbol} options underwriting
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Readiness Score Pill */}
          <div className="bg-slate-950/80 px-3 py-1.5 rounded-lg border border-slate-800 text-right">
            <div className="text-[10px] text-slate-400 font-semibold uppercase">Readiness Score</div>
            <div className="text-sm font-black font-mono text-white flex items-center justify-end gap-1">
              <span
                className={
                  isPrime ? 'text-emerald-400' : isAvoid ? 'text-rose-400' : 'text-amber-400'
                }
              >
                {audit.overallScore.toFixed(1)}
              </span>
              <span className="text-slate-500 text-xs">/ 5.0</span>
            </div>
          </div>

          {onPinToJournal && (
            <button
              type="button"
              onClick={onPinToJournal}
              disabled={isPinned}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border ${
                isPinned
                  ? 'bg-emerald-900/40 text-emerald-300 border-emerald-500/40 cursor-default'
                  : 'bg-blue-600 hover:bg-blue-500 text-white border-blue-400/50 shadow-sm'
              }`}
              title="Track this strategy target in your Options Signal Journal"
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>{isPinned ? 'Tracked in Journal' : 'Track in Journal'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
            title={isExpanded ? 'Collapse checklist' : 'Expand checklist'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Strategic Recommendation Bar */}
      <div className="px-4 py-2.5 bg-slate-950/60 flex flex-wrap items-center justify-between gap-2 text-xs border-b border-slate-800/60">
        <div className="flex items-center gap-2">
          <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="text-slate-300 font-semibold">Recommended Playbook:</span>
          <span className="text-white font-mono font-bold bg-slate-800 px-2 py-0.5 rounded text-[11px]">
            {audit.recommendedStrategy === 'CSP'
              ? 'Cash-Secured Put (Income)'
              : audit.recommendedStrategy === 'CC'
              ? 'Covered Call (Yield)'
              : 'Stand Aside / Wait'}
          </span>
          <span className="text-slate-400 italic">“{audit.recommendedStrikeDescription}”</span>
        </div>
        <div className="text-[11px] font-mono text-slate-400">
          <span>{audit.passCount} Pass</span> • <span>{audit.cautionCount} Caution</span> •{' '}
          <span className={audit.failCount > 0 ? 'text-rose-400 font-bold' : ''}>
            {audit.failCount} Fail
          </span>
        </div>
      </div>

      {/* 5-Rule Checklist Items */}
      {isExpanded && (
        <div className="p-4 space-y-2.5">
          {audit.checks.map((c) => {
            const isChecked = checkedItems[c.id] || false;
            return (
              <div
                key={c.id}
                onClick={() => toggleCheck(c.id)}
                className={`p-3 rounded-lg border transition-all cursor-pointer select-none flex items-start gap-3 ${
                  isChecked
                    ? 'bg-slate-950/40 border-slate-700/60 opacity-80'
                    : 'bg-slate-950/80 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                {/* Checkbox box */}
                <div className="pt-0.5 shrink-0">
                  <div
                    className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                      isChecked
                        ? 'bg-emerald-600 border-emerald-400 text-white'
                        : 'border-slate-600 hover:border-slate-400'
                    }`}
                  >
                    {isChecked && <CheckCircle2 className="w-3.5 h-3.5" />}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold ${isChecked ? 'line-through text-slate-400' : 'text-slate-200'}`}>
                        {c.title}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">({c.category})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono text-slate-300 font-semibold">{c.metric}</span>
                      {getStatusBadge(c.status)}
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    {c.explanation}
                  </p>
                  <p className="text-[11px] text-emerald-400/90 font-medium mt-0.5">
                    💡 <span className="underline">Actionable Mandate:</span> {c.recommendation}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
