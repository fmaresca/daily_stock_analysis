const fs = require('fs');

const html = fs.readFileSync('scratch/mc_sample.html', 'utf8');

function decodeEntities(str) {
  return str
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&#([0-9]+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .trim();
}

function parseMarketChameleonNews(html, ticker) {
  const items = [];
  // Match <div class="symov_news_item">...</div>
  const itemRegex = /<div class="symov_news_item">([\s\S]*?)(?=<div class="symov_news_item">|<div id="symov_news_divider"|<\/div>\s*<\/div>\s*<\/div>|$)/gi;
  let match;
  while ((match = itemRegex.exec(html)) !== null && items.length < 5) {
    const block = match[1];

    // Match link & title: <a [^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>
    const linkMatch = /<a\s+[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/i.exec(block);
    if (!linkMatch) continue;

    let link = linkMatch[1].trim();
    if (link.startsWith('/')) {
      link = 'https://marketchameleon.com' + link;
    }

    let title = decodeEntities(linkMatch[2].replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim();
    if (!title) continue;

    // Match date: <span>\s*\(([^)]+)\)\s*<\/span> or similar
    const dateMatch = /<span>\s*\(([^)]+)\)\s*<\/span>/i.exec(block);
    let publishedAt = dateMatch ? dateMatch[1].trim() : new Date().toISOString();

    // Match source/cite if present
    const citeMatch = /<cite[^>]*>(?:at\s+)?([\s\S]*?)<\/cite>/i.exec(block);
    const publisher = citeMatch ? decodeEntities(citeMatch[1].replace(/<[^>]+>/g, '')).trim() : 'MarketChameleon';

    // Simple hash for id
    const id = `mc-${ticker}-${items.length}-${Math.abs(hashString(title))}`;

    items.push({
      id,
      title,
      link,
      source: 'MarketChameleon',
      publisher,
      publishedAt,
      category: 'news'
    });
  }
  return items;
}

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

const parsed = parseMarketChameleonNews(html, 'AAPL');
console.log('Parsed MC items count:', parsed.length);
console.log(JSON.stringify(parsed, null, 2));
