import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import pool from "@/lib/db";
import { assessSafetyArea, synthesizeSafety, type SafetyAiContext } from "@/lib/formulation-safety-ai";
import type { SafetyAreaKey } from "@/lib/formulation-safety-draft";

const AREAS = new Set<SafetyAreaKey>(["toxicity", "contraindications", "interactions", "dose", "formulation"]);

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
    if (Number.isNaN(projectId)) {
      return NextResponse.json({ error: "Invalid project ID" }, { status: 400 });
    }

    const [projectRows]: any = await pool.query(
      "SELECT id FROM research_projects WHERE id = ? AND researcherId = ? LIMIT 1",
      [projectId, session.id]
    );
    if (projectRows.length === 0) {
      return NextResponse.json({ error: "Project not found or unauthorized" }, { status: 404 });
    }

    const body = await request.json();
    if (body.action === "assess") {
      const context = body.context as SafetyAiContext;
      if (!context || !AREAS.has(context.area)) {
        return NextResponse.json({ error: "A safety category is required." }, { status: 400 });
      }
      const assessment = await assessSafetyArea({
        ...context,
        papers: Array.isArray(context.papers) ? context.papers : [],
        compounds: Array.isArray(context.compounds) ? context.compounds : [],
      });
      return NextResponse.json({ assessment });
    }

    if (body.action === "synthesize") {
      const areas = Array.isArray(body.areas) ? body.areas : [];
      if (areas.length !== 5) {
        return NextResponse.json({ error: "All five assessments are required before synthesis." }, { status: 400 });
      }
      const synthesis = await synthesizeSafety({
        plant: String(body.plant || ""),
        formulationName: String(body.formulationName || ""),
        referenceCount: Number(body.referenceCount) || 0,
        areas,
      });
      return NextResponse.json({ synthesis });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("Formulation safety AI error:", error instanceof Error ? error.message : "request failed");
    const message = error instanceof Error ? error.message : "The assessment could not be generated.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
