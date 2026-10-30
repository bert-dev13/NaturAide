const fs = require('fs');

if (fs.existsSync('src/components/community/RegulatoryProductList.tsx')) {
  console.log('=== src/components/community/RegulatoryProductList.tsx ===');
  console.log(fs.readFileSync('src/components/community/RegulatoryProductList.tsx', 'utf8'));
} else {
  console.log('RegulatoryProductList.tsx does not exist in components/community, checking elsewhere...');
  const files = fs.readdirSync('src/components', { recursive: true });
  files.forEach(f => {
    if (f.includes('RegulatoryProduct')) console.log(f);
  });
}
