const https = require('https');

https.get('https://www.pascuallab.com/products/re-leaf', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    const regex = /<img[^>]+src="([^">]*uploads[^"]*)"[^>]*alt="([^">]*)"/gi;
    let match;
    while ((match = regex.exec(data)) !== null) {
      console.log('Image:', match[1], '| Alt:', match[2]);
    }
  });
}).on('error', err => console.error(err));
