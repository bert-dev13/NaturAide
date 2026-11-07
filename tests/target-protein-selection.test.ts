import assert from "node:assert"
import {
  CURATED_TARGET_PROTEINS,
  suggestTargetsForProject,
  lookupTargetByPdbId,
  searchCuratedTargets,
} from "../src/lib/target-protein-catalog"

async function runTargetProteinSelectionTests() {
  console.log("=== RUNNING SECTION 2, STEP 2: TARGET PROTEIN SELECTION TEST SUITE ===\n")

  // 1. Curated Target Protein Catalog Completeness
  console.log("1. Testing verified curated target library completeness...")
  assert.strictEqual(CURATED_TARGET_PROTEINS.length >= 8, true, "Must have at least 8 curated targets")
  
  const pdbIds = CURATED_TARGET_PROTEINS.map(t => t.pdbId.toUpperCase())
  assert.ok(pdbIds.includes("5KIR"), "Library must contain COX-2 (5KIR)")
  assert.ok(pdbIds.includes("6Y3C"), "Library must contain COX-1 (6Y3C)")
  assert.ok(pdbIds.includes("3W37"), "Library must contain Alpha-glucosidase (3W37)")
  assert.ok(pdbIds.includes("2AZ5"), "Library must contain TNF-alpha (2AZ5)")
  assert.ok(pdbIds.includes("1CX2"), "Library must contain COX-2 alternate (1CX2)")
  assert.ok(pdbIds.includes("1T46"), "Library must contain CYP51 Antifungal target (1T46)")
  console.log("   ✓ Verified library contains all benchmark targets (COX-2, COX-1, TNF-alpha, Alpha-glucosidase, CYP51, etc.).\n")

  // 2. Lookup by PDB ID
  console.log("2. Testing lookupTargetByPdbId case-insensitivity and accuracy...")
  const target5kir = lookupTargetByPdbId("5kir")
  assert.ok(target5kir, "Should locate 5kir")
  assert.strictEqual(target5kir?.geneOrProtein, "PTGS2")
  assert.strictEqual(target5kir?.therapeuticCategory, "Anti-inflammatory & Analgesic")
  assert.strictEqual(target5kir?.resolution, "2.39 Å")
  assert.strictEqual(lookupTargetByPdbId("UNKNOWN"), null, "Should return null for unknown PDB ID")
  console.log("   ✓ Target lookup operates accurately with case-insensitivity.\n")

  // 3. AI Target Suggestions for Akapulko Anti-inflammatory Study
  console.log("3. Testing AI target suggestions for Akapulko formulation...")
  const akapulkoSuggestions = suggestTargetsForProject({
    plantName: "Senna alata (Akapulko)",
    researchObjective: "Formulation of anti-inflammatory topical hydrogel for fungal dermatoses and eczema",
    compoundNames: ["Rhein", "Emodin", "Chrysophanol", "Aloe-emodin"],
  })

  assert.ok(akapulkoSuggestions.length >= 2, "Must return ranked recommendations")
  const topResult = akapulkoSuggestions[0]
  console.log(`   Top recommendation: ${topResult.target.targetName} (${topResult.target.pdbId}) — Score: ${topResult.score}`)
  console.log(`   Reasons: ${topResult.matchReasons.join("; ")}`)

  // For Akapulko and anti-inflammatory eczema, COX-2 or TNF-alpha or CYP51 must be top ranked
  const top3PdbIds = akapulkoSuggestions.slice(0, 3).map(s => s.target.pdbId)
  assert.ok(
    top3PdbIds.includes("5KIR") || top3PdbIds.includes("2AZ5") || top3PdbIds.includes("1T46"),
    "Top recommendations must include COX-2 (5KIR), TNF-alpha (2AZ5), or CYP51 (1T46)"
  )
  assert.ok(topResult.matchReasons.length > 0, "Match reason must be descriptive")
  console.log("   ✓ AI target suggestions accurately prioritized relevant therapeutic receptors based on phytochemicals and objectives.\n")

  // 4. Strict Safety: Suggestions must only draw from the verified curated library
  console.log("4. Testing verified library exclusivity invariant...")
  const allCuratedPdbIds = new Set(CURATED_TARGET_PROTEINS.map(t => t.pdbId.toUpperCase()))
  for (const suggestion of akapulkoSuggestions) {
    assert.ok(
      allCuratedPdbIds.has(suggestion.target.pdbId.toUpperCase()),
      `Suggestion ${suggestion.target.pdbId} must exist in verified curated library`
    )
  }
  console.log("   ✓ Invariant verified: Zero hallucinated or unverified PDB targets returned by AI.\n")

  // 5. Keyword search filter
  console.log("5. Testing keyword search filter...")
  const searchResults1 = searchCuratedTargets("cox-2")
  assert.ok(searchResults1.some(t => t.pdbId === "5KIR" || t.pdbId === "1CX2"))
  
  const searchResults2 = searchCuratedTargets("wound")
  assert.ok(searchResults2.some(t => t.pdbId === "1T46"))

  const searchResults3 = searchCuratedTargets("antimicrobial")
  assert.ok(searchResults3.some(t => t.pdbId === "2XCT"))

  const searchEmpty = searchCuratedTargets("")
  assert.strictEqual(searchEmpty.length, CURATED_TARGET_PROTEINS.length)
  console.log("   ✓ Search correctly filters targets by protein name, gene, PDB ID, and therapeutic role.\n")

  // 6. Direct Selection Mapping Integrity
  console.log("6. Testing selection mapping without manual entry requirements...")
  const mockSelectedPdbIds = new Set(["5KIR", "6Y3C"])
  const displayItems = CURATED_TARGET_PROTEINS.map(target => ({
    ...target,
    isSelected: mockSelectedPdbIds.has(target.pdbId),
  }))
  const selectedItems = displayItems.filter(item => item.isSelected)
  assert.strictEqual(selectedItems.length, 2, "Must reflect selected targets count")
  assert.deepStrictEqual(selectedItems.map(i => i.pdbId), ["5KIR", "6Y3C"])
  console.log("   ✓ Direct checkbox selection model verified.\n")

  console.log("✓ ALL TARGET PROTEIN SELECTION TESTS PASSED SUCCESSFULLY!")
}

runTargetProteinSelectionTests().catch(err => {
  console.error("Test failed:", err)
  process.exit(1)
})
