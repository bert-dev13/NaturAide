const fs = require('fs');

const code = fs.readFileSync('src/components/Navbar.tsx', 'utf8');
const lines = code.split('\n');
console.log(lines.slice(0, 45).join('\n'));
