import assert from "node:assert"
import {
  CURATED_TARGET_PROTEINS,
  suggestTargetsForProject,
  lookupTargetByPdbId,
  searchCuratedTargets,
  getCuratedLibrarySize,
} from "../src/lib/target-protein-catalog"

async function runTargetProteinSelectionTests() {
  console.log("=== RUNNING SECTION 2, STEP 2: TARGET PROTEIN SELECTION TEST SUITE ===\n")

  // 1. Curated Target Protein Catalog Completeness
  console.log("1. Testing verified curated target library completeness...")
  assert.ok(CURATED_TARGET_PROTEINS.length >= 30, "Must have a substantially expanded curated library")
  assert.strictEqual(getCuratedLibrarySize(), CURATED_TARGET_PROTEINS.length)

  const pdbIds = CURATED_TARGET_PROTEINS.map(t => t.pdbId.toUpperCase())
  const uniqueIds = new Set(pdbIds)
  assert.strictEqual(uniqueIds.size, pdbIds.length, "Library must not contain duplicate PDB IDs")

  // Original nine PDB IDs must remain selectable
  for (const id of ["5KIR", "6Y3C", "3W37", "2AZ5", "1CX2", "4M8E", "3LN1", "2XCT", "1T46"]) {
    assert.ok(pdbIds.includes(id), `Library must retain original PDB ${id}`)
  }
  assert.ok(pdbIds.includes("1GKC"), "Library must contain verified MMP-9 (1GKC)")
  assert.ok(pdbIds.includes("3V99"), "Library must contain verified 5-LOX (3V99)")
  assert.ok(pdbIds.includes("3E7G"), "Library must contain verified iNOS (3E7G)")
  console.log(`   ✓ Verified library contains ${CURATED_TARGET_PROTEINS.length} unique RCSB structures (original 9 retained).\n`)

  // 2. Lookup by PDB ID
  console.log("2. Testing lookupTargetByPdbId case-insensitivity and accuracy...")
  const target5kir = lookupTargetByPdbId("5kir")
  assert.ok(target5kir, "Should locate 5kir")
  assert.strictEqual(target5kir?.geneOrProtein, "PTGS2")
  assert.strictEqual(target5kir?.therapeuticCategory, "Anti-inflammatory & Analgesic")
  assert.strictEqual(target5kir?.resolution, "2.70 Å")
  assert.strictEqual(lookupTargetByPdbId("UNKNOWN"), null, "Should return null for unknown PDB ID")

  const kit = lookupTargetByPdbId("1T46")
  assert.ok(kit, "Should locate 1T46")
  assert.strictEqual(kit?.geneOrProtein, "KIT")
  assert.match(kit?.targetName || "", /c-Kit/i)

  const mmp9 = lookupTargetByPdbId("1GKC")
  assert.ok(mmp9, "Should locate 1GKC")
  assert.strictEqual(mmp9?.geneOrProtein, "MMP9")
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

  const top5PdbIds = akapulkoSuggestions.slice(0, 5).map(s => s.target.pdbId)
  assert.ok(
    top5PdbIds.includes("5KIR") || top5PdbIds.includes("2AZ5") || top5PdbIds.includes("1GKC"),
    "Top recommendations must include COX-2 (5KIR), TNF-alpha (2AZ5), or MMP-9 (1GKC)"
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
  assert.ok(searchResults2.some(t => t.pdbId === "1GKC" || t.pdbId === "1T46"))

  const searchResults3 = searchCuratedTargets("antimicrobial")
  assert.ok(searchResults3.some(t => t.pdbId === "2XCT" || t.pdbId === "3G7B"))

  const searchByGene = searchCuratedTargets("SOD1")
  assert.ok(searchByGene.some(t => t.pdbId === "2C9V"))

  const searchByPdb = searchCuratedTargets("3E7G")
  assert.ok(searchByPdb.some(t => t.pdbId === "3E7G"))

  const searchEmpty = searchCuratedTargets("")
  assert.strictEqual(searchEmpty.length, CURATED_TARGET_PROTEINS.length)
  console.log("   ✓ Search correctly filters targets by protein name, gene, PDB ID, and therapeutic role.\n")

  // 6. Required metadata fields on every entry
  console.log("6. Testing required protein metadata fields...")
  for (const t of CURATED_TARGET_PROTEINS) {
    assert.ok(/^[0-9][A-Z0-9]{3}$/.test(t.pdbId), `Invalid PDB ID format: ${t.pdbId}`)
    assert.ok(t.targetName.trim().length > 0, `${t.pdbId} missing name`)
    assert.ok(t.geneOrProtein.trim().length > 0, `${t.pdbId} missing gene`)
    assert.ok(t.therapeuticCategory.trim().length > 0, `${t.pdbId} missing category`)
    assert.ok(t.organism.trim().length > 0, `${t.pdbId} missing organism`)
    assert.ok(t.method.trim().length > 0, `${t.pdbId} missing method`)
    assert.ok(t.resolution.trim().length > 0, `${t.pdbId} missing resolution`)
    assert.strictEqual(t.targetType, "EXPERIMENTALLY_ESTABLISHED")
  }
  console.log("   ✓ Every curated entry has verified name, PDB ID, gene, category, organism, resolution, and method.\n")

  // 7. Direct Selection Mapping Integrity
  console.log("7. Testing selection mapping without manual entry requirements...")
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
