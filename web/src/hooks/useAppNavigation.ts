import { useState, useEffect, useCallback } from 'react';
import { MenuTreeType, EquitiesTabType, OptionsTabType } from '../types/options';
import { RouteLocation } from '../types/navigation';

export function parseRouteFromLocation(): RouteLocation {
  if (typeof window === 'undefined') return { tree: 'WORKFLOW' };
  const rawPath = window.location.pathname.toLowerCase().replace(/\/$/, '') || '/';
  const hash = window.location.hash.toLowerCase().replace(/^#\/?/, '');
  const path = hash ? `/${hash}` : rawPath;

  if (path === '/login' || path === '/auth' || path === '/signin') return { tree: 'LOGIN' };
  if (path === '/dashboard' || path === '/workspace' || path === '/portfolio') return { tree: 'DASHBOARD' };
  if (path === '/admin/users' || path === '/admin' || path === '/users') return { tree: 'ADMIN_USERS' };
  if (path === '/settings/password' || path === '/password') return { tree: 'SETTINGS_PASSWORD' };
  if (path === '/methodology' || path === '/rules') return { tree: 'METHODOLOGY' };
  if (path === '/faq' || path === '/questions') return { tree: 'FAQ' };
  if (path === '/disclaimer' || path === '/legal') return { tree: 'DISCLAIMER' };
  if (path === '/equities' || path === '/stocks') return { tree: 'EQUITIES', equitiesTab: 'TECHNICAL_SCREENER' };
  if (path === '/calendar' || path === '/macro') return { tree: 'EQUITIES', equitiesTab: 'ECONOMIC_CALENDAR' };
  if (path === '/charts' || path === '/chart') return { tree: 'EQUITIES', equitiesTab: 'INTERACTIVE_CHARTS' };
  if (path === '/solvency' || path === '/fundamentals') return { tree: 'EQUITIES', equitiesTab: 'FUNDAMENTAL_HEALTH' };
  if (path === '/options' || path === '/income') return { tree: 'OPTIONS', optionsTab: 'INCOME_SCREENER' };
  if (path === '/workflow' || path === '/routine') return { tree: 'WORKFLOW', optionsTab: 'WEEKLY_CASH_LEDGER' };
  if (path === '/spreads') return { tree: 'OPTIONS', optionsTab: 'MULTI_LEG_SPREADS' };
  if (path === '/margin') return { tree: 'OPTIONS', optionsTab: 'PORTFOLIO_MARGIN_SIM' };
  if (path === '/tax') return { tree: 'OPTIONS', optionsTab: 'TAX_ALPHA_OPTIMIZER' };
  if (path === '/staging' || path === '/orders') return { tree: 'OPTIONS', optionsTab: 'BROKER_STAGING' };

  return { tree: 'WORKFLOW', optionsTab: 'SCHWAB_POSITIONS_UPLOAD' };
}

export function useAppNavigation() {
  const [activeTree, setActiveTree] = useState<MenuTreeType>('WORKFLOW');
  const [activeEquitiesTab, setActiveEquitiesTab] = useState<EquitiesTabType>('TECHNICAL_SCREENER');
  const [activeOptionsTab, setActiveOptionsTab] = useState<OptionsTabType>('SCHWAB_POSITIONS_UPLOAD');
  const [activeChartSymbol, setActiveChartSymbol] = useState<string>('TSLA');

  const navigateTo = useCallback(
    (tree: MenuTreeType, optionsTab?: OptionsTabType, equitiesTab?: EquitiesTabType) => {
      setActiveTree(tree);
      if (optionsTab) setActiveOptionsTab(optionsTab);
      if (equitiesTab) setActiveEquitiesTab(equitiesTab);

      if (typeof window !== 'undefined') {
        let targetPath = '/';
        if (tree === 'LOGIN') targetPath = '/login';
        else if (tree === 'DASHBOARD') targetPath = '/dashboard';
        else if (tree === 'ADMIN_USERS') targetPath = '/admin/users';
        else if (tree === 'SETTINGS_PASSWORD') targetPath = '/settings/password';
        else if (tree === 'METHODOLOGY') targetPath = '/methodology';
        else if (tree === 'FAQ') targetPath = '/faq';
        else if (tree === 'DISCLAIMER') targetPath = '/disclaimer';
        else if (tree === 'EQUITIES') {
          if (equitiesTab === 'ECONOMIC_CALENDAR') targetPath = '/calendar';
          else if (equitiesTab === 'INTERACTIVE_CHARTS') targetPath = '/charts';
          else if (equitiesTab === 'FUNDAMENTAL_HEALTH') targetPath = '/solvency';
          else targetPath = '/equities';
        } else if (tree === 'OPTIONS') {
          if (optionsTab === 'MULTI_LEG_SPREADS') targetPath = '/spreads';
          else if (optionsTab === 'PORTFOLIO_MARGIN_SIM') targetPath = '/margin';
          else if (optionsTab === 'TAX_ALPHA_OPTIMIZER') targetPath = '/tax';
          else if (optionsTab === 'BROKER_STAGING') targetPath = '/staging';
          else targetPath = '/options';
        } else {
          targetPath = '/workflow';
        }

        if (window.location.pathname !== targetPath) {
          window.history.pushState({ tree, optionsTab, equitiesTab }, '', targetPath);
        }
      }
    },
    []

  );

  useEffect(() => {
    const handlePopState = () => {
      const route = parseRouteFromLocation();
      setActiveTree(route.tree);
      if (route.optionsTab) setActiveOptionsTab(route.optionsTab);
      if (route.equitiesTab) setActiveEquitiesTab(route.equitiesTab);
    };

    const initial = parseRouteFromLocation();
    if (initial.tree !== 'WORKFLOW') {
      setActiveTree(initial.tree);
      if (initial.optionsTab) setActiveOptionsTab(initial.optionsTab);
      if (initial.equitiesTab) setActiveEquitiesTab(initial.equitiesTab);
    }

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handlePopState);
    };
  }, []);

  return {
    activeTree,
    setActiveTree,
    activeEquitiesTab,
    setActiveEquitiesTab,
    activeOptionsTab,
    setActiveOptionsTab,
    activeChartSymbol,
    setActiveChartSymbol,
    navigateTo,
  };
}
