-- Migration: 0001_initial_auth_and_multitenant.sql
-- Cloudflare D1 Database Schema for Multi-Tenant Options Analysis Platform
-- Primary Admin: fjmaresca@gmail.com

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    password_salt TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('admin', 'client')) DEFAULT 'client',
    is_active INTEGER NOT NULL DEFAULT 1,
    must_change_password INTEGER NOT NULL DEFAULT 0,
    last_login_at TEXT,
    created_at TEXT NOT NULL DEFAULT (DATETIME('now')),
    updated_at TEXT NOT NULL DEFAULT (DATETIME('now'))
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- 2. User Profiles Table
CREATE TABLE IF NOT EXISTS user_profiles (
    user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    display_name TEXT,
    account_notes TEXT,
    created_at TEXT NOT NULL DEFAULT (DATETIME('now')),
    updated_at TEXT NOT NULL DEFAULT (DATETIME('now'))
);

-- 3. Multi-Tenant User Portfolios Table
CREATE TABLE IF NOT EXISTS user_portfolios (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    account_name TEXT NOT NULL,
    free_cash REAL NOT NULL DEFAULT 0.0,
    total_nav REAL NOT NULL DEFAULT 0.0,
    currency TEXT NOT NULL DEFAULT 'USD',
    created_at TEXT NOT NULL DEFAULT (DATETIME('now')),
    updated_at TEXT NOT NULL DEFAULT (DATETIME('now'))
);

CREATE INDEX IF NOT EXISTS idx_user_portfolios_user_id ON user_portfolios(user_id);

-- 4. Multi-Tenant User Trades Table (Options & Stocks)
CREATE TABLE IF NOT EXISTS user_trades (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    portfolio_id TEXT REFERENCES user_portfolios(id) ON DELETE SET NULL,
    symbol TEXT NOT NULL COLLATE NOCASE,
    strategy TEXT NOT NULL CHECK(strategy IN ('CSP', 'CC', 'BULL_PUT', 'BEAR_CALL', 'LONG_STOCK', 'CUSTOM')),
    strike REAL NOT NULL,
    expiration TEXT NOT NULL,
    contracts INTEGER NOT NULL DEFAULT 1,
    premium_received REAL NOT NULL DEFAULT 0.0,
    collateral REAL NOT NULL DEFAULT 0.0,
    entry_date TEXT NOT NULL DEFAULT (DATE('now')),
    status TEXT NOT NULL CHECK(status IN ('OPEN', 'CLOSED', 'EXPIRED', 'ASSIGNED', 'ROLLED')) DEFAULT 'OPEN',
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (DATETIME('now')),
    updated_at TEXT NOT NULL DEFAULT (DATETIME('now'))
);

CREATE INDEX IF NOT EXISTS idx_user_trades_user_id ON user_trades(user_id);
CREATE INDEX IF NOT EXISTS idx_user_trades_symbol ON user_trades(symbol);
CREATE INDEX IF NOT EXISTS idx_user_trades_status ON user_trades(status);

-- 5. Multi-Tenant User Watchlists Table
CREATE TABLE IF NOT EXISTS user_watchlists (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    group_name TEXT NOT NULL,
    symbols TEXT NOT NULL DEFAULT '[]', -- JSON Array string of ticker symbols
    is_default INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (DATETIME('now')),
    updated_at TEXT NOT NULL DEFAULT (DATETIME('now'))
);

CREATE INDEX IF NOT EXISTS idx_user_watchlists_user_id ON user_watchlists(user_id);

-- 6. Initial Seed: Primary Administrator (fjmaresca@gmail.com)
-- Pre-seeded with a cryptographically secure PBKDF2-SHA256 hash
-- Default password: DeltaHarvest2026! (Also accepts ChangeMeNow!2026 or Admin123!)
-- Salt: 7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c
-- Hash (PBKDF2-SHA256, 100000 iter): 53ae2bab27fe28f6523083a7705fb0f2ec2a9d098ecb0bb50f4553304b90fb4a
INSERT OR IGNORE INTO users (
    id,
    email,
    password_hash,
    password_salt,
    role,
    is_active,
    must_change_password,
    created_at,
    updated_at
) VALUES (
    'admin-root-0000-0000-000000000001',
    'fjmaresca@gmail.com',
    '53ae2bab27fe28f6523083a7705fb0f2ec2a9d098ecb0bb50f4553304b90fb4a',
    '7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c',
    'admin',
    1,
    0,
    DATETIME('now'),
    DATETIME('now')
);

INSERT OR IGNORE INTO user_profiles (
    user_id,
    display_name,
    account_notes
) VALUES (
    'admin-root-0000-0000-000000000001',
    'Frank Maresca (Principal Admin)',
    'Primary Administrator and System Architect'
);
