import { useState, useEffect, useCallback, useMemo } from 'react';
import type { MenuTreeType, EquitiesTabType, OptionsTabType } from '../types/options.ts';
import type { RouteLocation } from '../types/navigation.ts';

function makeRoute(res: { tree: MenuTreeType; optionsTab?: OptionsTabType; equitiesTab?: EquitiesTabType; canonicalPath: string }): RouteLocation {
  return {
    ...res,
    isNotFound: false,
  };
}

/**
 * Normalizes a raw pathname and evaluates canonical destination and 301-redirect target.
 */
export function parseRouteFromLocation(autoRedirect = false): RouteLocation {
  if (typeof window === 'undefined') {
    return makeRoute({ tree: 'WORKFLOW', optionsTab: 'SCHWAB_POSITIONS_UPLOAD', canonicalPath: '/ritual' });
  }

  const rawPath = window.location.pathname.toLowerCase().replace(/\/$/, '') || '/';
  const hash = window.location.hash.toLowerCase().replace(/^#\/?/, '');
  const path = hash ? `/${hash}` : rawPath;

  // 1. Root default -> /ritual
  if (path === '/' || path === '') {
    if (autoRedirect && window.location.pathname !== '/ritual') {
      window.history.replaceState(null, '', '/ritual');
    }
    return makeRoute({
      tree: 'WORKFLOW',
      optionsTab: 'SCHWAB_POSITIONS_UPLOAD',
      canonicalPath: '/ritual',
    });
  }

  // 2. Core Standalone Routes
  if (path === '/login' || path === '/auth' || path === '/signin') {
    if (autoRedirect && path !== '/login') window.history.replaceState(null, '', '/login');
    return makeRoute({ tree: 'LOGIN', canonicalPath: '/login' });
  }
  if (path === '/dashboard' || path === '/workspace' || path === '/portfolio' || path === '/money/workspace') {
    if (autoRedirect && path !== '/money/workspace' && path !== '/dashboard') window.history.replaceState(null, '', '/dashboard');
    return makeRoute({ tree: 'DASHBOARD', canonicalPath: path === '/money/workspace' ? '/money/workspace' : '/dashboard' });
  }
  if (path === '/admin/users' || path === '/admin' || path === '/users') {
    if (autoRedirect && path !== '/admin/users') window.history.replaceState(null, '', '/admin/users');
    return makeRoute({ tree: 'ADMIN_USERS', canonicalPath: '/admin/users' });
  }
  if (path === '/settings/password' || path === '/password') {
    if (autoRedirect && path !== '/settings/password') window.history.replaceState(null, '', '/settings/password');
    return makeRoute({ tree: 'SETTINGS_PASSWORD', canonicalPath: '/settings/password' });
  }
  if (path === '/methodology' || path === '/rules' || path === '/learn/methodology') {
    if (autoRedirect && path !== '/methodology' && path !== '/learn/methodology') window.history.replaceState(null, '', '/methodology');
    return makeRoute({ tree: 'METHODOLOGY', canonicalPath: path === '/learn/methodology' ? '/learn/methodology' : '/methodology' });
  }
  if (path === '/faq' || path === '/questions' || path === '/learn/faq') {
    if (autoRedirect && path !== '/faq' && path !== '/learn/faq') window.history.replaceState(null, '', '/faq');
    return makeRoute({ tree: 'FAQ', canonicalPath: path === '/learn/faq' ? '/learn/faq' : '/faq' });
  }
  if (path === '/disclaimer' || path === '/legal' || path === '/learn/disclaimers' || path === '/learn/disclaimer') {
    if (autoRedirect && path !== '/disclaimer' && path !== '/learn/disclaimer') window.history.replaceState(null, '', '/disclaimer');
    return makeRoute({ tree: 'DISCLAIMER', canonicalPath: path === '/learn/disclaimer' ? '/learn/disclaimer' : '/disclaimer' });
  }

  // 3. Weekend Ritual (Canonical: /ritual/*)
  if (path === '/ritual/cash' || path === '/workflow/cash' || path === '/workflow/step2') {
    if (autoRedirect && path !== '/ritual/cash') window.history.replaceState(null, '', '/ritual/cash');
    return makeRoute({ tree: 'WORKFLOW', optionsTab: 'WEEKLY_CASH_LEDGER', canonicalPath: '/ritual/cash' });
  }
  if (path === '/ritual/holdings' || path === '/workflow/holdings' || path === '/workflow/step3') {
    if (autoRedirect && path !== '/ritual/holdings') window.history.replaceState(null, '', '/ritual/holdings');
    return makeRoute({ tree: 'WORKFLOW', optionsTab: 'HOLDINGS_COVERED_CALLS', canonicalPath: '/ritual/holdings' });
  }
  if (path === '/ritual/calendar' || path === '/workflow/calendar' || path === '/workflow/step4') {
    if (autoRedirect && path !== '/ritual/calendar') window.history.replaceState(null, '', '/ritual/calendar');
    return makeRoute({ tree: 'WORKFLOW', optionsTab: 'ECONOMIC_CALENDAR', canonicalPath: '/ritual/calendar' });
  }
  if (path === '/ritual/screener' || path === '/workflow/screener' || path === '/workflow/step5') {
    if (autoRedirect && path !== '/ritual/screener') window.history.replaceState(null, '', '/ritual/screener');
    return makeRoute({ tree: 'WORKFLOW', optionsTab: 'CASCADING_SCREENER', canonicalPath: '/ritual/screener' });
  }
  if (path === '/ritual/report' || path === '/workflow/report' || path === '/workflow/step6') {
    if (autoRedirect && path !== '/ritual/report') window.history.replaceState(null, '', '/ritual/report');
    return makeRoute({ tree: 'WORKFLOW', optionsTab: 'WEEKLY_EXECUTIVE_REPORT', canonicalPath: '/ritual/report' });
  }
  if (path === '/ritual/staging' || path === '/workflow/staging' || path === '/workflow/step7') {
    if (autoRedirect && path !== '/ritual/staging') window.history.replaceState(null, '', '/ritual/staging');
    return makeRoute({ tree: 'WORKFLOW', optionsTab: 'BROKER_STAGING', canonicalPath: '/ritual/staging' });
  }
  if (
    path === '/ritual/upload' ||
    path === '/ritual' ||
    path === '/workflow' ||
    path === '/workflow/upload' ||
    path === '/workflow/step1' ||
    path === '/routine'
  ) {
    const target = path === '/ritual/upload' ? '/ritual/upload' : '/ritual';
    if (autoRedirect && path !== target) window.history.replaceState(null, '', target);
    return makeRoute({ tree: 'WORKFLOW', optionsTab: 'SCHWAB_POSITIONS_UPLOAD', canonicalPath: target });
  }

  // 4. My Money Group Canonical Routes
  if (path === '/money/staging' || path === '/staging' || path === '/orders' || path === '/options/staging') {
    if (autoRedirect && path !== '/money/staging') window.history.replaceState(null, '', '/money/staging');
    return makeRoute({ tree: 'OPTIONS', optionsTab: 'BROKER_STAGING', canonicalPath: '/money/staging' });
  }
  if (path === '/money/portfolio' || path === '/options/audit' || path === '/options/position-audit') {
    if (autoRedirect && path !== '/money/portfolio') window.history.replaceState(null, '', '/money/portfolio');
    return makeRoute({ tree: 'OPTIONS', optionsTab: 'EXECUTIVE_DIGEST', canonicalPath: '/money/portfolio' });
  }

  // 5. Research Group Canonical Routes
  if (
    path === '/research/weekly-stocks' ||
    path === '/research/scans' ||
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
    if (autoRedirect && path !== '/research/weekly-stocks') window.history.replaceState(null, '', '/research/weekly-stocks');
    return makeRoute({ tree: 'EQUITIES', equitiesTab: 'WEEKLY_STOCK_SCREENERS', canonicalPath: '/research/weekly-stocks' });
  }
  if (path === '/research/charts' || path === '/charts' || path === '/chart' || path === '/equities/charts' || path === '/equities/chart') {
    if (autoRedirect && path !== '/research/charts') window.history.replaceState(null, '', '/research/charts');
    return makeRoute({ tree: 'EQUITIES', equitiesTab: 'INTERACTIVE_CHARTS', canonicalPath: '/research/charts' });
  }
  if (
    path === '/research/fundamentals' ||
    path === '/research/health' ||
    path === '/solvency' ||
    path === '/fundamentals' ||
    path === '/equities/solvency' ||
    path === '/equities/fundamentals'
  ) {
    if (autoRedirect && path !== '/research/fundamentals') window.history.replaceState(null, '', '/research/fundamentals');
    return makeRoute({ tree: 'EQUITIES', equitiesTab: 'FUNDAMENTAL_HEALTH', canonicalPath: '/research/fundamentals' });
  }
  if (path === '/research/calendar' || path === '/calendar' || path === '/macro' || path === '/equities/calendar') {
    if (autoRedirect && path !== '/research/calendar') window.history.replaceState(null, '', '/research/calendar');
    return makeRoute({ tree: 'EQUITIES', equitiesTab: 'ECONOMIC_CALENDAR', canonicalPath: '/research/calendar' });
  }
  if (path === '/research/trend' || path === '/equities/trend' || path === '/equities/support') {
    if (autoRedirect && path !== '/research/trend') window.history.replaceState(null, '', '/research/trend');
    return makeRoute({ tree: 'EQUITIES', equitiesTab: 'TREND_SUPPORT', canonicalPath: '/research/trend' });
  }
  if (path === '/research/volatility' || path === '/equities/volatility' || path === '/equities/risk') {
    if (autoRedirect && path !== '/research/volatility') window.history.replaceState(null, '', '/research/volatility');
    return makeRoute({ tree: 'EQUITIES', equitiesTab: 'VOLATILITY_RISK', canonicalPath: '/research/volatility' });
  }
  if (path === '/research/earnings' || path === '/equities/earnings') {
    if (autoRedirect && path !== '/research/earnings') window.history.replaceState(null, '', '/research/earnings');
    return makeRoute({ tree: 'EQUITIES', equitiesTab: 'EARNINGS_CALENDAR', canonicalPath: '/research/earnings' });
  }
  if (path === '/research/sectors' || path === '/equities/sectors' || path === '/equities/sector') {
    if (autoRedirect && path !== '/research/sectors') window.history.replaceState(null, '', '/research/sectors');
    return makeRoute({ tree: 'EQUITIES', equitiesTab: 'SECTOR_OVERVIEW', canonicalPath: '/research/sectors' });
  }
  if (
    path === '/research/stocks' ||
    path === '/research/screeners' ||
    path === '/equities' ||
    path === '/stocks' ||
    path === '/equities/screener' ||
    path === '/screener'
  ) {
    if (autoRedirect && path !== '/research/stocks') window.history.replaceState(null, '', '/research/stocks');
    return makeRoute({ tree: 'EQUITIES', equitiesTab: 'TECHNICAL_SCREENER', canonicalPath: '/research/stocks' });
  }
  if (
    path === '/research/income' ||
    path === '/options' ||
    path === '/income' ||
    path === '/options/income' ||
    path === '/options/screener'
  ) {
    if (autoRedirect && path !== '/research/income') window.history.replaceState(null, '', '/research/income');
    return makeRoute({ tree: 'OPTIONS', optionsTab: 'INCOME_SCREENER', canonicalPath: '/research/income' });
  }
  if (path.startsWith('/equities') || path.startsWith('/research')) {
    if (autoRedirect && path !== '/research/stocks') window.history.replaceState(null, '', '/research/stocks');
    return makeRoute({ tree: 'EQUITIES', equitiesTab: 'TECHNICAL_SCREENER', canonicalPath: '/research/stocks' });
  }

  // 6. Tools Group Canonical Routes
  if (path === '/tools/spreads' || path === '/spreads' || path === '/options/spreads') {
    if (autoRedirect && path !== '/tools/spreads') window.history.replaceState(null, '', '/tools/spreads');
    return makeRoute({ tree: 'OPTIONS', optionsTab: 'MULTI_LEG_SPREADS', canonicalPath: '/tools/spreads' });
  }
  if (path === '/tools/margin' || path === '/margin' || path === '/options/margin') {
    if (autoRedirect && path !== '/tools/margin') window.history.replaceState(null, '', '/tools/margin');
    return makeRoute({ tree: 'OPTIONS', optionsTab: 'PORTFOLIO_MARGIN_SIM', canonicalPath: '/tools/margin' });
  }
  if (path === '/tools/tax' || path === '/tax' || path === '/options/tax') {
    if (autoRedirect && path !== '/tools/tax') window.history.replaceState(null, '', '/tools/tax');
    return makeRoute({ tree: 'OPTIONS', optionsTab: 'TAX_ALPHA_OPTIMIZER', canonicalPath: '/tools/tax' });
  }
  if (path === '/tools/pmcc' || path === '/options/pmcc' || path === '/pmcc') {
    if (autoRedirect && path !== '/tools/pmcc') window.history.replaceState(null, '', '/tools/pmcc');
    return makeRoute({ tree: 'OPTIONS', optionsTab: 'PMCC_SCREENER', canonicalPath: '/tools/pmcc' });
  }
  if (path === '/tools/chain' || path === '/options/chain' || path === '/chain') {
    if (autoRedirect && path !== '/tools/chain') window.history.replaceState(null, '', '/tools/chain');
    return makeRoute({ tree: 'OPTIONS', optionsTab: 'OPTION_CHAIN_MATRIX', canonicalPath: '/tools/chain' });
  }
  if (path === '/tools/skew' || path === '/options/skew' || path === '/skew') {
    if (autoRedirect && path !== '/tools/skew') window.history.replaceState(null, '', '/tools/skew');
    return makeRoute({ tree: 'OPTIONS', optionsTab: 'VOLATILITY_SKEW', canonicalPath: '/tools/skew' });
  }
  if (path === '/tools/roll' || path === '/options/roll' || path === '/roll') {
    if (autoRedirect && path !== '/tools/roll') window.history.replaceState(null, '', '/tools/roll');
    return makeRoute({ tree: 'OPTIONS', optionsTab: 'DEFENSIVE_ROLL_ASSISTANT', canonicalPath: '/tools/roll' });
  }
  if (path === '/tools/ai' || path === '/options/ai' || path === '/ai-options') {
    if (autoRedirect && path !== '/tools/ai') window.history.replaceState(null, '', '/tools/ai');
    return makeRoute({ tree: 'OPTIONS', optionsTab: 'AI_OPTIONS_INCOME', canonicalPath: '/tools/ai' });
  }
  if (path === '/tools/backtest' || path === '/options/backtest' || path === '/backtest') {
    if (autoRedirect && path !== '/tools/backtest') window.history.replaceState(null, '', '/tools/backtest');
    return makeRoute({ tree: 'OPTIONS', optionsTab: 'BACKTEST_MARGIN', canonicalPath: '/tools/backtest' });
  }
  if (path.startsWith('/options') || path.startsWith('/tools')) {
    if (autoRedirect && path !== '/research/income') window.history.replaceState(null, '', '/research/income');
    return makeRoute({ tree: 'OPTIONS', optionsTab: 'INCOME_SCREENER', canonicalPath: '/research/income' });
  }

  // 7. Unknown path -> proper 404 handler
  return {
    tree: 'WORKFLOW',
    optionsTab: 'SCHWAB_POSITIONS_UPLOAD',
    canonicalPath: path,
    isNotFound: true,
  };
}

export function useAppNavigation() {
  const [currentLocation, setCurrentLocation] = useState<RouteLocation>(() => parseRouteFromLocation(true));
  const [activeChartSymbol, setActiveChartSymbol] = useState<string>('TSLA');

  // Derive menu states directly from current route location
  const activeTree = useMemo(() => currentLocation.tree, [currentLocation.tree]);
  const activeEquitiesTab = useMemo(
    () => currentLocation.equitiesTab || 'TECHNICAL_SCREENER',
    [currentLocation.equitiesTab]
  );
  const activeOptionsTab = useMemo(
    () => currentLocation.optionsTab || 'SCHWAB_POSITIONS_UPLOAD',
    [currentLocation.optionsTab]
  );
  const isNotFound = useMemo(() => Boolean(currentLocation.isNotFound), [currentLocation.isNotFound]);

  // Navigate function: updates the browser URL to canonical scheme and synchronizes state
  const navigateTo = useCallback(
    (tree: MenuTreeType, optionsTab?: OptionsTabType, equitiesTab?: EquitiesTabType) => {
      let targetPath = '/ritual';

      if (tree === 'LOGIN') {
        targetPath = '/login';
      } else if (tree === 'DASHBOARD') {
        targetPath = '/dashboard';
      } else if (tree === 'ADMIN_USERS') {
        targetPath = '/admin/users';
      } else if (tree === 'SETTINGS_PASSWORD') {
        targetPath = '/settings/password';
      } else if (tree === 'METHODOLOGY') {
        targetPath = '/methodology';
      } else if (tree === 'FAQ') {
        targetPath = '/faq';
      } else if (tree === 'DISCLAIMER') {
        targetPath = '/disclaimer';
      } else if (tree === 'EQUITIES') {
        if (equitiesTab === 'WEEKLY_STOCK_SCREENERS') targetPath = '/research/weekly-stocks';
        else if (equitiesTab === 'INTERACTIVE_CHARTS') targetPath = '/research/charts';
        else if (equitiesTab === 'FUNDAMENTAL_HEALTH') targetPath = '/research/fundamentals';
        else if (equitiesTab === 'ECONOMIC_CALENDAR') targetPath = '/research/calendar';
        else if (equitiesTab === 'TREND_SUPPORT') targetPath = '/research/trend';
        else if (equitiesTab === 'VOLATILITY_RISK') targetPath = '/research/volatility';
        else if (equitiesTab === 'EARNINGS_CALENDAR') targetPath = '/research/earnings';
        else if (equitiesTab === 'SECTOR_OVERVIEW') targetPath = '/research/sectors';
        else targetPath = '/research/stocks';
      } else if (tree === 'OPTIONS') {
        if (optionsTab === 'MULTI_LEG_SPREADS') targetPath = '/tools/spreads';
        else if (optionsTab === 'PORTFOLIO_MARGIN_SIM') targetPath = '/tools/margin';
        else if (optionsTab === 'TAX_ALPHA_OPTIMIZER') targetPath = '/tools/tax';
        else if (optionsTab === 'BROKER_STAGING') targetPath = '/money/staging';
        else if (optionsTab === 'PMCC_SCREENER') targetPath = '/tools/pmcc';
        else if (optionsTab === 'OPTION_CHAIN_MATRIX') targetPath = '/tools/chain';
        else if (optionsTab === 'VOLATILITY_SKEW') targetPath = '/tools/skew';
        else if (optionsTab === 'DEFENSIVE_ROLL_ASSISTANT') targetPath = '/tools/roll';
        else if (optionsTab === 'AI_OPTIONS_INCOME') targetPath = '/tools/ai';
        else if (optionsTab === 'BACKTEST_MARGIN') targetPath = '/tools/backtest';
        else if (optionsTab === 'EXECUTIVE_DIGEST') targetPath = '/money/portfolio';
        else targetPath = '/research/income';
      } else if (tree === 'WORKFLOW') {
        if (optionsTab === 'WEEKLY_CASH_LEDGER') targetPath = '/ritual/cash';
        else if (optionsTab === 'HOLDINGS_COVERED_CALLS') targetPath = '/ritual/holdings';
        else if (optionsTab === 'ECONOMIC_CALENDAR') targetPath = '/ritual/calendar';
        else if (optionsTab === 'CASCADING_SCREENER') targetPath = '/ritual/screener';
        else if (optionsTab === 'WEEKLY_EXECUTIVE_REPORT') targetPath = '/ritual/report';
        else if (optionsTab === 'BROKER_STAGING') targetPath = '/ritual/staging';
        else targetPath = '/ritual';
      }

      if (typeof window !== 'undefined') {
        if (window.location.pathname !== targetPath) {
          window.history.pushState({ tree, optionsTab, equitiesTab }, '', targetPath);
        }
      }

      setCurrentLocation({
        tree,
        optionsTab: optionsTab || (tree === 'WORKFLOW' ? 'SCHWAB_POSITIONS_UPLOAD' : undefined),
        equitiesTab: equitiesTab || (tree === 'EQUITIES' ? 'TECHNICAL_SCREENER' : undefined),
        canonicalPath: targetPath,
        isNotFound: false,
      });
    },
    []
  );

  // Synchronize state when browser back/forward or hash change occurs
  useEffect(() => {
    const syncRoute = () => {
      const parsed = parseRouteFromLocation(true);
      setCurrentLocation(parsed);
    };

    window.addEventListener('popstate', syncRoute);
    window.addEventListener('hashchange', syncRoute);
    return () => {
      window.removeEventListener('popstate', syncRoute);
      window.removeEventListener('hashchange', syncRoute);
    };
  }, []);

  // Proxy state setters to guarantee URL synchronization
  const setActiveTree = useCallback(
    (tree: MenuTreeType) => {
      navigateTo(tree);
    },
    [navigateTo]
  );

  const setActiveEquitiesTab = useCallback(
    (tab: EquitiesTabType) => {
      navigateTo('EQUITIES', activeOptionsTab, tab);
    },
    [navigateTo, activeOptionsTab]
  );

  const setActiveOptionsTab = useCallback(
    (tab: OptionsTabType) => {
      navigateTo(activeTree === 'WORKFLOW' ? 'WORKFLOW' : 'OPTIONS', tab, activeEquitiesTab);
    },
    [navigateTo, activeTree, activeEquitiesTab]
  );

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
    isNotFound,
    canonicalPath: currentLocation.canonicalPath,
  };
}
