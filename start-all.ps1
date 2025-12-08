# ============================================
# Coffee Hub - Start All Services
# ============================================

$ErrorActionPreference = "SilentlyContinue"

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "   Coffee Hub - Starting All Services" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

$rootPath = $PSScriptRoot
if (-not $rootPath) { $rootPath = (Get-Location).Path }

$nodeX64Path = "$env:USERPROFILE\nodejs-x64"

# Stop existing processes
Write-Host "[1/5] Stopping existing Node.js processes..." -ForegroundColor Yellow
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2
Write-Host "      Done" -ForegroundColor Green

# Check x64 Node.js
Write-Host "[2/5] Checking x64 Node.js..." -ForegroundColor Yellow
if (-not (Test-Path "$nodeX64Path\node.exe")) {
    Write-Host "      ERROR: x64 Node.js not found!" -ForegroundColor Red
    Write-Host "      Run: cd backend; .\install-node-x64.ps1" -ForegroundColor Yellow
    exit 1
}
$arch = & "$nodeX64Path\node.exe" -p "process.arch"
Write-Host "      Node.js $arch found" -ForegroundColor Green

# Fix .env conflict
Write-Host "[2.5/5] Fixing .env configuration..." -ForegroundColor Yellow
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
Write-Host "[3/5] Regenerating Prisma Client..." -ForegroundColor Yellow
$env:Path = "$nodeX64Path;" + $env:Path
Push-Location "$rootPath\backend"
Remove-Item -Path "node_modules\.prisma" -Recurse -Force -ErrorAction SilentlyContinue
& "$nodeX64Path\npx.cmd" prisma generate --schema=prisma/schema.prisma 2>&1 | Out-Null
Pop-Location
Write-Host "      Done" -ForegroundColor Green

# Start Backend
Write-Host "[4/5] Starting Backend (port 3001)..." -ForegroundColor Yellow
Start-Process -FilePath "$rootPath\start-backend.bat" -WindowStyle Normal
Write-Host "      Backend starting in new window" -ForegroundColor Green

# Start Frontend
Write-Host "[5/5] Starting Frontend (port 3000)..." -ForegroundColor Yellow
Start-Process -FilePath "$rootPath\start-frontend.bat" -WindowStyle Normal
Write-Host "      Frontend starting in new window" -ForegroundColor Green

# Wait and test
Write-Host ""
Write-Host "Waiting for backend to start (30 seconds)..." -ForegroundColor Yellow
Start-Sleep -Seconds 30
Write-Host "Note: Frontend may need additional 20-30 seconds to start" -ForegroundColor Yellow

# Test APIs
Write-Host ""
Write-Host "Testing APIs..." -ForegroundColor Cyan
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
    Write-Host "   All services started successfully!" -ForegroundColor Green
} else {
    Write-Host "   Some services may have issues" -ForegroundColor Yellow
}
Write-Host ""
Write-Host "   Backend:  http://localhost:3001" -ForegroundColor White
Write-Host "   Frontend: http://localhost:3000" -ForegroundColor White
Write-Host ""
Write-Host "   Open http://localhost:3000 in your browser" -ForegroundColor Yellow
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

