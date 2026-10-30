const fs = require('fs');

const code = fs.readFileSync('src/app/login/page.tsx', 'utf8');
const lines = code.split('\n');
console.log(lines.slice(130, 145).join('\n'));
console.log("---");
console.log(lines.slice(175, 190).join('\n'));
