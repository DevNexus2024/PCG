# Branch-Based Order Filtering Guide

## Overview
The system filters orders based on delivery city, ensuring each branch admin only sees orders from their respective city. **Accountants see ALL branches** since they manage company-wide finances.

## How It Works

### 1. Branch Admin Setup
**Email Pattern:** `pcg002XXX@gmail.com` (where XXX = 3-letter branch code)

**Examples:**
- `pcg001@gmail.com` → Manzini (HQ)
- `pcg002Mba@gmail.com` → Mbabane Branch
- `pcg002Stn@gmail.com` → Siteki Branch (future)
- `pcg002Nhl@gmail.com` → Nhlangano Branch (future)

**Accountant Email:** `pcg-a001@gmail.com` → Company Accountant (sees ALL branches)

### 2. Branch-City Mapping
The system maps branch codes to city names:

```javascript
'manzini' → 'Manzini'
'mbabane' → 'Mbabane'
'mba' → 'Mbabane'
'siteki' → 'Siteki'
'stn' → 'Siteki'
'nhlangano' → 'Nhlangano'
```

### 3. Order Assignment
When customers place an order:
- **Delivery orders:** City is selected from dropdown in the delivery form
- **Pickup orders:** No city assigned (visible to all branches)

### 4. Branch Dashboard Filtering

#### What Each Branch Admin Sees:
- **Manzini Branch:** Only sees orders where `deliveryCity = "Manzini"`
- **Mbabane Branch:** Only sees orders where `deliveryCity = "Mbabane"`
- **All Branches:** Can see pickup orders (orders without a city)

#### What Accountants See:
- **ALL orders from ALL branches** (no filtering)
- Display shows: "Company Accountant (All Branches)"
- This applies to all financial pages

#### Filtered Pages (Branch Admins Only):
✅ **Admin Dashboard** - Stats and recent orders filtered by branch
✅ **Manage Orders** - Only shows orders for the branch's city

#### Not Filtered (Shows All):
- **Accountant Dashboard** - ALL branches' transactions
- **Financial Reports** - ALL branches' financial data
- **Sales Reports** - ALL branches' sales data
- **Revenue Analysis** - ALL branches' revenue data
- Menu Items Management
- Categories Management
- User Management

## Testing the System

### Step 1: Create Branch Admins
1. Have users signup with branch emails:
   - `pcg002Mba@gmail.com` (Mbabane)
   - Any other `pcg002XXX@gmail.com` pattern

2. System automatically assigns:
   - Role: Admin
   - Branch: Based on 3-letter code

### Step 2: Place Test Orders
1. **Order for Manzini:**
   - Go to menu, add items
   - Choose "Delivery"
   - Enter city: **Manzini**
   - Complete order

2. **Order for Mbabane:**
   - Go to menu, add items
   - Choose "Delivery"
   - Enter city: **Mbabane**
   - Complete order

3. **Pickup Order:**
   - Go to menu, add items
   - Choose "Pickup" (no city)
   - Complete order

### Step 3: Verify Filtering
1. **Login as Manzini Admin (pcg001@gmail.com):**
   - Should see Manzini delivery orders
   - Should see pickup orders
   - Should NOT see Mbabane orders

2. **Login as Mbabane Admin (pcg002Mba@gmail.com):**
   - Should see Mbabane delivery orders
   - Should see pickup orders
   - Should NOT see Manzini orders

## Adding New Branches

### For Future Branches (e.g., Siteki):

1. **Create Admin Account:**
   ```
   Email: pcg002Stn@gmail.com
   Password: (your choice)
   ```

2. **Add Mapping (if 3-letter code doesn't match city name):**
   Edit these files and add to `getBranchCityName()` function:
   - `js/auth.js`
   - `js/admin-dashboard.js`
   - `js/manage-orders.js`
   - `js/financial-reports.js`

   ```javascript
   function getBranchCityName(branchCode) {
       const branchMapping = {
           ...
           'stn': 'Siteki',  // Add new branch here
           ...
       };
       return branchMapping[branchCode.toLowerCase()] || branchCode;
   }
   ```

3. **Done!** The system will automatically:
   - Detect the branch from email
   - Filter orders by city
   - Display branch name in dashboard

## Important Notes

### City Name Matching
- City matching is **case-insensitive** (`"Mbabane"` = `"mbabane"`)
- Customers must type city name correctly in delivery form
- Consider adding a dropdown for cities in future to ensure consistency

### Old Orders
- Orders without a `deliveryCity` field (placed before this update) are visible to all branches
- This ensures backward compatibility

### Accountants
- Accountant accounts (`pcg-a001@gmail.com`, etc.) see **ALL branches' data**
- Display shows: "Company Accountant (All Branches)"
- No branch filtering applied to financial reports
- This ensures the accountant can oversee the entire company's finances across all locations

### Branch Admins vs Accountants
- **Branch Admins** (`pcg001@gmail.com`, `pcg002XXX@gmail.com`): See only their city's orders
- **Accountants** (`pcg-aXXX@gmail.com`): See ALL orders from ALL branches

## Console Logging
The system logs branch filtering activity:
- `🏢 Admin logged in: [name] | Branch: [branch] | City filter: [city]`
- `📋 Order loaded: [id] | City: [city]`
- `⊗ Order filtered out: [id] | City: [city] !== [branch city]`
- `📊 Report generated for [city]: [count] orders`

Check browser console (F12) to debug filtering issues.

## Troubleshooting

### Orders Not Showing Up
1. Check browser console for "Order filtered out" messages
2. Verify the order's `deliveryCity` matches the branch city name
3. Check if user's branch is set correctly in Firebase `/users/{uid}/branch`

### Wrong Branch Assignment
1. Check email pattern: must be exactly `pcg002XXX@gmail.com` (3 letters)
2. Check `getBranchCityName()` mappings
3. Use fix-role.html to manually correct branch assignment if needed

### All Orders Showing (No Filtering)
1. Check if `window.branchCityName` is defined (console: `window.branchCityName`)
2. Verify orders have `deliveryCity` field in Firebase
3. Check for JavaScript errors in console
