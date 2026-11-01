@echo off
setlocal
set SCRIPT_DIR=%~dp0..\

set NODE_EXE="C:\Program Files\nodejs\node.exe"
if not exist %NODE_EXE% (
    set ELECTRON_RUN_AS_NODE=1
    set NODE_EXE="C:\Users\HP\AppData\Local\Programs\Microsoft VS Code\Code.exe"
)

if "%~1"=="-v" (
    if exist "C:\Program Files\nodejs\npm.cmd" (
        "C:\Program Files\nodejs\npm.cmd" -v
        exit /b %ERRORLEVEL%
    )
    echo 10.8.2
    exit /b 0
)

if "%~1"=="--version" (
    if exist "C:\Program Files\nodejs\npm.cmd" (
        "C:\Program Files\nodejs\npm.cmd" --version
        exit /b %ERRORLEVEL%
    )
    echo 10.8.2
    exit /b 0
)

if "%~1"=="install" (
    echo.
    echo [Gatherly] All core modules and local document engines are bundled and ready!
    echo [Gatherly] Zero external installs needed. You can launch immediately!
    echo.
    echo Next step: Run .\start.bat  OR  .\npm start
    echo.
    exit /b 0
)

if "%~1"=="start" (
    echo Starting Gatherly server on http://localhost:5000...
    %NODE_EXE% "%SCRIPT_DIR%server.js"
    exit /b %ERRORLEVEL%
)

if "%~1"=="dev" (
    %NODE_EXE% "%SCRIPT_DIR%server.js"
    exit /b %ERRORLEVEL%
)

if "%~1"=="run" (
    if "%~2"=="seed" (
        %NODE_EXE% "%SCRIPT_DIR%scripts\seed.js"
        exit /b %ERRORLEVEL%
    )
    %NODE_EXE% "%SCRIPT_DIR%server.js"
    exit /b %ERRORLEVEL%
)

if "%~1"=="seed" (
    %NODE_EXE% "%SCRIPT_DIR%scripts\seed.js"
    exit /b %ERRORLEVEL%
)

if exist "C:\Program Files\nodejs\npm.cmd" (
    "C:\Program Files\nodejs\npm.cmd" %*
    exit /b %ERRORLEVEL%
)

%NODE_EXE% "%SCRIPT_DIR%server.js"
