const https = require('https');
const fs = require('fs');
const path = require('path');

function download(url, dest) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, res => {
      if (res.statusCode !== 200) return reject(new Error('Status ' + res.statusCode));
      const f = fs.createWriteStream(dest);
      res.pipe(f);
      f.on('finish', () => f.close(() => resolve()));
    }).on('error', reject);
  });
}

async function main() {
  const diavitDest = path.join('public', 'images', 'products', 'diavit-herbs-ampalaya-capsule.jpg');
  await download('https://diavitherbs.org/wp-content/uploads/2020/10/Diavitherbs_product_image_533x500_v2.jpg', diavitDest);
  console.log('Diavit Herbs downloaded:', fs.statSync(diavitDest).size, 'bytes');

  const dokDest = path.join('public', 'images', 'products', 'dok-natural-banaba-sambong-drops.webp');
  await download('https://doknaturalofficial.com/cdn/shop/files/DN_HERBAL_DROPS_FDA.webp', dokDest);
  console.log('Dok Natural downloaded:', fs.statSync(dokDest).size, 'bytes');
}

main().catch(console.error);
