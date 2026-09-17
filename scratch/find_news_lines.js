const fs = require('fs');

const html = fs.readFileSync('scratch/mc_sample.html', 'utf8');

// Search for anything related to articles or table rows with news
const lines = html.split('\n');
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.toLowerCase().includes('news') && (line.includes('<td') || line.includes('<div') || line.includes('<tr') || line.includes('class='))) {
    console.log(`Line ${i}:`, line.trim().slice(0, 150));
  }
}
