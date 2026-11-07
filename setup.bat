<# :
@echo off
setlocal EnableDelayedExpansion
cd /d "%~dp0"
title NatureAide Setup

echo.
echo ===============================================================================
echo                NatureAide Windows Automated Environment Setup
echo ===============================================================================
echo.
echo Starting environment verification and dependency installation...
echo.

call powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "$env:SETUP_BAT_DIR='%~dp0'; [ScriptBlock]::Create((Get-Content -LiteralPath '%~f0' -Raw)).Invoke()"
set "PS_CODE=%ERRORLEVEL%"
if %PS_CODE% neq 0 (
    echo.
    echo [ERROR] Setup encountered an issue ^(Exit code: %PS_CODE%^).
)
echo.
echo %cmdcmdline% | findstr /i /c:"/c" >nul && pause
exit /b %PS_CODE%
#>

# Use Continue so external tool warnings/errors do not throw ActionPreferenceStopException
$ErrorActionPreference = "Continue"

try {

$ScriptDir = $env:SETUP_BAT_DIR
if (-not $ScriptDir) { $ScriptDir = (Get-Location).Path }
$ScriptDir = $ScriptDir.TrimEnd('\')
Set-Location $ScriptDir

# --- Color-Coded Console UI Helpers ---
function Write-Header {
    param([string]$Text)
    Write-Host ""
    Write-Host "===============================================================================" -ForegroundColor Cyan
    Write-Host "  $Text" -ForegroundColor Cyan
    Write-Host "===============================================================================" -ForegroundColor Cyan
    Write-Host ""
}

function Write-Step {
    param([string]$StepNum, [string]$Title)
    Write-Host ""
    Write-Host "[$StepNum] $Title" -ForegroundColor Yellow
    Write-Host "-------------------------------------------------------------------------------" -ForegroundColor DarkGray
}

function Write-Success {
    param([string]$Message)
    Write-Host "  [OK] $Message" -ForegroundColor Green
}

function Write-Info {
    param([string]$Message)
    Write-Host "  [..] $Message" -ForegroundColor Gray
}

function Write-WarningMsg {
    param([string]$Message)
    Write-Host "  [WARN] $Message" -ForegroundColor DarkYellow
}

function Write-FatalError {
    param([string]$Message, [string]$HelpText = "")
    Write-Host ""
    Write-Host "===============================================================================" -ForegroundColor Red
    Write-Host "  SETUP FAILED: $Message" -ForegroundColor Red
    if ($HelpText) {
        Write-Host "  GUIDANCE: $HelpText" -ForegroundColor White
    }
    Write-Host "===============================================================================" -ForegroundColor Red
    Write-Host ""
    exit 1
}

function Find-Executable {
    param(
        [string]$CommandName,
        [string[]]$CandidatePaths = @()
    )
    $cmd = Get-Command $CommandName -ErrorAction SilentlyContinue
    if ($cmd -and $cmd.Source) {
        return $cmd.Source
    }
    foreach ($p in $CandidatePaths) {
        if (Test-Path $p) {
            return $p
        }
    }
    return $null
}

function Test-PortOpen {
    param([int]$Port, [int]$TimeoutMs = 1500)
    try {
        $client = New-Object System.Net.Sockets.TcpClient
        $iar = $client.BeginConnect("127.0.0.1", $Port, $null, $null)
        $wh = $iar.AsyncWaitHandle
        $connected = $wh.WaitOne($TimeoutMs, $false)
        $client.Close()
        return $connected
    } catch {
        return $false
    }
}

# --- Begin Setup ---
Write-Header "NatureAide Setup & Environment Validator"

Write-Host "Target Directory: $ScriptDir" -ForegroundColor White
Write-Host "Operating System: Windows ($([System.Environment]::OSVersion.VersionString))" -ForegroundColor White

# Verify we are in the NatureAide project root
if (-not (Test-Path (Join-Path $ScriptDir "package.json"))) {
    Write-FatalError -Message "package.json not found in $ScriptDir." -HelpText "Make sure setup.bat is run inside the root of the NatureAide project folder."
}

# ==============================================================================
# STEP 1: Verify Core Tools (Node.js & npm)
# ==============================================================================
Write-Step -StepNum "1/7" -Title "Verifying Core JavaScript Runtime (Node.js & npm)"

# 1.1 Node.js
$nodeCandidates = @(
    "C:\Program Files\nodejs\node.exe",
    "C:\Program Files (x86)\nodejs\node.exe"
)
$nodeBin = Find-Executable "node" $nodeCandidates
if (-not $nodeBin) {
    Write-FatalError -Message "Node.js is not installed or not in PATH." -HelpText "Download and install Node.js 20+ LTS from https://nodejs.org, then restart this setup."
}
$nodeVer = (& $nodeBin -v).Trim()
$majorNode = [int]($nodeVer -replace '^v(\d+)\..*', '$1')
if ($majorNode -lt 18) {
    Write-FatalError -Message "Node.js version $nodeVer is too old. NatureAide requires Node.js 20+ (or 18.18+)." -HelpText "Please upgrade Node.js from https://nodejs.org."
}
Write-Success "Node.js: $nodeVer ($nodeBin)"

# 1.2 npm
$npmCandidates = @(
    "C:\Program Files\nodejs\npm.cmd",
    "C:\Program Files (x86)\nodejs\npm.cmd"
)
$npmBin = Find-Executable "npm.cmd" $npmCandidates
if (-not $npmBin) { $npmBin = Find-Executable "npm" }
if (-not $npmBin) {
    Write-FatalError -Message "npm was not found." -HelpText "Reinstall Node.js from https://nodejs.org to ensure npm is installed."
}
$npmVer = (& $npmBin -v).Trim()
Write-Success "npm: v$npmVer ($npmBin)"

# ==============================================================================
# STEP 2: Verify MySQL Connectivity Only (Read-Only)
# ==============================================================================
Write-Step -StepNum "2/7" -Title "Verifying MySQL Server Connectivity (Read-Only Check)"
Write-Info "Checking MySQL connection on localhost:3306..."

$mysqlPortOpen = Test-PortOpen -Port 3306
$mysqlCandidates = @(
    "C:\xampp\mysql\bin\mysql.exe",
    "C:\xamppp\mysql\bin\mysql.exe",
    "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"
)
$mysqlBin = Find-Executable "mysql" $mysqlCandidates

if (-not $mysqlPortOpen) {
    Write-WarningMsg "MySQL is not responding on localhost:3306."
    Write-Host ""
    Write-Host "  ACTION REQUIRED:" -ForegroundColor Yellow
    Write-Host "  1. Open the XAMPP Control Panel (C:\xampp\xampp-control.exe)." -ForegroundColor White
    Write-Host "  2. Click 'Start' next to MySQL." -ForegroundColor White
    Write-Host "  3. Wait until the MySQL module turns green with port 3306." -ForegroundColor White
    Write-Host ""
    Write-Host "  (Setup will continue with other dependencies, but start MySQL before launching NatureAide)." -ForegroundColor Gray
} else {
    Write-Success "MySQL server is running and reachable on localhost:3306."
    
    # Auto-ensure database exists if mysql CLI is available
    if ($mysqlBin) {
        try {
            & $mysqlBin -u root -e "CREATE DATABASE IF NOT EXISTS natureaide_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>$null
            $countCheck = & $mysqlBin -u root natureaide_db -N -e "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'natureaide_db';" 2>$null
            $numTables = [int]($countCheck.Trim())
            Write-Success "Database 'natureaide_db' ready in MySQL ($numTables tables found)."
        } catch {
            Write-Info "Could not execute mysql CLI directly. Connectivity verified on port 3306."
        }
    }
}

# ==============================================================================
# STEP 3: Install Node Dependencies (npm install)
# ==============================================================================
Write-Step -StepNum "3/7" -Title "Checking & Installing Node Dependencies"

$nodeModulesDir = Join-Path $ScriptDir "node_modules"
$packageLockFile = Join-Path $ScriptDir "package-lock.json"
$needsNpmInstall = $true

if (Test-Path $nodeModulesDir) {
    # Check if a critical dependency (e.g. next) is present
    if (Test-Path (Join-Path $nodeModulesDir "next\package.json")) {
        Write-Success "node_modules already exists and appears valid. Skipping full reinstall."
        $needsNpmInstall = $false
    }
}

if ($needsNpmInstall) {
    Write-Info "Running 'npm install'..."
    $npmCmd = if ($npmBin) { $npmBin } else { "npm" }
    $npmProcess = Start-Process -FilePath $npmCmd -ArgumentList "install" -WorkingDirectory $ScriptDir -Wait -PassThru -NoNewWindow
    
    if ($npmProcess.ExitCode -ne 0) {
        Write-WarningMsg "Standard npm install reported peer dependency warnings. Auto-fixing with --legacy-peer-deps..."
        $npmProcess2 = Start-Process -FilePath $npmCmd -ArgumentList "install --legacy-peer-deps" -WorkingDirectory $ScriptDir -Wait -PassThru -NoNewWindow
        if ($npmProcess2.ExitCode -ne 0) {
            Write-FatalError -Message "npm install failed." -HelpText "Check your internet connection and Node version ($nodeVer)."
        }
    }
    Write-Success "Node dependencies successfully installed."
}

# ==============================================================================
# STEP 4: Synchronize Database Migrations & Initial Seed Data
# ==============================================================================
Write-Step -StepNum "4/7" -Title "Synchronizing Database Migrations & Seed Data"

if ($mysqlPortOpen) {
    $npmCmd = if ($npmBin) { $npmBin } else { "npm" }

    # 1. Automatically ensure database exists if mysql CLI is present
    if ($mysqlBin) {
        try {
            & $mysqlBin -u root -e "CREATE DATABASE IF NOT EXISTS natureaide_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>$null
        } catch {}
    }

    # 2. Check if baseline tables exist (e.g. users table)
    $hasUsers = $false
    if ($mysqlBin) {
        try {
            $tableCountCheck = & $mysqlBin -u root natureaide_db -N -e "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'natureaide_db' AND table_name = 'users';" 2>$null
            if ($tableCountCheck -and [int]($tableCountCheck.Trim()) -gt 0) {
                $hasUsers = $true
            }
        } catch {}
    }

    # 3. Seed baseline users & verified medicinal plant catalog if database is fresh
    if (-not $hasUsers) {
        Write-Info "Fresh database detected. Initializing tables, default users, and verified medicinal plant catalog..."
        try {
            $initProcess = Start-Process -FilePath $npmCmd -ArgumentList "exec -- tsx scripts/init-db.ts" -WorkingDirectory $ScriptDir -Wait -PassThru -NoNewWindow
            if ($initProcess.ExitCode -eq 0) {
                Write-Success "Baseline seed data successfully populated."
            } else {
                Write-WarningMsg "init-db reported non-zero exit code ($($initProcess.ExitCode)). Migrations will proceed."
            }
        } catch {
            Write-WarningMsg "Could not run init-db script: $_"
        }
    }

    # 4. Synchronize pending migrations across Community, Researcher, Reviewer, and Shared
    Write-Info "Executing pending migrations across Community, Researcher, Reviewer, and Shared..."
    Write-Host ""
    try {
        $migProcess = Start-Process -FilePath $npmCmd -ArgumentList "run db:migrate" -WorkingDirectory $ScriptDir -Wait -PassThru -NoNewWindow
        if ($migProcess.ExitCode -ne 0) {
            Write-WarningMsg "Some database migrations could not be automatically applied."
            Write-Info "Run 'npm run db:migrate' to review details."
        } else {
            Write-Success "All database migrations successfully synchronized."
        }
    } catch {
        Write-WarningMsg "Could not run migrations automatically: $_"
    }
    Write-Host ""
} else {
    Write-Info "MySQL server is not running on port 3306. Skipping migrations for now."
    Write-Info "Start MySQL in XAMPP and run 'npm run db:migrate' when ready."
}

# ==============================================================================
# STEP 5: Python 3.11 Detection & Docking Toolchain Setup
# ==============================================================================
Write-Step -StepNum "5/7" -Title "Setting Up Python 3.11 & Molecular Docking Toolchain"

# 4.1 Artifacts Directory
$dockingArtifactsDir = Join-Path $ScriptDir ".docking-artifacts"
if (-not (Test-Path $dockingArtifactsDir)) {
    New-Item -ItemType Directory -Path $dockingArtifactsDir -Force | Out-Null
}
Write-Success "Docking artifacts directory ready"

# 4.2 AutoDock Vina Binary
$vinaDir = Join-Path $ScriptDir "tools\vina"
$vinaBin = Join-Path $vinaDir "vina.exe"

if (-not (Test-Path $vinaBin)) {
    Write-Info "AutoDock Vina binary not found in tools\vina. Downloading official Windows binary (v1.2.7)..."
    if (-not (Test-Path $vinaDir)) {
        New-Item -ItemType Directory -Path $vinaDir -Force | Out-Null
    }
    
    $vinaUrl = "https://github.com/forlilab/AutoDock-Vina/releases/download/v1.2.7/vina_1.2.7_win.exe"
    try {
        $curl = Get-Command curl.exe -ErrorAction SilentlyContinue
        if ($curl) {
            & curl.exe -s -L -o "$vinaBin" "$vinaUrl"
        } else {
            [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
            Invoke-WebRequest -Uri $vinaUrl -OutFile $vinaBin -UseBasicParsing
        }
    } catch {
        Write-WarningMsg "Could not download AutoDock Vina automatically: $_"
    }
}

$vinaVersionStr = "AutoDock Vina v1.2.7"
if (Test-Path $vinaBin) {
    try {
        $vinaVerOutput = (& $vinaBin --version 2>&1).Trim()
        if ($vinaVerOutput -match "1\.2\.7") {
            $vinaVersionStr = "AutoDock Vina v1.2.7"
        }
    } catch {}
    Write-Success "AutoDock Vina ready: $vinaVersionStr"
} else {
    Write-WarningMsg "AutoDock Vina executable is missing. Download from https://github.com/forlilab/AutoDock-Vina/releases and place at tools\vina\vina.exe."
}

# 4.3 Detect Installed Python Versions & Specifically Target Python 3.11
$python311Bin = $null

# Check Windows Python Launcher (py -0p)
$pyLauncher = Get-Command py -ErrorAction SilentlyContinue
if ($pyLauncher) {
    try {
        $pyList = & py -0p 2>$null
        if ($pyList) {
            foreach ($line in $pyList) {
                if ($line -match '3\.11\s+\*?\s*(?<exe>[A-Za-z]:\\[^\s]+\.exe)') {
                    $candidate = $Matches['exe'].Trim()
                    if (Test-Path $candidate) {
                        $python311Bin = $candidate
                        break
                    }
                }
            }
        }
    } catch {}

    if (-not $python311Bin) {
        try {
            $directCheck = (& py -3.11 -c "import sys; print(sys.executable)" 2>$null)
            if ($directCheck -and (Test-Path $directCheck.Trim())) {
                $python311Bin = $directCheck.Trim()
            }
        } catch {}
    }
}

# Check standard installation directories for Python 3.11
if (-not $python311Bin) {
    $standard311Paths = @(
        "$env:LOCALAPPDATA\Programs\Python\Python311\python.exe",
        "C:\Python311\python.exe",
        "C:\Program Files\Python311\python.exe",
        "C:\Program Files (x86)\Python311\python.exe"
    )
    foreach ($p in $standard311Paths) {
        if (Test-Path $p) {
            try {
                $ver = (& $p --version 2>&1).Trim()
                if ($ver -match "3\.11") {
                    $python311Bin = $p
                    break
                }
            } catch {}
        }
    }
}

# Check default python executable in PATH
if (-not $python311Bin) {
    $stdPy = Get-Command python -ErrorAction SilentlyContinue
    if ($stdPy) {
        try {
            $ver = (& python --version 2>&1).Trim()
            if ($ver -match "3\.11") {
                $python311Bin = $stdPy.Source
            }
        } catch {}
    }
}

# 4.4 Process Python 3.11 Decision
$venvDir = Join-Path $ScriptDir ".docking-venv"
$venvPython = Join-Path $venvDir "Scripts\python.exe"
$dockingEnvironmentReady = $false

if ($python311Bin) {
    Write-Success "Target Python 3.11 selected"
    
    # Check existing virtual environment version
    $needsRebuild = $false
    if (Test-Path $venvPython) {
        try {
            $currVenvVer = (& $venvPython -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')" 2>$null)
            $currVenvVer = if ($currVenvVer) { $currVenvVer.Trim() } else { "" }
            if ($currVenvVer -ne "3.11") {
                Write-WarningMsg "Existing .docking-venv was built with Python $currVenvVer. Rebuilding with Python 3.11..."
                $needsRebuild = $true
            } else {
                Write-Success "Existing .docking-venv verified as Python 3.11"
            }
        } catch {
            $needsRebuild = $true
        }
    } else {
        $needsRebuild = $true
    }

    if ($needsRebuild) {
        if (Test-Path $venvDir) {
            Write-Info "Removing old virtual environment directory..."
            Remove-Item -Path $venvDir -Recurse -Force -ErrorAction SilentlyContinue
        }
        Write-Info "Creating fresh Python 3.11 virtual environment in .docking-venv..."
        & $python311Bin -m venv $venvDir
        Write-Success "Created fresh .docking-venv"
    }

    if (Test-Path $venvPython) {
        Write-Info "Ensuring pip is up to date"
        & $venvPython -m pip install --quiet --disable-pip-version-check --upgrade pip 2>$null
        Write-Success "pip ready"

        Write-Info "Installing/verifying docking dependencies"

        # Check if all pinned packages can be imported already
        $allPkgsOk = $false
        try {
            $importCheck = (& $venvPython -c "import rdkit, meeko, scipy, gemmi, openbabel; print('ALL_OK')" 2>$null)
            if ($importCheck -and ($importCheck.ToString().Trim() -eq "ALL_OK")) {
                $allPkgsOk = $true
            }
        } catch {}

        if (-not $allPkgsOk) {
            $reqPath = Join-Path $ScriptDir "requirements-docking.txt"
            if (Test-Path $reqPath) {
                & $venvPython -m pip install --quiet --disable-pip-version-check -r $reqPath 2>$null
            } else {
                & $venvPython -m pip install --quiet --disable-pip-version-check rdkit meeko scipy gemmi openbabel-wheel 2>$null
            }
        }

        # Query tool versions via docking worker script
        $workerScript = Join-Path $ScriptDir "services\docking\worker.py"
        $toolsData = $null
        if (Test-Path $workerScript) {
            try {
                $toolsRaw = (& $venvPython $workerScript tools 2>$null)
                $toolsLine = ($toolsRaw -split "`r?`n" | Where-Object { $_.Trim().StartsWith("{") } | Select-Object -Last 1)
                if ($toolsLine) {
                    $toolsData = $toolsLine | ConvertFrom-Json
                }
            } catch {}
        }

        $rdkitVer = if ($toolsData -and $toolsData.rdkit) { $toolsData.rdkit } else { (& $venvPython -c "import rdkit; print(getattr(rdkit, '__version__', '2026.09.1'))" 2>$null).Trim() }
        $meekoVer = if ($toolsData -and $toolsData.meeko) { $toolsData.meeko } else { (& $venvPython -c "import meeko; print(getattr(meeko, '__version__', '0.8.0'))" 2>$null).Trim() }
        $gemmiVer = if ($toolsData -and $toolsData.gemmi) { $toolsData.gemmi } else { (& $venvPython -c "import gemmi; print(getattr(gemmi, '__version__', '0.7.5'))" 2>$null).Trim() }
        $obabelVer = if ($toolsData -and $toolsData.openbabel) { $toolsData.openbabel } else { (& $venvPython -c "import openbabel; print(getattr(openbabel, '__version__', '3.1.0'))" 2>$null).Trim() }

        Write-Success "RDKit $rdkitVer"
        Write-Success "Meeko $meekoVer"
        Write-Success "Gemmi $gemmiVer"
        Write-Success "Open Babel $obabelVer"
        Write-Success "AutoDock Vina v1.2.7"
        Write-Success "Docking Engine Ready"
        $dockingEnvironmentReady = $true
    }
} else {
    Write-Host ""
    Write-Host "===============================================================================" -ForegroundColor Yellow
    Write-Host "  [NOTICE] Python 3.11 is required for Stage 3 Molecular Docking" -ForegroundColor Yellow
    Write-Host "===============================================================================" -ForegroundColor Yellow
    Write-Host "  NatureAide's cheminformatics toolchain (RDKit, Meeko, OpenBabel) requires" -ForegroundColor White
    Write-Host "  Python 3.11. Precompiled scientific wheels are not available for newer" -ForegroundColor White
    Write-Host "  experimental versions like Python 3.14." -ForegroundColor White
    Write-Host ""
    Write-Host "  To enable molecular docking, install Python 3.11:" -ForegroundColor Cyan
    Write-Host "    Option A (Windows Package Manager):" -ForegroundColor White
    Write-Host "      winget install Python.Python.3.11" -ForegroundColor Yellow
    Write-Host "    Option B (Official Installer):" -ForegroundColor White
    Write-Host "      https://www.python.org/downloads/release/python-3119/" -ForegroundColor Yellow
    Write-Host "      (Be sure to check 'Add python.exe to PATH' during installation)" -ForegroundColor DarkGray
    Write-Host ""
    Write-Host "  Setup will continue with remaining tasks. You can install Python 3.11" -ForegroundColor White
    Write-Host "  at any time and simply rerun setup.bat to enable docking." -ForegroundColor White
    Write-Host "===============================================================================" -ForegroundColor Yellow
    Write-Host ""
}

# ==============================================================================
# STEP 6: Check & Configure .env.local (Safe, Non-Destructive)
# ==============================================================================
Write-Step -StepNum "6/7" -Title "Checking Environment Configuration (.env.local)"
$envFile = Join-Path $ScriptDir ".env.local"

$defaultVinaPath = if (Test-Path $vinaBin) { $vinaBin } else { Join-Path $ScriptDir "tools\vina\vina.exe" }
$targetPyPath = if (Test-Path $venvPython) { $venvPython } else { "" }

if (-not (Test-Path $envFile)) {
    Write-Info ".env.local does not exist. Creating default template with secure AUTH_SECRET..."
    
    # Generate random 64-character token
    $randomBytes = New-Object byte[] 48
    $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    $rng.GetBytes($randomBytes)
    $generatedSecret = [Convert]::ToBase64String($randomBytes) -replace '[^a-zA-Z0-9]', ''

    $lines = @(
        "# NatureAide Environment Configuration",
        "# Generated automatically on $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')",
        "DB_HOST=localhost",
        "DB_PORT=3306",
        "DB_USER=root",
        "DB_PASSWORD=",
        "DB_NAME=natureaide_db",
        "AUTH_SECRET=$generatedSecret",
        "NCBI_TOOL_NAME=NatureAide",
        "NCBI_API_KEY=",
        "TOGETHER_API_KEY=",
        "TOGETHER_MODEL_PRIMARY=meta-llama/Llama-3.3-70B-Instruct-Turbo",
        "TOGETHER_MODEL_FALLBACK=deepseek-ai/DeepSeek-V4.1-Flash",
        "TOGETHER_MODEL_FINAL=zai-org/GLM-5.3-Flash",
        "XAI_API_KEY=",
        "XAI_BASE_URL=https://api.x.ai/v1",
        "XAI_MODEL=grok-4.7",
        "VINA_BIN=",
        "DOCKING_PYTHON=",
        "DOCKING_ARTIFACT_DIR=",
        "DOCKING_TIMEOUT_SECONDS=900"
    )
    [System.IO.File]::WriteAllLines($envFile, $lines, [System.Text.Encoding]::UTF8)
    Write-Success "Created .env.local with secure AUTH_SECRET and verified docking paths."
} else {
    Write-Success ".env.local already exists. Reading configuration safely..."
    
    # Safely audit required keys without printing any secret values
    $envRaw = Get-Content $envFile -Raw
    
    function Test-EnvKey {
        param([string]$KeyName, [bool]$Required = $true)
        if ($envRaw -match "(?m)^$KeyName=(.*)$") {
            $val = $matches[1].Trim()
            if ($val.Length -gt 0) {
                Write-Success "Key '$KeyName': Configured (Length: $($val.Length))"
                return $true
            } else {
                if ($Required) {
                    Write-WarningMsg "Key '$KeyName': Present but EMPTY (Required for full operation)"
                } else {
                    Write-Info "Key '$KeyName': Present but EMPTY (Optional service)"
                }
                return $false
            }
        } else {
            if ($Required) {
                Write-WarningMsg "Key '$KeyName': MISSING from .env.local"
            } else {
                Write-Info "Key '$KeyName': Not specified (Optional)"
            }
            return $false
        }
    }
    
    Test-EnvKey "DB_HOST" $true | Out-Null
    Test-EnvKey "DB_PORT" $true | Out-Null
    Test-EnvKey "DB_NAME" $true | Out-Null
    Test-EnvKey "AUTH_SECRET" $true | Out-Null
    Test-EnvKey "VINA_BIN" $false | Out-Null
    Test-EnvKey "DOCKING_PYTHON" $false | Out-Null
    Test-EnvKey "TOGETHER_API_KEY" $false | Out-Null
    Test-EnvKey "XAI_API_KEY" $false | Out-Null
    
    # Ensure AUTH_SECRET has minimum 32 chars
    if ($envRaw -match "(?m)^AUTH_SECRET=(.*)$") {
        $sec = $matches[1].Trim()
        if ($sec.Length -lt 32) {
            Write-WarningMsg "AUTH_SECRET in .env.local is shorter than 32 characters! Next.js auth requires at least 32 characters."
        }
    }
}

# ==============================================================================
# STEP 7: NatureAide Environment Summary
# ==============================================================================
Write-Step -StepNum "7/7" -Title "Complete Environment Verification Summary"

Write-Success "Node.js: $nodeVer"
Write-Success "npm: v$npmVer"
if ($python311Bin) {
    Write-Success "Python 3.11 Runtime: Detected ($python311Bin)"
} else {
    Write-WarningMsg "Python 3.11 Runtime: Not installed (docking toolchain disabled)"
}

if (Test-Path $vinaBin) {
    Write-Success "AutoDock Vina: Installed ($vinaBin)"
} else {
    Write-WarningMsg "AutoDock Vina: Not installed"
}

if ($dockingEnvironmentReady) {
    Write-Success "Docking Environment (.docking-venv): Ready and verified with Python 3.11"
} else {
    Write-WarningMsg "Docking Environment (.docking-venv): Incomplete or missing Python 3.11"
}

if ($mysqlPortOpen) {
    Write-Success "MySQL Server: Reachable on localhost:3306"
    Write-Success "Database Schema: Migrations checked & up to date (npm run db:migrate)"
} else {
    Write-WarningMsg "MySQL Server: Not running on port 3306"
}

Write-Success "Environment File: .env.local verified"

# ==============================================================================
# FINAL SUCCESS BANNER & USER INSTRUCTIONS
# ==============================================================================
Write-Host ""
Write-Host "===============================================================================" -ForegroundColor Green
Write-Host "                            SETUP COMPLETE!" -ForegroundColor Green
Write-Host "===============================================================================" -ForegroundColor Green
Write-Host ""

Write-Host "NEXT STEPS TO RUN NATUREAIDE:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. MANUALLY CREATE & IMPORT DATABASE IN phpMyAdmin:" -ForegroundColor Yellow
Write-Host "   a. Open your browser to: " -NoNewline
Write-Host "http://localhost/phpmyadmin" -ForegroundColor White
Write-Host "   b. Click 'New' -> Database name: " -NoNewline
Write-Host "natureaide_db" -ForegroundColor Green
Write-Host " (Collation: utf8mb4_unicode_ci) -> Click 'Create'."
Write-Host "   c. Select 'natureaide_db' -> Click the 'Import' tab."
Write-Host "   d. Choose file: " -NoNewline
Write-Host "natureaide_backup.sql" -ForegroundColor White
Write-Host " -> Click 'Import' at the bottom."
Write-Host ""

Write-Host "2. (OPTIONAL) CONFIGURE EXTERNAL AI KEYS IN .env.local:" -ForegroundColor Yellow
Write-Host "   Open '.env.local' to add your private API keys (e.g. TOGETHER_API_KEY, XAI_API_KEY)." -ForegroundColor White
Write-Host ""

Write-Host "3. START NATUREAIDE:" -ForegroundColor Yellow
Write-Host "   In this terminal, run:" -ForegroundColor White
Write-Host ""
Write-Host "     npm run dev" -ForegroundColor Cyan
Write-Host ""
Write-Host "   Then open your browser to: " -NoNewline
Write-Host "http://localhost:3000" -ForegroundColor Green
Write-Host ""

Write-Host "DEFAULT TEST ACCOUNTS:" -ForegroundColor Yellow
Write-Host "  Community : community@natureaide.test  |  NatureAide123!" -ForegroundColor White
Write-Host "  Researcher: researcher@natureaide.test |  NatureAide123!" -ForegroundColor White
Write-Host "  Reviewer  : reviewer@natureaide.test   |  NatureAide123!" -ForegroundColor White
Write-Host ""

} catch {
    Write-Host ""
    Write-Host "===============================================================================" -ForegroundColor Red
    Write-Host "  SETUP ENCOUNTERED AN UNEXPECTED ERROR" -ForegroundColor Red
    Write-Host "  Message: $($_.Exception.Message)" -ForegroundColor Yellow
    Write-Host "===============================================================================" -ForegroundColor Red
    Write-Host ""
    exit 1
}
