import {
  parseSessionCookie,
  verifySessionToken,
  getUserById,
  requireSessionSecret,
  buildClearSessionCookie,
} from "./api/_auth_utils.js";

/**
 * Cloudflare Pages Root Edge Middleware
 * Protects administrative routes and multi-tenant client views.
 */
export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const pathname = url.pathname;

  // 1. Always allow static assets and public APIs
  if (
    pathname.startsWith("/assets/") ||
    pathname.startsWith("/data/") ||
    pathname.endsWith(".js") ||
    pathname.endsWith(".css") ||
    pathname.endsWith(".png") ||
    pathname.endsWith(".jpg") ||
    pathname.endsWith(".svg") ||
    pathname.endsWith(".ico") ||
    pathname === "/favicon.ico"
  ) {
    return context.next();
  }

  // 2. Allow public auth APIs & version endpoint
  if (
    pathname === "/version" ||
    pathname === "/version.json" ||
    pathname === "/api/version" ||
    pathname === "/api/auth/login" ||
    pathname === "/api/auth/logout" ||
    pathname === "/api/auth/session" ||
    pathname === "/api/auth/request-access" ||
    pathname.startsWith("/api/auth/reset-password") ||
    pathname === "/api/admin/inquiries" ||
    pathname.startsWith("/api/v1/options/") ||
    pathname === "/api/economic-calendar" ||
    pathname === "/api/analyze-options" ||
    pathname === "/api/market-price" ||
    pathname.startsWith("/api/news/")
  ) {
    return context.next();
  }

  // 3. Inspect session cookie for protected routes
  // Note: Rotating SESSION_SECRET invalidates all outstanding JWTs (signature verification fails),
  // immediately revoking all sessions minted under previous/compromised secrets.
  let secret = null;
  try {
    secret = requireSessionSecret(env);
  } catch (err) {
    secret = null;
  }

  const token = parseSessionCookie(request);
  let sessionPayload = null;

  if (token && secret) {
    sessionPayload = await verifySessionToken(token, secret);
  }

  // Look up user from DB if session payload exists
  let dbUser = null;
  let isAuthenticated = false;

  if (sessionPayload && sessionPayload.sub) {
    try {
      dbUser = await getUserById(env, sessionPayload.sub);
    } catch (e) {
      console.warn("Middleware db user lookup error:", e);
    }

    if (dbUser && (dbUser.is_active === 1 || dbUser.is_active === true)) {
      const dbTv = Number(dbUser.token_version || 0);
      const tokenTv = Number(sessionPayload.tv || 0);
      if (dbTv === tokenTv) {
        isAuthenticated = true;
      }
    }
  }

  const userRole = (isAuthenticated && dbUser && dbUser.role) ? String(dbUser.role).toLowerCase() : null;

  // 4. Protect Admin APIs: /api/admin/*
  if (pathname.startsWith("/api/admin")) {
    if (!secret) {
      return new Response(
        JSON.stringify({ error: "Server authentication is not configured." }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
    if (!isAuthenticated) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          status: 401,
          headers: {
            "Content-Type": "application/json",
            ...(token ? { "Set-Cookie": buildClearSessionCookie() } : {}),
          },
        }
      );
    }
    if (userRole !== "admin") {
      return new Response(
        JSON.stringify({ error: "Forbidden" }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }
    return context.next();
  }

  // 5. Protect User APIs: /api/user/*
  if (pathname.startsWith("/api/user")) {
    if (!secret) {
      return new Response(
        JSON.stringify({ error: "Server authentication is not configured." }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
    if (!isAuthenticated) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          status: 401,
          headers: {
            "Content-Type": "application/json",
            ...(token ? { "Set-Cookie": buildClearSessionCookie() } : {}),
          },
        }
      );
    }
    return context.next();
  }

  // 6. Page Routing Guards
  // A. Admin Pages: /admin or /admin/*
  if (pathname.startsWith("/admin")) {
    if (!isAuthenticated) {
      return Response.redirect(`${url.origin}/login`, 302);
    }
    if (userRole !== "admin") {
      return Response.redirect(`${url.origin}/dashboard?denied=admin_only`, 302);
    }
  }

  // B. Guard SPA routes at the edge: /equities*, /options*, /watchlist-builder*, /dashboard*, /portfolio*, /workflow*
  const isProtectedSpaRoute =
    pathname.startsWith("/equities") ||
    pathname.startsWith("/options") ||
    pathname.startsWith("/watchlist-builder") ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/portfolio") ||
    pathname.startsWith("/workflow");

  if (isProtectedSpaRoute) {
    if (!isAuthenticated) {
      return Response.redirect(`${url.origin}/login`, 302);
    }
  }

  // C. Login Page: /login -> If already logged in, redirect to workspace
  if (pathname === "/login") {
    if (isAuthenticated) {
      const dest = userRole === "admin" ? "/admin/users" : "/dashboard";
      return Response.redirect(`${url.origin}${dest}`, 302);
    }
  }

  return context.next();
}
