const fs = require('fs');

const code = fs.readFileSync('src/app/community/ask/page.tsx', 'utf8');
console.log(code);
