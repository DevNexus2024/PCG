@echo off
cls
echo.
echo ╔═══════════════════════════════════════════════════════════════╗
echo ║                                                               ║
echo ║          🚀 FIREBASE HOSTING - QUICK DEPLOY 🚀              ║
echo ║                                                               ║
echo ╚═══════════════════════════════════════════════════════════════╝
echo.
echo This will:
echo   1. Prepare your deployment files
echo   2. Open Firebase Console in browser
echo   3. Open the deployment folder in Explorer
echo.
echo Then YOU:
echo   • Drag files from Explorer to Firebase Console
echo   • Click Deploy
echo   • Done! Your site goes live!
echo.
echo ═══════════════════════════════════════════════════════════════
pause
cls

echo.
echo 📦 Preparing deployment files...
echo.

REM Clean and create deployment folder
if exist firebase-deploy rmdir /s /q firebase-deploy 2>nul
mkdir firebase-deploy 2>nul

REM Copy files
echo   → Copying HTML pages...
copy /Y *.html firebase-deploy\ >nul 2>&1

echo   → Copying JavaScript...
copy /Y *.js firebase-deploy\ >nul 2>&1

echo   → Copying configuration files...
copy /Y manifest.json firebase-deploy\ >nul 2>&1
copy /Y sw.js firebase-deploy\ >nul 2>&1

echo   → Copying CSS folder...
xcopy /E /I /Y css firebase-deploy\css\ >nul 2>&1

echo   → Copying JS folder...
xcopy /E /I /Y js firebase-deploy\js\ >nul 2>&1

echo   → Copying images folder...
xcopy /E /I /Y images firebase-deploy\images\ >nul 2>&1

echo.
echo ✅ Files ready for deployment!
echo.
echo ═══════════════════════════════════════════════════════════════
echo.
echo 🌐 Opening Firebase Console...
timeout /t 2 >nul
start https://console.firebase.google.com/project/food-ordering-website-2025/hosting

echo.
echo 📁 Opening deployment folder...
timeout /t 1 >nul
start explorer "%cd%\firebase-deploy"

cls
echo.
echo ╔═══════════════════════════════════════════════════════════════╗
echo ║                                                               ║
echo ║                    📋 DEPLOYMENT STEPS 📋                    ║
echo ║                                                               ║
echo ╚═══════════════════════════════════════════════════════════════╝
echo.
echo  ✅ Deployment folder opened: firebase-deploy
echo  ✅ Firebase Console opened in your browser
echo.
echo ═══════════════════════════════════════════════════════════════
echo.
echo  NOW DO THIS:
echo.
echo  1️⃣  In the BROWSER (Firebase Console):
echo      • Look for "Hosting" page (already open)
echo      • Find upload area or "Deploy" button
echo.
echo  2️⃣  In the EXPLORER WINDOW:
echo      • Press Ctrl+A to select ALL files
echo      • Drag them to the Firebase Console browser
echo.
echo  3️⃣  Click "Deploy" or "Upload" button
echo.
echo  4️⃣  Wait for deployment to complete
echo.
echo ═══════════════════════════════════════════════════════════════
echo.
echo  🎉 Your site will be live at:
echo     https://food-ordering-website-2025.web.app
echo.
echo ═══════════════════════════════════════════════════════════════
echo.
pause
