const https = require('https');
const fs = require('fs');

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        file.close();
        fs.unlinkSync(dest);
        return reject(new Error(`Status ${res.statusCode} for ${url}`));
      }
      res.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log(`Saved ${dest} (${fs.statSync(dest).size} bytes)`);
        resolve();
      });
    }).on('error', err => reject(err));
  });
}

(async () => {
  try {
    await download('https://www.pascuallab.com/uploads/optimized/products/89/ascof_tablet60.png', 'public/images/products/ascof-forte-lagundi-tablet.png');
    await download('https://www.pascuallab.com/uploads/optimized/products/99/ascof_grape_60ml.png', 'public/images/products/ascof-lagundi-grape-syrup.png');
    console.log('All ASCOF variants downloaded successfully!');
  } catch (e) {
    console.error('Download error:', e);
  }
})();
