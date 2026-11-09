/**
 * NatureAide Root Development Setup Script
 *
 * Prepares a fresh clone for development:
 * 1. Ensures .env.local exists (copies from .env.example if missing, never overwrites).
 * 2. Runs docking environment setup (Python 3.11 venv, requirements, Vina 1.2.7).
 * 3. Verifies MySQL connectivity and database schema.
 * 4. Prints unified setup readiness report.
 */

import { spawn } from "node:child_process"
import { createRequire } from "node:module"
import fs from "node:fs"
import net from "node:net"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { setupDocking } from "./setup-docking.mjs"

const require = createRequire(import.meta.url)
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")

function statusLine(label, detail) {
  const pad = Math.max(1, 18 - label.length)
  console.log(`${label} ${".".repeat(pad)} ${detail}`)
}

function portOpen(checkPort, host = "127.0.0.1") {
  return new Promise((resolve) => {
    const socket = net.connect({ port: checkPort, host })
    const done = (open) => {
      socket.destroy()
      resolve(open)
    }
    socket.setTimeout(1200)
    socket.once("connect", () => done(true))
    socket.once("timeout", () => done(false))
    socket.once("error", () => done(false))
  })
}

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

async function runCommand(cmd, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      cwd: root,
      env: process.env,
      stdio: "inherit",
      shell: true,
      windowsHide: true,
    })
    child.on("exit", (code) => {
      if (code === 0) resolve()
      else reject(new Error(`Command ${cmd} exited with code ${code}`))
    })
    child.on("error", reject)
  })
}

async function checkDatabase() {
  const dbHost = process.env.DB_HOST || "localhost"
  const dbPort = Number(process.env.DB_PORT || 3306)
  const dbUser = process.env.DB_USER || "root"
  const dbPassword = process.env.DB_PASSWORD ?? ""
  const dbName = process.env.DB_NAME || "natureaide_db"

  const isReachable = await portOpen(dbPort)
  if (!isReachable) {
    return {
      connected: false,
      error: `Not reachable on ${dbHost}:${dbPort} (Start MySQL in XAMPP before starting the application)`,
      dbName,
    }
  }

  try {
    const mysql = require("mysql2/promise")
    const conn = await mysql.createConnection({
      host: dbHost,
      port: dbPort,
      user: dbUser,
      password: dbPassword,
      connectTimeout: 5000,
    })

    // Ensure database exists
    await conn.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`)
    await conn.query(`USE \`${dbName}\`;`)

    // Check if schema_migrations table exists
    const [tables] = await conn.query("SHOW TABLES LIKE 'schema_migrations';")
    if (Array.isArray(tables) && tables.length === 0) {
      await conn.end().catch(() => {})
      await runCommand("npx", ["tsx", "scripts/migrate.ts"])
    } else {
      await conn.end().catch(() => {})
    }

    return { connected: true, dbName }
  } catch (err) {
    return {
      connected: false,
      error: `Connection error: ${err.message} (Verify credentials in .env.local)`,
      dbName,
    }
  }
}

async function main() {
  // 1. Environment file check (Never overwrite existing .env.local)
  const envLocalPath = path.join(root, ".env.local")
  const envExamplePath = path.join(root, ".env.example")
  let envCreated = false

  if (!fs.existsSync(envLocalPath)) {
    if (fs.existsSync(envExamplePath)) {
      fs.copyFileSync(envExamplePath, envLocalPath)
      envCreated = true
    }
  }

  loadEnvFile(envLocalPath)

  // 2. Docking Environment Setup (Python 3.11, venv, requirements, Vina 1.2.7)
  const dockingInfo = await setupDocking({ quiet: true, verbose: false })

  // 3. MySQL / Database Verification
  const dbInfo = await checkDatabase()

  // 4. Print Unified Concise Setup Output
  console.log("")
  console.log("NATUREAIDE SETUP")
  statusLine("Node.js", `✓ ${process.version}`)
  statusLine("Environment", `✓ ${envCreated ? "Created .env.local from .env.example" : ".env.local"}`)
  statusLine("Python 3.11", `✓ ${dockingInfo.pythonVersion}`)
  statusLine("Virtual Env", "✓ .docking-venv")
  statusLine("RDKit", `✓ ${dockingInfo.rdkitVersion}`)
  statusLine("Meeko", `✓ ${dockingInfo.meekoVersion}`)
  statusLine("Gemmi", `✓ ${dockingInfo.gemmiVersion}`)
  statusLine("Open Babel", `✓ ${dockingInfo.obabelVersion}`)
  statusLine("AutoDock Vina", `✓ ${dockingInfo.vinaVersion}`)
  if (dbInfo.connected) {
    statusLine("MySQL", "✓ Connected")
    statusLine("Database", `✓ ${dbInfo.dbName}`)
    try {
      await runCommand("npx", ["tsx", "scripts/seed-phytochemical-catalog.ts"])
      statusLine("Phytochemicals", "✓ plant_compounds catalog seeded")
    } catch (err) {
      statusLine("Phytochemicals", `⚠ Seed skipped (${err.message || "run npm run db:seed:phytochemicals"})`)
    }
  } else {
    statusLine("MySQL", `⚠ ${dbInfo.error}`)
    statusLine("Database", `⚠ ${dbInfo.dbName} (pending MySQL start)`)
    statusLine("Phytochemicals", "⚠ Seed after MySQL is online: npm run db:seed:phytochemicals")
  }
  statusLine("Docking Engine", "✓ Ready")

  console.log("")
  console.log("Setup complete! You can now start NatureAide:")
  console.log("  npm run dev:share    (Next.js + public tunnel + status checks)")
  console.log("  npm run dev          (Next.js local development server)")
  console.log("")
}

main().catch((err) => {
  console.error("")
  console.error("Setup encountered an error:", err)
  console.error("")
  process.exit(1)
})
