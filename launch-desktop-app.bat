@echo off
REM Pizza Club and Grill - Desktop Launcher
REM Launches your website as a desktop app using Chrome or Edge

title The Pizza Club and Grill - Desktop App

echo.
echo ================================================
echo   THE PIZZA CLUB AND GRILL - Desktop Launcher
echo ================================================
echo.

REM Get the current directory
set "WEBSITE_DIR=%~dp0"
set "INDEX_FILE=%WEBSITE_DIR%index.html"

REM Check if index.html exists
if not exist "%INDEX_FILE%" (
    echo ERROR: index.html not found!
    echo Please make sure this file is in the same folder as your website.
    pause
    exit /b 1
)

echo Website Location: %WEBSITE_DIR%
echo.

REM Convert to file:/// URL and add desktop mode parameter
set "FILE_URL=file:///%INDEX_FILE:\=/%?desktop=true"

REM Try Chrome first
set "CHROME_PATH=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
if not exist "%CHROME_PATH%" (
    set "CHROME_PATH=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
)
if not exist "%CHROME_PATH%" (
    set "CHROME_PATH=%LocalAppData%\Google\Chrome\Application\chrome.exe"
)

if exist "%CHROME_PATH%" (
    echo [32mFound: Google Chrome[0m
    echo [36mLaunching desktop app...[0m
    echo.
    start "" "%CHROME_PATH%" --app="%FILE_URL%" --window-size=1400,900
    echo [32mDesktop app launched successfully![0m
    timeout /t 2 >nul
    exit /b 0
)

REM Try Edge if Chrome not found
set "EDGE_PATH=%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"
if not exist "%EDGE_PATH%" (
    set "EDGE_PATH=%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"
)

if exist "%EDGE_PATH%" (
    echo [32mFound: Microsoft Edge[0m
    echo [36mLaunching desktop app...[0m
    echo.
    start "" "%EDGE_PATH%" --app="%FILE_URL%" --window-size=1400,900
    echo [32mDesktop app launched successfully![0m
    timeout /t 2 >nul
    exit /b 0
)

REM If neither found, open in default browser
echo [33mWarning: Chrome or Edge not found[0m
echo Opening in default browser instead...
echo.
start "" "%INDEX_FILE%"
echo.
echo For best results, install Google Chrome or Microsoft Edge.
timeout /t 3 >nul
exit /b 0
