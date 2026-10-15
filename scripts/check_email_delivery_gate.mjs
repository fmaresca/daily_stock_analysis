/**
 * CI Gate: Email Delivery Hardening & 502 Semantic Misuse Gate
 *
 * Verifies two critical architectural invariants:
 * 1. Semantic Status Invariant: No '? 200 : 502' or 'emailSent ? 200 : 502' pattern
 *    may ever reappear in `functions/` (probe execution must return 200 with diagnostics).
 * 2. Provider Isolation Invariant: All outbound calls to `api.resend.com` must strictly flow
 *    through the retry & audit helper `functions/api/_email_delivery.js`.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const functionsDir = path.join(rootDir, 'functions');

const violations = [];

function scanDirectory(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scanDirectory(fullPath);
    } else if (entry.isFile() && (entry.name.endsWith('.js') || entry.name.endsWith('.mjs') || entry.name.endsWith('.ts'))) {
      const relPath = path.relative(rootDir, fullPath).replace(/\\/g, '/');
      const content = fs.readFileSync(fullPath, 'utf8');
      const lines = content.split('\n');

      lines.forEach((line, index) => {
        const lineNum = index + 1;

        // Check 1: 502 semantic misuse
        if (/\?\s*200\s*:\s*502/.test(line)) {
          violations.push({
            type: '502_SEMANTIC_MISUSE',
            file: relPath,
            line: lineNum,
            detail: `Found forbidden '? 200 : 502' pattern: "${line.trim()}"`,
          });
        }

        // Check 2: Direct un-isolated api.resend.com reference
        if (line.includes('api.resend.com') && !relPath.endsWith('_email_delivery.js')) {
          violations.push({
            type: 'RESEND_PROVIDER_LEAK',
            file: relPath,
            line: lineNum,
            detail: `Direct 'api.resend.com' reference outside _email_delivery.js: "${line.trim()}"`,
          });
        }
      });
    }
  }
}

scanDirectory(functionsDir);

if (violations.length > 0) {
  console.error('\n❌ Email Delivery CI Gate Failed! Found violations:');
  for (const v of violations) {
    console.error(`  - [${v.type}] ${v.file}:${v.line} -> ${v.detail}`);
  }
  process.exit(1);
} else {
  console.log('✅ Email Delivery CI Gate Passed: Zero 502 status misuse and all Resend dispatch flows isolated in _email_delivery.js.');
  process.exit(0);
}
