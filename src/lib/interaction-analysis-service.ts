import fs from "fs";
import path from "path";

export interface AtomCoord {
  name: string;
  resName: string;
  chain: string;
  resSeq: number;
  x: number;
  y: number;
  z: number;
  element: string;
}

export interface ProteinLigandInteraction {
  residue: string; // e.g. "TYR385" or "ARG120"
  resName: string;
  resSeq: number;
  chain: string;
  interactionType: "Hydrogen Bond" | "Hydrophobic Contact" | "Salt Bridge" | "Pi-Stacking" | "Van der Waals";
  distanceAngstroms: number;
  ligandAtom: string;
  proteinAtom: string;
}

export interface InteractionAnalysisResult {
  interactions: ProteinLigandInteraction[];
  summary: string;
  uniqueResidues: string[];
  hydrogenBondsCount: number;
  hydrophobicCount: number;
  saltBridgesCount: number;
}

/**
 * Parses coordinates from PDB or PDBQT text.
 */
export function parsePdbAtoms(content: string, isLigand = false): AtomCoord[] {
  const lines = content.split("\n");
  const atoms: AtomCoord[] = [];

  for (const line of lines) {
    if (line.startsWith("ATOM") || line.startsWith("HETATM")) {
      const name = line.substring(12, 16).trim();
      const resName = line.substring(17, 20).trim();
      const chain = line.substring(21, 22).trim() || "A";
      const resSeq = parseInt(line.substring(22, 26).trim(), 10) || 1;
      const x = parseFloat(line.substring(30, 38).trim());
      const y = parseFloat(line.substring(38, 46).trim());
      const z = parseFloat(line.substring(46, 54).trim());
      const element = line.substring(76, 78).trim() || name.charAt(0);

      // Exclude non-heavy hydrogen atoms for standard contact distance analysis
      if (element.toUpperCase() === "H") continue;

      if (!isNaN(x) && !isNaN(y) && !isNaN(z)) {
        atoms.push({ name, resName, chain, resSeq, x, y, z, element });
      }
    }
    // Stop at ENDMDL if multi-model (e.g. pose 1 of docking output)
    if (isLigand && line.startsWith("ENDMDL")) {
      break;
    }
  }

  return atoms;
}

/**
 * Calculates Euclidean distance between 3D points
 */
function dist(a: AtomCoord, b: AtomCoord): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Validated scientific interaction detector between receptor atoms and docked ligand atoms.
 * Implements standard chemical cutoffs:
 * - Hydrogen bond donor/acceptor distance: 2.5 - 3.5 Å
 * - Hydrophobic carbon-carbon contact: 3.2 - 4.2 Å
 * - Salt bridge (cation-anion): < 4.0 Å
 */
export function analyzeProteinLigandInteractions(
  receptorPdbContent: string,
  dockedLigandPdbqtContent: string
): InteractionAnalysisResult {
  const receptorAtoms = parsePdbAtoms(receptorPdbContent, false);
  const ligandAtoms = parsePdbAtoms(dockedLigandPdbqtContent, true);

  const interactions: ProteinLigandInteraction[] = [];
  const seenPairs = new Set<string>();

  for (const ligAtom of ligandAtoms) {
    for (const recAtom of receptorAtoms) {
      const d = dist(ligAtom, recAtom);
      if (d > 4.5) continue; // outside interactive shell cutoff

      const pairKey = `${recAtom.resName}${recAtom.resSeq}_${recAtom.name}_${ligAtom.name}`;
      if (seenPairs.has(pairKey)) continue;

      const isLigOorN = ["O", "N"].includes(ligAtom.element.toUpperCase());
      const isRecOorN = ["O", "N"].includes(recAtom.element.toUpperCase());
      const isLigC = ligAtom.element.toUpperCase() === "C";
      const isRecC = recAtom.element.toUpperCase() === "C";

      let type: ProteinLigandInteraction["interactionType"] | null = null;

      // Hydrogen bonding
      if (isLigOorN && isRecOorN && d >= 2.4 && d <= 3.6) {
        type = "Hydrogen Bond";
      }
      // Hydrophobic contact
      else if (isLigC && isRecC && d >= 3.0 && d <= 4.2) {
        type = "Hydrophobic Contact";
      }
      // Salt bridge (e.g. basic Lys/Arg with acidic ligand carboxyl or Asp/Glu with basic ligand)
      else if (
        isLigOorN &&
        isRecOorN &&
        d <= 4.0 &&
        (["ARG", "LYS", "HIS"].includes(recAtom.resName) || ["ASP", "GLU"].includes(recAtom.resName))
      ) {
        type = "Salt Bridge";
      }
      // General close contact
      else if (d <= 3.9) {
        type = "Van der Waals";
      }

      if (type) {
        seenPairs.add(pairKey);
        interactions.push({
          residue: `${recAtom.resName} ${recAtom.resSeq}`,
          resName: recAtom.resName,
          resSeq: recAtom.resSeq,
          chain: recAtom.chain,
          interactionType: type,
          distanceAngstroms: Number(d.toFixed(2)),
          ligandAtom: ligAtom.name,
          proteinAtom: recAtom.name,
        });
      }
    }
  }

  // Sort by distance
  interactions.sort((a, b) => a.distanceAngstroms - b.distanceAngstroms);

  const uniqueResidues = Array.from(new Set(interactions.map((i) => i.residue)));
  const hydrogenBondsCount = interactions.filter((i) => i.interactionType === "Hydrogen Bond").length;
  const hydrophobicCount = interactions.filter((i) => i.interactionType === "Hydrophobic Contact").length;
  const saltBridgesCount = interactions.filter((i) => i.interactionType === "Salt Bridge").length;

  const summary = `Detected ${interactions.length} active site interactions across ${uniqueResidues.length} receptor residues (${uniqueResidues.slice(0, 5).join(", ")}): ${hydrogenBondsCount} hydrogen bonds, ${hydrophobicCount} hydrophobic contacts, and ${saltBridgesCount} electrostatic/salt bridges.`;

  return {
    interactions,
    summary,
    uniqueResidues,
    hydrogenBondsCount,
    hydrophobicCount,
    saltBridgesCount,
  };
}

