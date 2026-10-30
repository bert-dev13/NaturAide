const fs = require('fs');

function checkFile(p) {
  if (!fs.existsSync(p)) return;
  const content = fs.readFileSync(p, 'utf8');
  console.log(`=== ${p} ===`);
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    if (line.includes('FROM ') || line.includes('products') || line.includes('herbal_products') || line.includes('product_regulatory_records')) {
      console.log(`L${idx + 1}: ${line.trim()}`);
    }
  });
}

checkFile('src/app/community/page.tsx');
checkFile('src/app/admin/products/page.tsx');
checkFile('src/app/reviewer/products/page.tsx');
checkFile('src/app/community/herbal-finder/page.tsx');
