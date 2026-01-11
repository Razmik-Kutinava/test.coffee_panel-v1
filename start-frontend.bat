@echo off
echo ============================================
echo   Coffee Hub - Starting Frontend
echo ============================================
echo.

REM Переключаемся на Node.js 22.14.0 через nvm
echo [1/2] Switching to Node.js 22.14.0...
call nvm use 22.14.0 >nul 2>&1
if errorlevel 1 (
    echo      WARNING: Failed to switch to Node.js 22.14.0
    echo      Trying to use current Node.js version...
    call node --version
) else (
    call node --version
    echo      Node.js version OK
)

echo.
echo [2/2] Starting Frontend (port 3000)...
echo      Note: This may take 20-30 seconds...
echo.

cd /d "%~dp0frontend"
call npm run dev
pause

