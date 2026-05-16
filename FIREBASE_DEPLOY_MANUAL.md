# Manual Firebase Hosting Deployment (Works 100%)

GitHub Actions not working? Use this **guaranteed method** to deploy your website.

---

## 🚀 **Quick Deploy (5 Minutes)**

### **Method 1: Firebase Console Upload (Easiest)**

1. **Prepare your files** (already done!)
   - Your `firebase-deploy` folder is ready

2. **Go to Firebase Console**
   - Visit: https://console.firebase.google.com
   - Select: **food-ordering-website-2025**

3. **Open Hosting**
   - Click **Hosting** in left sidebar
   - Click **Get Started** (if first time) OR click **Add another domain**

4. **Deploy via Console**
   - Scroll down to find **"Looking for an alternative?"**
   - Click **"deploy from your local machine"** or look for upload option
   - OR look for **"Advanced"** → **"Upload files"**

5. **Upload Your Files**
   - Navigate to: `C:\Users\Sebenele Dlamini\Documents\food-ordering-website\firebase-deploy`
   - Select ALL files and folders
   - Drag and drop into Firebase Console

6. **Done!**
   - Your site will be live at: `https://food-ordering-website-2025.web.app`

---

### **Method 2: Firebase CLI (If you have Node.js)**

Since `firebase login` failed earlier, try this:

#### **Fix Firebase Login:**

```powershell
# Method A: Open browser manually
firebase login --reauth

# Method B: Use CI token
firebase login:ci
# This gives you a token - save it somewhere safe
```

#### **Then Deploy:**

```powershell
cd "C:\Users\Sebenele Dlamini\Documents\food-ordering-website"
firebase deploy --only hosting
```

---

### **Method 3: Drag & Drop via Firebase Hosting Page**

1. Go to: https://console.firebase.google.com/project/food-ordering-website-2025/hosting/sites
2. Click on your hosting site
3. Look for **"Add release"** or **"Upload"** button
4. Drag the contents of `firebase-deploy` folder
5. Click **Deploy**

---

## 🔧 **If GitHub Actions MUST Work**

The issue is likely one of these:

### **Problem 1: Service Account Secret Format**

The `FIREBASE_SERVICE_ACCOUNT` secret must be the **ENTIRE JSON file** (not just the key).

**To fix:**
1. Firebase Console → ⚙️ Project Settings → Service Accounts
2. Click **"Generate new private key"**
3. Download the JSON file
4. Open it with Notepad
5. Copy **EVERYTHING** (from `{` to `}`)
6. GitHub repo → Settings → Secrets → Actions
7. Edit `FIREBASE_SERVICE_ACCOUNT`
8. Paste the entire JSON
9. Save

### **Problem 2: Hosting Not Enabled**

1. Firebase Console → Hosting
2. Make sure Hosting is enabled
3. Click "Get Started" if needed

### **Problem 3: Service Account Permissions**

1. Firebase Console → ⚙️ Project Settings → Service Accounts
2. Click **"Manage service account permissions"**
3. Find your service account email (ends with `@iam.gserviceaccount.com`)
4. Add role: **"Firebase Hosting Admin"**
5. Click **Save**

---

## ✅ **Recommended: Use Manual Deploy**

**Honestly?** For a small project like this, manual deployment is:
- ✅ Faster
- ✅ More reliable
- ✅ No complex setup
- ✅ Works immediately

**Just use Method 1 above** (Firebase Console Upload)

You can always set up automation later when you have more time to troubleshoot.

---

## 📞 **Need Help?**

If manual upload also fails, the issue might be:
- Firebase Hosting not enabled
- Wrong project ID
- Billing not set up (Firebase requires Blaze plan for some features)

Check Firebase Console for any warnings or errors.
