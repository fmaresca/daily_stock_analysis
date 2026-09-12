import { useEffect } from 'react';
import { MenuTreeType, OptionsTabType } from '../types/options';

interface ShortcutHandlers {
  onToggleCommandPalette: () => void;
  onToggleHelpModal: () => void;
  onToggleWatchlistModal: () => void;
  onToggleReportQueryModal: () => void;
  onSelectTree: (tree: MenuTreeType) => void;
  onNavigateOptionsTab?: (tab: OptionsTabType) => void;
}

export function useGlobalShortcuts({
  onToggleCommandPalette,
  onToggleHelpModal,
  onToggleWatchlistModal,
  onToggleReportQueryModal,
  onSelectTree,
  onNavigateOptionsTab,
}: ShortcutHandlers) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is actively typing in an input, textarea, or select field
      const activeTag = (document.activeElement?.tagName || '').toLowerCase();
      if (['input', 'textarea', 'select'].includes(activeTag)) {
        return;
      }

      // Ctrl+K / Cmd+K: Command Palette
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        onToggleCommandPalette();
        return;
      }

      // Help: '?' or Ctrl+/
      if (e.key === '?' || (e.ctrlKey && e.key === '/')) {
        e.preventDefault();
        onToggleHelpModal();
        return;
      }

      // 'w' / 'W': Watchlists
      if (e.key.toLowerCase() === 'w') {
        e.preventDefault();
        onToggleWatchlistModal();
        return;
      }

      // 'r' / 'R': Reports
      if (e.key.toLowerCase() === 'r') {
        e.preventDefault();
        onToggleReportQueryModal();
        return;
      }

      // '1': Equities Tree
      if (e.key === '1') {
        e.preventDefault();
        onSelectTree('EQUITIES');
        return;
      }

      // '2': Options Tree
      if (e.key === '2') {
        e.preventDefault();
        onSelectTree('OPTIONS');
        return;
      }

      // Alt+S: Broker Staging Workbench
      if (e.altKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        onSelectTree('OPTIONS');
        if (onNavigateOptionsTab) onNavigateOptionsTab('BROKER_STAGING');
        return;
      }

      // Alt+E: Executive Portfolio Digest
      if (e.altKey && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        onSelectTree('OPTIONS');
        if (onNavigateOptionsTab) onNavigateOptionsTab('EXECUTIVE_DIGEST');
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    onToggleCommandPalette,
    onToggleHelpModal,
    onToggleWatchlistModal,
    onToggleReportQueryModal,
    onSelectTree,
    onNavigateOptionsTab,
  ]);
}
