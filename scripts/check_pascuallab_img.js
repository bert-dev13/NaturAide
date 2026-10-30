const https = require('https');
const fs = require('fs');

const url = 'https://www.pascuallab.com/uploads/optimized/products/97/2.png';
const dest = 'public/images/products/pascuallab-check.png';

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
