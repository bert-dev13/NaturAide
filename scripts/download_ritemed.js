const https = require('https');
const fs = require('fs');

const url = 'https://www.ritemed.com.ph/storage/app/uploads/public/66b/5ca/ded/66b5caded09fd879797201.png';
const dest = 'public/images/products/ritemed-lagundi-syrup.png';

const file = fs.createWriteStream(dest);
https.get(url, (res) => {
  console.log('Status code:', res.statusCode);
  console.log('Content-Type:', res.headers['content-type']);
  res.pipe(file);
  file.on('finish', () => {
    file.close();
    console.log('Downloaded size:', fs.statSync(dest).size);
  });
}).on('error', (err) => {
  console.error('Error:', err);
});
