const fs = require('fs');
const lines = fs.readFileSync('src/app/community/products/[slug]/page.tsx', 'utf8').split('\n');
console.log(lines.slice(680, 770).map((l, i) => (i + 681) + ': ' + l).join('\n'));
