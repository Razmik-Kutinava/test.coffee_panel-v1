# ============================================
# Coffee Hub - Start Backend Only
# ============================================

$ErrorActionPreference = "SilentlyContinue"

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "   Coffee Hub - Starting Backend" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

$rootPath = $PSScriptRoot
if (-not $rootPath) { $rootPath = (Get-Location).Path }

$nodeX64Path = "$env:USERPROFILE\nodejs-x64"

# Stop existing backend processes
Write-Host "[1/4] Stopping existing backend processes..." -ForegroundColor Yellow
Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue | ForEach-Object {
    $proc = Get-Process -Id $_.OwningProcess -ErrorAction SilentlyContinue
    if ($proc) { Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue }
}
Start-Sleep -Seconds 2
Write-Host "      Done" -ForegroundColor Green

# Check x64 Node.js
Write-Host "[2/4] Checking x64 Node.js..." -ForegroundColor Yellow
if (-not (Test-Path "$nodeX64Path\node.exe")) {
    Write-Host "      ERROR: x64 Node.js not found!" -ForegroundColor Red
    Write-Host "      Run: cd backend; .\install-node-x64.ps1" -ForegroundColor Yellow
    exit 1
}
$arch = & "$nodeX64Path\node.exe" -p "process.arch"
Write-Host "      Node.js $arch found" -ForegroundColor Green

# Fix .env conflict
Write-Host "[2.5/4] Fixing .env configuration..." -ForegroundColor Yellow
if ((Test-Path "$rootPath\.env") -and -not (Test-Path "$rootPath\backend\.env")) {
    Copy-Item "$rootPath\.env" "$rootPath\backend\.env" -Force
    Remove-Item "$rootPath\.env" -Force
    Write-Host "      Moved .env to backend folder" -ForegroundColor Green
} elseif ((Test-Path "$rootPath\.env") -and (Test-Path "$rootPath\backend\.env")) {
    Remove-Item "$rootPath\.env" -Force
    Write-Host "      Removed duplicate .env" -ForegroundColor Green
} else {
    Write-Host "      .env configuration OK" -ForegroundColor Green
}

# Regenerate Prisma Client
Write-Host "[3/4] Regenerating Prisma Client..." -ForegroundColor Yellow
$env:Path = "$nodeX64Path;" + $env:Path
Push-Location "$rootPath\backend"
Remove-Item -Path "node_modules\.prisma" -Recurse -Force -ErrorAction SilentlyContinue
& "$nodeX64Path\npx.cmd" prisma generate --schema=prisma/schema.prisma 2>&1 | Out-Null
Pop-Location
Write-Host "      Done" -ForegroundColor Green

# Start Backend
Write-Host "[4/4] Starting Backend (port 3001)..." -ForegroundColor Yellow
Start-Process -FilePath "$rootPath\start-backend.bat" -WindowStyle Normal
Write-Host "      Backend starting in new window" -ForegroundColor Green

# Wait and test
Write-Host ""
Write-Host "Waiting for backend to start (30 seconds)..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

# Test APIs
Write-Host ""
Write-Host "Testing Backend APIs..." -ForegroundColor Cyan
$success = 0
@('/locations', '/products', '/orders', '/categories') | ForEach-Object {
    $ep = $_
    try {
        $r = Invoke-RestMethod -Uri "http://localhost:3001$ep" -TimeoutSec 5
        Write-Host "  OK $ep" -ForegroundColor Green
        $success++
    } catch {
        Write-Host "  FAIL $ep" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
if ($success -eq 4) {
    Write-Host "   Backend started successfully!" -ForegroundColor Green
} else {
    Write-Host "   Backend may have issues" -ForegroundColor Yellow
}
Write-Host ""
Write-Host "   Backend API: http://localhost:3001" -ForegroundColor White
Write-Host ""
Write-Host "   To start frontend, run:" -ForegroundColor Yellow
Write-Host "   .\start-frontend-only.ps1" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

