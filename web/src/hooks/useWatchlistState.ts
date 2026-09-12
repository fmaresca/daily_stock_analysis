import { useState, useMemo, useEffect, useCallback } from 'react';
import { WatchlistGroup } from '../types/options';

export const DEFAULT_UNIVERSE_SYMBOLS = [
  'AXTI', 'BLZE', 'IONQ', 'LUNR', 'NET', 'RTX', 'TSLA',
];

export const INITIAL_WATCHLIST_GROUPS: WatchlistGroup[] = [
  {
    id: 'living-trust-equities',
    name: 'Living Trust Equities',
    description: 'Equities in Living Trust-Options ...609 account (AXTI, BLZE, IONQ, LUNR, NET, RTX, TSLA)',
    tickers: DEFAULT_UNIVERSE_SYMBOLS,
    isDefault: true,
    createdAt: new Date().toISOString(),
  },
];

export function useWatchlistState() {
  const [watchlistGroups, setWatchlistGroups] = useState<WatchlistGroup[]>(() => {
    try {
      const saved = localStorage.getItem('deltaharvest_watchlist_groups');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Eliminate legacy hardcoded groups
          const filtered = parsed.filter((g: WatchlistGroup) => {
            if (g.id === 'tier-1-liquid' || g.name === 'Tier 1 Ultra-Liquid') return false;
            if (g.id === 'high-yield-etfs' || g.name === 'Dividend, CEFs & High-Yield') return false;
            if (g.id === 'frank-favorites' || g.name === 'Frank Favorites') {
              const hasLegacy22 = g.tickers.includes('SPY') && g.tickers.includes('QQQ') && g.tickers.includes('JEPI');
              if (hasLegacy22) return false;
            }
            return true;
          });

          const hasLivingTrust = filtered.some(
            (g: WatchlistGroup) => g.id === 'living-trust-equities' || g.name === 'Living Trust Equities'
          );

          let updatedGroups = [...filtered];
          if (!hasLivingTrust) {
            updatedGroups.unshift(INITIAL_WATCHLIST_GROUPS[0]);
          } else {
            updatedGroups = updatedGroups.map((g) =>
              g.id === 'living-trust-equities' ? { ...g, isDefault: true } : g
            );
          }

          localStorage.setItem('deltaharvest_watchlist_groups', JSON.stringify(updatedGroups));
          return updatedGroups;
        }
      }
    } catch (e) {
      console.warn('Failed to load watchlist groups:', e);
    }
    return INITIAL_WATCHLIST_GROUPS;
  });

  const [activeGroupId, setActiveGroupId] = useState<string>(() => {
    const saved = localStorage.getItem('deltaharvest_active_group_id');
    if (
      !saved ||
      saved === 'core-18' ||
      saved === 'core-universe' ||
      saved === 'frank-favorites' ||
      saved === 'tier-1-liquid' ||
      saved === 'high-yield-etfs'
    ) {
      return 'living-trust-equities';
    }
    return saved;
  });

  const [showWatchlistOnly, setShowWatchlistOnly] = useState<boolean>(false);

  // Sync watchlist groups to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('deltaharvest_watchlist_groups', JSON.stringify(watchlistGroups));
      localStorage.setItem('deltaharvest_active_group_id', activeGroupId);
    } catch (e) {
      console.warn('Failed to save watchlists:', e);
    }
  }, [watchlistGroups, activeGroupId]);

  const activeGroup = useMemo(() => {
    return watchlistGroups.find((g) => g.id === activeGroupId) || watchlistGroups[0];
  }, [watchlistGroups, activeGroupId]);

  const currentWatchlistSymbols = activeGroup?.tickers || DEFAULT_UNIVERSE_SYMBOLS;

  const handleToggleWatchlist = useCallback(
    (symbol: string) => {
      const isPresent = currentWatchlistSymbols.includes(symbol);
      const updated = isPresent
        ? currentWatchlistSymbols.filter((s) => s !== symbol)
        : [...currentWatchlistSymbols, symbol];

      setWatchlistGroups((prev) =>
        prev.map((g) => (g.id === activeGroup.id ? { ...g, tickers: updated } : g))
      );
    },
    [currentWatchlistSymbols, activeGroup.id]
  );

  const handleCreateWatchlist = useCallback((name: string, tickers: string[] = []) => {
    const newGroup: WatchlistGroup = {
      id: 'custom-' + Date.now(),
      name,
      tickers,
      isDefault: false,
      createdAt: new Date().toISOString(),
    };
    setWatchlistGroups((prev) => [...prev, newGroup]);
    setActiveGroupId(newGroup.id);
  }, []);

  const handleRenameWatchlist = useCallback((groupId: string, newName: string) => {
    const cleanName = newName.trim();
    if (!cleanName) return;
    setWatchlistGroups((prev) =>
      prev.map((g) =>
        g.id === groupId
          ? { ...g, name: cleanName, updatedAt: new Date().toISOString() }
          : g
      )
    );
  }, []);

  const handleDeleteWatchlist = useCallback(
    (groupId: string) => {
      setWatchlistGroups((prev) => {
        if (prev.length <= 1) return prev;
        const remaining = prev.filter((g) => g.id !== groupId);
        if (activeGroupId === groupId) {
          setActiveGroupId(remaining[0]?.id || 'living-trust-equities');
        }
        return remaining;
      });
    },
    [activeGroupId]
  );

  const handleUpdateGroupTickers = useCallback((groupId: string, tickers: string[]) => {
    setWatchlistGroups((prev) =>
      prev.map((g) => (g.id === groupId ? { ...g, tickers } : g))
    );
  }, []);

  return {
    watchlistGroups,
    setWatchlistGroups,
    activeGroupId,
    setActiveGroupId,
    activeGroup,
    currentWatchlistSymbols,
    showWatchlistOnly,
    setShowWatchlistOnly,
    handleToggleWatchlist,
    handleCreateWatchlist,
    handleRenameWatchlist,
    handleDeleteWatchlist,
    handleUpdateGroupTickers,
  };
}
