@echo off
cd /d "%~dp0"
start "Asset Management Server" powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0serve.ps1" -Port 8000
timeout /t 1 /nobreak >nul
start "" "http://localhost:8000/"
