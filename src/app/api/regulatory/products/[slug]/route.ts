import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { parseVerificationSubmission, recordRegulatoryVerification } from "@/lib/regulatory-verification-service";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "REVIEWER")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug } = await params;
    const parsed = parseVerificationSubmission(await request.json());
    if ("error" in parsed) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const result = await recordRegulatoryVerification(slug, session.id, parsed.submission);
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Regulatory verification request failed:", error);
    return NextResponse.json({ error: "The verification could not be saved." }, { status: 500 });
  }
}
