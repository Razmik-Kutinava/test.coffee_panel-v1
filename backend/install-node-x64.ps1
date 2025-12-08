# Install Node.js x64 for Prisma compatibility
$ErrorActionPreference = "Stop"

Write-Host "=== Installing Portable Node.js x64 ===" -ForegroundColor Green

$nodeVersion = "20.18.1"
$portableUrl = "https://nodejs.org/dist/v$nodeVersion/node-v$nodeVersion-win-x64.zip"
$portableDir = "$env:USERPROFILE\nodejs-x64"
$zipFile = "$env:TEMP\nodejs-x64-$nodeVersion.zip"

Write-Host "Downloading Node.js x64 v$nodeVersion..." -ForegroundColor Yellow
if (Test-Path $zipFile) {
    Remove-Item $zipFile -Force
}
Invoke-WebRequest -Uri $portableUrl -OutFile $zipFile -UseBasicParsing -TimeoutSec 120

if (-not (Test-Path $zipFile)) {
    Write-Host "Error: download failed" -ForegroundColor Red
    exit 1
}

$size = [math]::Round((Get-Item $zipFile).Length / 1MB, 2)
Write-Host "Downloaded: $size MB" -ForegroundColor Green

if (-not (Test-Path $portableDir)) {
    New-Item -ItemType Directory -Path $portableDir -Force | Out-Null
    Write-Host "Created directory: $portableDir" -ForegroundColor Green
}

Write-Host "Extracting..." -ForegroundColor Yellow
Expand-Archive -Path $zipFile -DestinationPath $portableDir -Force

$extractedFolder = Get-ChildItem $portableDir -Directory | Where-Object { $_.Name -like "node-v*-win-x64" } | Select-Object -First 1

if ($extractedFolder) {
    Write-Host "Found folder: $($extractedFolder.Name)" -ForegroundColor Yellow
    Get-ChildItem $extractedFolder.FullName | Copy-Item -Destination $portableDir -Recurse -Force
    Remove-Item $extractedFolder.FullName -Recurse -Force
    Write-Host "Files copied" -ForegroundColor Green
}

$nodeExe = Join-Path $portableDir "node.exe"
if (-not (Test-Path $nodeExe)) {
    Write-Host "Error: node.exe not found" -ForegroundColor Red
    exit 1
}

$env:Path = "$portableDir;" + $env:Path
$archResult = & $nodeExe -p "process.arch"
$arch = $archResult.Trim()
$versionResult = & $nodeExe --version
$version = $versionResult.Trim()

Write-Host ""
Write-Host "=== Installation Result ===" -ForegroundColor Cyan
Write-Host "Version: $version"
Write-Host "Architecture: $arch"
Write-Host "Path: $portableDir"

if ($arch -eq "x64") {
    Write-Host ""
    Write-Host "SUCCESS: Node.js x64 installed!" -ForegroundColor Green
    Write-Host ""
    Write-Host "To use it, add to PATH:" -ForegroundColor Yellow
    Write-Host "  $portableDir" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "FAIL: Installed $arch instead of x64" -ForegroundColor Red
    exit 1
}
