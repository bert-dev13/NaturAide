import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getSection3CompiledContext } from "@/lib/manuscript-upload-service";

/**
 * GET /api/researcher/projects/[id]/compiled-overview
 * Fresh Section 1–2 dossier compilation for Section 3 Research Summary recompile.
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "RESEARCHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const projectId = parseInt(id, 10);
    if (Number.isNaN(projectId)) {
      return NextResponse.json({ error: "Invalid project ID" }, { status: 400 });
    }

    const [projRows]: any = await pool.query(
      "SELECT id FROM research_projects WHERE id = ? AND researcherId = ? LIMIT 1",
      [projectId, session.id]
    );
    if (!projRows.length) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const compiledOverview = await getSection3CompiledContext(projectId);
    return NextResponse.json({
      success: true,
      compiledOverview,
      compiledAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("compiled-overview GET error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to compile research overview" },
      { status: 500 }
    );
  }
}
