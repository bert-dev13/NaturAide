const fs = require('fs');
const lines = fs.readFileSync('src/components/community/PlantDetailSections.tsx', 'utf8').split('\n');
console.log(lines.slice(235, 385).map((l, i) => (i + 236) + ': ' + l).join('\n'));
