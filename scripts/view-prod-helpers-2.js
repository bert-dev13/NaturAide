const fs = require('fs');
const lines = fs.readFileSync('src/app/community/products/[slug]/page.tsx', 'utf8').split('\n');
console.log(lines.slice(88, 125).map((l, i) => (i + 89) + ': ' + l).join('\n'));
