import React, { useState, useEffect } from 'react';
import { CheckCircle2, Circle, Clock, Calendar, Star, HelpCircle, X, ChevronRight, Compass } from '../icons';

interface StartHereChecklistProps {
  onNavigateToRitualStep1: () => void;
  onNavigateToCalendar: () => void;
  onOpenWatchlists: () => void;
  onOpenHandbookTour: () => void;
  className?: string;
}

export const StartHereChecklist: React.FC<StartHereChecklistProps> = ({
  onNavigateToRitualStep1,
  onNavigateToCalendar,
  onOpenWatchlists,
  onOpenHandbookTour,
  className = '',
}) => {
  const [isDismissed, setIsDismissed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('deltaharvest_start_here_dismissed') === 'true';
    } catch {
      return false;
    }
  });

  const [completedSteps, setCompletedSteps] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('deltaharvest_start_here_completed');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const markStepDone = (stepId: string) => {
    setCompletedSteps((prev) => {
      if (prev.includes(stepId)) return prev;
      const next = [...prev, stepId];
      try {
        localStorage.setItem('deltaharvest_start_here_completed', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    try {
      localStorage.setItem('deltaharvest_start_here_dismissed', 'true');
    } catch {}
  };

  // Re-opening listener for Help / Settings triggers
  useEffect(() => {
    const handleReopen = () => {
      setIsDismissed(false);
      try {
        localStorage.removeItem('deltaharvest_start_here_dismissed');
      } catch {}
    };
    window.addEventListener('deltaharvest_open_start_here', handleReopen);
    return () => {
      window.removeEventListener('deltaharvest_open_start_here', handleReopen);
    };
  }, []);

  if (isDismissed) return null;

  const steps = [
    {
      id: 'step1_ritual',
      title: '1. Run Weekend Ritual Step 1',
      description: 'Upload your Schwab positions CSV to sync your cash and collateral reserves.',
      icon: <Clock className="w-4 h-4 text-emerald-400" />,
      actionLabel: 'Upload Positions',
      action: () => {
        markStepDone('step1_ritual');
        onNavigateToRitualStep1();
      },
    },
    {
      id: 'step2_calendar',
      title: '2. Review the Economic Calendar',
      description: 'Check this week’s high-impact macroeconomic indicators (CPI, FOMC, NFP) to guard against binary event risk.',
      icon: <Calendar className="w-4 h-4 text-blue-400" />,
      actionLabel: 'View Calendar',
      action: () => {
        markStepDone('step2_calendar');
        onNavigateToCalendar();
      },
    },
    {
      id: 'step3_watchlists',
      title: '3. Open Your Watchlists',
      description: 'Create custom symbol groups or review core equities monitored for options screening.',
      icon: <Star className="w-4 h-4 text-amber-400" />,
      actionLabel: 'Manage Watchlists',
      action: () => {
        markStepDone('step3_watchlists');
        onOpenWatchlists();
      },
    },
    {
      id: 'step4_tour',
      title: '4. Take the Strategy Handbook Tour',
      description: 'Read the platform overview tour chapter and understand the conservative cash-secured put guidelines.',
      icon: <Compass className="w-4 h-4 text-cyan-400" />,
      actionLabel: 'Take the Tour',
      action: () => {
        markStepDone('step4_tour');
        onOpenHandbookTour();
      },
    },
  ];

  const progressCount = completedSteps.length;
  const progressPct = Math.round((progressCount / steps.length) * 100);

  return (
    <div
      className={`p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 border border-emerald-500/40 shadow-xl space-y-3 relative overflow-hidden animate-fade-in ${className}`}
    >
      {/* Background Accent Pill */}
      <div className="absolute top-0 right-0 w-64 h-32 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-300 font-bold text-sm">
            🚀
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-bold text-white text-sm">Start Here: New User Quickstart</h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                {progressCount} / {steps.length} Complete
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Complete these 4 foundational actions to master the DeltaHarvest platform.
            </p>
          </div>
        </div>

        <button
          onClick={handleDismiss}
          className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          title="Dismiss quickstart checklist (re-open anytime from Help)"
          aria-label="Dismiss quickstart checklist"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
        <div
          className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full transition-all duration-500 ease-out"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* 4 Steps Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
        {steps.map((s) => {
          const isDone = completedSteps.includes(s.id);
          return (
            <div
              key={s.id}
              onClick={s.action}
              className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between group ${
                isDone
                  ? 'bg-emerald-950/20 border-emerald-500/30 hover:border-emerald-500/50'
                  : 'bg-slate-900/60 border-slate-800 hover:bg-slate-800/80 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center space-x-1.5">
                    {s.icon}
                    <span className="font-bold text-xs text-white group-hover:text-emerald-300 transition-colors">
                      {s.title}
                    </span>
                  </div>
                  {isDone ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <Circle className="w-4 h-4 text-slate-600 shrink-0" />
                  )}
                </div>
                <p className="text-[10px] text-slate-400 leading-snug line-clamp-2">
                  {s.description}
                </p>
              </div>

              <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] font-semibold text-emerald-400">
                <span>{isDone ? 'Completed' : s.actionLabel}</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
