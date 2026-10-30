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

async function searchTGP(term) {
  const url = `https://tgp.com.ph/search?q=${encodeURIComponent(term)}`;
  const res = await fetchPage(url);
  console.log(`TGP search "${term}": Status ${res.status}`);
  const imgMatches = res.body.match(/https?:\/\/[^"'\s]+\.(?:png|jpg|jpeg|webp)/gi) || [];
  const productImgs = imgMatches.filter(img => img.includes('product') || img.includes('cdn') || img.includes('item'));
  console.log('Images:', Array.from(new Set(productImgs)).slice(0, 5));
}

async function main() {
  await searchTGP('Nocof');
  await searchTGP('Uricare');
}

main().catch(console.error);
