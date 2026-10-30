const fs = require('fs');
const lines = fs.readFileSync('src/app/community/products/[slug]/page.tsx', 'utf8').split('\n');
console.log(lines.slice(35, 90).map((l, i) => (i + 36) + ': ' + l).join('\n'));
