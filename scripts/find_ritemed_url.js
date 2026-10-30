const https = require('https');

https.get('https://www.ritemed.com.ph/products?q=lagundi', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    const regex = /<img[^>]+src="([^">]+storage\/app\/uploads\/public\/[^">]+)"[^>]*alt="([^">]*)"/gi;
    let match;
    while ((match = regex.exec(data)) !== null) {
      console.log('Found image:', match[1], '| Alt:', match[2]);
    }
    const hrefs = data.match(/href="\/products\/[^"]+"/g);
    console.log('Product links:', hrefs ? Array.from(new Set(hrefs)) : 'none');
  });
}).on('error', err => console.error(err));
