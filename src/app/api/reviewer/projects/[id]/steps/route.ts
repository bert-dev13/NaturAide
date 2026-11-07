import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  ensureReviewTables,
  getProjectApprovedSteps,
  toggleStepApproval,
} from "@/lib/expert-review-assignment";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "REVIEWER" && session.role !== "RESEARCHER")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const projectId = parseInt(id, 10);
    if (isNaN(projectId)) {
      return NextResponse.json({ error: "Invalid project ID" }, { status: 400 });
    }

    await ensureReviewTables();
    const approvedSteps = await getProjectApprovedSteps(projectId);

    return NextResponse.json({
      success: true,
      projectId,
      approvedSteps,
    });
  } catch (error: any) {
    console.error("GET /api/reviewer/projects/[id]/steps error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to load approved steps" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "REVIEWER") {
      return NextResponse.json({ error: "Unauthorized: Reviewer access required." }, { status: 401 });
    }

    const { id } = await params;
    const projectId = parseInt(id, 10);
    if (isNaN(projectId)) {
      return NextResponse.json({ error: "Invalid project ID" }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const { sectionKey, stepNumber, isApproved, submissionId } = body;

    if (!sectionKey || !stepNumber || !["section1", "section2", "section3"].includes(sectionKey)) {
      return NextResponse.json(
        { error: "Invalid sectionKey or stepNumber." },
        { status: 400 }
      );
    }

    const parsedStep = parseInt(stepNumber, 10);
    if (isNaN(parsedStep) || parsedStep < 1) {
      return NextResponse.json({ error: "Invalid stepNumber." }, { status: 400 });
    }

    const result = await toggleStepApproval(
      projectId,
      sectionKey as "section1" | "section2" | "section3",
      parsedStep,
      session.id,
      typeof isApproved === "boolean" ? isApproved : true,
      submissionId ? parseInt(submissionId, 10) : null
    );

    return NextResponse.json({
      success: true,
      projectId,
      ...result,
    });
  } catch (error: any) {
    console.error("POST /api/reviewer/projects/[id]/steps error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to toggle step approval" },
      { status: 500 }
    );
  }
}

