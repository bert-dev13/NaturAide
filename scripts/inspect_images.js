const fs = require('fs');
const path = require('path');

const dir = 'public/images/products';
if (fs.existsSync(dir)) {
  const files = fs.readdirSync(dir);
  console.log(`Files in ${dir} (${files.length}):`);
  files.forEach(f => {
    const stats = fs.statSync(path.join(dir, f));
    console.log(` - ${f} (${stats.size} bytes)`);
  });
} else {
  console.log(`${dir} does not exist!`);
}

const audit = JSON.parse(fs.readFileSync('scripts/audit_dump.json', 'utf8'));
const sampleImages = audit.slice(0, 15).map(p => ({
  id: p.id,
  name: p.name,
  image_path: p.image_path,
  imageUrl: p.imageUrl,
  image_verified: p.image_verified,
  image_source: p.image_source
}));
console.log('Sample product images in DB:');
console.table(sampleImages);
