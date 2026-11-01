@echo off
setlocal
cd /d "%~dp0"

echo ======================================================
echo    Starting Gatherly - GenAI Event Planning Assistant
echo ======================================================
echo.

:: Ensure node is accessible using bin\node.cmd wrapper if needed
set PATH=%~dp0bin;%PATH%

:: Start the server in the background
start "Gatherly Server" cmd /k "node server.js"

:: Wait 2 seconds for server boot, then open browser
timeout /t 2 /nobreak >nul
echo Opening Gatherly in your default browser...
start http://localhost:5000

echo Gatherly is running!
echo Access the application anytime at: http://localhost:5000

