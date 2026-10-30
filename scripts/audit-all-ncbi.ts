import pool from "../src/lib/db";

async function checkAll() {
  const [rows]: any = await pool.query("SELECT * FROM scientific_references");
  const pmids = rows.map((r: any) => r.pubmedId).filter((p: any) => p && /^\d+$/.test(p.trim()));
  const uniquePmids = [...new Set(pmids)];

  console.log(`Auditing ${uniquePmids.length} unique PMIDs against official NCBI PubMed API...\n`);

  const url = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${uniquePmids.join(",")}&retmode=json`;
  const res = await fetch(url, { headers: { "User-Agent": "NatureAide-ReferenceAuditor/1.0" } });
  const data = await res.json();
  const ncbiResults = data.result || {};

  for (const r of rows) {
    const pmid = r.pubmedId?.trim();
    const ncbi = ncbiResults[pmid];
    console.log(`================================================================================`);
    console.log(`ID: ${r.id}`);
    console.log(`Target Plant: ${r.plantOrIngredientStudied}`);
    console.log(`Stored Title: ${r.title}`);
    console.log(`Stored PMID: ${r.pubmedId} | Stored DOI: ${r.doi}`);
    console.log(`Stored Authors: ${r.authors} | Year: ${r.publicationYear} | Journal: ${r.journalOrPublisher}`);

    if (!ncbi) {
      console.log(`>>> NCBI RESULT: NOT FOUND in PubMed (Invalid PMID)`);
    } else {
      const doiObj = ncbi.articleids?.find((a: any) => a.idtype === "doi");
      console.log(`>>> REAL NCBI PUBMED METADATA:`);
      console.log(`    PMID: ${ncbi.uid}`);
      console.log(`    Exact Title: ${ncbi.title}`);
      console.log(`    Source/Journal: ${ncbi.source}`);
      console.log(`    PubDate: ${ncbi.pubdate}`);
      console.log(`    Real DOI: ${doiObj ? doiObj.value : "None"}`);
      console.log(`    Authors: ${ncbi.authors?.map((a: any) => a.name).join(", ")}`);
    }
  }

  process.exit(0);
}

checkAll().catch(err => {
  console.error(err);
  process.exit(1);
});
