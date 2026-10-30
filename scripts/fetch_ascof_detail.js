const https = require('https');

https.get('https://www.pascuallab.com/products/ascof-lagundi', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    const regex = /<img[^>]+src="([^">]*uploads[^"]*)"[^>]*alt="([^">]*)"/gi;
    let match;
    while ((match = regex.exec(data)) !== null) {
      console.log('Image:', match[1], '| Alt:', match[2]);
    }
    const imgs = data.match(/src="([^"]+uploads[^"]+)"/g) || [];
    console.log('Uploads on this page:', Array.from(new Set(imgs)));
  });
}).on('error', err => console.error(err));
