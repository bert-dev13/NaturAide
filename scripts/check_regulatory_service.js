const fs = require('fs');
const lines = fs.readFileSync('src/lib/regulatory-verification-service.ts', 'utf8').split('\n');
console.log(lines.slice(120, 160).join('\n'));
