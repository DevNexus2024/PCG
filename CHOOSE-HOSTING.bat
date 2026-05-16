@echo off
color 0A
cls
echo.
echo ╔═══════════════════════════════════════════════════════════════╗
echo ║                                                               ║
echo ║            🌐 FREE HOSTING - CHOOSE YOUR OPTION 🌐          ║
echo ║                                                               ║
echo ╚═══════════════════════════════════════════════════════════════╝
echo.
echo  Firebase giving you trouble? Try these FREE alternatives!
echo.
echo ═══════════════════════════════════════════════════════════════
echo.
echo  [1] 🥇 NETLIFY - Drag ^& Drop (EASIEST!)
echo      → 2 minutes, zero setup
echo      → Just drag files and go!
echo.
echo  [2] 📚 View All Options
echo      → See comparison of 5+ free hosts
echo      → Vercel, GitHub Pages, Cloudflare, etc.
echo.
echo  [3] 🔧 Try Firebase Again
echo      → Manual deployment guide
echo.
echo  [4] ❌ Exit
echo.
echo ═══════════════════════════════════════════════════════════════
echo.
set /p choice="  Enter your choice (1-4): "

if "%choice%"=="1" goto netlify
if "%choice%"=="2" goto alloptions
if "%choice%"=="3" goto firebase
if "%choice%"=="4" goto end
echo.
echo  ❌ Invalid choice. Please try again.
timeout /t 2 >nul
goto :eof

:netlify
cls
echo.
echo ═══════════════════════════════════════════════════════════════
echo  🚀 Launching Netlify Deployment...
echo ═══════════════════════════════════════════════════════════════
echo.
timeout /t 1 >nul
call DEPLOY-NETLIFY.bat
goto end

:alloptions
cls
echo.
echo ═══════════════════════════════════════════════════════════════
echo  📚 Opening Free Hosting Options Guide...
echo ═══════════════════════════════════════════════════════════════
echo.
timeout /t 1 >nul
start notepad FREE_HOSTING_OPTIONS.md
timeout /t 2 >nul
start HOSTING_QUICK_START.txt
echo.
echo  ✅ Guides opened!
echo.
echo  Quick recommendations:
echo  • Netlify → Easiest (drag ^& drop)
echo  • Vercel → Fast (GitHub integration)
echo  • GitHub Pages → Simple (if you use GitHub)
echo.
pause
goto end

:firebase
cls
echo.
echo ═══════════════════════════════════════════════════════════════
echo  🔥 Opening Firebase Deployment Guides...
echo ═══════════════════════════════════════════════════════════════
echo.
timeout /t 1 >nul
start notepad FIREBASE_DEPLOY_MANUAL.md
echo.
echo  ✅ Manual deployment guide opened!
echo.
echo  OR run: DEPLOY-NOW.bat
echo     (Prepares files + opens Firebase Console)
echo.
pause
goto end

:end
cls
echo.
echo ╔═══════════════════════════════════════════════════════════════╗
echo ║                                                               ║
echo ║                  ✅ READY TO GO LIVE! ✅                     ║
echo ║                                                               ║
echo ╚═══════════════════════════════════════════════════════════════╝
echo.
echo  💡 Remember: All options are 100%% FREE!
echo.
echo  🎯 Fastest way: Run DEPLOY-NETLIFY.bat
echo.
echo  🔥 Your Firebase features (Auth, Database, Storage) will
echo     keep working no matter where you host!
echo.
echo ═══════════════════════════════════════════════════════════════
echo.
pause
