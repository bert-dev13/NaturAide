import { lookupTargetByPdbId } from "@/lib/target-protein-catalog";

export interface StructureHit {
  pdbId: string;
  title: string;
  description: string;
  gene: string | null;
  organism: string | null;
  method: string | null;
  resolution: number | null;
  pubmedId: string | null;
  doi: string | null;
  rcsbUrl: string;
}

/**
 * Strips verbose UniProt / RCSB synonym lists and [Contains: ...] / [Cleaved into: ...]
 * annotations from target protein descriptions, preferring curated catalog names when available.
 */
export function cleanTargetProteinName(rawName: string, pdbId?: string | null): string {
  if (pdbId) {
    const curated = lookupTargetByPdbId(pdbId);
    if (curated?.targetName) {
      return curated.targetName;
    }
  }

  let cleaned = String(rawName || "").trim();
  if (!cleaned) return "Target Protein";

  // Remove [Contains: ...] or [Cleaved into: ...] blocks (including truncated ones)
  cleaned = cleaned.replace(/\s*\[(Contains|Cleaved into|Includes):[\s\S]*$/i, "").trim();

  // If there are multiple chained parenthetical synonyms like:
  // "Tumor necrosis factor (TNF-alpha) (Tumor necrosis factor ligand superfamily member 2) (TNF-a) (Cachectin)"
  // keep the base name and at most the first short acronym (<= 15 chars), stripping the rest.
  const firstParenIdx = cleaned.indexOf("(");
  if (firstParenIdx > 0) {
    const baseName = cleaned.slice(0, firstParenIdx).trim();
    const rest = cleaned.slice(firstParenIdx);
    const parenMatches = Array.from(rest.matchAll(/\(([^()]+)\)/g)).map((m) => m[1].trim());
    const shortAcronym = parenMatches.find((p) => p.length <= 15 && !/\b(member|family|form|subunit|chain)\b/i.test(p));
    cleaned = shortAcronym ? `${baseName} (${shortAcronym})` : baseName;
  }

  return cleaned || String(rawName || "Target Protein").trim();
}

function pdbOk(id: string) {
  return /^[0-9][A-Z0-9]{3}$/.test(id);
}

function doiOf(raw: unknown): string | null {
  const m = String(raw || "").match(/10\.\d{4,9}\/[^\s]+/);
  return m ? m[0].replace(/[.,;]+$/, "") : null;
}

function pubmedOf(raw: unknown): string | null {
  const m = String(raw || "").match(/^\d{1,9}$/);
  return m ? m[0] : null;
}

export async function describeStructure(pdbId: string): Promise<StructureHit | null> {
  const id = pdbId.trim().toUpperCase();
  if (!pdbOk(id)) return null;
  const entryRes = await fetch(`https://data.rcsb.org/rest/v1/core/entry/${id}`, { cache: "no-store" });
  if (!entryRes.ok) return null;
  const entry = await entryRes.json();
  const title = String(entry?.struct?.title || "").trim();
  if (!title) return null;

  let description = title;
  let gene: string | null = null;
  let organism: string | null = null;
  try {
    const polyRes = await fetch(`https://data.rcsb.org/rest/v1/core/polymer_entity/${id}/1`, { cache: "no-store" });
    if (polyRes.ok) {
      const poly = await polyRes.json();
      const desc = String(poly?.rcsb_polymer_entity?.pdbx_description || "").trim();
      if (desc) description = cleanTargetProteinName(desc, id);
      const geneName = poly?.rcsb_polymer_entity?.rcsb_gene_name;
      const symbol = Array.isArray(geneName) ? geneName[0]?.value || geneName[0] : geneName;
      if (typeof symbol === "string" && symbol.trim()) gene = symbol.trim();
      const org = poly?.rcsb_entity_source_organism?.[0];
      const sci = org?.ncbi_scientific_name || org?.scientific_name;
      if (typeof sci === "string" && sci.trim()) organism = sci.trim();
    }
  } catch {
    /* polymer metadata is optional; the entry title is enough to identify the deposit */
  }

  const citation = entry?.rcsb_primary_citation || {};
  const resolution = Array.isArray(entry?.rcsb_entry_info?.resolution_combined)
    ? Number(entry.rcsb_entry_info.resolution_combined[0])
    : null;

  return {
    pdbId: id,
    title,
    description,
    gene,
    organism,
    method: entry?.exptl?.[0]?.method ? String(entry.exptl[0].method) : null,
    resolution: Number.isFinite(resolution) ? resolution : null,
    pubmedId: pubmedOf(citation.pdbx_database_id_PubMed),
    doi: doiOf(citation.pdbx_database_id_DOI),
    rcsbUrl: `https://www.rcsb.org/structure/${id}`,
  };
}

export async function searchStructures(query: string): Promise<StructureHit[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  if (pdbOk(q.toUpperCase())) {
    const one = await describeStructure(q);
    return one ? [one] : [];
  }

  const res = await fetch("https://search.rcsb.org/rcsbsearch/v2/query", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      query: { type: "terminal", service: "full_text", parameters: { value: q } },
      return_type: "entry",
      request_options: { paginate: { start: 0, rows: 6 } },
    }),
    cache: "no-store",
  });
  if (res.status === 204) return [];
  if (!res.ok) throw new Error(`RCSB search failed (${res.status}).`);
  const data = await res.json();
  const ids: string[] = (data?.result_set || [])
    .map((row: { identifier?: string }) => String(row.identifier || "").toUpperCase())
    .filter(pdbOk)
    .slice(0, 6);
  const hits = await Promise.all(ids.map((id) => describeStructure(id).catch(() => null)));
  return hits.filter((hit): hit is StructureHit => Boolean(hit));
}
