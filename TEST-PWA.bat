@echo off
REM PWA Test Server for The Pizza Club and Grill
REM Serves the website locally for testing PWA features

title The Pizza Club and Grill - PWA Test Server

echo.
echo ================================================
echo   THE PIZZA CLUB AND GRILL - PWA Test Server
echo ================================================
echo.

REM Check if Python is installed
where python >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [31mERROR: Python is not installed or not in PATH[0m
    echo.
    echo Please install Python from: https://www.python.org/downloads/
    echo Make sure to check "Add Python to PATH" during installation
    echo.
    pause
    exit /b 1
)

echo [32mPython found! Starting HTTP server...[0m
echo.
echo [36m========================================[0m
echo [36m  Server will run on: http://localhost:8000[0m
echo [36m========================================[0m
echo.
echo [33mOpen your browser and go to:[0m
echo [32mhttp://localhost:8000[0m
echo.
echo [33mTo test on mobile:[0m
echo 1. Find your computer's IP address
echo 2. Connect phone to same WiFi network
echo 3. Open: http://YOUR-IP-ADDRESS:8000
echo.
echo [33mPress Ctrl+C to stop the server[0m
echo.

REM Start Python HTTP server
cd /d "%~dp0"
python -m http.server 8000

pause
