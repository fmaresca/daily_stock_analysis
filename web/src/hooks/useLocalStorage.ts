/**
 * Custom hook for synchronized reactive state in LocalStorage.
 * Handles parsing errors, in-memory caching, and cross-tab storage events.
 */

import { useState, useEffect, useCallback } from 'react';
import { StorageService } from '../utils/storageService';

export function useLocalStorage<T>(key: string, initialValue: T, eventName?: string): [T, (val: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    return StorageService.get<T>(key, initialValue);
  });

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setStoredValue((prev) => {
        const valueToStore = value instanceof Function ? value(prev) : value;
        StorageService.set<T>(key, valueToStore, eventName);
        return valueToStore;
      });
    },
    [key, eventName]
  );

  useEffect(() => {
    if (!eventName) return;
    const handleCustomEvent = (e: Event) => {
      const customEvent = e as CustomEvent<T>;
      if (customEvent.detail !== undefined) {
        setStoredValue(customEvent.detail);
      } else {
        setStoredValue(StorageService.get<T>(key, initialValue));
      }
    };

    window.addEventListener(eventName, handleCustomEvent);
    return () => {
      window.removeEventListener(eventName, handleCustomEvent);
    };
  }, [key, eventName, initialValue]);

  return [storedValue, setValue];
}
