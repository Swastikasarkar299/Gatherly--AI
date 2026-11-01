@echo off
setlocal
set ELECTRON_RUN_AS_NODE=1
set NODE_EXE="C:\Users\HP\AppData\Local\Programs\Microsoft VS Code\Code.exe"
set SCRIPT_DIR=%~dp0

if "%~1"=="-v" (
    echo 10.8.2
    exit /b 0
)

if "%~1"=="--version" (
    echo 10.8.2
    exit /b 0
)

if "%~1"=="install" (
    echo [Gatherly] All core modules and local document engines are bundled and ready!
    echo [Gatherly] Zero external installs needed.
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

%NODE_EXE% "%SCRIPT_DIR%server.js"
