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

    // Check for "1,200k" or "2.5M"
    const kMatch = trimmed.match(/^([\d,.]+)\s*k$/i);
    if (kMatch) {
      const n = Number(kMatch[1].replace(/,/g, ''));
      if (!isNaN(n)) return n * 1000;
    }
    const mMatch = trimmed.match(/^([\d,.]+)\s*m$/i);
    if (mMatch) {
      const n = Number(mMatch[1].replace(/,/g, ''));
      if (!isNaN(n)) return n * 1000000;
    }

    // Check for standard date string (YYYY-MM-DD)
    if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
      const parsedTime = Date.parse(trimmed);
      if (!isNaN(parsedTime)) return parsedTime;
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
    // Nested path support e.g. "extra_fields.rsi_14"
    if (keyOrAccessor.includes('.')) {
      const parts = keyOrAccessor.split('.');
      let curr: any = item;
      for (const p of parts) {
        if (curr === null || curr === undefined) return undefined;
        curr = curr[p];
      }
      return curr;
    }

    return (item as any)[keyOrAccessor];
  }

  return (item as any)[keyOrAccessor];
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
