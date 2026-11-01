# Gatherly PowerShell Launcher
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

Write-Host "======================================================" -ForegroundColor Cyan
Write-Host "   Gatherly - GenAI Event Planning Assistant" -ForegroundColor Yellow
Write-Host "======================================================" -ForegroundColor Cyan

$env:PATH = "$scriptDir\bin;" + $env:PATH

# Start server
Start-Process -FilePath "cmd.exe" -ArgumentList "/k node server.js"

Start-Sleep -Seconds 2
Write-Host "Launching Gatherly web interface..." -ForegroundColor Green
Start-Process "http://localhost:5000"

