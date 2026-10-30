const https = require('https');

function fetchPage(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    }).on('error', reject);
  });
}

async function main() {
  const res = await fetchPage('https://doknaturalofficial.com/collections/all');
  console.log('Dok all status:', res.status);
  const regex = /<img[^>]+src="([^">]+)"[^>]*>/gi;
  let m;
  const imgs = [];
  while ((m = regex.exec(res.body)) !== null) {
    if (m[1].includes('cdn/shop/files') || m[1].includes('cdn/shop/products')) {
      imgs.push(m[1].startsWith('//') ? 'https:' + m[1] : m[1]);
    }
  }
  console.log('Dok products:', Array.from(new Set(imgs)));
}

main().catch(console.error);
