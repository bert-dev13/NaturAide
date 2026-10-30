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

async function findProducts(term) {
  const url = `https://www.rosepharmacy.com/?s=${encodeURIComponent(term)}&post_type=product`;
  const res = await fetchPage(url);
  const regex = /<a[^>]+href="(https:\/\/www\.rosepharmacy\.com\/product\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
  let m;
  const found = new Map();
  while ((m = regex.exec(res.body)) !== null) {
    const link = m[1];
    const html = m[2];
    const text = html.replace(/<[^>]+>/g, '').trim();
    if (text && !found.has(link)) {
      found.set(link, { link, title: text });
    }
  }
  console.log(`=== "${term}" (${found.size} found) ===`);
  for (const item of found.values()) {
    console.log(item.title, '-->', item.link);
  }
}

async function main() {
  await findProducts('Garlic');
  await findProducts('Propan');
  await findProducts('RiteMed');
  await findProducts('Akapulko');
  await findProducts('Guava');
  await findProducts('Bayabas');
}

main().catch(console.error);
