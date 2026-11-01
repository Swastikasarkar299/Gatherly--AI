@echo off
setlocal
cd /d "%~dp0"

echo ======================================================
echo    Starting Gatherly - GenAI Event Planning Assistant
echo ======================================================
echo.

set PATH=%~dp0bin;%PATH%
set ELECTRON_RUN_AS_NODE=1

start "Gatherly Server" cmd /k ""C:\Users\HP\AppData\Local\Programs\Microsoft VS Code\Code.exe" server.js"

timeout /t 2 /nobreak >nul
start http://localhost:5000

echo Gatherly is live at http://localhost:5000

