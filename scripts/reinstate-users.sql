-- ==============================================================================
-- DeltaHarvest D1 User Credential Reinstatement & Schema Alignment
-- Execute in Cloudflare Dashboard: D1 -> deltaharvest-db -> Console
-- ==============================================================================

-- 1. Ensure required tables exist
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

-- 2. Reinstate Frank Maresca (Super Administrator)
-- Password: DeltaHarvest2026!
INSERT INTO users (id, email, password_hash, password_salt, role, is_active, must_change_password, token_version)
VALUES (
  'usr-frank-superadmin',
  'fjmaresca@gmail.com',
  'ac4be917cec3796a520d53e71ac3ab476b09e41d3a5ae0cdf4094615d343d4d5',
  'ea7328f6f92d3eeb92e605a2fe24781c',
  'admin',
  1,
  0,
  1
)
ON CONFLICT(id) DO UPDATE SET
  email = excluded.email,
  password_hash = excluded.password_hash,
  password_salt = excluded.password_salt,
  role = 'admin',
  is_active = 1,
  must_change_password = 0,
  token_version = token_version + 1,
  updated_at = DATETIME('now');

INSERT INTO user_profiles (user_id, display_name)
VALUES ('usr-frank-superadmin', 'Frank Maresca')
ON CONFLICT(user_id) DO UPDATE SET display_name = excluded.display_name;

-- 3. Reinstate Wayne O'Donohue (Client Tenant)
-- Password: Whffranklin26
INSERT INTO users (id, email, password_hash, password_salt, role, is_active, must_change_password, token_version)
VALUES (
  'usr-wayne-client-1',
  'wayneodonohue@gmail.com',
  'd121634289b97cb9f5b7199f5664919023c38ce132ce8573db1d5090d7d951a0',
  '1db8043a197ae81aecee90033327420c',
  'client',
  1,
  0,
  1
)
ON CONFLICT(id) DO UPDATE SET
  email = excluded.email,
  password_hash = excluded.password_hash,
  password_salt = excluded.password_salt,
  role = 'client',
  is_active = 1,
  must_change_password = 0,
  token_version = token_version + 1,
  updated_at = DATETIME('now');

INSERT INTO user_profiles (user_id, display_name)
VALUES ('usr-wayne-client-1', 'Wayne O''Donohue')
ON CONFLICT(user_id) DO UPDATE SET display_name = excluded.display_name;

-- 4. Reinstate Wayne O'Donohue Alias (Client Tenant)
-- Password: Whffranklin26
INSERT INTO users (id, email, password_hash, password_salt, role, is_active, must_change_password, token_version)
VALUES (
  'usr-wayne-client-2',
  'wayneodonuhe@gmail.com',
  '8e079bd79ca0377ba7bf9624acc83d0028888fbc3048a1580a91409638ad5758',
  '15748ceff690cd9aab7a5083edcdf5ea',
  'client',
  1,
  0,
  1
)
ON CONFLICT(id) DO UPDATE SET
  email = excluded.email,
  password_hash = excluded.password_hash,
  password_salt = excluded.password_salt,
  role = 'client',
  is_active = 1,
  must_change_password = 0,
  token_version = token_version + 1,
  updated_at = DATETIME('now');

INSERT INTO user_profiles (user_id, display_name)
VALUES ('usr-wayne-client-2', 'Wayne O''Donohue (Alias)')
ON CONFLICT(user_id) DO UPDATE SET display_name = excluded.display_name;

-- 5. Reinstate System Administrator
-- Password: DeltaHarvest2026!
INSERT INTO users (id, email, password_hash, password_salt, role, is_active, must_change_password, token_version)
VALUES (
  'usr-admin-system',
  'admin@deltaharvest.local',
  '1f96617020d2e832237bacd8c6c5100d096ec5a72db214c3eb2cdff8612a30ac',
  '9f5840c71ac79ab54a52047f468f3d11',
  'admin',
  1,
  0,
  1
)
ON CONFLICT(id) DO UPDATE SET
  email = excluded.email,
  password_hash = excluded.password_hash,
  password_salt = excluded.password_salt,
  role = 'admin',
  is_active = 1,
  must_change_password = 0,
  token_version = token_version + 1,
  updated_at = DATETIME('now');

INSERT INTO user_profiles (user_id, display_name)
VALUES ('usr-admin-system', 'System Administrator')
ON CONFLICT(user_id) DO UPDATE SET display_name = excluded.display_name;
