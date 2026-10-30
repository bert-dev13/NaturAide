const https = require('https');
const fs = require('fs');

const url = 'https://www.ritemed.com.ph/storage/app/uploads/public/66b/5c7/2d4/66b5c72d400d5987568495.jpg';
const dest = 'public/images/products/ritemed-lagundi-check.jpg';

const file = fs.createWriteStream(dest);
https.get(url, (res) => {
  console.log('Status code:', res.statusCode);
  res.pipe(file);
  file.on('finish', () => {
    file.close();
    console.log('Downloaded size:', fs.statSync(dest).size);
  });
}).on('error', (err) => {
  console.error('Error:', err);
});
