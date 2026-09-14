import {
  parseSessionCookie,
  verifySessionToken,
  getUserById,
  DEFAULT_SECRET,
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

  // 2. Allow public auth APIs
  if (
    pathname === "/api/auth/login" ||
    pathname === "/api/auth/logout" ||
    pathname === "/api/auth/request-access" ||
    pathname === "/api/economic-calendar" ||
    pathname === "/api/analyze-options"
  ) {
    return context.next();
  }

  // 3. Inspect session cookie for protected routes
  const token = parseSessionCookie(request);
  const secret = env.SESSION_SECRET || DEFAULT_SECRET;
  let sessionPayload = null;

  if (token) {
    sessionPayload = await verifySessionToken(token, secret);
  }

  const isAuthenticated = !!(sessionPayload && sessionPayload.sub);
  const userRole = sessionPayload ? sessionPayload.role : null;

  // 4. Protect Admin APIs: /api/admin/*
  if (pathname.startsWith("/api/admin")) {
    if (!isAuthenticated) {
      return new Response(
        JSON.stringify({ error: "Unauthorized: Administrator session required." }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }
    if (userRole !== "admin") {
      return new Response(
        JSON.stringify({ error: "Forbidden: Restricted to primary administrator (fjmaresca@gmail.com)." }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }
    return context.next();
  }

  // 5. Protect User APIs: /api/user/*
  if (pathname.startsWith("/api/user")) {
    if (!isAuthenticated) {
      return new Response(
        JSON.stringify({ error: "Unauthorized: Please log in to access tenant data." }),
        { status: 401, headers: { "Content-Type": "application/json" } }
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

  // B. Client Dashboard: /dashboard
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/portfolio")) {
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
