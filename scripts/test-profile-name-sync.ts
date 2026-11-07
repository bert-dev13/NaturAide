import pool from "../src/lib/db";
import { createSessionToken, verifySessionToken, COOKIE_NAME } from "../src/lib/auth";
import { PUT as researcherPut, GET as researcherGet } from "../src/app/api/researcher/profile/route";
import { PUT as reviewerPut, GET as reviewerGet } from "../src/app/api/reviewer/profile/route";

async function run() {
  console.log("=========================================================");
  console.log("TESTING PROFILE NAME SYNCHRONIZATION (RESEARCHER & REVIEWER)");
  console.log("=========================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, msg: string, extra?: any) {
    if (condition) {
      console.log(`  ✓ PASS: ${msg}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${msg}`);
      if (extra) console.error("    Details:", extra);
      failed++;
    }
  }

  try {
    // 1. Find Researcher
    const [researchers]: any = await pool.query(
      "SELECT id, name, email, role FROM users WHERE role = 'RESEARCHER' LIMIT 1"
    );
    assert(researchers.length > 0, "Researcher user exists in database");
    const researcher = researchers[0];
    const originalResearcherName = researcher.name;

    // Create session token for researcher
    const rToken = await createSessionToken({
      id: researcher.id,
      email: researcher.email,
      role: researcher.role,
      name: researcher.name,
    });

    // 2. Test Researcher Profile Update
    console.log("\n[1/2] Testing Researcher Profile Update...");
    const newResearcherFirst = "Dr. Aris";
    const newResearcherLast = "Dela Cruz";
    const expectedResearcherFullName = "Dr. Aris Dela Cruz";

    const rReq = new Request("http://localhost:3000/api/researcher/profile", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Cookie: `${COOKIE_NAME}=${rToken}`,
      },
      body: JSON.stringify({
        firstName: newResearcherFirst,
        lastName: newResearcherLast,
        institution: "National Institute of Health & Botanical Research",
        department: "Department of Pharmacognosy & Phytochemistry",
        researchField: "Natural Products Chemistry & Molecular Screening",
      }),
    });

    const rRes = await researcherPut(rReq);
    assert(rRes.status === 200, "Researcher profile PUT returns 200 OK");
    const rData = await rRes.json();
    assert(rData.name === expectedResearcherFullName, `Response contains updated name: "${rData.name}"`);

    // Check Set-Cookie
    const rSetCookie = rRes.headers.get("set-cookie");
    assert(!!rSetCookie && rSetCookie.includes(COOKIE_NAME), "Response issues updated session cookie");

    if (rSetCookie) {
      const match = rSetCookie.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
      if (match && match[1]) {
        const decoded = await verifySessionToken(match[1]);
        assert(decoded?.name === expectedResearcherFullName, `Session JWT payload has updated name: "${decoded?.name}"`);
      }
    }

    // Verify in database
    const [rDbUsers]: any = await pool.query("SELECT name FROM users WHERE id = ?", [researcher.id]);
    assert(rDbUsers[0]?.name === expectedResearcherFullName, `MySQL users table updated to "${rDbUsers[0]?.name}"`);

    const [rDbProfiles]: any = await pool.query(
      "SELECT firstName, lastName FROM user_profiles WHERE userId = ?",
      [researcher.id]
    );
    assert(
      rDbProfiles[0]?.firstName === newResearcherFirst && rDbProfiles[0]?.lastName === newResearcherLast,
      `MySQL user_profiles has firstName="${rDbProfiles[0]?.firstName}", lastName="${rDbProfiles[0]?.lastName}"`
    );

    // 3. Find Reviewer
    console.log("\n[2/2] Testing Reviewer Profile Update...");
    const [reviewers]: any = await pool.query(
      "SELECT id, name, email, role FROM users WHERE role = 'REVIEWER' LIMIT 1"
    );
    assert(reviewers.length > 0, "Reviewer user exists in database");
    const reviewer = reviewers[0];
    const originalReviewerName = reviewer.name;

    const revToken = await createSessionToken({
      id: reviewer.id,
      email: reviewer.email,
      role: reviewer.role,
      name: reviewer.name,
    });

    const newReviewerFullName = "Dr. Elena Rostova, RPh";

    const revReq = new Request("http://localhost:3000/api/reviewer/profile", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Cookie: `${COOKIE_NAME}=${revToken}`,
      },
      body: JSON.stringify({
        name: newReviewerFullName,
        professionalTitle: "Lead Pharmacognosy Evaluator & Clinical Reviewer",
        institution: "University of the Philippines Manila",
        licenseNumber: "PRC-PH-0082910",
      }),
    });

    const revRes = await reviewerPut(revReq);
    assert(revRes.status === 200, "Reviewer profile PUT returns 200 OK");
    const revData = await revRes.json();
    assert(revData.name === newReviewerFullName, `Reviewer response contains updated name: "${revData.name}"`);

    // Check Set-Cookie
    const revSetCookie = revRes.headers.get("set-cookie");
    assert(!!revSetCookie && revSetCookie.includes(COOKIE_NAME), "Reviewer response issues updated session cookie");

    if (revSetCookie) {
      const match = revSetCookie.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
      if (match && match[1]) {
        const decoded = await verifySessionToken(match[1]);
        assert(decoded?.name === newReviewerFullName, `Reviewer session JWT payload has updated name: "${decoded?.name}"`);
      }
    }

    // Verify in database
    const [revDbUsers]: any = await pool.query("SELECT name FROM users WHERE id = ?", [reviewer.id]);
    assert(revDbUsers[0]?.name === newReviewerFullName, `MySQL users table updated to "${revDbUsers[0]?.name}"`);

    console.log("\n=========================================================");
    console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log("=========================================================");
  } catch (err) {
    console.error("Test error:", err);
  } finally {
    process.exit(0);
  }
}

run();

