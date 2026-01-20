# Accountant Dashboard Guide

## Overview
The Accountant Dashboard provides comprehensive financial reporting and analytics for The Pizza Club and Grill. This dashboard is designed specifically for accountants to track revenue, expenses, transactions, and generate financial reports.

## Access Credentials

### Accountant Login
- **Email Pattern**: `pcg-A001@gmail.com` (or any email with `pcg-A` pattern)
- **Role**: Accountant
- **Access**: Accountant Dashboard only

The `pcg-A` prefix in the email address is used to uniquely identify accountant accounts, distinguishing them from:
- Supervisors/Cashiers: `pcg001@gmail.com` (uses `pcg` prefix)
- Regular customers: any other email

## Features

### 1. Financial Overview Cards
The dashboard displays four key financial metrics:

- **Total Revenue**: Sum of all completed/delivered orders
- **Total Expenses**: Calculated expenses (currently 30% of revenue for demo)
- **Net Profit**: Revenue minus expenses
- **Total Transactions**: Number of completed orders

### 2. Sidebar Navigation

#### Available Reports
- **Overview**: Dashboard home with key metrics
- **Financial Reports**: Comprehensive financial statements
- **Sales Reports**: Detailed sales analytics
- **Revenue Analysis**: Revenue trends and patterns
- **Expense Tracking**: Track and categorize expenses
- **Profit & Loss**: P&L statements
- **Tax Reports**: Tax-related reports and calculations

### 3. Revenue Overview Chart
- Visual representation of revenue over time
- Filter options:
  - Last 7 Days
  - Last 30 Days (default)
  - Last 90 Days
  - This Year

### 4. Sales Summary
Quick view of sales performance:
- **Today's Sales**: Revenue from today
- **This Week**: Last 7 days revenue
- **This Month**: Last 30 days revenue
- **This Year**: Year-to-date revenue

### 5. Recent Transactions Table
Displays the 10 most recent completed transactions with:
- Transaction ID
- Order ID
- Customer name
- Amount
- Payment method
- Date
- Status

**Export Feature**: Click "Export" button to download transaction data (coming soon)

### 6. Top Selling Items
Shows the top 5 best-selling menu items with:
- Item rank (1-5)
- Item name
- Quantity sold
- Total revenue from item

### 7. Payment Methods Statistics
Breakdown of revenue by payment method:
- **Card Payments**: Credit/Debit card transactions
- **Cash Payments**: Cash transactions
- **Mobile Payments**: Mobile wallet/online payments

### 8. Monthly Comparison
Compare revenue across different months to identify trends (chart coming soon)

## How to Use

### Accessing the Dashboard
1. Go to the login page
2. Enter accountant credentials (e.g., `pcg-A001@gmail.com`)
3. Enter password
4. Click "Login"
5. You'll be redirected to the Accountant Dashboard

### Viewing Reports
1. Use the sidebar navigation to access different report types
2. Click on any report section to view detailed information
3. Use filter dropdowns to customize data views

### Exporting Data
1. Navigate to the Recent Transactions section
2. Click the "Export" button
3. Transaction data will be downloaded as CSV (feature in development)

## Database Structure

### Orders Collection
The dashboard reads from the `orders` collection in Firebase:
```json
{
  "orderId": {
    "customerId": "user_uid",
    "customerName": "John Doe",
    "items": [...],
    "total": 125.50,
    "status": "delivered",
    "paymentMethod": "card",
    "createdAt": timestamp
  }
}
```

### User Authentication
Accountant users are stored in the `users` collection with `role: "accountant"`:
```json
{
  "userId": {
    "fullName": "Jane Smith",
    "email": "pcg-A001@gmail.com",
    "role": "accountant",
    "createdAt": timestamp
  }
}
```

## Role-Based Access Control

### Automatic Role Assignment
When a user signs up with an email containing `pcg-A`, they are automatically assigned the "accountant" role.

### Access Restrictions
- Accountants can **only** access the Accountant Dashboard
- They cannot access:
  - Admin Dashboard (supervisors/cashiers)
  - Order Management pages
  - Category/Menu Item management
  - Customer menu page (unless separate customer account)

### Authentication Flow
1. User logs in
2. System checks email pattern
3. If email contains `pcg-A`: redirect to `accountant-dashboard.html`
4. If email contains `pcg` (no `-A`): redirect to `admin-dashboard.html`
5. All other emails: redirect to `menu.html`

## Financial Calculations

### Revenue
- Sum of `total` field from all orders with `status: "delivered"`
- Excludes pending, cancelled, or incomplete orders

### Expenses
- Currently calculated as 30% of revenue (demo/placeholder)
- In production, this should be replaced with actual expense tracking

### Net Profit
- Formula: `Revenue - Expenses`

### Sales Periods
- **Today**: Orders from midnight today
- **This Week**: Last 7 days
- **This Month**: Last 30 days
- **This Year**: From January 1st of current year

## Future Enhancements

### Planned Features
- Interactive charts using Chart.js or similar library
- CSV/Excel export functionality
- Date range filters for custom periods
- Expense entry and tracking
- Invoice generation
- Tax calculation tools
- Profit margin analysis by item
- Customer lifetime value reports
- Inventory cost tracking
- Payroll integration

## Security

### Authentication Required
- All dashboard pages require authentication
- Unauthorized users are redirected to login page
- Role verification happens on every page load

### Data Access
- Accountants can only **read** financial data
- No write access to orders, menu items, or categories
- Cannot modify customer information

## Troubleshooting

### Cannot Access Dashboard
- Verify email contains `pcg-A` prefix
- Check that account role is set to "accountant" in Firebase
- Clear browser cache and try again

### Data Not Loading
- Check Firebase connection
- Verify orders exist in database
- Check browser console for errors

### Wrong Dashboard Displayed
- Ensure email pattern is correct (`pcg-A` for accountant)
- Check Firebase user role assignment
- Log out and log back in

## Support

For issues or questions:
1. Check this guide first
2. Review Firebase console for data integrity
3. Check browser console for error messages
4. Contact system administrator

---

**Last Updated**: December 29, 2025
**Version**: 1.0
