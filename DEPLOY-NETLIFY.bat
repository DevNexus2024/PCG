@echo off
cls
echo.
echo ╔═══════════════════════════════════════════════════════════════╗
echo ║                                                               ║
echo ║           🚀 INSTANT DEPLOY - NETLIFY DROP 🚀               ║
echo ║                                                               ║
echo ║              (Easiest Way - No Signup Needed!)               ║
echo ║                                                               ║
echo ╚═══════════════════════════════════════════════════════════════╝
echo.
echo This will:
echo   1. Prepare your files
echo   2. Open Netlify Drop (instant deploy)
echo   3. Open your deployment folder
echo   4. You drag files and DROP!
echo.
echo Your site goes live in 10 SECONDS!
echo.
pause
cls

echo.
echo 📦 Preparing deployment files...
echo.

REM Clean and create deployment folder
if exist netlify-deploy rmdir /s /q netlify-deploy 2>nul
mkdir netlify-deploy 2>nul

REM Copy files
echo   → Copying HTML pages...
copy /Y *.html netlify-deploy\ >nul 2>&1

echo   → Copying JavaScript...
copy /Y *.js netlify-deploy\ >nul 2>&1

echo   → Copying configuration files...
copy /Y manifest.json netlify-deploy\ >nul 2>&1
copy /Y sw.js netlify-deploy\ >nul 2>&1

echo   → Copying CSS folder...
xcopy /E /I /Y css netlify-deploy\css\ >nul 2>&1

echo   → Copying JS folder...
xcopy /E /I /Y js netlify-deploy\js\ >nul 2>&1

echo   → Copying images folder...
xcopy /E /I /Y images netlify-deploy\images\ >nul 2>&1

echo.
echo ✅ Files ready!
echo.

echo 🌐 Opening Netlify Drop...
timeout /t 2 >nul
start https://app.netlify.com/drop

echo.
echo 📁 Opening deployment folder...
timeout /t 1 >nul
start explorer "%cd%\netlify-deploy"

cls
echo.
echo ╔═══════════════════════════════════════════════════════════════╗
echo ║                                                               ║
echo ║                  📋 SUPER EASY STEPS 📋                      ║
echo ║                                                               ║
echo ╚═══════════════════════════════════════════════════════════════╝
echo.
echo  ✅ Browser opened: Netlify Drop page
echo  ✅ Explorer opened: netlify-deploy folder
echo.
echo ═══════════════════════════════════════════════════════════════
echo.
echo  DRAG AND DROP (That's it!):
echo.
echo  1️⃣  In the EXPLORER window:
echo      • Press Ctrl+A (select all files)
echo.
echo  2️⃣  DRAG the files to the BROWSER
echo      • Drop them on the Netlify Drop page
echo.
echo  3️⃣  Wait 10 seconds
echo      • Netlify processes and deploys
echo.
echo  4️⃣  DONE! 🎉
echo      • Copy the URL Netlify gives you
echo      • Share it with anyone!
echo.
echo ═══════════════════════════════════════════════════════════════
echo.
echo  🌍 Your site will be LIVE at:
echo     https://random-name-123456.netlify.app
echo.
echo     (You can customize the name later if you sign up)
echo.
echo ═══════════════════════════════════════════════════════════════
echo.
echo  💡 TIP: To get a custom name like "pizza-club.netlify.app"
echo      → Sign up on Netlify (free, 30 seconds)
echo      → Claim your custom subdomain
echo.
echo ═══════════════════════════════════════════════════════════════
echo.
pause
