import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/auth";
import { callTogetherChat } from "@/lib/ai/together-provider";
import { generateFormulationProposal } from "@/lib/formulation-ai-service";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "RESEARCHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const projectId = parseInt(id, 10);
    if (isNaN(projectId)) {
      return NextResponse.json({ error: "Invalid project ID" }, { status: 400 });
    }

    const body = await request.json();
    const userPrompt = String(body.message || "").trim();
    if (!userPrompt) {
      return NextResponse.json({ error: "Message prompt is required" }, { status: 400 });
    }

    // 1. Fetch Project Details
    const [projectRows]: any = await pool.query(
      `
      SELECT rp.id, rp.title, rp.researchObjective, rp.researchQuestion, rp.areaOfInterest,
             COALESCE(p.commonName, rp.plantCustomName, 'Unspecified Plant') as plantName,
             p.scientificName as plantScientificName
      FROM research_projects rp
      LEFT JOIN plants p ON rp.plantId = p.id
      WHERE rp.id = ? AND rp.researcherId = ?
      LIMIT 1
      `,
      [projectId, session.id]
    );

    if (projectRows.length === 0) {
      return NextResponse.json({ error: "Project not found or unauthorized" }, { status: 404 });
    }

    const project = projectRows[0];

    // 2. Fetch Stage 1 Plant Data
    const [plantDataRows]: any = await pool.query(
      `SELECT partsStudied, extractionMethod, extractionSolvent FROM research_plant_data WHERE projectId = ? LIMIT 1`,
      [projectId]
    );
    const plantData = plantDataRows[0] || {};

    // 3. Fetch Stage 2 Phytochemical Compounds
    const [compounds]: any = await pool.query(
      `SELECT compoundName, molecularFormula, molecularWeight FROM research_compounds WHERE projectId = ? ORDER BY selectedForDocking DESC, id ASC LIMIT 8`,
      [projectId]
    );

    // 4. Fetch Stage 3 Docking Runs
    const [dockingRuns]: any = await pool.query(
      `SELECT ligandName, targetProtein, bindingAffinity, units FROM docking_runs WHERE projectId = ? AND bindingAffinity IS NOT NULL LIMIT 6`,
      [projectId]
    );

    // 5. Fetch Stage 1 Literature References
    const [litRows]: any = await pool.query(
      `SELECT title, authors, year, journalSource AS journal FROM literature_references WHERE projectId = ? ORDER BY id ASC LIMIT 6`,
      [projectId]
    );

    const isProposalRequest =
      userPrompt.toLowerCase().includes("proposal") ||
      userPrompt.toLowerCase().includes("generate formulation") ||
      userPrompt.toLowerCase().includes("suggest ingredients") ||
      userPrompt.toLowerCase().includes("recipe") ||
      userPrompt.toLowerCase().includes("complete formulation");

    let structuredProposal = null;
    if (isProposalRequest) {
      try {
        structuredProposal = await generateFormulationProposal({
          projectId,
          plantName: project.plantName,
          plantScientificName: project.plantScientificName,
          plantPart: plantData.partsStudied || "Leaves",
          extractionSolvent: plantData.extractionSolvent || "70% Aqueous Ethanol",
          extractionMethod: plantData.extractionMethod || "Ultrasonic Extraction",
          researchObjective: project.researchObjective,
          researchQuestion: project.researchQuestion,
          dosageFormType: body.dosageFormType || "Topical Hydrogel",
          purpose: project.researchObjective || "Botanical Formulation Design",
          compounds: compounds || [],
          dockingRuns: dockingRuns || [],
          literature: litRows || [],
        });
      } catch (err) {
        console.warn("[formulation/assistant] Proposal generation failed:", err);
      }
    }

    // Build specialized botanical formulation prompt
    const systemPrompt = `You are the NatureAide Senior Formulation Scientist and Pharmaceutical Compounding Expert.
You assist researchers in Stage 4: Formulation Development within the NatureAide scientific workbench.

RESEARCH CONTEXT:
- Plant: ${project.plantName} (${project.plantScientificName || "Botanical species"})
- Plant Part: ${plantData.partsStudied || "Leaves / Aerial parts"}
- Extraction Solvent: ${plantData.extractionSolvent || "Aqueous / Hydroalcoholic"}
- Extraction Method: ${plantData.extractionMethod || "Standardized Maceration / Extraction"}
- Research Objective: ${project.researchObjective || "Botanical formulation investigation"}
- Screened Phytochemicals (Stage 2): ${(compounds || []).map((c: any) => c.compoundName).join(", ") || "Standardized botanical extract"}
- Docking Findings (Stage 3): ${(dockingRuns || []).map((d: any) => `${d.ligandName} vs ${d.targetProtein} (${d.bindingAffinity} ${d.units || "kcal/mol"})`).join("; ") || "Molecular docking simulations in progress"}
- Literature Backing: ${(litRows || []).map((l: any) => l.title).slice(0, 3).join("; ") || "Peer-reviewed literature"}

MANDATORY SCIENTIFIC & SAFETY PRINCIPLES:
1. NEVER invent or fabricate unsupported numerical extract concentrations. If an active botanical extract concentration is unquantified in peer-reviewed literature, you MUST explicitly state that it requires laboratory concentration-response validation ("Concentration Requires Experimental Validation").
2. DO NOT claim that any preliminary botanical formulation proposal is clinically approved or ready for commercial human consumption. Always emphasize preclinical developmental status.
3. Recommend standard, pharmacopeially recognized pharmaceutical excipients (USP-NF, Ph. Eur., Philippine Pharmacopeia) such as Carbomer/Carbopol, Propylene Glycol, Glycerin, Methylparaben, Triethanolamine, Microcrystalline Cellulose, etc.
4. Explain the precise functional role of each component (e.g., Gelling Agent, Co-Solvent, Humectant, Preservative, Bioadhesive, Viscosity Enhancer).
5. Always address excipient compatibility, pH stability range, and storage limitations.
6. Keep your tone professional, authoritative, encouraging, and clear for academic researchers.`;

    const aiResponse = await callTogetherChat(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      { maxTokens: 1200, temperature: 0.25 }
    );

    const replyText =
      aiResponse.content ||
      `Based on the scientific evidence for ${project.plantName}, preliminary formulation should utilize standardized extraction of ${plantData.partsStudied || "the plant"} with ${plantData.extractionSolvent || "aqueous ethanol"}. The active fraction carrying verified marker compounds (such as ${(compounds || [])[0]?.compoundName || "secondary metabolites"}) must have its final dosage concentration experimentally validated through bioassay-guided titration.`;

    return NextResponse.json({
      success: true,
      reply: replyText,
      proposal: structuredProposal,
    });
  } catch (error: any) {
    console.error("[formulation/assistant] Error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to process formulation assistant request." },
      { status: 500 }
    );
  }
}
