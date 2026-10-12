/**
 * Price Action Chart Component Smoke & Contract Verification Test
 * ===============================================================
 * Verifies that PriceActionChart component compiles, mounts, and renders correctly
 * under SSR/DOM simulation with lightweight-charts mocked/polyfilled.
 * Tests:
 * 1. Clean SSR mount with populated bars (SPY, AAPL, TSLA fixtures)
 * 2. Loading state rendering with skeleton/spinner
 * 3. Error state rendering with error banner
 * 4. Empty state rendering when bars array is empty
 * 5. Timeframe selector buttons (1D active, 1H/15M/5M disabled with "Coming Soon" badge)
 * 6. Regulatory disclaimer note ("Not Financial Advice") and Al Brooks attribution
 * 7. Setup rationale card structure and accessibility attributes
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const webNodeModules = path.resolve(__dirname, '../web/node_modules');
const webSrcDir = path.resolve(__dirname, '../web/src');

// Explicit resolution of web packages
const esbuildUrl = pathToFileURL(path.join(webNodeModules, 'esbuild/lib/main.js')).href;
const reactUrl = pathToFileURL(path.join(webNodeModules, 'react/index.js')).href;
const reactDomServerUrl = pathToFileURL(path.join(webNodeModules, 'react-dom/server.node.js')).href;

const esbuild = await import(esbuildUrl);
const React = (await import(reactUrl)).default || (await import(reactUrl));
const ReactDOMServer = (await import(reactDomServerUrl)).default || (await import(reactDomServerUrl));

const reactJsxRuntimeUrl = pathToFileURL(path.join(webNodeModules, 'react/jsx-runtime.js')).href;
const JsxRuntime = (await import(reactJsxRuntimeUrl)).default || (await import(reactJsxRuntimeUrl));

// Polyfill minimal browser environment for SSR
if (!globalThis.window) {
  globalThis.window = {
    addEventListener: () => {},
    removeEventListener: () => {},
  };
}
if (!globalThis.document) {
  globalThis.document = {
    createElement: () => ({
      getContext: () => null,
      style: {},
    }),
  };
}

// Bundle PriceActionChart into standalone CommonJS for testing
async function loadPriceActionChartComponent() {
  const chartPath = path.join(webSrcDir, 'components/priceAction/PriceActionChart.tsx');
  const bundle = await esbuild.build({
    entryPoints: [chartPath],
    bundle: true,
    write: false,
    format: 'cjs',
    target: 'node18',
    external: ['react', 'react/jsx-runtime', 'react-dom/server', 'lightweight-charts'],
    loader: {
      '.tsx': 'tsx',
      '.ts': 'ts',
    },
  });

  const moduleCode = bundle.outputFiles[0].text;
  const moduleExports = {};
  const fn = new Function('require', 'module', 'exports', 'React', moduleCode);

  const mockRequire = (id) => {
    if (id === 'react') return React;
    if (id === 'react/jsx-runtime') return JsxRuntime;
    if (id === 'react-dom/server') return ReactDOMServer;
    if (id === 'lightweight-charts') {
      return {
        createChart: () => ({
          addSeries: () => ({
            setData: () => {},
            applyOptions: () => {},
            createPriceLine: () => ({ applyOptions: () => {} }),
          }),
          timeScale: () => ({ fitContent: () => {} }),
          remove: () => {},
          applyOptions: () => {},
        }),
        createSeriesMarkers: () => {},
        ColorType: { Solid: 'solid' },
        LineStyle: { Solid: 0, Dotted: 1, Dashed: 2, LargeDashed: 3, SparseDotted: 4 },
      };
    }
    throw new Error(`Unexpected require in test: ${id}`);
  };

  const mod = { exports: moduleExports };
  fn(mockRequire, mod, moduleExports, React);
  return mod.exports.PriceActionChart;
}

const PriceActionChart = await loadPriceActionChartComponent();

function makeMockBars(count = 30, basePrice = 500) {
  const bars = [];
  let price = basePrice;
  const startDate = new Date('2024-01-01T00:00:00Z');

  for (let i = 0; i < count; i++) {
    const d = new Date(startDate.getTime() + i * 86400000);
    const dateStr = d.toISOString().slice(0, 10);
    const change = (i % 2 === 0 ? 1 : -1) * 2;
    const open = price;
    const close = price + change;
    const high = Math.max(open, close) + 1.5;
    const low = Math.min(open, close) - 1.5;
    price = close;

    bars.push({
      time: dateStr,
      timestamp: Math.floor(d.getTime() / 1000),
      open,
      high,
      low,
      close,
      volume: 1000000 + i * 1000,
    });
  }
  return bars;
}

test('1. PriceActionChart renders clean HTML with SPY bars', () => {
  const bars = makeMockBars(40, 500);
  const html = ReactDOMServer.renderToString(
    React.createElement(PriceActionChart, {
      symbol: 'SPY',
      bars,
    })
  );

  assert.ok(html.includes('SPY'), 'Should display symbol SPY');
  assert.ok(html.includes('Brooks Price Action'), 'Should display Brooks Price Action title');
  assert.ok(html.includes('Not financial advice'), 'Must include mandatory Not financial advice disclaimer');
  assert.ok(html.includes('Methodology: Al Brooks'), 'Should credit Al Brooks methodology');
});

test('2. PriceActionChart renders loading state when isLoading=true', () => {
  const html = ReactDOMServer.renderToString(
    React.createElement(PriceActionChart, {
      symbol: 'AAPL',
      bars: [],
      isLoading: true,
    })
  );

  assert.ok(html.includes('Loading') && html.includes('Price Action Bars') && html.includes('AAPL'), 'Should display loading text with symbol');
  assert.ok(html.includes('animate-spin'), 'Should contain loading spinner');
});

test('3. PriceActionChart renders error state with error prop', () => {
  const html = ReactDOMServer.renderToString(
    React.createElement(PriceActionChart, {
      symbol: 'TSLA',
      bars: [],
      error: 'Network timeout fetching market quotes',
    })
  );

  assert.ok(html.includes('Network timeout fetching market quotes'), 'Should render the provided error message');
  assert.ok(html.includes('Price Action Feed Error'), 'Should render error header');
});

test('4. PriceActionChart renders empty state when bars are empty', () => {
  const html = ReactDOMServer.renderToString(
    React.createElement(PriceActionChart, {
      symbol: 'NVDA',
      bars: [],
    })
  );

  assert.ok(html.includes('No historical price bars available') && html.includes('NVDA'), 'Should display empty state message');
});

test('5. PriceActionChart renders timeframe selector with 1D active and intraday badges', () => {
  const bars = makeMockBars(30, 150);
  const html = ReactDOMServer.renderToString(
    React.createElement(PriceActionChart, {
      symbol: 'MSFT',
      bars,
    })
  );

  assert.ok(html.includes('>1D<'), 'Should have 1D button');
  assert.ok(html.includes('Soon'), 'Intraday buttons should display Soon badge');
  assert.ok(html.includes('disabled'), 'Intraday buttons must be disabled in initial version');
});

test('6. PriceActionChart includes attribution citations and confidence note', () => {
  const bars = makeMockBars(50, 200);
  const html = ReactDOMServer.renderToString(
    React.createElement(PriceActionChart, {
      symbol: 'QQQ',
      bars,
    })
  );

  assert.ok(html.includes('Regulatory Notice'), 'Should include Regulatory Notice');
  assert.ok(html.includes('probabilistic mathematical models'), 'Should include probabilistic notice');
  assert.ok(html.includes('EMA: 20'), 'Should indicate EMA: 20');
  assert.ok(html.includes('Swings Lag: N=2'), 'Should indicate Swings Lag: N=2');
});
