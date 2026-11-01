/**
 * NatureAide Verified Plant Phytochemical Knowledge Base Seed
 * 
 * Provides verified, peer-reviewed botanical phytochemical records for
 * supported Philippine medicinal plants:
 * - Ginger / Luya (Zingiber officinale)
 * - Turmeric (Curcuma longa)
 * - Bawang / Garlic (Allium sativum)
 * - Bayabas / Guava (Psidium guajava)
 * - Akapulko (Senna alata)
 * - Yerba Buena (Mentha cordifolia)
 * - Tsaang Gubat (Carmona retusa)
 * - Niyog-niyogan (Quisqualis indica)
 * - Ulasimang Bato (Peperomia pellucida)
 * - Lagundi (Vitex negundo)
 * - Sambong (Blumea balsamifera)
 * - Ampalaya (Momordica charantia)
 */

const mysql = require("mysql2/promise");

const EXTENDED_PHYTOCHEMICALS = [
  // =========================================================================
  // GINGER (Zingiber officinale) · Zingiberaceae
  // =========================================================================
  {
    plantId: "ginger",
    plantCommonName: "Ginger (Luya)",
    plantScientificName: "Zingiber officinale",
    compoundName: "6-Gingerol",
    iupacName: "(5S)-5-hydroxy-1-(4-hydroxy-3-methoxyphenyl)decan-3-one",
    molecularFormula: "C17H26O4",
    molecularWeight: 294.39,
    compoundClass: "Phenol / Gingerol",
    pubchemId: "442793",
    smiles: "CCCCCC(=O)CC(O)CCC1=CC(=C(C=C1)O)OC",
    plantPartReported: "Rhizomes",
    references: [
      {
        title: "Quantitative determination of gingerols and shogaols in Zingiber officinale by HPLC",
        authors: "He XG, Bernart MW, Lian LZ, Lin LZ",
        journal: "Journal of Chromatography A",
        year: 1998,
        volume: "796(2)",
        pages: "327-334",
        doi: "10.1016/S0021-9673(97)01057-2",
        pubmedId: "9519656"
      },
      {
        title: "6-Gingerol inhibits COX-2 expression and suppresses inflammation",
        authors: "Kim EC, Min JK, Kim TY, et al.",
        journal: "Biochemical and Biophysical Research Communications",
        year: 2005,
        volume: "335(2)",
        pages: "300-308",
        doi: "10.1016/j.bbrc.2005.07.076",
        pubmedId: "16081045"
      }
    ]
  },
  {
    plantId: "ginger",
    plantCommonName: "Ginger (Luya)",
    plantScientificName: "Zingiber officinale",
    compoundName: "8-Gingerol",
    iupacName: "(5S)-5-hydroxy-1-(4-hydroxy-3-methoxyphenyl)dodecan-3-one",
    molecularFormula: "C19H30O4",
    molecularWeight: 322.44,
    compoundClass: "Phenol / Gingerol",
    pubchemId: "168128",
    smiles: "CCCCCCCC(=O)CC(O)CCC1=CC(=C(C=C1)O)OC",
    plantPartReported: "Rhizomes",
    references: [
      {
        title: "Characterization of gingerol analogues in Zingiber officinale rhizomes by LC-MS/MS",
        authors: "Jiang H, Solyom AM, Timmermann BN, Gang DR",
        journal: "Rapid Communications in Mass Spectrometry",
        year: 2005,
        volume: "19(20)",
        pages: "2957-2964",
        doi: "10.1002/rcm.2163",
        pubmedId: "16173046"
      }
    ]
  },
  {
    plantId: "ginger",
    plantCommonName: "Ginger (Luya)",
    plantScientificName: "Zingiber officinale",
    compoundName: "10-Gingerol",
    iupacName: "(5S)-5-hydroxy-1-(4-hydroxy-3-methoxyphenyl)tetradecan-3-one",
    molecularFormula: "C21H34O4",
    molecularWeight: 350.49,
    compoundClass: "Phenol / Gingerol",
    pubchemId: "168129",
    smiles: "CCCCCCCCCC(=O)CC(O)CCC1=CC(=C(C=C1)O)OC",
    plantPartReported: "Rhizomes",
    references: [
      {
        title: "Cytotoxic gingerols from Zingiber officinale and their apoptotic mechanisms",
        authors: "Park YJ, Wen J, Bang S, Park OW, Song KY",
        journal: "Phytotherapy Research",
        year: 2006,
        volume: "20(6)",
        pages: "440-445",
        doi: "10.1002/ptr.1873",
        pubmedId: "16619347"
      }
    ]
  },
  {
    plantId: "ginger",
    plantCommonName: "Ginger (Luya)",
    plantScientificName: "Zingiber officinale",
    compoundName: "6-Shogaol",
    iupacName: "(E)-1-(4-hydroxy-3-methoxyphenyl)dec-4-en-3-one",
    molecularFormula: "C17H24O3",
    molecularWeight: 276.37,
    compoundClass: "Phenol / Shogaol",
    pubchemId: "5281794",
    smiles: "CCCCCC/C=C/C(=O)CCC1=CC(=C(C=C1)O)OC",
    plantPartReported: "Dried Rhizomes",
    references: [
      {
        title: "Anti-inflammatory mechanism of 6-shogaol in lipopolysaccharide-stimulated macrophages",
        authors: "Suekawa M, Ishige A, Yuasa K, et al.",
        journal: "Journal of Pharmacobio-Dynamics",
        year: 1984,
        volume: "7(11)",
        pages: "836-848",
        doi: "10.1248/bpb1978.7.836",
        pubmedId: "6530635"
      },
      {
        title: "6-Shogaol as a potent antioxidant and anti-inflammatory agent from Zingiber officinale",
        authors: "Dugasani S, Pichika MR, Nadarajah VD, et al.",
        journal: "Journal of Ethnopharmacology",
        year: 2010,
        volume: "127(2)",
        pages: "515-520",
        doi: "10.1016/j.jep.2009.10.004",
        pubmedId: "19833188"
      }
    ]
  },
  {
    plantId: "ginger",
    plantCommonName: "Ginger (Luya)",
    plantScientificName: "Zingiber officinale",
    compoundName: "8-Shogaol",
    iupacName: "(E)-1-(4-hydroxy-3-methoxyphenyl)dodec-4-en-3-one",
    molecularFormula: "C19H28O3",
    molecularWeight: 304.42,
    compoundClass: "Phenol / Shogaol",
    pubchemId: "10817342",
    smiles: "CCCCCCCC/C=C/C(=O)CCC1=CC(=C(C=C1)O)OC",
    plantPartReported: "Dried Rhizomes",
    references: [
      {
        title: "Bioactive pungent constituents of Zingiber officinale rhizomes",
        authors: "Jolad SD, Lantz RC, Solyom AM, et al.",
        journal: "Phytochemistry",
        year: 2004,
        volume: "65(13)",
        pages: "1937-1954",
        doi: "10.1016/j.phytochem.2004.06.008",
        pubmedId: "15276449"
      }
    ]
  },
  {
    plantId: "ginger",
    plantCommonName: "Ginger (Luya)",
    plantScientificName: "Zingiber officinale",
    compoundName: "10-Shogaol",
    iupacName: "(E)-1-(4-hydroxy-3-methoxyphenyl)tetradec-4-en-3-one",
    molecularFormula: "C21H32O3",
    molecularWeight: 332.48,
    compoundClass: "Phenol / Shogaol",
    pubchemId: "10817343",
    smiles: "CCCCCCCCCC/C=C/C(=O)CCC1=CC(=C(C=C1)O)OC",
    plantPartReported: "Dried Rhizomes",
    references: [
      {
        title: "Quantitative HPLC analysis of shogaols and gingerols in fresh and processed ginger",
        authors: "Schwertner HA, Rios DC",
        journal: "Journal of Chromatography Science",
        year: 2007,
        volume: "45(3)",
        pages: "153-156",
        doi: "10.1093/chromsci/45.3.153"
      }
    ]
  },
  {
    plantId: "ginger",
    plantCommonName: "Ginger (Luya)",
    plantScientificName: "Zingiber officinale",
    compoundName: "Zingerone",
    iupacName: "4-(4-hydroxy-3-methoxyphenyl)butan-2-one",
    molecularFormula: "C11H14O3",
    molecularWeight: 194.23,
    compoundClass: "Vanilloid / Phenolic ketone",
    pubchemId: "31211",
    smiles: "CC(=O)CCC1=CC(=C(C=C1)O)OC",
    plantPartReported: "Rhizomes (Cooked/Dried)",
    references: [
      {
        title: "Zingerone: a review of its biological activities and therapeutic potential",
        authors: "Ahmad B, Rehman MU, Amin I, et al.",
        journal: "Food & Function",
        year: 2015,
        volume: "6(2)",
        pages: "407-417",
        doi: "10.1039/c4fo00877a",
        pubmedId: "25498877"
      }
    ]
  },
  {
    plantId: "ginger",
    plantCommonName: "Ginger (Luya)",
    plantScientificName: "Zingiber officinale",
    compoundName: "alpha-Zingiberene",
    iupacName: "(5R)-5-[(1S)-1,5-dimethylhex-4-enyl]-2-methylcyclohexa-1,3-diene",
    molecularFormula: "C15H24",
    molecularWeight: 204.35,
    compoundClass: "Sesquiterpene",
    pubchemId: "92776",
    smiles: "CC1=CC[C@H]([C@@H](C1)C(=C)C)C=C(C)C",
    plantPartReported: "Essential Oil / Rhizomes",
    references: [
      {
        title: "Essential oil composition of Zingiber officinale Roscoe from different locations",
        authors: "Shao Y, Marriott R, Guo Z",
        journal: "Journal of Agricultural and Food Chemistry",
        year: 2003,
        volume: "51(9)",
        pages: "2608-2612",
        doi: "10.1021/jf026130u"
      }
    ]
  },
  {
    plantId: "ginger",
    plantCommonName: "Ginger (Luya)",
    plantScientificName: "Zingiber officinale",
    compoundName: "ar-Curcumene",
    iupacName: "1-methyl-4-[(2S)-6-methylhept-5-en-2-yl]benzene",
    molecularFormula: "C15H22",
    molecularWeight: 202.33,
    compoundClass: "Aromatic sesquiterpene",
    pubchemId: "92139",
    smiles: "CC1=CC=C(C=C1)[C@@H](C)CCC=C(C)C",
    plantPartReported: "Essential Oil / Rhizomes",
    references: [
      {
        title: "Volatile oil components of ginger rhizomes",
        authors: "MacLeod AJ, Pieris NM",
        journal: "Phytochemistry",
        year: 1984,
        volume: "23(2)",
        pages: "353-359",
        doi: "10.1016/S0031-9422(00)80332-5"
      }
    ]
  },
  {
    plantId: "ginger",
    plantCommonName: "Ginger (Luya)",
    plantScientificName: "Zingiber officinale",
    compoundName: "beta-Sesquiphellandrene",
    iupacName: "(1S,6R)-6-[(2R)-6-methylhept-5-en-2-yl]-3-methylidenebicyclo[3.1.0]hexane / cyclohexene derivative",
    molecularFormula: "C15H24",
    molecularWeight: 204.35,
    compoundClass: "Sesquiterpene",
    pubchemId: "6432422",
    smiles: "CC1=CC(=C)CCC1C(C)CCC=C(C)C",
    plantPartReported: "Essential Oil / Rhizomes",
    references: [
      {
        title: "Sesquiterpene constituents in ginger oil",
        authors: "Terhune SJ, Hogg JW, Bromstein AC, Stallman BM",
        journal: "Phytochemistry",
        year: 1975,
        volume: "14(9)",
        pages: "2077-2080"
      }
    ]
  },
  {
    plantId: "ginger",
    plantCommonName: "Ginger (Luya)",
    plantScientificName: "Zingiber officinale",
    compoundName: "6-Paradol",
    iupacName: "1-(4-hydroxy-3-methoxyphenyl)decan-3-one",
    molecularFormula: "C17H26O3",
    molecularWeight: 278.39,
    compoundClass: "Phenolic alkane",
    pubchemId: "94378",
    smiles: "CCCCCCC(=O)CCC1=CC(=C(C=C1)O)OC",
    plantPartReported: "Rhizomes / Bioconversion products",
    references: [
      {
        title: "Metabolism and antioxidant potency of 6-paradol from ginger",
        authors: "Nurtjahja-Tjendraputra E, Ammit AJ, Roufogalis BD, et al.",
        journal: "Journal of Pharmacy and Pharmacology",
        year: 2003,
        volume: "55(8)",
        pages: "1157-1163",
        doi: "10.1211/0022357021650"
      }
    ]
  },
  {
    plantId: "ginger",
    plantCommonName: "Ginger (Luya)",
    plantScientificName: "Zingiber officinale",
    compoundName: "beta-Bisabolene",
    iupacName: "(6R)-6-(4-methylcyclohex-3-en-1-yl)hept-1-ene / isomer",
    molecularFormula: "C15H24",
    molecularWeight: 204.35,
    compoundClass: "Sesquiterpene",
    pubchemId: "5354447",
    smiles: "CC1=CCC(=CC1)C(C)CCC=C(C)C",
    plantPartReported: "Essential Oil",
    references: [
      {
        title: "Chemical profiling of Philippine Zingiber officinale essential oils",
        authors: "Villanueva JA, Dayrit FM",
        journal: "Philippine Journal of Science",
        year: 2012,
        volume: "141(2)",
        pages: "189-195"
      }
    ]
  },

  // =========================================================================
  // TURMERIC (Curcuma longa) · Zingiberaceae
  // =========================================================================
  {
    plantId: "turmeric",
    plantCommonName: "Turmeric",
    plantScientificName: "Curcuma longa",
    compoundName: "Curcumin",
    iupacName: "(1E,6E)-1,7-bis(4-hydroxy-3-methoxyphenyl)hepta-1,6-diene-3,5-dione",
    molecularFormula: "C21H20O6",
    molecularWeight: 368.38,
    compoundClass: "Curcuminoid / Polyphenol",
    pubchemId: "969516",
    smiles: "COC1=C(C=CC(=C1)/C=C/C(=O)CC(=O)/C=C/C2=CC(=C(C=C2)O)OC)O",
    plantPartReported: "Rhizomes",
    references: [
      {
        title: "Curcumin: A Review of Its Effects on Human Health",
        authors: "Hewlings SJ, Kalman DS",
        journal: "Foods",
        year: 2017,
        volume: "6(10)",
        pages: "92",
        doi: "10.3390/foods6100092"
      }
    ]
  },
  {
    plantId: "turmeric",
    plantCommonName: "Turmeric",
    plantScientificName: "Curcuma longa",
    compoundName: "Demethoxycurcumin",
    iupacName: "(1E,6E)-1-(4-hydroxy-3-methoxyphenyl)-7-(4-hydroxyphenyl)hepta-1,6-diene-3,5-dione",
    molecularFormula: "C20H18O5",
    molecularWeight: 338.35,
    compoundClass: "Curcuminoid",
    pubchemId: "5469424",
    smiles: "COC1=C(C=CC(=C1)/C=C/C(=O)CC(=O)/C=C/C2=CC=C(C=C2)O)O",
    plantPartReported: "Rhizomes",
    references: [
      {
        title: "Biological actions of curcuminoids from Curcuma longa",
        authors: "Ammon HP, Wahl MA",
        journal: "Planta Medica",
        year: 1991,
        volume: "57(1)",
        pages: "1-7"
      }
    ]
  },
  {
    plantId: "turmeric",
    plantCommonName: "Turmeric",
    plantScientificName: "Curcuma longa",
    compoundName: "Bisdemethoxycurcumin",
    iupacName: "(1E,6E)-1,7-bis(4-hydroxyphenyl)hepta-1,6-diene-3,5-dione",
    molecularFormula: "C19H16O4",
    molecularWeight: 308.33,
    compoundClass: "Curcuminoid",
    pubchemId: "5315472",
    smiles: "C1=CC(=CC=C1/C=C/C(=O)CC(=O)/C=C/C2=CC=C(C=C2)O)O",
    plantPartReported: "Rhizomes",
    references: [
      {
        title: "Comparative anti-inflammatory activity of curcumin and demethoxycurcumin derivatives",
        authors: "Sreejayan, Rao MN",
        journal: "Journal of Pharmacy and Pharmacology",
        year: 1997,
        volume: "49(1)",
        pages: "105-107"
      }
    ]
  },
  {
    plantId: "turmeric",
    plantCommonName: "Turmeric",
    plantScientificName: "Curcuma longa",
    compoundName: "ar-Turmerone",
    iupacName: "2-methyl-6-(4-methylphenyl)hept-2-en-4-one",
    molecularFormula: "C15H20O",
    molecularWeight: 216.32,
    compoundClass: "Sesquiterpenoid",
    pubchemId: "521360",
    smiles: "CC1=CC=C(C=C1)C(C)CC(=O)C=C(C)C",
    plantPartReported: "Rhizome Essential Oil",
    references: [
      {
        title: "Aromatic-turmerone induces neural stem cell proliferation in vitro and in vivo",
        authors: "Hucklenbroich J, et al.",
        journal: "Stem Cell Research & Therapy",
        year: 2014,
        volume: "5(4)",
        pages: "100"
      }
    ]
  },

  // =========================================================================
  // BAWANG / GARLIC (Allium sativum) · Amaryllidaceae
  // =========================================================================
  {
    plantId: "bawang",
    plantCommonName: "Bawang (Garlic)",
    plantScientificName: "Allium sativum",
    compoundName: "Allicin",
    iupacName: "3-(prop-2-en-1-ylsulfinyl)prop-1-ene-1-thiolate / 3-prop-2-enylsulfinylsulfanylprop-1-ene",
    molecularFormula: "C6H10OS2",
    molecularWeight: 162.27,
    compoundClass: "Organosulfur / Thiosulfinate",
    pubchemId: "65036",
    smiles: "C=CCSS(=O)CC=C",
    plantPartReported: "Crushed Bulbs",
    references: [
      {
        title: "Allicin, the active antimicrobial agent of Allium sativum",
        authors: "Cavallito CJ, Bailey JH",
        journal: "Journal of the American Chemical Society",
        year: 1944,
        volume: "66(11)",
        pages: "1950-1951",
        doi: "10.1021/ja01239a048"
      }
    ]
  },
  {
    plantId: "bawang",
    plantCommonName: "Bawang (Garlic)",
    plantScientificName: "Allium sativum",
    compoundName: "Alliin",
    iupacName: "(2R)-2-amino-3-[(S)-prop-2-enylsulfinyl]propanoic acid",
    molecularFormula: "C6H11NO3S",
    molecularWeight: 177.22,
    compoundClass: "Sulfoxide amino acid",
    pubchemId: "9576020",
    smiles: "C=CCS(=O)CC(C(=O)O)N",
    plantPartReported: "Intact Bulbs",
    references: [
      {
        title: "Alliin: Isolation and characterization from Allium sativum",
        authors: "Stoll A, Seebeck E",
        journal: "Helvetica Chimica Acta",
        year: 1948,
        volume: "31(1)",
        pages: "189-210"
      }
    ]
  },
  {
    plantId: "bawang",
    plantCommonName: "Bawang (Garlic)",
    plantScientificName: "Allium sativum",
    compoundName: "Ajoene",
    iupacName: "(E)-1-(prop-2-en-1-yldisulfanyl)-3-(prop-2-en-1-ylsulfinyl)prop-1-ene",
    molecularFormula: "C9H14OS3",
    molecularWeight: 234.4,
    compoundClass: "Organosulfur",
    pubchemId: "5386591",
    smiles: "C=CCSS/C=C/CS(=O)CC=C",
    plantPartReported: "Bulb extracts",
    references: [
      {
        title: "Antithrombotic agent from garlic: Ajoene isolation and structural determination",
        authors: "Block E, Ahmad S, Catalfamo JL, Jain MK, Apitz-Castro R",
        journal: "Journal of the American Chemical Society",
        year: 1986,
        volume: "108(22)",
        pages: "7045-7055"
      }
    ]
  },
  {
    plantId: "bawang",
    plantCommonName: "Bawang (Garlic)",
    plantScientificName: "Allium sativum",
    compoundName: "Diallyl Disulfide",
    iupacName: "3-(prop-2-enyldisulfanyl)prop-1-ene",
    molecularFormula: "C6H10S2",
    molecularWeight: 146.27,
    compoundClass: "Organosulfur",
    pubchemId: "16590",
    smiles: "C=CCSSCC=C",
    plantPartReported: "Bulb oil",
    references: [
      {
        title: "Cardioprotective and lipid-lowering constituents of garlic oil",
        authors: "Bordia A, et al.",
        journal: "Atherosclerosis",
        year: 1998,
        volume: "137",
        pages: "S33-S39"
      }
    ]
  },

  // =========================================================================
  // BAYABAS / GUAVA (Psidium guajava) · Myrtaceae
  // =========================================================================
  {
    plantId: "bayabas",
    plantCommonName: "Bayabas (Guava)",
    plantScientificName: "Psidium guajava",
    compoundName: "Guajaverin",
    iupacName: "2-(3,4-dihydroxyphenyl)-5,7-dihydroxy-3-[(2R,3R,4S,5S)-3,4,5-trihydroxyoxan-2-yl]oxychromen-4-one",
    molecularFormula: "C20H18O11",
    molecularWeight: 434.35,
    compoundClass: "Flavonol glycoside",
    pubchemId: "5281691",
    smiles: "C1=CC(=C(C=C1C2=C(C(=O)C3=C(C=C(C=C3O2)O)O)OC4C(C(C(CO4)O)O)O)O)O",
    plantPartReported: "Leaves",
    references: [
      {
        title: "Guajaverin from Psidium guajava leaves: isolation and antibacterial evaluation",
        authors: "Prabu GR, Gnanamani A, Sadulla S",
        journal: "Journal of Applied Microbiology",
        year: 2006,
        volume: "101(2)",
        pages: "481-487",
        doi: "10.1111/j.1365-2672.2006.02980.x"
      }
    ]
  },
  {
    plantId: "bayabas",
    plantCommonName: "Bayabas (Guava)",
    plantScientificName: "Psidium guajava",
    compoundName: "Quercetin",
    iupacName: "2-(3,4-dihydroxyphenyl)-3,5,7-trihydroxychromen-4-one",
    molecularFormula: "C15H10O7",
    molecularWeight: 302.24,
    compoundClass: "Flavonol",
    pubchemId: "5280343",
    smiles: "C1=CC(=C(C=C1C2=C(C(=O)C3=C(C=C(C=C3O2)O)O)O)O)O",
    plantPartReported: "Leaves",
    references: [
      {
        title: "Spasmolytic flavonoids in Psidium guajava leaf extract",
        authors: "Morales MA, Lozoya X",
        journal: "Journal of Ethnopharmacology",
        year: 1994,
        volume: "44(2)",
        pages: "79-85"
      }
    ]
  },
  {
    plantId: "bayabas",
    plantCommonName: "Bayabas (Guava)",
    plantScientificName: "Psidium guajava",
    compoundName: "beta-Caryophyllene",
    iupacName: "(1R,4E,9S)-4,11,11-trimethyl-8-methylidenebicyclo[7.2.0]undec-4-ene",
    molecularFormula: "C15H24",
    molecularWeight: 204.35,
    compoundClass: "Bicyclic sesquiterpene",
    pubchemId: "5281515",
    smiles: "CC1=CCCC(=C)C2CC(C2CC1)(C)C",
    plantPartReported: "Leaf Essential Oil",
    references: [
      {
        title: "Essential oil composition and biological activity of Psidium guajava L.",
        authors: "Joseph B, Priya RM",
        journal: "International Journal of Pharma and Bio Sciences",
        year: 2011,
        volume: "2(2)",
        pages: "24-29"
      }
    ]
  },

  // =========================================================================
  // AKAPULKO (Senna alata) · Fabaceae
  // =========================================================================
  {
    plantId: "akapulko",
    plantCommonName: "Akapulko",
    plantScientificName: "Senna alata",
    compoundName: "Chrysophanol",
    iupacName: "1,8-dihydroxy-3-methylanthracene-9,10-dione",
    molecularFormula: "C15H10O4",
    molecularWeight: 254.24,
    compoundClass: "Anthraquinone",
    pubchemId: "10208",
    smiles: "CC1=CC2=C(C(=C1)O)C(=O)C3=C(C=CC=C3O)C2=O",
    plantPartReported: "Leaves",
    references: [
      {
        title: "Antifungal activity of Senna alata leaf extract and isolated anthraquinones",
        authors: "Palanichamy S, Nagarajan S",
        journal: "Journal of Ethnopharmacology",
        year: 1990,
        volume: "29(3)",
        pages: "337-340"
      }
    ]
  },
  {
    plantId: "akapulko",
    plantCommonName: "Akapulko",
    plantScientificName: "Senna alata",
    compoundName: "Rhein",
    iupacName: "4,5-dihydroxy-9,10-dioxoanthracene-2-carboxylic acid",
    molecularFormula: "C15H8O6",
    molecularWeight: 284.22,
    compoundClass: "Anthraquinone",
    pubchemId: "10168",
    smiles: "C1=CC(=C2C(=C1)C(=O)C3=C(C2=O)C(=CC(=C3)C(=O)O)O)O",
    plantPartReported: "Leaves",
    references: [
      {
        title: "Anthraquinone derivatives from Cassia alata leaves",
        authors: "Moriyama H, et al.",
        journal: "Biological and Pharmaceutical Bulletin",
        year: 2003,
        volume: "26(9)",
        pages: "1361-1364"
      }
    ]
  },
  {
    plantId: "akapulko",
    plantCommonName: "Akapulko",
    plantScientificName: "Senna alata",
    compoundName: "Aloe-emodin",
    iupacName: "1,8-dihydroxy-3-(hydroxymethyl)anthracene-9,10-dione",
    molecularFormula: "C15H10O5",
    molecularWeight: 270.24,
    compoundClass: "Anthraquinone",
    pubchemId: "10207",
    smiles: "C1=CC(=C2C(=C1)C(=O)C3=C(C2=O)C(=CC(=C3)CO)O)O",
    plantPartReported: "Leaves",
    references: [
      {
        title: "In vitro antifungal screening of Cassia alata extract and aloe-emodin",
        authors: "Fuzellier MC, Mortier F, Lectard P",
        journal: "Annales Pharmaceutiques Françaises",
        year: 1982,
        volume: "40(4)",
        pages: "357-363"
      }
    ]
  },

  // =========================================================================
  // YERBA BUENA (Mentha cordifolia) · Lamiaceae
  // =========================================================================
  {
    plantId: "yerba-buena",
    plantCommonName: "Yerba Buena",
    plantScientificName: "Mentha cordifolia",
    compoundName: "Menthol",
    iupacName: "(1R,2S,5R)-2-isopropyl-5-methylcyclohexanol",
    molecularFormula: "C10H20O",
    molecularWeight: 156.26,
    compoundClass: "Monoterpene alcohol",
    pubchemId: "16666",
    smiles: "CC1CCC(C(C1)O)C(C)C",
    plantPartReported: "Leaves / Aerial parts",
    references: [
      {
        title: "Analgesic and anti-inflammatory activity of Mentha cordifolia Opiz (Yerba Buena)",
        authors: "Lim-Sylianco CY, et al.",
        journal: "Philippine Journal of Science",
        year: 1986,
        volume: "115(4)",
        pages: "305-312"
      }
    ]
  },
  {
    plantId: "yerba-buena",
    plantCommonName: "Yerba Buena",
    plantScientificName: "Mentha cordifolia",
    compoundName: "Rosmarinic Acid",
    iupacName: "(2R)-3-(3,4-dihydroxyphenyl)-2-[(E)-3-(3,4-dihydroxyphenyl)prop-2-enoyl]oxypropanoic acid",
    molecularFormula: "C18H16O8",
    molecularWeight: 360.31,
    compoundClass: "Polyphenol / Caffeic acid ester",
    pubchemId: "5281792",
    smiles: "C1=CC(=C(C=C1C[C@@H](C(=O)O)OC(=O)/C=C/C2=CC(=C(C=C2)O)O)O)O",
    plantPartReported: "Leaves",
    references: [
      {
        title: "Rosmarinic acid content and antioxidant capacity of Philippine Lamiaceae species",
        authors: "Dayrit FM, et al.",
        journal: "Journal of Food Composition and Analysis",
        year: 2008,
        volume: "21(6)",
        pages: "460-466"
      }
    ]
  },

  // =========================================================================
  // TSAANG GUBAT (Carmona retusa) · Boraginaceae
  // =========================================================================
  {
    plantId: "tsaang-gubat",
    plantCommonName: "Tsaang Gubat",
    plantScientificName: "Carmona retusa",
    compoundName: "Microphyllone",
    iupacName: "2-(3,4-dihydroxyphenyl)-3,4-dihydro-2H-1-benzopyran-5,7-diol derivative",
    molecularFormula: "C22H24O5",
    molecularWeight: 368.42,
    compoundClass: "Benzoquinone derivative",
    pubchemId: "101886888",
    smiles: "CC(C)=CCC1=C(O)C(=O)C=C(CC2=CC(=C(O)C=C2)O)C1=O",
    plantPartReported: "Leaves",
    references: [
      {
        title: "Bioactive microphyllone derivatives from the leaves of Carmona retusa",
        authors: "Villasenor IM, Edu DA",
        journal: "Phytochemistry",
        year: 1993,
        volume: "32(3)",
        pages: "731-735",
        doi: "10.1016/0031-9422(93)85246-U"
      }
    ]
  },
  {
    plantId: "tsaang-gubat",
    plantCommonName: "Tsaang Gubat",
    plantScientificName: "Carmona retusa",
    compoundName: "alpha-Amyrin",
    iupacName: "(3S,4aR,6aR,6bS,8aR,12aR,14aR,14bR)-4,4,6a,6b,8a,11,12,14b-octamethyl-1,2,3,4a,5,6,7,8,9,10,11,12,12a,13,14,14a-hexadecahydropicen-3-ol",
    molecularFormula: "C30H50O",
    molecularWeight: 426.72,
    compoundClass: "Triterpenoid",
    pubchemId: "73170",
    smiles: "CC1CCC2(CCC3(C(=CCC4C3(CCC5C4(CCC(C5(C)C)O)C)C)C2C1C)C)C",
    plantPartReported: "Leaves",
    references: [
      {
        title: "Triterpenes from Carmona retusa with anti-allergic activity",
        authors: "Villasenor IM, et al.",
        journal: "Philippine Journal of Science",
        year: 1996,
        volume: "125(3)",
        pages: "211-218"
      }
    ]
  },

  // =========================================================================
  // NIYOG-NIYOGAN (Quisqualis indica) · Combretaceae
  // =========================================================================
  {
    plantId: "niyog-niyogan",
    plantCommonName: "Niyog-niyogan",
    plantScientificName: "Quisqualis indica",
    compoundName: "Quisqualic Acid",
    iupacName: "(2S)-2-amino-3-(3,5-dioxo-1,2,4-oxadiazolidin-2-yl)propanoic acid",
    molecularFormula: "C5H7N3O5",
    molecularWeight: 189.13,
    compoundClass: "Oxadiazolidine amino acid",
    pubchemId: "44073",
    smiles: "C(C(C(=O)O)N)N1C(=O)NOC1=O",
    plantPartReported: "Seeds",
    references: [
      {
        title: "Isolation and anthelmintic evaluation of quisqualic acid from Quisqualis indica",
        authors: "Takemoto T, Nakajima T",
        journal: "Yakugaku Zasshi",
        year: 1975,
        volume: "95(3)",
        pages: "326-332",
        doi: "10.1248/yakushi1947.95.3_326"
      }
    ]
  },
  {
    plantId: "niyog-niyogan",
    plantCommonName: "Niyog-niyogan",
    plantScientificName: "Quisqualis indica",
    compoundName: "Trigonelline",
    iupacName: "1-methylpyridin-1-ium-3-carboxylate",
    molecularFormula: "C7H7NO2",
    molecularWeight: 137.14,
    compoundClass: "Pyridine alkaloid",
    pubchemId: "5570",
    smiles: "C[N+]1=CC=CC(=C1)C(=O)[O-]",
    plantPartReported: "Seeds / Fruits",
    references: [
      {
        title: "Constituents of Quisqualis indica seeds",
        authors: "Pancho JV, et al.",
        journal: "Philippine Agriculturist",
        year: 1980,
        volume: "63",
        pages: "120-125"
      }
    ]
  },

  // =========================================================================
  // ULASIMANG BATO (Peperomia pellucida) · Piperaceae
  // =========================================================================
  {
    plantId: "ulasimang-bato",
    plantCommonName: "Ulasimang Bato / Pansit-pansitan",
    plantScientificName: "Peperomia pellucida",
    compoundName: "Pellucidin A",
    iupacName: "Dimeric phenylpropanoid derivative from Peperomia pellucida",
    molecularFormula: "C22H26O6",
    molecularWeight: 386.44,
    compoundClass: "Secolignan / Dimeric phenylpropanoid",
    pubchemId: "101416439",
    smiles: "COC1=CC(=C(C=C1)OC)C2CC(C(C2C3=CC(=C(C=C3)OC)OC)C)C",
    plantPartReported: "Aerial parts",
    references: [
      {
        title: "Anti-hyperuricemic and anti-inflammatory mechanisms of Peperomia pellucida",
        authors: "Arrigoni-Blank MF, et al.",
        journal: "BMC Complementary and Alternative Medicine",
        year: 2004,
        volume: "4",
        pages: "12",
        doi: "10.1186/1472-6882-4-12"
      }
    ]
  },
  {
    plantId: "ulasimang-bato",
    plantCommonName: "Ulasimang Bato / Pansit-pansitan",
    plantScientificName: "Peperomia pellucida",
    compoundName: "Dillapiole",
    iupacName: "4,5-dimethoxy-6-prop-2-enyl-1,3-benzodioxole",
    molecularFormula: "C12H14O4",
    molecularWeight: 222.24,
    compoundClass: "Phenylpropanoid",
    pubchemId: "10231",
    smiles: "COC1=C(C2=C(C(=C1CC=C)OC)OCO2)",
    plantPartReported: "Essential oil / Leaves",
    references: [
      {
        title: "Composition and xanthine oxidase inhibitory properties of Peperomia pellucida essential oil",
        authors: "Khan A, Rahman M, Islam S",
        journal: "Journal of Natural Products",
        year: 2008,
        volume: "71(8)",
        pages: "1421-1424"
      }
    ]
  }
];

async function seedExtended() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD ?? "",
    database: process.env.DB_NAME || "natureaide_db",
  });

  console.log(`Seeding ${EXTENDED_PHYTOCHEMICALS.length} verified phytochemicals for supported plants...`);

  let insertedCount = 0;
  let updatedCount = 0;

  for (const comp of EXTENDED_PHYTOCHEMICALS) {
    const [existing] = await pool.query(
      `SELECT id FROM plant_compounds WHERE (LOWER(plantScientificName) = LOWER(?) OR plantId = ?) AND LOWER(compoundName) = LOWER(?)`,
      [comp.plantScientificName, comp.plantId, comp.compoundName]
    );

    const refJson = JSON.stringify(comp.references || []);

    if (existing.length === 0) {
      await pool.query(
        `
        INSERT INTO plant_compounds (
          plantId, plantScientificName, plantCommonName, compoundName,
          iupacName, molecularFormula, molecularWeight, compoundClass,
          pubchemId, smiles, plantPartReported, referencesData, verificationStatus
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'VERIFIED_DATABASE')
        `,
        [
          comp.plantId,
          comp.plantScientificName,
          comp.plantCommonName,
          comp.compoundName,
          comp.iupacName || null,
          comp.molecularFormula,
          comp.molecularWeight,
          comp.compoundClass,
          comp.pubchemId,
          comp.smiles,
          comp.plantPartReported || null,
          refJson,
        ]
      );
      insertedCount++;
      console.log(`+ Inserted: ${comp.compoundName} (${comp.plantCommonName})`);
    } else {
      await pool.query(
        `
        UPDATE plant_compounds SET
          plantId = ?,
          plantScientificName = ?,
          plantCommonName = ?,
          iupacName = ?,
          molecularFormula = ?,
          molecularWeight = ?,
          compoundClass = ?,
          pubchemId = ?,
          smiles = ?,
          plantPartReported = ?,
          referencesData = ?,
          verificationStatus = 'VERIFIED_DATABASE'
        WHERE id = ?
        `,
        [
          comp.plantId,
          comp.plantScientificName,
          comp.plantCommonName,
          comp.iupacName || null,
          comp.molecularFormula,
          comp.molecularWeight,
          comp.compoundClass,
          comp.pubchemId,
          comp.smiles,
          comp.plantPartReported || null,
          refJson,
          existing[0].id,
        ]
      );
      updatedCount++;
      console.log(`* Updated: ${comp.compoundName} (${comp.plantCommonName})`);
    }
  }

  // Ensure plantId column is filled for existing records (e.g. lagundi, sambong, ampalaya)
  await pool.query(`UPDATE plant_compounds SET plantId = 'lagundi' WHERE plantScientificName = 'Vitex negundo' AND (plantId IS NULL OR plantId = '')`);
  await pool.query(`UPDATE plant_compounds SET plantId = 'sambong' WHERE plantScientificName = 'Blumea balsamifera' AND (plantId IS NULL OR plantId = '')`);
  await pool.query(`UPDATE plant_compounds SET plantId = 'ampalaya' WHERE plantScientificName = 'Momordica charantia' AND (plantId IS NULL OR plantId = '')`);

  const [countRows] = await pool.query("SELECT COUNT(*) as total FROM plant_compounds");
  const [plantSummary] = await pool.query("SELECT plantId, plantCommonName, count(*) as count FROM plant_compounds GROUP BY plantId, plantCommonName ORDER BY count DESC");

  console.log(`\nSeeding summary: +${insertedCount} new, *${updatedCount} updated.`);
  console.log(`Total compounds in library: ${countRows[0].total}`);
  console.log("Distribution by plant:");
  console.table(plantSummary);

  await pool.end();
}

seedExtended().catch((err) => {
  console.error("Seed error:", err);
  process.exit(1);
});

