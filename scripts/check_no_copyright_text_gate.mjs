/**
 * CI Gate: No Copyrighted Text Guard
 * ==================================
 * Verifies that all files in the Price Action module adhere to the iron rule:
 * Implement strictly from published concepts (Al Brooks methodology) without
 * reproducing verbatim book passages or copyrighted course prose in code,
 * comments, strings, or documentation.
 * 
 * Scans:
 * - web/src/priceAction/
 * - web/src/components/priceAction/
 * - web/src/components/PriceActionView.tsx
 * 
 * Fails the build with exit code 1 if any verbatim match is detected.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const SCAN_TARGETS = [
  path.join(rootDir, 'web', 'src', 'priceAction'),
  path.join(rootDir, 'web', 'src', 'components', 'priceAction'),
  path.join(rootDir, 'web', 'src', 'components', 'PriceActionView.tsx'),
];

/**
 * Plagiarism sentinel blocklist:
 * Short distinctive signature strings from published works used strictly as detection triggers.
 * (Short phrases only — no extended passages reproduced).
 */
const FORBIDDEN_TEXT_BLOCKLIST = [
  'every bar is a trend bar or a trading range bar',
  'institutional traders are looking to fade the breakout',
  'most breakouts fail and become trading ranges',
  'the market is always in either a trend or a trading range',
  'if you cannot tell if the market is trending or in a trading range',
  'bar by bar analysis of every single bar on the chart',
  'traders should enter on a stop one tick above the high',
  'traders should enter on a stop one tick below the low',
  'the always in long position is initiated when',
  'the always in short position is initiated when',
  'the single most important concept in all of price action',
];

const ALLOWED_EXTS = new Set(['.ts', '.tsx', '.js', '.mjs', '.md']);
const violations = [];

function checkFile(filePath) {
  const ext = path.extname(filePath);
  if (!ALLOWED_EXTS.has(ext)) return;

  const content = fs.readFileSync(filePath, 'utf8').toLowerCase();
  const lines = content.split('\n');

  for (let lineNum = 0; lineNum < lines.length; lineNum++) {
    const line = lines[lineNum];
    for (const phrase of FORBIDDEN_TEXT_BLOCKLIST) {
      if (line.includes(phrase)) {
        violations.push({
          file: path.relative(rootDir, filePath),
          line: lineNum + 1,
          matchedPhrase: phrase,
          lineText: line.trim(),
        });
      }
    }
  }
}

function scanPath(targetPath) {
  if (!fs.existsSync(targetPath)) return;
  const stat = fs.statSync(targetPath);
  if (stat.isFile()) {
    checkFile(targetPath);
  } else if (stat.isDirectory()) {
    const entries = fs.readdirSync(targetPath, { withFileTypes: true });
    for (const entry of entries) {
      scanPath(path.join(targetPath, entry.name));
    }
  }
}

for (const target of SCAN_TARGETS) {
  scanPath(target);
}

if (violations.length > 0) {
  console.error('\n❌ [FAIL] No-Copyrighted-Text Gate: Verbatim passages detected in Price Action module!');
  console.error('The Price Action engine must implement mathematical heuristics from concepts only.');
  violations.forEach((v) => {
    console.error(`  - ${v.file}:${v.line} -> Matched blocklist signature: "${v.matchedPhrase}"`);
    console.error(`    Line: "${v.lineText}"`);
  });
  console.error('\nRemove verbatim text and express concepts algorithmically.\n');
  process.exit(1);
} else {
  console.log('✔ [PASS] No-Copyrighted-Text Gate: 0 verbatim violations across all Price Action files.');
  process.exit(0);
}
