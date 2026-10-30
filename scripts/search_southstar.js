const https = require('https');

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({ status: res.statusCode, headers: res.headers, body: data });
      });
    }).on('error', reject);
  });
}

async function searchSouthstar(term) {
  const url = `https://southstardrug.com.ph/search?q=${encodeURIComponent(term)}&type=product`;
  const res = await fetchJson(url);
  console.log(`Southstar search "${term}": Status ${res.status}`);
  // Find product links and images
  const itemRegex = /<a[^>]+href="(\/products\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
  let match;
  const items = [];
  while ((match = itemRegex.exec(res.body)) !== null) {
    const link = match[1];
    const text = match[2];
    const imgMatch = text.match(/src="([^"]+)"/);
    if (imgMatch) {
      items.push({ link, img: imgMatch[1], title: text.replace(/<[^>]+>/g, '').trim().replace(/\s+/g, ' ') });
    }
  }
  console.log(`Items found (${items.length}):`);
  items.slice(0, 4).forEach(it => console.log(' - ' + it.link + ' | ' + it.img));
}

async function main() {
  await searchSouthstar('Plemex Forte');
  await searchSouthstar('RiteMed Lagundi');
  await searchSouthstar('Charantia');
  await searchSouthstar('Propan Fit');
  await searchSouthstar('Re-Leaf');
}

main().catch(console.error);
