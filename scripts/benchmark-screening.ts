import pool from "../src/lib/db";

async function benchmark() {
  const loginRes = await fetch("http://localhost:3000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "community@natureaide.test", password: "NatureAide123!" }),
  });
  const cookie = loginRes.headers.get("set-cookie") || "";

  const t0 = performance.now();
  const screenRes = await fetch("http://localhost:3000/api/community/screening", {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
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
  const t1 = performance.now();
  console.log("Screening POST time:", (t1 - t0).toFixed(2), "ms", "Status:", screenRes.status);
  const data = await screenRes.json();
  console.log("Data:", data);

  const t2 = performance.now();
  const commRes = await fetch("http://localhost:3000/community", {
    headers: { Cookie: cookie },
  });
  const t3 = performance.now();
  console.log("/community GET time:", (t3 - t2).toFixed(2), "ms", "Status:", commRes.status);

  // Clean up
  await pool.query(
    "DELETE FROM community_health_screenings WHERE userId = (SELECT id FROM users WHERE email = 'community@natureaide.test')"
  );
  await pool.end();
}

benchmark().catch(console.error);
