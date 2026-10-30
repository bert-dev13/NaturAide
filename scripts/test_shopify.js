const https = require('https');

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, json: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data.slice(0, 200) });
        }
      });
    }).on('error', reject);
  });
}

async function testShopifySuggest(domain, query) {
  const url = `https://${domain}/search/suggest.json?q=${encodeURIComponent(query)}&resources[type]=product&resources[limit]=5`;
  const res = await fetchJson(url);
  console.log(`${domain} suggest "${query}": status ${res.status}`);
  if (res.json && res.json.resources && res.json.resources.results) {
    const products = res.json.resources.results.products || [];
    console.log(`Found ${products.length} products:`);
    for (const p of products) {
      console.log(` - ${p.title} | ${p.url} | ${p.image}`);
    }
  }
}

async function main() {
  await testShopifySuggest('shopsuki.ph', 'Propan Fit');
  await testShopifySuggest('shopsuki.ph', 'Lagundi');
  await testShopifySuggest('shopsuki.ph', 'Sambong');
  await testShopifySuggest('southstardrug.com.ph', 'Propan Fit');
  await testShopifySuggest('southstardrug.com.ph', 'Lagundi');
  await testShopifySuggest('southstardrug.com.ph', 'Sambong');
  await testShopifySuggest('southstardrug.com.ph', 'Charantia');
}

main().catch(console.error);
