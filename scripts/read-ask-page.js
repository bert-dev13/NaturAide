const fs = require('fs');

console.log("=== src/app/community/ask/page.tsx ===");
const code = fs.readFileSync('src/app/community/ask/page.tsx', 'utf8');
console.log(code.substring(0, 2000));
