/**
 * NatureAide development launcher.
 *
 * Docking is not a long-running service. Next.js executes AutoDock Vina directly
 * and calls the Python preparation worker only for a ligand or receptor job.
 * This command checks that toolchain, then starts Next.js and the public tunnel.
 */
import { spawn, execFile, execFileSync } from "node:child_process"
import { createRequire } from "node:module"
import { promisify } from "node:util"
import fs from "node:fs"
import net from "node:net"
import path from "node:path"
import { fileURLToPath } from "node:url"

const require = createRequire(import.meta.url)
const mysql = require("mysql2/promise")
const execFileAsync = promisify(execFile)

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const port = 3000

const children = []
let ngrokListener = null
let closing = false

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return false
  const content = fs.readFileSync(filePath, "utf8")
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue
    const eq = trimmed.indexOf("=")
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    if (key && process.env[key] === undefined) process.env[key] = value
  }
  return true
}

function statusLine(label, detail) {
  const pad = Math.max(1, 18 - label.length)
  console.log(`${label} ${".".repeat(pad)} ${detail}`)
}

function fail(message) {
  console.error("")
  console.error(message)
  console.error("")
  process.exit(1)
}

function killTree(pid) {
  if (!pid) return
  try {
    if (process.platform === "win32") {
      execFileSync("taskkill", ["/pid", String(pid), "/t", "/f"], { stdio: "ignore", windowsHide: true })
    } else {
      process.kill(pid, "SIGTERM")
    }
  } catch {
    // The process may already have exited.
  }
}

function shutdown(code = 0) {
  if (closing) return
  closing = true
  console.log("")
  console.log("Stopping NatureAide...")
  if (ngrokListener && typeof ngrokListener.close === "function") {
    Promise.resolve(ngrokListener.close()).catch(() => {})
    ngrokListener = null
  }
  try {
    const ngrok = require("@ngrok/ngrok")
    if (typeof ngrok.disconnect === "function") ngrok.disconnect()
  } catch {
    // The SDK is optional at shutdown.
  }
  for (const child of children) killTree(child.pid)
  setTimeout(() => process.exit(code), 300)
}

function portOpen(checkPort, host = "127.0.0.1") {
  return new Promise((resolve) => {
    const socket = net.connect({ port: checkPort, host })
    const done = (open) => {
      socket.destroy()
      resolve(open)
    }
    socket.setTimeout(1000)
    socket.once("connect", () => done(true))
    socket.once("timeout", () => done(false))
    socket.once("error", () => done(false))
  })
}

function waitForPort(checkPort, maxWaitMs) {
  const started = Date.now()
  return new Promise((resolve) => {
    const check = () => {
      if (closing) return resolve(false)
      const socket = net.connect({ port: checkPort, host: "127.0.0.1" })
      const retry = () => {
        socket.destroy()
        if (Date.now() - started > maxWaitMs) resolve(false)
        else setTimeout(check, 400)
      }
      socket.setTimeout(2000)
      socket.once("connect", () => {
        socket.destroy()
        resolve(true)
      })
      socket.once("timeout", retry)
      socket.once("error", retry)
    }
    check()
  })
}

async function listeningPids(checkPort) {
  const { stdout } = await execFileAsync("netstat", ["-ano", "-p", "tcp"], { windowsHide: true })
  const pids = new Set()
  for (const line of stdout.split(/\r?\n/)) {
    if (!/LISTENING/i.test(line)) continue
    const parts = line.trim().split(/\s+/)
    const local = parts[1] || ""
    const pid = parts[parts.length - 1]
    if (!local.endsWith(`:${checkPort}`)) continue
    if (/^\d+$/.test(pid) && pid !== "0") pids.add(pid)
  }
  return [...pids]
}

async function processCommand(pid) {
  if (process.platform !== "win32") {
    try {
      const { stdout } = await execFileAsync("ps", ["-p", pid, "-o", "args="], { windowsHide: true })
      return { name: "process", command: stdout.trim() }
    } catch {
      return { name: "process", command: "" }
    }
  }
  const { stdout } = await execFileAsync(
    "powershell.exe",
    [
      "-NoProfile",
      "-NonInteractive",
      "-Command",
      `Get-CimInstance Win32_Process -Filter "ProcessId=${Number(pid)}" | Select-Object -Property Name,CommandLine | ConvertTo-Json -Compress`,
    ],
    { windowsHide: true, timeout: 10000 }
  )
  const text = stdout.trim()
  if (!text) return { name: "process", command: "" }
  const parsed = JSON.parse(text)
  return { name: parsed.Name || "process", command: parsed.CommandLine || "" }
}

function isNatureAideCommand(command) {
  const text = command.toLowerCase().replaceAll("/", "\\")
  const project = root.toLowerCase()
  return text.includes(project) && (text.includes("\\next\\") || text.includes("next dev") || text.includes("dev-share") || text.includes("dev-with-ngrok"))
}

async function ensurePortFree() {
  const open = await portOpen(port)
  if (!open) return
  let owners = []
  try {
    const pids = await listeningPids(port)
    owners = await Promise.all(pids.map(async (pid) => ({ pid, ...(await processCommand(pid)) })))
  } catch {
    owners = []
  }
  const ours = owners.find((owner) => isNatureAideCommand(owner.command))
  console.error("")
  if (ours) {
    console.error(`Port ${port} is already used by NatureAide (pid ${ours.pid}).`)
    console.error("Stop that NatureAide terminal, then run npm run dev:share again.")
  } else if (owners.length) {
    const owner = owners[0]
    console.error(`Port ${port} is already used by ${owner.name} (pid ${owner.pid}).`)
    console.error("NatureAide was not started.")
  } else {
    console.error(`Port ${port} is already in use. NatureAide was not started.`)
  }
  console.error("")
  process.exit(1)
}

function parseWorkerJson(stdout) {
  const line = stdout
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter((item) => item.startsWith("{"))
    .pop()
  if (!line) throw new Error("Preparation worker returned no JSON result.")
  return JSON.parse(line)
}

function resolveNgrokAuthtoken() {
  if (process.env.NGROK_AUTHTOKEN && process.env.NGROK_AUTHTOKEN.trim()) {
    return process.env.NGROK_AUTHTOKEN.trim()
  }
  const candidates = [
    path.join(process.env.LOCALAPPDATA || "", "ngrok", "ngrok.yml"),
    path.join(process.env.USERPROFILE || process.env.HOME || "", ".config", "ngrok", "ngrok.yml"),
    path.join(process.env.USERPROFILE || process.env.HOME || "", ".ngrok2", "ngrok.yml"),
  ]
  for (const filePath of candidates) {
    if (!filePath || !fs.existsSync(filePath)) continue
    const text = fs.readFileSync(filePath, "utf8")
    const match = text.match(/authtoken:\s*["']?([^\s"']+)["']?/)
    if (match?.[1]) return match[1].trim()
  }
  return null
}

function startNext() {
  const nextBin = path.join(root, "node_modules", "next", "dist", "bin", "next")
  const child = spawn(process.execPath, [nextBin, "dev", "--port", String(port)], {
    cwd: root,
    env: process.env,
    stdio: "inherit",
    windowsHide: true,
  })
  children.push(child)
  child.on("exit", (code) => {
    if (closing) return
    console.error("")
    console.error(`Next.js stopped (${code ?? 0}).`)
    shutdown(code ?? 1)
  })
  return child
}

function startNgrokCli() {
  const bin = process.env.NGROK_BIN || "ngrok"
  return new Promise((resolve) => {
    const child = spawn(bin, ["http", String(port), "--log", "stdout", "--log-format", "json"], {
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    })
    children.push(child)
    const timeout = setTimeout(() => resolve(null), 15000)
    const take = (chunk) => {
      for (const line of chunk.toString().split(/\r?\n/)) {
        if (!line.trim()) continue
        try {
          const event = JSON.parse(line)
          if (typeof event.url === "string" && event.url.startsWith("https://")) {
            clearTimeout(timeout)
            resolve(event.url)
          }
        } catch {
          // Non-JSON log lines are not the public URL.
        }
      }
    }
    child.stdout.on("data", take)
    child.stderr.on("data", take)
    child.on("error", () => {
      clearTimeout(timeout)
      resolve(null)
    })
    child.on("exit", () => {
      if (!closing) {
        clearTimeout(timeout)
        resolve(null)
      }
    })
  })
}

async function startTunnel() {
  const authtoken = resolveNgrokAuthtoken()
  if (!authtoken) {
    return { url: null, error: "ngrok authentication is not configured. Run once: ngrok config add-authtoken <your-token>" }
  }
  try {
    const ngrok = require("@ngrok/ngrok")
    ngrokListener = await ngrok.forward({ addr: port, authtoken })
    const url = typeof ngrokListener.url === "function" ? ngrokListener.url() : null
    if (url) return { url, error: null }
  } catch (error) {
    const message = error?.message || "ngrok SDK failed"
    const cliUrl = await startNgrokCli().catch(() => null)
    if (cliUrl) return { url: cliUrl, error: null }
    return { url: null, error: message }
  }
  const cliUrl = await startNgrokCli().catch(() => null)
  if (cliUrl) return { url: cliUrl, error: null }
  return { url: null, error: "ngrok did not return a public URL." }
}

async function main() {
  console.log("")
  console.log("NATUREAIDE DEVELOPMENT")
  console.log("")

  const hasEnv = loadEnvFile(path.join(root, ".env.local")) || loadEnvFile(path.join(root, ".env"))
  if (!hasEnv) fail("Missing .env.local. Add the NatureAide environment file and retry.")
  for (const key of ["DB_HOST", "DB_USER", "DB_NAME"]) {
    if (!process.env[key]) fail(`Missing ${key} in the environment file.`)
  }
  statusLine("Environment", "✓ .env.local")

  const mysqlReachable = await portOpen(Number(process.env.DB_PORT || 3306))
  if (!mysqlReachable) fail("MySQL connection failed. Start MySQL in XAMPP and retry.")

  let connection
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD ?? "",
      database: process.env.DB_NAME,
      connectTimeout: 8000,
    })
    await connection.query("SELECT 1 AS ok")
  } catch {
    fail("MySQL connection failed. Start MySQL in XAMPP and retry.")
  } finally {
    if (connection) await connection.end().catch(() => {})
  }
  statusLine("MySQL", "✓ Connected")
  statusLine("Database", `✓ ${process.env.DB_NAME}`)

  // 1. Resolve Python interpreter (prefer project-local .docking-venv)
  let pythonBin = process.env.DOCKING_PYTHON?.trim()
  if (pythonBin && !path.isAbsolute(pythonBin)) {
    pythonBin = path.resolve(root, pythonBin)
  }
  if (!pythonBin || !fs.existsSync(pythonBin)) {
    const venvPython = path.join(
      root,
      ".docking-venv",
      process.platform === "win32" ? "Scripts/python.exe" : "bin/python"
    )
    if (fs.existsSync(venvPython)) {
      pythonBin = venvPython
    }
  }

  if (!pythonBin || !fs.existsSync(pythonBin)) {
    statusLine("Python", "✗ Not found")
    console.error("")
    console.error("Docking environment is not installed.")
    console.error("Run: npm run setup:docking")
    console.error("")
    process.exit(1)
  }

  const worker = path.join(root, "services", "docking", "worker.py")
  let tools
  try {
    const { stdout } = await execFileAsync(pythonBin, [worker, "tools"], { timeout: 30000, windowsHide: true })
    tools = parseWorkerJson(stdout)
  } catch {
    fail("RDKit environment unavailable. Run: npm run setup:docking")
  }
  if (!tools?.rdkit) fail("RDKit environment unavailable. Run: npm run setup:docking")
  statusLine("Python", `✓ ${pythonBin}`)
  statusLine("RDKit", `✓ ${tools.rdkit}`)

  // 2. Resolve AutoDock Vina binary (prefer project-local tools/vina/vina.exe)
  let vinaBin = process.env.VINA_BIN?.trim()
  if (vinaBin && !path.isAbsolute(vinaBin)) {
    vinaBin = path.resolve(root, vinaBin)
  }
  if (!vinaBin || !fs.existsSync(vinaBin)) {
    const defaultVina = path.join(
      root,
      "tools",
      "vina",
      process.platform === "win32" ? "vina.exe" : "vina"
    )
    if (fs.existsSync(defaultVina)) {
      vinaBin = defaultVina
    }
  }

  if (!vinaBin || !fs.existsSync(vinaBin)) {
    statusLine("AutoDock Vina", "✗ Not found")
    console.error("")
    console.error("AutoDock Vina binary is missing.")
    console.error("Run: npm run setup:docking")
    console.error("")
    process.exit(1)
  }

  let vinaLabel = null
  try {
    const { stdout } = await execFileAsync(vinaBin, ["--version"], { timeout: 10000, windowsHide: true })
    const line = stdout.trim().split(/\r?\n/).filter(Boolean).pop() || ""
    const match = line.match(/AutoDock Vina\s+v?([0-9][0-9.]*)/i)
    vinaLabel = match ? `v${match[1]}` : line || null
  } catch (error) {
    const missing = error?.code === "ENOENT" || /ENOENT|not found/i.test(String(error?.message || ""))
    fail(missing ? "AutoDock Vina not found. Run: npm run setup:docking" : "AutoDock Vina could not be executed.")
  }
  if (!vinaLabel) fail("AutoDock Vina not found. Run: npm run setup:docking")
  statusLine("AutoDock Vina", `✓ ${vinaLabel}`)

  const missingPrep = [
    !tools.meeko ? "Meeko" : null,
    !tools.gemmi ? "gemmi" : null,
    !tools.obabel ? "Open Babel" : null,
  ].filter(Boolean)
  if (missingPrep.length) fail(`Docking preparation is incomplete. Missing: ${missingPrep.join(", ")}.`)
  statusLine("Docking Engine", "✓ Ready")

  await ensurePortFree()

  console.log("")
  console.log("Starting Next.js...")
  startNext()
  const ready = await waitForPort(port, 90000)
  if (!ready) {
    console.error("Timed out waiting for Next.js.")
    shutdown(1)
    return
  }
  statusLine("Next.js", "✓ Running")

  console.log("Opening the public tunnel...")
  const tunnel = await startTunnel()
  if (tunnel.url) statusLine("Public Tunnel", "✓ Connected")
  else {
    statusLine("Public Tunnel", "✗ Failed")
    console.error("")
    console.error("Public sharing failed. NatureAide is still running locally.")
    if (tunnel.error) console.error(tunnel.error)
  }

  console.log("")
  console.log("Local:")
  console.log(`http://localhost:${port}`)
  console.log("")
  console.log("Public:")
  console.log(tunnel.url || "(not available)")
  console.log("")
  console.log("Keep this window open. Ctrl+C stops NatureAide and the tunnel.")
  console.log("")
}

process.on("SIGINT", () => shutdown(0))
process.on("SIGTERM", () => shutdown(0))

main().catch((error) => {
  console.error(error?.message || error)
  shutdown(1)
})
