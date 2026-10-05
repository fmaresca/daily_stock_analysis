import { useState, useEffect, useCallback } from 'react';
import type { MenuTreeType, EquitiesTabType, OptionsTabType } from '../types/options.ts';
import type { RouteLocation } from '../types/navigation.ts';

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

  // Equities Universe Routes & Section Deep Links
  if (
    path === '/equities/screeners' ||
    path === '/equities/weekly' ||
    path === '/equities/weekly-screeners' ||
    path === '/equities/barchart' ||
    path === '/equities/watchlist' ||
    path === '/equities/watchlist-builder' ||
    path === '/equities/watchlists' ||
    path === '/watchlist-builder' ||
    path === '/screeners'
  ) {
    return { tree: 'EQUITIES', equitiesTab: 'WEEKLY_STOCK_SCREENERS' };
  }
  if (path === '/charts' || path === '/chart' || path === '/equities/charts' || path === '/equities/chart') {
    return { tree: 'EQUITIES', equitiesTab: 'INTERACTIVE_CHARTS' };
  }
  if (path === '/solvency' || path === '/fundamentals' || path === '/equities/solvency' || path === '/equities/fundamentals') {
    return { tree: 'EQUITIES', equitiesTab: 'FUNDAMENTAL_HEALTH' };
  }
  if (path === '/calendar' || path === '/macro' || path === '/equities/calendar') {
    return { tree: 'EQUITIES', equitiesTab: 'ECONOMIC_CALENDAR' };
  }
  if (path === '/equities/trend' || path === '/equities/support') {
    return { tree: 'EQUITIES', equitiesTab: 'TREND_SUPPORT' };
  }
  if (path === '/equities/volatility' || path === '/equities/risk') {
    return { tree: 'EQUITIES', equitiesTab: 'VOLATILITY_RISK' };
  }
  if (path === '/equities/earnings') {
    return { tree: 'EQUITIES', equitiesTab: 'EARNINGS_CALENDAR' };
  }
  if (path === '/equities/sectors' || path === '/equities/sector') {
    return { tree: 'EQUITIES', equitiesTab: 'SECTOR_OVERVIEW' };
  }
  if (path === '/equities' || path === '/stocks' || path === '/equities/screener' || path === '/screener') {
    return { tree: 'EQUITIES', equitiesTab: 'TECHNICAL_SCREENER' };
  }
  if (path.startsWith('/equities')) {
    return { tree: 'EQUITIES', equitiesTab: 'TECHNICAL_SCREENER' };
  }

  // Options Strategy Labs Routes & Section Deep Links
  if (path === '/spreads' || path === '/options/spreads') {
    return { tree: 'OPTIONS', optionsTab: 'MULTI_LEG_SPREADS' };
  }
  if (path === '/margin' || path === '/options/margin') {
    return { tree: 'OPTIONS', optionsTab: 'PORTFOLIO_MARGIN_SIM' };
  }
  if (path === '/tax' || path === '/options/tax') {
    return { tree: 'OPTIONS', optionsTab: 'TAX_ALPHA_OPTIMIZER' };
  }
  if (path === '/staging' || path === '/orders' || path === '/options/staging') {
    return { tree: 'OPTIONS', optionsTab: 'BROKER_STAGING' };
  }
  if (path === '/options/pmcc' || path === '/pmcc') {
    return { tree: 'OPTIONS', optionsTab: 'PMCC_SCREENER' };
  }
  if (path === '/options/chain' || path === '/chain') {
    return { tree: 'OPTIONS', optionsTab: 'OPTION_CHAIN_MATRIX' };
  }
  if (path === '/options/skew' || path === '/skew') {
    return { tree: 'OPTIONS', optionsTab: 'VOLATILITY_SKEW' };
  }
  if (path === '/options/roll' || path === '/roll') {
    return { tree: 'OPTIONS', optionsTab: 'DEFENSIVE_ROLL_ASSISTANT' };
  }
  if (path === '/options/ai' || path === '/ai-options') {
    return { tree: 'OPTIONS', optionsTab: 'AI_OPTIONS_INCOME' };
  }
  if (path === '/options/backtest' || path === '/backtest') {
    return { tree: 'OPTIONS', optionsTab: 'BACKTEST_MARGIN' };
  }
  if (path === '/options/audit' || path === '/options/position-audit') {
    return { tree: 'OPTIONS', optionsTab: 'WEEKLY_POSITION_AUDIT' };
  }
  if (path === '/options' || path === '/income' || path === '/options/income' || path === '/options/screener') {
    return { tree: 'OPTIONS', optionsTab: 'INCOME_SCREENER' };
  }
  if (path.startsWith('/options')) {
    return { tree: 'OPTIONS', optionsTab: 'INCOME_SCREENER' };
  }

  // End-of-Week Guided Workflow Routes & Steps
  if (path === '/workflow/cash' || path === '/workflow/step2') return { tree: 'WORKFLOW', optionsTab: 'WEEKLY_CASH_LEDGER' };
  if (path === '/workflow/holdings' || path === '/workflow/step3') return { tree: 'WORKFLOW', optionsTab: 'HOLDINGS_COVERED_CALLS' };
  if (path === '/workflow/calendar' || path === '/workflow/step4') return { tree: 'WORKFLOW', optionsTab: 'ECONOMIC_CALENDAR' };
  if (path === '/workflow/screener' || path === '/workflow/step5') return { tree: 'WORKFLOW', optionsTab: 'CASCADING_SCREENER' };
  if (path === '/workflow/report' || path === '/workflow/step6') return { tree: 'WORKFLOW', optionsTab: 'WEEKLY_EXECUTIVE_REPORT' };
  if (path === '/workflow/staging' || path === '/workflow/step7') return { tree: 'WORKFLOW', optionsTab: 'BROKER_STAGING' };
  if (path === '/workflow' || path === '/workflow/upload' || path === '/workflow/step1' || path === '/routine') {
    return { tree: 'WORKFLOW', optionsTab: 'SCHWAB_POSITIONS_UPLOAD' };
  }
  if (path.startsWith('/workflow')) {
    return { tree: 'WORKFLOW', optionsTab: 'SCHWAB_POSITIONS_UPLOAD' };
  }

  return { tree: 'WORKFLOW', optionsTab: 'SCHWAB_POSITIONS_UPLOAD' };
}

export function useAppNavigation() {
  const [activeTree, setActiveTree] = useState<MenuTreeType>(() => parseRouteFromLocation().tree);
  const [activeEquitiesTab, setActiveEquitiesTab] = useState<EquitiesTabType>(() => parseRouteFromLocation().equitiesTab || 'TECHNICAL_SCREENER');
  const [activeOptionsTab, setActiveOptionsTab] = useState<OptionsTabType>(() => parseRouteFromLocation().optionsTab || 'SCHWAB_POSITIONS_UPLOAD');
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
          if (equitiesTab === 'WEEKLY_STOCK_SCREENERS') targetPath = '/equities/screeners';
          else if (equitiesTab === 'INTERACTIVE_CHARTS') targetPath = '/charts';
          else if (equitiesTab === 'FUNDAMENTAL_HEALTH') targetPath = '/solvency';
          else if (equitiesTab === 'ECONOMIC_CALENDAR') targetPath = '/calendar';
          else if (equitiesTab === 'TREND_SUPPORT') targetPath = '/equities/trend';
          else if (equitiesTab === 'VOLATILITY_RISK') targetPath = '/equities/volatility';
          else if (equitiesTab === 'EARNINGS_CALENDAR') targetPath = '/equities/earnings';
          else if (equitiesTab === 'SECTOR_OVERVIEW') targetPath = '/equities/sectors';
          else targetPath = '/equities';
        } else if (tree === 'OPTIONS') {
          if (optionsTab === 'MULTI_LEG_SPREADS') targetPath = '/spreads';
          else if (optionsTab === 'PORTFOLIO_MARGIN_SIM') targetPath = '/margin';
          else if (optionsTab === 'TAX_ALPHA_OPTIMIZER') targetPath = '/tax';
          else if (optionsTab === 'BROKER_STAGING') targetPath = '/staging';
          else if (optionsTab === 'PMCC_SCREENER') targetPath = '/options/pmcc';
          else if (optionsTab === 'OPTION_CHAIN_MATRIX') targetPath = '/options/chain';
          else if (optionsTab === 'VOLATILITY_SKEW') targetPath = '/options/skew';
          else if (optionsTab === 'DEFENSIVE_ROLL_ASSISTANT') targetPath = '/options/roll';
          else if (optionsTab === 'AI_OPTIONS_INCOME') targetPath = '/options/ai';
          else if (optionsTab === 'BACKTEST_MARGIN') targetPath = '/options/backtest';
          else if (optionsTab === 'WEEKLY_POSITION_AUDIT') targetPath = '/options/audit';
          else targetPath = '/options';
        } else if (tree === 'WORKFLOW') {
          if (optionsTab === 'WEEKLY_CASH_LEDGER') targetPath = '/workflow/cash';
          else if (optionsTab === 'HOLDINGS_COVERED_CALLS') targetPath = '/workflow/holdings';
          else if (optionsTab === 'ECONOMIC_CALENDAR') targetPath = '/workflow/calendar';
          else if (optionsTab === 'CASCADING_SCREENER') targetPath = '/workflow/screener';
          else if (optionsTab === 'WEEKLY_EXECUTIVE_REPORT') targetPath = '/workflow/report';
          else if (optionsTab === 'BROKER_STAGING') targetPath = '/workflow/staging';
          else targetPath = '/workflow';
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
    setActiveTree(initial.tree);
    if (initial.optionsTab) setActiveOptionsTab(initial.optionsTab);
    if (initial.equitiesTab) setActiveEquitiesTab(initial.equitiesTab);

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
