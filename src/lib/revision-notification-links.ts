/**
 * Deep-link helpers for revision / resubmit notifications so both
 * researcher and reviewer land on the correct section step.
 */

export function revisionDeepLinks(
  sectionName: string | null | undefined,
  projectId: number
): { researcherLink: string; reviewerLink: string } {
  const s = String(sectionName || "").toLowerCase();
  const fallbackResearcher = `/researcher/revisions?projectId=${projectId}`;
  const fallbackReviewer = `/reviewer/revisions?projectId=${projectId}`;

  const isSection3 =
    s.includes("section 3") ||
    s.includes("paper submission") ||
    s.includes("laboratory") ||
    s.includes("lab result") ||
    s.includes("manuscript") ||
    s.includes("research summary") ||
    s.includes("cross-disciplinary");

  if (isSection3) {
    if (s.includes("laboratory") || s.includes("lab result")) {
      return {
        researcherLink: `/researcher/projects/${projectId}/submission?step=2`,
        reviewerLink: `/reviewer/projects/${projectId}?tab=section3&step=2`,
      };
    }
    if (s.includes("manuscript") || s.includes("upload research") || /\bstep\s*0?3\b/.test(s)) {
      return {
        researcherLink: `/researcher/projects/${projectId}/submission?step=3`,
        reviewerLink: `/reviewer/projects/${projectId}?tab=section3&step=3`,
      };
    }
    if (
      s.includes("research summary") ||
      s.includes("cross-disciplinary") ||
      /\bstep\s*0?1\b/.test(s)
    ) {
      return {
        researcherLink: `/researcher/projects/${projectId}/submission?step=1`,
        reviewerLink: `/reviewer/projects/${projectId}?tab=section3&step=1`,
      };
    }
    // Bare "Step 2" under Section 3 without lab keywords = legacy manuscript mapping
    if (/\bstep\s*0?2\b/.test(s)) {
      return {
        researcherLink: `/researcher/projects/${projectId}/submission?step=3`,
        reviewerLink: `/reviewer/projects/${projectId}?tab=section3&step=3`,
      };
    }
    return {
      researcherLink: `/researcher/projects/${projectId}/submission`,
      reviewerLink: `/reviewer/projects/${projectId}?tab=section3`,
    };
  }

  if (s.includes("section 2") || s.includes("in-silico") || s.includes("docking")) {
    return {
      researcherLink: `/researcher/projects/${projectId}/in-silico`,
      reviewerLink: `/reviewer/projects/${projectId}?tab=section2`,
    };
  }

  if (s.includes("section 1") || s.includes("formulation") || s.includes("pharmacognos")) {
    return {
      researcherLink: `/researcher/projects/${projectId}/formulation-rd`,
      reviewerLink: `/reviewer/projects/${projectId}?tab=section1`,
    };
  }

  return { researcherLink: fallbackResearcher, reviewerLink: fallbackReviewer };
}
