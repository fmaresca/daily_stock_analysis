/**
 * Standardized Financial & Numerical Formatting Utilities
 * 
 * Consistent currency ($), percentage (%), Greek decimals, volume, and date formatting
 * with guaranteed safe fallbacks for null, undefined, or NaN values.
 */

import { isFiniteNumber } from './financeMath';

export function formatCurrency(
  val: number | null | undefined,
  decimals: number = 2,
  includeSign: boolean = false
): string {
  if (!isFiniteNumber(val)) return '$0.00';
  const prefix = includeSign && val > 0 ? '+$' : val < 0 ? '-$' : '$';
  const absVal = Math.abs(val);
  return `${prefix}${absVal.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}

export function formatPercent(
  val: number | null | undefined,
  decimals: number = 2,
  includeSign: boolean = false
): string {
  if (!isFiniteNumber(val)) return '0.00%';
  const sign = includeSign && val > 0 ? '+' : '';
  return `${sign}${val.toFixed(decimals)}%`;
}

export function formatGreek(val: number | null | undefined, decimals: number = 4): string {
  if (!isFiniteNumber(val)) return '0.0000';
  return val.toFixed(decimals);
}

export function formatLargeNumber(val: number | null | undefined): string {
  if (!isFiniteNumber(val)) return '0';
  const abs = Math.abs(val);
  if (abs >= 1e9) {
    return `${(val / 1e9).toFixed(2)}B`;
  }
  if (abs >= 1e6) {
    return `${(val / 1e6).toFixed(2)}M`;
  }
  if (abs >= 1e3) {
    return `${(val / 1e3).toFixed(1)}K`;
  }
  return val.toLocaleString('en-US');
}

export function formatDateString(dateStr: string | null | undefined): string {
  if (!dateStr) return '--';
  try {
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateStr || '--';
  }
}

export function formatTimeAgo(dateStr: string | null | undefined): string {
  if (!dateStr) return '--';
  try {
    const past = new Date(dateStr).getTime();
    if (Number.isNaN(past)) return dateStr;
    const now = Date.now();
    const diffSec = Math.max(0, Math.floor((now - past) / 1000));
    if (diffSec < 60) return `${diffSec}s ago`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  } catch {
    return dateStr || '--';
  }
}
