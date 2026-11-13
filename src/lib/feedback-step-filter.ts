export type ResearchSectionKey = "section1" | "section2" | "section3";

/**
 * Checks whether a feedback finding belongs to a specific research section (1, 2, or 3).
 * Prevents cross-section contamination between Formulation R&D, In-Silico Docking, and Paper Submission.
 */
export function isFeedbackBelongsToSection(
  feedback: any,
  sectionKey: ResearchSectionKey
): boolean {
  if (!feedback) return false;

  const area = (feedback.areaKey || "").toLowerCase().trim();
  const sName = (feedback.sectionName || "").toLowerCase().trim();
  const fTitle = (feedback.title || "").toLowerCase().trim();
  const combined = `${sName} ${fTitle}`;

  if (sectionKey === "section1") {
    // Explicit section markers
    if (combined.includes("section 2") || combined.includes("section 3")) return false;
    if (area === "bioinformatics" || area === "insilico" || area === "pharmacology") return false;

    // Check positive markers
    const hasS1Area = area === "formulation" || area === "pharmacognosy";
    const hasS1Text =
      combined.includes("section 1") ||
      combined.includes("formulation") ||
      combined.includes("pharmacognos") ||
      combined.includes("specimen authentication") ||
      combined.includes("botanical") ||
      combined.includes("plant information") ||
      combined.includes("extraction") ||
      combined.includes("smart materials") ||
      combined.includes("batch analysis");

    return hasS1Area || hasS1Text;
  }

  if (sectionKey === "section2") {
    // Explicit section markers
    if (combined.includes("section 1") || combined.includes("section 3")) return false;
    if (area === "formulation" || area === "pharmacognosy" || area === "pharmacology") return false;

    // Check positive markers
    const hasS2Area = area === "bioinformatics" || area === "insilico";
    const hasS2Text =
      combined.includes("section 2") ||
      combined.includes("in-silico") ||
      combined.includes("docking") ||
      combined.includes("bioinformatic") ||
      combined.includes("ligand") ||
      combined.includes("phytochemical") ||
      combined.includes("target protein") ||
      combined.includes("pdb") ||
      combined.includes("lipinski") ||
      combined.includes("autodock") ||
      combined.includes("binding affinity") ||
      combined.includes("pharmacophore");

    return hasS2Area || hasS2Text;
  }

  if (sectionKey === "section3") {
    // Explicit section markers
    if (combined.includes("section 1") || combined.includes("section 2")) return false;
    if (area === "formulation" || area === "pharmacognosy" || area === "bioinformatics" || area === "insilico") return false;

    // Check positive markers
    const hasS3Area = area === "pharmacology" || area === "paper" || area === "submission";
    const hasS3Text =
      combined.includes("section 3") ||
      combined.includes("paper submission") ||
      combined.includes("manuscript") ||
      combined.includes("laboratory") ||
      combined.includes("lab result") ||
      combined.includes("clinical pharmacology") ||
      combined.includes("cross-disciplinary") ||
      combined.includes("research summary") ||
      combined.includes("submission snapshot") ||
      combined.includes("professional approval");

    return hasS3Area || hasS3Text;
  }

  return false;
}

/**
 * Checks whether a feedback finding belongs to a specific step within a specific section.
 * Enforces strict matching so a Step 1 finding never leaks into Step 2, 3, etc. or other sections.
 */
export function isFeedbackBelongsToStep(
  feedback: any,
  sectionKey: ResearchSectionKey,
  stepNumber: number,
  stepTitle?: string
): boolean {
  if (!feedback) return false;

  // 1. Must belong to the specified section
  if (!isFeedbackBelongsToSection(feedback, sectionKey)) {
    return false;
  }

  const sName = (feedback.sectionName || "").toLowerCase().trim();
  const fTitle = (feedback.title || "").toLowerCase().trim();
  const combined = `${sName} ${fTitle}`;

  const looksLikeManuscript =
    combined.includes("manuscript") ||
    combined.includes("upload research paper") ||
    combined.includes("uploaded scientific") ||
    combined.includes("pdf / docx");
  const looksLikeLaboratory =
    combined.includes("laboratory") || combined.includes("lab result");
  const looksLikeSummary =
    combined.includes("research summary") ||
    combined.includes("cross-disciplinary") ||
    combined.includes("synthesis");

  // 2. Strict step number detection (e.g. "step 1", "step 2", "step 01")
  // Section 3 used to map manuscript feedback as "Step 2" while Lab was UI step 2 —
  // disambiguate with title keywords so Lab and Manuscript never cross-leak.
  const stepMatch = combined.match(/\bstep\s*0?(\d+)\b/i);
  if (stepMatch && stepMatch[1]) {
    const extractedNum = parseInt(stepMatch[1], 10);
    if (sectionKey === "section3") {
      if (stepNumber === 2) {
        if (looksLikeManuscript) return false;
        if (looksLikeLaboratory) return true;
        return extractedNum === 2 && !looksLikeManuscript;
      }
      if (stepNumber === 3) {
        if (looksLikeLaboratory) return false;
        if (extractedNum === 3) return true;
        // Legacy: manuscript findings were stored as Step 2 before Lab feedback existed
        if (extractedNum === 2 && looksLikeManuscript) return true;
        return false;
      }
      if (stepNumber === 1) {
        if (looksLikeLaboratory || looksLikeManuscript) return false;
        return extractedNum === 1;
      }
    }
    return extractedNum === stepNumber;
  }

  // 3. Fallback to step title matching only if no explicit step number was found
  if (stepTitle && stepTitle.trim()) {
    const cleanTitle = stepTitle.toLowerCase().trim();
    // Only match if the title is reasonably specific (>= 4 chars)
    if (cleanTitle.length >= 4 && combined.includes(cleanTitle)) {
      return true;
    }
  }

  // 4. Section 3 keyword fallback when titles omit an explicit "Step N"
  if (sectionKey === "section3") {
    if (stepNumber === 1) return looksLikeSummary && !looksLikeLaboratory && !looksLikeManuscript;
    if (stepNumber === 2) return looksLikeLaboratory;
    if (stepNumber === 3) return looksLikeManuscript;
  }

  return false;
}

