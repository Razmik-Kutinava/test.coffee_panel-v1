# ============================================
# Coffee Hub Backend Starter
# Automatically uses x64 Node.js for Prisma compatibility
# ============================================

$ErrorActionPreference = "Stop"
$nodeX64Path = "$env:USERPROFILE\nodejs-x64"

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "   Coffee Hub Backend Starter" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Check if x64 Node.js is installed
if (-not (Test-Path "$nodeX64Path\node.exe")) {
    Write-Host "ERROR: x64 Node.js not found at $nodeX64Path" -ForegroundColor Red
    Write-Host "Run install-node-x64.ps1 first!" -ForegroundColor Yellow
    exit 1
}

# Check Node.js architecture
$env:Path = "$nodeX64Path;" + $env:Path
$arch = & "$nodeX64Path\node.exe" -p "process.arch"
Write-Host "Node.js architecture: $arch" -ForegroundColor Cyan

if ($arch -ne "x64") {
    Write-Host "ERROR: Node.js is not x64!" -ForegroundColor Red
    exit 1
}

# Check if Prisma Client needs regeneration
$prismaClient = ".\node_modules\.prisma\client\query_engine-windows.dll.node"
$needsRegenerate = $false

if (-not (Test-Path $prismaClient)) {
    Write-Host "Prisma Client not found - will regenerate" -ForegroundColor Yellow
    $needsRegenerate = $true
}

# Regenerate Prisma Client if needed
if ($needsRegenerate) {
    Write-Host ""
    Write-Host "Generating Prisma Client..." -ForegroundColor Yellow
    & "$nodeX64Path\npx.cmd" prisma generate --schema=prisma/schema.prisma
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Failed to generate Prisma Client" -ForegroundColor Red
        exit 1
    }
    Write-Host "Prisma Client generated successfully!" -ForegroundColor Green
}

Write-Host ""
Write-Host "Starting backend server..." -ForegroundColor Green
Write-Host "Backend will be available at: http://localhost:3001" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

# Start the backend
& "$nodeX64Path\npm.cmd" run start:dev

