const fs = require('fs');

const code = fs.readFileSync('src/app/community/ask/page.tsx', 'utf8');
const lines = code.split('\n');
console.log(lines.slice(140, 185).join('\n'));
