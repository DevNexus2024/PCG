# 📱 PWA Quick Test Checklist

## Before Testing
- [ ] All HTML files updated with PWA meta tags
- [ ] manifest.json created
- [ ] sw.js (Service Worker) created
- [ ] pwa-install.js created
- [ ] App icons created (8 sizes)
- [ ] Desktop Mode script loaded (js/desktop-mode.js)

## Testing Steps

### 1. Start Test Server
```
Double-click: TEST-PWA.bat
```
Or manually:
```powershell
python -m http.server 8000
```

### 2. Open in Browser
```
http://localhost:8000
```

### 3. Check DevTools (F12)
**Application Tab:**
- [ ] Manifest loads without errors
- [ ] All 8 icons appear in manifest
- [ ] Service Worker is "activated and running"
- [ ] Cache Storage shows "pizza-club-v1.0.0"

**Console Tab:**
- [ ] No errors
- [ ] See: "🚀 PWA Install handler initialized"
- [ ] See: "✅ Service Worker registered"

### 4. Test Install Banner
- [ ] Yellow banner appears at bottom
- [ ] Shows "📱 Install Pizza Club App"
- [ ] "Install" button works
- [ ] "×" dismiss button works
- [ ] Banner doesn't reappear after dismissal

### 5. Install the App
**Desktop (Chrome/Edge):**
- [ ] Click install icon in address bar
- [ ] Or click "Install" in banner
- [ ] App installs successfully
- [ ] App appears in Start Menu

**Mobile (Android):**
- [ ] Open http://YOUR-COMPUTER-IP:8000
- [ ] Tap "Install App" banner
- [ ] App installs to home screen
- [ ] Icon shows on home screen

### 6. Test Installed App
- [ ] Launch from Start Menu/Home Screen
- [ ] Splash screen appears briefly
- [ ] Opens in standalone mode (no browser UI)
- [ ] Red theme color visible
- [ ] All pages load correctly

### 7. Test Offline Mode
**In DevTools:**
- [ ] Open Application → Service Workers
- [ ] Check "Offline" checkbox
- [ ] Reload page
- [ ] Site still loads (from cache)
- [ ] Images load
- [ ] CSS/JS work

### 8. Test Desktop Mode (Windows GUI)
- [ ] Launch via launch-desktop-app.bat
- [ ] Windows GUI styling applies
- [ ] Gray background, beveled buttons
- [ ] Sharp corners (no rounded)
- [ ] Classic Windows look

### 9. Test Mobile Features
**On Mobile Device:**
- [ ] Add to Home Screen works
- [ ] Icon appears on home screen
- [ ] Tap icon to launch
- [ ] Full-screen mode (no browser bar)
- [ ] Status bar is red (#DC3545)

### 10. Test App Shortcuts (Android/Chrome)
- [ ] Long-press app icon
- [ ] See 3 shortcuts: Menu, Track Order, Account
- [ ] Each shortcut opens correct page

## What Success Looks Like

### ✅ Install Banner
```
╔══════════════════════════════════════════════╗
║ 📱 Install Pizza Club App                    ║
║ Get quick access and offline support!        ║
║ [Install]                               [×]  ║
╚══════════════════════════════════════════════╝
```

### ✅ Splash Screen
- White background
- Red theme (#DC3545)
- Company logo centered
- Shows for 1-2 seconds
- Fades to app

### ✅ Standalone Mode
- No browser address bar
- No browser tabs
- Full-screen content
- Looks like native app
- App icon in taskbar/dock

### ✅ Offline Support
- Page loads without internet
- Cached assets available
- Images display
- Navigation works
- "Update available" banner if online returns

## Troubleshooting

### Banner Not Showing
**Problem:** Install banner doesn't appear
**Solutions:**
1. Check Console (F12) for errors
2. Verify Service Worker is registered
3. Make sure manifest.json loads (no 404)
4. Try incognito/private window
5. Clear cache and reload

### Service Worker Fails
**Problem:** Service Worker not registering
**Solutions:**
1. Check sw.js exists in root folder
2. Verify no syntax errors in sw.js
3. Check Console for error messages
4. Must use localhost or HTTPS
5. Clear all registrations:
```javascript
navigator.serviceWorker.getRegistrations().then(
    r => r.forEach(reg => reg.unregister())
);
```

### Icons Not Loading
**Problem:** Icons show as broken images
**Solutions:**
1. Verify files exist: images/icons/icon-*.png
2. Check file names match manifest.json
3. Confirm 8 files present (72, 96, 128, 144, 152, 192, 384, 512)
4. Reload manifest in DevTools

### Can't Install on iPhone
**Problem:** Install prompt doesn't appear
**Explanation:** iOS Safari doesn't show automatic install prompts
**Solution:**
1. Open in Safari (not Chrome)
2. Tap Share button (box with arrow)
3. Scroll down, tap "Add to Home Screen"
4. Tap "Add"
5. App appears on home screen

### Desktop GUI Not Applying
**Problem:** Windows GUI styles not showing
**Solutions:**
1. Launch via launch-desktop-app.bat (not browser)
2. Check URL has ?desktop=true parameter
3. Verify js/desktop-mode.js is loaded
4. Check css/windows-gui.css exists
5. Clear browser cache

## Testing Checklist Summary

| Feature | Test Method | Expected Result |
|---------|-------------|-----------------|
| Install Banner | Open website | Yellow banner at bottom |
| Service Worker | DevTools → Application | Status: "activated and running" |
| Manifest | DevTools → Manifest | All icons visible, no errors |
| Cache | DevTools → Cache Storage | "pizza-club-v1.0.0" present |
| Install App | Click Install button | App installs, appears in Start Menu |
| Splash Screen | Launch installed app | Red splash with logo |
| Offline Mode | DevTools → Offline | Site loads without internet |
| App Shortcuts | Long-press icon | 3 shortcuts appear |
| Desktop Mode | launch-desktop-app.bat | Windows GUI styling |
| Mobile Install | Add to Home Screen | Icon on home screen |

## Advanced Testing

### Performance Test
1. Open Lighthouse (DevTools → Lighthouse)
2. Select "Progressive Web App" category
3. Click "Analyze"
4. Score should be 90+ for PWA

### Network Test
1. DevTools → Network tab
2. Check "Disable cache"
3. Reload page
4. Verify Service Worker serves cached assets
5. Check "(from ServiceWorker)" in Size column

### Storage Test
1. DevTools → Application → Storage
2. Check "Cache Storage" size
3. Should be < 10MB initially
4. Grows as users browse

## Post-Test Actions

### If Everything Works:
✅ Mark PWA implementation complete
✅ Deploy to production (HTTPS required)
✅ Test on real mobile devices
✅ Share install link with users

### If Issues Found:
1. Check PWA_IMPLEMENTATION_GUIDE.md for solutions
2. Review Console errors
3. Verify all files are in correct locations
4. Test in different browsers
5. Clear all caches and retry

## Browser Compatibility Test

Test in multiple browsers:
- [ ] Chrome (Desktop)
- [ ] Edge (Desktop)
- [ ] Firefox (Desktop)
- [ ] Chrome (Android)
- [ ] Safari (iOS)
- [ ] Samsung Internet (Android)

## Final Verification

### Required Files Present:
```
✓ manifest.json
✓ sw.js
✓ js/pwa-install.js
✓ js/desktop-mode.js
✓ images/icons/icon-72x72.png
✓ images/icons/icon-96x96.png
✓ images/icons/icon-128x128.png
✓ images/icons/icon-144x144.png
✓ images/icons/icon-152x152.png
✓ images/icons/icon-192x192.png
✓ images/icons/icon-384x384.png
✓ images/icons/icon-512x512.png
```

### All HTML Pages Updated:
```
✓ index.html
✓ menu.html
✓ login.html
✓ signup.html
✓ delivery.html
✓ payment.html
✓ admin-dashboard.html
✓ accountant-dashboard.html
✓ manage-orders.html
✓ manage-menu-items.html
✓ manage-categories.html
✓ financial-reports.html
✓ sales-reports.html
✓ revenue-analysis.html
✓ order-tracking.html
✓ forgot-password.html
✓ fix-role.html
```

## Success Criteria

PWA is successful when:
1. ✅ Banner appears automatically on first visit
2. ✅ App can be installed with one click
3. ✅ Installed app works offline
4. ✅ Splash screen shows company branding
5. ✅ App looks and feels like native app
6. ✅ No console errors
7. ✅ Lighthouse PWA score > 90
8. ✅ Works on desktop and mobile

---

**Ready to Test?** Run `TEST-PWA.bat` and follow this checklist!
**Need Help?** See `PWA_IMPLEMENTATION_GUIDE.md` for detailed troubleshooting.

**Date:** May 14, 2026
**Status:** Ready for Testing
