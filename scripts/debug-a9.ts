import pool from "../src/lib/db";

async function test() {
  const [commUsers]: any = await pool.query(
    "SELECT id FROM users WHERE email = 'community@natureaide.test'"
  );
  const userId = commUsers[0].id;

  // Set eligible screening
  await pool.query("DELETE FROM community_health_screenings WHERE userId = ?", [userId]);
  await pool.query(
    `INSERT INTO community_health_screenings (
      userId, ruleVersion, ageGroup, healthConcern, responsesJson, evaluationResult
    ) VALUES (?, 'v1.0-community-safety', '18-64', 'Cough', '{}', 'ELIGIBLE_TO_CONTINUE')`,
    [userId]
  );

  const loginRes = await fetch("http://localhost:3000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "community@natureaide.test", password: "NatureAide123!" }),
  });
  const cookieHeader = loginRes.headers.get("set-cookie") || "";
  const cookies = cookieHeader
    .split(",")
    .map((c) => c.split(";")[0].trim())
    .join("; ");
  console.log("cookies:", cookies);

  const res = await fetch("http://localhost:3000/community/plants/sambong", {
    headers: { Cookie: cookies },
  });
  console.log("status:", res.status);
  const text = await res.text();
  console.log("Includes Sambong?", text.includes("Sambong"));
  console.log("Includes Blumea balsamifera?", text.includes("Blumea balsamifera"));
  console.log("Includes Scientific References?", text.includes("Scientific References"));
  console.log("Sample of text (first 3000 chars):", text.slice(0, 3000));
  await pool.end();
}

test();
