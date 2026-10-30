const fs = require('fs');

const code = fs.readFileSync('src/components/community/CommunitySidebar.tsx', 'utf8');
const lines = code.split('\n');
console.log(lines.slice(40, 85).join('\n'));
