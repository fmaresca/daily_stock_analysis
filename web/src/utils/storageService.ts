/**
 * Robust, Typed LocalStorage Service with In-Memory Cache and Window Event Sync
 * 
 * Protects against disk I/O freezes, JSON parse corruptions, and SSR/Edge runtime crashes.
 */

const memoryCache = new Map<string, unknown>();

export const StorageService = {
  get<T>(key: string, defaultValue: T): T {
    if (typeof window === 'undefined' || !window.localStorage) {
      return defaultValue;
    }
    if (memoryCache.has(key)) {
      return memoryCache.get(key) as T;
    }
    try {
      const raw = window.localStorage.getItem(key);
      if (raw === null) {
        memoryCache.set(key, defaultValue);
        return defaultValue;
      }
      const parsed = JSON.parse(raw) as T;
      memoryCache.set(key, parsed);
      return parsed;
    } catch (err) {
      console.warn(`[StorageService] Failed to parse key "${key}":`, err);
      return defaultValue;
    }
  },

  set<T>(key: string, value: T, notifyEvent?: string): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      memoryCache.set(key, value);
      window.localStorage.setItem(key, JSON.stringify(value));
      if (notifyEvent) {
        window.dispatchEvent(new CustomEvent(notifyEvent, { detail: value }));
      }
    } catch (err) {
      console.error(`[StorageService] Failed to set key "${key}":`, err);
    }
  },

  remove(key: string, notifyEvent?: string): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      memoryCache.delete(key);
      window.localStorage.removeItem(key);
      if (notifyEvent) {
        window.dispatchEvent(new CustomEvent(notifyEvent));
      }
    } catch (err) {
      console.error(`[StorageService] Failed to remove key "${key}":`, err);
    }
  },

  clearCache(): void {
    memoryCache.clear();
  },
};
