async function checkTop() {
  const pmids = [
    "30000845",
    "41901208",
    "41938535",
    "42452264",
    "42701137",
    "42731575",
    "42816981",
    "42865278",
    "42871579",
    "42892104",
    "33897419",
    "31147412"
  ];

  const url = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${pmids.join(",")}&retmode=json`;
  const res = await fetch(url, { headers: { "User-Agent": "NatureAide-ReferenceAuditor/1.0" } });
  const data = await res.json();
  const ncbiResults = data.result || {};

  for (const pmid of pmids) {
    const ncbi = ncbiResults[pmid];
    console.log(`==================================================`);
    console.log(`PMID: ${pmid}`);
    if (!ncbi) {
      console.log(`NOT FOUND`);
    } else {
      const doiObj = ncbi.articleids?.find((a) => a.idtype === "doi");
      console.log(`Title: ${ncbi.title}`);
      console.log(`Journal: ${ncbi.source} (${ncbi.pubdate})`);
      console.log(`DOI: ${doiObj ? doiObj.value : "None"}`);
      console.log(`Authors: ${ncbi.authors?.map(a => a.name).join(", ")}`);
    }
  }
}
checkTop();
