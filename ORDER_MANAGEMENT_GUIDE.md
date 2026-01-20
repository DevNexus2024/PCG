# Order Management System Guide

## Overview
The order management system allows staff (supervisors and cashiers) to view, manage, and update customer orders. When orders are confirmed or updated, customers receive real-time notifications on their menu page.

## Features

### For Staff (Admin Dashboard)

#### Access Orders Page
- Login with staff credentials (email containing "pcg" or "@pizzaclubgrill.com")
- Click "Orders" in the sidebar menu
- Or click "View All" in the Recent Orders card on the dashboard

#### Manage Orders
The orders page displays all customer orders in a table with:
- **Order ID**: Unique identifier for each order
- **Customer**: Name and email
- **Items**: Number of items in the order
- **Total**: Order total amount
- **Status**: Current order status (see below)
- **Date**: When the order was placed
- **Actions**: Buttons to update order status

#### Order Status Flow
Orders progress through these statuses:

1. **Pending** (Yellow)
   - New orders start here
   - Actions: Confirm or Cancel

2. **Confirmed** (Green)
   - Order has been confirmed
   - Customer receives notification: "Your order has been confirmed and is being prepared"
   - Actions: Mark as Preparing or Cancel

3. **Preparing** (Cyan)
   - Order is being prepared
   - Customer receives notification: "Your order is now being prepared"
   - Actions: Mark as Ready

4. **Ready** (Blue)
   - Order is ready for pickup/delivery
   - Customer receives notification: "Your order is ready for pickup/delivery!"
   - Actions: Mark as Delivered

5. **Delivered** (Green)
   - Order has been delivered
   - Customer receives notification: "Your order has been delivered. Enjoy!"
   - No further actions

6. **Cancelled** (Red)
   - Order has been cancelled
   - Requires cancellation reason
   - Customer receives notification with the reason

#### Filter Orders
- **By Status**: Filter by pending, confirmed, preparing, ready, delivered, or cancelled
- **By Date**: Filter by today, this week, or this month

#### View Order Details
Click the "View" button to see:
- Full customer information
- Delivery address
- All order items with quantities and prices
- Order notes
- Complete order timeline

### For Customers (Menu Page)

#### Notification Bell
- Located in the top navigation bar next to the cart icon
- Shows a red badge with the number of unread notifications
- Click to open the notification panel

#### Notification Panel
- Displays all order updates and confirmations
- Unread notifications are highlighted
- Click a notification to mark it as read
- Notifications include:
  - Order confirmed
  - Order being prepared
  - Order ready
  - Order delivered
  - Order cancelled (with reason)

#### Browser Notifications
- Customers may be prompted to allow browser notifications
- When allowed, customers receive pop-up notifications even when not on the page
- Includes a notification sound

## Database Structure

### Orders (`/orders/{orderId}`)
```json
{
  "customerId": "user_uid",
  "customerName": "John Doe",
  "customerEmail": "john@example.com",
  "customerPhone": "+1234567890",
  "deliveryAddress": "123 Main St",
  "items": [
    {
      "id": "item_id",
      "name": "Pepperoni Pizza",
      "price": 12.99,
      "quantity": 2
    }
  ],
  "total": 25.98,
  "status": "pending",
  "notes": "Extra cheese please",
  "createdAt": 1234567890,
  "confirmedAt": 1234567900,
  "preparingAt": 1234567910,
  "readyAt": 1234567920,
  "deliveredAt": 1234567930,
  "updatedAt": 1234567930
}
```

### Notifications (`/notifications/{userId}/{notificationId}`)
```json
{
  "type": "order_confirmed",
  "title": "Order Confirmed",
  "message": "Your order #abc12345 has been confirmed and is being prepared.",
  "orderId": "full_order_id",
  "timestamp": 1234567890,
  "read": false,
  "createdAt": 1234567890
}
```

## Key Functions

### Staff (manage-orders.js)
- `loadOrders()`: Loads all orders from Firebase
- `confirmOrder(orderId)`: Confirms a pending order
- `updateOrderStatus(orderId, newStatus)`: Updates order status
- `cancelOrder(orderId)`: Cancels an order with reason
- `viewOrder(orderId)`: Displays order details in modal
- `sendCustomerNotification(customerId, notification)`: Sends notification to customer
- `filterOrders()`: Filters orders by status and date

### Customer (menu.js)
- `listenForNotifications(userId)`: Real-time listener for new notifications
- `loadAllNotifications(userId)`: Loads all user notifications
- `displayNotifications()`: Displays notifications in panel
- `markNotificationAsRead(notificationId)`: Marks notification as read
- `showBrowserNotification(notification)`: Shows browser notification
- `playNotificationSound()`: Plays notification sound

## Navigation

### Staff Access
1. Login at `login.html` with staff credentials
2. Redirected to `admin-dashboard.html`
3. Click "Orders" in sidebar → `manage-orders.html`

### Customer Access
1. Login at `login.html` with customer credentials
2. Redirected to `menu.html`
3. Browse menu and add items to cart
4. Click bell icon to view notifications

## Important Notes

1. **Authentication Required**: Only authenticated staff can access the orders management page
2. **Real-time Updates**: Orders and notifications update in real-time using Firebase listeners
3. **Automatic Notifications**: Customers are automatically notified when their order status changes
4. **Browser Permissions**: Customers may need to grant browser notification permissions for pop-up alerts
5. **Sound Effects**: A notification sound plays when new notifications arrive
6. **Unread Count**: The notification badge shows the count of unread notifications

## Testing

### Test Order Flow
1. Create a test order (requires implementing checkout functionality)
2. Login as staff and navigate to Orders page
3. Click "Confirm" on a pending order
4. Verify customer receives notification
5. Progress through statuses: Preparing → Ready → Delivered
6. Verify customer receives notification at each step

### Test Notifications
1. Login as customer
2. Check notification bell
3. Have staff update an order status
4. Verify notification appears instantly
5. Click notification to mark as read
6. Verify badge count updates

## Future Enhancements
- Order analytics and reports
- Print order receipts
- SMS notifications
- Email notifications
- Order history search
- Bulk order actions
- Customer order tracking page
- Estimated delivery time
