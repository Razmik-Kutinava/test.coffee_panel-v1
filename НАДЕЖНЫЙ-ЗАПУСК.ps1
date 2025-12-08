# ============================================
# НАДЕЖНЫЙ ЗАПУСК - Backend + Frontend
# Решает проблему ARM64 + Prisma раз и навсегда
# ============================================

$ErrorActionPreference = "SilentlyContinue"

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "   NADEJNYI ZAPUSK Coffee Hub" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

$rootPath = $PSScriptRoot
if (-not $rootPath) { $rootPath = (Get-Location).Path }
$nodeX64Path = "$env:USERPROFILE\nodejs-x64"

# 1. DIAGNOSTIKA
Write-Host "=== SHAG 1: DIAGNOSTIKA ===" -ForegroundColor Yellow
Write-Host ""

# Proverka x64 Node.js
if (-not (Test-Path "$nodeX64Path\node.exe")) {
    Write-Host "OSHIBKA: x64 Node.js ne nayden!" -ForegroundColor Red
    Write-Host ""
    Write-Host "USTANOVITE x64 Node.js:" -ForegroundColor Yellow
    Write-Host "  cd backend" -ForegroundColor Cyan
    Write-Host "  .\install-node-x64.ps1" -ForegroundColor Cyan
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

$archX64 = & "$nodeX64Path\node.exe" -p "process.arch"
Write-Host "[OK] x64 Node.js nayden: $archX64" -ForegroundColor Green

$archSystem = & node -p "process.arch" 2>$null
Write-Host "[OK] System Node.js: $archSystem" -ForegroundColor Green

# Proverka .env
if (Test-Path "$rootPath\.env") {
    Write-Host "[!] .env v korne (budet peremeshen)" -ForegroundColor Yellow
}

if (-not (Test-Path "$rootPath\backend\.env")) {
    Write-Host "[!] backend\.env ne nayden!" -ForegroundColor Yellow
}

Write-Host ""

# 2. OSTANOVKA STARYKH PROTSESSOV
Write-Host "=== SHAG 2: OSTANOVKA PROTSESSOV ===" -ForegroundColor Yellow
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 3
Write-Host "[OK] Vse protsessy Node.js ostanovleny" -ForegroundColor Green
Write-Host ""

# 3. ISPRAVLENIE .ENV
Write-Host "=== SHAG 3: ISPRAVLENIE .ENV ===" -ForegroundColor Yellow
if ((Test-Path "$rootPath\.env") -and -not (Test-Path "$rootPath\backend\.env")) {
    Move-Item "$rootPath\.env" "$rootPath\backend\.env" -Force
    Write-Host "[OK] Peremeshen .env v backend/" -ForegroundColor Green
} elseif ((Test-Path "$rootPath\.env") -and (Test-Path "$rootPath\backend\.env")) {
    Remove-Item "$rootPath\.env" -Force
    Write-Host "[OK] Udalen dublikat .env" -ForegroundColor Green
} else {
    Write-Host "[OK] Konfiguratsiya .env v poryadke" -ForegroundColor Green
}
Write-Host ""

# 4. REGENERATSIYA PRISMA CLIENT S X64
Write-Host "=== SHAG 4: REGENERATSIYA PRISMA ===" -ForegroundColor Yellow
Write-Host "Ispolzuem x64 Node.js dlya Prisma..." -ForegroundColor Gray

Push-Location "$rootPath\backend"
Remove-Item -Path "node_modules\.prisma" -Recurse -Force -ErrorAction SilentlyContinue

$originalPath = $env:Path
$env:Path = "$nodeX64Path;" + $env:Path

Write-Host "Generatsiya Prisma Client (~10 sekund)..." -ForegroundColor Gray
& "$nodeX64Path\npx.cmd" prisma generate --schema=prisma/schema.prisma 2>&1 | Out-Null

if ($LASTEXITCODE -ne 0) {
    Write-Host "[FAIL] Oshibka pri generatsii Prisma" -ForegroundColor Red
} else {
    Write-Host "[OK] Prisma Client sgenerirovam s x64" -ForegroundColor Green
}

Pop-Location
Write-Host ""

# 5. ZAPUSK BACKEND
Write-Host "=== SHAG 5: ZAPUSK BACKEND ===" -ForegroundColor Yellow
Write-Host "Backend zapuskaetsya v otdelnom okne..." -ForegroundColor Cyan

# Sozdaem skript dlya backend
$backendScript = @"
Write-Host '================================================' -ForegroundColor Cyan
Write-Host '   BACKEND - Coffee Hub' -ForegroundColor Cyan
Write-Host '================================================' -ForegroundColor Cyan
Write-Host ''

`$env:Path = '$nodeX64Path;' + `$env:Path
cd '$rootPath\backend'

Write-Host 'Node.js Architecture: ' -NoNewline -ForegroundColor Yellow
& '$nodeX64Path\node.exe' -p 'process.arch'
Write-Host ''
Write-Host 'Starting Backend...' -ForegroundColor Green
Write-Host ''

& '$nodeX64Path\npm.cmd' run start:dev
"@

$backendScript | Out-File -FilePath "$rootPath\_temp_backend.ps1" -Encoding UTF8 -Force

Start-Process powershell -ArgumentList "-NoExit", "-ExecutionPolicy", "Bypass", "-File", "$rootPath\_temp_backend.ps1"

Write-Host "[OK] Backend zapuskaetsya v novom okne" -ForegroundColor Green
Write-Host ""

# Zhdem backend
Write-Host "Zhdem zapuska Backend (35 sekund)..." -ForegroundColor Yellow
for ($i = 35; $i -ge 0; $i -= 5) {
    Write-Host "  $i sekund..." -ForegroundColor Gray
    Start-Sleep -Seconds 5
}

# Proverka backend
Write-Host ""
Write-Host "Proverka Backend..." -ForegroundColor Yellow
$backendOk = $false
for ($i = 1; $i -le 5; $i++) {
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:3001/locations" -TimeoutSec 3 -ErrorAction Stop
        $backendOk = $true
        break
    } catch {
        Write-Host "  Popytka $i/5..." -ForegroundColor Gray
        Start-Sleep -Seconds 3
    }
}

if ($backendOk) {
    Write-Host "[OK] Backend rabotaet na portu 3001" -ForegroundColor Green
} else {
    Write-Host "[!] Backend ne otvechaet" -ForegroundColor Red
    Write-Host "    Proverte okno Backend na oshibki" -ForegroundColor Yellow
}
Write-Host ""

# 6. ZAPUSK FRONTEND
Write-Host "=== SHAG 6: ZAPUSK FRONTEND ===" -ForegroundColor Yellow
Write-Host "Frontend zapuskaetsya v otdelnom okne..." -ForegroundColor Cyan

# Sozdaem skript dlya frontend
$frontendScript = @"
Write-Host '================================================' -ForegroundColor Cyan
Write-Host '   FRONTEND - Coffee Hub' -ForegroundColor Cyan
Write-Host '================================================' -ForegroundColor Cyan
Write-Host ''

cd '$rootPath\frontend'

Write-Host 'Node.js Architecture: ' -NoNewline -ForegroundColor Yellow
node -p 'process.arch'
Write-Host ''
Write-Host 'Starting Frontend (Vite)...' -ForegroundColor Green
Write-Host ''

npm run dev
"@

$frontendScript | Out-File -FilePath "$rootPath\_temp_frontend.ps1" -Encoding UTF8 -Force

Start-Process powershell -ArgumentList "-NoExit", "-ExecutionPolicy", "Bypass", "-File", "$rootPath\_temp_frontend.ps1"

Write-Host "[OK] Frontend zapuskaetsya v novom okne" -ForegroundColor Green
Write-Host ""

# Zhdem frontend
Write-Host "Zhdem zapuska Frontend (45 sekund)..." -ForegroundColor Yellow
for ($i = 45; $i -ge 0; $i -= 5) {
    Write-Host "  $i sekund..." -ForegroundColor Gray
    Start-Sleep -Seconds 5
}

# Proverka frontend
Write-Host ""
Write-Host "Proverka Frontend..." -ForegroundColor Yellow
$frontendOk = $false
for ($i = 1; $i -le 5; $i++) {
    $frontendOk = Test-NetConnection -ComputerName localhost -Port 3000 -InformationLevel Quiet -WarningAction SilentlyContinue
    if ($frontendOk) { break }
    Write-Host "  Popytka $i/5..." -ForegroundColor Gray
    Start-Sleep -Seconds 5
}

if ($frontendOk) {
    Write-Host "[OK] Frontend rabotaet na portu 3000" -ForegroundColor Green
} else {
    Write-Host "[!] Frontend esche kompiliruetsya" -ForegroundColor Yellow
    Write-Host "    Podozhdite 1-2 minuty" -ForegroundColor Yellow
}
Write-Host ""

# 7. ITOGOVYI STATUS
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "   ITOGOVYI STATUS" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

if ($backendOk -and $frontendOk) {
    Write-Host "[OK] VSE RABOTAET!" -ForegroundColor Green
    Write-Host ""
    Write-Host "  Backend:  http://localhost:3001" -ForegroundColor White
    Write-Host "  Frontend: http://localhost:3000" -ForegroundColor White
    Write-Host ""
    Write-Host "  Otkroyte v brauzere: http://localhost:3000" -ForegroundColor Yellow
    
    # Otkryt brauzer
    Start-Sleep -Seconds 2
    Start-Process "http://localhost:3000"
    
} elseif ($backendOk) {
    Write-Host "[OK] Backend rabotaet" -ForegroundColor Green
    Write-Host "[!] Frontend esche zapuskaetsya" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  Podozhdite 1-2 minuty i otkroyte:" -ForegroundColor White
    Write-Host "  http://localhost:3000" -ForegroundColor Cyan
} else {
    Write-Host "[!] PROBLEMY S ZAPUSKOM" -ForegroundColor Red
    Write-Host ""
    Write-Host "  Proverte okna Backend i Frontend" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  Esli oshibka 'is not a valid Win32 application':" -ForegroundColor Yellow
    Write-Host "  1. Zakroyte vse okna" -ForegroundColor White
    Write-Host "  2. Zapustite etot skript snova" -ForegroundColor White
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Cleanup temp files
Start-Sleep -Seconds 3
Remove-Item "$rootPath\_temp_backend.ps1" -Force -ErrorAction SilentlyContinue
Remove-Item "$rootPath\_temp_frontend.ps1" -Force -ErrorAction SilentlyContinue

Write-Host "Gotovo! Nazhmite Enter dlya vyhoda..." -ForegroundColor Gray
Read-Host

