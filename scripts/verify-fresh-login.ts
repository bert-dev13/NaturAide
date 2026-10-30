async function verifyFreshLogin() {
  const res = await fetch("http://localhost:3000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "community@natureaide.test", password: "NatureAide123!" }),
  });

  const data = await res.json();
  console.log("Status:", res.status);
  console.log("Response Body:", data);
  console.log("Redirect URL:", data.redirectUrl);
  console.log("Screening Status:", data.user?.screeningStatus);
}

verifyFreshLogin().catch(console.error);
