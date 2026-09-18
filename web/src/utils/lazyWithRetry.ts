import { lazy, ComponentType } from 'react';

/**
 * Robust lazy loading wrapper that catches transient chunk loading glitches
 * and retries the dynamic import in-memory without causing browser reload loops.
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
  chunkName?: string
) {
  return lazy(async () => {
    try {
      return await factory();
    } catch (error: any) {
      console.warn(`[lazyWithRetry] Initial load failed for "${chunkName || 'component'}". Retrying in-memory...`, error);
      // Wait 300ms and retry in-memory once (transient network or CDN warm-up)
      await new Promise((resolve) => setTimeout(resolve, 300));
      try {
        return await factory();
      } catch (retryError) {
        console.error(`[lazyWithRetry] Module import failed for "${chunkName || 'component'}":`, retryError);
        throw retryError;
      }
    }
  });
}
