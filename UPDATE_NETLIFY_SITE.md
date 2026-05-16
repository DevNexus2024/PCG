# How to Update Your Existing Netlify Site

Your site: **leafy-frangipane-09ecc4.netlify.app**

## ✅ What Was Added
- Mobile menu sidebar (slides in from left)
- Logout button in mobile menu
- User email display in mobile menu
- Quick links: Home, Menu, Orders, View Cart
- Windows GUI styling maintained for desktop app

## 🔄 Quick Update (2 Minutes)

### Option 1: Drag & Drop Update (Easiest)

1. **Go to your Netlify site:**
   - Visit https://app.netlify.com
   - Login with your account
   - Click on your site: **leafy-frangipane-09ecc4**

2. **Navigate to Deploys:**
   - Click the "Deploys" tab at the top

3. **Drag and Drop:**
   - Scroll down to find the drag & drop area
   - Or look for "Need to update your site? Drag and drop your site output folder here"
   - Open the `netlify-deploy` folder (already opened by the script)
   - Select ALL files (Ctrl+A)
   - Drag them to the Netlify page

4. **Wait for deployment:**
   - Netlify will process your files (takes ~20-30 seconds)
   - Your site will be live at the same URL: leafy-frangipane-09ecc4.netlify.app

### Option 2: Using Netlify CLI (If you have it installed)

```bash
cd netlify-deploy
netlify deploy --prod
```

## 📱 Testing the Mobile Menu

1. **On Desktop:**
   - Open your site: leafy-frangipane-09ecc4.netlify.app
   - Resize browser to mobile size (F12, toggle device toolbar)
   - Click the hamburger menu (≡ icon)
   - Mobile sidebar should slide in from the left

2. **On Mobile Device:**
   - Open your site on your phone
   - Tap the hamburger menu
   - You should see:
     - Your email at the top
     - Browse Menu
     - My Orders
     - Home
     - View Cart
     - **Logout button** at the bottom

## 🎯 What Each Button Does

- **Browse Menu** → menu.html (current page)
- **My Orders** → order-tracking.html (track orders)
- **Home** → index.html (homepage)
- **View Cart** → Opens cart sidebar
- **Logout** → Signs out and goes to login page

## ⚡ Important Notes

- The mobile menu only appears on mobile devices (screens < 768px)
- On desktop, the regular navigation bar is shown
- The desktop app (launch-desktop-app.bat) maintains Windows GUI styling
- Logout asks for confirmation before signing out
- User email is automatically loaded from Firebase Auth

## 🔥 If Something Goes Wrong

1. **Clear your browser cache:** Ctrl+Shift+Delete
2. **Hard refresh:** Ctrl+Shift+R
3. **Check Firebase:** Make sure you're logged in
4. **Console errors:** Press F12, check Console tab for errors

## 📂 Files Updated

- `menu.html` - Added mobile menu sidebar HTML and JavaScript
- `css/style.css` - Added mobile menu styling
- `netlify-deploy/` folder - Ready to deploy with all updates

## 🎉 You're Done!

After deploying, your mobile users will have easy access to the logout button in the left sidebar!
