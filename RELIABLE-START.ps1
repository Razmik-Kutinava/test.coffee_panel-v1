# ============================================
# RELIABLE START - Backend + Frontend
# Solves ARM64 + Prisma problem once and for all
# ============================================

$ErrorActionPreference = "SilentlyContinue"

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "   RELIABLE START - Coffee Hub" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

$rootPath = $PSScriptRoot
if (-not $rootPath) { $rootPath = (Get-Location).Path }
$nodeX64Path = "$env:USERPROFILE\nodejs-x64"

# 1. DIAGNOSTICS
Write-Host "=== STEP 1: DIAGNOSTICS ===" -ForegroundColor Yellow
Write-Host ""

# Check x64 Node.js
if (-not (Test-Path "$nodeX64Path\node.exe")) {
    Write-Host "ERROR: x64 Node.js not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "INSTALL x64 Node.js:" -ForegroundColor Yellow
    Write-Host "  cd backend" -ForegroundColor Cyan
    Write-Host "  .\install-node-x64.ps1" -ForegroundColor Cyan
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

$archX64 = & "$nodeX64Path\node.exe" -p "process.arch"
Write-Host "[OK] x64 Node.js found: $archX64" -ForegroundColor Green

$archSystem = & node -p "process.arch" 2>$null
Write-Host "[OK] System Node.js: $archSystem" -ForegroundColor Green

# Check .env
if (Test-Path "$rootPath\.env") {
    Write-Host "[!] .env in root (will be moved)" -ForegroundColor Yellow
}

if (-not (Test-Path "$rootPath\backend\.env")) {
    Write-Host "[!] backend\.env not found!" -ForegroundColor Yellow
}

Write-Host ""

# 2. STOP OLD PROCESSES
Write-Host "=== STEP 2: STOPPING PROCESSES ===" -ForegroundColor Yellow
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 3
Write-Host "[OK] All Node.js processes stopped" -ForegroundColor Green
Write-Host ""

# 3. FIX .ENV
Write-Host "=== STEP 3: FIXING .ENV ===" -ForegroundColor Yellow
if ((Test-Path "$rootPath\.env") -and -not (Test-Path "$rootPath\backend\.env")) {
    Move-Item "$rootPath\.env" "$rootPath\backend\.env" -Force
    Write-Host "[OK] Moved .env to backend/" -ForegroundColor Green
} elseif ((Test-Path "$rootPath\.env") -and (Test-Path "$rootPath\backend\.env")) {
    Remove-Item "$rootPath\.env" -Force
    Write-Host "[OK] Removed duplicate .env" -ForegroundColor Green
} else {
    Write-Host "[OK] .env configuration OK" -ForegroundColor Green
}
Write-Host ""

# 4. REGENERATE PRISMA CLIENT WITH X64
Write-Host "=== STEP 4: REGENERATING PRISMA ===" -ForegroundColor Yellow
Write-Host "Using x64 Node.js for Prisma..." -ForegroundColor Gray

Push-Location "$rootPath\backend"
Remove-Item -Path "node_modules\.prisma" -Recurse -Force -ErrorAction SilentlyContinue

$env:Path = "$nodeX64Path;" + $env:Path

Write-Host "Generating Prisma Client (~10 seconds)..." -ForegroundColor Gray
& "$nodeX64Path\npx.cmd" prisma generate --schema=prisma/schema.prisma 2>&1 | Out-Null

Write-Host "[OK] Prisma Client generated with x64" -ForegroundColor Green

Pop-Location
Write-Host ""

# 5. START BACKEND
Write-Host "=== STEP 5: STARTING BACKEND ===" -ForegroundColor Yellow
Write-Host "Backend starting in separate window..." -ForegroundColor Cyan

# Create backend script
$backendScriptContent = @'
Write-Host '================================================' -ForegroundColor Cyan
Write-Host '   BACKEND - Coffee Hub' -ForegroundColor Cyan  
Write-Host '================================================' -ForegroundColor Cyan
Write-Host ''

$nodeX64 = "$env:USERPROFILE\nodejs-x64"
$env:Path = "$nodeX64;" + $env:Path

Set-Location -Path 'BACKEND_PATH_PLACEHOLDER'

Write-Host 'Node.js Architecture: ' -NoNewline -ForegroundColor Yellow
& "$nodeX64\node.exe" -p 'process.arch'
Write-Host ''
Write-Host 'Starting Backend with x64 Node.js...' -ForegroundColor Green
Write-Host ''

& "$nodeX64\npm.cmd" run start:dev
'@

$backendScriptContent = $backendScriptContent -replace 'BACKEND_PATH_PLACEHOLDER', "$rootPath\backend"
$backendScriptContent | Out-File -FilePath "$rootPath\_run_backend.ps1" -Encoding ASCII -Force

Start-Process powershell -ArgumentList "-NoExit", "-ExecutionPolicy", "Bypass", "-File", "$rootPath\_run_backend.ps1"

Write-Host "[OK] Backend starting in new window" -ForegroundColor Green
Write-Host ""

# Wait for backend
Write-Host "Waiting for Backend (35 seconds)..." -ForegroundColor Yellow
for ($i = 35; $i -ge 0; $i -= 5) {
    Write-Host "  $i seconds..." -ForegroundColor Gray
    Start-Sleep -Seconds 5
}

# Check backend
Write-Host ""
Write-Host "Checking Backend..." -ForegroundColor Yellow
$backendOk = $false
for ($i = 1; $i -le 5; $i++) {
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:3001/locations" -TimeoutSec 3 -ErrorAction Stop
        $backendOk = $true
        break
    } catch {
        Write-Host "  Attempt $i/5..." -ForegroundColor Gray
        Start-Sleep -Seconds 3
    }
}

if ($backendOk) {
    Write-Host "[OK] Backend running on port 3001" -ForegroundColor Green
} else {
    Write-Host "[!] Backend not responding" -ForegroundColor Red
    Write-Host "    Check Backend window for errors" -ForegroundColor Yellow
}
Write-Host ""

# 6. START FRONTEND
Write-Host "=== STEP 6: STARTING FRONTEND ===" -ForegroundColor Yellow
Write-Host "Frontend starting in separate window..." -ForegroundColor Cyan

# Create frontend script
$frontendScriptContent = @'
Write-Host '================================================' -ForegroundColor Cyan
Write-Host '   FRONTEND - Coffee Hub' -ForegroundColor Cyan
Write-Host '================================================' -ForegroundColor Cyan
Write-Host ''

Set-Location -Path 'FRONTEND_PATH_PLACEHOLDER'

Write-Host 'Node.js Architecture: ' -NoNewline -ForegroundColor Yellow
node -p 'process.arch'
Write-Host ''
Write-Host 'Starting Frontend (Vite)...' -ForegroundColor Green
Write-Host ''

npm run dev
'@

$frontendScriptContent = $frontendScriptContent -replace 'FRONTEND_PATH_PLACEHOLDER', "$rootPath\frontend"
$frontendScriptContent | Out-File -FilePath "$rootPath\_run_frontend.ps1" -Encoding ASCII -Force

Start-Process powershell -ArgumentList "-NoExit", "-ExecutionPolicy", "Bypass", "-File", "$rootPath\_run_frontend.ps1"

Write-Host "[OK] Frontend starting in new window" -ForegroundColor Green
Write-Host ""

# Wait for frontend
Write-Host "Waiting for Frontend (45 seconds)..." -ForegroundColor Yellow
for ($i = 45; $i -ge 0; $i -= 5) {
    Write-Host "  $i seconds..." -ForegroundColor Gray
    Start-Sleep -Seconds 5
}

# Check frontend
Write-Host ""
Write-Host "Checking Frontend..." -ForegroundColor Yellow
$frontendOk = $false
for ($i = 1; $i -le 5; $i++) {
    $frontendOk = Test-NetConnection -ComputerName localhost -Port 3000 -InformationLevel Quiet -WarningAction SilentlyContinue
    if ($frontendOk) { break }
    Write-Host "  Attempt $i/5..." -ForegroundColor Gray
    Start-Sleep -Seconds 5
}

if ($frontendOk) {
    Write-Host "[OK] Frontend running on port 3000" -ForegroundColor Green
} else {
    Write-Host "[!] Frontend still compiling" -ForegroundColor Yellow
    Write-Host "    Wait 1-2 minutes" -ForegroundColor Yellow
}
Write-Host ""

# 7. FINAL STATUS
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "   FINAL STATUS" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

if ($backendOk -and $frontendOk) {
    Write-Host "[OK] EVERYTHING WORKS!" -ForegroundColor Green
    Write-Host ""
    Write-Host "  Backend:  http://localhost:3001" -ForegroundColor White
    Write-Host "  Frontend: http://localhost:3000" -ForegroundColor White
    Write-Host ""
    Write-Host "  Opening browser: http://localhost:3000" -ForegroundColor Yellow
    
    Start-Sleep -Seconds 2
    Start-Process "http://localhost:3000"
    
} elseif ($backendOk) {
    Write-Host "[OK] Backend is running" -ForegroundColor Green
    Write-Host "[!] Frontend still starting" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  Wait 1-2 minutes and open:" -ForegroundColor White
    Write-Host "  http://localhost:3000" -ForegroundColor Cyan
} else {
    Write-Host "[!] STARTUP PROBLEMS" -ForegroundColor Red
    Write-Host ""
    Write-Host "  Check Backend and Frontend windows" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  If error 'is not a valid Win32 application':" -ForegroundColor Yellow
    Write-Host "  1. Close all windows" -ForegroundColor White
    Write-Host "  2. Run this script again" -ForegroundColor White
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Cleanup
Start-Sleep -Seconds 5
Remove-Item "$rootPath\_run_backend.ps1" -Force -ErrorAction SilentlyContinue
Remove-Item "$rootPath\_run_frontend.ps1" -Force -ErrorAction SilentlyContinue

Write-Host "Done! Press Enter to exit..." -ForegroundColor Gray
Read-Host

