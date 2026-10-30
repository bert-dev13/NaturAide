const fs = require('fs');
const lines = fs.readFileSync('src/components/community/PlantDetailSections.tsx', 'utf8').split('\n');
console.log(lines.slice(385, 420).map((l, i) => (i + 386) + ': ' + l).join('\n'));
