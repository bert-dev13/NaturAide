import { NextResponse } from "next/server";
import { getSession, createSessionToken, COOKIE_NAME } from "@/lib/auth";
import {
  evaluateHealthScreening,
  getLatestUserScreening,
  saveUserScreening,
  SCREENING_RULE_VERSION,
  ScreeningInput,
} from "@/lib/safety-server";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const latestScreening = await getLatestUserScreening(session.id);

    const response = NextResponse.json({
      success: true,
      ruleVersion: SCREENING_RULE_VERSION,
      screening: latestScreening,
    });

    if (latestScreening && latestScreening.evaluationResult) {
      response.cookies.set({
        name: "natureaide_screening",
        value: latestScreening.evaluationResult,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
      });
    } else {
      // Clear any stale screening cookie
      response.cookies.delete("natureaide_screening");
    }

    return response;
  } catch (error) {
    console.error("Screening GET error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to retrieve health screening status." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      ageGroup,
      age,
      healthConcern,
      currentMedications,
      medicationDetails,
      knownAllergies,
      allergyDetails,
      isPregnantOrLactating,
      hasSevereSymptoms,
      hasOrganFailure,
    } = body;

    if (!ageGroup || !healthConcern) {
      return NextResponse.json(
        { success: false, error: "Please complete all required screening questions." },
        { status: 400 }
      );
    }

    const screeningInput: ScreeningInput = {
      ageGroup,
      age: typeof age === "number" ? age : null,
      healthConcern: healthConcern.trim(),
      currentMedications: Array.isArray(currentMedications) ? currentMedications : [],
      medicationDetails: medicationDetails || "",
      knownAllergies: Array.isArray(knownAllergies) ? knownAllergies : [],
      allergyDetails: allergyDetails || "",
      isPregnantOrLactating: Boolean(isPregnantOrLactating),
      hasSevereSymptoms: Boolean(hasSevereSymptoms),
      hasOrganFailure: Boolean(hasOrganFailure),
    };

    // 1. Run deterministic safety evaluation
    const evaluation = evaluateHealthScreening(screeningInput);

    // 2. Persist to MySQL
    const savedRecord = await saveUserScreening(session.id, screeningInput, evaluation);

    // 3. Determine redirect URL based on outcome
    const redirectUrl =
      evaluation.result === "ELIGIBLE_TO_CONTINUE" ? "/community" : "/community/guidance";

    // 4. Return response and update HttpOnly cookies
    const response = NextResponse.json({
      success: true,
      screeningId: savedRecord.id,
      evaluationResult: evaluation.result,
      severity: evaluation.severity,
      ruleVersion: evaluation.ruleVersion,
      reasonSummary: evaluation.reasonSummary,
      redirectUrl,
    });

    const updatedToken = await createSessionToken({
      id: session.id,
      email: session.email,
      role: session.role,
      name: session.name,
      screeningResult: evaluation.result,
    });

    response.cookies.set({
      name: COOKIE_NAME,
      value: updatedToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    response.cookies.set({
      name: "natureaide_screening",
      value: evaluation.result,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return response;
  } catch (error) {
    console.error("Screening POST error:", error);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred while evaluating health screening." },
      { status: 500 }
    );
  }
}
