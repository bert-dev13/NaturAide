const https = require('https');

https.get('https://www.pascuallab.com/brands/', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    const regex = /<img[^>]+src="([^">]*uploads\/[^">]*)"[^>]*>/gi;
    let match;
    while ((match = regex.exec(data)) !== null) {
      console.log('PascualLab img:', match[1]);
    }
  });
}).on('error', err => console.error(err));
