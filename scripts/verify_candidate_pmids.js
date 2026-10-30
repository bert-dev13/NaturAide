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

async function verifyCandidates() {
  const pmidsToVerify = [
    // Ampalaya (Momordica charantia)
    '42654229', // Glycemic and Lipid Outcomes Associated with Bitter Melon Blood-Sugar-Modulating Protein and Metformin Use: A Translational Preclinical and Retrospective Study
    '42510570', // Momordica charantia L.: Nutritional Composition, Advanced Extraction Methods, Phytochemistry, Molecular Mechanisms and Industrial Applications
    '33488261', // Comparison of antioxidant capacities and antioxidant components of commercial bitter melon (Momordica charantia L.) products
    
    // Akapulko (Senna alata)
    '42390694', // Antifungal activity of rhein against Candida albicans with insights into its mechanism of action
    '39952420', // HPLC-ESI-QTOF-MS profiling of antibacterial bioactive solvent fractions of Senna alata (L.) roxb (Fabaceae) leaves
    '39381590', // Review on Cassia alata Bioactive Compounds: In silico, in vitro, and in vivo Studies
    
    // Bayabas (Psidium guajava)
    '42375034', // Antibacterial Activities of Guava (Psidium guajava) Leaf Aqueous Extract Against Staphylococcus aureus and Escherichia coli
    '42743154', // A combined aqueous extract of Psidium guajava L. and Tithonia diversifolia improves metabolic homeostasis and preserves intestinal integrity in colibacillosis
    '42381972', // A Review of Medicinal Plants from the Anak Dalam Tribe of Jambi: An Evaluation of Their Potential for Diabetic Wound Healing Effects
    
    // Pansit-pansitan (Peperomia pellucida)
    '40630672', // Peperomia Pellucida (L.) Kunth: A Decade of Ethnopharmacological, Phytochemical, and Pharmacological Insights (2014-2025)
    '41788793', // Formulation and in vitro evaluation of an anti-inflammatory herbal suppository containing Peperomia pellucida
    '40156794', // Anti-arthritis Activity of Methanol Extract of Peperomia pellucida in Complete Freund's Adjuvant Induced Arthritis in Wistar Rats
    
    // Bawang (Allium sativum)
    '42577101', // Effects of aged black garlic (ABG10+(®)) on lipoprotein subclass composition in Grade I hypertension: a randomized, triple-blind controlled trial
    '42654176', // Protective Effects of Allicin and Garlic-Derived Interventions Against Metabolic Dysfunction-Associated Steatotic Liver Disease
    '31105436', // The Effects of Garlic on Blood Pressure in Patients with Arterial Hypertension: A Systematic Review and Meta-Analysis
    
    // Banaba (Lagerstroemia speciosa)
    '41929254', // A review of the pharmacological mechanism of corosolic acid
    '42062337', // Toxicological evaluation of Lagerstroemia speciosa (L.) Martyn and Lagerstroemia tomentosa C.Presl extracts using a liver organ-on-a-chip system
    '41852760', // Protective effects of Lagerstroemia speciosa against paracetamol-induced renal and testicular toxicity in rats via antioxidant, anti-inflammatory, and anti-apoptotic mechanisms
    
    // Yerba Buena (Clinopodium / Mentha)
    '41297727', // Antinociceptive efficacy, chemistry, potential toxicity, and quality control procedures of Clinopodium macrostemum and Clinopodium mexicanum: A comparative analysis
    '42356494', // Current Knowledge of the Genus Satureja: A Comprehensive Review of Its Traditional Use, Phytochemistry, Pharmacological Activity and Non-Medical Applications
    '42764824'  // Ethnomedicinal plants for pain and inflammation in Malakand Top, Pakistan: an ethnopharmacological and in silico evaluation
  ];

  console.log(`Verifying ${pmidsToVerify.length} candidate PMIDs...`);
  const summaries = await ncbiSummary(pmidsToVerify);
  console.log(JSON.stringify(summaries, null, 2));
}

verifyCandidates().catch(console.error);
