const fs = require('fs');
const lines = fs.readFileSync('src/app/community/products/[slug]/page.tsx', 'utf8').split('\n');
console.log(lines.slice(770, 860).map((l, i) => (i + 771) + ': ' + l).join('\n'));
