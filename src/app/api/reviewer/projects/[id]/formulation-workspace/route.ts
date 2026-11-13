import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { loadFormulationRdWorkspaceData } from "@/lib/formulation-rd-workspace-data";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "REVIEWER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const projectId = parseInt(id, 10);
    if (isNaN(projectId)) {
      return NextResponse.json({ error: "Invalid project ID" }, { status: 400 });
    }

    const data = await loadFormulationRdWorkspaceData(projectId);
    if (!data) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    console.error("formulation-workspace GET error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to load formulation workspace" },
      { status: 500 }
    );
  }
}
