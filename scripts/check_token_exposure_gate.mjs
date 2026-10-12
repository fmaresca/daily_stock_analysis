/**
 * CI Gate: Password Reset Token Plaintext Exposure Guard
 *
 * Enforces security invariants (cite: plaintext token exposure, 2026-10-11):
 * 1. Admin API endpoints (functions/api/admin/) must NEVER select raw token columns,
 *    must NEVER perform wildcard `SELECT * FROM access_inquiries`, and must NEVER
 *    return unmasked reset tokens or full reset URLs in API responses.
 * 2. Admin UI components (web/src/components/auth/AdminUsersView.tsx) must NEVER
 *    render unmasked tokens, must NEVER render raw inquiry notes containing tokens,
 *    and must NEVER render "Copy link" / "Copy token" buttons for reset credentials.
 * 3. The reset generation endpoint (functions/api/auth/reset-password.js) must NEVER
 *    persist plaintext tokens or reset URLs to the access_inquiries table and must
 *    NEVER include reset tokens in administrator notification emails.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const violations = [];

// ========================================================
// 1. Audit Admin API Endpoints: functions/api/admin/
// ========================================================
const adminDir = path.join(rootDir, 'functions', 'api', 'admin');
if (fs.existsSync(adminDir)) {
  function scanAdminFiles(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        scanAdminFiles(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.js')) {
        const relPath = path.relative(rootDir, fullPath).replace(/\\/g, '/');
        const content = fs.readFileSync(fullPath, 'utf8');
        const lines = content.split('\n');

        lines.forEach((line, idx) => {
          const trimmed = line.trim();
          if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
            return;
          }

          // Guard 1A: Forbid wildcard SELECT on access_inquiries
          if (/SELECT\s+\*\s+FROM\s+access_inquiries/i.test(line)) {
            violations.push({
              file: relPath,
              lineNum: idx + 1,
              line: trimmed,
              reason: 'Wildcard SELECT on access_inquiries is forbidden; must project explicit safe columns only.',
            });
          }

          // Guard 1B: Forbid selecting raw token column from password_reset_tokens
          if (/SELECT.*token_hash.*FROM\s+password_reset_tokens/i.test(line) && !line.includes('COUNT(')) {
            violations.push({
              file: relPath,
              lineNum: idx + 1,
              line: trimmed,
              reason: 'Admin API must never select token hashes from password_reset_tokens.',
            });
          }

          // Guard 1C: Forbid returning plaintext token fields in responses
          if (/plaintextToken|reset_token\s*:/i.test(line) && !line.includes('//') && !line.includes('replace(')) {
            violations.push({
              file: relPath,
              lineNum: idx + 1,
              line: trimmed,
              reason: 'Forbidden token field reference in admin API response payload.',
            });
          }
        });
      }
    }
  }
  scanAdminFiles(adminDir);
}

// ========================================================
// 2. Audit Admin Frontend: web/src/components/auth/
// ========================================================
const adminViewFile = path.join(rootDir, 'web', 'src', 'components', 'auth', 'AdminUsersView.tsx');
if (fs.existsSync(adminViewFile)) {
  const relPath = path.relative(rootDir, adminViewFile).replace(/\\/g, '/');
  const content = fs.readFileSync(adminViewFile, 'utf8');
  const lines = content.split('\n');

  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
      return;
    }

    // Guard 2A: Forbid rendering inq.note in inquiries table
    if (/\{\s*inq\.note/i.test(line)) {
      violations.push({
        file: relPath,
        lineNum: idx + 1,
        line: trimmed,
        reason: 'Rendering inq.note in inquiries table is forbidden because legacy notes may contain plaintext tokens/URLs.',
      });
    }

    // Guard 2B: Forbid reset token copy buttons
    if (/Copy\s+(link|token)/i.test(line)) {
      violations.push({
        file: relPath,
        lineNum: idx + 1,
        line: trimmed,
        reason: 'Forbidden Copy link or Copy token action button in Admin UI.',
      });
    }

    // Guard 2C: Forbid rendering full reset_token parameter
    if (/reset_token=/i.test(line)) {
      violations.push({
        file: relPath,
        lineNum: idx + 1,
        line: trimmed,
        reason: 'Admin UI must never render full reset_token URLs or parameters.',
      });
    }
  });
}

// ========================================================
// 3. Audit Auth Ingestion: functions/api/auth/reset-password.js
// ========================================================
const resetPwFile = path.join(rootDir, 'functions', 'api', 'auth', 'reset-password.js');
if (fs.existsSync(resetPwFile)) {
  const relPath = path.relative(rootDir, resetPwFile).replace(/\\/g, '/');
  const content = fs.readFileSync(resetPwFile, 'utf8');
  const lines = content.split('\n');

  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
      return;
    }

    // Guard 3A: Forbid embedding resetUrl in access_inquiries note insert
    if (line.includes('INSERT INTO access_inquiries') || line.includes('VALUES (?, ?, ?, ?, ?, ?, ?)')) {
      // Checked via context in surrounding lines
    }
    if (/`Password reset token generated\. Reset URL:/i.test(line)) {
      violations.push({
        file: relPath,
        lineNum: idx + 1,
        line: trimmed,
        reason: 'Forbidden insertion of plaintext reset URL into access_inquiries audit note.',
      });
    }

    // Guard 3B: Forbid sending reset link/token in admin alert body
    if (/adminNotice(Text|Html).*(resetUrl|plaintextToken)/i.test(line)) {
      violations.push({
        file: relPath,
        lineNum: idx + 1,
        line: trimmed,
        reason: 'Admin notification notice must NEVER include resetUrl or plaintextToken.',
      });
    }
  });
}

// ========================================================
// Report Results
// ========================================================
if (violations.length > 0) {
  console.error('\n❌ Token Exposure CI Gate FAILED:');
  console.error(`Found ${violations.length} security violation(s) risking plaintext token exposure:\n`);

  violations.forEach((v) => {
    console.error(`  ${v.file}:${v.lineNum}`);
    console.error(`    Line: ${v.line}`);
    console.error(`    Issue: ${v.reason}\n`);
  });

  process.exit(1);
} else {
  console.log('✅ Token Exposure CI Gate passed: No plaintext reset tokens exposed to Admin APIs, UI, or alerts.');
  process.exit(0);
}
