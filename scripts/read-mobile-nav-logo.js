const fs = require('fs');

const code = fs.readFileSync('src/components/community/CommunityMobileNav.tsx', 'utf8');
const lines = code.split('\n');
console.log(lines.slice(38, 65).join('\n'));
