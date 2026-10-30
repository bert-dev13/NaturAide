const https = require('https');

https.get('https://www.pascuallab.com/', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Homepage status:', res.statusCode);
    const hrefs = data.match(/href="([^"]+)"/g) || [];
    const productHrefs = hrefs.filter(h => h.includes('product') || h.includes('brand') || h.includes('ascof'));
    console.log('Product/Brand hrefs on homepage:', Array.from(new Set(productHrefs)));
    
    // Also look for images on homepage
    const imgs = data.match(/src="([^"]+uploads[^"]+)"/g) || [];
    console.log('Uploads images on homepage:', Array.from(new Set(imgs)).slice(0, 10));
  });
}).on('error', err => console.error(err));
