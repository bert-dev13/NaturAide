const fs = require('fs');

const code = fs.readFileSync('src/components/community/PlantDetailSections.tsx', 'utf8');
const lines = code.split('\n');
console.log(lines.slice(lines.length - 60).join('\n'));
