@echo off
if exist "C:\Program Files\nodejs\node.exe" (
    "C:\Program Files\nodejs\node.exe" %*
) else (
    set ELECTRON_RUN_AS_NODE=1
    "C:\Users\HP\AppData\Local\Programs\Microsoft VS Code\Code.exe" %*
)
