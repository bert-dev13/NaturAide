const https = require('https');

function fetchPage(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(fetchPage(res.headers.location));
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    }).on('error', reject);
  });
}

async function main() {
  const res = await fetchPage('https://medsgo.ph/search/?search=Lagundi');
  console.log('Status:', res.status, 'Body len:', res.body.length);
  // Extract product cards: title, link, image
  const cardRegex = /<div class="product-thumb[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/gi;
  const cards = res.body.match(cardRegex) || [];
  console.log('Product cards found:', cards.length);
  for (const card of cards.slice(0, 10)) {
    const titleMatch = card.match(/<h4><a href="([^"]+)">([^<]+)<\/a><\/h4>/i);
    const imgMatch = card.match(/<img[^>]+src="([^">]+)"/i);
    if (titleMatch && imgMatch) {
      console.log('Product:', titleMatch[2].trim(), '| Img:', imgMatch[1], '| Link:', titleMatch[1]);
    }
  }
}

main().catch(console.error);
