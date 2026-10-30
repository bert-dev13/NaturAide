const fs = require('fs');

console.log('--- Plant page references search ---');
const plantPage = fs.readFileSync('src/app/community/plants/[slug]/page.tsx', 'utf8');
plantPage.split('\n').forEach((line, idx) => {
  if (line.includes('scientific_references') || line.includes('source_verified') || line.includes('references')) {
    console.log((idx+1) + ': ' + line.trim());
  }
});
