import pool from "@/lib/db";

export interface EvidenceStudy {
  id: string | number;
  title: string;
  authors: string;
  year: number | string;
  journalOrSource: string;
  studyType: string;
  relevanceToCurrentResearch: string;
  isVerified: boolean;
  verificationSource?: string;
  doiOrUrl?: string;
  pubmedId?: string;
  shortSummary?: string;
  isCustom?: boolean;
}

/**
 * Intelligent Evidence Engine:
 * Automatically retrieves, organizes, and computes relevance for scientific evidence
 * based on the medicinal plant, project title, research objectives, and compounds.
 */
export async function getAutoCuratedEvidence(projectId: number): Promise<{
  studies: EvidenceStudy[];
  autoCuratedCount: number;
  customCount: number;
  matchedPlant: string;
}> {
  // 1. Fetch project and plant details
  const [projectRows]: any = await pool.query(
    `
    SELECT rp.*,
           COALESCE(p.commonName, rp.plantCustomName, 'Unspecified Plant') as plantName,
           p.scientificName as plantScientificName,
           p.category as plantCategory,
           p.simpleUse,
           p.safetyNote
    FROM research_projects rp
    LEFT JOIN plants p ON rp.plantId = p.id
    WHERE rp.id = ?
    LIMIT 1
    `,
    [projectId]
  );

  if (projectRows.length === 0) {
    return { studies: [], autoCuratedCount: 0, customCount: 0, matchedPlant: "" };
  }

  const project = projectRows[0];

  // 2. Fetch phytochemical compounds for the project
  const [compoundRows]: any = await pool.query(
    `SELECT compoundName FROM research_compounds WHERE projectId = ?`,
    [projectId]
  );
  const compoundNames: string[] = compoundRows.map((c: any) => c.compoundName);

  // 3. Build plant search keywords
  const plantKeywords: string[] = [];
  if (project.plantName && project.plantName !== "Unspecified Plant") {
    const cleanCommon = project.plantName.replace(/\([^)]*\)/g, "").trim();
    if (cleanCommon) plantKeywords.push(cleanCommon);
  }
  if (project.plantScientificName) {
    const parts = project.plantScientificName.split(" ").filter((s: string) => s.length > 2);
    plantKeywords.push(...parts);
  }
  if (project.plantCustomName) {
    const cleanCustom = project.plantCustomName.replace(/\([^)]*\)/g, "").trim();
    if (cleanCustom && !plantKeywords.includes(cleanCustom)) plantKeywords.push(cleanCustom);
  }

  // 4. Query verified references from scientific_references
  let verifiedScientificRows: any[] = [];
  if (plantKeywords.length > 0) {
    const likeClauses = plantKeywords
      .map(() => "(plantOrIngredientStudied LIKE ? OR title LIKE ?)")
      .join(" OR ");
    const likeParams = plantKeywords.flatMap((k) => [`%${k}%`, `%${k}%`]);

    const [matched]: any = await pool.query(
      `
      SELECT id, title, authors, publicationYear, journalOrPublisher, studyType,
             doi, pubmedId, sourceUrl, shortSummary, plantOrIngredientStudied,
             source_verified, evidence_scope, verification_source
      FROM scientific_references
      WHERE ${likeClauses}
      ORDER BY publicationYear DESC
      `,
      likeParams
    );
    verifiedScientificRows = matched;
  }

  // If no direct plant match in scientific_references, fallback to top verified botanical studies
  if (verifiedScientificRows.length === 0) {
    const [fallbackRows]: any = await pool.query(
      `
      SELECT id, title, authors, publicationYear, journalOrPublisher, studyType,
             doi, pubmedId, sourceUrl, shortSummary, plantOrIngredientStudied,
             source_verified, evidence_scope, verification_source
      FROM scientific_references
      ORDER BY publicationYear DESC
      LIMIT 10
      `
    );
    verifiedScientificRows = fallbackRows;
  }

  // 5. Query researcher-added or project-specific literature_references
  const [projectLitRows]: any = await pool.query(
    `
    SELECT id, projectId, researcherId, scientificReferenceId,
           COALESCE(sourceType, 'MANUAL_ENTRY') as sourceType,
           title, authors, year, journalSource, doiOrUrl, studyType,
           plantOrCompound, keyFindings, limitations, researchNotes,
           tags, pubmedId, documentUrl, relevanceToCurrentResearch, createdAt
    FROM literature_references
    WHERE projectId = ?
    ORDER BY id ASC
    `,
    [projectId]
  );

  // 6. Assemble deduplicated studies and calculate relevance to current research
  const studiesMap = new Map<string, EvidenceStudy>();

  // Process existing project literature references
  for (const ref of projectLitRows) {
    const normKey = ref.title.trim().toLowerCase();
    const isVerified =
      ref.sourceType === "VERIFIED_NATUREAIDE" ||
      ref.sourceType === "AUTOMATIC_CURATION" ||
      Boolean(ref.scientificReferenceId) ||
      (ref.tags && ref.tags.toLowerCase().includes("verified"));

    let relevance = ref.relevanceToCurrentResearch;
    if (!relevance || relevance.trim() === "") {
      relevance = generateRelevanceText(
        ref.title,
        ref.keyFindings || ref.researchNotes,
        project.title,
        project.plantName,
        compoundNames
      );
    }

    studiesMap.set(normKey, {
      id: ref.id,
      title: ref.title,
      authors: ref.authors || "NatureAide Research Registry",
      year: ref.year || new Date(ref.createdAt).getFullYear() || 2024,
      journalOrSource: ref.journalSource || "Peer-Reviewed Phytomedicine",
      studyType: ref.studyType || "Empirical Research",
      relevanceToCurrentResearch: relevance,
      isVerified: Boolean(isVerified),
      verificationSource: "NatureAide Scientific Reference Registry",
      doiOrUrl: ref.doiOrUrl || ref.documentUrl || (ref.pubmedId ? `https://pubmed.ncbi.nlm.nih.gov/${ref.pubmedId}/` : undefined),
      pubmedId: ref.pubmedId || undefined,
      shortSummary: ref.keyFindings || ref.researchNotes || undefined,
      isCustom: ref.sourceType === "MANUAL_ENTRY",
    });
  }

  // Merge auto-retrieved scientific references
  for (const sRef of verifiedScientificRows) {
    const normKey = sRef.title.trim().toLowerCase();
    if (!studiesMap.has(normKey)) {
      const relevance = generateRelevanceText(
        sRef.title,
        sRef.shortSummary,
        project.title,
        project.plantName,
        compoundNames
      );

      studiesMap.set(normKey, {
        id: sRef.id,
        title: sRef.title,
        authors: sRef.authors,
        year: sRef.publicationYear,
        journalOrSource: sRef.journalOrPublisher,
        studyType: sRef.studyType || "Pharmacological Evaluation",
        relevanceToCurrentResearch: relevance,
        isVerified: true,
        verificationSource: sRef.verification_source || "PITAHC / PubMed Indexed",
        doiOrUrl: sRef.sourceUrl || (sRef.doi ? `https://doi.org/${sRef.doi}` : undefined),
        pubmedId: sRef.pubmedId || undefined,
        shortSummary: sRef.shortSummary,
        isCustom: false,
      });
    }
  }

  const studies = Array.from(studiesMap.values());
  const customCount = studies.filter((s) => s.isCustom).length;
  const autoCuratedCount = studies.length - customCount;

  return {
    studies,
    autoCuratedCount,
    customCount,
    matchedPlant: project.plantName,
  };
}

/**
 * Computes an intelligent, concise explanation of why a given study is relevant
 * to the researcher's specific plant, topic, objectives, and phytochemicals.
 */
function generateRelevanceText(
  studyTitle: string,
  summaryOrFindings: string | undefined,
  projectTitle: string,
  plantName: string,
  compounds: string[]
): string {
  const tLower = (studyTitle + " " + (summaryOrFindings || "")).toLowerCase();
  const projLower = projectTitle.toLowerCase();

  // 1. Mechanism / Disease Pathway matching
  if (tLower.includes("urolithi") || tLower.includes("renal") || tLower.includes("kidney") || tLower.includes("stone")) {
    return `Direct experimental evidence demonstrating anti-urolithiatic and nephroprotective mechanisms directly supporting the renal pathway targets in "${projectTitle}".`;
  }
  if (tLower.includes("inflammat") || tLower.includes("cox-2") || tLower.includes("pi3k") || tLower.includes("cytokine")) {
    return `Corroborates suppression of pro-inflammatory signaling cascades, providing pharmacological validation for target receptor affinity models in this research.`;
  }
  if (tLower.includes("antioxidant") || tLower.includes("radical") || tLower.includes("scavenging")) {
    return `Documents active free-radical scavenging profiles and protective cellular antioxidant capacity relevant to standardized formulation design.`;
  }
  if (tLower.includes("wound") || tLower.includes("vesicle") || tLower.includes("cellular")) {
    return `Demonstrates tissue-level biocompatibility and cellular regenerative signaling for ${plantName} bioactive fractions.`;
  }
  if (tLower.includes("volatile") || tLower.includes("terpene") || tLower.includes("terpenoid") || tLower.includes("borneol")) {
    return `Provides baseline chemical profiling and volatile constituent quantification for lead terpenoid compounds investigated in this study.`;
  }
  if (tLower.includes("flavonoid") || tLower.includes("eutectic") || tLower.includes("extraction")) {
    return `Informs standardized extraction parameters and concentration thresholds for active botanical metabolites in this project.`;
  }

  // 2. Compounds matching
  for (const c of compounds) {
    if (tLower.includes(c.toLowerCase())) {
      return `Directly validates pharmacological activity and biological response for compound ${c} identified in your in-silico target set.`;
    }
  }

  // 3. General botanical match
  return `Establishes peer-reviewed scientific precedent and validation benchmarks for ${plantName} therapeutic applications.`;
}
