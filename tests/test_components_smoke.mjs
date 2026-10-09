/**
 * Comprehensive Component Smoke Test Suite
 * ==========================================
 * Verifies that every major View, Tab Panel, and Modal component in DeltaHarvest
 * mounts and renders without throwing unhandled exceptions, syntax errors, or broken imports.
 *
 * All external context providers, localStorage, and browser APIs are polyfilled.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

const webNodeModules = path.resolve(__dirname, '../web/node_modules');
const webSrcDir = path.resolve(__dirname, '../web/src');

// Explicit resolution of web/node_modules packages via file:// URLs for Windows ESM
const esbuildUrl = pathToFileURL(path.join(webNodeModules, 'esbuild/lib/main.js')).href;
const reactUrl = pathToFileURL(path.join(webNodeModules, 'react/index.js')).href;
const reactDomServerUrl = pathToFileURL(path.join(webNodeModules, 'react-dom/server.node.js')).href;

const esbuild = await import(esbuildUrl);
const React = (await import(reactUrl)).default || (await import(reactUrl));
const ReactDOMServer = (await import(reactDomServerUrl)).default || (await import(reactDomServerUrl));

// Polyfill browser globals for SSR component smoke testing
globalThis.window = {
  localStorage: {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
    clear: () => {},
  },
  sessionStorage: {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
  },
  addEventListener: () => {},
  removeEventListener: () => {},
  dispatchEvent: () => true,
  matchMedia: () => ({
    matches: false,
    media: '',
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
  location: { href: 'http://localhost/', search: '', pathname: '/' },
  navigator: { userAgent: 'NodeTestRunner' },
  scrollTo: () => {},
};

globalThis.localStorage = globalThis.window.localStorage;
globalThis.sessionStorage = globalThis.window.sessionStorage;

globalThis.document = {
  createElement: (tag) => ({
    tagName: tag.toUpperCase(),
    setAttribute: () => {},
    getAttribute: () => null,
    style: {},
    classList: { add: () => {}, remove: () => {}, contains: () => false },
    appendChild: () => {},
    removeChild: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
  }),
  documentElement: {
    classList: { add: () => {}, remove: () => {}, toggle: () => {} },
    getAttribute: () => 'dark',
    setAttribute: () => {},
  },
  body: {
    classList: { add: () => {}, remove: () => {} },
    appendChild: () => {},
  },
  querySelector: () => null,
  querySelectorAll: () => [],
  addEventListener: () => {},
  removeEventListener: () => {},
};

globalThis.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

globalThis.IntersectionObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Helper to bundle and render a TSX component asynchronously with esbuild plugins
async function renderComponent(relPath, exportName, props = {}) {
  const fullPath = path.resolve(webSrcDir, relPath);
  const res = await esbuild.build({
    entryPoints: [fullPath],
    bundle: true,
    format: 'cjs',
    write: false,
    external: ['react', 'react-dom', 'lightweight-charts', 'tesseract.js', 'auth-context-mock'],
    plugins: [{
      name: 'auth-mock',
      setup(build) {
        build.onResolve({ filter: /AuthContext/ }, () => ({ path: 'auth-context-mock', external: true }));
      },
    }],
  });

  const customRequire = (id) => {
    if (id === 'auth-context-mock') {
      return {
        useAuth: () => ({
          user: { id: 'u1', email: 'admin@example.com', role: 'ADMIN', displayName: 'Admin' },
          isAuthenticated: true,
          isAdmin: true,
          isLoading: false,
          login: async () => ({ success: true }),
          logout: async () => {},
          refreshSession: async () => {},
          changePassword: async () => ({ success: true }),
        }),
        AuthProvider: ({ children }) => children,
      };
    }
    if (id === 'react') return React;
    if (id === 'react-dom') return ReactDOMServer;
    if (id === 'react/jsx-runtime') return require(path.join(webNodeModules, 'react/jsx-runtime.js'));
    if (id === 'react/jsx-dev-runtime') return require(path.join(webNodeModules, 'react/jsx-dev-runtime.js'));
    if (id === 'lightweight-charts') {
      return {
        createChart: () => ({
          addSeries: () => ({ setData: () => {}, applyOptions: () => {} }),
          addCandlestickSeries: () => ({ setData: () => {} }),
          addLineSeries: () => ({ setData: () => {} }),
          addHistogramSeries: () => ({ setData: () => {} }),
          timeScale: () => ({ fitContent: () => {} }),
          remove: () => {},
          applyOptions: () => {},
        }),
        ColorType: { Solid: 'solid' },
      };
    }
    if (id === 'tesseract.js') {
      return {
        createWorker: async () => ({
          loadLanguage: async () => {},
          initialize: async () => {},
          recognize: async () => ({ data: { text: '' } }),
          terminate: async () => {},
        }),
      };
    }
    return require(id);
  };

  const m = { exports: {} };
  const fn = new Function('module', 'exports', 'require', '__dirname', '__filename', res.outputFiles[0].text);
  fn(m, m.exports, customRequire, path.dirname(fullPath), fullPath);

  const Component = (exportName ? m.exports[exportName] : m.exports.default) || m.exports.default || m.exports;
  assert.ok(Component, `Component ${exportName || 'default'} from ${relPath} should exist`);
  
  const element = React.createElement(Component, props);
  const html = ReactDOMServer.renderToString(element);
  assert.ok(typeof html === 'string', `Render output for ${relPath} must be string`);
  return html;
}

test('Component Smoke: Reference Views (Methodology, FAQ, Disclaimer)', async () => {
  const methHtml = await renderComponent('components/MethodologyView.tsx', 'MethodologyView', {
    onNavigateToScreener: () => {},
    onNavigateToOptions: () => {},
  });
  assert.ok(methHtml.length > 500, 'MethodologyView rendered successfully');

  const faqHtml = await renderComponent('components/FaqView.tsx', 'FaqView', {
    onNavigateToScreener: () => {},
    onNavigateToMethodology: () => {},
    onOpenTradier: () => {},
    onOpenSchwab: () => {},
  });
  assert.ok(faqHtml.length > 500, 'FaqView rendered successfully');

  const discHtml = await renderComponent('components/DisclaimerView.tsx', 'DisclaimerView', {
    onNavigateToScreener: () => {},
    onNavigateToMethodology: () => {},
  });
  assert.ok(discHtml.length > 500, 'DisclaimerView rendered successfully');
});

test('Component Smoke: Navigation & Shell (DualMenuTree, Breadcrumbs, StartHere)', async () => {
  const dualMenuHtml = await renderComponent('components/DualMenuTree.tsx', 'DualMenuTree', {
    activeTree: 'WORKFLOW',
    onSelectTree: () => {},
    activeEquitiesTab: 'TECHNICAL_SCREENER',
    onSelectEquitiesTab: () => {},
    activeOptionsTab: 'SCHWAB_POSITIONS_UPLOAD',
    onSelectOptionsTab: () => {},
    totalTickersCount: 20,
    weeklyCount: 15,
    monthlyCount: 5,
    highIvrCount: 8,
    earningsAlertCount: 2,
  });
  assert.ok(dualMenuHtml.length > 500, 'DualMenuTree rendered successfully');

  const breadcrumbsHtml = await renderComponent('components/ui/BreadcrumbsBar.tsx', 'BreadcrumbsBar', {
    activeTree: 'WORKFLOW',
    activeEquitiesTab: 'TECHNICAL_SCREENER',
    activeOptionsTab: 'SCHWAB_POSITIONS_UPLOAD',
    onNavigateTo: () => {},
    onOpenCommandPalette: () => {},
    onOpenWatchlist: () => {},
    onOpenReports: () => {},
    onOpenHelp: () => {},
    onPrint: () => {},
  });
  assert.ok(breadcrumbsHtml.length > 100, 'BreadcrumbsBar rendered successfully');

  const startHereHtml = await renderComponent('components/orientation/StartHereChecklist.tsx', 'StartHereChecklist', {
    onNavigateToRitualStep1: () => {},
    onNavigateToCalendar: () => {},
    onOpenWatchlists: () => {},
    onOpenHandbookTour: () => {},
  });
  assert.ok(startHereHtml.length > 200, 'StartHereChecklist rendered successfully');
});

test('Component Smoke: Workflow Step Views (Upload, Cash Ledger, Covered Calls, Report, Staging)', async () => {
  const uploadHtml = await renderComponent('components/SchwabPositionsUploadView.tsx', 'SchwabPositionsUploadView', {
    onNavigateToCashLedger: () => {},
  });
  assert.ok(uploadHtml.length > 500, 'SchwabPositionsUploadView rendered successfully');

  const ledgerHtml = await renderComponent('components/WeeklyCashLedgerView.tsx', 'WeeklyCashLedgerView', {
    onNavigateToHoldings: () => {},
    onNavigateToScreener: () => {},
  });
  assert.ok(ledgerHtml.length > 500, 'WeeklyCashLedgerView rendered successfully');

  const ccHtml = await renderComponent('components/HoldingsCoveredCallView.tsx', 'HoldingsCoveredCallView', {
    onStageOrder: () => {},
    onNavigateToScreener: () => {},
    onOpenSimulator: () => {},
  });
  assert.ok(ccHtml.length > 500, 'HoldingsCoveredCallView rendered successfully');

  const reportHtml = await renderComponent('components/WeeklyExecutiveReportView.tsx', 'WeeklyExecutiveReportView', {
    onNavigateTab: () => {},
  });
  assert.ok(reportHtml.length > 500, 'WeeklyExecutiveReportView rendered successfully');

  const stagingHtml = await renderComponent('components/BrokerStagingWorkbench.tsx', 'BrokerStagingWorkbench', {
    opportunities: [],
    spreads: [],
    onStageOpportunity: () => {},
    onStageSpread: () => {},
    onOpenSchwabSettings: () => {},
  });
  assert.ok(stagingHtml.length > 500, 'BrokerStagingWorkbench rendered successfully');
});

test('Component Smoke: Strategy Labs Views (PMCC, Spreads, Roll, Skew, Margin)', async () => {
  const pmccHtml = await renderComponent('components/PmccScreenerView.tsx', 'PmccScreenerView', {
    tickers: [],
    onStagePmcc: () => {},
  });
  assert.ok(pmccHtml.length > 200, 'PmccScreenerView rendered successfully');

  const spreadHtml = await renderComponent('components/MultiLegSpreadTable.tsx', 'MultiLegSpreadTable', {
    spreads: [],
    onStageSpreadOrder: () => {},
  });
  assert.ok(spreadHtml.length > 200, 'MultiLegSpreadTable rendered successfully');

  const rollHtml = await renderComponent('components/DefensiveRollAssistantView.tsx', 'DefensiveRollAssistantView', {
    onStageRollOrder: () => {},
  });
  assert.ok(rollHtml.length > 500, 'DefensiveRollAssistantView rendered successfully');

  const skewHtml = await renderComponent('components/VolatilitySkewRadar.tsx', 'VolatilitySkewRadar', {
    skewData: [],
  });
  assert.ok(skewHtml.length > 200, 'VolatilitySkewRadar rendered successfully');

  const marginHtml = await renderComponent('components/PortfolioMarginSimulatorView.tsx', 'PortfolioMarginSimulatorView', {});
  assert.ok(marginHtml.length > 500, 'PortfolioMarginSimulatorView rendered successfully');
});

test('Component Smoke: Modals (Help, Settings, Diagnostics, Audit)', async () => {
  const helpHtml = await renderComponent('components/HelpHandbookModal.tsx', 'HelpHandbookModal', {
    isOpen: true,
    onClose: () => {},
  });
  assert.ok(helpHtml.length > 1000, 'HelpHandbookModal rendered successfully');

  const tradierHtml = await renderComponent('components/TradierSettingsModal.tsx', 'TradierSettingsModal', {
    isOpen: true,
    onClose: () => {},
  });
  assert.ok(tradierHtml.length > 500, 'TradierSettingsModal rendered successfully');

  const schwabHtml = await renderComponent('components/SchwabSettingsModal.tsx', 'SchwabSettingsModal', {
    isOpen: true,
    onClose: () => {},
  });
  assert.ok(schwabHtml.length > 500, 'SchwabSettingsModal rendered successfully');

  const diagHtml = await renderComponent('components/ApiDiagnosticsModal.tsx', 'ApiDiagnosticsModal', {
    isOpen: true,
    onClose: () => {},
  });
  assert.ok(diagHtml.length > 500, 'ApiDiagnosticsModal rendered successfully');

  const watchlistModalHtml = await renderComponent('components/WatchlistManagerModal.tsx', 'WatchlistManagerModal', {
    isOpen: true,
    onClose: () => {},
    watchlistGroups: [{ id: 'default', name: 'Default Watchlist', tickers: ['AAPL', 'NVDA'] }],
    setWatchlistGroups: () => {},
    activeGroupId: 'default',
    setActiveGroupId: () => {},
    availableUniverse: [
      { symbol: 'AAPL', name: 'Apple Inc', spot_price: 230, iv_rank: 45, dte: 7 },
      { symbol: 'NVDA', name: 'Nvidia Corp', spot_price: 130, iv_rank: 60, dte: 7 },
    ],
  });
  assert.ok(watchlistModalHtml.length > 500, 'WatchlistManagerModal rendered successfully');

  // Regression check: WatchlistManagerModal mounts safely even with completely empty watchlistGroups
  const emptyWatchlistModalHtml = await renderComponent('components/WatchlistManagerModal.tsx', 'WatchlistManagerModal', {
    isOpen: true,
    onClose: () => {},
    watchlistGroups: [],
    setWatchlistGroups: () => {},
    activeGroupId: '',
    setActiveGroupId: () => {},
    availableUniverse: [],
  });
  assert.ok(emptyWatchlistModalHtml.length > 500, 'WatchlistManagerModal renders safely on empty groups');

  const reportQueryHtml = await renderComponent('components/ReportQueryModal.tsx', 'ReportQueryModal', {
    isOpen: true,
    onClose: () => {},
  });
  assert.ok(reportQueryHtml.length > 500, 'ReportQueryModal rendered successfully');

  const alertSettingsHtml = await renderComponent('components/AlertSettingsModal.tsx', 'AlertSettingsModal', {
    isOpen: true,
    onClose: () => {},
  });
  assert.ok(alertSettingsHtml.length > 500, 'AlertSettingsModal rendered successfully');

  const brokerStagingModalHtml = await renderComponent('components/BrokerOrderStagingModal.tsx', 'BrokerOrderStagingModal', {
    isOpen: true,
    onClose: () => {},
    stagedOrder: {
      id: 'order_1',
      symbol: 'AAPL',
      strategy: 'CC',
      strike: 235,
      expiration: '2026-10-16',
      limitPrice: 2.50,
      quantity: 1,
      accountType: 'REG_T_MARGIN',
      priceExecution: 'LIMIT',
      totalNetCredit: 250,
      netCreditPerContract: 2.50,
      takeProfitPrice: 0.50,
      stopLossPrice: 5.00,
      totalMarginRequired: 23500,
      capitalSavedByPm: 5000,
      concentrationPct: 4.5,
      entryLegs: [],
      takeProfitLegs: [],
      stopLossLegs: [],
      schwabJsonPayload: '{}',
      ibkrBasketCsv: '',
      thinkorswimString: '',
    },
  });
  assert.ok(brokerStagingModalHtml.length > 500, 'BrokerOrderStagingModal rendered successfully');

  // Regression check: BrokerOrderStagingModal mounts safely with PORTFOLIO_MARGIN and undefined numerical fields
  const pmUndefinedStagingHtml = await renderComponent('components/BrokerOrderStagingModal.tsx', 'BrokerOrderStagingModal', {
    isOpen: true,
    onClose: () => {},
    stagedOrder: {
      id: 'order_pm_test',
      symbol: 'NVDA',
      strategy: 'CSP',
      strike: 120,
      expiration: '2026-10-16',
      limitPrice: 1.50,
      quantity: 1,
      accountType: 'PORTFOLIO_MARGIN',
      priceExecution: 'LIMIT',
      entryLegs: [],
      takeProfitLegs: [],
      stopLossLegs: [],
      schwabJsonPayload: '{}',
      ibkrBasketCsv: '',
      thinkorswimString: '',
    },
  });
  assert.ok(pmUndefinedStagingHtml.length > 500, 'BrokerOrderStagingModal renders safely with undefined PM numbers');

  const incomeCalcHtml = await renderComponent('components/IncomeCalculatorModal.tsx', 'IncomeCalculatorModal', {
    opportunity: {
      id: 'opp_1',
      symbol: 'AAPL',
      name: 'Apple Inc',
      strategy: 'CC',
      strike: 235,
      current_price: 230,
      expiration: '2026-10-16',
      dte: 7,
      delta: 0.20,
      premium_total: 250,
      collateral_required: 23000,
      annualized_roc: 24.5,
      roc_pct: 1.08,
      cushion_pct: 2.2,
      pop_pct: 82,
      iv: 25,
      rating: 90,
    },
    onClose: () => {},
  });
  assert.ok(incomeCalcHtml.length > 500, 'IncomeCalculatorModal rendered successfully');
});

test('Component Smoke: Workspace Shell Views (Dashboard, Admin, Password, Agent, Recap, Digest)', async () => {
  const dashHtml = await renderComponent('components/auth/UserDashboardView.tsx', 'UserDashboardView', {
    onNavigateToScreener: () => {},
    onNavigateToCharts: () => {},
    onNavigateToWorkflow: () => {},
    onNavigateToWorkflowStep: () => {},
  });
  assert.ok(dashHtml.length > 500, 'UserDashboardView rendered successfully');

  const adminHtml = await renderComponent('components/auth/AdminUsersView.tsx', 'AdminUsersView', {
    onBackToWorkspace: () => {},
  });
  assert.ok(adminHtml.length > 500, 'AdminUsersView rendered successfully');

  const pwdHtml = await renderComponent('components/auth/PasswordChangeView.tsx', 'PasswordChangeView', {
    onSuccess: () => {},
  });
  assert.ok(pwdHtml.length > 500, 'PasswordChangeView rendered successfully');

  const recapHtml = await renderComponent('components/market/MarketRecapSection.tsx', 'MarketRecapSection', {});
  assert.ok(recapHtml.length > 200, 'MarketRecapSection rendered successfully');

  const digestHtml = await renderComponent('components/ExecutivePortfolioDigestView.tsx', 'ExecutivePortfolioDigestView', {});
  assert.ok(digestHtml.length > 500, 'ExecutivePortfolioDigestView rendered successfully');

  const backtestHtml = await renderComponent('components/OptionsBacktestView.tsx', 'OptionsBacktestView', {
    availableSymbols: ['NVDA', 'SPY'],
  });
  assert.ok(backtestHtml.length > 500, 'OptionsBacktestView rendered successfully');

  const taxAlphaHtml = await renderComponent('components/TaxAlphaOptimizerView.tsx', 'TaxAlphaOptimizerView', {});
  assert.ok(taxAlphaHtml.length > 500, 'TaxAlphaOptimizerView rendered successfully');

  const econCalHtml = await renderComponent('components/EconomicCalendarView.tsx', 'EconomicCalendarView', {
    onSelectSymbolForChart: () => {},
    onOpenTickerAudit: () => {},
  });
  assert.ok(econCalHtml.length > 500, 'EconomicCalendarView rendered successfully');
});
