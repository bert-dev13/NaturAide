const fs = require('fs');
const path = require('path');

const dir = 'docs';
const files = fs.readdirSync(dir);

files.forEach(f => {
  if (!f.endsWith('.md') && !f.endsWith('.csv')) return;
  const p = path.join(dir, f);
  let content = fs.readFileSync(p, 'utf8');
  const orig = content;

  content = content.split('\uFFFD').join(' - ');
  content = content.split('? ).join( - );
  content = content.split(+ ).join(' -> ');

 if (content !== orig) {
 fs.writeFileSync(p, content, 'utf8');
 console.log('Cleaned:', f);
 } else {
 console.log('Clean:', f);
 }
});