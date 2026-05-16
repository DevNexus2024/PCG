# GitHub Actions Auto-Deploy Setup Guide

## ✅ Files Created
- `.github/workflows/firebase-hosting-deploy.yml` - GitHub Actions workflow
- `firebase.json` - Firebase Hosting configuration
- `.firebaserc` - Firebase project configuration

---

## 🔧 Setup Steps (Do Once)

### **Step 1: Get Your Firebase Project ID**

1. Go to https://console.firebase.google.com
2. Select your project
3. Click the gear icon ⚙️ next to "Project Overview"
4. Click "Project settings"
5. Copy your **Project ID** (NOT the Project name)
   - Example: `pizza-club-a1b2c3`

---

### **Step 2: Update Configuration Files**

**Update `.firebaserc`:**
```json
{
  "projects": {
    "default": "YOUR-PROJECT-ID-HERE"
  }
}
```

**Update `.github/workflows/firebase-hosting-deploy.yml`:**
- Find line: `projectId: your-firebase-project-id`
- Replace with: `projectId: YOUR-PROJECT-ID-HERE`

---

### **Step 3: Create Firebase Service Account**

1. Go to https://console.firebase.google.com
2. Select your project
3. Click gear icon ⚙️ → **Project settings**
4. Go to **Service accounts** tab
5. Click **Generate new private key**
6. Click **Generate key** (downloads a JSON file)
7. **SAVE THIS FILE SECURELY** - it contains sensitive credentials

---

### **Step 4: Add Secret to GitHub**

1. Go to your GitHub repository
2. Click **Settings** (top right)
3. Click **Secrets and variables** → **Actions** (left sidebar)
4. Click **New repository secret**
5. Name: `FIREBASE_SERVICE_ACCOUNT`
6. Value: Open the JSON file from Step 3 and **paste the entire contents**
7. Click **Add secret**

---

### **Step 5: Push to GitHub**

```powershell
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Add Firebase auto-deploy with GitHub Actions"

# Add remote (replace with your repository URL)
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO.git

# Push to GitHub
git push -u origin main
```

*(If you get an error about "main" branch, try `git push -u origin master` instead)*

---

## 🚀 How It Works

**After setup, every time you push code to GitHub:**

1. GitHub Actions automatically triggers
2. Your website files deploy to Firebase Hosting
3. Your live site updates in ~2 minutes
4. You get a ✅ or ❌ notification

---

## 📱 Manual Deployment (Anytime)

You can also trigger deployment manually:

1. Go to your GitHub repository
2. Click **Actions** tab
3. Click **Deploy to Firebase Hosting** workflow
4. Click **Run workflow** button
5. Click green **Run workflow** button

---

## 🔍 View Deployment Status

**In GitHub:**
- Go to **Actions** tab
- Click on any workflow run to see logs

**In Firebase:**
- Go to **Hosting** in Firebase Console
- See deployment history and live URL

---

## ✅ Your Live URL

After first deployment:
- `https://YOUR-PROJECT-ID.web.app`
- Or custom domain if configured

---

## 🔒 Security Notes

- ✅ Service account JSON is stored securely in GitHub Secrets
- ✅ Never commit the service account JSON to your repository
- ✅ The `.firebaserc` file is safe to commit (only contains project ID)

---

## 🐛 Troubleshooting

**If deployment fails:**

1. Check GitHub Actions logs (Actions tab → Click failed workflow)
2. Verify project ID in `.firebaserc` and workflow file matches Firebase
3. Verify `FIREBASE_SERVICE_ACCOUNT` secret is added correctly
4. Make sure Firebase Hosting is enabled in Firebase Console

---

## 📝 Quick Reference

**Files you need to edit:**
- `.firebaserc` - Add your Firebase project ID
- `.github/workflows/firebase-hosting-deploy.yml` - Add your project ID (line with `projectId:`)

**GitHub Secret to add:**
- Name: `FIREBASE_SERVICE_ACCOUNT`
- Value: Contents of service account JSON file

**Commands to deploy:**
```powershell
git add .
git commit -m "Your update message"
git push
```

That's it! Your site will auto-deploy! 🎉
