@echo off
cd /d "%~dp0"
start "" /min cmd /c "node server.js"
timeout /t 2 >nul
start "" http://localhost:4173
