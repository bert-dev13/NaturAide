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

async function checkPlemex() {
  for (const url of [
    'https://www.rosepharmacy.com/product/plemex-forte-600mg5ml-syrup-120ml/',
    'https://www.rosepharmacy.com/product/plemex-300mg5ml-syrup-60ml/'
  ]) {
    const res = await fetchPage(url);
    console.log(url, 'Status:', res.status);
    const imgMatches = res.body.match(/https?:\/\/www\.rosepharmacy\.com\/[^"'\s]+\.(?:png|jpg|jpeg|webp)/gi) || [];
    const prodImgs = imgMatches.filter(i => i.includes('uploads'));
    console.log('Images for', url, ':', Array.from(new Set(prodImgs)));
  }
}

checkPlemex().catch(console.error);
