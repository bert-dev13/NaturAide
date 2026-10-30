const fs = require('fs');
const lines = fs.readFileSync('src/app/community/products/[slug]/page.tsx', 'utf8').split('\n');
console.log(lines.slice(200, 275).map((l, i) => (i + 201) + ': ' + l).join('\n'));
