const https = require('https');
const fs = require('fs');

const url = 'https://atchealthcare.com.ph/wp-content/uploads/2020/05/Garlic-Oil-Main.png';
const dest = 'public/images/products/atc-garlic-oil-capsule.png';

const options = {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
  }
};

https.get(url, options, (res) => {
  console.log('Status code:', res.statusCode);
  if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
    console.log('Redirect to:', res.headers.location);
    https.get(res.headers.location, options, (res2) => {
      const file = fs.createWriteStream(dest);
      res2.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log('Downloaded size:', fs.statSync(dest).size);
      });
    });
    return;
  }
  const file = fs.createWriteStream(dest);
  res.pipe(file);
  file.on('finish', () => {
    file.close();
    console.log('Downloaded size:', fs.statSync(dest).size);
  });
}).on('error', (err) => {
  console.error('Error:', err);
});
