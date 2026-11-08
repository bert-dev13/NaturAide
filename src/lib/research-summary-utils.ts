/**
 * Client-safe helpers for Section 3 research summary stubs vs compiled dossiers.
 * Keep this file free of Node/DB imports so client components can use it.
 */

/**
 * Detect placeholder / seed stubs that should be replaced by the full
 * Sections 1–2 compiled dossier (e.g. "Executive research summary of Akapulko topical gel.").
 */
export function isIncompleteResearchSummary(
  savedSummary: string | null | undefined,
  compiledSummaryText: string | null | undefined
): boolean {
  const saved = String(savedSummary || "").trim();
  const compiled = String(compiledSummaryText || "").trim();

  if (!saved) return true;
  if (!compiled) return false;

  // Known test/seed one-liners
  if (/^Executive research summary of .+\.?$/i.test(saved)) return true;
  if (saved.length < 120 && compiled.length > Math.max(240, saved.length * 3)) return true;

  const savedLooksCompiled =
    /1\.\s*Botanical/i.test(saved) ||
    /Formulation Development/i.test(saved) ||
    /Molecular Docking Results/i.test(saved);
  const compiledLooksStructured =
    /1\.\s*Botanical/i.test(compiled) || /Formulation Development/i.test(compiled);

  if (compiledLooksStructured && !savedLooksCompiled && saved.length < compiled.length * 0.4) {
    return true;
  }

  return false;
}

export function resolveResearchSummaryText(
  savedSummary: string | null | undefined,
  compiledSummaryText: string | null | undefined
): string {
  const saved = String(savedSummary || "").trim();
  const compiled = String(compiledSummaryText || "").trim();
  if (isIncompleteResearchSummary(saved, compiled)) {
    return compiled || saved;
  }
  return saved || compiled;
}
