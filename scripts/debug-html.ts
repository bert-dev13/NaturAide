async function test() {
  const loginRes = await fetch("http://localhost:3000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "community@natureaide.test", password: "NatureAide123!" }),
  });
  const cookie = loginRes.headers.get("set-cookie") || "";
  console.log("cookie:", cookie);

  const res = await fetch("http://localhost:3000/community/plants/sambong", {
    headers: { Cookie: cookie.split(";")[0] },
  });
  console.log("status:", res.status);
  const text = await res.text();
  console.log("length:", text.length);
  console.log("text sample:\n", text.slice(0, 1000));
}
test();
