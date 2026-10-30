const fs = require('fs');
const content = fs.readFileSync('src/components/community/PlantDetailSections.tsx', 'utf8');
const lines = content.split('\n');
lines.forEach((l, i) => {
  if (l.includes('research') || l.includes('references') || l.includes('Scientifically Validated') || l.includes('evidence')) {
    console.log((i+1) + ': ' + l.trim());
  }
});
