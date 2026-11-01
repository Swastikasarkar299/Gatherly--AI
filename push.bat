@echo off
setlocal
cd /d "%~dp0"
set PATH=C:\ProgramData\HP\GitHubDesktop\app-3.6.6\resources\app\git\cmd;%~dp0bin;%PATH%

echo ======================================================
echo    Pushing Gatherly to GitHub
echo    Target: https://github.com/Swastikasarkar299/Gatherly--AI.git
echo ======================================================
echo.

git init
git branch -M main
git remote remove origin 2>nul
git remote add origin https://github.com/Swastikasarkar299/Gatherly--AI.git
git add -A
git commit -m "Gatherly - GenAI Event Planning Assistant" 2>nul

echo.
echo Pushing commits to GitHub...
echo (If a browser window appears, click Authorize to sign in)
git push -u origin main

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ======================================================
    echo  SUCCESS! Pushed to https://github.com/Swastikasarkar299/Gatherly--AI
    echo ======================================================
) else (
    echo.
    echo ------------------------------------------------------
    echo  If GitHub login failed or was cancelled, you can push
    echo  using a GitHub Personal Access Token:
    echo    git push -u https://YOUR_TOKEN@github.com/Swastikasarkar299/Gatherly--AI.git main
    echo ------------------------------------------------------
)

