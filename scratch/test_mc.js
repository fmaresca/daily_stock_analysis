const fs = require('fs');

async function inspectMC() {
  const res = await fetch('https://marketchameleon.com/Overview/AAPL/News/', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Referer': 'https://marketchameleon.com/Overview/AAPL/'
    }
  });
  const html = await res.text();
  fs.writeFileSync('scratch/mc_sample.html', html);
  console.log('Saved mc_sample.html, total bytes:', html.length);
}
inspectMC();
