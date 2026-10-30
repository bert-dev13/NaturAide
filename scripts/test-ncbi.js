async function checkNCBI(pmids) {
  const url = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${pmids.join(",")}&retmode=json`;
  const res = await fetch(url, { headers: { "User-Agent": "NatureAide-ReferenceAuditor/1.0" } });
  const data = await res.json();
  return data.result;
}

async function main() {
  const testPmids = ["30000845", "41901208", "42701137", "42816981", "29684534", "34899301"];
  const res = await checkNCBI(testPmids);
  for (const pmid of testPmids) {
    const item = res[pmid];
    if (!item) {
      console.log(`PMID ${pmid}: NOT FOUND`);
      continue;
    }
    const doiObj = item.articleids?.find(a => a.idtype === "doi");
    console.log(`PMID: ${pmid}`);
    console.log(`  Title: ${item.title}`);
    console.log(`  Source: ${item.source}`);
    console.log(`  PubDate: ${item.pubdate}`);
    console.log(`  DOI: ${doiObj ? doiObj.value : "none"}`);
    console.log(`  Authors: ${item.authors?.map(a => a.name).join(", ")}`);
  }
}
main();
