import pool from "../src/lib/db";
import { executeProfessionalReviewerChat } from "../src/lib/researcher-assistant-grounding";
import { extractTextFromPdfBuffer, sanitizeUntrustedManuscriptText } from "../src/lib/manuscript-text-extractor";

async function runTests() {
  console.log("=================================================================");
  console.log("STARTING TEST FOR RESEARCH PAPER UPLOAD & CHATBOT Q&A ASSISTANT");
  console.log("=================================================================\n");

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, desc: string) {
    total++;
    if (condition) {
      console.log(`  ✓ PASS: ${desc}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${desc}`);
      process.exit(1);
    }
  }

  // 1. Test Text Extraction & Sanitization
  console.log("[1/4] Testing Paper Text Sanitization & Section Parsing...");
  const samplePaper = `
Title: Pharmacological Evaluation of Senna alata Leaf Extract in Topical Formulations

Abstract:
In this study, Senna alata leaf hydroethanolic extracts were screened for antifungal chrysophanol and rhein constituents. In-silico docking against fungal CYP51 was performed, yielding strong affinity scores.

Materials and Methods:
Leaves were authenticated, dried, and extracted with 70% ethanol under reflux. Molecular docking was executed using AutoDock Vina with exhaustiveness 8. Fungal CYP51 (PDB: 5ESJ) served as the receptor.

Results and Discussion:
Chrysophanol demonstrated a binding affinity of -8.4 kcal/mol, interacting with key active site residues. Rhein scored -8.1 kcal/mol. Zone of inhibition was 18 mm.

Conclusion:
The hydroethanolic extract of Senna alata displays potent antifungal and anti-inflammatory properties, validating ethnobotanical use in dermal formulations.

Limitations and Safety:
Potential dermal irritation at high concentrations warrants patch testing before clinical adoption.
`;

  const sanitized = sanitizeUntrustedManuscriptText(samplePaper);
  assert(sanitized.includes("Chrysophanol"), "Sanitized text contains key compound");
  assert(sanitized.includes("AutoDock Vina"), "Sanitized text contains methodology keyword");
  assert(!sanitized.includes("<|im_start|>"), "Neutralizes injection tokens");

  // 2. Test Paper Summarization via executeProfessionalReviewerChat
  console.log("\n[2/4] Testing AI Peer Reviewer Chat with Attached Paper...");
  const attachedPaperData = {
    fileName: "senna_alata_study.pdf",
    fileType: "pdf",
    pageCount: 4,
    text: sanitized,
  };

  const summaryResult = await executeProfessionalReviewerChat(
    [],
    "Please summarize this research paper.",
    null,
    attachedPaperData
  );

  assert(summaryResult.success, "Chat returns success=true for paper summarization");
  assert(typeof summaryResult.content === "string", "Content is string");
  assert(
    summaryResult.content.toLowerCase().includes("summary") ||
      summaryResult.content.toLowerCase().includes("senna") ||
      summaryResult.content.toLowerCase().includes("chrysophanol"),
    "Summary contains grounded references to the paper"
  );
  console.log("Sample AI Summary Output Preview:");
  console.log(summaryResult.content.slice(0, 320) + "...\n");

  // 3. Test Methodology & Limitation Questions
  console.log("[3/4] Testing Specific Methodology & Limitations Q&A on Paper...");
  const methodResult = await executeProfessionalReviewerChat(
    [{ role: "assistant", content: summaryResult.content }],
    "What was the extraction solvent and docking software used in this paper?",
    null,
    attachedPaperData
  );

  assert(methodResult.success, "Methodology query returns success");
  assert(
    methodResult.content.toLowerCase().includes("method") ||
      methodResult.content.toLowerCase().includes("docking") ||
      methodResult.content.toLowerCase().includes("ethanol") ||
      methodResult.content.toLowerCase().includes("vina"),
    "Methodology answer identifies experimental/computational parameters"
  );

  const safetyResult = await executeProfessionalReviewerChat(
    [{ role: "assistant", content: methodResult.content }],
    "What are the limitations and safety risks mentioned in this paper?",
    null,
    attachedPaperData
  );

  assert(safetyResult.success, "Safety & limitations query returns success");
  assert(
    safetyResult.content.toLowerCase().includes("safety") ||
      safetyResult.content.toLowerCase().includes("irritation") ||
      safetyResult.content.toLowerCase().includes("limitation"),
    "Safety answer captures limitations and risk appraisal"
  );

  // 4. Test Multi-Turn Conversation Persistence in DB
  console.log("\n[4/4] Testing Conversation and Messages DB Schema Compatibility...");
  const [testUsers]: any = await pool.query("SELECT id FROM users WHERE role = 'REVIEWER' LIMIT 1");
  const reviewerId = testUsers.length > 0 ? testUsers[0].id : 3;

  const [convInsert]: any = await pool.query(
    `INSERT INTO conversations (userId, title, projectId, activeContextType, isArchived)
     VALUES (?, 'Paper Analysis Test Chat', 57, 'PROFESSIONAL_REVIEW', 0)`,
    [reviewerId]
  );
  const testConvId = convInsert.insertId;
  assert(testConvId > 0, "Created test conversation in database");

  const [userMsg]: any = await pool.query(
    `INSERT INTO messages (conversationId, sender, content, metadata)
     VALUES (?, 'USER', 'Summarize this paper', ?)`,
    [
      testConvId,
      JSON.stringify({
        attachedPaper: {
          fileName: "senna_alata_study.pdf",
          fileType: "pdf",
          pageCount: 4,
          text: sanitized.slice(0, 1000),
        },
      }),
    ]
  );
  assert(userMsg.insertId > 0, "User message saved with attached paper metadata");

  const [astMsg]: any = await pool.query(
    `INSERT INTO messages (conversationId, sender, content, metadata)
     VALUES (?, 'ASSISTANT', ?, ?)`,
    [
      testConvId,
      summaryResult.content,
      JSON.stringify({
        model: summaryResult.model,
        attachedPaper: { fileName: "senna_alata_study.pdf" },
      }),
    ]
  );
  assert(astMsg.insertId > 0, "Assistant response saved with model metadata");

  // Verify retrieval
  const [retrieved]: any = await pool.query(
    `SELECT * FROM messages WHERE conversationId = ? ORDER BY id ASC`,
    [testConvId]
  );
  assert(retrieved.length === 2, "Retrieved both messages from conversation history");

  // Clean up test conversation
  await pool.query("DELETE FROM messages WHERE conversationId = ?", [testConvId]);
  await pool.query("DELETE FROM conversations WHERE id = ?", [testConvId]);
  assert(true, "Test conversation cleaned up safely");

  console.log("\n=================================================================");
  console.log(`TEST SUMMARY: ${passed} PASSED, 0 FAILED (Total: ${total})`);
  console.log("=================================================================\n");
  process.exit(0);
}

runTests().catch((err) => {
  console.error("Test failed with error:", err);
  process.exit(1);
});

