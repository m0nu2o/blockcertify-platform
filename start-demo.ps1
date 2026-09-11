<#
  BlockCertify - one-shot local demo setup
  =========================================

  What this does, in order:
    1. Checks that Node.js is installed.
    2. Creates .env / .env.local files from the .env.example templates if
       they don't exist yet, and fills in safe local-demo defaults.
    3. Checks that MongoDB is reachable on localhost:27017 (stops with
       instructions if it isn't -- this script does not install MongoDB
       for you).
    4. Installs npm dependencies if needed.
    5. Starts a local Hardhat blockchain in its own window (if one isn't
       already running).
    6. Deploys the BlockCertifyRegistry smart contract to it and writes the
       deployed address into server/.env and client/.env.local.
    7. Resets and reseeds the database with demo accounts + one sample
       certificate.
    8. Starts the website + API (npm run dev) in this window.

  You can close everything and re-run this script any time you want a
  clean demo state -- it always redeploys the contract and reseeds the
  database, since the local blockchain forgets everything when its
  window is closed.

  Usage (from PowerShell, in this folder):
    .\start-demo.ps1
#>

$ErrorActionPreference = 'Stop'
$RepoRoot = $PSScriptRoot
Set-Location $RepoRoot

function Write-Step($message) {
  Write-Host ""
  Write-Host "==> $message" -ForegroundColor Cyan
}

function Write-Info($message) {
  Write-Host "    $message" -ForegroundColor Gray
}

function Write-Warn($message) {
  Write-Host "    $message" -ForegroundColor Yellow
}

function Test-Port($portNumber) {
  try {
    $result = Test-NetConnection -ComputerName '127.0.0.1' -Port $portNumber -WarningAction SilentlyContinue
    return $result.TcpTestSucceeded
  } catch {
    return $false
  }
}

function Ensure-EnvFile($directory, $exampleName, $targetName) {
  $examplePath = Join-Path $directory $exampleName
  $targetPath = Join-Path $directory $targetName
  if (-not (Test-Path $targetPath)) {
    Copy-Item $examplePath $targetPath
    Write-Info "Created $(Join-Path (Split-Path $directory -Leaf) $targetName)"
  }
  return $targetPath
}

function New-RandomSecret {
  $bytes = New-Object byte[] 32
  [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
  return -join ($bytes | ForEach-Object { $_.ToString('x2') })
}

function Set-EnvValue($path, $key, $value) {
  $content = Get-Content $path -Raw
  $pattern = "(?m)^$key=.*$"
  $line = "$key=$value"
  if ($content -match $pattern) {
    $content = $content -replace $pattern, $line
  } else {
    $content = $content.TrimEnd() + "`r`n$line`r`n"
  }
  Set-Content -Path $path -Value $content -NoNewline
}

function Get-EnvValue($path, $key) {
  $content = Get-Content $path -Raw
  if ($content -match "(?m)^$key=(.*)$") {
    return $matches[1].Trim()
  }
  return ''
}

# ---------------------------------------------------------------------------
Write-Step "Checking prerequisites"

$node = Get-Command node -ErrorAction SilentlyContinue
if (-not $node) {
  Write-Warn "Node.js was not found on your PATH."
  Write-Warn "Install the LTS version from https://nodejs.org, then re-run this script."
  exit 1
}
Write-Info "Node.js found: $(node -v)"

# ---------------------------------------------------------------------------
Write-Step "Setting up environment files"

$clientEnvPath = Ensure-EnvFile (Join-Path $RepoRoot 'client') '.env.example' '.env.local'
$serverEnvPath = Ensure-EnvFile (Join-Path $RepoRoot 'server') '.env.example' '.env'
Ensure-EnvFile (Join-Path $RepoRoot 'contracts') '.env.example' '.env' | Out-Null
Ensure-EnvFile $RepoRoot '.env.example' '.env' | Out-Null

foreach ($secretKey in @('JWT_SECRET', 'NEXTAUTH_SECRET')) {
  $current = Get-EnvValue $serverEnvPath $secretKey
  if ([string]::IsNullOrWhiteSpace($current) -or $current -eq 'replace_with_long_random_secret') {
    Set-EnvValue $serverEnvPath $secretKey (New-RandomSecret)
    Write-Info "Generated a random server $secretKey"
  }
}

$clientSecret = Get-EnvValue $clientEnvPath 'NEXTAUTH_SECRET'
if ([string]::IsNullOrWhiteSpace($clientSecret) -or $clientSecret -eq 'replace_with_long_random_secret') {
  Set-EnvValue $clientEnvPath 'NEXTAUTH_SECRET' (New-RandomSecret)
  Write-Info "Generated a random client NEXTAUTH_SECRET"
}

# ---------------------------------------------------------------------------
Write-Step "Checking MongoDB (needed on localhost:27017)"

if (-not (Test-Port 27017)) {
  Write-Warn "MongoDB does not appear to be running on localhost:27017."
  Write-Warn ""
  Write-Warn "Pick ONE of the following, then re-run this script:"
  Write-Warn "  - Docker Desktop installed:  docker run -d --name blockcertify-mongo -p 27017:27017 mongo:7"
  Write-Warn "  - No Docker:                 install MongoDB Community Server (mongodb.com/try/download/community)"
  Write-Warn "  - Prefer the cloud:          create a free MongoDB Atlas cluster and paste its connection"
  Write-Warn "                               string into MONGODB_URI in server\.env"
  Write-Warn ""
  Write-Warn "See DEMO_GUIDE.md for step-by-step instructions."
  exit 1
}
Write-Info "MongoDB is reachable."

# ---------------------------------------------------------------------------
Write-Step "Installing dependencies (first run only, this can take a few minutes)"

if (-not (Test-Path (Join-Path $RepoRoot 'node_modules'))) {
  npm install
} else {
  Write-Info "node_modules already present, skipping npm install."
}

# ---------------------------------------------------------------------------
Write-Step "Starting the local blockchain (Hardhat node)"

if (Test-Port 8545) {
  Write-Info "A blockchain node is already running on port 8545 -- reusing it."
} else {
  $contractsDir = Join-Path $RepoRoot 'contracts'
  Start-Process powershell -ArgumentList @(
    '-NoExit', '-Command',
    "cd '$contractsDir'; Write-Host 'BlockCertify local blockchain -- keep this window open during the demo' -ForegroundColor Magenta; npx hardhat node"
  )

  Write-Info "Waiting for the blockchain node to come online..."
  $attempts = 0
  while (-not (Test-Port 8545) -and $attempts -lt 30) {
    Start-Sleep -Seconds 1
    $attempts++
  }
  if (-not (Test-Port 8545)) {
    Write-Warn "The blockchain node did not come online in time. Check the new window it opened for errors."
    exit 1
  }
  Write-Info "Blockchain node is up."
}

# ---------------------------------------------------------------------------
Write-Step "Deploying the BlockCertifyRegistry contract"

$deployOutput = npm run deploy:local --workspace contracts 2>&1 | Out-String
Write-Host $deployOutput
if ($deployOutput -match '0x[a-fA-F0-9]{40}') {
  $contractAddress = $matches[0]
  Write-Info "Deployed to $contractAddress"
} else {
  Write-Warn "Could not find a deployed contract address in the output above."
  exit 1
}

Set-EnvValue $serverEnvPath 'ETH_CONTRACT_ADDRESS' $contractAddress
Set-EnvValue $clientEnvPath 'NEXT_PUBLIC_CONTRACT_ADDRESS' $contractAddress
Write-Info "Saved the contract address to server\.env and client\.env.local"

# ---------------------------------------------------------------------------
Write-Step "Resetting and seeding the database"

npm run seed --workspace server

# ---------------------------------------------------------------------------
Write-Step "All set. Starting the website and API"
Write-Host ""
Write-Host "  Frontend:        http://localhost:3000" -ForegroundColor Green
Write-Host "  API:             http://localhost:5000" -ForegroundColor Green
Write-Host ""
Write-Host "  Admin login:       admin@blockcertify.com / Admin@12345" -ForegroundColor Green
Write-Host "  Institution login: registrar@futureuniversity.edu / Welcome@123" -ForegroundColor Green
Write-Host "  Student login:     student@blockcertify.com / Welcome@123" -ForegroundColor Green
Write-Host ""
Write-Host "  Press Ctrl+C in this window to stop the website and API." -ForegroundColor Gray
Write-Host "  The blockchain window is separate -- close it only when you're fully done." -ForegroundColor Gray
Write-Host ""

npm run dev
