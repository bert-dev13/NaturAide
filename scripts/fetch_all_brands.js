const https = require('https');

https.get('https://www.pascuallab.com/products/brands/all', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    const regex = /<img[^>]+src="([^">]*uploads[^"]*)"[^>]*alt="([^">]*)"/gi;
    let match;
    while ((match = regex.exec(data)) !== null) {
      console.log('Brand item:', match[1], '| Alt:', match[2]);
    }
    const links = data.match(/href="https:\/\/www\.pascuallab\.com\/products\/[^"]+"/g) || [];
    console.log('All product links:', Array.from(new Set(links)));
  });
}).on('error', err => console.error(err));
