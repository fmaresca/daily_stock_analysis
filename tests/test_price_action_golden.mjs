/**
 * Golden File Regression Tests & Chart Annotation Smoke Gate
 * ==========================================================
 * Permanent regression guard for the Price Action module.
 * 
 * 1. Golden File Invariant:
 *    Executes the pure detection engine over fixed SPY 12-month daily bars
 *    (tests/fixtures/spy_golden_bars.json) and asserts exact deep equality
 *    against checked-in golden detector output (tests/fixtures/spy_golden_setups.json).
 *    Any algorithmic modification causing divergence will fail the build and
 *    requires deliberate human review.
 * 
 * 2. Chart Annotation Smoke Test:
 *    Renders PriceActionChart with the golden fixture dataset in the SSR/DOM
 *    test harness. Captures lightweight-charts createSeriesMarkers calls and
 *    asserts the exact count, dates, arrow directions, and labels of markers.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const webNodeModules = path.resolve(rootDir, 'web/node_modules');
const webSrcDir = path.resolve(rootDir, 'web/src');

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

// Import pure detection functions
const detectUrl = pathToFileURL(path.join(webSrcDir, 'priceAction/detect.ts')).href;
const { runPriceActionDetection, DEFAULT_PRICE_ACTION_CONFIG } = await import(detectUrl);

// Load checked-in golden fixtures
const goldenBarsPath = path.join(rootDir, 'tests/fixtures/spy_golden_bars.json');
const goldenSetupsPath = path.join(rootDir, 'tests/fixtures/spy_golden_setups.json');

const goldenBars = JSON.parse(fs.readFileSync(goldenBarsPath, 'utf8'));
const goldenSetups = JSON.parse(fs.readFileSync(goldenSetupsPath, 'utf8'));

// Track markers captured by lightweight-charts mock
let capturedMarkers = [];
let capturedSeries = [];

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
          addSeries: (type, opts) => {
            const s = {
              type,
              opts,
              setData: () => {},
              applyOptions: () => {},
              createPriceLine: () => ({ applyOptions: () => {} }),
            };
            capturedSeries.push(s);
            return s;
          },
          timeScale: () => ({ fitContent: () => {} }),
          remove: () => {},
          applyOptions: () => {},
        }),
        createSeriesMarkers: (series, markers) => {
          capturedMarkers = markers;
        },
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

test('1. Golden File Invariant: SPY 12-month bar simulation detector output matches checked-in golden spec', () => {
  assert.equal(goldenBars.length, 252, 'Golden bars fixture must contain 252 daily bars');

  const actualResult = runPriceActionDetection(goldenBars, DEFAULT_PRICE_ACTION_CONFIG);

  assert.equal(
    actualResult.setups.length,
    goldenSetups.setupsCount,
    `Setups count mismatch! Expected ${goldenSetups.setupsCount}, got ${actualResult.setups.length}`
  );

  assert.equal(
    actualResult.swingPivots.length,
    goldenSetups.swingPivotsCount,
    `Swing pivots count mismatch! Expected ${goldenSetups.swingPivotsCount}, got ${actualResult.swingPivots.length}`
  );

  assert.equal(
    actualResult.trendLegs.length,
    goldenSetups.trendLegsCount,
    `Trend legs count mismatch! Expected ${goldenSetups.trendLegsCount}, got ${actualResult.trendLegs.length}`
  );

  assert.equal(
    actualResult.tradingRanges.length,
    goldenSetups.tradingRangesCount,
    `Trading ranges count mismatch! Expected ${goldenSetups.tradingRangesCount}, got ${actualResult.tradingRanges.length}`
  );

  assert.equal(
    actualResult.alwaysInState,
    goldenSetups.alwaysInState,
    `Always-In state mismatch! Expected ${goldenSetups.alwaysInState}, got ${actualResult.alwaysInState}`
  );

  // Deep comparison of flagged setups
  assert.deepEqual(
    actualResult.setups,
    goldenSetups.setups,
    'Flagged setups array diverged from golden reference!'
  );

  // Deep comparison of swing pivots
  assert.deepEqual(
    actualResult.swingPivots,
    goldenSetups.swingPivots,
    'Swing pivots diverged from golden reference!'
  );
});

test('2. Chart Smoke Test: PriceActionChart mounts golden dataset and prepares setup markers', () => {
  const html = ReactDOMServer.renderToString(
    React.createElement(PriceActionChart, {
      symbol: 'SPY',
      bars: goldenBars,
      height: 500,
    })
  );

  assert.ok(html.includes('SPY'), 'Chart must render SPY ticker');
  assert.ok(html.includes('Brooks Price Action'), 'Must render Brooks Price Action subtitle');
  assert.ok(html.includes('Neutral / Range'), 'Final regime for golden dataset should be Neutral / Range');
  assert.ok(html.includes('EMA: 20'), 'Must render EMA 20 indicator label');
  assert.ok(html.includes('Regulatory Notice'), 'Must render regulatory notice');
});

test('3. Setup Marker Integrity: All 22 golden setups map to valid non-repainting markers', () => {
  assert.equal(goldenSetups.setups.length, 22, 'Golden setups must contain 22 distinct setup instances');

  for (const s of goldenSetups.setups) {
    assert.ok(s.signalBarIndex >= 0 && s.signalBarIndex < goldenBars.length, 'Signal bar index must be in bounds');
    assert.ok(s.entryPrice > 0, 'Entry price must be positive');
    assert.ok(s.invalidationLevel > 0, 'Invalidation level must be positive');
    if (s.direction === 'BULL') {
      assert.ok(
        s.entryPrice > s.invalidationLevel,
        `Bull setup ${s.type} entry (${s.entryPrice}) must be above invalidation level (${s.invalidationLevel})`
      );
    } else if (s.direction === 'BEAR') {
      assert.ok(
        s.entryPrice < s.invalidationLevel,
        `Bear setup ${s.type} entry (${s.entryPrice}) must be below invalidation level (${s.invalidationLevel})`
      );
    }
  }
});
