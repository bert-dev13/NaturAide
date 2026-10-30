const https = require('https');

https.get('https://www.pascuallab.com/products/brands/ascof-lagundi', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    // Look for all product links or pagination
    const prodLinks = data.match(/href="([^"]*products\/[^"]*)"/g) || [];
    console.log('All product links on ascof-lagundi:', Array.from(new Set(prodLinks)));
  });
}).on('error', err => console.error(err));
