const fs = require('fs');
const lines = fs.readFileSync('src/app/community/products/[slug]/page.tsx', 'utf8').split('\n');
console.log(lines.slice(375, 450).map((l, i) => (i + 376) + ': ' + l).join('\n'));
