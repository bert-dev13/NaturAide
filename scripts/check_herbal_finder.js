const fs = require('fs');
const lines = fs.readFileSync('src/app/community/herbal-finder/page.tsx', 'utf8').split('\n');
console.log(lines.slice(295, 360).join('\n'));
