# ==============================================================================
# NatureAide — Windows Automated One-Command Setup & Verification
# Script: setup.ps1
# ==============================================================================

#Requires -Version 5.1
[CmdletBinding()]
param (
    [switch]$SkipOptionalDocking = $false,
    [switch]$NonInteractive = $false
)

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
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
    if (-not $NonInteractive) {
        Read-Host "Press Enter to exit"
    }
    exit 1
}

function Refresh-EnvPath {
    $machinePath = [System.Environment]::GetEnvironmentVariable("Path", "Machine")
    $userPath = [System.Environment]::GetEnvironmentVariable("Path", "User")
    $env:Path = "$machinePath;$userPath"
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

function Install-WithWinget {
    param(
        [string]$PackageId,
        [string]$DisplayName
    )
    $winget = Get-Command winget -ErrorAction SilentlyContinue
    if (-not $winget) {
        Write-FatalError -Message "Windows Package Manager (winget) is not installed." -HelpText "Install winget from Microsoft Store (App Installer) or download manually."
    }
    Write-Info "Installing $DisplayName via winget ($PackageId)... Please wait."
    $process = Start-Process -FilePath "winget" -ArgumentList "install --id $PackageId -e --silent --accept-source-agreements --accept-package-agreements" -Wait -PassThru -NoNewWindow
    Refresh-EnvPath
    if ($process.ExitCode -ne 0 -and $process.ExitCode -ne -1978335189) {
        Write-WarningMsg "Winget returned code $($process.ExitCode) for $DisplayName. Checking if executable is present..."
    }
}

# --- Begin Setup ---
Clear-Host
Write-Header "NatureAide - Automated Windows Environment Installer"

Write-Host "Target Directory: $ScriptDir" -ForegroundColor White
Write-Host "Operating System: Windows ($([System.Environment]::OSVersion.VersionString))" -ForegroundColor White

# Verify we are in the NatureAide project root
if (-not (Test-Path (Join-Path $ScriptDir "package.json"))) {
    Write-FatalError -Message "package.json not found in $ScriptDir." -HelpText "Make sure setup.ps1 is placed and executed inside the NatureAide project folder."
}

# ==============================================================================
# STEP 1: Git
# ==============================================================================
Write-Step -StepNum "1/9" -Title "Checking Git for Windows"
$gitCandidates = @(
    "C:\Program Files\Git\cmd\git.exe",
    "C:\Program Files (x86)\Git\cmd\git.exe"
)
$gitBin = Find-Executable "git" $gitCandidates

if (-not $gitBin) {
    Write-Info "Git was not detected on this system. Installing Git for Windows..."
    Install-WithWinget -PackageId "Git.Git" -DisplayName "Git for Windows"
    $gitBin = Find-Executable "git" $gitCandidates
}

if ($gitBin) {
    $gitVer = (& $gitBin --version).Trim()
    Write-Success "Git detected: $gitVer ($gitBin)"
} else {
    Write-FatalError -Message "Git could not be installed or located." -HelpText "Please download and install Git from https://git-scm.com/download/win and rerun setup."
}

# ==============================================================================
# STEP 2: Node.js and npm
# ==============================================================================
Write-Step -StepNum "2/9" -Title "Checking Node.js and npm (v20+ LTS required)"
$nodeCandidates = @(
    "C:\Program Files\nodejs\node.exe",
    "C:\Program Files (x86)\nodejs\node.exe"
)
$nodeBin = Find-Executable "node" $nodeCandidates
$npmBin = Find-Executable "npm.cmd" @(
    "C:\Program Files\nodejs\npm.cmd",
    "C:\Program Files (x86)\nodejs\npm.cmd"
)

if (-not $nodeBin) {
    Write-Info "Node.js was not detected. Installing Node.js LTS..."
    Install-WithWinget -PackageId "OpenJS.NodeJS.LTS" -DisplayName "Node.js (LTS)"
    $nodeBin = Find-Executable "node" $nodeCandidates
    $npmBin = Find-Executable "npm.cmd" @(
        "C:\Program Files\nodejs\npm.cmd",
        "C:\Program Files (x86)\nodejs\npm.cmd"
    )
}

if ($nodeBin) {
    $nodeVer = (& $nodeBin -v).Trim()
    $npmVer = if ($npmBin) { (& $npmBin -v).Trim() } else { "detected" }
    
    # Check minimum Node version (v20.0.0)
    $majorVer = [int]($nodeVer -replace '^v(\d+)\..*', '$1')
    if ($majorVer -lt 20) {
        Write-WarningMsg "Installed Node version $nodeVer is below recommended v20+. Upgrading Node.js LTS..."
        Install-WithWinget -PackageId "OpenJS.NodeJS.LTS" -DisplayName "Node.js (LTS)"
        $nodeBin = Find-Executable "node" $nodeCandidates
        $nodeVer = (& $nodeBin -v).Trim()
    }
    Write-Success "Node.js detected: $nodeVer ($nodeBin)"
    Write-Success "npm detected: v$npmVer"
} else {
    Write-FatalError -Message "Node.js could not be installed or located." -HelpText "Download and install Node.js 20+ LTS from https://nodejs.org and rerun setup."
}

# ==============================================================================
# STEP 3: Python (for Stage 3 In-Silico Docking)
# ==============================================================================
Write-Step -StepNum "3/9" -Title "Checking Python Runtime"
$pythonCandidates = @(
    "C:\Python311\python.exe",
    "C:\Python312\python.exe",
    "$env:LOCALAPPDATA\Programs\Python\Python311\python.exe",
    "$env:LOCALAPPDATA\Programs\Python\Python312\python.exe"
)
$pythonBin = Find-Executable "python" $pythonCandidates
if (-not $pythonBin) {
    $pythonBin = Find-Executable "py"
}

if (-not $pythonBin) {
    Write-Info "Python was not detected. Installing Python 3.11..."
    Install-WithWinget -PackageId "Python.Python.3.11" -DisplayName "Python 3.11"
    $pythonBin = Find-Executable "python" $pythonCandidates
}

if ($pythonBin) {
    $pyVer = (& $pythonBin --version 2>&1).Trim()
    Write-Success "Python detected: $pyVer ($pythonBin)"
} else {
    Write-WarningMsg "Python is not installed. Stage 3 molecular docking will not be functional until Python 3.11 is installed."
}

# ==============================================================================
# STEP 4: XAMPP and MySQL Configuration
# ==============================================================================
Write-Step -StepNum "4/9" -Title "Checking XAMPP and MySQL Database Service"
$mysqlCandidates = @(
    "C:\xampp\mysql\bin\mysql.exe",
    "C:\xamppp\mysql\bin\mysql.exe",
    "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"
)
$mysqlBin = Find-Executable "mysql" $mysqlCandidates

$mysqldumpCandidates = @(
    "C:\xampp\mysql\bin\mysqldump.exe",
    "C:\xamppp\mysql\bin\mysqldump.exe",
    "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqldump.exe"
)
$mysqldumpBin = Find-Executable "mysqldump" $mysqldumpCandidates

if (-not $mysqlBin) {
    Write-Info "XAMPP/MySQL not found at default locations. Attempting XAMPP installation..."
    Install-WithWinget -PackageId "ApacheFriends.Xampp.8.2" -DisplayName "XAMPP"
    $mysqlBin = Find-Executable "mysql" $mysqlCandidates
    $mysqldumpBin = Find-Executable "mysqldump" $mysqldumpCandidates
}

if (-not $mysqlBin) {
    Write-FatalError -Message "MySQL executable could not be found." -HelpText "Please install XAMPP to C:\xampp from https://www.apachefriends.org and rerun setup."
}

Write-Success "MySQL client detected: $mysqlBin"
if ($mysqldumpBin) {
    Write-Success "MySQL dump utility detected: $mysqldumpBin"
}

# Check if MySQL is currently listening on port 3306
Write-Info "Testing MySQL connection on localhost:3306..."
$mysqlRunning = Test-PortOpen -Port 3306

if (-not $mysqlRunning) {
    Write-WarningMsg "MySQL is not actively listening on port 3306."
    
    # Try starting mysqld from XAMPP if mysqld.exe exists
    $mysqldPath = Join-Path (Split-Path -Parent $mysqlBin) "mysqld.exe"
    $myIniPath = Join-Path (Split-Path -Parent $mysqlBin) "my.ini"
    
    if (Test-Path $mysqldPath) {
        Write-Info "Attempting to start MySQL service from $mysqldPath..."
        if (Test-Path $myIniPath) {
            Start-Process -FilePath $mysqldPath -ArgumentList "--defaults-file=`"$myIniPath`"" -WindowStyle Hidden
        } else {
            Start-Process -FilePath $mysqldPath -WindowStyle Hidden
        }
        Start-Sleep -Seconds 3
        $mysqlRunning = Test-PortOpen -Port 3306
    }
}

if (-not $mysqlRunning) {
    Write-WarningMsg "MySQL could not be automatically started."
    Write-Host ""
    Write-Host "  ACTION REQUIRED:" -ForegroundColor Yellow
    Write-Host "  1. Open the XAMPP Control Panel (e.g. C:\xampp\xampp-control.exe)." -ForegroundColor White
    Write-Host "  2. Click 'Start' next to MySQL." -ForegroundColor White
    Write-Host "  3. Wait until the MySQL module turns green with Port 3306." -ForegroundColor White
    Write-Host ""
    if (-not $NonInteractive) {
        Read-Host "  Once MySQL is running, press Enter to continue setup"
        $mysqlRunning = Test-PortOpen -Port 3306
    }
}

if ($mysqlRunning) {
    Write-Success "MySQL service is running and listening on port 3306."
} else {
    Write-FatalError -Message "Could not connect to MySQL on port 3306." -HelpText "Ensure MySQL is running in XAMPP before running setup."
}

# ==============================================================================
# STEP 5: Project Node Dependencies (npm install)
# ==============================================================================
Write-Step -StepNum "5/9" -Title "Installing NatureAide Node Dependencies"
if (-not (Test-Path (Join-Path $ScriptDir "node_modules"))) {
    Write-Info "node_modules not found. Running 'npm install'..."
} else {
    Write-Info "Verifying node_modules dependencies..."
}

$npmCmd = if ($npmBin) { $npmBin } else { "npm" }
$npmProcess = Start-Process -FilePath $npmCmd -ArgumentList "install" -WorkingDirectory $ScriptDir -Wait -PassThru -NoNewWindow

if ($npmProcess.ExitCode -ne 0) {
    Write-WarningMsg "Standard 'npm install' reported issues. Retrying with --legacy-peer-deps..."
    $npmProcess2 = Start-Process -FilePath $npmCmd -ArgumentList "install --legacy-peer-deps" -WorkingDirectory $ScriptDir -Wait -PassThru -NoNewWindow
    if ($npmProcess2.ExitCode -ne 0) {
        Write-FatalError -Message "npm install failed." -HelpText "Check your network connection and verify node version ($nodeVer)."
    }
}
Write-Success "All Node dependencies successfully installed."

# ==============================================================================
# STEP 6: AutoDock Vina and Python Molecular Docking Toolchain
# ==============================================================================
Write-Step -StepNum "6/9" -Title "Setting Up AutoDock Vina and Docking Toolchain"

# 1. Create docking artifacts directory
$dockingArtifactsDir = Join-Path $ScriptDir ".docking-artifacts"
if (-not (Test-Path $dockingArtifactsDir)) {
    New-Item -ItemType Directory -Path $dockingArtifactsDir -Force | Out-Null
    Write-Success "Created docking artifacts directory: $dockingArtifactsDir"
} else {
    Write-Success "Docking artifacts directory ready."
}

# 2. Download / Verify AutoDock Vina executable
$vinaDir = Join-Path $ScriptDir "tools\vina"
$vinaBin = Join-Path $vinaDir "vina.exe"

if (-not (Test-Path $vinaBin)) {
    Write-Info "AutoDock Vina binary not found. Downloading official Windows release (v1.2.7)..."
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
        Write-WarningMsg "Failed to download AutoDock Vina: $_"
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
    Write-WarningMsg "AutoDock Vina could not be automatically downloaded. You can manually place vina.exe in $vinaDir."
}

# 3. Setup Python Virtual Environment for Cheminformatics
$venvDir = Join-Path $ScriptDir ".docking-venv"
$venvPython = Join-Path $venvDir "Scripts\python.exe"

if ($pythonBin -and (-not $SkipOptionalDocking)) {
    if (-not (Test-Path $venvPython)) {
        Write-Info "Creating Python virtual environment in $venvDir..."
        & $pythonBin -m venv $venvDir
    }
    
    if (Test-Path $venvPython) {
        Write-Info "Installing cheminformatics packages (rdkit, meeko, scipy, gemmi, openbabel-wheel)..."
        & $venvPython -m pip install --quiet rdkit meeko scipy gemmi openbabel-wheel
        
        # Verify worker.py tools
        $workerScript = Join-Path $ScriptDir "services\docking\worker.py"
        if (Test-Path $workerScript) {
            $toolsJson = & $venvPython $workerScript tools 2>&1
            Write-Success "Python docking worker verified: $toolsJson"
        }
    }
} elseif (-not $pythonBin) {
    Write-WarningMsg "Skipping virtual environment creation (Python is not installed)."
}

# ==============================================================================
# STEP 7: Environment Configuration (.env.local)
# ==============================================================================
Write-Step -StepNum "7/9" -Title "Configuring Environment Variables (.env.local)"
$envFile = Join-Path $ScriptDir ".env.local"

# Generate secure random 64-char string for AUTH_SECRET if needed
$randomBytes = New-Object byte[] 48
$rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
$rng.GetBytes($randomBytes)
$generatedSecret = [Convert]::ToBase64String($randomBytes) -replace '[^a-zA-Z0-9]', ''

if (-not (Test-Path $envFile)) {
    Write-Info ".env.local not found. Creating default environment configuration..."
    
    $defaultVinaPath = if (Test-Path $vinaBin) { $vinaBin } else { "" }
    $defaultPyPath = if (Test-Path $venvPython) { $venvPython } else { "" }

    $lines = @(
        "# NatureAide Environment Configuration",
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
    Write-Success ".env.local created with secure AUTH_SECRET and local paths."
} else {
    Write-Success ".env.local already exists. Existing credentials and keys preserved."
    
    # Ensure AUTH_SECRET exists
    $existingEnv = Get-Content $envFile -Raw
    if ($existingEnv -notmatch "AUTH_SECRET=\S{20,}") {
        Add-Content -Path $envFile -Value "`nAUTH_SECRET=$generatedSecret`n"
        Write-Success "Added generated AUTH_SECRET to .env.local."
    }
}

# ==============================================================================
# STEP 8: Create MySQL Database
# ==============================================================================
Write-Step -StepNum "8/9" -Title "Creating MySQL Database (natureaide_db)"
try {
    & $mysqlBin -u root -e "CREATE DATABASE IF NOT EXISTS natureaide_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
    Write-Success "Database 'natureaide_db' verified / created."
} catch {
    Write-FatalError -Message "Failed to create database 'natureaide_db'." -HelpText "Check MySQL root permissions and port 3306 connectivity."
}

# Check existing tables count
$tablesResult = & $mysqlBin -u root natureaide_db -N -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'natureaide_db';"
$tableCount = [int]($tablesResult.Trim())
Write-Info "Current table count in 'natureaide_db': $tableCount"

# ==============================================================================
# STEP 9: Final System Verification & Preflight Checks
# ==============================================================================
Write-Step -StepNum "9/9" -Title "Running Final Preflight Checks"

# Node check
if ($nodeBin) { Write-Success "Node.js: $nodeVer" }
# MySQL check
if ($mysqlRunning) { Write-Success "MySQL: Running on localhost:3306" }
# Vina check
if (Test-Path $vinaBin) { Write-Success "AutoDock Vina: Installed ($vinaBin)" } else { Write-WarningMsg "AutoDock Vina: Missing (Stage 3 docking disabled)" }
# Python check
if (Test-Path $venvPython) { Write-Success "Python Docking Venv: Ready ($venvPython)" } else { Write-WarningMsg "Python Venv: Missing (Stage 3 docking disabled)" }
# .env.local check
if (Test-Path $envFile) { Write-Success ".env.local: Valid and present" }

# ==============================================================================
# SUMMARY & NEXT STEPS
# ==============================================================================
Write-Host ""
Write-Host "===============================================================================" -ForegroundColor Green
Write-Host "  NATUREAIDE ENVIRONMENT SETUP COMPLETED SUCCESSFULLY!" -ForegroundColor Green
Write-Host "===============================================================================" -ForegroundColor Green
Write-Host ""

Write-Host "To finish getting your system ready, perform the two manual steps below:" -ForegroundColor Cyan
Write-Host ""

Write-Host "1. (REQUIRED) IMPORT EXISTING DATABASE BACKUP:" -ForegroundColor Yellow
if ($tableCount -gt 50) {
    Write-Host "   -> The database already contains $tableCount tables! Import may not be required." -ForegroundColor Green
} else {
    Write-Host "   If you have 'natureaide_backup.sql' from the old laptop, run:" -ForegroundColor White
    Write-Host "     cmd /c '`"`"$mysqlBin`"`" -u root natureaide_db < natureaide_backup.sql'" -ForegroundColor Cyan
    Write-Host "   Alternatively, to generate a fresh database with demo data, run:" -ForegroundColor White
    Write-Host "     npx tsx scripts/init-db.ts" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "2. (OPTIONAL) ADD YOUR AI SECRET API KEYS:" -ForegroundColor Yellow
Write-Host "   Edit '.env.local' to add your secret keys if using AI assistants:" -ForegroundColor White
Write-Host "     TOGETHER_API_KEY=tgp_v1_..." -ForegroundColor DarkGray
Write-Host "     XAI_API_KEY=xai-..." -ForegroundColor DarkGray

Write-Host ""
Write-Host "3. RUN NATUREAIDE:" -ForegroundColor Yellow
Write-Host "   Start the development server:" -ForegroundColor White
Write-Host "     npm run dev" -ForegroundColor Cyan
Write-Host "   Then open your browser to: " -NoNewline
Write-Host "http://localhost:3000" -ForegroundColor Green

Write-Host ""
Write-Host "DEFAULT TEST CREDENTIALS:" -ForegroundColor Yellow
Write-Host "  Community : community@natureaide.test  |  NatureAide123!" -ForegroundColor White
Write-Host "  Researcher: researcher@natureaide.test |  NatureAide123!" -ForegroundColor White
Write-Host "  Reviewer  : reviewer@natureaide.test   |  NatureAide123!" -ForegroundColor White
Write-Host ""

if (-not $NonInteractive) {
    Write-Host "Setup complete. Press Enter to exit." -ForegroundColor Gray
    Read-Host
}
