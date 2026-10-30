const https = require('https');

function getJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'NatureAide-Research/1.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error('JSON parse error: ' + data.substring(0, 200)));
        }
      });
    }).on('error', reject);
  });
}

async function ncbiSearch(term, retmax = 5) {
  const url = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(term)}&retmode=json&retmax=${retmax}`;
  const res = await getJson(url);
  return res.esearchresult.idlist || [];
}

async function ncbiSummary(ids) {
  if (ids.length === 0) return [];
  const url = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${ids.join(',')}&retmode=json`;
  const res = await getJson(url);
  const result = res.result;
  const list = [];
  for (const id of ids) {
    if (result[id]) {
      const item = result[id];
      const authors = (item.authors || []).map(a => a.name).join(', ');
      const pubYear = item.pubdate ? parseInt(item.pubdate.substring(0, 4)) : 2020;
      let doi = '';
      if (item.articleids) {
        const d = item.articleids.find(a => a.idtype === 'doi');
        if (d) doi = d.value;
      }
      list.push({
        pubmedId: id,
        title: item.title,
        authors: authors || 'Research Group',
        publicationYear: pubYear,
        journalOrPublisher: item.source || item.fulljournalname,
        doi: doi,
        sourceUrl: `https://pubmed.ncbi.nlm.nih.gov/${id}/`
      });
    }
  }
  return list;
}

async function main() {
  const queries = {
    // Exact Philippine commercial brands
    ascof: 'Ascof OR "Vitex negundo" syrup NIRPROMP',
    releaf: '"Re-Leaf" OR "Blumea balsamifera" NIRPROMP',
    charantia_brand: 'Charantia "Momordica charantia" capsule',
    
    // Plant species
    ampalaya: '("Momordica charantia"[Title/Abstract]) AND (diabetes OR "blood glucose" OR glycemic OR clinical OR trial)',
    akapulko: '("Senna alata"[Title/Abstract] OR "Cassia alata"[Title/Abstract]) AND (antifungal OR dermatophyte OR tinea OR infection OR clinical)',
    bayabas: '("Psidium guajava"[Title/Abstract]) AND (antiseptic OR antibacterial OR "wound healing" OR mouthwash OR clinical)',
    pansit_pansitan: '("Peperomia pellucida"[Title/Abstract]) AND (hyperuricemia OR "uric acid" OR anti-inflammatory OR analgesic)',
    garlic: '("Allium sativum"[Title/Abstract]) AND (cholesterol OR cardiovascular OR hypertension OR clinical OR trial)',
    banaba: '("Lagerstroemia speciosa"[Title/Abstract]) AND (corosolic OR hypoglycemic OR diabetes OR clinical)',
    tsaang_gubat: '("Carmona retusa"[Title/Abstract] OR "Ehretia microphylla"[Title/Abstract]) AND (antispasmodic OR antibacterial OR anti-inflammatory)',
    yerba_buena: '("Clinopodium douglasii"[Title/Abstract] OR "Satureja douglasii"[Title/Abstract] OR "Micromeria douglasii"[Title/Abstract]) AND (analgesic OR anti-inflammatory)'
  };

  for (const [key, q] of Object.entries(queries)) {
    console.log(`\n=== Searching ${key} ===`);
    const ids = await ncbiSearch(q, 3);
    console.log(`Found PMIDs: ${ids.join(', ')}`);
    const summaries = await ncbiSummary(ids);
    summaries.forEach(s => {
      console.log(`- PMID: ${s.pubmedId} (${s.publicationYear}) | ${s.journalOrPublisher}`);
      console.log(`  Title: ${s.title}`);
      console.log(`  DOI: ${s.doi}`);
    });
    // Sleep 400ms to respect NCBI rate limit (max 3 req/sec)
    await new Promise(r => setTimeout(r, 500));
  }
}

main().catch(console.error);
