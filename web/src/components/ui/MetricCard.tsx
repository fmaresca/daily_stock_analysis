import React from 'react';

export interface MetricCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  change?: string;
  isPositive?: boolean;
  icon?: React.ReactNode;
  tooltip?: string;
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = React.memo(({
  label,
  value,
  subValue,
  change,
  isPositive,
  icon,
  className = '',
}) => {
  return (
    <div className={`p-4 rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm ${className}`}>
      <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
        <span>{label}</span>
        {icon && <span className="text-slate-400">{icon}</span>}
      </div>
      <div className="text-xl font-bold text-white tracking-tight">{value}</div>
      {(subValue || change) && (
        <div className="flex items-center gap-2 mt-1 text-xs">
          {change && (
            <span className={`font-semibold ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
              {change}
            </span>
          )}
          {subValue && <span className="text-slate-400">{subValue}</span>}
        </div>
      )}
    </div>
  );
});

MetricCard.displayName = 'MetricCard';
