import pool from "../src/lib/db";
import { performance } from "perf_hooks";

const BASE_URL = "http://localhost:3000";

async function benchmark() {
  console.log("=================================================");
  console.log("BENCHMARKING HEALTH SAFETY SCREENING SUBMISSION");
  console.log("=================================================");

  // 1. Get user
  const [users]: any = await pool.query(
    "SELECT id, email FROM users WHERE email = 'community@natureaide.test'"
  );
  if (!users || users.length === 0) {
    throw new Error("Demo user not found");
  }
  const user = users[0];

  // 2. Clear any screenings
  await pool.query("DELETE FROM community_health_screenings WHERE userId = ?", [user.id]);
  console.log("[Setup] Cleared demo user screenings in MySQL");

  // 3. Login to get session
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "community@natureaide.test", password: "NatureAide123!" }),
  });
  const cookieHeader = loginRes.headers.get("set-cookie") || "";
  const matchSession = cookieHeader.match(/natureaide_session=([^;]+)/);
  const sessionCookie = matchSession ? `natureaide_session=${matchSession[1]}` : "";

  // 4. Test deterministic rule evaluation payload:
  // Adult (18–64)
  // Medications: None
  // Pregnant/Nursing: No
  // Severe Symptoms: None
  // Severe Organ Impairment: No
  const screeningPayload = {
    ageGroup: "18-64",
    healthConcern: "General wellness and immune support",
    currentMedications: ["none"],
    knownAllergies: ["none"],
    isPregnantOrLactating: false,
    hasSevereSymptoms: false,
    hasOrganFailure: false,
  };

  console.log("\n[Test] Submitting Screening Payload:");
  console.log(JSON.stringify(screeningPayload, null, 2));

  const t0 = performance.now();
  const submitRes = await fetch(`${BASE_URL}/api/community/screening`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: sessionCookie,
    },
    body: JSON.stringify(screeningPayload),
  });
  const t1 = performance.now();
  const processingTimeMs = (t1 - t0).toFixed(2);

  const data = await submitRes.json();
  console.log(`\n[Performance] HTTP status: ${submitRes.status}`);
  console.log(`[Performance] Roundtrip processing time: ${processingTimeMs} ms`);
  console.log("[Response] Payload:", data);

  // Check result
  const resultReturned = data.evaluationResult;
  console.log(`[Result] evaluationResult: ${resultReturned}`);
  console.log(`[Result] redirectUrl: ${data.redirectUrl}`);

  // Check MySQL persistence
  const [screenings]: any = await pool.query(
    "SELECT id, evaluationResult, ruleVersion, responsesJson, createdAt FROM community_health_screenings WHERE userId = ? ORDER BY createdAt DESC LIMIT 1",
    [user.id]
  );

  const persisted = screenings.length === 1 && screenings[0].evaluationResult === "ELIGIBLE_TO_CONTINUE";
  console.log(`[Persistence] MySQL Record found: ${screenings.length === 1 ? "YES" : "NO"}`);
  if (screenings.length === 1) {
    console.log(`[Persistence] Stored Result: ${screenings[0].evaluationResult}`);
    console.log(`[Persistence] Created At: ${screenings[0].createdAt}`);
  }

  const redirectPass = data.redirectUrl === "/community";
  const resultPass = resultReturned === "ELIGIBLE_TO_CONTINUE";
  const persistencePass = persisted;

  console.log("\n=================================================");
  console.log("FINAL TEST SUMMARY");
  console.log("=================================================");
  console.log(`- Screening processing time: ${processingTimeMs} ms`);
  console.log(`- Result returned: ${resultReturned}`);
  console.log(`- MySQL persistence: ${persistencePass ? "PASS" : "FAIL"}`);
  console.log(`- Redirect: ${redirectPass ? "PASS" : "FAIL"}`);
  console.log("=================================================\n");

  // Clean reset demo account so it remains in NO_SCREENING state
  await pool.query("DELETE FROM community_health_screenings WHERE userId = ?", [user.id]);
  console.log("[Teardown] Reset demo user screenings in MySQL back to clean 0");

  await pool.end();

  if (!resultPass || !persistencePass || !redirectPass) {
    process.exit(1);
  }
}

benchmark().catch((err) => {
  console.error(err);
  process.exit(1);
});
