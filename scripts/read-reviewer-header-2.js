const fs = require('fs');

const code = fs.readFileSync('src/components/reviewer/ReviewerHeader.tsx', 'utf8');
const lines = code.split('\n');
console.log(lines.slice(80, 130).join('\n'));
