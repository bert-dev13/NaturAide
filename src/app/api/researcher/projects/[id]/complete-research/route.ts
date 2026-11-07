import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { completeApprovedResearchProject } from "@/lib/research-approval-completion-service";

export async function POST(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "RESEARCHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const projectId = parseInt(id, 10);
    if (isNaN(projectId)) {
      return NextResponse.json({ error: "Invalid project ID" }, { status: 400 });
    }

    const completedState = await completeApprovedResearchProject({
      projectId,
      researcherId: Number(session.id),
    });

    return NextResponse.json({
      success: true,
      message: "Research project officially marked as Completed.",
      approvalState: completedState,
      redirectUrl: `/researcher/completed/${projectId}`,
    });
  } catch (error: unknown) {
    const errObj = error as { statusCode?: number; message?: string };
    const statusCode =
      typeof errObj?.statusCode === "number" ? errObj.statusCode : 500;
    return NextResponse.json(
      { error: errObj?.message || "Failed to complete research project" },
      { status: statusCode }
    );
  }
}
