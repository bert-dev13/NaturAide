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
  const diavit = await fetchPage('https://diavitherbs.org');
  const diavitImgs = diavit.body.match(/https?:\/\/[^"'\s]+\.(?:png|jpg|jpeg|webp)/gi) || [];
  console.log('=== DIAVIT ALL UPLOADS ===');
  console.log(Array.from(new Set(diavitImgs.filter(i => i.includes('uploads')))));

  const dok = await fetchPage('https://doknaturalofficial.com');
  const dokImgs = dok.body.match(/https?:\/\/[^"'\s]+\.(?:png|jpg|jpeg|webp)/gi) || [];
  console.log('=== DOK NATURAL ALL FILES ===');
  console.log(Array.from(new Set(dokImgs.filter(i => i.includes('files') || i.includes('products')))));
}

main().catch(console.error);
