# Скрипт запуска с обходом проблемы ARM64 Windows
# Устанавливает переменные окружения для Prisma

$env:PRISMA_QUERY_ENGINE_LIBRARY = ""
$env:PRISMA_ENGINES_MIRROR = "https://binaries.prisma.sh"
$env:PRISMA_QUERY_ENGINE_BINARY = ""

Write-Host "Запуск приложения с обходом проблемы ARM64..." -ForegroundColor Green
cd backend
npm run start:dev

