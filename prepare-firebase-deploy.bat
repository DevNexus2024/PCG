@echo off
echo ========================================
echo Firebase Hosting Deployment Preparation
echo ========================================
echo.

REM Create a temporary deployment folder
if exist firebase-deploy rmdir /s /q firebase-deploy
mkdir firebase-deploy

echo Copying website files...

REM Copy all HTML files
copy *.html firebase-deploy\ >nul

REM Copy JavaScript files
copy *.js firebase-deploy\ >nul

REM Copy manifest and service worker
copy manifest.json firebase-deploy\ >nul
copy sw.js firebase-deploy\ >nul

REM Copy CSS folder
xcopy css firebase-deploy\css\ /E /I /Y >nul

REM Copy JS folder
xcopy js firebase-deploy\js\ /E /I /Y >nul

REM Copy images folder
xcopy images firebase-deploy\images\ /E /I /Y >nul

echo.
echo ✓ Files copied to 'firebase-deploy' folder
echo.
echo ========================================
echo DEPLOYMENT OPTIONS:
echo ========================================
echo.
echo [RECOMMENDED] Option 1: Manual Upload
echo ------------------------------------
echo 1. Press any key to open Firebase Console
echo 2. Go to Hosting section
echo 3. Drag and drop the 'firebase-deploy' folder
echo.
echo Option 2: Use Firebase CLI
echo -------------------------
echo Run: firebase deploy --only hosting
echo.
echo ========================================
echo.
pause

REM Open Firebase Console
start https://console.firebase.google.com/project/food-ordering-website-2025/hosting

REM Open the deployment folder
start explorer "%cd%\firebase-deploy"

echo.
echo ✓ Firebase Console opened in browser
echo ✓ Deployment folder opened in Explorer
echo.
echo Drag contents of firebase-deploy folder to Firebase Console!
echo.
pause
