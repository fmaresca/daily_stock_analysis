#!/usr/bin/env node

/**
 * DeltaHarvest D1 Initial Administrator Provisioning Script
 *
 * Requirements:
 * - Creates users, user_profiles, and password_reset_tokens tables if missing.
 * - Inserts ONE admin row for the specified email.
 * - Generates a cryptographically random 20-character password, printed ONCE to stdout.
 * - Sets must_change_password = 1 and is_active = 1.
 * - REFUSES to run if an administrator account already exists.
 *
 * Usage:
 *   node scripts/seed-admin.mjs --email admin@example.com [--remote] [--db deltaharvest-db]
 *   node scripts/seed-admin.mjs --email admin@example.com --dry-run
 */

import { execSync } from "node:child_process";
import crypto from "node:crypto";

function parseArgs() {
  const args = process.argv.slice(2);
  let email = null;
  let isRemote = false;
  let isDryRun = false;
  let dbName = "deltaharvest-db";

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--email" && i + 1 < args.length) {
      email = args[++i];
    } else if (arg === "--remote") {
      isRemote = true;
    } else if (arg === "--dry-run") {
      isDryRun = true;
    } else if (arg === "--db" && i + 1 < args.length) {
      dbName = args[++i];
    } else if (!arg.startsWith("--") && !email) {
      email = arg;
    }
  }

  return { email, isRemote, isDryRun, dbName };
}

function generateSecurePassword(length = 20) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*()_+-=";
  const bytes = crypto.randomBytes(length);
  return Array.from(bytes)
    .map((b) => chars[b % chars.length])
    .join("");
}

function generateSalt(bytes = 16) {
  return crypto.randomBytes(bytes).toString("hex");
}

function hashPassword(password, saltHex) {
  const saltBuffer = Buffer.from(saltHex, "hex");
  return crypto.pbkdf2Sync(password, saltBuffer, 100000, 32, "sha256").toString("hex");
}

function runWrangler(command, isRemote, dbName) {
  const remoteFlag = isRemote ? "--remote" : "--local";
  const fullCmd = `npx wrangler d1 execute ${dbName} ${remoteFlag} --command "${command.replace(/"/g, '\\"')}" --json`;
  try {
    const output = execSync(fullCmd, { encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] });
    return JSON.parse(output);
  } catch (err) {
    throw new Error(`Wrangler execution failed: ${err.stderr || err.message}`);
  }
}

async function main() {
  const { email, isRemote, isDryRun, dbName } = parseArgs();

  if (!email || !email.includes("@")) {
    console.error("ERROR: A valid email address is required.");
    console.error("Usage: node scripts/seed-admin.mjs --email <admin-email> [--remote] [--db <name>]");
    process.exit(1);
  }

  const cleanEmail = email.trim().toLowerCase();
  console.log(`Checking database state for admin seeding (${cleanEmail})...`);

  if (isDryRun) {
    const tempPassword = generateSecurePassword(20);
    const tempSalt = generateSalt(16);
    const tempHash = hashPassword(tempPassword, tempSalt);
    console.log("[DRY-RUN] Schema check and admin existence check simulated.");
    console.log(`[DRY-RUN] Generated 20-char password: ${tempPassword}`);
    console.log(`[DRY-RUN] PBKDF2 hash: ${tempHash}`);
    console.log("[DRY-RUN] Completed without modifying database.");
    return;
  }

  // 1. Ensure required tables exist
  const createTablesSql = `
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL COLLATE NOCASE,
      password_hash TEXT NOT NULL,
      password_salt TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin', 'client')) DEFAULT 'client',
      is_active INTEGER NOT NULL DEFAULT 1,
      must_change_password INTEGER NOT NULL DEFAULT 0,
      token_version INTEGER NOT NULL DEFAULT 0,
      last_login_at TEXT,
      created_at TEXT NOT NULL DEFAULT (DATETIME('now')),
      updated_at TEXT NOT NULL DEFAULT (DATETIME('now'))
    );
    CREATE TABLE IF NOT EXISTS user_profiles (
      user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      display_name TEXT,
      account_notes TEXT,
      created_at TEXT NOT NULL DEFAULT (DATETIME('now')),
      updated_at TEXT NOT NULL DEFAULT (DATETIME('now'))
    );
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      token_hash TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (DATETIME('now'))
    );
  `;

  try {
    runWrangler(createTablesSql, isRemote, dbName);
  } catch (e) {
    console.warn("Notice: Table schema verification output:", e.message);
  }

  // 2. Refuse to run if an administrator already exists
  try {
    const checkResult = runWrangler("SELECT id, email FROM users WHERE role = 'admin' LIMIT 1", isRemote, dbName);
    const existingAdmin = checkResult?.[0]?.results?.[0];
    if (existingAdmin && existingAdmin.id) {
      console.error("\n================================================================");
      console.error("SECURITY REFUSAL: An administrator account already exists.");
      console.error(`Existing Admin: ${existingAdmin.email} (ID: ${existingAdmin.id})`);
      console.error("To rotate credentials, use authenticated admin console or password reset flow.");
      console.error("================================================================\n");
      process.exit(1);
    }
  } catch (err) {
    console.warn("Could not query existing admins, proceeding cautiously:", err.message);
  }

  // 3. Generate credentials
  const password = generateSecurePassword(20);
  const saltHex = generateSalt(16);
  const hashHex = hashPassword(password, saltHex);
  const adminId = `admin-root-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;
  const now = new Date().toISOString();

  // 4. Insert admin user row
  const insertSql = `
    INSERT INTO users (id, email, password_hash, password_salt, role, is_active, must_change_password, token_version, created_at, updated_at)
    VALUES ('${adminId}', '${cleanEmail}', '${hashHex}', '${saltHex}', 'admin', 1, 1, 0, '${now}', '${now}');
    INSERT INTO user_profiles (user_id, display_name, account_notes, created_at, updated_at)
    VALUES ('${adminId}', 'Primary Administrator', 'Initial Seeded Administrator', '${now}', '${now}');
  `;

  runWrangler(insertSql, isRemote, dbName);

  // 5. Output password ONCE to stdout
  console.log("\n================================================================");
  console.log("DELTAHARVEST PRIMARY ADMINISTRATOR SEEDED SUCCESSFULLY");
  console.log("================================================================");
  console.log(`Admin Email:    ${cleanEmail}`);
  console.log(`Admin Password: ${password}`);
  console.log("================================================================");
  console.log("CRITICAL SECURITY NOTICE:");
  console.log("- Save this password immediately in your secure password manager.");
  console.log("- This password was printed ONCE and is NOT stored in plaintext.");
  console.log("- First sign-in will enforce a password change (must_change_password = 1).");
  console.log("================================================================\n");
}

main().catch((err) => {
  console.error("Seed script execution error:", err);
  process.exit(1);
});
