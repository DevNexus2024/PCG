# Firebase Database Index Setup for Order Tracking

## ⚠️ CRITICAL: Orders Not Showing in Manage Orders?

**THE PROBLEM**: Your Firebase Database rules likely have read permissions only under `$orderId`, which prevents the admin page from loading all orders at once.

**THE FIX**: 
1. Go to [Firebase Console](https://console.firebase.google.com) → **Realtime Database** → **Rules**
2. Make sure `.read` and `.write` are at the **orders** level (see correct rules below)
3. Click **Publish**
4. Refresh your Manage Orders page - orders should now appear!

---

## Required Index for Real-Time Order Tracking

To enable real-time order tracking queries by userId, you need to add a Firebase Database index.

### Method 1: Add Index via Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project: **food-ordering-website-2025**
3. Go to **Realtime Database** → **Rules** tab
4. Add this index rule:

```json
{
  "rules": {
    "orders": {
      ".indexOn": ["userId", "status", "createdAt"],
      ".read": "auth != null",
      ".write": "auth != null"
    },
    "notifications": {
      "$userId": {
        ".indexOn": ["timestamp", "read"],
        ".read": "auth != null && auth.uid == $userId",
        ".write": "auth != null"
      }
    },
    "users": {
      "$userId": {
        ".read": "auth != null",
        ".write": "auth != null && auth.uid == $userId"
      }
    },
    "menuItems": {
      ".read": "auth != null",
      ".write": "auth != null"
    },
    "categories": {
      ".read": "auth != null",
      ".write": "auth != null"
    }
  }
}
```

5. Click **Publish**

### ❌ WRONG Rules (Orders Won't Show):
```json
{
  "rules": {
    "orders": {
      ".indexOn": ["userId", "status", "createdAt"],
      "$orderId": {
        ".read": "auth != null",    // ❌ TOO NESTED - Can't query all orders
        ".write": "auth != null"
      }
    }
  }
}
```

### ✅ CORRECT Rules (Orders Will Show):
```json
{
  "rules": {
    "orders": {
      ".indexOn": ["userId", "status", "createdAt"],
      ".read": "auth != null",     // ✅ At orders level - Can query all
      ".write": "auth != null"     // ✅ At orders level
    }
  }
}
```

---

### Method 2: Firebase May Prompt You

When you first load the order tracking page, Firebase might show an error in the browser console like:

```
FIREBASE WARNING: Using an unspecified index. Your data will be downloaded and filtered on the client. Consider adding ".indexOn": "userId" at /orders to your security rules for better performance.
```

If you see this, Firebase Console will have a direct link to add the index automatically.

### What Was Fixed

**Issue 1: Field Name Mismatch**
- ❌ Orders saved with: `userId`
- ❌ Queries looking for: `customerId`
- ✅ Fixed: Both now use `userId`

**Issue 2: Status Field Mismatch**
- ❌ Orders saved with: `orderStatus`
- ❌ System expecting: `status`
- ✅ Fixed: Now uses `status`

**Issue 3: Timestamp Format**
- ❌ Orders saved with: ISO string `"2026-04-22T10:30:00.000Z"`
- ❌ Firebase queries need: Numeric timestamp `1745318400000`
- ✅ Fixed: Now uses `Date.now()`

### Testing the Fix

**FIRST: Verify Order Was Actually Saved**
1. Go to Firebase Console → Realtime Database → Data tab
2. Look for the `orders` node
3. Expand it - you should see your order(s) with IDs like `-O1J2K3L4M5N6O7P8Q9R`
4. Click on an order to see its data
5. Verify it has fields: `userId`, `status`, `createdAt`, `customerName`, etc.
6. If orders node is empty or doesn't exist, the problem is in payment.js (order not saving)
7. If orders exist but don't show in Manage Orders, the problem is Firebase rules (see above)

**THEN: Test Everything**

1. **Clear any old test orders** (optional but recommended):
   - Go to Firebase Console → Realtime Database
   - Delete old orders under `/orders` node if they exist
   - This removes orders with the old field structure

2. **Place a new test order**:
   - Login as a customer
   - Add items to cart
   - Go through checkout and place order
   - Verify order appears in Firebase Database with correct fields:
     ```json
     {
       "userId": "abc123...",
       "status": "pending",
       "createdAt": 1745318400000,
       ...
     }
     ```

3. **Check order tracking page**:
   - Go to Order Tracking page
   - You should see your order with timeline
   - Status should show "Pending"

4. **Test real-time updates**:
   - Keep Order Tracking page open in one browser tab
   - Open Manage Orders (admin) in another tab/window
   - Login as admin/supervisor
   - Change order status from "Pending" → "Confirmed"
   - **Watch the Order Tracking page** - it should update instantly!

5. **Test delivered notification**:
   - Continue changing status: Confirmed → Preparing → Ready → Delivered
   - When you click "Delivered" in Manage Orders:
     - Order Tracking page timeline should complete
     - Notification should pop up with celebration emoji 🎉
     - Browser notification should appear
     - Sound should play

### Troubleshooting

**Q: Orders not showing up in Manage Orders page (MOST COMMON ISSUE)**
- **Problem**: Firebase Database rules have `.read` permissions only under `$orderId`, preventing bulk queries
- **Solution**: Move `.read` and `.write` to the `orders` level (see rules above)
- **How to verify**: 
  1. Go to Firebase Console → Realtime Database → Rules tab
  2. Make sure `.read: "auth != null"` is directly under `"orders": {`, not nested under `$orderId`
  3. Publish the rules
  4. Refresh the Manage Orders page - orders should now appear
- **Check browser console**: You might see error: `"Permission denied"` or `"Client doesn't have permission to access the desired data"`

**Q: Order tracking page shows "No Orders Yet" but I placed an order**
- Check browser console for Firebase errors
- Verify the index is added in Firebase Console
- Make sure you're logged in with the same account that placed the order
- Check Firebase Database → orders node to see if order exists

**Q: Orders not updating in real-time**
- Verify Firebase Database Rules allow read access to orders
- Check browser console for errors
- Make sure index is added (see Method 1 above)
- Try refreshing both pages

**Q: Notifications not appearing**
- Check browser console for errors
- Verify Firebase path: `/notifications/{userId}`
- Make sure notification permission is granted in browser
- Check if browser is blocking notifications

**Q: Still see old orders with wrong field names**
- Option 1: Delete old orders from Firebase Console
- Option 2: Update payment.js logic to handle both formats
- Recommended: Delete old test orders and create new ones

### Firebase Database Structure (Correct Format)

```
orders/
  {orderId}/
    userId: "abc123xyz" ✅
    status: "pending" ✅
    createdAt: 1745318400000 ✅
    customerName: "John Doe"
    customerEmail: "john@example.com"
    items: [...]
    total: 150
    paymentMethod: "mtn_mobile_money"
    ...

notifications/
  {userId}/
    {notificationId}/
      type: "order_delivered"
      title: "🎉 Order Delivered!"
      message: "..."
      timestamp: 1745318500000
      read: false
```

### Summary of Changes Made

✅ **order-tracking.js**: Changed `customerId` → `userId` in queries
✅ **manage-orders.js**: Changed `order.customerId` → `order.userId` in notifications
✅ **payment.js**: Changed `orderStatus` → `status` and `ISO string` → `Date.now()`

The system should now work perfectly! 🚀
