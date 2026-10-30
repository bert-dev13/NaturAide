const fs = require('fs');
const content = fs.readFileSync('src/app/community/products/[slug]/page.tsx', 'utf8');
const lines = content.split('\n');
lines.forEach((l, idx) => {
  if (l.includes('product_references') || l.includes('scientific_references') || l.includes('evidenceStatus') || l.includes('isVerified')) {
    console.log(`${idx + 1}: ${l}`);
  }
});
