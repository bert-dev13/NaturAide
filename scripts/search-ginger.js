async function searchGinger() {
  const sUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent('"Zingiber officinale"[Title] AND ("nausea" OR "anti-inflammatory" OR "bioactive" OR "rhizome")')}&retmode=json&retmax=4`;
  const sRes = await fetch(sUrl, { headers: { "User-Agent": "NatureAide-Auditor/1.0" } });
  const sData = await sRes.json();
  const idList = sData.esearchresult?.idlist || [];
  console.log("Ginger PMIDs:", idList);

  for (const id of idList) {
    const sumUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${id}&retmode=json`;
    const sumRes = await fetch(sumUrl, { headers: { "User-Agent": "NatureAide-Auditor/1.0" } });
    const sumData = await sumRes.json();
    const item = sumData.result[id];
    const doi = item?.articleids?.find(a => a.idtype === "doi")?.value;
    console.log(`PMID: ${id} | Title: ${item?.title} | Journal: ${item?.source} (${item?.pubdate}) | DOI: ${doi}`);
  }
}
searchGinger();
