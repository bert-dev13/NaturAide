import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return NextResponse.json({
    success: true,
    message: "Laboratory Validation has been discontinued. The 6-stage workflow now proceeds directly from Stage 4 (Formulation & Safety) to Stage 5 (Research Integration).",
    redirectUrl: `/researcher/projects/${id}/completion-integration`,
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return NextResponse.json({
    success: true,
    message: "Laboratory Validation has been discontinued. The 6-stage workflow now proceeds directly from Stage 4 (Formulation & Safety) to Stage 5 (Research Integration).",
    redirectUrl: `/researcher/projects/${id}/completion-integration`,
  });
}
