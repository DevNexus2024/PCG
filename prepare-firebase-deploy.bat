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
echo NEXT STEPS:
echo ========================================
echo 1. Go to: https://console.firebase.google.com
echo 2. Select your project
echo 3. Click "Hosting" in the left sidebar
echo 4. Click "Get Started" or "Add another site"
echo 5. Choose "Deploy without Firebase CLI"
echo 6. Drag and drop the 'firebase-deploy' folder
echo.
echo The 'firebase-deploy' folder is ready!
echo Location: %cd%\firebase-deploy
echo ========================================
echo.
pause
