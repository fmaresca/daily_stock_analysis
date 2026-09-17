const fs = require('fs');
const html = fs.readFileSync('scratch/mc_sample.html', 'utf8');

const articleRegex =
  /<a[^>]+href="(\/Article\/[^"]+|\/Financial-News\/[^"]+|\/articles\/[^"]+|https?:\/\/[^"]+)"[^>]*>([^<]+)<\/a>/gi;

const BLOCKLIST = [
  'olark.com',
  'investor.apple.com',
  'apple.com/investor',
  'marketchameleon.com/register',
  'marketchameleon.com/login',
];

function decodeHtmlEntities(str) {
  return str
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/&#([0-9]+);/g, (_, d) => String.fromCharCode(parseInt(d, 10)))
    .replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ').trim();
}

const hits = [];
let match;
while ((match = articleRegex.exec(html)) !== null && hits.length < 5) {
  const rawLink = match[1];
  const rawTitle = match[2].trim();
  if (rawTitle.length <= 20) continue;
  if (rawTitle.includes('Login') || rawTitle.includes('Register')) continue;
  if (BLOCKLIST.some((d) => rawLink.includes(d))) continue;
  const fullLink = rawLink.startsWith('/') ? `https://marketchameleon.com${rawLink}` : rawLink;
  hits.push({ title: decodeHtmlEntities(rawTitle).slice(0, 90), link: fullLink.slice(0, 100) });
}

console.log('Final hits:', hits.length);
console.log(JSON.stringify(hits, null, 2));
