# NatureAide — Complete Windows Setup & Migration Guide

A step-by-step guide for setting up and running the complete **NatureAide** botanical research, community herbal medicine, and scientific review platform on a new **Windows laptop**.

---

## ⚡ Fast Track: One-Command Automated Setup

For a fresh Windows laptop, use the included **automated installer** (`setup.bat` or `setup.ps1`). It handles detecting, installing, and configuring all core and scientific dependencies automatically.

### The 4-Step Setup Flow

```text
Step 1: Run Installer  ──>  Step 2: Import Database  ──>  Step 3: Add API Secrets  ──>  Step 4: Run NatureAide
     (setup.bat)                (Backup .sql file)             (.env.local)                (npm run dev)
```

### How to Run the Automated Installer

1. Transfer the `natureaide` folder to the new laptop (e.g. `C:\projects\natureaide`).
2. Double-click **`setup.bat`** (or open PowerShell as Administrator and run `.\setup.ps1`).
3. The installer automatically:
   - Detects and installs **Git for Windows** (via winget if missing).
   - Detects and installs **Node.js LTS** (v20+ / v24) and **npm** (via winget if missing).
   - Detects and installs **Python 3.11** (via winget if missing).
   - Checks **XAMPP & MySQL**, verifies port 3306, and creates the `natureaide_db` database.
   - Runs **`npm install`** for all application packages.
   - Downloads official **AutoDock Vina** (`tools\vina\vina.exe`).
   - Sets up the Python virtual environment (`.docking-venv`) with `rdkit`, `meeko`, `scipy`, `gemmi`, and `openbabel-wheel`.
   - Generates `.env.local` with a secure 64-character `AUTH_SECRET` and local paths.
   - Runs preflight verification across all subsystems.

---

## Table of Contents

1. [Fast Track: One-Command Automated Setup](#-fast-track-one-command-automated-setup)
2. [Manual Steps Required After Installer](#manual-steps-required-after-installer)
3. [System & Software Prerequisites (Manual Reference)](#1-system--software-prerequisites)
4. [Project Transfer (Clone or Copy)](#2-project-transfer-clone-or-copy)
5. [Installing Project Dependencies](#3-installing-project-dependencies)
6. [Setting Up XAMPP & MySQL](#4-setting-up-xampp--mysql)
7. [Database Migration & Initialization](#5-database-migration--initialization)
   - [Method A: Export & Import Existing Database (Recommended)](#method-a-export--import-existing-database-recommended)
   - [Method B: Clean Re-initialization via Scripts (Alternative)](#method-b-clean-re-initialization-via-scripts-alternative)
8. [Configuring Environment Variables (`.env.local`)](#6-configuring-environment-variables-envlocal)
9. [Optional Scientific Toolchain (AutoDock Vina & Python)](#7-optional-scientific-toolchain-autodock-vina--python)
10. [Running the Application](#8-running-the-application)
11. [Testing All Major Features & Verification](#9-testing-all-major-features--verification)
12. [Production Build & Deployment Check](#10-production-build--deployment-check)
13. [Troubleshooting & Common Errors](#11-troubleshooting--common-errors)

---

## Manual Steps Required After Installer

The automated installer configures all software, runtimes, and schemas, but keeps **database backup data** and **external API credentials manual** for data safety and security.

### Manual Step 1: Import Your Database Backup

If you have a backup (`natureaide_backup.sql`) from the old laptop:

**PowerShell:**
```powershell
cd C:\projects\natureaide
cmd /c '""C:\xampp\mysql\bin\mysql.exe"" -u root natureaide_db < natureaide_backup.sql'
```

**CMD:**
```cmd
cd C:\projects\natureaide
"C:\xampp\mysql\bin\mysql.exe" -u root natureaide_db < natureaide_backup.sql
```

*(If starting fresh without a previous backup, run `npx tsx scripts/init-db.ts` instead).*

### Manual Step 2: Add Secret API Keys (Optional)

Open `C:\projects\natureaide\.env.local` and paste your private API keys if using external AI services:

```ini
TOGETHER_API_KEY=tgp_v1_your_actual_together_key_here
XAI_API_KEY=xai-your_actual_grok_key_here
NCBI_API_KEY=your_ncbi_key_if_available
```

*(All public botanical, community, screening, formulation, and docking features work locally even without external AI keys).*

### Manual Step 3: Start NatureAide

```powershell
npm run dev
```

Open your browser to: **`http://localhost:3000`**

---

## 1. System & Software Prerequisites

Before starting, install the following required software on the new Windows laptop:

### Required Software

| Software | Recommended Version | Download Link | Notes |
| :--- | :--- | :--- | :--- |
| **Node.js** | **v20.x or v22.x LTS** (or v24.x) | [nodejs.org](https://nodejs.org/) | Select the **LTS** installer. Automatically installs `npm`. |
| **Git for Windows** | Latest (2.40+) | [git-scm.com](https://git-scm.com/) | Select standard options during setup. Includes Git Bash. |
| **XAMPP for Windows** | **8.1+ / 8.2+** (PHP 8.2 / MariaDB 10.4+) | [apachefriends.org](https://www.apachefriends.org/) | Standard installation path: `C:\xampp`. We only need the **MySQL** module. |

### Optional / Advanced Features

| Tool | Purpose | When Needed |
| :--- | :--- | :--- |
| **Python 3.10 or 3.11** | Molecular ligand/receptor preparation worker | Only if executing **Stage 3 In-Silico Molecular Docking** locally. |
| **AutoDock Vina** (`vina.exe`) | Open-source molecular docking engine | Only if executing **Stage 3 In-Silico Molecular Docking** locally. |
| **ngrok** | HTTPS public reverse proxy tunnel | Only if running `npm run dev:share` or `npm run tunnel` to test on mobile/remote devices. |

### Verifying Core Tool Installations

Open **PowerShell** or **Command Prompt (CMD)** and verify:

```powershell
node -v
npm -v
git --version
```

Expected output:
- `node`: `v20.x.x` or higher (e.g., `v24.14.1`)
- `npm`: `10.x.x` or higher (e.g., `11.12.1`)
- `git`: `git version 2.x.x.windows.x`

---

## 2. Project Transfer (Clone or Copy)

Choose **one** of the following methods to transfer the project to the new laptop:

### Option 1: Clone from Git Repository

In PowerShell or CMD:

```powershell
# Navigate to your target directory (e.g. C:\projects)
mkdir C:\projects -ErrorAction SilentlyContinue
cd C:\projects

# Clone the repository
git clone <YOUR_GIT_REPOSITORY_URL> natureaide
cd natureaide
```

> **Note:** If cloning via Git, `.env.local` and database dumps are excluded by `.gitignore` and must be copied or configured separately in [Step 5](#5-database-migration--initialization) and [Step 6](#6-configuring-environment-variables-envlocal).

### Option 2: Direct Folder Copy (USB Drive / Network / Zip)

If copying the project directory directly from your old laptop:

1. **On the Old Laptop**:
   - Do **NOT** copy `node_modules` or `.next` (these contain hundreds of thousands of files and take hours to transfer).
   - If using a Zip tool, select `C:\projects\natureaide` and **exclude** `node_modules`, `.next`, and `.docking-artifacts`.
2. **On the New Laptop**:
   - Extract or copy the folder to `C:\projects\natureaide`.
   - Ensure the `.env.local` file (if copied) is placed in the project root directory.

---

## 3. Installing Project Dependencies

1. Open PowerShell or CMD as Administrator or regular user.
2. Navigate into the project directory:

```powershell
cd C:\projects\natureaide
```

3. Install npm packages:

```powershell
npm install
```

> **If any peer dependency warnings occur with React 19:**
> ```powershell
> npm install --legacy-peer-deps
> ```

---

## 4. Setting Up XAMPP & MySQL

NatureAide uses MySQL/MariaDB (via `mysql2`) as its primary database.

### Step 4.1: Start MySQL in XAMPP
1. Open the **XAMPP Control Panel** (`C:\xampp\xampp-control.exe`).
2. Locate **MySQL** in the module list.
3. Click the **Start** button next to MySQL.
4. Verify that the MySQL status label turns **green** and displays port **3306**.

> *(Optional)* You can also click **Start** on Apache if you want to access phpMyAdmin at `http://localhost/phpmyadmin`.

### Step 4.2: (Recommended) Add MySQL to Windows Environment PATH
Adding MySQL's `bin` folder to your Windows PATH enables running `mysql` and `mysqldump` from any terminal.

1. Press `Win + R`, type `sysdm.cpl`, and press **Enter**.
2. Click the **Advanced** tab -> click **Environment Variables**.
3. Under **System variables**, select `Path` -> click **Edit**.
4. Click **New** and add:
   ```text
   C:\xampp\mysql\bin
   ```
5. Click **OK** on all dialogs, then restart your PowerShell/CMD terminal.

Alternatively, if you prefer not to modify PATH, you can always invoke MySQL using its full executable path:
`C:\xampp\mysql\bin\mysql.exe` and `C:\xampp\mysql\bin\mysqldump.exe`.

### Step 4.3: Verify MySQL Connection via Terminal

**Using PowerShell:**
```powershell
& "C:\xampp\mysql\bin\mysql.exe" -u root -e "SELECT 1 AS ConnectionTest;"
```

**Using CMD:**
```cmd
"C:\xampp\mysql\bin\mysql.exe" -u root -e "SELECT 1 AS ConnectionTest;"
```

Expected output:
```text
+----------------+
| ConnectionTest |
+----------------+
|              1 |
+----------------+
```

### Step 4.4: Create the Database

Create the `natureaide_db` database with UTF-8 character encoding:

**Using PowerShell:**
```powershell
& "C:\xampp\mysql\bin\mysql.exe" -u root -e "CREATE DATABASE IF NOT EXISTS natureaide_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

**Using CMD:**
```cmd
"C:\xampp\mysql\bin\mysql.exe" -u root -e "CREATE DATABASE IF NOT EXISTS natureaide_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

---

## 5. Database Migration & Initialization

You have two choices to populate the database:

- **Method A (Recommended)**: Export the complete database (96 tables, test research projects, docking records, dossiers, monographs) from your old laptop and import it to the new laptop.
- **Method B (Alternative)**: Run the TypeScript database seeding scripts to create a fresh clean database with demo accounts.

---

### Method A: Export & Import Existing Database (Recommended)

This method preserves all existing research dossiers, scientific evidence links, formulations, and user data.

#### Step A1: Export from the OLD Laptop

Open PowerShell or CMD on your **old laptop** in the project directory:

> **IMPORTANT Windows Tip:** Do **not** use the standard PowerShell `>` redirection operator with `mysqldump` because PowerShell 5.1 outputs UTF-16 LE with BOM by default, which corrupts SQL dumps. Always use `--result-file="..."`.

**On Old Laptop — PowerShell:**
```powershell
cd C:\projects\natureaide
& "C:\xampp\mysql\bin\mysqldump.exe" -u root --routines --triggers --result-file="natureaide_backup.sql" natureaide_db
```

*(If your XAMPP is in a custom path such as `C:\xamppp`, replace `C:\xampp` with `C:\xamppp`)*.

**On Old Laptop — CMD:**
```cmd
cd C:\projects\natureaide
"C:\xampp\mysql\bin\mysqldump.exe" -u root --routines --triggers --result-file="natureaide_backup.sql" natureaide_db
```

Verify that `natureaide_backup.sql` has been created (typically ~1.6MB to ~3MB). Transfer this `.sql` file to the new laptop (via flash drive, LAN, or OneDrive).

#### Step A2: Import into the NEW Laptop

Place `natureaide_backup.sql` inside `C:\projects\natureaide\` on the **new laptop**.

Run the following import command:

**On New Laptop — PowerShell:**
```powershell
cd C:\projects\natureaide
cmd /c '""C:\xampp\mysql\bin\mysql.exe"" -u root natureaide_db < natureaide_backup.sql'
```

**On New Laptop — CMD:**
```cmd
cd C:\projects\natureaide
"C:\xampp\mysql\bin\mysql.exe" -u root natureaide_db < natureaide_backup.sql
```

#### Step A3: Verify the Import

Check that all tables were imported successfully:

**PowerShell:**
```powershell
& "C:\xampp\mysql\bin\mysql.exe" -u root natureaide_db -e "SELECT COUNT(*) AS total_tables FROM information_schema.tables WHERE table_schema = 'natureaide_db';"
```

**CMD:**
```cmd
"C:\xampp\mysql\bin\mysql.exe" -u root natureaide_db -e "SELECT COUNT(*) AS total_tables FROM information_schema.tables WHERE table_schema = 'natureaide_db';"
```

Expected result:
```text
+--------------+
| total_tables |
+--------------+
|           96 |
+--------------+
```

---

### Method B: Clean Re-initialization via Scripts (Alternative)

If you do not have a database dump and want to generate all tables and default seed data from scratch, run the built-in migration and seed scripts in sequence:

```powershell
cd C:\projects\natureaide

# 1. Initialize core tables, demo accounts, plants, and guides
npx tsx scripts/init-db.ts

# 2. Initialize researcher portal tables, projects, and pipeline stages
npx tsx scripts/init-researcher-db.ts

# 3. Initialize reviewer portal tables, assignments, and decisions
npx tsx scripts/init-reviewer-db.ts

# 4. Initialize commercial herbal products catalog & regulatory records
npx tsx scripts/setup-herbal-products-db.ts

# 5. Initialize saved products tracking
npx tsx scripts/setup-saved-products.ts

# 6. Seed product scientific evidence data
node scripts/seed_all_product_evidence.js

# 7. Seed traditional herbal preparations & dosage forms
node scripts/seed_traditional_preparations.js

# 8. Seed verified plant monographs and evidence
npx tsx scripts/seed-verified-plant-monographs.ts
npx tsx scripts/seed-verified-product-evidence.ts

# 9. Sync botanical images
node scripts/apply_ai_representative_images_to_db.js
```

---

## 6. Configuring Environment Variables (`.env.local`)

In the project root (`C:\projects\natureaide`), create or edit `.env.local`.

Copy the template below:

```ini
# ==============================================================================
# NatureAide Environment Configuration
# File: .env.local
# ==============================================================================

# Database Connection (XAMPP Default)
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=natureaide_db

# Authentication Security (Minimum 32 random characters for JWT signing)
AUTH_SECRET=natureaide_super_secret_jwt_key_2026_botanical_security_token_xyz987

# NCBI Entrez Literature API
NCBI_TOOL_NAME=NatureAide
NCBI_API_KEY=

# Together AI (Llama-3.3 / DeepSeek / GLM Fallback Engine)
TOGETHER_API_KEY=
TOGETHER_MODEL_PRIMARY=meta-llama/Llama-3.3-70B-Instruct-Turbo
TOGETHER_MODEL_FALLBACK=deepseek-ai/DeepSeek-V4.1-Flash
TOGETHER_MODEL_FINAL=zai-org/GLM-5.3-Flash

# xAI Grok API Configuration (Scientific AI Assistant)
XAI_API_KEY=
XAI_BASE_URL=https://api.x.ai/v1
XAI_MODEL=grok-4.7

# AutoDock Vina In-Silico Docking Engine (Stage 3 - Optional)
# Leave blank to use defaults or configure if Python docking venv is installed
VINA_BIN=
DOCKING_PYTHON=
DOCKING_ARTIFACT_DIR=C:\projects\natureaide\.docking-artifacts
DOCKING_TIMEOUT_SECONDS=900
```

> **Notes on API Keys:**
> - `DB_*` and `AUTH_SECRET` are **mandatory** for the application to function.
> - `TOGETHER_API_KEY` and `XAI_API_KEY` are optional for local UI/UX testing; without them, the AI Assistant and Auto-Grounding features return fallback offline notices rather than crashing the app.
> - If you had existing API keys on your old laptop, copy them over into `.env.local`.

---

## 7. Optional Scientific Toolchain (AutoDock Vina & Python)

The core web application runs 100% fine without this toolchain. However, if you plan to execute local **Stage 3 In-Silico Molecular Docking** computations:

1. **AutoDock Vina Binary**:
   - Download the official Windows release of AutoDock Vina (`vina.exe`) from the [AutoDock Vina GitHub Releases](https://github.com/ccsb-scripps/AutoDock-Vina/releases).
   - Place `vina.exe` in `C:\projects\natureaide\tools\vina\vina.exe` or point `VINA_BIN` in `.env.local` to its path.

2. **Python Environment for Docking Worker**:
   ```powershell
   # Create a Python virtual environment
   cd C:\projects\natureaide
   python -m venv .docking-venv

   # Activate and install required cheminformatics libraries
   .\.docking-venv\Scripts\activate
   pip install rdkit meeko gemmi openbabel-wheel
   ```
3. Set the variables in `.env.local`:
   ```ini
   VINA_BIN=C:\projects\natureaide\tools\vina\vina.exe
   DOCKING_PYTHON=C:\projects\natureaide\.docking-venv\Scripts\python.exe
   ```

---

## 8. Running the Application

### Development Mode (Standard)

In PowerShell or CMD:

```powershell
cd C:\projects\natureaide
npm run dev
```

Open your browser to:
👉 **`http://localhost:3000`**

### Share / Tunneling Mode (For Testing on Mobile / Remote Laptops)

If you want to access the app from another smartphone or remote computer via ngrok:

```powershell
npm run dev:share
```

*(This runs preflight checks on MySQL, docking paths, and sets up an ngrok public HTTPS tunnel).*

---

## 9. Testing All Major Features & Verification

### Default User Test Accounts

All accounts use the standard password: **`NatureAide123!`**

| Role | Email | Password | Landing Portal | Features to Test |
| :--- | :--- | :--- | :--- | :--- |
| **Community Member** | `community@natureaide.test` | `NatureAide123!` | `/community` | Plant search, safety guides, preparation tea/decoction steps, health screening quiz, Ask NatureAide chatbot. |
| **Scientific Researcher** | `researcher@natureaide.test` | `NatureAide123!` | `/researcher` | Research projects, 8-stage scientific pipeline, literature analysis, docking results, safety assessment, laboratory upload, dossier generation. |
| **Scientific Reviewer** | `reviewer@natureaide.test` | `NatureAide123!` | `/reviewer` | Review dashboard, evidence verification, submission comments, scorecards, decision approval/revision cycles. |

---

### Step-by-Step Manual Verification Checklist

1. **Public Landing Page** (`http://localhost:3000/`):
   - Verify page renders with brand navigation, plant highlight carousel, and "Get Started" buttons.
2. **Community Portal**:
   - Log in at `/login` with `community@natureaide.test` / `NatureAide123!`.
   - Browse plants at `/community/plants` (e.g., Lagundi, Sambong).
   - Click a plant to view traditional uses, warnings, and preparation guides.
   - Run a Health Screening at `/community/screening`.
   - Ask a question in the chatbot at `/community/ask`.
3. **Researcher Portal**:
   - Log out, then log in with `researcher@natureaide.test` / `NatureAide123!`.
   - Go to `/researcher/projects`.
   - Open an active research project (e.g. Project 8).
   - Test through the 8 stages:
     - Stage 1: Plant & Literature
     - Stage 2: In-Silico Compound Screening
     - Stage 3: Molecular Docking Runs
     - Stage 4: Formulation Safety
     - Stage 5: Expert Review Submission
     - Stage 6: Laboratory Validation
     - Stage 7: Dossier Synthesis
     - Stage 8: Knowledge Integration Proposal
4. **Reviewer Portal**:
   - Log in with `reviewer@natureaide.test` / `NatureAide123!`.
   - View assigned submissions at `/reviewer/reviews`.
   - Review evidence sections, leave reviewer feedback, and test the decision submission.

---

### Automated End-to-End Validation

NatureAide includes automated validation test scripts that exercise the entire system.

**1. Quick Researcher & Reviewer Flow Test:**
*(Make sure the dev server is running on port 3000 in another terminal)*

```powershell
node scripts/e2e-workflow-test.js
```

**2. Full System 25-Point Comprehensive Validation:**
```powershell
node scripts/test_natureaide_full_system_e2e.js
```

---

## 10. Production Build & Deployment Check

To confirm that TypeScript, Tailwind Turbopack, and Next.js routes compile without errors:

```powershell
cd C:\projects\natureaide

# 1. Run ESLint checks
npm run lint

# 2. Build the production bundle
npm run build

# 3. Start the production server
npm run start
```

Open `http://localhost:3000` to verify the production build is serving properly.

---

## 11. Troubleshooting & Common Errors

### 1. `Port 3306 in use` or MySQL Fails to Start in XAMPP
- **Cause:** Another service (like an existing standalone MySQL server, Skype, or Windows MySQL service) is occupying port 3306.
- **Fix:**
  1. Open PowerShell as Administrator.
  2. Find what is using port 3306:
     ```powershell
     Get-Process -Id (Get-NetTCPConnection -LocalPort 3306).OwningProcess
     ```
  3. Stop conflicting services:
     ```powershell
     Stop-Service MySQL -ErrorAction SilentlyContinue
     Stop-Service MariaDB -ErrorAction SilentlyContinue
     ```
  4. Restart MySQL in the XAMPP Control Panel.

### 2. `Access denied for user 'root'@'localhost'`
- **Cause:** MySQL root has a password set in your XAMPP installation.
- **Fix:**
  - Update `DB_PASSWORD=` in your `.env.local` to match your XAMPP root password.
  - When running terminal commands, add `-p` (e.g. `mysql -u root -p natureaide_db`).

### 3. PowerShell Error: `Execution of scripts is disabled on this system`
- **Cause:** Windows PowerShell script execution policy prevents running unsigned scripts.
- **Fix:** Run this once in PowerShell as Administrator:
  ```powershell
  Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
  ```

### 4. Database Dump Import Corrupted / Syntax Error
- **Cause:** Using standard `>` redirection in PowerShell (e.g., `mysqldump > dump.sql`) produces a UTF-16 LE file with BOM.
- **Fix:**
  - When exporting, always use:
    `mysqldump -u root --result-file="natureaide_backup.sql" natureaide_db`
  - When importing, invoke through cmd:
    `cmd /c '""C:\xampp\mysql\bin\mysql.exe"" -u root natureaide_db < natureaide_backup.sql'`

### 5. `AUTH_SECRET must be configured with at least 32 characters`
- **Cause:** `.env.local` is missing or `AUTH_SECRET` is too short.
- **Fix:** Make sure `.env.local` exists in the project root and has a 32+ character key:
  ```ini
  AUTH_SECRET=natureaide_super_secret_jwt_key_2026_botanical_security_token_xyz987
  ```

### 6. Node.js Version Error or Turbopack Errors
- **Cause:** Using an outdated Node version (such as Node 16 or early Node 18).
- **Fix:** Next.js 16 requires Node.js 18.18.0+ or Node.js 20+. Upgrade Node to Node 20 LTS or Node 22 LTS from [nodejs.org](https://nodejs.org/).

---

*NatureAide Documentation &copy; 2026. All rights reserved.*

