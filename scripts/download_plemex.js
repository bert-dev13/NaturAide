const https = require('https');
const fs = require('fs');
const path = require('path');

function downloadImage(url, destPath) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, (res) => {
      if (res.statusCode !== 200) {
        return reject(new Error(`Status ${res.statusCode}`));
      }
      const file = fs.createWriteStream(destPath);
      res.pipe(file);
      file.on('finish', () => file.close(() => resolve()));
    }).on('error', reject);
  });
}

async function main() {
  const plemexForteDest = path.join('public', 'images', 'products', 'plemex-forte-lagundi-syrup.png');
  const plemexKidsDest = path.join('public', 'images', 'products', 'plemex-for-kids-lagundi-syrup.png');

  await downloadImage('https://www.rosepharmacy.com/ph1/wp-content/uploads/2016/09/49912.png', plemexForteDest);
  console.log('Downloaded Plemex Forte syrup:', fs.statSync(plemexForteDest).size, 'bytes');

  await downloadImage('https://www.rosepharmacy.com/ph1/wp-content/uploads/2016/09/49909.png', plemexKidsDest);
  console.log('Downloaded Plemex for Kids syrup:', fs.statSync(plemexKidsDest).size, 'bytes');
}

main().catch(console.error);
