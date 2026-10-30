const https = require('https');

https.get('https://www.pascuallab.com/products/brands/ascof-lagundi', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('ASCOF page status:', res.statusCode);
    const regex = /<img[^>]+src="([^">]*uploads[^"]*)"[^>]*alt="([^">]*)"/gi;
    let match;
    while ((match = regex.exec(data)) !== null) {
      console.log('Image:', match[1], '| Alt:', match[2]);
    }
  });
}).on('error', err => console.error(err));
