@echo off
cd /d "%~dp0backend"
set PATH=%USERPROFILE%\nodejs-x64;%PATH%
call npm run start:dev
pause

