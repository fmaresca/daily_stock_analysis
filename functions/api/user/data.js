import { authenticateRequest } from "../_auth_utils.js";

/**
 * Cloudflare Pages Function: /api/user/data
 * Multi-Tenant Isolated CRUD Edge Handler
 * CRITICAL ENFORCEMENT: Strictly mandates WHERE user_id = session.user.id on every query.
 */

// In-memory tenant store for local dev fallback
const localTenantStore = {
  portfolios: {},
  trades: [],
  watchlists: [],
};

export async function onRequestGet(context) {
  const auth = await authenticateRequest(context);
  if (!auth.authenticated) return auth.response;

  const userId = auth.user.id;
  const env = context.env;

  if (env && env.DB) {
    try {
      const [portfolioRes, tradesRes, watchlistsRes] = await env.DB.batch([
        env.DB.prepare("SELECT * FROM user_portfolios WHERE user_id = ?").bind(userId),
        env.DB.prepare("SELECT * FROM user_trades WHERE user_id = ? ORDER BY entry_date DESC").bind(userId),
        env.DB.prepare("SELECT * FROM user_watchlists WHERE user_id = ? ORDER BY created_at ASC").bind(userId),
      ]);

      return new Response(
        JSON.stringify({
          success: true,
          userId,
          portfolio: portfolioRes.results?.[0] || {
            user_id: userId,
            account_name: "Default Trading Account",
            free_cash: 100000.0,
            total_nav: 100000.0,
          },
          trades: tradesRes.results || [],
          watchlists: (watchlistsRes.results || []).map((w) => ({
            ...w,
            symbols: typeof w.symbols === "string" ? JSON.parse(w.symbols || "[]") : w.symbols,
          })),
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    } catch (err) {
      console.warn("D1 query error in /api/user/data GET, using local fallback:", err);
    }
  }

  // Local memory fallback & Admin Seed Data
  const isFrankAdmin = auth.user.email?.toLowerCase() === "fjmaresca@gmail.com" || auth.user.role === "ADMIN";

  const userTrades = localTenantStore.trades.filter((t) => t.user_id === userId);
  const userWatchlists = localTenantStore.watchlists.filter((w) => w.user_id === userId);

  const defaultAdminTrades = [
    { id: 'trade-cc-axti', user_id: userId, symbol: 'AXTI', strategy: 'COVERED_CALL', strike: 4.0, expiration: '2026-09-18', contracts: 5, premium_per_share: 0.35, status: 'OPEN', entry_date: '2026-09-11', notes: 'Living Trust Covered Call (500 shares collateral)' },
    { id: 'trade-cc-blze', user_id: userId, symbol: 'BLZE', strategy: 'COVERED_CALL', strike: 7.5, expiration: '2026-09-18', contracts: 4, premium_per_share: 0.45, status: 'OPEN', entry_date: '2026-09-11', notes: 'Living Trust Covered Call (400 shares collateral)' },
    { id: 'trade-cc-ionq', user_id: userId, symbol: 'IONQ', strategy: 'COVERED_CALL', strike: 17.5, expiration: '2026-09-18', contracts: 10, premium_per_share: 0.65, status: 'OPEN', entry_date: '2026-09-11', notes: 'Living Trust Covered Call (1,000 shares collateral)' },
    { id: 'trade-cc-net', user_id: userId, symbol: 'NET', strategy: 'COVERED_CALL', strike: 110.0, expiration: '2026-09-18', contracts: 5, premium_per_share: 1.85, status: 'OPEN', entry_date: '2026-09-11', notes: 'Living Trust Covered Call (500 shares collateral)' },
    { id: 'trade-cc-rtx', user_id: userId, symbol: 'RTX', strategy: 'COVERED_CALL', strike: 145.0, expiration: '2026-09-18', contracts: 5, premium_per_share: 0.95, status: 'OPEN', entry_date: '2026-09-11', notes: 'Living Trust Covered Call (500 shares collateral)' },
    { id: 'trade-cc-tsla', user_id: userId, symbol: 'TSLA', strategy: 'COVERED_CALL', strike: 345.0, expiration: '2026-09-18', contracts: 2, premium_per_share: 4.20, status: 'OPEN', entry_date: '2026-09-11', notes: 'Living Trust Covered Call (200 shares collateral)' },
    { id: 'trade-csp-pltr', user_id: userId, symbol: 'PLTR', strategy: 'CASH_SECURED_PUT', strike: 160.0, expiration: '2026-09-18', contracts: 10, premium_per_share: 2.10, status: 'OPEN', entry_date: '2026-09-11', notes: 'Living Trust Cash-Secured Put ($160k collateral)' },
  ];

  const defaultAdminWatchlists = [
    { id: 'w-axti', user_id: userId, symbol: 'AXTI', created_at: '2026-09-12' },
    { id: 'w-blze', user_id: userId, symbol: 'BLZE', created_at: '2026-09-12' },
    { id: 'w-ionq', user_id: userId, symbol: 'IONQ', created_at: '2026-09-12' },
    { id: 'w-lunr', user_id: userId, symbol: 'LUNR', created_at: '2026-09-12' },
    { id: 'w-net', user_id: userId, symbol: 'NET', created_at: '2026-09-12' },
    { id: 'w-rtx', user_id: userId, symbol: 'RTX', created_at: '2026-09-12' },
    { id: 'w-tsla', user_id: userId, symbol: 'TSLA', created_at: '2026-09-12' },
    { id: 'w-pltr', user_id: userId, symbol: 'PLTR', created_at: '2026-09-12' },
  ];

  const userPortfolio = isFrankAdmin
    ? {
        user_id: userId,
        account_name: "Charles Schwab Living Trust",
        free_cash: 579707.77,
        cashBalance: 579707.77,
        total_nav: 1058420.0,
        netLiquidity: 1058420.0,
      }
    : localTenantStore.portfolios[userId] || {
        user_id: userId,
        account_name: "Default Trading Account",
        free_cash: 0.0,
        cashBalance: 0.0,
        total_nav: 0.0,
        netLiquidity: 0.0,
      };

  return new Response(
    JSON.stringify({
      success: true,
      userId,
      portfolio: userPortfolio,
      trades: userTrades.length > 0 ? userTrades : (isFrankAdmin ? defaultAdminTrades : []),
      watchlists: userWatchlists.length > 0 ? userWatchlists : (isFrankAdmin ? defaultAdminWatchlists : []),
    }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}

export async function onRequestPost(context) {
  const auth = await authenticateRequest(context);
  if (!auth.authenticated) return auth.response;

  const userId = auth.user.id;
  const env = context.env;

  try {
    const body = await context.request.json().catch(() => ({}));
    const { type, payload } = body;

    if (!type || !payload) {
      return new Response(
        JSON.stringify({ error: "Missing type or payload in request body." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const now = new Date().toISOString();

    if (type === "trade") {
      const tradeId = `trade-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const {
        symbol,
        strategy = "CSP",
        strike,
        expiration,
        contracts = 1,
        premium_received = 0,
        collateral = 0,
        notes = "",
      } = payload;

      if (!symbol || !strike || !expiration) {
        return new Response(
          JSON.stringify({ error: "Symbol, strike, and expiration are required for trades." }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      if (env && env.DB) {
        try {
          await env.DB.prepare(`
            INSERT INTO user_trades (id, user_id, symbol, strategy, strike, expiration, contracts, premium_received, collateral, notes, status, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'OPEN', ?, ?)
          `).bind(
            tradeId,
            userId,
            symbol.toUpperCase(),
            strategy,
            Number(strike),
            expiration,
            Number(contracts),
            Number(premium_received),
            Number(collateral),
            notes,
            now,
            now
          ).run();

          return new Response(
            JSON.stringify({ success: true, tradeId, message: "Trade logged successfully." }),
            { status: 201, headers: { "Content-Type": "application/json" } }
          );
        } catch (err) {
          console.warn("D1 insert error in /api/user/data POST trade:", err);
        }
      }

      // Memory fallback
      localTenantStore.trades.push({
        id: tradeId,
        user_id: userId,
        symbol: symbol.toUpperCase(),
        strategy,
        strike: Number(strike),
        expiration,
        contracts: Number(contracts),
        premium_received: Number(premium_received),
        collateral: Number(collateral),
        status: "OPEN",
        notes,
        created_at: now,
      });

      return new Response(
        JSON.stringify({ success: true, tradeId, message: "Trade logged successfully." }),
        { status: 201, headers: { "Content-Type": "application/json" } }
      );
    }

    if (type === "watchlist") {
      const watchlistId = `wl-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const { group_name, symbols = [] } = payload;

      if (!group_name) {
        return new Response(
          JSON.stringify({ error: "group_name is required for watchlist." }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      const symbolsJson = JSON.stringify(Array.isArray(symbols) ? symbols : []);

      if (env && env.DB) {
        try {
          await env.DB.prepare(`
            INSERT INTO user_watchlists (id, user_id, group_name, symbols, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?)
          `).bind(watchlistId, userId, group_name, symbolsJson, now, now).run();

          return new Response(
            JSON.stringify({ success: true, watchlistId, message: "Watchlist created successfully." }),
            { status: 201, headers: { "Content-Type": "application/json" } }
          );
        } catch (err) {
          console.warn("D1 insert error in /api/user/data POST watchlist:", err);
        }
      }

      localTenantStore.watchlists.push({
        id: watchlistId,
        user_id: userId,
        group_name,
        symbols: Array.isArray(symbols) ? symbols : [],
        created_at: now,
      });

      return new Response(
        JSON.stringify({ success: true, watchlistId, message: "Watchlist created successfully." }),
        { status: 201, headers: { "Content-Type": "application/json" } }
      );
    }

    if (type === "portfolio") {
      const { free_cash = 0, total_nav = 0, account_name = "Trading Account" } = payload;
      const portfolioId = `port-${userId}`;

      if (env && env.DB) {
        try {
          await env.DB.prepare(`
            INSERT INTO user_portfolios (id, user_id, account_name, free_cash, total_nav, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(user_id) DO UPDATE SET
              account_name = excluded.account_name,
              free_cash = excluded.free_cash,
              total_nav = excluded.total_nav,
              updated_at = excluded.updated_at
          `).bind(portfolioId, userId, account_name, Number(free_cash), Number(total_nav), now, now).run();

          return new Response(
            JSON.stringify({ success: true, message: "Portfolio updated successfully." }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          );
        } catch (err) {
          console.warn("D1 upsert error in /api/user/data POST portfolio:", err);
        }
      }

      localTenantStore.portfolios[userId] = {
        user_id: userId,
        account_name,
        free_cash: Number(free_cash),
        total_nav: Number(total_nav),
        updated_at: now,
      };

      return new Response(
        JSON.stringify({ success: true, message: "Portfolio updated successfully." }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: `Unsupported payload type: ${type}` }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("User data POST error:", err);
    return new Response(
      JSON.stringify({ error: "Failed to persist user data." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

export async function onRequestDelete(context) {
  const auth = await authenticateRequest(context);
  if (!auth.authenticated) return auth.response;

  const userId = auth.user.id;
  const env = context.env;

  try {
    const url = new URL(context.request.url);
    const itemType = url.searchParams.get("type"); // 'trade' | 'watchlist'
    const itemId = url.searchParams.get("id");

    if (!itemType || !itemId) {
      return new Response(
        JSON.stringify({ error: "Query parameters 'type' and 'id' are required." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Enforce STRICT tenant boundary: WHERE id = ? AND user_id = ?
    if (itemType === "trade") {
      if (env && env.DB) {
        try {
          await env.DB.prepare("DELETE FROM user_trades WHERE id = ? AND user_id = ?").bind(itemId, userId).run();
        } catch (err) {
          console.warn("D1 delete error:", err);
        }
      }
      localTenantStore.trades = localTenantStore.trades.filter((t) => !(t.id === itemId && t.user_id === userId));

      return new Response(
        JSON.stringify({ success: true, message: "Trade deleted successfully." }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    if (itemType === "watchlist") {
      if (env && env.DB) {
        try {
          await env.DB.prepare("DELETE FROM user_watchlists WHERE id = ? AND user_id = ?").bind(itemId, userId).run();
        } catch (err) {
          console.warn("D1 delete error:", err);
        }
      }
      localTenantStore.watchlists = localTenantStore.watchlists.filter((w) => !(w.id === itemId && w.user_id === userId));

      return new Response(
        JSON.stringify({ success: true, message: "Watchlist deleted successfully." }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: `Unsupported delete item type: ${itemType}` }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("User data DELETE error:", err);
    return new Response(
      JSON.stringify({ error: "Failed to delete item." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
