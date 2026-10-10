/**
 * DeltaHarvest Middleware Adversarial Verification Suite
 * Executes matrix adversarial attacks and trust boundary probes against
 * functions/_middleware.js and associated auth utilities.
 */

import { onRequest } from "../functions/_middleware.js";
import {
  createSessionToken,
  buildSessionCookie,
} from "../functions/api/_auth_utils.js";

const TEST_SECRET = "test_super_secret_key_at_least_32_characters_long_123456";

// Mock D1 Database
function createMockDb(users = {}) {
  return {
    prepare(query) {
      const execute = {
        async first() {
          if (query.includes("FROM users WHERE id = ?")) {
            return null;
          }
          if (query.includes("FROM system_settings")) {
            return null;
          }
          return null;
        },
        async all() {
          return { results: Object.values(users) };
        },
        async run() {
          return { success: true };
        },
        bind(...args) {
          return {
            async first() {
              if (query.includes("FROM users WHERE id = ?")) {
                const id = args[0];
                return users[id] || null;
              }
              if (query.includes("FROM system_settings")) {
                return null;
              }
              return null;
            },
            async all() {
              return { results: Object.values(users) };
            },
            async run() {
              return { success: true };
            },
          };
        },
      };
      return execute;
    },
  };
}

// Test runner assertion helper
let totalPassed = 0;
let totalFailed = 0;
const results = [];

function assert(description, condition, details = "") {
  if (condition) {
    totalPassed++;
    results.push({ name: description, passed: true, details });
    console.log(`  ✓ PASS: ${description}`);
  } else {
    totalFailed++;
    results.push({ name: description, passed: false, details });
    console.error(`  ✗ FAIL: ${description} ${details ? `(${details})` : ""}`);
  }
}

async function runAdversarialBattery() {
  console.log("\n========================================================");
  console.log(" DELTAHARVEST MIDDLEWARE ADVERSARIAL VERIFICATION SUITE");
  console.log("========================================================\n");

  const mockUsers = {
    admin_1: {
      id: "admin_1",
      email: "admin@deltaharvest.com",
      role: "admin",
      is_active: 1,
      token_version: 1,
    },
    client_1: {
      id: "client_1",
      email: "client@deltaharvest.com",
      role: "client",
      is_active: 1,
      token_version: 1,
    },
    inactive_user: {
      id: "inactive_user",
      email: "banned@deltaharvest.com",
      role: "client",
      is_active: 0,
      token_version: 1,
    },
  };

  const defaultEnv = {
    SESSION_SECRET: TEST_SECRET,
    DB: createMockDb(mockUsers),
    ENVIRONMENT: "test",
  };

  // Helper to invoke middleware
  async function invokeMiddleware(urlPath, options = {}) {
    const {
      method = "GET",
      headers = {},
      cookies = null,
      env = defaultEnv,
    } = options;

    const reqHeaders = new Headers(headers);
    if (cookies) {
      reqHeaders.set("Cookie", cookies);
    }

    const request = new Request(`https://daily-stock-analysis-89j.pages.dev${urlPath}`, {
      method,
      headers: reqHeaders,
    });

    let nextCalled = false;
    let nextResponse = null;

    const context = {
      request,
      env,
      next: async () => {
        nextCalled = true;
        nextResponse = new Response(JSON.stringify({ status: "FALL_THROUGH_PASSED" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
        return nextResponse;
      },
    };

    const response = await onRequest(context);
    return { response, nextCalled };
  }

  // -------------------------------------------------------------------------
  // Group 1: Static Asset Bypass
  // -------------------------------------------------------------------------
  console.log("--- Group 1: Static Asset & Extension Bypass ---");
  {
    const res1 = await invokeMiddleware("/assets/index-D8x29a.js");
    assert("Allows /assets/* bundle", res1.nextCalled);

    const res2 = await invokeMiddleware("/data/options_data.json");
    assert("Allows /data/* static data", res2.nextCalled);

    const res3 = await invokeMiddleware("/favicon.ico");
    assert("Allows /favicon.ico", res3.nextCalled);

    const res4 = await invokeMiddleware("/brand.svg");
    assert("Allows .svg static assets", res4.nextCalled);
  }

  // -------------------------------------------------------------------------
  // Group 2: Public API Allowlist
  // -------------------------------------------------------------------------
  console.log("\n--- Group 2: Public API Allowlist ---");
  {
    const allowlistPaths = [
      "/version",
      "/version.json",
      "/api/version",
      "/api/auth/login",
      "/api/auth/logout",
      "/api/auth/session",
      "/api/auth/change-password",
      "/api/auth/request-access",
      "/api/auth/reset-password",
      "/api/auth/reset-password/confirm",
      "/api/admin/inquiries",
      "/api/v1/options/tradier/status",
      "/api/v1/options/screeners/barchart/analyze-watchlist",
      "/api/economic-calendar",
      "/api/analyze-options",
      "/api/market-price",
      "/api/news/AAPL",
    ];

    for (const p of allowlistPaths) {
      const res = await invokeMiddleware(p);
      assert(`Allowlists public path: ${p}`, res.nextCalled);
    }
  }

  // -------------------------------------------------------------------------
  // Group 3: Server Secret Missing (Fail-Closed Gate)
  // -------------------------------------------------------------------------
  console.log("\n--- Group 3: Server Secret Missing (Fail-Closed Defense) ---");
  {
    const noSecretEnv = { ...defaultEnv, SESSION_SECRET: undefined };

    const resAdmin = await invokeMiddleware("/api/admin/diagnostics", { env: noSecretEnv });
    assert(
      "Protected /api/admin/* fails closed (500) when SESSION_SECRET unset",
      resAdmin.response.status === 500 && !resAdmin.nextCalled
    );

    const resUser = await invokeMiddleware("/api/user/data", { env: noSecretEnv });
    assert(
      "Protected /api/user/* fails closed (500) when SESSION_SECRET unset",
      resUser.response.status === 500 && !resUser.nextCalled
    );
  }

  // -------------------------------------------------------------------------
  // Group 4: Unauthenticated Admin & User API Protection
  // -------------------------------------------------------------------------
  console.log("\n--- Group 4: Unauthenticated API Access Protection ---");
  {
    const resAdminDiag = await invokeMiddleware("/api/admin/diagnostics");
    assert(
      "Unauthenticated /api/admin/diagnostics returns 401 Unauthorized",
      resAdminDiag.response.status === 401 && !resAdminDiag.nextCalled
    );

    const resAdminUsers = await invokeMiddleware("/api/admin/users");
    assert(
      "Unauthenticated /api/admin/users returns 401 Unauthorized",
      resAdminUsers.response.status === 401 && !resAdminUsers.nextCalled
    );

    const resUserData = await invokeMiddleware("/api/user/data");
    assert(
      "Unauthenticated /api/user/data returns 401 Unauthorized",
      resUserData.response.status === 401 && !resUserData.nextCalled
    );
  }

  // -------------------------------------------------------------------------
  // Group 5: Token Tampering, Expiry, and Revocation Attacks
  // -------------------------------------------------------------------------
  console.log("\n--- Group 5: Token Tampering & Invalidation Attacks ---");
  {
    // Mint valid tokens for tests
    const validAdminToken = await createSessionToken({ sub: mockUsers.admin_1.id, ...mockUsers.admin_1, tv: mockUsers.admin_1.token_version }, TEST_SECRET);
    const validClientToken = await createSessionToken({ sub: mockUsers.client_1.id, ...mockUsers.client_1, tv: mockUsers.client_1.token_version }, TEST_SECRET);

    // 1. Tampered signature (change last character)
    const tamperedToken = validAdminToken.slice(0, -1) + (validAdminToken.slice(-1) === "a" ? "b" : "a");
    const tamperedRes = await invokeMiddleware("/api/admin/diagnostics", {
      cookies: `deltaharvest_session=${tamperedToken}`,
    });
    const setCookie = tamperedRes.response.headers.get("Set-Cookie") || "";
    assert(
      "Tampered JWT signature rejected with 401",
      tamperedRes.response.status === 401 && !tamperedRes.nextCalled
    );
    assert(
      "Tampered JWT causes clearing Set-Cookie header to fire",
      setCookie.includes("Max-Age=0")
    );

    // 2. Token Version mismatch (token has tv=0, user in DB has tv=1)
    const staleTvToken = await createSessionToken({ sub: mockUsers.admin_1.id, ...mockUsers.admin_1, tv: 0 }, TEST_SECRET);
    const staleTvRes = await invokeMiddleware("/api/admin/diagnostics", {
      cookies: `deltaharvest_session=${staleTvToken}`,
    });
    assert(
      "Stale token_version rejected with 401 (Session Revocation holds)",
      staleTvRes.response.status === 401 && !staleTvRes.nextCalled
    );

    // 3. Inactive/banned user
    const inactiveToken = await createSessionToken({ sub: mockUsers.inactive_user.id, ...mockUsers.inactive_user, tv: mockUsers.inactive_user.token_version }, TEST_SECRET);
    const inactiveRes = await invokeMiddleware("/api/user/data", {
      cookies: `deltaharvest_session=${inactiveToken}`,
    });
    assert(
      "Inactive / disabled account rejected with 401",
      inactiveRes.response.status === 401 && !inactiveRes.nextCalled
    );
  }

  // -------------------------------------------------------------------------
  // Group 6: Role-Based Access Control (RBAC)
  // -------------------------------------------------------------------------
  console.log("\n--- Group 6: Role-Based Access Control (RBAC) ---");
  {
    const validClientToken = await createSessionToken({ sub: mockUsers.client_1.id, ...mockUsers.client_1, tv: mockUsers.client_1.token_version }, TEST_SECRET);
    const validAdminToken = await createSessionToken({ sub: mockUsers.admin_1.id, ...mockUsers.admin_1, tv: mockUsers.admin_1.token_version }, TEST_SECRET);

    // Non-admin attempting to access /api/admin/users
    const forbiddenRes = await invokeMiddleware("/api/admin/users", {
      cookies: `deltaharvest_session=${validClientToken}`,
    });
    assert(
      "Authenticated Client accessing /api/admin/users receives 403 Forbidden",
      forbiddenRes.response.status === 403 && !forbiddenRes.nextCalled
    );

    // Admin accessing /api/admin/users
    const adminPassRes = await invokeMiddleware("/api/admin/users", {
      cookies: `deltaharvest_session=${validAdminToken}`,
    });
    assert(
      "Authenticated Admin accessing /api/admin/users passes to handler",
      adminPassRes.nextCalled
    );
  }

  // -------------------------------------------------------------------------
  // Group 7: Edge SPA Route Guards & Redirects
  // -------------------------------------------------------------------------
  console.log("\n--- Group 7: Edge SPA Route Guards & Redirects ---");
  {
    const validClientToken = await createSessionToken({ sub: mockUsers.client_1.id, ...mockUsers.client_1, tv: mockUsers.client_1.token_version }, TEST_SECRET);
    const validAdminToken = await createSessionToken({ sub: mockUsers.admin_1.id, ...mockUsers.admin_1, tv: mockUsers.admin_1.token_version }, TEST_SECRET);

    const guardedSpaPaths = [
      "/admin",
      "/admin/users",
      "/equities",
      "/options",
      "/watchlist-builder",
      "/dashboard",
      "/portfolio",
      "/workflow",
    ];

    for (const spaPath of guardedSpaPaths) {
      const res = await invokeMiddleware(spaPath);
      const location = res.response.headers.get("Location") || "";
      assert(
        `Unauthenticated ${spaPath} redirects (302) to /login`,
        res.response.status === 302 && location.endsWith("/login")
      );
    }

    // Authenticated non-admin accessing /admin -> redirects to /dashboard?denied=admin_only
    const nonAdminAdminPage = await invokeMiddleware("/admin", {
      cookies: `deltaharvest_session=${validClientToken}`,
    });
    const nonAdminLoc = nonAdminAdminPage.response.headers.get("Location") || "";
    assert(
      "Client visiting /admin redirected to /dashboard?denied=admin_only",
      nonAdminAdminPage.response.status === 302 && nonAdminLoc.includes("/dashboard?denied=admin_only")
    );

    // Authenticated visiting /login -> redirects to workspace
    const clientLogin = await invokeMiddleware("/login", {
      cookies: `deltaharvest_session=${validClientToken}`,
    });
    assert(
      "Authenticated Client visiting /login redirected to /dashboard",
      clientLogin.response.status === 302 && (clientLogin.response.headers.get("Location") || "").endsWith("/dashboard")
    );

    const adminLogin = await invokeMiddleware("/login", {
      cookies: `deltaharvest_session=${validAdminToken}`,
    });
    assert(
      "Authenticated Admin visiting /login redirected to /admin/users",
      adminLogin.response.status === 302 && (adminLogin.response.headers.get("Location") || "").endsWith("/admin/users")
    );
  }

  // -------------------------------------------------------------------------
  // Group 8: Fall-Through Route Verification
  // -------------------------------------------------------------------------
  console.log("\n--- Group 8: Fall-Through Route Verification ---");
  {
    const fallThroughPaths = [
      "/api/covered-calls",
      "/api/market-recap",
      "/api/market-sentiment",
      "/api/agent/chat",
      "/api/bot/discord",
      "/api/options/journal",
      "/api/scheduled/morning-digest",
    ];

    for (const ftp of fallThroughPaths) {
      const res = await invokeMiddleware(ftp);
      assert(`Fall-through path passes to in-handler logic: ${ftp}`, res.nextCalled);
    }
  }

  console.log("\n========================================================");
  console.log(` SUMMARY: ${totalPassed} Passed, ${totalFailed} Failed`);
  console.log("========================================================\n");

  if (totalFailed > 0) {
    process.exitCode = 1;
  }
}

runAdversarialBattery().catch((err) => {
  console.error("Test execution error:", err);
  process.exitCode = 1;
});
