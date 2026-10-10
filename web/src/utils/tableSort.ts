/**
 * Universal Table Sorting Engine & React Hook
 *
 * Provides deterministic, type-safe, multi-type sorting across:
 * - Raw numbers and numeric strings ($123.45, +4.5%, 2,500k)
 * - ISO dates (YYYY-MM-DD) and timestamps
 * - Alphabetical strings (case-insensitive)
 * - Nested properties and custom value accessors
 * - Safe null/undefined placement (always pinned at the bottom)
 */

import { useState, useMemo } from 'react';

export type SortOrder = 'asc' | 'desc';

export type ValueAccessor<T> = (item: T) => unknown;

/**
 * Universal Currency & Numeric Input Parser
 * Safely parses formatted currency strings (e.g. "$746,277.69", "746,277.69", "($3,000)"),
 * raw numbers, or empty inputs into clean numeric floats.
 */
export function parseCurrencyInput(value: string | number | undefined | null): number {
  if (value === undefined || value === null) return 0;
  if (typeof value === 'number') return isNaN(value) ? 0 : value;
  const str = String(value).trim();
  if (str === '') return 0;
  const isNegative = str.includes('-') || (str.startsWith('(') && str.endsWith(')'));
  const cleaned = str.replace(/[^0-9.]/g, '');
  const parsed = parseFloat(cleaned);
  if (isNaN(parsed)) return 0;
  return isNegative ? -Math.abs(parsed) : parsed;
}

/**
 * Extracts a comparable primitive (number, date timestamp, or lowercase string) from any value.
 */
export function normalizeSortValue(val: unknown): number | string {
  if (val === null || val === undefined) {
    return '';
  }

  // Direct number
  if (typeof val === 'number') {
    return Number.isFinite(val) ? val : 0;
  }

  // Boolean
  if (typeof val === 'boolean') {
    return val ? 1 : 0;
  }

  // Date object
  if (val instanceof Date) {
    return val.getTime();
  }

  // String normalization
  if (typeof val === 'string') {
    const trimmed = val.trim();

    // Check for currency, percentage, or formatted numbers e.g. "$1,234.56", "+2.5%", "-0.18"
    const cleanedNumeric = trimmed
      .replace(/^\+/, '')
      .replace(/^\$/, '')
      .replace(/%$/, '')
      .replace(/,/g, '');

    // Check if it represents a valid number (and isn't just empty or a symbol like "C")
    if (cleanedNumeric !== '' && !isNaN(Number(cleanedNumeric)) && !/^[a-zA-Z]+$/.test(cleanedNumeric)) {
      return Number(cleanedNumeric);
    }

    // Check for "1,200k", "2.5M", "137.0 B", "$45.5 B", or "1.5 T"
    const withoutCurrency = trimmed.replace(/^\$/, '').trim();
    const kMatch = withoutCurrency.match(/^([\d,.]+)\s*k$/i);
    if (kMatch) {
      const n = Number(kMatch[1].replace(/,/g, ''));
      if (!isNaN(n)) return n * 1000;
    }
    const mMatch = withoutCurrency.match(/^([\d,.]+)\s*m$/i);
    if (mMatch) {
      const n = Number(mMatch[1].replace(/,/g, ''));
      if (!isNaN(n)) return n * 1000000;
    }
    const bMatch = withoutCurrency.match(/^([\d,.]+)\s*b$/i);
    if (bMatch) {
      const n = Number(bMatch[1].replace(/,/g, ''));
      if (!isNaN(n)) return n * 1000000000;
    }
    const tMatch = withoutCurrency.match(/^([\d,.]+)\s*t$/i);
    if (tMatch) {
      const n = Number(tMatch[1].replace(/,/g, ''));
      if (!isNaN(n)) return n * 1000000000000;
    }

    // Check for standard date string (YYYY-MM-DD or ISO timestamp)
    if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
      const parsedTime = Date.parse(trimmed);
      if (!isNaN(parsedTime)) return parsedTime;
    }

    // Check for calendar dates with month abbreviations (e.g. "Mon, Oct 5", "Oct 5, 2026", "Sep 28 08:30 AM")
    if (/(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i.test(trimmed)) {
      const parsedDirect = Date.parse(trimmed);
      if (!isNaN(parsedDirect)) return parsedDirect;
      const currentYear = new Date().getFullYear();
      const withYear = Date.parse(`${trimmed}, ${currentYear}`);
      if (!isNaN(withYear)) return withYear;
    }

    return trimmed.toLowerCase();
  }

  return String(val).toLowerCase();
}

/**
 * Resolves a value from an object using a key or accessor function.
 */
export function getSortValue<T>(item: T, keyOrAccessor: keyof T | string | ValueAccessor<T>): unknown {
  if (typeof keyOrAccessor === 'function') {
    return keyOrAccessor(item);
  }

  if (typeof keyOrAccessor === 'string') {
    // Special handling for Economic Calendar Date & Time column
    if (keyOrAccessor === 'dateET' && typeof item === 'object' && item !== null) {
      const record = item as Record<string, unknown>;
      if (record.isoDate && typeof record.isoDate === 'string') {
        const parsed = Date.parse(record.isoDate);
        if (!isNaN(parsed)) return parsed;
      }
      if (record.dateET) {
        const fullTimeStr = `${record.dateET}${record.timeET ? ' ' + record.timeET : ''}`;
        return fullTimeStr;
      }
    }

    // Nested path support e.g. "extra_fields.market_cap" or "extra_fields.rsi_14"
    if (keyOrAccessor.includes('.')) {
      const parts = keyOrAccessor.split('.');
      let curr: unknown = item;
      for (let i = 0; i < parts.length; i++) {
        if (curr === null || curr === undefined || typeof curr !== 'object') return undefined;
        const p = parts[i];
        const next = (curr as Record<string, unknown>)[p];
        // If market_cap is missing, fallback to market_cap_str
        if (next === undefined && p === 'market_cap' && (curr as Record<string, unknown>)['market_cap_str'] !== undefined) {
          curr = (curr as Record<string, unknown>)['market_cap_str'];
        } else {
          curr = next;
        }
      }
      return curr;
    }

    // Check if market_cap is requested directly on an item with extra_fields
    if (keyOrAccessor === 'market_cap' && typeof item === 'object' && item !== null) {
      const extra = (item as Record<string, any>).extra_fields;
      if (extra) {
        if (extra.market_cap !== undefined) return extra.market_cap;
        if (extra.market_cap_str !== undefined) return extra.market_cap_str;
      }
    }

    if (typeof item === 'object' && item !== null && keyOrAccessor in item) {
      return (item as Record<string, unknown>)[keyOrAccessor];
    }
    return undefined;
  }

  if (typeof item === 'object' && item !== null && keyOrAccessor in item) {
    return (item as Record<string, unknown>)[String(keyOrAccessor)];
  }
  return undefined;
}

/**
 * Compares two items based on a key or accessor function and sort order.
 */
export function compareItems<T>(
  a: T,
  b: T,
  keyOrAccessor: keyof T | string | ValueAccessor<T>,
  order: SortOrder
): number {
  const rawA = getSortValue(a, keyOrAccessor);
  const rawB = getSortValue(b, keyOrAccessor);

  // Empty / undefined values always go to the bottom regardless of order
  const aEmpty = rawA === null || rawA === undefined || rawA === '';
  const bEmpty = rawB === null || rawB === undefined || rawB === '';

  if (aEmpty && bEmpty) return 0;
  if (aEmpty) return 1;
  if (bEmpty) return -1;

  const valA = normalizeSortValue(rawA);
  const valB = normalizeSortValue(rawB);

  let comparison = 0;
  if (typeof valA === 'number' && typeof valB === 'number') {
    comparison = valA - valB;
  } else {
    comparison = String(valA).localeCompare(String(valB));
  }

  return order === 'asc' ? comparison : -comparison;
}

/**
 * Pure function to sort an array of items.
 */
export function sortData<T>(
  items: T[],
  keyOrAccessor: keyof T | string | ValueAccessor<T> | null,
  order: SortOrder = 'asc'
): T[] {
  if (!keyOrAccessor || !items || items.length <= 1) {
    return items;
  }

  return [...items].sort((a, b) => compareItems(a, b, keyOrAccessor, order));
}

export interface UseSortableTableOptions<T> {
  items: T[];
  defaultSortKey?: keyof T | string | ValueAccessor<T> | null;
  defaultSortOrder?: SortOrder;
}

export interface UseSortableTableResult<T> {
  sortedItems: T[];
  sortKey: keyof T | string | ValueAccessor<T> | null;
  sortOrder: SortOrder;
  requestSort: (key: keyof T | string | ValueAccessor<T>) => void;
  setSorting: (key: keyof T | string | ValueAccessor<T> | null, order: SortOrder) => void;
  isSortedBy: (key: keyof T | string | ValueAccessor<T>) => boolean;
}

/**
 * Hook to manage sort state and produce sorted array for tables.
 */
export function useSortableTable<T>({
  items,
  defaultSortKey = null,
  defaultSortOrder = 'asc',
}: UseSortableTableOptions<T>): UseSortableTableResult<T> {
  const [sortKey, setSortKey] = useState<keyof T | string | ValueAccessor<T> | null>(defaultSortKey);
  const [sortOrder, setSortOrder] = useState<SortOrder>(defaultSortOrder);

  const requestSort = (key: keyof T | string | ValueAccessor<T>) => {
    if (sortKey === key) {
      // Toggle direction
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(() => key);
      setSortOrder('asc');
    }
  };

  const setSorting = (key: keyof T | string | ValueAccessor<T> | null, order: SortOrder) => {
    setSortKey(() => key);
    setSortOrder(order);
  };

  const isSortedBy = (key: keyof T | string | ValueAccessor<T>): boolean => {
    return sortKey === key;
  };

  const sortedItems = useMemo(() => {
    return sortData(items, sortKey, sortOrder);
  }, [items, sortKey, sortOrder]);

  return {
    sortedItems,
    sortKey,
    sortOrder,
    requestSort,
    setSorting,
    isSortedBy,
  };
}
