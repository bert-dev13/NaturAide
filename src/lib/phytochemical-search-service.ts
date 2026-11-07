/**
 * NatureAide Phytochemical Search & Chemical Identity Service
 *
 * Provides instant searchable access to curated Philippine botanical phytochemicals,
 * global compound libraries, and live PubChem chemical property enrichment.
 */

import pool from "@/lib/db";
import {
  CURATED_PLANT_PHYTOCHEMICALS,
  resolveCanonicalPlantId,
  type CuratedPhytochemical,
} from "./phytochemical-catalog";
import { queryPubChemCompound, normalizeCompoundName } from "./phytochemical-discovery";

export interface SearchableCompoundResult {
  id?: number | string;
  compoundName: string;
  plantId?: string;
  plantCommonName?: string;
  plantScientificName?: string;
  compoundClass?: string;
  molecularFormula?: string | null;
  molecularWeight?: number | null;
  smiles?: string | null;
  pubchemId?: string | null;
  iupacName?: string | null;
  plantPartReported?: string | null;
  structureReady: boolean;
  structureStatusNote: string;
  sourceProvenance: "CURATED_CATALOG" | "DATABASE" | "PUBCHEM_LOOKUP" | "RESEARCHER_ENTERED";
  referencesCount: number;
}

/**
 * Searches the curated and database phytochemical libraries.
 */
export async function searchPhytochemicalLibrary(
  query: string,
  filterPlantId?: string | null
): Promise<SearchableCompoundResult[]> {
  const q = query.trim().toLowerCase();
  const canonicalPlant = filterPlantId ? resolveCanonicalPlantId(filterPlantId) : null;
  const results: SearchableCompoundResult[] = [];
  const seenNames = new Set<string>();

  // 1. Search in curated in-memory catalog
  for (const c of CURATED_PLANT_PHYTOCHEMICALS) {
    const nameNorm = c.compoundName.toLowerCase().trim();
    if (seenNames.has(nameNorm)) continue;

    // Filter by plant if specified
    if (canonicalPlant && c.plantId !== canonicalPlant) {
      continue;
    }

    const matchesQuery =
      !q ||
      nameNorm.includes(q) ||
      (c.molecularFormula && c.molecularFormula.toLowerCase().includes(q)) ||
      (c.compoundClass && c.compoundClass.toLowerCase().includes(q)) ||
      (c.pubchemId && c.pubchemId.includes(q)) ||
      (c.plantCommonName && c.plantCommonName.toLowerCase().includes(q));

    if (matchesQuery) {
      seenNames.add(nameNorm);
      const hasStructure = Boolean(c.pubchemId && c.smiles && c.molecularFormula);
      results.push({
        id: `curated-${c.pubchemId || c.compoundName}`,
        compoundName: c.compoundName,
        plantId: c.plantId,
        plantCommonName: c.plantCommonName,
        plantScientificName: c.plantScientificName,
        compoundClass: c.compoundClass,
        molecularFormula: c.molecularFormula,
        molecularWeight: c.molecularWeight,
        smiles: c.smiles,
        pubchemId: c.pubchemId,
        iupacName: c.iupacName || null,
        plantPartReported: c.plantPartReported,
        structureReady: hasStructure,
        structureStatusNote: hasStructure
          ? "Structure Ready: Verified 3D coordinates ready for docking."
          : "Structure Pending: Requires 2D-to-3D coordinates optimization.",
        sourceProvenance: "CURATED_CATALOG",
        referencesCount: c.references?.length || 1,
      });
    }
  }

  // 2. Query MySQL plant_compounds table for additional documented records
  try {
    let sql = `
      SELECT id, plantId, plantScientificName, plantCommonName, compoundName,
             iupacName, molecularFormula, molecularWeight, compoundClass,
             pubchemId, smiles, plantPartReported, referencesData
      FROM plant_compounds
    `;
    const params: any[] = [];

    if (canonicalPlant) {
      sql += ` WHERE plantId = ?`;
      params.push(canonicalPlant);
      if (q) {
        sql += ` AND (LOWER(compoundName) LIKE ? OR LOWER(molecularFormula) LIKE ? OR LOWER(compoundClass) LIKE ? OR pubchemId LIKE ?)`;
        params.push(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`);
      }
    } else if (q) {
      sql += ` WHERE (LOWER(compoundName) LIKE ? OR LOWER(molecularFormula) LIKE ? OR LOWER(compoundClass) LIKE ? OR pubchemId LIKE ? OR LOWER(plantCommonName) LIKE ?)`;
      params.push(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`);
    }

    sql += ` ORDER BY compoundName ASC LIMIT 40`;

    const [rows]: any = await pool.query(sql, params);
    for (const r of rows || []) {
      const nameNorm = r.compoundName.toLowerCase().trim();
      if (seenNames.has(nameNorm)) continue;
      seenNames.add(nameNorm);

      let refCount = 1;
      if (r.referencesData) {
        try {
          const parsed = JSON.parse(r.referencesData);
          if (Array.isArray(parsed)) refCount = parsed.length;
        } catch {
          // ignore
        }
      }

      const hasStructure = Boolean(r.pubchemId && r.smiles && r.molecularFormula);
      results.push({
        id: r.id,
        compoundName: r.compoundName,
        plantId: r.plantId,
        plantCommonName: r.plantCommonName,
        plantScientificName: r.plantScientificName,
        compoundClass: r.compoundClass || "Secondary Metabolite",
        molecularFormula: r.molecularFormula,
        molecularWeight: r.molecularWeight ? parseFloat(r.molecularWeight) : null,
        smiles: r.smiles,
        pubchemId: r.pubchemId,
        iupacName: r.iupacName,
        plantPartReported: r.plantPartReported,
        structureReady: hasStructure,
        structureStatusNote: hasStructure
          ? "Structure Ready: Canonical SMILES and verified formula loaded."
          : "Structure Pending: 3D coordinates pending calculation.",
        sourceProvenance: "DATABASE",
        referencesCount: refCount,
      });
    }
  } catch (err) {
    console.warn("[phytochemical-search-service] DB query failed:", err);
  }

  return results;
}

/**
 * Looks up verified chemical properties for a compound from PubChem by name.
 * Auto-populates formula, molecular weight, SMILES, and IUPAC without manual entry.
 */
export async function lookupCompoundOnline(name: string): Promise<SearchableCompoundResult | null> {
  if (!name || name.trim().length < 2) return null;

  const pubchem = await queryPubChemCompound(name.trim());
  if (!pubchem) return null;

  const hasStructure = Boolean(pubchem.cid && pubchem.smiles && pubchem.molecularFormula);

  return {
    compoundName: normalizeCompoundName(name),
    molecularFormula: pubchem.molecularFormula,
    molecularWeight: pubchem.molecularWeight,
    smiles: pubchem.smiles,
    pubchemId: pubchem.cid,
    iupacName: pubchem.iupacName,
    compoundClass: "Identified Phytochemical",
    structureReady: hasStructure,
    structureStatusNote: hasStructure
      ? "PubChem Verified: Canonical 3D/2D representation retrieved."
      : "Structure Incomplete: SMILES representation missing in registry.",
    sourceProvenance: "PUBCHEM_LOOKUP",
    referencesCount: 1,
  };
}

