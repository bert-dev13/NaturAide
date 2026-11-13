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

const SECTION_TITLES: Record<string, string> = {
  "1": "Botanical & Extraction",
  "2": "Formulation Development",
  "3": "Batch Analysis & QC",
  "4": "In-Silico Screening",
  "5": "Molecular Docking",
  "6": "Computational Findings",
  "7": "Limitations & Validation",
};

/** Split a compiled dossier into numbered section bodies for change detection. */
export function parseCompiledSections(text: string): Record<string, string> {
  const sections: Record<string, string> = {};
  const parts = String(text || "").split(/(?=^\d+\.\s)/m);
  for (const part of parts) {
    const match = part.match(/^(\d+)\.\s*([^\n]*)([\s\S]*)$/);
    if (!match) continue;
    sections[match[1]] = part.trim();
  }
  return sections;
}

/** Return human-readable labels for dossier sections that differ between two compiles. */
export function diffCompiledSectionLabels(
  previousText: string,
  nextText: string
): string[] {
  const prev = parseCompiledSections(previousText);
  const next = parseCompiledSections(nextText);
  const keys = Array.from(
    new Set([...Object.keys(prev), ...Object.keys(next)])
  ).sort((a, b) => Number(a) - Number(b));

  const changed: string[] = [];
  for (const key of keys) {
    if ((prev[key] || "").trim() !== (next[key] || "").trim()) {
      changed.push(SECTION_TITLES[key] || `Section ${key}`);
    }
  }
  return changed;
}

export function isLikelyResearcherEditedSummary(
  currentText: string,
  compiledText: string
): boolean {
  const current = String(currentText || "").trim();
  const compiled = String(compiledText || "").trim();
  if (!current) return false;
  if (current === compiled) return false;
  if (current.length < 120) return false;
  if (/^Executive research summary of .+\.?$/i.test(current)) return false;
  return true;
}
