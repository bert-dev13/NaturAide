const https = require('https');
const fs = require('fs');

const url = 'https://medias.watsons.com.ph/publishing/50052327-NYKJ22NY-zoom.png?version=1762512243';
const dest = 'public/images/products/guavidone-bayabas-antiseptic-solution.png';

const options = {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
  }
};

https.get(url, options, (res) => {
  console.log('Status code:', res.statusCode);
  const file = fs.createWriteStream(dest);
  res.pipe(file);
  file.on('finish', () => {
    file.close();
    console.log('Downloaded size:', fs.statSync(dest).size);
  });
}).on('error', (err) => {
  console.error('Error:', err);
});
