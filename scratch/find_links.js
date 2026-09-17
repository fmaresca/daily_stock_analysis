const fs = require('fs');

const html = fs.readFileSync('scratch/mc_sample.html', 'utf8');

// Find all <a> tags with text and href
const linkRegex = /<a\s+[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
let match;
const links = [];
while ((match = linkRegex.exec(html)) !== null) {
  const href = match[1];
  const text = match[2].replace(/<[^>]+>/g, '').trim();
  if (text.length > 20 && !href.startsWith('javascript') && !href.startsWith('#')) {
    links.push({ href, text });
  }
}

console.log('Total substantive links found:', links.length);
console.log('Sample links:', links.slice(0, 15));
