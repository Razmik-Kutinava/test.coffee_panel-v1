# Start backend with Node.js x64
$ErrorActionPreference = "Stop"

$nodeX64Path = "$env:USERPROFILE\nodejs-x64"
$nodeExe = Join-Path $nodeX64Path "node.exe"

if (-not (Test-Path $nodeExe)) {
    Write-Host "❌ Node.js x64 not found at: $nodeX64Path" -ForegroundColor Red
    Write-Host "💡 Run: .\install-node-x64.ps1" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Using Node.js x64 from: $nodeX64Path" -ForegroundColor Green
$arch = & $nodeExe -p "process.arch"
Write-Host "📦 Architecture: $arch" -ForegroundColor Cyan

if ($arch -ne "x64") {
    Write-Host "❌ Wrong architecture: $arch (expected x64)" -ForegroundColor Red
    exit 1
}

# Add x64 Node.js to PATH (priority)
$env:Path = "$nodeX64Path;" + $env:Path

Write-Host "🚀 Starting backend with x64 Node.js..." -ForegroundColor Green
Write-Host ""

# Find npm from x64 Node.js directory
$npmPath = Join-Path $nodeX64Path "npm.cmd"
if (-not (Test-Path $npmPath)) {
    $npmPath = Join-Path $nodeX64Path "npm"
}

if (-not (Test-Path $npmPath)) {
    Write-Host "❌ npm not found in x64 Node.js directory" -ForegroundColor Red
    Write-Host "💡 Trying to use npm from PATH..." -ForegroundColor Yellow
    $npmPath = "npm"
}

Write-Host "📦 Using npm: $npmPath" -ForegroundColor Cyan
Write-Host ""

# Start with npm using x64 Node.js (npm will use node from PATH which is now x64)
& $npmPath run start:dev

