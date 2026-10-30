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

async function findRiteMed() {
  const res = await fetchPage('https://www.ritemed.com.ph/search?q=lagundi');
  console.log('Search lagundi status:', res.status);
  // Match all product links and images
  const regex = /<a[^>]+href="(\/products\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
  let m;
  const items = [];
  while ((m = regex.exec(res.body)) !== null) {
    const link = m[1];
    const html = m[2];
    const imgMatch = html.match(/src="([^"]+)"/);
    items.push({ link, img: imgMatch ? imgMatch[1] : null, text: html.replace(/<[^>]+>/g, '').trim() });
  }
  console.log('Items:', items);
}

findRiteMed().catch(console.error);
