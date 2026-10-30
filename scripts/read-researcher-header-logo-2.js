const fs = require('fs');

const code = fs.readFileSync('src/components/researcher/ResearcherHeader.tsx', 'utf8');
const lines = code.split('\n');
console.log(lines.slice(50, 85).join('\n'));
