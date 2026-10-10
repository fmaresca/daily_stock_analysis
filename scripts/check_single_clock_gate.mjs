/**
 * CI Gate: Single Clock Authority Gate
 *
 * Verifies that all currency, expiration, and market-time decisions flow exclusively
 * through the single clock authority (`web/src/utils/appNow.ts` on client, `functions/api/_now.js` on edge).
 *
 * Fails the build if `new Date()` or `Date.now()` appears in `web/src/utils/` or `functions/api/`
 * outside `appNow.ts` / `_now.js` unless explicitly annotated with `// wall-clock-ok: <reason>`
 * for pure wall-clock operations (IDs, logs, network telemetry).
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const SCAN_DIRS = [
  path.join(rootDir, 'web', 'src', 'utils'),
  path.join(rootDir, 'functions', 'api'),
];

const EXEMPT_FILES = new Set([
  'appNow.ts',
  '_now.js',
]);

const ALLOWED_EXTS = new Set(['.ts', '.tsx', '.js', '.mjs']);

const violations = [];

function scanDirectory(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scanDirectory(fullPath);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name);
      if (!ALLOWED_EXTS.has(ext)) continue;
      if (EXEMPT_FILES.has(entry.name)) continue;

      const content = fs.readFileSync(fullPath, 'utf8');
      const lines = content.split('\n');

      lines.forEach((line, index) => {
        const trimmed = line.trim();
        // Ignore full-line comments
        if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
          return;
        }

        const hasNewDate = /new\s+Date\(\s*\)/.test(line);
        const hasDateNow = /Date\.now\(\s*\)/.test(line);

        if (hasNewDate || hasDateNow) {
          if (!line.includes('// wall-clock-ok:')) {
            const relPath = path.relative(rootDir, fullPath).replace(/\\/g, '/');
            violations.push({
              file: relPath,
              lineNum: index + 1,
              line: trimmed,
              reason: hasNewDate ? 'Unannotated new Date()' : 'Unannotated Date.now()',
            });
          }
        }
      });
    }
  }
}

for (const dir of SCAN_DIRS) {
  scanDirectory(dir);
}

if (violations.length > 0) {
  console.error('\n❌ Single Clock Authority Gate FAILED:');
  console.error(`Found ${violations.length} unannotated wall-clock call site(s) outside single clock authorities.`);
  console.error('All currency, expiration, and market decisions must flow through appNow.ts / _now.js.');
  console.error('Pure wall-clock operations (unique IDs, network logs) must have an explicit `// wall-clock-ok: <reason>` comment.\n');

  violations.forEach((v) => {
    console.error(`  ${v.file}:${v.lineNum}`);
    console.error(`    Line: ${v.line}`);
    console.error(`    Issue: ${v.reason}\n`);
  });

  process.exit(1);
} else {
  console.log('✅ Single Clock Authority Gate passed: all currency and expiration decisions adhere to appNow / _now authority.');
  process.exit(0);
}
