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

async function searchSpecific() {
  const targets = [
    { name: 'yerba_buena_philippines', q: '("Clinopodium" OR "Satureja" OR "Mentha cordifolia") AND ("Philippines" OR "analgesic" OR "pain")' },
    { name: 'yerba_buena_clinopodium', q: 'Clinopodium douglasii' },
    { name: 'yerba_buena_mentha_cordifolia', q: 'Mentha cordifolia' },
    { name: 'akapulko_antifungal', q: '("Senna alata" OR "Cassia alata") AND (antifungal OR dermatophyte OR ringworm OR tinea)' },
    { name: 'bayabas_antibacterial', q: '("Psidium guajava") AND (antibacterial OR wound OR antiseptic OR mouthwash)' },
    { name: 'garlic_cardio', q: '("Allium sativum" OR garlic) AND (antihypertensive OR cholesterol OR lipid) AND clinical' }
  ];

  for (const t of targets) {
    console.log(`\nTarget: ${t.name}`);
    const ids = await ncbiSearch(t.q, 4);
    console.log('PMIDs:', ids);
    const sum = await ncbiSummary(ids);
    sum.forEach(s => {
      console.log(`- [PMID ${s.pubmedId}] (${s.publicationYear}) ${s.title} [${s.journalOrPublisher}] DOI: ${s.doi}`);
    });
    await new Promise(r => setTimeout(r, 500));
  }
}

searchSpecific().catch(console.error);
