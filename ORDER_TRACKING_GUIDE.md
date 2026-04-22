# Order Tracking System - User Guide

## Overview
The Order Tracking System provides real-time updates on customer orders, syncing instantly between the admin dashboard and customer-facing pages.

## Features

### 1. Real-Time Order Tracking
- **Automatic Updates**: Order status changes are reflected instantly without page refresh
- **Firebase Real-Time Database**: Uses Firebase listeners for live synchronization
- **Visual Progress Timeline**: Beautiful animated timeline showing order progress

### 2. Order Status Flow
Orders progress through these stages:
1. **Pending** (⏳) - Order placed, awaiting confirmation
2. **Confirmed** (✅) - Order accepted by restaurant
3. **Preparing** (🔥) - Food is being prepared
4. **Ready** (📦) - Order ready for pickup/delivery
5. **Delivered** (✅) - Order has been delivered to customer

### 3. Notification System
- **Delivered Notifications**: Special celebration notification when order is delivered
- **Browser Notifications**: Desktop notifications if permission granted
- **In-Page Notifications**: Animated popup notifications
- **Notification Bell**: Updates notification count in menu page
- **Sound Alerts**: Plays notification sound for important updates

## How It Works

### For Customers (Order Tracking Page)

1. **Access**: Click "Orders" button in navigation or go to `order-tracking.html`
2. **Authentication**: Must be logged in to view orders
3. **Real-Time Updates**: 
   - Page automatically updates when admin changes order status
   - No need to refresh the page
   - Visual timeline animates to show progress

4. **Order Information Displayed**:
   - Order ID and date
   - Current status with visual badge
   - Progress timeline with timestamps
   - Order type (Delivery/Pickup)
   - Number of items
   - Payment method
   - Total amount
   - Delivery address (if applicable)
   - Complete list of ordered items

### For Admin/Staff (Manage Orders Page)

1. **Status Updates**: Admin/Cashier/Supervisor updates order status
2. **Automatic Notifications**: When status changes:
   - Customer receives notification in their notifications panel
   - If status = "Delivered", special celebration notification is sent
3. **Real-Time Sync**: Customer's order tracking page updates instantly

## Technical Implementation

### Files Created

1. **order-tracking.html**
   - Beautiful, responsive order tracking interface
   - Card-based design with animated timeline
   - Empty state for users with no orders
   - Loading states

2. **js/order-tracking.js**
   - Real-time Firebase listeners
   - Order display logic
   - Timeline visualization
   - Notification handling
   - Delivered order detection

### Firebase Database Structure

```
orders/
  {orderId}/
    customerId: "user123"
    customerName: "John Doe"
    status: "delivered"
    items: [...]
    total: 150
    createdAt: timestamp
    confirmedAt: timestamp
    preparingAt: timestamp
    readyAt: timestamp
    deliveredAt: timestamp
    
notifications/
  {customerId}/
    {notificationId}/
      type: "order_delivered"
      title: "🎉 Order Delivered!"
      message: "Order #ABC123: Your order has been delivered!"
      orderId: "ABC123"
      timestamp: timestamp
      read: false
```

### Real-Time Listeners

**Order Tracking Page**:
```javascript
// Listen for all changes to user's orders
ordersRef.orderByChild('customerId').equalTo(userId).on('value', callback);

// Listen specifically for delivered status
ordersRef.orderByChild('customerId').equalTo(userId).on('child_changed', callback);
```

**Manage Orders Page**:
```javascript
// Updates order status and sends notification
await orderRef.update({ status: 'delivered', deliveredAt: timestamp });
await sendCustomerNotification(customerId, notification);
```

## Testing the System

### Test Scenario 1: Complete Order Flow

1. **Customer Side**:
   - Login as customer
   - Place an order on menu page
   - Go to Order Tracking page
   - See order in "Pending" status

2. **Admin Side**:
   - Login as admin/supervisor/cashier
   - Go to Manage Orders page
   - Click "Confirm" on the pending order

3. **Customer Side (automatically updates)**:
   - Order tracking page updates to "Confirmed"
   - Notification appears in notification bell
   - Timeline animates to show progress

4. **Continue Updates**:
   - Admin: Click "Preparing" → Customer sees instant update
   - Admin: Click "Ready" → Customer sees instant update
   - Admin: Click "Delivered" → Customer sees:
     - Timeline completes
     - Special "🎉 Order Delivered!" notification
     - Browser notification (if allowed)
     - Sound plays
     - Status badge turns green

### Test Scenario 2: Multiple Orders

1. Place 3 orders as customer
2. Admin updates each to different statuses
3. Verify all orders show correctly on tracking page
4. Each should have its own timeline showing correct progress

### Test Scenario 3: Delivered Notification

1. Have an order at "Ready" status
2. Customer opens Order Tracking page
3. Admin clicks "Delivered" button
4. Customer should see:
   - Instant status update on page
   - Celebration notification popup
   - Browser notification (if permission granted)
   - Notification count increases in menu page

## Browser Notification Permissions

If browser notifications don't work:

1. Check browser permission: Click lock icon in address bar
2. Allow notifications for the site
3. Refresh the page
4. Try updating order status again

## Customization Options

### Change Notification Sound
Edit line in `order-tracking.js`:
```javascript
const audio = new Audio('path/to/your/sound.mp3');
```

### Adjust Timeline Steps
Modify `steps` array in `order-tracking.js` to add/remove stages.

### Customize Notification Messages
Edit `notificationMessages` in `manage-orders.js`.

### Style Changes
- Timeline colors: Edit `.timeline-progress` CSS in `order-tracking.html`
- Status badges: Edit `.status-*` classes
- Cards: Edit `.order-card` CSS

## Integration with Existing Features

### Menu Page Button
The "Orders" button in menu navigation links to order-tracking page:
```javascript
setupOrderTrackingButton() // in menu.js
```

### Notification Panel
Delivered notifications appear in the notification panel on menu page.

### User Authentication
Order tracking requires login - redirects to login page if not authenticated.

## Troubleshooting

### Orders not updating in real-time
- Check Firebase connection
- Verify customerId is stored correctly in orders
- Check browser console for errors
- Ensure Firebase Database rules allow read access

### Notifications not appearing
- Check Firebase Database rules for notifications path
- Verify customerId matches between order and notification
- Check browser console for errors
- Ensure user is logged in

### Delivered notification not showing
- Verify order status changes from "ready" to "delivered"
- Check `child_changed` listener is active
- Verify notification permission is granted
- Check browser console for logs

## Firebase Database Rules Required

```json
{
  "rules": {
    "orders": {
      ".read": "auth != null",
      "$orderId": {
        ".write": "auth != null"
      }
    },
    "notifications": {
      "$userId": {
        ".read": "auth != null && auth.uid == $userId",
        ".write": "auth != null"
      }
    }
  }
}
```

## Performance Considerations

- Real-time listeners are automatically managed by Firebase
- Listeners are cleaned up when page is closed
- Only user's own orders are loaded (filtered by customerId)
- Notifications are indexed by userId for fast queries

## Future Enhancements

Possible additions:
- Order cancellation from customer side
- Live delivery tracking map
- Estimated delivery time countdown
- Order rating after delivery
- Reorder functionality
- Order history filtering
- Export order receipt as PDF

## Summary

✅ Real-time order status updates
✅ Beautiful animated timeline
✅ Special delivered notifications
✅ Browser and in-page notifications
✅ Sound alerts
✅ Fully responsive design
✅ Integration with existing notification system
✅ Secure (requires authentication)
✅ Firebase real-time synchronization

The system is production-ready and provides an excellent user experience for tracking orders!
