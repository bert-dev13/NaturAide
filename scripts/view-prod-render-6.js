const fs = require('fs');
const lines = fs.readFileSync('src/app/community/products/[slug]/page.tsx', 'utf8').split('\n');
console.log(lines.slice(860, 920).map((l, i) => (i + 861) + ': ' + l).join('\n'));
