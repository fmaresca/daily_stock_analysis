/**
 * Cloudflare Pages Functions: Auth & Cryptography Security Utilities
 * Implements native Web Crypto API PBKDF2 password hashing, HMAC-SHA256 JWT sessions,
 * secure HTTP-only cookies, and multi-tenant D1 database access with local fallback.
 */

export const SESSION_COOKIE_NAME = "deltaharvest_session";
export const DEFAULT_SESSION_EXPIRY_SECONDS = 7 * 24 * 60 * 60; // 7 days
export const DEFAULT_ADMIN_EMAIL = "admin@deltaharvest.local";

/**
 * Requires SESSION_SECRET to be configured in Cloudflare environment.
 * Throws immediately if missing, enforcing fail-closed security.
 * Rotating SESSION_SECRET invalidates all outstanding JWTs (signature verification fails),
 * which is the operational mechanism that revokes sessions minted under compromised secrets.
 */
export function requireSessionSecret(env) {
  const secret = env?.SESSION_SECRET;
  if (!secret || typeof secret !== "string" || !secret.trim()) {
    console.error("CRITICAL CONFIGURATION ERROR: SESSION_SECRET is not configured.");
    throw new Error("Server authentication is not configured.");
  }
  return secret.trim();
}

// ==========================================
// 1. Web Crypto API PBKDF2 Password Hashing
// ==========================================

export function generateRandomSalt(bytes = 16) {
  const array = new Uint8Array(bytes);
  crypto.getRandomValues(array);
  return Array.from(array)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function hashPassword(password, saltHex) {
  const encoder = new TextEncoder();
  const saltBytes = new Uint8Array(
    saltHex.match(/.{1,2}/g).map((byte) => parseInt(byte, 16))
  );

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: saltBytes,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    256
  );

  return Array.from(new Uint8Array(derivedBits))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function verifyPassword(password, saltHex, targetHashHex) {
  try {
    const computedHash = await hashPassword(password, saltHex);
    // Timing-safe comparison
    if (computedHash.length !== targetHashHex.length) return false;
    let mismatch = 0;
    for (let i = 0; i < computedHash.length; i++) {
      mismatch |= computedHash.charCodeAt(i) ^ targetHashHex.charCodeAt(i);
    }
    return mismatch === 0;
  } catch (err) {
    console.error("Password verification error:", err);
    return false;
  }
}

export function generateSecureRandomToken(bytes = 32) {
  const array = new Uint8Array(bytes);
  crypto.getRandomValues(array);
  return Array.from(array)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function hashTokenSha256(token) {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// ==========================================
// 2. Web Crypto API JWT (HMAC-SHA256) Sessions
// ==========================================

function base64UrlEncode(str) {
  return btoa(str)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function base64UrlDecode(str) {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) base64 += "=";
  return atob(base64);
}

export async function createSessionToken(payload, secret, expiresInSeconds = DEFAULT_SESSION_EXPIRY_SECONDS) {
  if (!secret || typeof secret !== "string" || !secret.trim()) {
    throw new Error("createSessionToken requires a valid secret string.");
  }
  const header = { alg: "HS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000); // wall-clock-ok: JWT epoch second calculation
  const jwtPayload = {
    ...payload,
    tv: payload.tv !== undefined ? Number(payload.tv) : 0,
    iat: now,
    exp: now + expiresInSeconds,
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(jwtPayload));
  const dataToSign = `${encodedHeader}.${encodedPayload}`;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(dataToSign));
  const encodedSignature = Array.from(new Uint8Array(signature))
    .map((b) => String.fromCharCode(b))
    .join("");
  const base64UrlSignature = base64UrlEncode(encodedSignature);

  return `${dataToSign}.${base64UrlSignature}`;
}

export async function verifySessionToken(token, secret) {
  if (!secret || typeof secret !== "string" || !secret.trim()) return null;
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  const dataToSign = `${encodedHeader}.${encodedPayload}`;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"]
  );

  try {
    const rawSignatureStr = base64UrlDecode(encodedSignature);
    const signatureBytes = new Uint8Array(rawSignatureStr.length);
    for (let i = 0; i < rawSignatureStr.length; i++) {
      signatureBytes[i] = rawSignatureStr.charCodeAt(i);
    }

    const isValid = await crypto.subtle.verify(
      "HMAC",
      key,
      signatureBytes,
      encoder.encode(dataToSign)
    );

    if (!isValid) return null;

    const payload = JSON.parse(base64UrlDecode(encodedPayload));
    const now = Math.floor(Date.now() / 1000); // wall-clock-ok: JWT exp validation
    if (payload.exp && payload.exp < now) return null;

    return payload;
  } catch (err) {
    console.error("JWT verification failure:", err);
    return null;
  }
}

// ==========================================
// 3. HTTP Cookie Utilities
// ==========================================

export function buildSessionCookie(token, maxAgeSeconds = DEFAULT_SESSION_EXPIRY_SECONDS) {
  return `${SESSION_COOKIE_NAME}=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${maxAgeSeconds}`;
}

export function buildClearSessionCookie() {
  return `${SESSION_COOKIE_NAME}=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`;
}

export function parseSessionCookie(request) {
  const cookieHeader = request.headers.get("Cookie") || "";
  const cookies = cookieHeader.split(";").map((c) => c.trim());
  for (const cookie of cookies) {
    if (cookie.startsWith(`${SESSION_COOKIE_NAME}=`)) {
      return cookie.substring(SESSION_COOKIE_NAME.length + 1);
    }
  }
  return null;
}

// ==========================================
// 4. In-Memory Store
// ==========================================

const localMemoryDb = {
  users: [],
  profiles: {},
  trades: [],
  watchlists: [],
  portfolios: {},
  settings: {},
};

export const localMemoryResetTokens = new Map();

let schemaEnsured = false;
let resetSchemaEnsured = false;

export function _resetSchemaEnsuredForTest() {
  schemaEnsured = false;
  resetSchemaEnsured = false;
}

// ==========================================
// 5. Database User Queries (D1 + Fallback)
// ==========================================

export async function ensureUsersTables(env) {
  if (schemaEnsured) return;
  if (env && env.DB) {
    try {
      await env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          password_salt TEXT NOT NULL,
          role TEXT NOT NULL DEFAULT 'client',
          is_active INTEGER NOT NULL DEFAULT 1,
          must_change_password INTEGER NOT NULL DEFAULT 0,
          token_version INTEGER NOT NULL DEFAULT 0,
          last_login_at TEXT,
          created_at TEXT NOT NULL DEFAULT (DATETIME('now')),
          updated_at TEXT NOT NULL DEFAULT (DATETIME('now'))
        )
      `).run();
      try {
        await env.DB.prepare("ALTER TABLE users ADD COLUMN token_version INTEGER DEFAULT 0").run();
      } catch (colErr) {
        // column may already exist
      }
      await env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS user_profiles (
          user_id TEXT PRIMARY KEY,
          display_name TEXT,
          account_notes TEXT,
          created_at TEXT NOT NULL DEFAULT (DATETIME('now')),
          updated_at TEXT NOT NULL DEFAULT (DATETIME('now')),
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `).run();
      await env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS password_reset_tokens (
          token_hash TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          expires_at TEXT NOT NULL,
          created_at TEXT NOT NULL DEFAULT (DATETIME('now'))
        )
      `).run();
      schemaEnsured = true;
      resetSchemaEnsured = true;
    } catch (e) {
      console.warn("D1 ensureUsersTables error:", e);
    }
  }
}

export async function ensurePasswordResetTable(env) {
  if (resetSchemaEnsured) return;
  if (env && env.DB) {
    try {
      await env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS password_reset_tokens (
          token_hash TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          expires_at TEXT NOT NULL,
          created_at TEXT NOT NULL DEFAULT (DATETIME('now'))
        )
      `).run();
      resetSchemaEnsured = true;
    } catch (e) {
      console.warn("D1 ensurePasswordResetTable error:", e);
    }
  }
}

export async function storePasswordResetToken(env, tokenHash, userId, expiresInMinutes = 30) {
  const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000).toISOString(); // wall-clock-ok: reset token expiration
  const createdAt = new Date().toISOString(); // wall-clock-ok: reset token created timestamp

  // Bounded in-memory reset-token cache: sweep expired entries to prevent memory growth
  const nowIso = new Date().toISOString(); // wall-clock-ok: in-memory cache sweep timestamp
  for (const [key, val] of localMemoryResetTokens.entries()) {
    if (val && val.expiresAt && val.expiresAt < nowIso) {
      localMemoryResetTokens.delete(key);
    }
  }

  // Edge memory cache for multi-environment resilience
  localMemoryResetTokens.set(tokenHash, { userId, expiresAt, createdAt });

  if (env && env.DB) {
    try {
      await ensurePasswordResetTable(env);
      await env.DB.prepare(`
        INSERT INTO password_reset_tokens (token_hash, user_id, expires_at, created_at)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(token_hash) DO UPDATE SET
          user_id = excluded.user_id,
          expires_at = excluded.expires_at,
          created_at = excluded.created_at
      `).bind(tokenHash, userId, expiresAt, createdAt).run();
      return true;
    } catch (e) {
      console.warn("D1 storePasswordResetToken error:", e);
    }
  }

  return true;
}

export async function consumePasswordResetToken(env, tokenHash) {
  const now = new Date().toISOString(); // wall-clock-ok: token consumption verification timestamp

  if (env && env.DB) {
    try {
      await ensurePasswordResetTable(env);
      const row = await env.DB.prepare(
        "SELECT user_id, expires_at FROM password_reset_tokens WHERE token_hash = ?"
      ).bind(tokenHash).first();

      if (row) {
        // Delete immediately to guarantee single-use
        await env.DB.prepare("DELETE FROM password_reset_tokens WHERE token_hash = ?").bind(tokenHash).run();
        localMemoryResetTokens.delete(tokenHash);

        if (row.expires_at < now) {
          return null; // Expired
        }
        return row.user_id;
      }
    } catch (e) {
      console.warn("D1 consumePasswordResetToken error:", e);
    }
  }

  // Memory fallback
  const mem = localMemoryResetTokens.get(tokenHash);
  if (mem) {
    localMemoryResetTokens.delete(tokenHash);
    if (mem.expiresAt < now) return null;
    return mem.userId;
  }

  return null;
}

export async function getUserByEmail(env, email) {
  const cleanEmail = email.trim().toLowerCase();
  let user = null;

  if (env && env.DB) {
    try {
      await ensureUsersTables(env);
      const stmt = env.DB.prepare("SELECT * FROM users WHERE LOWER(email) = LOWER(?)").bind(cleanEmail);
      user = await stmt.first();
    } catch (err) {
      console.warn("D1 query error in getUserByEmail:", err);
    }
  }

  // Memory fallback ONLY for local development
  if (!user && env?.ENVIRONMENT === "development") {
    const found = localMemoryDb.users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (found) {
      user = { ...found };
    }
  }



  if (user) {
    user.token_version = Number(user.token_version || 0);
  }

  return user;
}

export async function getUserById(env, id) {
  let user = null;

  if (env && env.DB) {
    try {
      await ensureUsersTables(env);
      const stmt = env.DB.prepare("SELECT * FROM users WHERE id = ?").bind(id);
      user = await stmt.first();
    } catch (err) {
      console.warn("D1 query error in getUserById:", err);
    }
  }

  // Memory fallback ONLY for local development
  if (!user && env?.ENVIRONMENT === "development") {
    const found = localMemoryDb.users.find((u) => u.id === id);
    if (found) {
      user = { ...found };
    }
  }



  if (user) {
    user.token_version = Number(user.token_version || 0);
  }

  return user;
}

export async function getAllUsers(env) {
  if (env && env.DB) {
    try {
      await ensureUsersTables(env);
      const stmt = env.DB.prepare(`
        SELECT u.id, u.email, u.role, u.is_active, u.must_change_password, u.last_login_at, u.created_at, u.updated_at,
               p.display_name, p.account_notes,
               (SELECT COUNT(*) FROM user_trades WHERE user_id = u.id) AS trade_count
        FROM users u
        LEFT JOIN user_profiles p ON u.id = p.user_id
        ORDER BY u.created_at DESC
      `);
      const { results } = await stmt.all();
      const existingEmails = new Set((results || []).map((u) => u.email.toLowerCase()));
      const userList = (results || []).map((u) => ({
        id: u.id,
        email: u.email,
        role: (u.role || "client").toUpperCase(),
        is_active: u.is_active,
        status: (u.is_active === 1 || u.is_active === true) ? "ACTIVE" : "SUSPENDED",
        must_change_password: u.must_change_password,
        last_login_at: u.last_login_at,
        lastLoginAt: u.last_login_at,
        created_at: u.created_at,
        createdAt: u.created_at,
        updated_at: u.updated_at,
        display_name: u.display_name || "",
        displayName: u.display_name || u.email.split("@")[0],
        account_notes: u.account_notes || "",
        trade_count: u.trade_count || 0,
        tradeCount: u.trade_count || 0,
      }));

      return userList;
    } catch (err) {
      console.warn("D1 query error in getAllUsers:", err);
      if (env?.ENVIRONMENT !== "development") {
        throw err;
      }
    }
  }

  if (env?.ENVIRONMENT === "development") {
    return localMemoryDb.users.map((u) => ({
      id: u.id,
      email: u.email,
      role: (u.role || "client").toUpperCase(),
      is_active: u.is_active,
      status: (u.is_active === 1 || u.is_active === true) ? "ACTIVE" : "SUSPENDED",
      must_change_password: u.must_change_password,
      last_login_at: u.last_login_at,
      lastLoginAt: u.last_login_at,
      created_at: u.created_at,
      createdAt: u.created_at,
      updated_at: u.updated_at,
      display_name: localMemoryDb.profiles[u.id]?.display_name || (u.email === DEFAULT_ADMIN_EMAIL ? "Administrator" : u.email.split("@")[0]),
      displayName: localMemoryDb.profiles[u.id]?.display_name || (u.email === DEFAULT_ADMIN_EMAIL ? "Administrator" : u.email.split("@")[0]),
      account_notes: localMemoryDb.profiles[u.id]?.account_notes || "Development Account",
      trade_count: localMemoryDb.trades.filter((t) => t.user_id === u.id).length,
      tradeCount: localMemoryDb.trades.filter((t) => t.user_id === u.id).length,
    }));
  }

  return [];
}

export async function createUser(env, { id, email, password_hash, password_salt, role, is_active, must_change_password, display_name, token_version }) {
  const cleanEmail = email.trim().toLowerCase();
  const userId = id || `user-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`; // wall-clock-ok: unique user ID
  const now = new Date().toISOString(); // wall-clock-ok: user created timestamp
  const tv = token_version ?? 0;

  if (env && env.DB) {
    try {
      await ensureUsersTables(env);
      await env.DB.batch([
        env.DB.prepare(`
          INSERT INTO users (id, email, password_hash, password_salt, role, is_active, must_change_password, token_version, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(userId, cleanEmail, password_hash, password_salt, role || "client", is_active ?? 1, must_change_password ?? 0, tv, now, now),
        env.DB.prepare(`
          INSERT INTO user_profiles (user_id, display_name, created_at, updated_at)
          VALUES (?, ?, ?, ?)
        `).bind(userId, display_name || cleanEmail.split("@")[0], now, now),
      ]);
      return { id: userId, email: cleanEmail, role: role || "client" };
    } catch (err) {
      console.warn("D1 insert error in createUser:", err);
      if (env?.ENVIRONMENT !== "development") {
        throw err;
      }
    }
  }

  if (env?.ENVIRONMENT === "development") {
    const newUser = {
      id: userId,
      email: cleanEmail,
      password_hash,
      password_salt,
      role: role || "client",
      is_active: is_active ?? 1,
      must_change_password: must_change_password ?? 0,
      token_version: tv,
      created_at: now,
      updated_at: now,
    };
    localMemoryDb.users.push(newUser);
    localMemoryDb.profiles[userId] = { display_name: display_name || cleanEmail.split("@")[0] };
    return newUser;
  }

  throw new Error("User database is not configured.");
}

export async function updateUserPassword(env, userId, newHash, newSalt) {
  const now = new Date().toISOString(); // wall-clock-ok: password updated timestamp
  if (env && env.DB) {
    try {
      await ensureUsersTables(env);
      await env.DB.prepare(`
        UPDATE users
        SET password_hash = ?, password_salt = ?, must_change_password = 0, token_version = token_version + 1, updated_at = ?
        WHERE id = ? OR LOWER(email) = LOWER(?)
      `).bind(newHash, newSalt, now, userId, userId).run();
    } catch (err) {
      console.warn("D1 password update error:", err);
    }
  }

  // Sync into localMemoryDb for local development
  for (const u of localMemoryDb.users) {
    if (u.id === userId || u.email.toLowerCase() === String(userId).trim().toLowerCase()) {
      u.password_hash = newHash;
      u.password_salt = newSalt;
      u.must_change_password = 0;
      u.token_version = (u.token_version || 0) + 1;
      u.updated_at = now;
    }
  }
  return true;
}

export async function resetUserPasswordAdmin(env, userId, newHash, newSalt, forceReset = true) {
  const now = new Date().toISOString(); // wall-clock-ok: admin reset timestamp
  if (env && env.DB) {
    try {
      await ensureUsersTables(env);
      await env.DB.prepare(`
        UPDATE users
        SET password_hash = ?, password_salt = ?, must_change_password = ?, token_version = token_version + 1, updated_at = ?
        WHERE id = ? OR LOWER(email) = LOWER(?)
      `).bind(newHash, newSalt, forceReset ? 1 : 0, now, userId, userId).run();
    } catch (err) {
      console.warn("D1 reset password error:", err);
    }
  }

  // Sync into localMemoryDb for local development
  for (const u of localMemoryDb.users) {
    if (u.id === userId || u.email.toLowerCase() === String(userId).trim().toLowerCase()) {
      u.password_hash = newHash;
      u.password_salt = newSalt;
      u.must_change_password = forceReset ? 1 : 0;
      u.token_version = (u.token_version || 0) + 1;
      u.updated_at = now;
    }
  }
  return true;
}

export async function resetUserPasswordByEmail(env, email, newHash, newSalt, forceReset = false) {
  const cleanEmail = email.trim().toLowerCase();
  const now = new Date().toISOString(); // wall-clock-ok: email reset timestamp

  if (env && env.DB) {
    try {
      await ensureUsersTables(env);
      await env.DB.prepare(`
        UPDATE users
        SET password_hash = ?, password_salt = ?, must_change_password = ?, token_version = token_version + 1, updated_at = ?
        WHERE LOWER(email) = LOWER(?)
      `).bind(newHash, newSalt, forceReset ? 1 : 0, now, cleanEmail).run();
    } catch (err) {
      console.warn("D1 resetUserPasswordByEmail error:", err);
    }
  }

  // Sync into localMemoryDb for local development
  for (const u of localMemoryDb.users) {
    if (u.email.toLowerCase() === cleanEmail) {
      u.password_hash = newHash;
      u.password_salt = newSalt;
      u.must_change_password = forceReset ? 1 : 0;
      u.token_version = (u.token_version || 0) + 1;
      u.updated_at = now;
    }
  }
  return true;
}

export async function toggleUserStatus(env, userId, isActive) {
  const now = new Date().toISOString(); // wall-clock-ok: status toggle timestamp
  if (env && env.DB) {
    try {
      await ensureUsersTables(env);
      await env.DB.prepare(`
        UPDATE users
        SET is_active = ?, updated_at = ?
        WHERE id = ?
      `).bind(isActive ? 1 : 0, now, userId).run();
      return true;
    } catch (err) {
      console.warn("D1 toggle status error:", err);
    }
  }

  let u = localMemoryDb.users.find((user) => user.id === userId);
  if (!u) {
    u = { id: userId, email: userId, is_active: isActive ? 1 : 0, role: "client", updated_at: now };
    localMemoryDb.users.push(u);
  } else {
    u.is_active = isActive ? 1 : 0;
    u.updated_at = now;
  }
  return true;
}

export async function updateLastLogin(env, userId) {
  const now = new Date().toISOString(); // wall-clock-ok: last login timestamp
  if (env && env.DB) {
    try {
      await env.DB.prepare(`UPDATE users SET last_login_at = ? WHERE id = ?`).bind(now, userId).run();
      return;
    } catch (err) {
      console.warn("D1 updateLastLogin error:", err);
    }
  }

  const u = localMemoryDb.users.find((user) => user.id === userId);
  if (u) u.last_login_at = now;
}

// ==========================================
// 6. Request Authentication Middleware Helper
// ==========================================

export async function authenticateRequest(context, allowedRoles = null) {
  const { request, env } = context;
  const token = parseSessionCookie(request);

  if (!token) {
    return {
      authenticated: false,
      response: new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      ),
    };
  }

  let secret;
  try {
    secret = requireSessionSecret(env);
  } catch (err) {
    return {
      authenticated: false,
      response: new Response(
        JSON.stringify({ error: "Server authentication is not configured." }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      ),
    };
  }

  const payload = await verifySessionToken(token, secret);

  if (!payload || !payload.sub) {
    return {
      authenticated: false,
      response: new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          status: 401,
          headers: {
            "Content-Type": "application/json",
            "Set-Cookie": buildClearSessionCookie(),
          },
        }
      ),
    };
  }

  // Fail closed if user database is not configured (unless in local development)
  if (!env || !env.DB) {
    if (env?.ENVIRONMENT !== "development") {
      return {
        authenticated: false,
        response: new Response(
          JSON.stringify({ error: "User database is not configured." }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        ),
      };
    }
  }

  // Look up user in D1 to ensure account wasn't suspended or deleted
  const user = await getUserById(env, payload.sub);
  if (!user || (user.is_active !== 1 && user.is_active !== true)) {
    return {
      authenticated: false,
      response: new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          status: 401,
          headers: {
            "Content-Type": "application/json",
            "Set-Cookie": buildClearSessionCookie(),
          },
        }
      ),
    };
  }

  // Token revocation check: if token version does not match dbUser token version
  const userTv = Number(user.token_version || 0);
  const tokenTv = Number(payload.tv || 0);
  if (userTv !== tokenTv) {
    return {
      authenticated: false,
      response: new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          status: 401,
          headers: {
            "Content-Type": "application/json",
            "Set-Cookie": buildClearSessionCookie(),
          },
        }
      ),
    };
  }

  // Check role authorization
  if (allowedRoles) {
    const rolesList = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    const userRole = String(user.role || "").toLowerCase();
    const normalizedAllowed = rolesList.map((r) => String(r).toLowerCase());
    if (!normalizedAllowed.includes(userRole)) {
      return {
        authenticated: false,
        response: new Response(
          JSON.stringify({ error: "Forbidden" }),
          { status: 403, headers: { "Content-Type": "application/json" } }
        ),
      };
    }
  }

  return {
    authenticated: true,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      token_version: userTv,
      must_change_password: user.must_change_password === 1,
      display_name: payload.name || user.email.split("@")[0],
    },
  };
}

// ==========================================
// 7. System Settings & Admin Notification Email
// ==========================================

export async function getAdminNotificationEmail(env) {
  // 1. Check D1 system_settings table if available
  if (env && env.DB) {
    try {
      await env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS system_settings (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL,
          updated_at TEXT NOT NULL DEFAULT (DATETIME('now'))
        )
      `).run();
      const row = await env.DB.prepare(
        "SELECT value FROM system_settings WHERE key = 'admin_notification_email'"
      ).first();
      if (row && row.value && row.value.includes("@")) {
        return row.value.trim().toLowerCase();
      }
    } catch (e) {
      console.warn("D1 getAdminNotificationEmail query failed:", e);
    }
  }

  // 2. Check local memory db
  if (localMemoryDb.settings && localMemoryDb.settings.admin_notification_email) {
    return localMemoryDb.settings.admin_notification_email;
  }

  // 3. Fall back to environment variable
  const envEmail = (env?.ADMIN_NOTIFICATION_EMAIL || "").trim().toLowerCase();
  if (envEmail && envEmail.includes("@")) {
    return envEmail;
  }

  // 4. Fall back to general ADMIN_EMAIL if it is a real address (not .local)
  const generalAdminEmail = (env?.ADMIN_EMAIL || "").trim().toLowerCase();
  if (generalAdminEmail && generalAdminEmail.includes("@") && !generalAdminEmail.endsWith(".local") && !generalAdminEmail.endsWith("@example.com")) {
    return generalAdminEmail;
  }

  // 5. Unconfigured fallback: log server-side warning and return empty string
  console.warn("ADMIN_NOTIFICATION_EMAIL is not configured — admin notifications will be queued in D1 only");
  return "";
}

export async function setAdminNotificationEmail(env, email) {
  const cleanEmail = email.trim().toLowerCase();
  if (env && env.DB) {
    try {
      await env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS system_settings (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL,
          updated_at TEXT NOT NULL DEFAULT (DATETIME('now'))
        )
      `).run();
      await env.DB.prepare(`
        INSERT INTO system_settings (key, value, updated_at)
        VALUES ('admin_notification_email', ?, DATETIME('now'))
        ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = DATETIME('now')
      `).bind(cleanEmail).run();
    } catch (e) {
      console.warn("D1 setAdminNotificationEmail error:", e);
    }
  }

  if (!localMemoryDb.settings) localMemoryDb.settings = {};
  localMemoryDb.settings.admin_notification_email = cleanEmail;
  return cleanEmail;
}

