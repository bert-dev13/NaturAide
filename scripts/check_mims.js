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
  const res = await fetchPage('https://www.mims.com/philippines/drug/info/plemex-plemex%20forte');
  console.log('Status:', res.status, 'Body len:', res.body.length);
  const imgs = res.body.match(/https?:\/\/[^"'\s]+\.(?:png|jpg|jpeg)/gi) || [];
  console.log('Images:', Array.from(new Set(imgs)).filter(img => img.includes('product') || img.includes('drug') || img.includes('mims')));
}

main().catch(console.error);
