import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { calculateV2ProjectProgress } from "@/lib/v2-progress-service";
import pool from "@/lib/db";

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

    const progress = await calculateV2ProjectProgress(projectId);

    // Also update project.progressPercent in DB if it changed
    await pool.query(
      "UPDATE research_projects SET progressPercent = ? WHERE id = ?",
      [progress.overallProgressPercent, projectId]
    );

    return NextResponse.json({ success: true, progress });
  } catch (error: any) {
    console.error("Error in v2 progress route:", error);
    return NextResponse.json({ error: error.message || "Failed to calculate progress" }, { status: 500 });
  }
}
