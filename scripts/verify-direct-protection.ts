async function testDirectUrls() {
  // 1. Login as fresh demo user (NO SCREENING)
  const loginRes = await fetch("http://localhost:3000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "community@natureaide.test", password: "NatureAide123!" }),
  });
  const cookie = loginRes.headers.get("set-cookie") || "";
  console.log("Login Cookie received:", Boolean(cookie));

  // 2. Direct request to /community with manual redirect
  const commRes = await fetch("http://localhost:3000/community", {
    headers: { Cookie: cookie },
    redirect: "manual",
  });
  console.log("Direct /community status:", commRes.status, "Location:", commRes.headers.get("location"));

  // 3. Direct request to /community/herbal-finder with manual redirect
  const finderRes = await fetch("http://localhost:3000/community/herbal-finder", {
    headers: { Cookie: cookie },
    redirect: "manual",
  });
  console.log("Direct /community/herbal-finder status:", finderRes.status, "Location:", finderRes.headers.get("location"));

  // 4. Direct request to /community/screening
  const screeningRes = await fetch("http://localhost:3000/community/screening", {
    headers: { Cookie: cookie },
    redirect: "manual",
  });
  console.log("Direct /community/screening status:", screeningRes.status);
}

testDirectUrls().catch(console.error);
