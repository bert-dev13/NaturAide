const https = require('https');

https.get('https://www.ritemed.com.ph/products?search=Stop+Cough', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const regex = /<img[^>]+src="([^">]+storage\/app\/uploads\/public\/[^">]+)"[^>]*alt="([^">]*)"/gi;
    let match;
    while ((match = regex.exec(data)) !== null) {
      if (match[2].toLowerCase().includes('cough') || match[2].toLowerCase().includes('lagundi')) {
        console.log('Found:', match[1], '| Alt:', match[2]);
      }
    }
  });
}).on('error', err => console.error(err));
