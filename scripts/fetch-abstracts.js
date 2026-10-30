async function fetchAbstracts(pmids) {
  const url = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=${pmids.join(",")}&retmode=xml`;
  const res = await fetch(url, { headers: { "User-Agent": "NatureAide-ReferenceAuditor/1.0" } });
  const xml = await res.text();
  return xml;
}

async function main() {
  const pmids = [
    "41901208", // Sambong RA
    "41938535", // Sambong EVs
    "42452264", // Thai plants
    "42701137", // PLGA scaffold
    "42731575", // Sambong flavonoids
    "42865278", // Ginger mass spec
    "42871579", // MUVZ subchronic
    "42892104", // Echinacea + Ginger
    "34899301", // Tsaang Gubat diarrhea
    "40642788", // Ehretia microphylla
    "42480396", // GV22202 knee OA
    "42467280", // Herbal phytochemicals
    "42796795", // Mentha spicata
    "42883338"  // Sacha Inchi
  ];

  const xml = await fetchAbstracts(pmids);
  // Parse articles
  const articles = xml.split("<PubmedArticle>");
  console.log(`Parsed ${articles.length - 1} articles from PubMed XML.`);

  for (let i = 1; i < articles.length; i++) {
    const art = articles[i];
    const pmidMatch = art.match(/<PMID[^>]*>(\d+)<\/PMID>/);
    const pmid = pmidMatch ? pmidMatch[1] : "unknown";
    const titleMatch = art.match(/<ArticleTitle>([\s\S]*?)<\/ArticleTitle>/);
    const title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, "").trim() : "";
    const abstractMatch = art.match(/<AbstractText[^>]*>([\s\S]*?)<\/AbstractText>/g);
    const abstract = abstractMatch ? abstractMatch.map(m => m.replace(/<[^>]+>/g, "").trim()).join(" ") : "No abstract";

    console.log(`\n============================================================`);
    console.log(`PMID: ${pmid}`);
    console.log(`Title: ${title}`);
    console.log(`Abstract Snippet: ${abstract.slice(0, 350)}...`);
  }
}
main();
