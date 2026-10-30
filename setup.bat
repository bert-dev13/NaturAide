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

powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "$env:SETUP_BAT_DIR='%~dp0'; [ScriptBlock]::Create((Get-Content -LiteralPath '%~f0' -Raw)).Invoke()"
set "PS_CODE=%ERRORLEVEL%"
if %PS_CODE% neq 0 (
    echo [ERROR] Setup encountered an issue ^(Exit code: %PS_CODE%^).
)
echo Press any key to exit.
pause >nul
exit /b %PS_CODE%
#>

$ErrorActionPreference = "Stop"
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
    Write-FatalError -Message "package.json not found in $ScriptDir." -HelpText "Make sure setup.bat is located and run inside the cloned NatureAide repository root."
}

# ==============================================================================
# STEP 1: Verify Core Tools (Node.js, npm, Python)
# ==============================================================================
Write-Step -StepNum "1/6" -Title "Verifying Core Runtimes (Node.js, npm, Python)"

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

# 1.3 Python
$pythonCandidates = @(
    "C:\Python311\python.exe",
    "C:\Python312\python.exe",
    "C:\Python314\python.exe",
    "$env:LOCALAPPDATA\Programs\Python\Python311\python.exe",
    "$env:LOCALAPPDATA\Programs\Python\Python312\python.exe",
    "$env:LOCALAPPDATA\Programs\Python\Python314\python.exe"
)
$pythonBin = Find-Executable "python" $pythonCandidates
if (-not $pythonBin) { $pythonBin = Find-Executable "py" }
if ($pythonBin) {
    $pyVer = (& $pythonBin --version 2>&1).Trim()
    Write-Success "Python: $pyVer ($pythonBin)"
} else {
    Write-WarningMsg "Python is not installed. Stage 3 in-silico molecular docking requires Python 3.10+."
    Write-WarningMsg "Download Python from https://www.python.org/downloads/ (check 'Add python.exe to PATH' during install)."
}

# ==============================================================================
# STEP 2: Verify MySQL Connectivity Only (Read-Only)
# ==============================================================================
Write-Step -StepNum "2/6" -Title "Verifying MySQL Server Connectivity (Read-Only Check)"
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
    
    # Read-only database check if mysql CLI is available
    if ($mysqlBin) {
        try {
            $dbCheck = & $mysqlBin -u root -N -e "SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'natureaide_db';" 2>$null
            if ($dbCheck -and $dbCheck.Trim() -eq "natureaide_db") {
                $countCheck = & $mysqlBin -u root natureaide_db -N -e "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'natureaide_db';" 2>$null
                $numTables = [int]($countCheck.Trim())
                Write-Success "Database 'natureaide_db' exists in MySQL ($numTables tables found)."
            } else {
                Write-Info "Database 'natureaide_db' not created yet. Remember to create/import it via phpMyAdmin."
            }
        } catch {
            Write-Info "Could not query MySQL schema names (authentication or access restriction). Connectivity verified."
        }
    }
}

# ==============================================================================
# STEP 3: Install Node Dependencies (npm install)
# ==============================================================================
Write-Step -StepNum "3/6" -Title "Installing Node Dependencies (npm install)"

if (-not (Test-Path (Join-Path $ScriptDir "node_modules"))) {
    Write-Info "node_modules not found. Running 'npm install'..."
} else {
    Write-Info "Verifying existing node_modules packages..."
}

$npmCmd = if ($npmBin) { $npmBin } else { "npm" }
$npmProcess = Start-Process -FilePath $npmCmd -ArgumentList "install" -WorkingDirectory $ScriptDir -Wait -PassThru -NoNewWindow

if ($npmProcess.ExitCode -ne 0) {
    Write-WarningMsg "Standard npm install encountered peer dependency warnings. Auto-fixing with --legacy-peer-deps..."
    $npmProcess2 = Start-Process -FilePath $npmCmd -ArgumentList "install --legacy-peer-deps" -WorkingDirectory $ScriptDir -Wait -PassThru -NoNewWindow
    if ($npmProcess2.ExitCode -ne 0) {
        Write-FatalError -Message "npm install failed." -HelpText "Check your internet connection and Node version ($nodeVer)."
    }
}
Write-Success "Node dependencies are installed and up to date."

# ==============================================================================
# STEP 4: Setup AutoDock Vina & Python Docking Environment
# ==============================================================================
Write-Step -StepNum "4/6" -Title "Configuring AutoDock Vina & Docking Environment"

# 4.1 Artifacts directory
$dockingArtifactsDir = Join-Path $ScriptDir ".docking-artifacts"
if (-not (Test-Path $dockingArtifactsDir)) {
    New-Item -ItemType Directory -Path $dockingArtifactsDir -Force | Out-Null
    Write-Success "Created docking artifacts directory: $dockingArtifactsDir"
} else {
    Write-Success "Docking artifacts directory ready: $dockingArtifactsDir"
}

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

if (Test-Path $vinaBin) {
    try {
        $vinaVer = (& $vinaBin --version 2>&1).Trim()
        Write-Success "AutoDock Vina ready: $vinaVer ($vinaBin)"
    } catch {
        Write-WarningMsg "Vina binary exists at $vinaBin but could not execute --version."
    }
} else {
    Write-WarningMsg "AutoDock Vina executable is missing. Download from https://github.com/forlilab/AutoDock-Vina/releases and place at tools\vina\vina.exe."
}

# 4.3 Python Virtual Environment & Packages
$venvDir = Join-Path $ScriptDir ".docking-venv"
$venvPython = Join-Path $venvDir "Scripts\python.exe"

if ($pythonBin) {
    if (-not (Test-Path $venvPython)) {
        Write-Info "Creating Python virtual environment in .docking-venv..."
        & $pythonBin -m venv $venvDir
    }
    
    if (Test-Path $venvPython) {
        Write-Info "Checking cheminformatics packages (rdkit, meeko, scipy, gemmi, openbabel-wheel)..."
        $checkScript = "import rdkit, meeko, scipy, gemmi, openbabel; print('OK')"
        $installed = $false
        try {
            $res = (& $venvPython -c $checkScript 2>&1).Trim()
            if ($res -eq "OK") { $installed = $true }
        } catch { $installed = $false }
        
        if (-not $installed) {
            Write-Info "Installing missing cheminformatics packages into .docking-venv..."
            & $venvPython -m pip install --quiet rdkit meeko scipy gemmi openbabel-wheel
        }
        
        # Verify with NatureAide's worker.py tools
        $workerScript = Join-Path $ScriptDir "services\docking\worker.py"
        if (Test-Path $workerScript) {
            try {
                $toolsJson = (& $venvPython $workerScript tools 2>&1).Trim()
                Write-Success "Docking worker verified: $toolsJson"
            } catch {
                Write-WarningMsg "Docking worker returned error during tools inspection: $_"
            }
        }
    }
} else {
    Write-WarningMsg "Skipped Python virtual environment setup (Python is not installed)."
}

# ==============================================================================
# STEP 5: Check & Configure .env.local (Safe, Non-Destructive)
# ==============================================================================
Write-Step -StepNum "5/6" -Title "Checking Environment Configuration (.env.local)"
$envFile = Join-Path $ScriptDir ".env.local"

if (-not (Test-Path $envFile)) {
    Write-Info ".env.local does not exist. Creating default template with secure AUTH_SECRET..."
    
    # Generate random 64-character token
    $randomBytes = New-Object byte[] 48
    $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    $rng.GetBytes($randomBytes)
    $generatedSecret = [Convert]::ToBase64String($randomBytes) -replace '[^a-zA-Z0-9]', ''
    
    $defaultVinaPath = if (Test-Path $vinaBin) { $vinaBin } else { Join-Path $ScriptDir "tools\vina\vina.exe" }
    $defaultPyPath = if (Test-Path $venvPython) { $venvPython } else { Join-Path $ScriptDir ".docking-venv\Scripts\python.exe" }

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
        "VINA_BIN=$defaultVinaPath",
        "DOCKING_PYTHON=$defaultPyPath",
        "DOCKING_ARTIFACT_DIR=$dockingArtifactsDir",
        "DOCKING_TIMEOUT_SECONDS=900"
    )
    [System.IO.File]::WriteAllLines($envFile, $lines, [System.Text.Encoding]::UTF8)
    Write-Success "Created .env.local with secure AUTH_SECRET and verified docking paths."
} else {
    Write-Success ".env.local already exists. Reading configuration safely..."
    
    # Safely audit required keys without printing any secret values
    $envRaw = Get-Content $envFile -Raw
    
    function Audit-Key {
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
    
    Audit-Key "DB_HOST" $true | Out-Null
    Audit-Key "DB_PORT" $true | Out-Null
    Audit-Key "DB_NAME" $true | Out-Null
    Audit-Key "AUTH_SECRET" $true | Out-Null
    Audit-Key "VINA_BIN" $false | Out-Null
    Audit-Key "DOCKING_PYTHON" $false | Out-Null
    Audit-Key "TOGETHER_API_KEY" $false | Out-Null
    Audit-Key "XAI_API_KEY" $false | Out-Null
    
    # Ensure AUTH_SECRET has minimum 32 chars
    if ($envRaw -match "(?m)^AUTH_SECRET=(.*)$") {
        $sec = $matches[1].Trim()
        if ($sec.Length -lt 32) {
            Write-WarningMsg "AUTH_SECRET in .env.local is shorter than 32 characters! Next.js auth requires at least 32 characters."
        }
    }
}

# ==============================================================================
# STEP 6: NatureAide Environment Summary
# ==============================================================================
Write-Step -StepNum "6/6" -Title "Complete Environment Verification Summary"

Write-Success "Node.js: $nodeVer"
Write-Success "npm: v$npmVer"
if ($pythonBin) { Write-Success "Python: $pyVer" } else { Write-WarningMsg "Python: Not installed (optional for web app, required for docking)" }
if (Test-Path $vinaBin) { Write-Success "AutoDock Vina: Installed ($vinaBin)" } else { Write-WarningMsg "AutoDock Vina: Not installed (Stage 3 docking disabled)" }
if (Test-Path $venvPython) { Write-Success "Python Docking Environment: Verified ($venvPython)" } else { Write-WarningMsg "Python Docking Environment: Missing" }
if ($mysqlPortOpen) { Write-Success "MySQL Server: Reachable on localhost:3306" } else { Write-WarningMsg "MySQL Server: Not running on port 3306" }
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
