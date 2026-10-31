import assert from "node:assert"
import fs from "node:fs"
import path from "node:path"
import { detectDockingEngine, prepareLigand, runVinaSimulation } from "../src/lib/docking-service"

async function runDockingIntegrationTest() {
  console.log("=== RUNNING REAL AUTODOCK VINA & RDKIT INTEGRATION TEST ===\n")

  // 1. Toolchain Detection Check
  console.log("1. Detecting Docking Engine Toolchain...")
  const engine = await detectDockingEngine(true)
  console.log("Engine Info:", JSON.stringify(engine, null, 2))
  assert.strictEqual(engine.available, true, "Docking engine must be available")
  assert.match(engine.vinaVersion || "", /AutoDock Vina v1\.2\.7/i, "Must run AutoDock Vina v1.2.7")
  assert.strictEqual(Boolean(engine.tools?.rdkit), true, "RDKit must be installed")
  assert.strictEqual(Boolean(engine.tools?.meeko), true, "Meeko must be installed")
  assert.strictEqual(Boolean(engine.tools?.gemmi), true, "gemmi must be installed")
  assert.strictEqual(Boolean(engine.tools?.obabel), true, "Open Babel obabel.exe must be installed")
  console.log("✓ Docking Engine Toolchain detected.\n")

  // 2. Real Ligand Preparation with RDKit & Meeko
  console.log("2. Preparing Ligand (Aspirin SMILES: CC(=O)Oc1ccccc1C(=O)O)...")
  const outDir = path.join(process.cwd(), ".docking-artifacts", "_integration_test")
  fs.mkdirSync(outDir, { recursive: true })
  const ligandPrefix = path.join(outDir, "aspirin")

  const prepRes = await prepareLigand("CC(=O)Oc1ccccc1C(=O)O", ligandPrefix)
  console.log("Ligand Prep Result:", JSON.stringify(prepRes, null, 2))
  assert.strictEqual(prepRes.ok, true, "Ligand preparation must succeed")
  assert.strictEqual(prepRes.heavyAtoms, 13, "Aspirin must have 13 heavy atoms")
  assert.strictEqual(prepRes.formula, "C9H8O4", "Aspirin formula must be C9H8O4")
  assert.strictEqual(fs.existsSync(prepRes.pdbqt || ""), true, "PDBQT file must exist on disk")
  console.log("✓ Ligand Preparation validated with RDKit conformer generation & Meeko PDBQT.\n")

  // 3. Real Vina Execution Test
  console.log("3. Executing Real AutoDock Vina Simulation...")
  // We use the generated ligand PDBQT and an existing receptor PDBQT (or minimal receptor)
  const receptorPath = path.join(process.cwd(), ".docking-artifacts", "project-13", "receptors", "1p30.pdbqt")
  if (fs.existsSync(receptorPath)) {
    const outPoses = path.join(outDir, "poses.pdbqt")
    const logPath = path.join(outDir, "vina.log")

    const vinaRes = await runVinaSimulation({
      receptorPdbqt: receptorPath,
      ligandPdbqt: prepRes.pdbqt!,
      centerX: 10.0,
      centerY: 20.0,
      centerZ: 30.0,
      sizeX: 18.0,
      sizeY: 18.0,
      sizeZ: 18.0,
      exhaustiveness: 2, // low exhaustiveness for fast integration test
      numModes: 3,
      seed: 42,
      outputPdbqtPath: outPoses,
      logPath,
    })

    console.log("Vina Execution Result:", JSON.stringify({
      version: vinaRes.version,
      bestAffinity: vinaRes.bestAffinity,
      modeCount: vinaRes.poses.length,
      posesFileExists: fs.existsSync(outPoses),
    }, null, 2))

    assert.strictEqual(vinaRes.poses.length > 0, true, "Vina must produce docking poses")
    assert.strictEqual(typeof vinaRes.bestAffinity, "number", "Best affinity must be a number")
    assert.strictEqual(vinaRes.bestAffinity! < 0, true, "Binding affinity must be negative (favorable binding)")
    assert.strictEqual(fs.existsSync(outPoses), true, "Poses PDBQT file must exist")
    console.log(`✓ AutoDock Vina Simulation successful! Best Affinity: ${vinaRes.bestAffinity} kcal/mol\n`)
  } else {
    console.log("Note: Receptor 1p30.pdbqt not present; skipping full receptor simulation step.")
  }

  // Clean up test files
  try {
    fs.rmSync(outDir, { recursive: true, force: true })
  } catch {}

  console.log("=== ALL DOCKING INTEGRATION TESTS PASSED ===")
}

runDockingIntegrationTest().catch((err) => {
  console.error("Docking Integration Test Failed:", err)
  process.exit(1)
})

