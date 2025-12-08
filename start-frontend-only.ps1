# ============================================
# Coffee Hub - Start Frontend Only
# ============================================

$ErrorActionPreference = "SilentlyContinue"

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "   Coffee Hub - Starting Frontend" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

$rootPath = $PSScriptRoot
if (-not $rootPath) { $rootPath = (Get-Location).Path }

# Check if backend is running
Write-Host "[1/2] Checking backend status..." -ForegroundColor Yellow
$backendRunning = Test-NetConnection -ComputerName localhost -Port 3001 -InformationLevel Quiet -WarningAction SilentlyContinue
if ($backendRunning) {
    Write-Host "      Backend is running" -ForegroundColor Green
} else {
    Write-Host "      WARNING: Backend is not running!" -ForegroundColor Yellow
    Write-Host "      Frontend will not work without backend" -ForegroundColor Yellow
    Write-Host "      Run: .\start-backend-only.ps1 first" -ForegroundColor Cyan
    Write-Host ""
    $continue = Read-Host "Continue anyway? (y/n)"
    if ($continue -ne 'y') {
        Write-Host "Cancelled" -ForegroundColor Red
        exit 0
    }
}

# Stop existing frontend processes
Write-Host "[1.5/2] Stopping existing frontend processes..." -ForegroundColor Yellow
Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | ForEach-Object {
    $proc = Get-Process -Id $_.OwningProcess -ErrorAction SilentlyContinue
    if ($proc) { Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue }
}
Start-Sleep -Seconds 2
Write-Host "      Done" -ForegroundColor Green

# Start Frontend
Write-Host "[2/2] Starting Frontend (port 3000)..." -ForegroundColor Yellow
Write-Host "      Opening new window..." -ForegroundColor White

# Use .bat file for reliable startup
Start-Process -FilePath "$rootPath\start-frontend.bat" -WindowStyle Normal
Write-Host "      Frontend starting..." -ForegroundColor Green

# Wait and test
Write-Host ""
Write-Host "Waiting for frontend to start (40 seconds)..." -ForegroundColor Yellow
Write-Host "Note: Vite needs time to compile..." -ForegroundColor Gray
Start-Sleep -Seconds 40

# Test Frontend
Write-Host ""
Write-Host "Testing Frontend..." -ForegroundColor Cyan
$frontendOk = Test-NetConnection -ComputerName localhost -Port 3000 -InformationLevel Quiet -WarningAction SilentlyContinue

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
if ($frontendOk) {
    Write-Host "   Frontend started successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "   Frontend: http://localhost:3000" -ForegroundColor White
    Write-Host "   Backend:  http://localhost:3001" -ForegroundColor White
    Write-Host ""
    Write-Host "   Open http://localhost:3000 in your browser" -ForegroundColor Yellow
} else {
    Write-Host "   Frontend may need more time to start" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "   Check the PowerShell window for frontend" -ForegroundColor White
    Write-Host "   Wait 1-2 minutes and try: http://localhost:3000" -ForegroundColor Cyan
}
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

