# Image Upload Fix Guide
**Date:** May 16, 2026

## What Was Fixed

### 1. **Image Upload with Retry Logic**
- Automatic retry up to 3 times if upload fails
- 1-second delay between retries
- Better error messages showing which attempt failed

### 2. **File Validation**
- Only accepts valid image types: JPEG, PNG, GIF, WebP
- Maximum file size: 5MB
- Real-time validation before upload starts

### 3. **Better Image Display**
- Improved fallback handling when images are missing
- Lazy loading for better performance
- Better error handling for broken image URLs
- Logo used as fallback for items without images

### 4. **Enhanced Metadata**
Images now store:
- Upload timestamp
- Original filename
- Category (for menu items)
- Content type

## Files Updated

1. **js/manage-categories.js**
   - Added file validation (type & size)
   - Added retry logic for uploads
   - Improved error messages
   - Sanitized filenames

2. **js/manage-menu-items.js**
   - Added file validation (type & size)
   - Added retry logic for uploads
   - Improved error messages
   - Sanitized filenames

3. **js/menu.js**
   - Better fallback image handling
   - Validation for temporary URLs
   - Lazy loading for images
   - Better error handling

## How to Test

### Testing Image Upload in Categories

1. **Go to Manage Categories** (admin dashboard → Manage Categories)

2. **Click "Add Category"**

3. **Upload Test:**
   - Try uploading a valid image (PNG/JPEG under 5MB)
   - Should see green border on preview
   - Check browser console (F12) for upload progress
   - Look for: ✅ Image uploaded successfully

4. **Error Test:**
   - Try uploading a PDF or text file
   - Should see error: "Please select a valid image file"
   - Try uploading image over 5MB
   - Should see error: "Image size must be less than 5MB"

### Testing Image Upload in Menu Items

1. **Go to Manage Menu Items** (admin dashboard → Manage Menu Items)

2. **Click "Add Menu Item"**

3. **Upload Test:**
   - Upload valid image
   - Check console for: `Image upload attempt 1/3`
   - Should see: ✅ Image uploaded successfully
   - Save item and check if image appears in table

4. **View in Menu:**
   - Go to Menu page
   - Verify uploaded images display correctly
   - Items without images should show company logo

### Checking Firebase Storage

1. **Open Firebase Console:**
   - Go to https://console.firebase.google.com
   - Select your project: food-ordering-website-2025

2. **Navigate to Storage:**
   - Click "Storage" in left menu
   - Should see two folders:
     - `categories/` - category images
     - `menuItems/` - menu item images

3. **Verify Uploads:**
   - Click on any folder
   - Should see files named like: `1715875200000_pizza.jpg`
   - Click file to see metadata (timestamp, original name, etc.)

## Console Messages to Look For

### Successful Upload:
```
Image upload attempt 1/3
✅ Image uploaded successfully: https://firebasestorage...
```

### Failed Upload with Retry:
```
Image upload attempt 1/3
❌ Upload attempt 1 failed: FirebaseError...
Image upload attempt 2/3
✅ Image uploaded successfully: https://firebasestorage...
```

### Complete Failure:
```
Image upload attempt 1/3
❌ Upload attempt 1 failed: FirebaseError...
Image upload attempt 2/3
❌ Upload attempt 2 failed: FirebaseError...
Image upload attempt 3/3
❌ Upload attempt 3 failed: FirebaseError...
Alert: "Failed to upload image after 3 attempts..."
```

## Common Issues & Solutions

### Issue 1: "Failed to upload image after 3 attempts"
**Possible Causes:**
- Firebase Storage rules not configured
- No internet connection
- File too large (but should be caught by validation)

**Solution:**
- Check Firebase Storage rules in Firebase Console
- Verify internet connection
- Check browser console for specific error

### Issue 2: Images Not Displaying
**Possible Causes:**
- Old cached data
- Image URL expired
- CORS issues

**Solution:**
- Hard refresh page (Ctrl+Shift+R)
- Check image URL in Firebase Storage
- Verify Storage rules allow read access

### Issue 3: "Please select a valid image file"
**This is expected behavior** - you're trying to upload non-image file

**Valid formats:**
- JPEG/JPG
- PNG
- GIF
- WebP

### Issue 4: "Image size must be less than 5MB"
**This is expected behavior** - file too large

**Solution:**
- Compress image before uploading
- Use online tools like TinyPNG or ImageOptim
- Or take lower resolution photo

## Firebase Storage Rules Reference

Your storage should have rules like:
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /categories/{fileName} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    match /menuItems/{fileName} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

## Performance Improvements

1. **Lazy Loading** - Images load only when scrolling into view
2. **Retry Logic** - Handles temporary network issues
3. **File Validation** - Prevents unnecessary upload attempts
4. **Better Caching** - Browsers cache images efficiently

## Need Help?

If images still don't work:
1. Open browser console (F12)
2. Take screenshot of any errors
3. Check Firebase Storage rules
4. Verify internet connection
5. Try different image file
