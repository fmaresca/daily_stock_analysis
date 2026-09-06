import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'neutral';
  size?: 'xs' | 'sm' | 'md';
  className?: string;
  icon?: React.ReactNode;
}

const variantStyles: Record<NonNullable<BadgeProps['variant']>, string> = {
  default: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  warning: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  danger: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
  info: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
  purple: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
  neutral: 'bg-slate-800 text-slate-300 border-slate-700',
};

const sizeStyles: Record<NonNullable<BadgeProps['size']>, string> = {
  xs: 'text-[10px] px-1.5 py-0.5 font-medium',
  sm: 'text-xs px-2 py-0.5 font-medium',
  md: 'text-sm px-2.5 py-1 font-semibold',
};

export const Badge: React.FC<BadgeProps> = React.memo(({
  children,
  variant = 'default',
  size = 'sm',
  className = '',
  icon,
}) => {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded border ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </span>
  );
});

Badge.displayName = 'Badge';
