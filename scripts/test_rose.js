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

async function searchRose(term) {
  const url = `https://www.rosepharmacy.com/?s=${encodeURIComponent(term)}&post_type=product`;
  const res = await fetchPage(url);
  console.log(`Rose Pharmacy search "${term}": Status ${res.status}`);
  const imgMatches = res.body.match(/https?:\/\/[^"'\s]+\.(?:png|jpg|jpeg|webp)/gi) || [];
  const uploads = imgMatches.filter(img => img.includes('wp-content/uploads'));
  console.log('Uploads:', Array.from(new Set(uploads)).slice(0, 5));
}

async function main() {
  await searchRose('Lagundi');
  await searchRose('Sambong');
  await searchRose('Plemex');
}

main().catch(console.error);
