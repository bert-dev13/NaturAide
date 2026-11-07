import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getProjectProfessionalApprovalState } from "@/lib/research-approval-completion-service";

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "RESEARCHER" && session.role !== "REVIEWER")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const projectId = parseInt(id, 10);
    if (isNaN(projectId)) {
      return NextResponse.json({ error: "Invalid project ID" }, { status: 400 });
    }

    const approvalState = await getProjectProfessionalApprovalState(projectId);
    if (!approvalState) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (
      session.role === "RESEARCHER" &&
      approvalState.researcherId !== Number(session.id)
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      approvalState,
    });
  } catch (error: unknown) {
    console.error("Error fetching professional approval status:", error);
    const msg =
      error instanceof Error
        ? error.message
        : "Failed to fetch professional approval status";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
