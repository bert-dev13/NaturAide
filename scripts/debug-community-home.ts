import pool from "../src/lib/db";

const BASE_URL = "http://localhost:3000";

async function debugHome() {
  console.log("Debugging /community render for eligible user...");

  // 1. Get demo user
  const [users]: any = await pool.query(
    "SELECT id, email FROM users WHERE email = 'community@natureaide.test'"
  );
  const user = users[0];

  // 2. Set screening to ELIGIBLE_TO_CONTINUE
  await pool.query("DELETE FROM community_health_screenings WHERE userId = ? OR user_id = ?", [user.id, user.id]);
  await pool.query(
    `INSERT INTO community_health_screenings 
     (userId, user_id, status, completed_at, completedAt, ageGroup, healthConcern, currentMedications, knownAllergies, isPregnantOrLactating, hasSevereSymptoms, hasOrganFailure, evaluationResult, result, ruleVersion, reasonSummary)
     VALUES (?, ?, 'COMPLETED', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3), '18-64', 'Wellness', '[]', '[]', 0, 0, 0, 'ELIGIBLE_TO_CONTINUE', 'ELIGIBLE_TO_CONTINUE', 'v1.0-community-safety', 'Eligible')`,
    [user.id, user.id]
  );

  // 3. Login
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "community@natureaide.test", password: "NatureAide123!" }),
  });
  console.log("Login status:", loginRes.status);
  const loginData = await loginRes.json();
  console.log("Login redirectUrl:", loginData.redirectUrl);

  const cookieHeader = loginRes.headers.get("set-cookie") || "";
  const sessionMatch = cookieHeader.match(/natureaide_session=([^;]+)/);
  const sessionCookie = sessionMatch ? `natureaide_session=${sessionMatch[1]}` : "";
  const fullCookie = `${sessionCookie}; natureaide_screening=ELIGIBLE_TO_CONTINUE`;

  // 4. Fetch /community
  console.log("\nFetching /community...");
  const homeRes = await fetch(`${BASE_URL}/community`, {
    headers: { Cookie: fullCookie },
    redirect: "manual",
  });
  console.log("Home status:", homeRes.status);
  console.log("Home headers:", Object.fromEntries(homeRes.headers.entries()));
  const html = await homeRes.text();
  console.log("HTML length:", html.length);
  const mainMatch = html.match(/<main[\s\S]*?<\/main>/);
  if (mainMatch) {
    console.log("Found <main> length:", mainMatch[0].length);
  } else {
    console.log("NO <main> FOUND! HTML sample:\n", html.slice(0, 1500));
  }

  // Reset demo user
  await pool.query("DELETE FROM community_health_screenings WHERE userId = ? OR user_id = ?", [user.id, user.id]);
  await pool.end();
}

debugHome().catch(console.error);
