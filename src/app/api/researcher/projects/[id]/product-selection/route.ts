import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import pool from "@/lib/db";
import { callTogetherChat } from "@/lib/ai/together-provider";
import { generateScientificRationale } from "@/lib/product-format-catalog";
import { ensureV2ResearchSchema } from "@/lib/v2-research-schema";

// GET /api/researcher/projects/[id]/product-selection
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "RESEARCHER" && session.role !== "REVIEWER")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const projectId = parseInt(id, 10);
    if (isNaN(projectId)) {
      return NextResponse.json({ error: "Invalid project ID" }, { status: 400 });
    }

    await ensureV2ResearchSchema();

    const [rows]: any = await pool.query(
      "SELECT * FROM research_product_selections WHERE projectId = ? LIMIT 1",
      [projectId]
    );

    return NextResponse.json({
      success: true,
      selection: rows[0] || null,
    });
  } catch (error: any) {
    console.error("Error fetching product selection:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch selection" }, { status: 500 });
  }
}

// POST /api/researcher/projects/[id]/product-selection
export async function POST(
  req: Request,
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

    await ensureV2ResearchSchema();

    const body = await req.json();

    // ACTION: AI ASSISTED RATIONALE REFINEMENT
    if (body.action === "generate-ai-rationale") {
      let {
        plantName = "Botanical Specimen",
        plantScientificName,
        deliveryFormat = "Topical Hydrogel",
        productType = "Topical Research Formulation",
        targetIndications = "Cutaneous inflammatory research",
        intendedPopulation = "Adults",
        packagingType = "Airless Pump Bottle (50 mL)",
        plantParts = [],
        researchObjective = "",
      } = body;

      // Resolve verified botanical names if provided plantName is missing or matches project title
      let resolvedPlantName = plantName;
      let resolvedScientificName = plantScientificName;

      try {
        const [plantRows]: any = await pool.query(
          `SELECT commonName, scientificName FROM research_plant_data WHERE projectId = ? LIMIT 1`,
          [projectId]
        );
        if (plantRows.length > 0 && plantRows[0].commonName) {
          resolvedPlantName = plantRows[0].commonName;
          resolvedScientificName = plantRows[0].scientificName || resolvedScientificName;
        } else {
          const [projRows]: any = await pool.query(
            `SELECT p.commonName, p.scientificName, rp.plantCustomName
             FROM research_projects rp
             LEFT JOIN plants p ON rp.plantId = p.id
             WHERE rp.id = ? LIMIT 1`,
            [projectId]
          );
          if (projRows.length > 0) {
            resolvedPlantName = projRows[0].commonName || projRows[0].plantCustomName || resolvedPlantName;
            resolvedScientificName = projRows[0].scientificName || resolvedScientificName;
          }
        }
      } catch {}

      // Base template fallback
      const baseRationale = generateScientificRationale({
        plantName: resolvedPlantName,
        plantScientificName: resolvedScientificName,
        deliveryFormat,
        productType,
        targetIndications,
        intendedPopulation,
        packagingType,
        plantParts,
      });

      try {
        const systemPrompt = `You are a Senior Pharmaceutical Formulation Scientist and Pharmacognosist specializing in standardized botanical drug development.
Your role is to write a concise, evidence-grounded Delivery System Scientific Rationale for a research formulation.

CRITICAL INSTRUCTIONS:
1. Output ONLY the final rationale paragraph.
2. DO NOT include thoughts, reasoning notes, internal monologue, questions, or prefixes like "Need...", "Thought:", or "Here is...".
3. Content requirements:
   (a) Vehicle physicochemical properties and route suitability.
   (b) Phytochemical release, penetration, or dissolution characteristics.
   (c) Packaging barrier protection against photolytic or oxidative degradation.
   (d) Emphasize empirical quality control and stability testing benchmarks.
4. Keep the rationale concise (3 to 5 clear sentences, maximum 150 words). Format as a single coherent paragraph.`;

        const userPrompt = `Formulate a scientific rationale for the following research project:
- Plant Species: ${resolvedPlantName} (${resolvedScientificName || "Botanical Specimen"})
- Plant Parts Investigated: ${plantParts.join(", ") || "Leaves / Aerial parts"}
- Product Category: ${productType}
- Target Dosage Form: ${deliveryFormat}
- Hypothesized Research Indications: ${targetIndications}
- Target Population: ${intendedPopulation}
- Packaging & Storage: ${packagingType}
- Research Objective: ${researchObjective || "Formulation development and quality evaluation"}`;

        const aiResponse = await callTogetherChat(
          [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          { temperature: 0.2, maxTokens: 300 }
        );

        if (aiResponse.success && aiResponse.content) {
          const content = aiResponse.content.trim();
          const isThoughtMonologue =
            /^(need\s+|we need\s+|thought:\s*|thinking:\s*|hmm\b)/i.test(content) ||
            /(\bhmm\b|\bwait\b|\bmaybe\s+"[^"]+"\s+maybe\b)/i.test(content.slice(0, 80)) ||
            content.length < 50 ||
            content.endsWith("?");

          if (!isThoughtMonologue) {
            return NextResponse.json({
              success: true,
              rationale: content,
              isAiRefined: true,
            });
          }
        }
      } catch (aiErr) {
        console.warn("AI rationale generation fallback:", aiErr);
      }

      return NextResponse.json({
        success: true,
        rationale: baseRationale,
        isAiRefined: false,
      });
    }

    // REGULAR SAVE
    const {
      productType = "Herbal Formulation",
      deliveryFormat = "Topical Gel",
      targetIndications = "",
      intendedPopulation = "Adults",
      packagingType = "Amber glass jar",
      rationale = "",
    } = body;

    await pool.query(
      `
      INSERT INTO research_product_selections
        (projectId, productType, deliveryFormat, targetIndications, intendedPopulation, packagingType, rationale, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP(3))
      ON DUPLICATE KEY UPDATE
        productType = VALUES(productType),
        deliveryFormat = VALUES(deliveryFormat),
        targetIndications = VALUES(targetIndications),
        intendedPopulation = VALUES(intendedPopulation),
        packagingType = VALUES(packagingType),
        rationale = VALUES(rationale),
        updatedAt = CURRENT_TIMESTAMP(3)
      `,
      [projectId, productType, deliveryFormat, targetIndications, intendedPopulation, packagingType, rationale]
    );

    return NextResponse.json({ success: true, message: "Product selection saved successfully" });
  } catch (error: any) {
    console.error("Error saving product selection:", error);
    return NextResponse.json({ error: error.message || "Failed to save product selection" }, { status: 500 });
  }
}
