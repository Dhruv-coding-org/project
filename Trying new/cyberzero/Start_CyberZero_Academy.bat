@echo off
title CyberZero Interactive Academy Server
color 0B
echo =================================================================
echo        🛡️ CYBERZERO INTERACTIVE ACADEMY SERVER 🛡️
echo =================================================================
echo.
echo [1] Starting local web server on port 8000...
echo [2] Opening Google Chrome / Default Browser to http://localhost:8000...
echo.
echo 💡 TIP: Leave this black command window open while playing!
echo         When you are finished playing, simply close this window.
echo =================================================================
echo.

cd /d "%~dp0web"
start "" http://localhost:8000
python -m http.server 8000
