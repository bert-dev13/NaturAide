const fs = require('fs');
const lines = fs.readFileSync('src/app/community/plants/[slug]/page.tsx', 'utf8').split('\n');
console.log(lines.slice(90, 140).map((l, i) => (i + 91) + ': ' + l).join('\n'));
