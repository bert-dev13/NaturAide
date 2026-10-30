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

async function inspectRoseProducts(term) {
  const url = `https://www.rosepharmacy.com/?s=${encodeURIComponent(term)}&post_type=product`;
  const res = await fetchPage(url);
  // Match product title, link, and image
  const productRegex = /<li[^>]+class="[^"]*product[^"]*"[\s\S]*?<\/li>/gi;
  const products = res.body.match(productRegex) || [];
  console.log(`Rose Pharmacy "${term}": Found ${products.length} products`);
  for (const p of products) {
    const titleMatch = p.match(/<h2[^>]*class="[^"]*woocommerce-loop-product__title[^"]*"[^>]*>([^<]+)<\/h2>/i) ||
                       p.match(/<h3[^>]*>([^<]+)<\/h3>/i) ||
                       p.match(/<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i);
    const imgMatch = p.match(/<img[^>]+src="([^">]+)"/i);
    const linkMatch = p.match(/<a[^>]+href="([^"]+)"/i);
    console.log({
      title: titleMatch ? (titleMatch[1] || titleMatch[2]).replace(/<[^>]+>/g, '').trim() : 'Unknown',
      img: imgMatch ? imgMatch[1] : 'No img',
      link: linkMatch ? linkMatch[1] : 'No link'
    });
  }
}

async function main() {
  await inspectRoseProducts('Plemex');
  await inspectRoseProducts('Lagundi');
  await inspectRoseProducts('Sambong');
  await inspectRoseProducts('Propan Fit');
  await inspectRoseProducts('Ampalaya');
}

main().catch(console.error);
