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
  try {
    const diavit = await fetchPage('https://diavitherbs.org');
    console.log('Diavit status:', diavit.status, 'body len:', diavit.body.length);
    const diavitImgs = diavit.body.match(/https?:\/\/[^"'\s]+\.(?:png|jpg|jpeg|webp)/gi) || [];
    console.log('Diavit images:', Array.from(new Set(diavitImgs)).slice(0, 5));
  } catch (e) {
    console.log('Diavit err:', e.message);
  }

  try {
    const dok = await fetchPage('https://doknaturalofficial.com');
    console.log('Dok Natural status:', dok.status, 'body len:', dok.body.length);
    const dokImgs = dok.body.match(/https?:\/\/[^"'\s]+\.(?:png|jpg|jpeg|webp)/gi) || [];
    console.log('Dok Natural images:', Array.from(new Set(dokImgs)).slice(0, 5));
  } catch (e) {
    console.log('Dok err:', e.message);
  }
}

main().catch(console.error);
