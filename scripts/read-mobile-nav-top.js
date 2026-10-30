const fs = require('fs');

const code = fs.readFileSync('src/components/community/CommunityMobileNav.tsx', 'utf8');
const lines = code.split('\n');
console.log(lines.slice(35, 80).join('\n'));
