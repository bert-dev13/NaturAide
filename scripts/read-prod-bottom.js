const fs = require('fs');

const code = fs.readFileSync('src/app/community/products/[slug]/page.tsx', 'utf8');
const lines = code.split('\n');
console.log(lines.slice(lines.length - 80).join('\n'));
