const fs = require('fs');

const html = fs.readFileSync('scratch/mc_sample.html', 'utf8');

// Search for patterns
console.log('--- Searching for news headlines / links ---');
const idx = html.indexOf('sym_news');
if (idx !== -1) {
  console.log('Found sym_news at:', idx);
  console.log(html.slice(idx - 100, idx + 1000));
} else {
  // Let's find table or div with news
  const newsIdx = html.indexOf('Headline News');
  console.log('Found Headline News at:', newsIdx);
  if (newsIdx !== -1) {
    console.log(html.slice(newsIdx, newsIdx + 2000));
  }
}
