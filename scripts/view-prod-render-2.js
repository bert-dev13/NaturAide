const fs = require('fs');
const lines = fs.readFileSync('src/app/community/products/[slug]/page.tsx', 'utf8').split('\n');
console.log(lines.slice(450, 560).map((l, i) => (i + 451) + ': ' + l).join('\n'));
