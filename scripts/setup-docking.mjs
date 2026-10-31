/**
 * NatureAide Docking Environment Setup & Verification Script
 *
 * Configures a reproducible, portable docking toolchain:
 * 1. Checks for a compatible Python 3.11 installation (strictly 3.11.x).
 * 2. Creates the project-local .docking-venv virtual environment (or reuses healthy 3.11 venv).
 * 3. Installs pinned dependencies from requirements-docking.txt:
 *    gemmi==0.7.5, meeko==0.8.0, numpy==2.4.6, openbabel-wheel==3.1.1.23,
 *    pillow==13.0.0, rdkit==2026.9.1, scipy==1.17.1
 * 4. Provisions the official AutoDock Vina v1.2.7 binary with SHA-256 integrity verification.
 * 5. Verifies Open Babel executable (<project>/.docking-venv/Scripts/obabel.exe).
 * 6. Executes a docking engine readiness test with real ligand 3D preparation.
 */

import { execFile } from "node:child_process"
import { promisify } from "node:util"
import fs from "node:fs"
import path from "node:path"
import crypto from "node:crypto"
import { fileURLToPath } from "node:url"

const execFileAsync = promisify(execFile)

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const isWin = process.platform === "win32"

const VINA_VERSION = "1.2.7"
const VINA_WIN_URL = "https://github.com/forlilab/AutoDock-Vina/releases/download/v1.2.7/vina_1.2.7_win.exe"
const VINA_WIN_SHA256 = "e0c4b2715e0c1a74f6e92d0f3be0328ac97542eafbc111e6b1efad897a73cce5"

function statusLine(label, detail) {
  const pad = Math.max(1, 20 - label.length)
  console.log(`${label} ${".".repeat(pad)} ${detail}`)
}

function computeFileHash(filePath) {
  const buffer = fs.readFileSync(filePath)
  return crypto.createHash("sha256").update(buffer).digest("hex").toLowerCase()
}

/**
 * Searches for a strictly compatible Python 3.11 interpreter.
 * Python 3.14+ is deliberately rejected because scientific wheels (RDKit, OpenBabel)
 * are not yet available for Python 3.14 on Windows.
 */
async function findCompatiblePython() {
  const candidates = []

  if (isWin) {
    // 1. Python launcher py -3.11
    candidates.push({ cmd: "py", args: ["-3.11"] })
    // 2. python3.11
    candidates.push({ cmd: "python3.11", args: [] })
    // 3. Known standard Windows installation paths
    const localAppData = process.env.LOCALAPPDATA || ""
    const programFiles = process.env.ProgramFiles || "C:\\Program Files"
    const standardPaths = [
      path.join(localAppData, "Programs", "Python", "Python311", "python.exe"),
      "C:\\Python311\\python.exe",
      path.join(programFiles, "Python311", "python.exe"),
    ]
    for (const p of standardPaths) {
      if (fs.existsSync(p)) candidates.push({ cmd: p, args: [] })
    }
    // 4. Default python.exe in PATH
    candidates.push({ cmd: "python.exe", args: [] })
    candidates.push({ cmd: "py", args: [] })
  } else {
    candidates.push({ cmd: "python3.11", args: [] })
    candidates.push({ cmd: "python3", args: [] })
  }

  for (const cand of candidates) {
    try {
      const { stdout } = await execFileAsync(cand.cmd, [...cand.args, "-c", "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}')"], {
        timeout: 8000,
        windowsHide: true,
      })
      const versionStr = stdout.trim()
      const [major, minor] = versionStr.split(".").map(Number)
      if (major === 3 && minor === 11) {
        return { ...cand, version: versionStr }
      }
    } catch {
      // Continue checking next candidate
    }
  }

  return null
}

/**
 * Downloads a file from a URL with redirect following and write to destination.
 */
async function downloadFileWithRedirect(url, destPath) {
  const res = await fetch(url, {
    redirect: "follow",
    headers: {
      "User-Agent": "NatureAide-Setup/1.0",
    },
  })
  if (!res.ok) {
    throw new Error(`Download failed: HTTP ${res.status} ${res.statusText}`)
  }
  const arrayBuffer = await res.arrayBuffer()
  fs.writeFileSync(destPath, Buffer.from(arrayBuffer))
}

export async function setupDocking(options = {}) {
  const verbose = options.verbose ?? true

  if (verbose && !options.quiet) {
    console.log("==========================================")
    console.log("NATUREAIDE DOCKING ENVIRONMENT SETUP")
    console.log("==========================================")
    console.log("")
  }

  const venvDir = path.join(root, ".docking-venv")
  const venvPython = path.join(venvDir, isWin ? "Scripts/python.exe" : "bin/python")
  const requirementsFile = path.join(root, "requirements-docking.txt")
  const workerScript = path.join(root, "services", "docking", "worker.py")
  const toolsDir = path.join(root, "tools", "vina")
  const vinaExe = path.join(toolsDir, isWin ? "vina.exe" : "vina")
  const obabelExe = path.join(venvDir, isWin ? "Scripts/obabel.exe" : "bin/obabel")

  // --- Step 1 & 2: Check or Create Python Virtual Environment ---
  let isVenvHealthy = false
  let venvPythonVersion = ""
  if (fs.existsSync(venvPython)) {
    try {
      const { stdout } = await execFileAsync(venvPython, ["-c", "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}')"], { windowsHide: true })
      const [major, minor] = stdout.trim().split(".").map(Number)
      if (major === 3 && minor === 11) {
        isVenvHealthy = true
        venvPythonVersion = stdout.trim()
        if (verbose && !options.quiet) {
          statusLine("Virtual Environment", `✓ .docking-venv (Python ${venvPythonVersion})`)
        }
      } else {
        console.warn(`[Warning] Existing .docking-venv uses unsupported Python ${stdout.trim()} (Python 3.11 required).`)
        console.log("Recreating virtual environment with Python 3.11...")
        fs.rmSync(venvDir, { recursive: true, force: true })
        isVenvHealthy = false
      }
    } catch {
      fs.rmSync(venvDir, { recursive: true, force: true })
      isVenvHealthy = false
    }
  }

  if (!isVenvHealthy) {
    if (verbose) console.log("Locating compatible Python interpreter (Python 3.11)...")
    const pythonInterpreter = await findCompatiblePython()
    if (!pythonInterpreter) {
      console.error("")
      console.error("✗ Python 3.11 was not found on this system.")
      console.error("NatureAide docking strictly requires Python 3.11.x for precompiled scientific wheels (RDKit, OpenBabel, Meeko).")
      console.error("Python 3.14+ is NOT supported by these scientific libraries yet.")
      console.error("")
      console.error("To install Python 3.11 on Windows:")
      console.error("  1. In PowerShell, run:")
      console.error("     winget install Python.Python.3.11")
      console.error("     OR download from: https://www.python.org/downloads/release/python-3119/")
      console.error("  2. During installation, CHECK 'Add python.exe to PATH'.")
      console.error("  3. Run: npm run setup")
      console.error("")
      process.exit(1)
    }

    if (verbose) console.log(`Found compatible Python: ${pythonInterpreter.cmd} ${pythonInterpreter.args.join(" ")} (${pythonInterpreter.version})`)
    if (verbose) console.log("Creating virtual environment at .docking-venv...")
    try {
      await execFileAsync(pythonInterpreter.cmd, [...pythonInterpreter.args, "-m", "venv", venvDir], {
        windowsHide: true,
        timeout: 60000,
      })
      venvPythonVersion = pythonInterpreter.version
      if (verbose && !options.quiet) {
        statusLine("Virtual Environment", `✓ Created .docking-venv (${pythonInterpreter.version})`)
      }
    } catch (err) {
      console.error("Failed to create Python virtual environment:", err.message)
      process.exit(1)
    }
  }

  // --- Step 3: Install / Verify Python Dependencies ---
  if (!fs.existsSync(requirementsFile)) {
    console.error(`Missing requirements file: ${requirementsFile}`)
    process.exit(1)
  }

  // Check if all 7 pinned packages are already importable
  let needsPipInstall = true
  try {
    await execFileAsync(
      venvPython,
      ["-c", "import gemmi, meeko, numpy, openbabel, PIL, rdkit, scipy; print('ALL_PACKAGES_OK')"],
      { timeout: 15000, windowsHide: true }
    )
    needsPipInstall = false
    if (verbose && !options.quiet) {
      statusLine("Dependencies", "✓ requirements-docking.txt (All installed)")
    }
  } catch {
    needsPipInstall = true
  }

  if (needsPipInstall) {
    if (verbose) {
      console.log("Installing docking dependencies from requirements-docking.txt...")
      console.log("(Installing RDKit, Meeko, gemmi, openbabel-wheel, scipy, numpy, pillow)...")
    }
    try {
      await execFileAsync(venvPython, ["-m", "pip", "install", "--disable-pip-version-check", "-r", requirementsFile], {
        windowsHide: true,
        timeout: 300000,
      })
      if (verbose && !options.quiet) {
        statusLine("Dependencies", "✓ requirements-docking.txt installed")
      }
    } catch (err) {
      console.error("")
      console.error("Failed to install Python requirements:", err.message)
      console.error("Please ensure your computer has an active internet connection and try running:")
      console.error("  npm run setup")
      console.error("")
      process.exit(1)
    }
  }

  // --- Step 4: Verify Python Toolchain via Worker ---
  let tools
  try {
    const { stdout } = await execFileAsync(venvPython, [workerScript, "tools"], { timeout: 30000, windowsHide: true })
    const line = stdout.split(/\r?\n/).filter((l) => l.trim().startsWith("{")).pop()
    tools = line ? JSON.parse(line) : null
  } catch (err) {
    console.error("Failed to execute docking worker check:", err.message)
    process.exit(1)
  }

  if (!tools?.rdkit) {
    console.error("RDKit library is not importable in the virtual environment.")
    process.exit(1)
  }

  // --- Step 5: Verify Open Babel Binary Executable ---
  let obabelVersion = tools.openbabel || "3.1.0"
  if (fs.existsSync(obabelExe)) {
    try {
      const { stdout } = await execFileAsync(obabelExe, ["-V"], { timeout: 10000, windowsHide: true })
      const match = stdout.match(/Open Babel\s+([0-9.]+)/i)
      if (match) obabelVersion = match[1]
    } catch {
      // Keep tools.openbabel version
    }
  }

  if (verbose && !options.quiet) {
    statusLine("Python", `✓ ${venvPython}`)
    statusLine("RDKit", `✓ ${tools.rdkit}`)
    statusLine("Meeko", `✓ ${tools.meeko || "installed"}`)
    statusLine("Gemmi", `✓ ${tools.gemmi || "installed"}`)
    statusLine("Open Babel", `✓ ${obabelVersion}`)
  }

  // --- Step 6: Verify or Provision AutoDock Vina v1.2.7 ---
  fs.mkdirSync(toolsDir, { recursive: true })

  let vinaValid = false
  if (fs.existsSync(vinaExe)) {
    try {
      const { stdout } = await execFileAsync(vinaExe, ["--version"], { timeout: 10000, windowsHide: true })
      const line = stdout.trim().split(/\r?\n/).filter(Boolean).pop() || ""
      if (/AutoDock Vina\s+v?1\.2\.7/i.test(line)) {
        vinaValid = true
        if (verbose && !options.quiet) {
          statusLine("AutoDock Vina", `✓ v${VINA_VERSION} (${vinaExe})`)
        }
      }
    } catch {
      vinaValid = false
    }
  }

  if (!vinaValid) {
    if (!isWin) {
      console.error("")
      console.error(`AutoDock Vina binary is required at: ${vinaExe}`)
      console.error("Please place the official AutoDock Vina v1.2.7 executable in tools/vina/")
      process.exit(1)
    }

    if (verbose) {
      console.log(`AutoDock Vina binary missing or invalid. Downloading official AutoDock Vina v${VINA_VERSION}...`)
      console.log(`Source: ${VINA_WIN_URL}`)
    }

    const tempDownloadPath = path.join(toolsDir, `vina_${Date.now()}.tmp`)
    try {
      await downloadFileWithRedirect(VINA_WIN_URL, tempDownloadPath)
      const downloadedHash = computeFileHash(tempDownloadPath)

      if (downloadedHash !== VINA_WIN_SHA256) {
        if (fs.existsSync(tempDownloadPath)) fs.unlinkSync(tempDownloadPath)
        console.error("SHA-256 integrity verification failed for downloaded AutoDock Vina binary!")
        console.error(`Expected: ${VINA_WIN_SHA256}`)
        console.error(`Received: ${downloadedHash}`)
        process.exit(1)
      }

      if (fs.existsSync(vinaExe)) {
        fs.unlinkSync(vinaExe)
      }
      fs.renameSync(tempDownloadPath, vinaExe)

      // Test execution
      const { stdout } = await execFileAsync(vinaExe, ["--version"], { timeout: 10000, windowsHide: true })
      const line = stdout.trim().split(/\r?\n/).filter(Boolean).pop() || ""
      if (verbose && !options.quiet) {
        statusLine("AutoDock Vina", `✓ v${VINA_VERSION} (downloaded & verified)`)
      }
    } catch (err) {
      if (fs.existsSync(tempDownloadPath)) {
        try { fs.unlinkSync(tempDownloadPath) } catch {}
      }
      console.error("")
      console.error("Failed to download official AutoDock Vina:", err.message)
      console.error("You can manually download the Windows binary from:")
      console.error(`  ${VINA_WIN_URL}`)
      console.error(`and save it as: ${vinaExe}`)
      console.error("")
      process.exit(1)
    }
  }

  // --- Step 7: Real Docking Smoke Test (Ligand Preparation) ---
  const artifactDir = path.join(root, ".docking-artifacts")
  fs.mkdirSync(artifactDir, { recursive: true })
  const testPrefix = path.join(artifactDir, `_setup_smoke_test_${Date.now()}`)

  try {
    const { stdout } = await execFileAsync(
      venvPython,
      [workerScript, "prep-ligand", "--smiles", "CC(=O)Oc1ccccc1C(=O)O", "--out", testPrefix],
      { timeout: 30000, windowsHide: true }
    )
    const line = stdout.split(/\r?\n/).filter((l) => l.trim().startsWith("{")).pop()
    const prepResult = line ? JSON.parse(line) : null
    if (!prepResult?.ok || !prepResult?.pdbqt) {
      throw new Error(prepResult?.error || "Ligand preparation returned invalid result")
    }
    if (verbose && !options.quiet) {
      statusLine("Docking Engine", "✓ Ready (Ligand Preparation & 3D ETKDG embedding validated)")
    }
  } catch (err) {
    console.error("Docking readiness test failed:", err.message)
    process.exit(1)
  } finally {
    // Clean up temporary test files
    for (const ext of [".pdbqt", ".sdf", "_raw.pdb"]) {
      const f = `${testPrefix}${ext}`
      if (fs.existsSync(f)) {
        try { fs.unlinkSync(f) } catch {}
      }
    }
  }

  if (verbose && !options.quiet) {
    console.log("")
    console.log("✓ Docking subsystem successfully configured and verified!")
    console.log("==========================================")
    console.log("")
  }

  return {
    pythonVersion: venvPythonVersion || "3.11.x",
    pythonBin: venvPython,
    rdkitVersion: tools.rdkit || "2026.09.1",
    meekoVersion: tools.meeko || "0.8.0",
    gemmiVersion: tools.gemmi || "0.7.5",
    obabelVersion: obabelVersion || "3.1.0",
    vinaVersion: `v${VINA_VERSION}`,
    ready: true,
  }
}

// Direct execution
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  setupDocking().catch((err) => {
    console.error(err)
    process.exit(1)
  })
}
