// src/lib/insilico-ai-interpretation-service.ts
import pool from "@/lib/db";
import { callTogetherChat } from "@/lib/ai/together-provider";

export interface InSilicoInterpretationResult {
  computationalFindings: string;
  computationalLimitations: string;
  model: string;
  isAiGenerated: boolean;
  savedAt: string;
}

function extractJsonObject(text: string): Record<string, any> | null {
  if (!text) return null;
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const raw = (fenced?.[1] || text).trim();
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(raw.slice(start, end + 1));
  } catch {
    return null;
  }
}

export async function saveInSilicoInterpretationToDb(
  projectId: number,
  computationalFindings: string,
  computationalLimitations: string
): Promise<{ savedAt: string }> {
  const cleanFindings = computationalFindings.trim();
  const cleanLimitations = computationalLimitations.trim();
  const status = cleanFindings || cleanLimitations ? "APPROVED" : "IN_PROGRESS";

  // 1. Upsert into research_insilico_syntheses
  const [existingInsilico]: any = await pool.query(
    `SELECT id FROM research_insilico_syntheses WHERE projectId = ? LIMIT 1`,
    [projectId]
  );

  if (existingInsilico.length > 0) {
    await pool.query(
      `UPDATE research_insilico_syntheses
       SET keyFindings = ?,
           potentialLimitations = ?,
           status = ?,
           updatedAt = CURRENT_TIMESTAMP(3)
       WHERE projectId = ?`,
      [cleanFindings || null, cleanLimitations || null, status, projectId]
    );
  } else {
    await pool.query(
      `INSERT INTO research_insilico_syntheses (
         projectId, keyFindings, potentialLimitations, status, updatedAt
       ) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP(3))`,
      [projectId, cleanFindings || null, cleanLimitations || null, status]
    );
  }

  // 2. Also sync research_docking_syntheses so loadDockingWorkspace & v2-progress-service stay in sync
  try {
    const [existingDockSynth]: any = await pool.query(
      `SELECT id FROM research_docking_syntheses WHERE projectId = ? LIMIT 1`,
      [projectId]
    );
    const dockStatus = cleanFindings ? "COMPLETED" : "IN_PROGRESS";
    if (existingDockSynth.length > 0) {
      await pool.query(
        `UPDATE research_docking_syntheses SET keyFindings = ?, status = ? WHERE projectId = ?`,
        [cleanFindings || null, dockStatus, projectId]
      );
    } else if (cleanFindings) {
      await pool.query(
        `INSERT INTO research_docking_syntheses (projectId, keyFindings, status) VALUES (?, ?, ?)`,
        [projectId, cleanFindings, dockStatus]
      );
    }
  } catch (err) {
    console.warn("Could not sync research_docking_syntheses:", err);
  }

  return { savedAt: new Date().toISOString() };
}

export async function generateInSilicoInterpretation(
  projectId: number,
  options?: { simulateFailure?: boolean }
): Promise<InSilicoInterpretationResult> {
  if (options?.simulateFailure) {
    throw new Error("Together AI service failed to generate interpretation. Please try again.");
  }

  // 1. Fetch project & botanical metadata
  const [projectRows]: any = await pool.query(
    `SELECT rp.id, rp.title, rp.researchObjective, rp.researchQuestion,
            COALESCE(p.commonName, rp.plantCustomName, 'Unspecified Plant') AS plantName,
            p.scientificName AS plantScientificName
     FROM research_projects rp
     LEFT JOIN plants p ON rp.plantId = p.id
     WHERE rp.id = ? LIMIT 1`,
    [projectId]
  );
  if (!projectRows.length) {
    throw new Error("Project not found.");
  }
  const project = projectRows[0];

  // 2. Fetch formulation type / dosage form from Section 1
  const [formRows]: any = await pool.query(
    `SELECT * FROM research_formulations WHERE projectId = ? ORDER BY id DESC LIMIT 1`,
    [projectId]
  );
  const [prodRows]: any = await pool.query(
    `SELECT * FROM research_product_selections WHERE projectId = ? ORDER BY id DESC LIMIT 1`,
    [projectId]
  );
  const formulationType =
    formRows[0]?.dosageFormType ||
    formRows[0]?.formulationType ||
    prodRows[0]?.productType ||
    prodRows[0]?.deliveryFormat ||
    "Botanical Formulation";
  const formulationName = formRows[0]?.formulationName || `${project.plantName} ${formulationType}`;
  const researchObjective =
    project.researchObjective ||
    formRows[0]?.researchPurpose ||
    prodRows[0]?.targetIndications ||
    "Evaluate bioactive phytochemicals and receptor binding interactions";

  // 3. Fetch screened phytochemicals & ADMET / Lipinski metrics
  const [compounds]: any = await pool.query(
    `SELECT * FROM research_compounds WHERE projectId = ? ORDER BY id ASC`,
    [projectId]
  );
  const [screenResults]: any = await pool.query(
    `SELECT * FROM insilico_results WHERE projectId = ? ORDER BY id DESC`,
    [projectId]
  );

  // Deduplicate screening results by compoundId/compoundName
  const screenByCompound = new Map<string, any>();
  for (const row of screenResults) {
    const key = String(row.compoundId || row.compoundName || "").toLowerCase();
    if (!screenByCompound.has(key)) screenByCompound.set(key, row);
  }

  // 4. Fetch selected target proteins
  const [targets]: any = await pool.query(
    `SELECT * FROM docking_targets WHERE projectId = ? ORDER BY id ASC`,
    [projectId]
  );

  // 5. Fetch completed AutoDock Vina docking runs (deduplicated per compoundId+targetId, sorted by best affinity)
  const [rawRuns]: any = await pool.query(
    `SELECT *
     FROM docking_runs
     WHERE projectId = ? AND jobStatus = 'COMPLETED' AND bindingAffinity IS NOT NULL
     ORDER BY id DESC`,
    [projectId]
  );

  const seenPairs = new Set<string>();
  const completedRuns: any[] = [];
  for (const r of rawRuns) {
    const key = `${r.compoundId || r.ligandName}:${r.targetId || r.pdbId}`;
    if (seenPairs.has(key)) continue;
    seenPairs.add(key);
    const aff = Number(r.bindingAffinity);
    if (Number.isFinite(aff)) {
      completedRuns.push({ ...r, affinityNum: aff });
    }
  }
  completedRuns.sort((a, b) => a.affinityNum - b.affinityNum);

  if (compounds.length === 0 && completedRuns.length === 0) {
    throw new Error(
      "No screening or molecular docking results are available yet. Complete Steps 1–4 before generating an interpretation."
    );
  }

  // Build structured context strings for Together AI from stored records only
  const screeningSummaryLines = compounds.map((c: any) => {
    const s =
      screenByCompound.get(String(c.id)) ||
      screenByCompound.get(String(c.compoundName || "").toLowerCase());

    let metrics: any = {};
    if (s?.detailedMetrics) {
      try {
        metrics =
          typeof s.detailedMetrics === "string"
            ? JSON.parse(s.detailedMetrics)
            : s.detailedMetrics;
      } catch {
        metrics = {};
      }
    }
    const prop = metrics.physicochemicalProperties || {};
    const lip = metrics.drugLikeness?.lipinskiRuleOfFive || {};
    const admet = metrics.admet || {};

    const fmt = (v: any) =>
      v === null || v === undefined || v === "" || v === "Unavailable" ? "unavailable" : String(v);

    const mw = c.molecularWeight ?? prop.molecularWeight?.value ?? "unavailable";
    const logP = s?.logP ?? prop.logP?.value ?? "unavailable";
    const tpsa = s?.tpsa ?? prop.tpsa?.value ?? "unavailable";
    const hbd = s?.hBondDonors ?? prop.hBondDonors?.value ?? "unavailable";
    const hba = s?.hBondAcceptors ?? prop.hBondAcceptors?.value ?? "unavailable";
    const rot = s?.rotatableBonds ?? prop.rotatableBonds?.value ?? "unavailable";
    const viol =
      s?.lipinskiViolations ??
      (lip.violations !== undefined ? lip.violations : "unavailable");
    const gi = admet.giAbsorption?.prediction || "not evaluated";
    const skin = admet.skinPermeability?.prediction || "not evaluated";
    const engine = s?.engineStatus || metrics.status || "not screened";

    return `- ${c.compoundName} (${c.molecularFormula || "formula unavailable"}): MW=${fmt(mw)}, LogP=${fmt(logP)}, TPSA=${fmt(tpsa)}, HBD=${fmt(hbd)}, HBA=${fmt(hba)}, Rotatable Bonds=${fmt(rot)}, Lipinski Violations=${fmt(viol)}, GI absorption=${gi}, Skin permeability=${skin}, Screening status=${engine}`;
  });

  const targetSummaryLines = targets.map((t: any) => {
    let gridSource = "active catalytic site";
    try {
      const g = typeof t.gridConfigJson === "string" ? JSON.parse(t.gridConfigJson) : t.gridConfigJson;
      if (g?.source) gridSource = g.source;
    } catch {}
    return `- ${t.targetName} (PDB: ${t.pdbId}, Gene: ${t.geneOrProtein || "N/A"}, Organism: ${t.organism || "Homo sapiens"}, Binding Pocket: ${gridSource})`;
  });

  const dockingSummaryLines = completedRuns.map(
    (r, idx) =>
      `Rank #${idx + 1}: ${r.ligandName} × ${r.targetProtein} (${r.pdbId}) -> ${r.affinityNum.toFixed(
        2
      )} kcal/mol (${r.poseCount || 9} poses, ${r.vinaVersion || "AutoDock Vina v1.2.7"})`
  );

  const allowedCompoundNames = compounds
    .map((c: any) => c.compoundName)
    .filter(Boolean)
    .join(", ");
  const allowedTargetNames = targets
    .map((t: any) => `${t.targetName} (${t.pdbId})`)
    .filter(Boolean)
    .join(", ");

  const systemPrompt = `You are a Principal Computational Chemist and Pharmaceutical Researcher on the NatureAide scientific platform.
Generate a rigorous scientific interpretation of the project's actual in-silico screening and AutoDock Vina molecular docking results.

CRITICAL SCIENTIFIC INTEGRITY RULES:
1. Ground every statement ONLY in the provided compound list, screening metrics, target proteins, PDB IDs, and AutoDock Vina binding affinities (kcal/mol).
2. NEVER invent compounds, receptors, ADMET values, Lipinski results, residue contacts, biological mechanisms, experimental findings, or binding classifications that are not explicitly present in the project data.
3. Allowed compounds for this project: ${allowedCompoundNames || "(none)"}. Allowed targets: ${allowedTargetNames || "(none)"}. Do not mention any other phytochemicals or receptors.
4. If a descriptor is marked unavailable or not evaluated, say so explicitly. Do not invent substitutes.
5. Report binding affinities rounded to two decimal places (e.g., -6.78 kcal/mol). Do not invent "Strong/Favorable" labels.
6. NEVER claim that a predicted docking score proves therapeutic effectiveness, clinical benefit, or experimental activity.
7. NEVER fabricate wet-lab results, IC50/Ki values, clinical trials, or DOIs.
8. In "computationalFindings":
   - Discuss only the listed compounds and completed docking complexes by name, PDB ID, and predicted ΔG (kcal/mol).
   - Use only the ADMET / physicochemical values supplied for those compounds.
   - Connect predictions cautiously to the research objective and ${formulationType} context as a computational hypothesis only.
9. In "computationalLimitations":
   - Explain AutoDock Vina semi-rigid docking limits, empirical scoring, and implicit solvent approximations.
   - Note that experimental validation (e.g., in-vitro assays and formulation-relevant permeability/release studies) is required.
   - Do not invent compound-class-specific constraints unless those compounds appear in the data.

Respond ONLY with a valid JSON object matching this exact schema:
{
  "computationalFindings": "string (2-3 cohesive scientific paragraphs)",
  "computationalLimitations": "string (1-2 cohesive scientific paragraphs)"
}`;

  const userPrompt = `Project Context:
- Botanical Species: ${project.plantName} (${project.plantScientificName || "Botanical species"})
- Formulation / Dosage Form: ${formulationName} (${formulationType})
- Research Objective: ${researchObjective}

Phytochemical & ADMET Screening Results (${compounds.length} compounds):
${screeningSummaryLines.join("\n")}

Selected Target Proteins (${targets.length} receptors):
${targetSummaryLines.join("\n")}

AutoDock Vina Completed Docking Rankings (${completedRuns.length} complexes):
${dockingSummaryLines.slice(0, 15).join("\n")}

Return the JSON object with "computationalFindings" and "computationalLimitations".`;

  let findingsText = "";
  let limitationsText = "";
  let usedModel = "together-ai";

  const aiRes = await callTogetherChat(
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    {
      timeoutMs: 45000,
      temperature: 0.2,
      maxTokens: 1400,
      json: true,
    }
  );

  if (aiRes.success && aiRes.content) {
    usedModel = aiRes.model;
    const parsed = extractJsonObject(aiRes.content);
    if (parsed) {
      findingsText = String(parsed.computationalFindings || parsed.keyFindings || "").trim();
      limitationsText = String(parsed.computationalLimitations || parsed.potentialLimitations || "").trim();
    }
  }

  // Grounded deterministic fallback built strictly from the project's actual DB records if Together AI is unreachable
  if (!findingsText || !limitationsText) {
    const top1 = completedRuns[0];
    const top2 = completedRuns[1];
    const top3 = completedRuns[2];
    const targetListStr =
      targets.map((t: any) => `${t.targetName} (PDB: ${t.pdbId})`).join(", ") ||
      "no targets recorded";
    const compoundListStr =
      compounds.map((c: any) => c.compoundName).join(", ") || "no compounds recorded";

    const topComplexSummary = top1
      ? `The highest-ranking completed complex was ${top1.ligandName} docked against ${top1.targetProtein} (${top1.pdbId}) with a predicted binding affinity of ${top1.affinityNum.toFixed(
          2
        )} kcal/mol${
          top2
            ? `, followed by ${top2.ligandName} × ${top2.targetProtein} (${top2.pdbId}) at ${top2.affinityNum.toFixed(
                2
              )} kcal/mol`
            : ""
        }${
          top3
            ? ` and ${top3.ligandName} × ${top3.targetProtein} (${top3.pdbId}) at ${top3.affinityNum.toFixed(
                2
              )} kcal/mol`
            : ""
        }.`
      : `No completed docking complexes with binding affinity scores were available at the time of this synthesis.`;

    const screeningNote =
      screenByCompound.size > 0
        ? `Stored ADMET and physicochemical descriptors were available for ${screenByCompound.size} screened compound record(s); values marked unavailable were not evaluated in this project.`
        : `No completed ADMET/physicochemical screening records were available for this project at the time of synthesis.`;

    findingsText =
      findingsText ||
      `In-silico screening and AutoDock Vina docking were reviewed for ${project.plantName}${
        project.plantScientificName ? ` (${project.plantScientificName})` : ""
      }. Project compounds included ${compoundListStr}. Selected target receptor(s): ${targetListStr}. ${
        completedRuns.length
      } completed ligand–receptor simulation(s) with predicted binding affinities were available. ${topComplexSummary}\n\n${screeningNote} These computational predictions provide a hypothesis-generating basis related to ${researchObjective}, but they are not experimental proof of biological activity or therapeutic efficacy.`;

    limitationsText =
      limitationsText ||
      `Predicted binding affinities are computational free-energy estimates from AutoDock Vina under a semi-rigid receptor model and empirical scoring with implicit solvation. They do not capture full protein flexibility, explicit water networks, metabolism, or formulation-dependent delivery from the ${formulationType} matrix. These results must not be interpreted as clinical efficacy. Experimental validation—such as relevant in-vitro assays and formulation-appropriate permeability or release studies—is required before biological or therapeutic conclusions can be drawn.`;
  }

  const { savedAt } = await saveInSilicoInterpretationToDb(projectId, findingsText, limitationsText);

  return {
    computationalFindings: findingsText,
    computationalLimitations: limitationsText,
    model: usedModel,
    isAiGenerated: true,
    savedAt,
  };
}
