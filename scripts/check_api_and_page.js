const fs = require('fs');

console.log('=== src/app/community/page.tsx lines 65-90 ===');
const pLines = fs.readFileSync('src/app/community/page.tsx', 'utf8').split('\n');
console.log(pLines.slice(65, 90).join('\n'));

if (fs.existsSync('src/app/api/community/products/route.ts')) {
  console.log('=== src/app/api/community/products/route.ts ===');
  console.log(fs.readFileSync('src/app/api/community/products/route.ts', 'utf8'));
}
