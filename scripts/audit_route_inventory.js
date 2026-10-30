// Static inventory of every API route: methods, auth mechanism, role gates, ownership hints.
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..", "src", "app", "api");
function walk(d, out = []) {
  for (const f of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, f.name);
    if (f.isDirectory()) walk(p, out);
    else if (f.name === "route.ts") out.push(p);
  }
  return out;
}

const rows = walk(ROOT).map((file) => {
  const src = fs.readFileSync(file, "utf8");
  const rel = path.relative(ROOT, path.dirname(file)).replace(/\\/g, "/");
  const methods = [...src.matchAll(/export async function (GET|POST|PUT|PATCH|DELETE)/g)].map((m) => m[1]);
  const usesSession = /getSession\(|requireRole|requireAdmin|requireResearcher|requireReviewer/.test(src);
  const roles = [...new Set([...src.matchAll(/role\s*(?:!==|===|!=|==)\s*["'](\w+)["']/g)].map((m) => m[1]))];
  const ownership = /researcherId\s*=\s*\?|rp\.researcherId|reviewerId\s*=\s*\?|userId\s*=\s*\?/.test(src);
  const concat = /query\(\s*`[^`]*\$\{(?!placeholders|where|order|conditions|setClause)[^}]*\}[^`]*`/.test(src);
  let cls = rel.startsWith("admin") ? "ADMIN" : rel.startsWith("researcher") ? "RESEARCHER" : rel.startsWith("reviewer") ? "REVIEWER" : rel.startsWith("community") ? "COMMUNITY" : rel.startsWith("auth") ? "AUTH" : "OTHER";
  return { route: "/api/" + rel, cls, methods: methods.join(","), session: usesSession, roles: roles.join("/"), ownership, interpolatedSql: concat };
});

console.table(rows);
const noSession = rows.filter((r) => !r.session);
console.log("\nRoutes WITHOUT any session check:", noSession.map((r) => `${r.route} [${r.methods}]`));
const noRole = rows.filter((r) => r.session && !r.roles && r.cls !== "AUTH");
console.log("\nRoutes with session but NO explicit role gate:", noRole.map((r) => `${r.route} [${r.methods}]`));
const sqli = rows.filter((r) => r.interpolatedSql);
console.log("\nRoutes with ${} interpolation inside SQL template (manual review):", sqli.map((r) => r.route));
module.exports = rows;
