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

async function searchShopSuki(term) {
  const url = `https://shopsuki.ph/search?q=${encodeURIComponent(term)}&type=product`;
  const res = await fetchPage(url);
  console.log(`ShopSuki "${term}": Status ${res.status}`);
  // Extract products
  const regex = /<a[^>]+href="(\/products\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
  let m;
  const items = new Map();
  while ((m = regex.exec(res.body)) !== null) {
    const link = m[1];
    const html = m[2];
    const imgMatch = html.match(/src="([^"]+)"/);
    const titleMatch = html.match(/class="[^"]*product[^"]*title[^"]*"[^>]*>([^<]+)</i) || html.match(/<span[^>]*>([^<]+)<\/span>/i);
    const title = titleMatch ? titleMatch[1].trim() : html.replace(/<[^>]+>/g, '').trim();
    if (imgMatch && !items.has(link)) {
      items.set(link, { link: 'https://shopsuki.ph' + link, title, img: imgMatch[1].startsWith('//') ? 'https:' + imgMatch[1] : imgMatch[1] });
    }
  }
  for (const item of items.values()) {
    console.log(item.title, '-->', item.link, '-->', item.img);
  }
}

async function main() {
  await searchShopSuki('Propan Fit');
  await searchShopSuki('Golden Spoon');
  await searchShopSuki('Lagundi');
  await searchShopSuki('Sambong');
}

main().catch(console.error);
