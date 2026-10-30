async function searchRealPubMed(term) {
  const sUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(term)}&retmode=json&retmax=5`;
  const sRes = await fetch(sUrl, { headers: { "User-Agent": "NatureAide-Auditor/1.0" } });
  const sData = await sRes.json();
  const idList = sData.esearchresult.idlist;
  if (!idList || idList.length === 0) return [];

  const sumUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${idList.join(",")}&retmode=json`;
  const sumRes = await fetch(sumUrl, { headers: { "User-Agent": "NatureAide-Auditor/1.0" } });
  const sumData = await sumRes.json();
  return idList.map(id => sumData.result[id]);
}

async function main() {
  console.log("=== Real PubMed search for Vitex negundo (Lagundi) ===");
  const vn = await searchRealPubMed("Vitex negundo cough OR bronchodilator OR leaf");
  for (const item of vn) {
    const doi = item.articleids?.find(a => a.idtype === "doi")?.value;
    console.log(`PMID: ${item.uid} | Title: ${item.title} | Journal: ${item.source} (${item.pubdate}) | DOI: ${doi}`);
  }

  console.log("\n=== Real PubMed search for Zingiber officinale (Ginger) ===");
  const zo = await searchRealPubMed("Zingiber officinale nausea OR digestive OR review");
  for (const item of zo) {
    const doi = item.articleids?.find(a => a.idtype === "doi")?.value;
    console.log(`PMID: ${item.uid} | Title: ${item.title} | Journal: ${item.source} (${item.pubdate}) | DOI: ${doi}`);
  }

  console.log("\n=== Real PubMed search for Clinopodium douglasii / Mentha cordifolia (Yerba Buena) ===");
  const yb = await searchRealPubMed('"Clinopodium douglasii" OR "Mentha cordifolia"');
  for (const item of yb) {
    const doi = item.articleids?.find(a => a.idtype === "doi")?.value;
    console.log(`PMID: ${item.uid} | Title: ${item.title} | Journal: ${item.source} (${item.pubdate}) | DOI: ${doi}`);
  }
}
main();
