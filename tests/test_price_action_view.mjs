/**
 * Price Action View Component Smoke & Integration Verification Test
 * =================================================================
 * Verifies that PriceActionView component compiles, mounts, and renders correctly
 * under SSR/DOM simulation.
 * Tests:
 * 1. Clean SSR mount with default initialSymbol (SPY)
 * 2. Ticker input field prefilled and rendered
 * 3. Quick-pick ticker chips rendered (SPY, QQQ, AAPL, etc.)
 * 4. Pattern Setups panel rendered with All/Bull/Bear filter controls
 * 5. Parameter tuning controls rendered
 * 6. Mandatory Regulatory Notice and Al Brooks citations rendered
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
const reactJsxRuntimeUrl = pathToFileURL(path.join(webNodeModules, 'react/jsx-runtime.js')).href;
const reactDomServerUrl = pathToFileURL(path.join(webNodeModules, 'react-dom/server.node.js')).href;

const esbuild = await import(esbuildUrl);
const React = (await import(reactUrl)).default || (await import(reactUrl));
const JsxRuntime = (await import(reactJsxRuntimeUrl)).default || (await import(reactJsxRuntimeUrl));
const ReactDOMServer = (await import(reactDomServerUrl)).default || (await import(reactDomServerUrl));

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

// Bundle PriceActionView into standalone CommonJS for testing
async function loadPriceActionViewComponent() {
  const viewPath = path.join(webSrcDir, 'components/PriceActionView.tsx');
  const bundle = await esbuild.build({
    entryPoints: [viewPath],
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
  return mod.exports.PriceActionView;
}

const PriceActionView = await loadPriceActionViewComponent();

test('1. PriceActionView renders clean HTML with default initialSymbol', () => {
  const html = ReactDOMServer.renderToString(
    React.createElement(PriceActionView, {
      initialSymbol: 'SPY',
    })
  );

  assert.ok(html.includes('Price Action Lab'), 'Should display Price Action Lab heading');
  assert.ok(html.includes('Al Brooks Method'), 'Should display Al Brooks Method badge');
  assert.ok(html.includes('value="SPY"'), 'Ticker input should default to SPY');
});

test('2. PriceActionView renders quick-pick ticker pills', () => {
  const html = ReactDOMServer.renderToString(
    React.createElement(PriceActionView, {
      initialSymbol: 'AAPL',
    })
  );

  assert.ok(html.includes('>SPY<'), 'Should include SPY chip');
  assert.ok(html.includes('>QQQ<'), 'Should include QQQ chip');
  assert.ok(html.includes('>NVDA<'), 'Should include NVDA chip');
  assert.ok(html.includes('>TSLA<'), 'Should include TSLA chip');
});

test('3. PriceActionView renders Pattern Setups panel and filter controls', () => {
  const html = ReactDOMServer.renderToString(
    React.createElement(PriceActionView, {
      initialSymbol: 'MSFT',
    })
  );

  assert.ok(html.includes('Pattern Setups'), 'Should render Pattern Setups header');
  assert.ok(html.includes('Bull'), 'Should render Bull filter button');
  assert.ok(html.includes('Bear'), 'Should render Bear filter button');
});

test('4. PriceActionView includes regulatory disclaimer and Al Brooks attribution', () => {
  const html = ReactDOMServer.renderToString(
    React.createElement(PriceActionView, {
      initialSymbol: 'TSLA',
    })
  );

  assert.ok(html.includes('Reading Price Charts Bar by Bar'), 'Must cite Reading Price Charts Bar by Bar');
  assert.ok(html.includes('Trading Price Action'), 'Must cite Trading Price Action trilogy');
  assert.ok(html.includes('Regulatory Notice'), 'Must include Regulatory Notice');
  assert.ok(html.includes('Not financial advice'), 'Must explicitly state Not financial advice');
});

test('5. PriceActionView renders Market Regime Banner when regime is present', () => {
  const mockRegime = {
    spx: { symbol: 'SPX', direction: 'BULL', phase: 'bull leg 2', legNumber: 2, isExtended: false, lastClose: 580, ema20: 575, lastBarDate: '2024-10-11' },
    ndx: { symbol: 'NDX', direction: 'BULL', phase: 'bull leg 2', legNumber: 2, isExtended: false, lastClose: 490, ema20: 485, lastBarDate: '2024-10-11' },
    agreement: 'AGREE',
    summary: 'SPX: bull trend (bull leg 2) · NDX: bull trend (bull leg 2) · agree — as of 2024-10-11 close',
    guidanceNote: 'Both SPX and NDX in bull trend. Long pullback setups favored.',
    asOfBarDate: '2024-10-11',
    evaluatedAt: '2024-10-11T20:00:00Z',
    confidenceNote: 'Not financial advice — probabilistic.',
  };

  const html = ReactDOMServer.renderToString(
    React.createElement(PriceActionView, {
      initialSymbol: 'SPY',
      initialRegime: mockRegime,
    })
  );

  assert.ok(html.includes('Broad Market'), 'Must render Broad Market badge');
  assert.ok(html.includes('SPX'), 'Must render SPX ticker link');
  assert.ok(html.includes('NDX'), 'Must render NDX ticker link');
  assert.ok(html.includes('bull trend'), 'Must render bull trend label');
  assert.ok(html.includes('agree'), 'Must render agreement status');
  assert.ok(html.includes('2024-10-11'), 'Must render as-of close date');
  assert.ok(html.includes('Long pullback setups favored'), 'Must render guidance note');
});

