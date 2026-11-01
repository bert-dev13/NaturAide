import pool from "./db";
import { callTogetherChat, TogetherMessage } from "./ai/together-provider";

export interface ProjectResearchRecord {
  id: number;
  title: string;
  status: string;
  currentStage: string;
  researchObjective?: string | null;
  researchQuestion?: string | null;
  plantName: string;
  plantScientificName?: string | null;
  plantCategory?: string | null;
  plantPartsUsed?: string | null;
  traditionalUses?: string | null;
  compounds: Array<{
    name: string;
    formula?: string | null;
    mw?: string | number | null;
    smiles?: string | null;
    pubchemId?: string | null;
  }>;
  dockingRuns: Array<{
    ligand: string;
    target: string;
    pdbId?: string | null;
    affinity: string | number;
    poseCount?: number;
    engineStatus: string;
  }>;
  formulation?: {
    extractName?: string;
    plantMaterial?: string;
    solvent?: string;
    extractionMethod?: string;
    components?: string[];
  } | null;
  safety?: {
    classification?: string;
    concerns?: string[];
    contraindications?: string[];
  } | null;
  literature: Array<{
    title: string;
    authors?: string | null;
    year?: number | null;
    journal?: string | null;
    pmid?: string | null;
    doi?: string | null;
  }>;
  dossierSummary?: {
    conclusion?: string | null;
    limitations?: string | null;
    version?: string | null;
  } | null;
  reviewStatus?: {
    decision?: string | null;
    reviewerFeedback?: string[];
  } | null;
}

/**
 * Retrieve comprehensive, verified research records across Stages 1–6 for a project.
 */
export async function retrieveProjectResearchRecord(
  projectId: number,
  researcherId: number
): Promise<ProjectResearchRecord | null> {
  try {
    // 1. Fetch base project and plant data
    const [projectRows]: any = await pool.query(
      `SELECT rp.*,
              COALESCE(p.commonName, rp.plantCustomName, 'Unspecified Plant') as plantName,
              p.scientificName as plantScientificName,
              p.category as plantCategory,
              p.plant_parts_used as plantPartsUsed,
              p.simpleUse as traditionalUses
       FROM research_projects rp
       LEFT JOIN plants p ON rp.plantId = p.id
       WHERE rp.id = ? AND rp.researcherId = ?
       LIMIT 1`,
      [projectId, researcherId]
    );

    if (projectRows.length === 0) return null;
    const p = projectRows[0];

    // 2. Fetch Stage 2 compounds
    const [compoundRows]: any = await pool.query(
      `SELECT compoundName as name, molecularFormula as formula, molecularWeight as mw, smiles, pubchemId
       FROM research_compounds
       WHERE projectId = ?
       ORDER BY selectedForDocking DESC, id ASC`,
      [projectId]
    );

    // 3. Fetch Stage 3 docking runs
    const [dockingRows]: any = await pool.query(
      `SELECT ligandName as ligand, targetProtein as target, pdbId, bindingAffinity as affinity, poseCount, engineStatus
       FROM docking_runs
       WHERE projectId = ?
       ORDER BY CAST(bindingAffinity AS DECIMAL(10,3)) ASC`,
      [projectId]
    );

    // 4. Fetch Stage 4 formulation & safety
    const [formulationRows]: any = await pool.query(
      `SELECT f.title as extractName, f.plantMaterial, f.solvent, f.extractionMethod
       FROM formulations f
       WHERE f.projectId = ?
       ORDER BY f.id DESC LIMIT 1`,
      [projectId]
    );

    const [formComponents]: any = await pool.query(
      `SELECT compoundName, concentration FROM formulation_components WHERE projectId = ?`,
      [projectId]
    );

    const [safetyRows]: any = await pool.query(
      `SELECT safetyClass, summary, contraindications
       FROM safety_assessments
       WHERE projectId = ?
       ORDER BY id DESC LIMIT 1`,
      [projectId]
    );

    const [safetyConcerns]: any = await pool.query(
      `SELECT concernType, description FROM safety_concerns WHERE projectId = ?`,
      [projectId]
    );

    // 5. Fetch verified literature & evidence items
    const [litRows]: any = await pool.query(
      `SELECT DISTINCT title, authors, publicationYear as year, journalOrSource as journal, pmid, doi
       FROM project_evidence_items
       WHERE projectId = ? AND (evidenceClass = 'LITERATURE' OR stageKey = 'plant-literature')
       ORDER BY publicationYear DESC LIMIT 8`,
      [projectId]
    );

    // Fallback to literature_references if project_evidence_items is empty
    let literatureList = litRows;
    if (literatureList.length === 0) {
      const [refRows]: any = await pool.query(
        `SELECT title, authors, publicationYear as year, journal, pmid, doi
         FROM literature_references
         WHERE projectId = ?
         ORDER BY publicationYear DESC LIMIT 8`,
        [projectId]
      );
      literatureList = refRows;
    }

    // 6. Fetch Stage 5 dossier completion
    const [dossierRows]: any = await pool.query(
      `SELECT conclusion, limitations, finalResearchVersion as version
       FROM research_completion_records
       WHERE projectId = ?
       ORDER BY id DESC LIMIT 1`,
      [projectId]
    );

    // 7. Fetch Stage 6 review records
    const [reviewDecisionRows]: any = await pool.query(
      `SELECT decision FROM review_decisions WHERE projectId = ? ORDER BY id DESC LIMIT 1`,
      [projectId]
    );

    const [feedbackRows]: any = await pool.query(
      `SELECT comment FROM review_feedback WHERE projectId = ? ORDER BY createdAt DESC LIMIT 5`,
      [projectId]
    );

    return {
      id: p.id,
      title: p.title,
      status: p.status,
      currentStage: p.currentStage,
      researchObjective: p.researchObjective,
      researchQuestion: p.researchQuestion,
      plantName: p.plantName,
      plantScientificName: p.plantScientificName,
      plantCategory: p.plantCategory,
      plantPartsUsed: p.plantPartsUsed,
      traditionalUses: p.traditionalUses,
      compounds: compoundRows || [],
      dockingRuns: dockingRows || [],
      formulation: formulationRows.length > 0 ? {
        extractName: formulationRows[0].extractName,
        plantMaterial: formulationRows[0].plantMaterial,
        solvent: formulationRows[0].solvent,
        extractionMethod: formulationRows[0].extractionMethod,
        components: formComponents.map((c: any) => `${c.compoundName}${c.concentration ? ` (${c.concentration})` : ""}`),
      } : null,
      safety: safetyRows.length > 0 ? {
        classification: safetyRows[0].safetyClass,
        concerns: safetyConcerns.map((sc: any) => `${sc.concernType}: ${sc.description}`),
        contraindications: safetyRows[0].contraindications ? [safetyRows[0].contraindications] : [],
      } : null,
      literature: literatureList || [],
      dossierSummary: dossierRows.length > 0 ? {
        conclusion: dossierRows[0].conclusion,
        limitations: dossierRows[0].limitations,
        version: dossierRows[0].version,
      } : null,
      reviewStatus: {
        decision: reviewDecisionRows.length > 0 ? reviewDecisionRows[0].decision : null,
        reviewerFeedback: feedbackRows.map((f: any) => f.comment),
      },
    };
  } catch (err) {
    console.error("Error retrieving project research record:", err);
    return null;
  }
}

/**
 * Builds the high-grounding scientific system prompt incorporating real project data.
 */
export function buildResearcherAssistantPrompt(project?: ProjectResearchRecord | null): string {
  let projectContextBlock = "No specific research project is currently selected. Answer general medicinal plant, phytochemistry, and computational drug discovery questions using evidence-based scientific methodology.";

  if (project) {
    const dockingSummary = project.dockingRuns.length > 0
      ? project.dockingRuns.map(
          (d) => `  - Ligand: ${d.ligand} | Target: ${d.target} (PDB: ${d.pdbId || "N/A"}) | Affinity: ${d.affinity} kcal/mol | Status: ${d.engineStatus}`
        ).join("\n")
      : "  No AutoDock Vina runs recorded yet.";

    const compoundSummary = project.compounds.length > 0
      ? project.compounds.map(
          (c) => `  - ${c.name} (${c.formula || "Formula not specified"}, MW: ${c.mw || "N/A"}, PubChem CID: ${c.pubchemId || "N/A"})`
        ).join("\n")
      : "  No specific compounds isolated/screened yet.";

    const litSummary = project.literature.length > 0
      ? project.literature.map(
          (lit, i) => `  [${i + 1}] "${lit.title}" - ${lit.authors || "Unknown Authors"} (${lit.year || "n.d."})${lit.journal ? `, ${lit.journal}` : ""}${lit.pmid ? ` [PMID: ${lit.pmid}]` : ""}${lit.doi ? ` [DOI: ${lit.doi}]` : ""}`
        ).join("\n")
      : "  No verified literature citations attached yet.";

    const formulationSummary = project.formulation
      ? `  - Extract Prototype: ${project.formulation.extractName || "Standardized Prototype"}\n  - Plant Material: ${project.formulation.plantMaterial || "Unspecified"}\n  - Solvent: ${project.formulation.solvent || "Unspecified"}\n  - Method: ${project.formulation.extractionMethod || "Standard protocol"}`
      : "  Formulation SOP not entered yet.";

    const safetySummary = project.safety
      ? `  - Profile: ${project.safety.classification || "Evaluated"}\n  - Known Concerns: ${project.safety.concerns?.join("; ") || "None flagged"}`
      : "  Safety assessments pending.";

    const reviewSummary = project.reviewStatus?.decision
      ? `  - Final Decision: ${project.reviewStatus.decision}\n  - Feedback Count: ${project.reviewStatus.reviewerFeedback?.length || 0} reviewer comments`
      : "  Not submitted for professional review yet.";

    projectContextBlock = `ACTIVE RESEARCH PROJECT CONTEXT:
Project ID: #${project.id}
Title: "${project.title}"
Status: ${project.status} (Current Stage: ${project.currentStage})
Plant Common Name: ${project.plantName}
Scientific Name: ${project.plantScientificName || "N/A"}
Plant Parts Used: ${project.plantPartsUsed || "Leaves/Roots"}
Research Objective: ${project.researchObjective || "Phytochemical and in-silico computational investigation"}
Research Question: ${project.researchQuestion || "Bioactive constituents and receptor binding pathways"}

STAGE 1 - BOTANICAL & LITERATURE EVIDENCE:
${litSummary}

STAGE 2 - SCREENED COMPOUNDS:
${compoundSummary}

STAGE 3 - AUTODOCK VINA MOLECULAR DOCKING PREDICTIONS:
${dockingSummary}

STAGE 4 - FORMULATION & PRECLINICAL SAFETY:
${formulationSummary}
${safetySummary}

STAGE 5 - SYNTHESIS & DOSSIER:
  - Conclusion: ${project.dossierSummary?.conclusion || "In progress"}
  - Limitations: ${project.dossierSummary?.limitations || "Not finalized"}

STAGE 6 - PROFESSIONAL PEER REVIEW:
${reviewSummary}`;
  }

  return `You are "Ask NatureAide", the dedicated AI scientific research assistant for NatureAide.
You specialize in botanical taxonomy, phytochemistry, secondary metabolites, computational ADMET screening, AutoDock Vina molecular docking analysis, formulation standardization, and preclinical safety.

${projectContextBlock}

CRITICAL SCIENTIFIC PROVENANCE & TRUTH RULES:
1. GROUNDED IN NATUREAIDE DATA: Always prioritize the actual stored research data provided above.
2. PREVENT HALLUCINATION: Never fabricate binding affinities (kcal/mol), PDB IDs, compound names, PMIDs, DOIs, dosages, or wet-lab experimental numbers. If information does not exist in the research record, state clearly: "This information is not available in the current research record."
3. SCIENTIFIC EVIDENCE DISTINCTION:
   - [PREDICTED]: Use when referring to in-silico computations, AutoDock Vina binding scores, or computational ADMET. Never describe docking or in-silico predictions as laboratory or experimental proof.
   - [LITERATURE]: Use when citing verified published studies from PubMed or scientific literature.
   - [FORMULATION]: Use when discussing extract preparation, solvents, or standardization.
   - [INTERPRETATION]: Use when synthesizing findings or discussing mechanisms of action.
   - [EXPERIMENTAL]: ONLY use if real wet-lab measurements (e.g., in-vitro assays, IC50) are explicitly recorded.
4. CITATIONS & SOURCES: When literature from the project is relevant, cite the actual title, authors, and PMID/DOI.
5. SAFETY & CLINICAL LIMITATION: NatureAide is an evidence-based botanical research platform. Never provide personalized clinical diagnoses, prescription dosages, or treatment plans. Emphasize that in-silico affinities indicate receptor interaction propensity, not approved pharmaceutical efficacy.
6. STYLE: Maintain an authoritative, scientific, yet clear and accessible tone suitable for academic and pharmaceutical researchers.`;
}

/**
 * Run chat completion with Together AI for the researcher assistant.
 */
export async function executeResearcherChat(
  history: Array<{ role: "user" | "assistant"; content: string }>,
  userMessage: string,
  project?: ProjectResearchRecord | null
): Promise<{
  success: boolean;
  content: string;
  model: string;
  error?: string;
  sources?: Array<{ title: string; authors?: string; year?: number; pmid?: string; doi?: string; url?: string }>;
}> {
  const systemPrompt = buildResearcherAssistantPrompt(project);

  const messages: TogetherMessage[] = [
    { role: "system", content: systemPrompt },
    ...history.slice(-8).map((h) => ({ role: h.role, content: h.content })),
    { role: "user", content: userMessage },
  ];

  const result = await callTogetherChat(messages, {
    temperature: 0.2, // precise scientific grounding
    maxTokens: 900,
    timeoutMs: 45000,
  });

  if (!result.success || !result.content) {
    return {
      success: false,
      content: "I encountered an error connecting to the AI inference provider. Please retry your query.",
      model: result.model,
      error: result.error,
    };
  }

  // Extract relevant sources from project literature
  const sources = (project?.literature || []).map((lit) => ({
    title: lit.title,
    authors: lit.authors || undefined,
    year: lit.year || undefined,
    pmid: lit.pmid || undefined,
    doi: lit.doi || undefined,
    url: lit.pmid
      ? `https://pubmed.ncbi.nlm.nih.gov/${lit.pmid}/`
      : lit.doi
      ? `https://doi.org/${lit.doi}`
      : undefined,
  }));

  return {
    success: true,
    content: result.content,
    model: result.model,
    sources: sources.length > 0 ? sources : undefined,
  };
}

/**
 * Retrieve verified research record and dossier snapshot for an assigned reviewer.
 */
export async function retrieveProjectForReviewer(
  projectId: number,
  reviewerId: number
): Promise<ProjectResearchRecord | null> {
  try {
    // Check that this reviewer has an assignment for this project
    const [assignRows]: any = await pool.query(
      "SELECT id FROM review_assignments WHERE projectId = ? AND reviewerId = ? LIMIT 1",
      [projectId, reviewerId]
    );
    if (assignRows.length === 0) return null;

    // Fetch base project
    const [projectRows]: any = await pool.query(
      `SELECT rp.*,
              COALESCE(p.commonName, rp.plantCustomName, 'Unspecified Plant') as plantName,
              p.scientificName as plantScientificName,
              p.category as plantCategory,
              p.plant_parts_used as plantPartsUsed,
              p.simpleUse as traditionalUses
       FROM research_projects rp
       LEFT JOIN plants p ON rp.plantId = p.id
       WHERE rp.id = ?
       LIMIT 1`,
      [projectId]
    );
    if (projectRows.length === 0) return null;
    const p = projectRows[0];

    // Fetch Stage 2 compounds
    const [compoundRows]: any = await pool.query(
      `SELECT compoundName as name, molecularFormula as formula, molecularWeight as mw, smiles, pubchemId
       FROM research_compounds
       WHERE projectId = ?
       ORDER BY selectedForDocking DESC, id ASC`,
      [projectId]
    );

    // Fetch Stage 3 docking runs
    const [dockingRows]: any = await pool.query(
      `SELECT ligandName as ligand, targetProtein as target, pdbId, bindingAffinity as affinity, poseCount, engineStatus
       FROM docking_runs
       WHERE projectId = ?
       ORDER BY bindingAffinity ASC, id DESC`,
      [projectId]
    );

    // Fetch Stage 4 formulation & extraction data
    const [formulationRows]: any = await pool.query(
      `SELECT rf.formulationName as extractName, rf.formulationType as plantMaterial,
              rpd.extractionSolvent as solvent, rpd.extractionMethod
       FROM research_formulations rf
       LEFT JOIN research_plant_data rpd ON rf.projectId = rpd.projectId
       WHERE rf.projectId = ?
       ORDER BY rf.id DESC LIMIT 1`,
      [projectId]
    );

    // Fetch Stage 4 safety
    const [safetyRows]: any = await pool.query(
      `SELECT overallRiskClassification as classification, potentialContraindications as contraindications
       FROM research_safety_assessments
       WHERE projectId = ?
       ORDER BY id DESC LIMIT 1`,
      [projectId]
    );

    // Fetch Stage 1 literature
    const [litRows]: any = await pool.query(
      `SELECT title, authors, year, journal, pmid, doi
       FROM literature_references
       WHERE projectId = ?
       ORDER BY year DESC LIMIT 12`,
      [projectId]
    );

    // Fetch Stage 5 completion
    const [compRows]: any = await pool.query(
      `SELECT conclusion, limitations, versionTag as version
       FROM research_completions
       WHERE projectId = ?
       ORDER BY id DESC LIMIT 1`,
      [projectId]
    );

    return {
      id: p.id,
      title: p.title,
      status: p.status,
      currentStage: p.currentStage,
      researchObjective: p.researchObjective,
      researchQuestion: p.researchQuestion,
      plantName: p.plantName,
      plantScientificName: p.plantScientificName,
      plantCategory: p.plantCategory,
      plantPartsUsed: p.plantPartsUsed,
      traditionalUses: p.traditionalUses,
      compounds: compoundRows || [],
      dockingRuns: dockingRows || [],
      formulation: formulationRows[0] || null,
      safety: safetyRows.length > 0 ? {
        classification: safetyRows[0].classification,
        concerns: [],
        contraindications: safetyRows[0].contraindications ? [safetyRows[0].contraindications] : [],
      } : null,
      literature: litRows || [],
      dossierSummary: compRows[0] || null,
      reviewStatus: null,
    };
  } catch (err) {
    console.error("Error retrieving project for reviewer:", err);
    return null;
  }
}

/**
 * Execute chat for Professional Reviewer Assistant.
 */
export async function executeProfessionalReviewerChat(
  history: Array<{ role: "user" | "assistant"; content: string }>,
  userMessage: string,
  project?: ProjectResearchRecord | null
): Promise<{
  success: boolean;
  content: string;
  model: string;
  error?: string;
  sources?: Array<{ title: string; authors?: string; year?: number; pmid?: string; doi?: string; url?: string }>;
}> {
  const basePrompt = buildResearcherAssistantPrompt(project);
  const reviewerSystemPrompt = `${basePrompt}

PROFESSIONAL PEER REVIEW ASSISTANT MANDATE:
You are acting as the AI Scientific Evaluation Assistant to a credentialed Professional Reviewer.
Your role is to assist the reviewer in critically appraising the submitted research dossier across the 5 professional areas:
1. Pharmacognosy (plant identity, material, phytochemicals, extraction, botanical literature)
2. Bioinformatics (screening methodology, target/PDB selection, AutoDock Vina configuration, predicted docking affinities)
3. Pharmacology (biological relevance, mechanisms, literature evidence, toxicity vs. claims)
4. Formulation (prototype design, preparation method, solvent efficiency, concentration benchmarks)
5. Clinical Safety (contraindications, drug interactions, precautions, dose limitations)

STRICT REGULATORY & ETHICAL BOUNDARIES:
- YOU MUST NEVER automatically approve, accept, or reject research.
- YOU MUST NEVER submit a review on behalf of the professional.
- YOU MUST NEVER make the final professional decision. Human professional judgment is ALWAYS required.
- YOU MUST NEVER invent or hallucinate scientific findings, literature, binding scores, or clinical dosages.
- When asked "What should I pay attention to in the [Area] review?", provide focused, area-specific peer review criteria to help the expert examine evidence rigor, computational assumptions, and safety margins.`;

  const messages: TogetherMessage[] = [
    { role: "system", content: reviewerSystemPrompt },
    ...history.slice(-8).map((h) => ({ role: h.role, content: h.content })),
    { role: "user", content: userMessage },
  ];

  const result = await callTogetherChat(messages, {
    temperature: 0.2,
    maxTokens: 1000,
    timeoutMs: 45000,
  });

  if (!result.success || !result.content) {
    return {
      success: false,
      content: "I encountered an error connecting to the AI inference provider. Please retry your query.",
      model: result.model,
      error: result.error,
    };
  }

  const sources = (project?.literature || []).map((lit) => ({
    title: lit.title,
    authors: lit.authors || undefined,
    year: lit.year || undefined,
    pmid: lit.pmid || undefined,
    doi: lit.doi || undefined,
    url: lit.pmid
      ? `https://pubmed.ncbi.nlm.nih.gov/${lit.pmid}/`
      : lit.doi
      ? `https://doi.org/${lit.doi}`
      : undefined,
  }));

  return {
    success: true,
    content: result.content,
    model: result.model,
    sources: sources.length > 0 ? sources : undefined,
  };
}


