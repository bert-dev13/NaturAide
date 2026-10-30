import pool from "../src/lib/db";

async function verifyBothPaths() {
  const [users]: any = await pool.query(
    "SELECT id, email, role FROM users WHERE email = 'community@natureaide.test'"
  );
  const userId = users[0].id;

  // ----------------------------------------------------
  // PATH 1: Eligible User
  // ----------------------------------------------------
  console.log("=== VERIFYING PATH 1: ELIGIBLE USER ===");
  await pool.query("DELETE FROM community_health_screenings WHERE userId = ?", [userId]);

  // Login
  const login1 = await fetch("http://localhost:3000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "community@natureaide.test", password: "NatureAide123!" }),
  });
  const cookie1 = login1.headers.get("set-cookie") || "";
  const login1Data = await login1.json();
  console.log("1a. Fresh Login redirect:", login1Data.redirectUrl);
  if (login1Data.redirectUrl !== "/community/screening") throw new Error("Expected /community/screening");

  // Submit Eligible Screening
  const submit1 = await fetch("http://localhost:3000/api/community/screening", {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie1 },
    body: JSON.stringify({
      ageGroup: "18-64",
      healthConcern: "Everyday Wellness & Energy",
      currentMedications: ["none"],
      knownAllergies: ["none"],
      isPregnantOrLactating: false,
      hasSevereSymptoms: false,
      hasOrganFailure: false,
    }),
  });
  const submit1Data = await submit1.json();
  console.log("1b. Eligible Evaluation:", submit1Data.evaluationResult, "Redirect:", submit1Data.redirectUrl);
  if (submit1Data.evaluationResult !== "ELIGIBLE_TO_CONTINUE" || submit1Data.redirectUrl !== "/community") {
    throw new Error("Expected ELIGIBLE_TO_CONTINUE and /community");
  }

  // Re-login: should persist and go to /community
  const relogin1 = await fetch("http://localhost:3000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "community@natureaide.test", password: "NatureAide123!" }),
  });
  const relogin1Data = await relogin1.json();
  console.log("1c. Re-login after eligible screening redirect:", relogin1Data.redirectUrl);
  if (relogin1Data.redirectUrl !== "/community") throw new Error("Expected /community on re-login");

  // ----------------------------------------------------
  // PATH 2: Guidance-Required User (Configured Rule Triggered)
  // ----------------------------------------------------
  console.log("\n=== VERIFYING PATH 2: PROFESSIONAL GUIDANCE REQUIRED ===");
  await pool.query("DELETE FROM community_health_screenings WHERE userId = ?", [userId]);

  // Login again after reset
  const login2 = await fetch("http://localhost:3000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "community@natureaide.test", password: "NatureAide123!" }),
  });
  const cookie2 = login2.headers.get("set-cookie") || "";
  const login2Data = await login2.json();
  console.log("2a. Fresh Login redirect after reset:", login2Data.redirectUrl);
  if (login2Data.redirectUrl !== "/community/screening") throw new Error("Expected /community/screening");

  // Submit Guidance-Required Screening: Severe symptoms + Warfarin
  const submit2 = await fetch("http://localhost:3000/api/community/screening", {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie2 },
    body: JSON.stringify({
      ageGroup: "18-64",
      healthConcern: "Severe chest pain & shortness of breath",
      currentMedications: ["blood-thinners"],
      medicationDetails: "Warfarin",
      knownAllergies: ["none"],
      isPregnantOrLactating: false,
      hasSevereSymptoms: true,
      hasOrganFailure: false,
    }),
  });
  const submit2Data = await submit2.json();
  console.log("2b. Restricted Evaluation:", submit2Data.evaluationResult, "Redirect:", submit2Data.redirectUrl);
  console.log("2c. Stored Rationale Summary:", submit2Data.reasonSummary);

  if (submit2Data.evaluationResult !== "PROFESSIONAL_GUIDANCE_REQUIRED" || submit2Data.redirectUrl !== "/community/guidance") {
    throw new Error("Expected PROFESSIONAL_GUIDANCE_REQUIRED and /community/guidance");
  }

  // Check that reasonSummary explicitly mentions the triggered rules
  const hasAcuteRule = submit2Data.reasonSummary.includes("acute or severe symptoms");
  const hasAnticoagulantRule = submit2Data.reasonSummary.includes("blood thinners or anticoagulants");
  console.log("2d. Matches Rule 1 (Acute Red Flags):", hasAcuteRule);
  console.log("2e. Matches Rule 5A (Anticoagulant Interaction):", hasAnticoagulantRule);
  if (!hasAcuteRule || !hasAnticoagulantRule) throw new Error("Rationale did not match actual triggered rules");

  // Clean reset demo account so it is always fresh for the user
  await pool.query("DELETE FROM community_health_screenings WHERE userId = ?", [userId]);
  console.log("\n=== FINAL CLEANUP: Demo account screening reset to 0 records. ===");
}

verifyBothPaths()
  .then(() => pool.end())
  .catch((err) => {
    console.error("Verification failed:", err);
    pool.end().finally(() => process.exit(1));
  });
