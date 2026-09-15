/**
 * Cloudflare Pages Function: GET /api/news/:ticker
 *
 * Aggregates headlines from four sources in parallel:
 *   1. Google News RSS
 *   2. Yahoo Finance RSS
 *   3. SEC EDGAR Atom (8-K filings)
 *   4. MarketChameleon HTML scrape (top 5 articles, graceful fallback)
 *
 * Results are deduplicated by normalised headline (first 45 alphanum chars)
 * and cached at the edge for 5 min (stale-while-revalidate 10 min).
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function jsonResponse(data, status = 200, extra = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      ...CORS_HEADERS,
      ...extra,
    },
  });
}

/** Strip HTML tags, decode common entities, collapse whitespace. */
function cleanText(raw) {
  if (!raw) return '';
  return raw
    .replace(/<[^>]+>/g, '')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2018;/g, '\u2018')
    .replace(/&#x2019;/g, '\u2019')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#([0-9]+);/g, (_, d) => String.fromCharCode(parseInt(d, 10)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/\s+/g, ' ')
    .trim();
}

/** Normalise a headline for dedup: first 45 alphanumeric characters, lowercase. */
function normKey(title) {
  return (title || '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toLowerCase()
    .slice(0, 45);
}

/** Simple non-crypto hash for stable item ids. */
function hashStr(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) + h) ^ str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h).toString(36);
}

// ─── Source 1: Google News RSS ─────────────────────────────────────────────

async function fetchGoogleNews(ticker) {
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(ticker + ' stock')}&hl=en-US&gl=US&ceid=US:en`;
  const res = await fetch(url, { cf: { cacheTtl: 180 } });
  if (!res.ok) return [];
  const xml = await res.text();

  const items = [];
  // Match <item>…</item> blocks
  const itemRx = /<item>([\s\S]*?)<\/item>/gi;
  let m;
  while ((m = itemRx.exec(xml)) !== null && items.length < 12) {
    const block = m[1];
    const title = cleanText((/<title[^>]*>([\s\S]*?)<\/title>/i.exec(block) || [])[1] || '');
    const link = cleanText((/<link>([\s\S]*?)<\/link>/i.exec(block) || [])[1] || '');
    const pubDate = cleanText((/<pubDate>([\s\S]*?)<\/pubDate>/i.exec(block) || [])[1] || '');
    const source = cleanText((/<source[^>]*>([\s\S]*?)<\/source>/i.exec(block) || [])[1] || 'Google News');
    if (!title || !link) continue;
    items.push({
      id: `gn-${ticker}-${hashStr(title)}`,
      title,
      link,
      source: `Google News · ${source}`,
      publishedAt: pubDate || new Date().toISOString(),
      category: 'news',
    });
  }
  return items;
}

// ─── Source 2: Yahoo Finance RSS ──────────────────────────────────────────

async function fetchYahooFinanceNews(ticker) {
  const url = `https://finance.yahoo.com/rss/headline?s=${encodeURIComponent(ticker)}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'DeltaHarvestApp/1.0 (admin@delta-harvest.pages.dev)' },
    cf: { cacheTtl: 180 },
  });
  if (!res.ok) return [];
  const xml = await res.text();

  const items = [];
  const itemRx = /<item>([\s\S]*?)<\/item>/gi;
  let m;
  while ((m = itemRx.exec(xml)) !== null && items.length < 12) {
    const block = m[1];
    const title = cleanText((/<title[^>]*>([\s\S]*?)<\/title>/i.exec(block) || [])[1] || '');
    const link = cleanText((/<link>([\s\S]*?)<\/link>/i.exec(block) || (/<guid[^>]*>([\s\S]*?)<\/guid>/i.exec(block) || []))[1] || '');
    const pubDate = cleanText((/<pubDate>([\s\S]*?)<\/pubDate>/i.exec(block) || [])[1] || '');
    if (!title || !link) continue;
    items.push({
      id: `yf-${ticker}-${hashStr(title)}`,
      title,
      link,
      source: 'Yahoo Finance',
      publishedAt: pubDate || new Date().toISOString(),
      category: 'news',
    });
  }
  return items;
}

// ─── Source 3: SEC EDGAR 8-K Atom ─────────────────────────────────────────

async function fetchSecEdgar8K(ticker) {
  const url = `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${encodeURIComponent(ticker)}&type=8-K&count=5&output=atom`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'DeltaHarvestApp/1.0 (admin@delta-harvest.pages.dev)' },
    cf: { cacheTtl: 600 },
  });
  if (!res.ok) return [];
  const xml = await res.text();

  const items = [];
  // Atom uses <entry> blocks
  const entryRx = /<entry>([\s\S]*?)<\/entry>/gi;
  let m;
  while ((m = entryRx.exec(xml)) !== null && items.length < 5) {
    const block = m[1];
    const title = cleanText((/<title[^>]*>([\s\S]*?)<\/title>/i.exec(block) || [])[1] || '');
    const linkMatch = /<link[^>]+href=["']([^"']+)["']/i.exec(block);
    const link = linkMatch ? linkMatch[1] : '';
    const updated = cleanText((/<updated>([\s\S]*?)<\/updated>/i.exec(block) || [])[1] || '');
    if (!title || !link) continue;
    items.push({
      id: `sec-${ticker}-${hashStr(title)}`,
      title: title.startsWith('8-K') ? title : `SEC 8-K: ${title}`,
      link,
      source: 'SEC EDGAR',
      publishedAt: updated || new Date().toISOString(),
      category: 'sec-8k',
    });
  }
  return items;
}

// ─── Source 4: MarketChameleon HTML scrape ────────────────────────────────

async function fetchMarketChameleonNews(ticker) {
  const url = `https://marketchameleon.com/Overview/${encodeURIComponent(ticker)}/News/`;
  let res;
  try {
    res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        Referer: `https://marketchameleon.com/Overview/${ticker}/`,
      },
      cf: { cacheTtl: 300 },
    });
  } catch (_) {
    return [];
  }

  // Gracefully abort on anti-bot blocks
  if (!res.ok || res.status === 403 || res.status === 503) return [];

  let html;
  try {
    html = await res.text();
  } catch (_) {
    return [];
  }

  // Check for Cloudflare challenge page
  if (
    html.includes('cf-browser-verification') ||
    html.includes('Just a moment') ||
    html.includes('Enable JavaScript and cookies')
  ) {
    return [];
  }

  const items = [];
  /**
   * MarketChameleon markup (confirmed via live sample):
   *   <div class="symov_news_item">
   *     <p>
   *       <a class="mplink[_external] symov_news_link" href="…">HEADLINE TEXT</a>
   *     </p>
   *     <p class="symov_news_source">
   *       <cite>at publisher.com</cite>
   *       <span>(Mon, 15-Sep 9:37 AM)</span>
   *     </p>
   *   </div>
   */
  const itemRx = /<div class="symov_news_item">([\s\S]*?)(?=<div class="symov_news_item">|<div id="symov_news_divider"|$)/gi;
  let m;
  while ((m = itemRx.exec(html)) !== null && items.length < 5) {
    const block = m[1];

    // Extract anchor
    const anchorM = /<a\s+[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/i.exec(block);
    if (!anchorM) continue;

    let link = anchorM[1].trim();
    // Resolve relative links
    if (link.startsWith('/')) link = 'https://marketchameleon.com' + link;

    const title = cleanText(anchorM[2]);
    if (!title || title.length < 5) continue;

    // Published date from <span>(…)</span>
    const spanM = /<span>\s*\(([^)]+)\)\s*<\/span>/i.exec(block);
    const publishedAt = spanM ? spanM[1].trim() : new Date().toUTCString();

    // Publisher cite
    const citeM = /<cite[^>]*>(?:at\s+)?([\s\S]*?)<\/cite>/i.exec(block);
    const publisher = citeM ? cleanText(citeM[1]) : 'MarketChameleon';

    items.push({
      id: `mc-${ticker}-${hashStr(title)}`,
      title,
      link,
      source: 'MarketChameleon',
      publisher,
      publishedAt,
      category: 'news',
    });
  }
  return items;
}

// ─── Main handler ─────────────────────────────────────────────────────────

export async function onRequest(context) {
  const { request, params } = context;

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }
  if (request.method !== 'GET') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const ticker = ((params && params.ticker) || '').toUpperCase().replace(/[^A-Z0-9.\-]/g, '').slice(0, 10);
  if (!ticker) {
    return jsonResponse({ error: 'Ticker parameter is required' }, 400);
  }

  // ── Edge cache check ──────────────────────────────────────────────────────
  const cacheKey = new Request(`https://deltaharvest-cache.internal/news/${ticker}`, request);
  const cache = caches.default;
  const cached = await cache.match(cacheKey);
  if (cached) {
    return cached;
  }

  // ── Parallel fetch (never let a single source fail the endpoint) ──────────
  const [googleResult, yahooResult, secResult, mcResult] = await Promise.allSettled([
    fetchGoogleNews(ticker),
    fetchYahooFinanceNews(ticker),
    fetchSecEdgar8K(ticker),
    fetchMarketChameleonNews(ticker),
  ]);

  const googleItems = googleResult.status === 'fulfilled' ? googleResult.value : [];
  const yahooItems = yahooResult.status === 'fulfilled' ? yahooResult.value : [];
  const secItems = secResult.status === 'fulfilled' ? secResult.value : [];
  const mcItems = mcResult.status === 'fulfilled' ? mcResult.value : [];

  // ── Merge & deduplicate by normalised headline key ─────────────────────────
  const seen = new Set();
  const all = [];
  for (const item of [...mcItems, ...googleItems, ...yahooItems, ...secItems]) {
    const key = normKey(item.title);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    all.push(item);
  }

  const payload = {
    ticker,
    total: all.length,
    sources: {
      marketChameleon: mcItems.length,
      googleNews: googleItems.length,
      yahooFinance: yahooItems.length,
      secEdgar: secItems.length,
    },
    mcBlocked: mcItems.length === 0,
    items: all,
    cachedAt: new Date().toISOString(),
  };

  const response = jsonResponse(payload);

  // Store in edge cache
  context.waitUntil(cache.put(cacheKey, response.clone()));

  return response;
}
