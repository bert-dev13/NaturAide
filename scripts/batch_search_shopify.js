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
          resolve({ status: res.statusCode, raw: data.slice(0, 100) });
        }
      });
    }).on('error', reject);
  });
}

const SEARCH_TERMS = [
  'RiteMed Lagundi',
  'Plemex',
  'Re-Leaf',
  'Propan Fit',
  'Actimed',
  'Golden Spoon',
  'Charantia',
  'Ampalaya',
  'Sambong',
  'Lagundi',
  'Akapulko',
  'Bayabas',
  'Guavidone',
  'Lakapulko',
  'Nutra Heal',
  'Ofplemed',
  'Herbakid',
  'Kidneygen',
  'Nocof',
  'Rhenalaid',
  'Super Leaf',
  'Uricare',
  'Urisam',
  'Wilson',
  'BelleVine',
  'Better Ampalaya',
  'Bitteractive',
  'Diavit',
  'Docteur',
  'Dok Natural',
  'Flavonpro',
  'Phlemalis',
  'Lagunmeric',
  'Naturemed',
  'PITAHC',
  'Total Wellness',
  'Triherbgi'
];

async function searchDomain(domain) {
  console.log(`\n=================== SEARCHING ${domain} ===================`);
  for (const term of SEARCH_TERMS) {
    const url = `https://${domain}/search/suggest.json?q=${encodeURIComponent(term)}&resources[type]=product&resources[limit]=4`;
    const res = await fetchJson(url);
    if (res.json && res.json.resources && res.json.resources.results) {
      const prods = res.json.resources.results.products || [];
      const relevant = prods.filter(p => {
        const t = p.title.toLowerCase();
        return t.includes('lagundi') || t.includes('sambong') || t.includes('ampalaya') ||
               t.includes('garlic') || t.includes('guava') || t.includes('bayabas') ||
               t.includes('akapulko') || t.includes('yerba') || t.includes('pansit') ||
               t.includes('tsaang') || t.includes(term.toLowerCase());
      });
      if (relevant.length > 0) {
        console.log(`[${term}] -> ${relevant.length} matches:`);
        relevant.forEach(p => console.log(`   * ${p.title} | ${p.url} | ${p.image}`));
      }
    }
  }
}

async function main() {
  await searchDomain('southstardrug.com.ph');
  await searchDomain('shopsuki.ph');
}

main().catch(console.error);
