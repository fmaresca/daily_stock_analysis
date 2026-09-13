/**
 * Cloudflare Pages Functions: Auth & Cryptography Security Utilities
 * Implements native Web Crypto API PBKDF2 password hashing, HMAC-SHA256 JWT sessions,
 * secure HTTP-only cookies, and multi-tenant D1 database access with local fallback.
 */

export const SESSION_COOKIE_NAME = "deltaharvest_session";
export const DEFAULT_SESSION_EXPIRY_SECONDS = 7 * 24 * 60 * 60; // 7 days
export const DEFAULT_SECRET = "deltaharvest-edge-auth-secret-key-prod-2026";
export const PRIMARY_ADMIN_EMAIL = "fjmaresca@gmail.com";

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

export async function createSessionToken(payload, secret = DEFAULT_SECRET, expiresInSeconds = DEFAULT_SESSION_EXPIRY_SECONDS) {
  const header = { alg: "HS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const jwtPayload = {
    ...payload,
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

export async function verifySessionToken(token, secret = DEFAULT_SECRET) {
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
    const now = Math.floor(Date.now() / 1000);
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
// 4. Memory / Fallback Store for Local Dev
// ==========================================

const localMemoryDb = {
  users: [
    {
      id: "admin-root-0000-0000-000000000001",
      email: PRIMARY_ADMIN_EMAIL,
      password_hash: "73c1d9a04a6c8e31fd8a2879d4a8ecbf78efd05634d5885e3a388b0a969df6f1", // "ChangeMeNow!2026"
      password_salt: "7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c",
      role: "admin",
      is_active: 1,
      must_change_password: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ],
  profiles: {
    "admin-root-0000-0000-000000000001": {
      display_name: "Frank Maresca (Principal Admin)",
      account_notes: "Primary Administrator and System Architect",
    },
  },
  trades: [],
  watchlists: [],
  portfolios: {},
};

// ==========================================
// 5. Database User Queries (D1 + Fallback)
// ==========================================

export async function getUserByEmail(env, email) {
  const cleanEmail = email.trim().toLowerCase();
  if (env && env.DB) {
    try {
      const stmt = env.DB.prepare("SELECT * FROM users WHERE LOWER(email) = LOWER(?)").bind(cleanEmail);
      const user = await stmt.first();
      return user || null;
    } catch (err) {
      console.warn("D1 query error in getUserByEmail, falling back to local store:", err);
    }
  }

  const found = localMemoryDb.users.find((u) => u.email.toLowerCase() === cleanEmail);
  return found ? { ...found } : null;
}

export async function getUserById(env, id) {
  if (env && env.DB) {
    try {
      const stmt = env.DB.prepare("SELECT * FROM users WHERE id = ?").bind(id);
      const user = await stmt.first();
      return user || null;
    } catch (err) {
      console.warn("D1 query error in getUserById, falling back to local store:", err);
    }
  }

  const found = localMemoryDb.users.find((u) => u.id === id);
  return found ? { ...found } : null;
}

export async function getAllUsers(env) {
  if (env && env.DB) {
    try {
      const stmt = env.DB.prepare(`
        SELECT u.id, u.email, u.role, u.is_active, u.must_change_password, u.last_login_at, u.created_at, u.updated_at,
               p.display_name, p.account_notes,
               (SELECT COUNT(*) FROM user_trades WHERE user_id = u.id) AS trade_count
        FROM users u
        LEFT JOIN user_profiles p ON u.id = p.user_id
        ORDER BY u.created_at DESC
      `);
      const { results } = await stmt.all();
      return results || [];
    } catch (err) {
      console.warn("D1 query error in getAllUsers, falling back to local store:", err);
    }
  }

  return localMemoryDb.users.map((u) => ({
    id: u.id,
    email: u.email,
    role: u.role,
    is_active: u.is_active,
    must_change_password: u.must_change_password,
    last_login_at: u.last_login_at,
    created_at: u.created_at,
    updated_at: u.updated_at,
    display_name: localMemoryDb.profiles[u.id]?.display_name || "",
    account_notes: localMemoryDb.profiles[u.id]?.account_notes || "",
    trade_count: localMemoryDb.trades.filter((t) => t.user_id === u.id).length,
  }));
}

export async function createUser(env, { id, email, password_hash, password_salt, role, is_active, must_change_password, display_name }) {
  const cleanEmail = email.trim().toLowerCase();
  const userId = id || `user-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  const now = new Date().toISOString();

  if (env && env.DB) {
    try {
      const batch = await env.DB.batch([
        env.DB.prepare(`
          INSERT INTO users (id, email, password_hash, password_salt, role, is_active, must_change_password, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(userId, cleanEmail, password_hash, password_salt, role || "client", is_active ?? 1, must_change_password ?? 0, now, now),
        env.DB.prepare(`
          INSERT INTO user_profiles (user_id, display_name, created_at, updated_at)
          VALUES (?, ?, ?, ?)
        `).bind(userId, display_name || cleanEmail.split("@")[0], now, now),
      ]);
      return { id: userId, email: cleanEmail, role: role || "client" };
    } catch (err) {
      console.warn("D1 insert error, writing to memory fallback:", err);
    }
  }

  const newUser = {
    id: userId,
    email: cleanEmail,
    password_hash,
    password_salt,
    role: role || "client",
    is_active: is_active ?? 1,
    must_change_password: must_change_password ?? 0,
    created_at: now,
    updated_at: now,
  };
  localMemoryDb.users.push(newUser);
  localMemoryDb.profiles[userId] = { display_name: display_name || cleanEmail.split("@")[0] };
  return newUser;
}

export async function updateUserPassword(env, userId, newHash, newSalt) {
  const now = new Date().toISOString();
  if (env && env.DB) {
    try {
      await env.DB.prepare(`
        UPDATE users
        SET password_hash = ?, password_salt = ?, must_change_password = 0, updated_at = ?
        WHERE id = ?
      `).bind(newHash, newSalt, now, userId).run();
      return true;
    } catch (err) {
      console.warn("D1 password update error:", err);
    }
  }

  const u = localMemoryDb.users.find((user) => user.id === userId);
  if (u) {
    u.password_hash = newHash;
    u.password_salt = newSalt;
    u.must_change_password = 0;
    u.updated_at = now;
    return true;
  }
  return false;
}

export async function resetUserPasswordAdmin(env, userId, newHash, newSalt, forceReset = true) {
  const now = new Date().toISOString();
  if (env && env.DB) {
    try {
      await env.DB.prepare(`
        UPDATE users
        SET password_hash = ?, password_salt = ?, must_change_password = ?, updated_at = ?
        WHERE id = ?
      `).bind(newHash, newSalt, forceReset ? 1 : 0, now, userId).run();
      return true;
    } catch (err) {
      console.warn("D1 reset password error:", err);
    }
  }

  const u = localMemoryDb.users.find((user) => user.id === userId);
  if (u) {
    u.password_hash = newHash;
    u.password_salt = newSalt;
    u.must_change_password = forceReset ? 1 : 0;
    u.updated_at = now;
    return true;
  }
  return false;
}

export async function toggleUserStatus(env, userId, isActive) {
  const now = new Date().toISOString();
  if (env && env.DB) {
    try {
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

  const u = localMemoryDb.users.find((user) => user.id === userId);
  if (u) {
    u.is_active = isActive ? 1 : 0;
    u.updated_at = now;
    return true;
  }
  return false;
}

export async function updateLastLogin(env, userId) {
  const now = new Date().toISOString();
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
        JSON.stringify({ error: "Unauthorized: Missing session token. Please log in." }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      ),
    };
  }

  const secret = env.SESSION_SECRET || DEFAULT_SECRET;
  const payload = await verifySessionToken(token, secret);

  if (!payload || !payload.sub) {
    return {
      authenticated: false,
      response: new Response(
        JSON.stringify({ error: "Unauthorized: Invalid or expired session token." }),
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

  // Look up user in D1 to ensure account wasn't suspended or deleted
  const user = await getUserById(env, payload.sub);
  if (!user || user.is_active !== 1) {
    return {
      authenticated: false,
      response: new Response(
        JSON.stringify({ error: "Unauthorized: Account is inactive or suspended. Please contact administrator (fjmaresca@gmail.com)." }),
        {
          status: 403,
          headers: {
            "Content-Type": "application/json",
            "Set-Cookie": buildClearSessionCookie(),
          },
        }
      ),
    };
  }

  // Check role authorization
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return {
      authenticated: false,
      response: new Response(
        JSON.stringify({ error: "Forbidden: You lack necessary administrative privileges." }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      ),
    };
  }

  return {
    authenticated: true,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      must_change_password: user.must_change_password === 1,
      display_name: payload.name || user.email.split("@")[0],
    },
  };
}
