import { lazy, ComponentType } from 'react';

/**
 * Robust lazy loading wrapper that detects chunk loading errors
 * (e.g. after a new version deployment where old chunk hashes no longer exist on CDN)
 * and automatically triggers a single page reload to fetch the latest manifest.
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
  chunkName?: string
) {
  return lazy(async () => {
    const sessionKey = `dh_chunk_refreshed_${chunkName || 'component'}`;
    try {
      const res = await factory();
      sessionStorage.removeItem(sessionKey);
      return res;
    } catch (error: any) {
      console.warn(`[lazyWithRetry] Failed to load chunk "${chunkName || 'unknown'}":`, error);
      const isChunkError =
        error?.message?.includes('Failed to fetch dynamically imported module') ||
        error?.message?.includes('dynamically imported module') ||
        error?.name === 'ChunkLoadError' ||
        error?.message?.includes('Loading chunk');

      const alreadyRefreshed = sessionStorage.getItem(sessionKey);

      if (isChunkError && !alreadyRefreshed) {
        console.warn(`[lazyWithRetry] New deployment detected. Reloading to sync chunks for "${chunkName || 'component'}"...`);
        sessionStorage.setItem(sessionKey, 'true');
        window.location.reload();
        // Return unresolved promise to prevent rendering crash while reload completes
        return new Promise<{ default: T }>(() => {});
      }

      // If already refreshed or other error, clear key and throw
      sessionStorage.removeItem(sessionKey);
      throw error;
    }
  });
}
