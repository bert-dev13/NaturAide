const fs = require('fs');

const code = fs.readFileSync('src/app/login/page.tsx', 'utf8');
const lines = code.split('\n');
lines.forEach((l, i) => {
  if (l.includes('nature-logo') || l.includes('Image')) {
    console.log((i+1) + ': ' + l.trim());
  }
});
