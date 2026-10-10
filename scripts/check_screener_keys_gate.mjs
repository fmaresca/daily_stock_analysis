/**
 * CI Gate: Managed Screener Storage Keys Gate
 *
 * Enforces the "New-Upload Weekly Reset" rule:
 * Any localStorage key storing weekly screener results must be registered in
 * `MANAGED_SCREENER_KEYS` in `web/src/utils/weeklyRollover.ts` so it is safely
 * archived (and never orphaned or silently leaked into subsequent weeks).
 *
 * Fails the build if any `setItem('deltaharvest_*screen*'` or `setItem('deltaharvest_*watchlist*'`
 * call site stores screener datasets without being listed in weeklyRollover.ts.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const rolloverFile = path.join(rootDir, 'web', 'src', 'utils', 'weeklyRollover.ts');
if (!fs.existsSync(rolloverFile)) {
  console.error('FAIL: weeklyRollover.ts not found at ' + rolloverFile);
  process.exit(1);
}

const rolloverContent = fs.readFileSync(rolloverFile, 'utf8');

// Extract registered keys from MANAGED_SCREENER_KEYS in weeklyRollover.ts
const registeredKeys = new Set();
const keyRegex = /key:\s*['"](deltaharvest_[a-zA-Z0-9_-]+)['"]/g;
let m;
while ((m = keyRegex.exec(rolloverContent)) !== null) {
  registeredKeys.add(m[1]);
}

if (registeredKeys.size === 0) {
  console.error('FAIL: No MANAGED_SCREENER_KEYS discovered in weeklyRollover.ts');
  process.exit(1);
}

console.log(`[CI Gate] Discovered ${registeredKeys.size} managed screener keys in weeklyRollover.ts:`);
registeredKeys.forEach((k) => console.log(`  ✓ ${k}`));

// Exempt keys that are UI toggles, user configuration, archives, or non-screener datasets
const EXEMPT_KEYS = new Set([
  'deltaharvest_watchlist_groups', // User custom watchlist groupings, not weekly screener datasets
  'deltaharvest_user_watchlists',
  'deltaharvest_screener_chooser_open', // UI accordion open/closed toggle state
  'deltaharvest_screener_filters', // User filter settings (preserved across weeks)
]);

const violations = [];

function scanDirectory(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === '.git') continue;
      scanDirectory(fullPath);
    } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx') || entry.name.endsWith('.js'))) {
      if (entry.name === 'weeklyRollover.ts') continue;

      const code = fs.readFileSync(fullPath, 'utf8');
      const lines = code.split('\n');

      lines.forEach((line, lineIdx) => {
        const trimmed = line.trim();
        if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) return;

        // Search for localStorage.setItem('deltaharvest_...screen...' or 'deltaharvest_...watchlist...')
        const setItemRegex = /setItem\(\s*['"](deltaharvest_[a-zA-Z0-9_-]+)['"]/g;
        let match;
        while ((match = setItemRegex.exec(line)) !== null) {
          const keyName = match[1];

          // Check if key is a screener dataset key
          const isScreenerKey = keyName.includes('screen') || keyName.includes('watchlist');
          const isArchiveKey = keyName.startsWith('deltaharvest_screen_archive_');

          if (isScreenerKey && !isArchiveKey && !EXEMPT_KEYS.has(keyName)) {
            if (!registeredKeys.has(keyName)) {
              violations.push({
                file: path.relative(rootDir, fullPath),
                line: lineIdx + 1,
                key: keyName,
                code: trimmed,
              });
            }
          }
        }
      });
    }
  }
}

scanDirectory(path.join(rootDir, 'web', 'src'));

if (violations.length > 0) {
  console.error('\n❌ FAIL: Unregistered screener localStorage key(s) detected:');
  violations.forEach((v) => {
    console.error(`  ${v.file}:${v.line} -> key '${v.key}' is not registered in MANAGED_SCREENER_KEYS in weeklyRollover.ts`);
    console.error(`    Line: ${v.code}`);
  });
  console.error('\nEvery screener result storage key must be registered in MANAGED_SCREENER_KEYS in web/src/utils/weeklyRollover.ts so it can be cleanly archived on new week uploads.');
  process.exit(1);
}

console.log('✅ CI Gate Passed: All active screener localStorage keys are registered in weeklyRollover.ts MANAGED_SCREENER_KEYS.\n');
