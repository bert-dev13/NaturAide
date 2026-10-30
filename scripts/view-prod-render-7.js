const fs = require('fs');
const lines = fs.readFileSync('src/app/community/products/[slug]/page.tsx', 'utf8').split('\n');
console.log(lines.slice(920, 960).map((l, i) => (i + 921) + ': ' + l).join('\n'));
