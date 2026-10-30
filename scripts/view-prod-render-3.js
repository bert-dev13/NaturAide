const fs = require('fs');
const lines = fs.readFileSync('src/app/community/products/[slug]/page.tsx', 'utf8').split('\n');
console.log(lines.slice(560, 650).map((l, i) => (i + 561) + ': ' + l).join('\n'));
