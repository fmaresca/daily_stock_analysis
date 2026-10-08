#!/usr/bin/env node

/**
 * DeltaHarvest One-Shot D1 Credential Rotation Script
 *
 * Rotates passwords for exposed accounts:
 * - fjmaresca@gmail.com
 * - wayneodonohue@gmail.com
 * - wayneodonuhe@gmail.com
 * - admin@deltaharvest.local
 *
 * Generates cryptographically secure 24-character random passwords.
 * Prints plaintext passwords ONCE to stdout.
 * Emits rotation.sql containing ONLY PBKDF2 hashes and salts.
 * Increments token_version to invalidate all existing sessions.
 * Sets must_change_password = 1.
 *
 * Usage:
 *   node scripts/rotate-exposed-passwords.mjs
 *   wrangler d1 execute deltaharvest-db --remote --file rotation.sql
 */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Exact PBKDF2 parameters matching functions/api/_auth_utils.js
export const PBKDF2_PARAMS = {
  iterations: 100000,
  keyLength: 32, // 32 bytes = 256 bits
  digest: "sha256",
  saltBytes: 16,
};

export function generateRandomSalt(bytes = PBKDF2_PARAMS.saltBytes) {
  return crypto.randomBytes(bytes).toString("hex");
}

export function hashPassword(password, saltHex) {
  const saltBuffer = Buffer.from(saltHex, "hex");
  return crypto.pbkdf2Sync(
    password,
    saltBuffer,
    PBKDF2_PARAMS.iterations,
    PBKDF2_PARAMS.keyLength,
    PBKDF2_PARAMS.digest
  ).toString("hex");
}

export function generateSecurePassword(length = 24) {
  const charset = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*()_+-=";
  const bytes = crypto.randomBytes(length);
  return Array.from(bytes)
    .map((b) => charset[b % charset.length])
    .join("");
}

export const AFFECTED_EMAILS = [
  "fjmaresca@gmail.com",
  "wayneodonohue@gmail.com",
  "wayneodonuhe@gmail.com",
  "admin@deltaharvest.local",
];

export function runRotation(outputFilePath = path.join(process.cwd(), "rotation.sql")) {
  console.log("\n================================================================================");
  console.log("DELTAHARVEST CREDENTIAL ROTATION — SAVE PASSWORDS NOW (SHOWN ONCE ONLY)");
  console.log("================================================================================\n");

  const generatedCredentials = [];
  const sqlStatements = [];

  for (const email of AFFECTED_EMAILS) {
    const newPassword = generateSecurePassword(24);
    const saltHex = generateRandomSalt(16);
    const hashHex = hashPassword(newPassword, saltHex);

    generatedCredentials.push({ email, newPassword, saltHex, hashHex });

    console.log(`Account:  ${email}`);
    console.log(`Password: ${newPassword}`);
    console.log("--------------------------------------------------------------------------------");

    // SQL statement escapes quotes in email if any
    const safeEmail = email.toLowerCase().replace(/'/g, "''");
    sqlStatements.push(
      `UPDATE users SET password_hash = '${hashHex}', password_salt = '${saltHex}', must_change_password = 1, token_version = token_version + 1, updated_at = DATETIME('now') WHERE lower(email) = '${safeEmail}';`
    );
  }

  const sqlContent = [
    "-- DeltaHarvest D1 Credential Rotation SQL",
    `-- Generated: ${new Date().toISOString()}`,
    "-- Notice: Plaintext passwords are NEVER written to this file.",
    "",
    ...sqlStatements,
    "",
  ].join("\n");

  fs.writeFileSync(outputFilePath, sqlContent, { encoding: "utf-8", mode: 0o600 });

  console.log(`\n✓ rotation.sql generated successfully at: ${outputFilePath}`);
  console.log("Next Step (Deploy SQL to Cloudflare Remote D1):");
  console.log("  npx wrangler d1 execute deltaharvest-db --remote --file rotation.sql\n");

  return generatedCredentials;
}

if (process.argv[1] === __filename) {
  runRotation();
}
