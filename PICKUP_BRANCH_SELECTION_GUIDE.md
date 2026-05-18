# Pickup Branch Selection - Implementation Guide

## ✅ What Was Added (May 18, 2026)

Added city/branch selection dropdown for **Pickup (Cashout)** orders to route orders to the correct branch automatically.

## 🎯 How It Works

### For Pickup Orders:
1. Customer selects **"Pickup (Cashout)"** option
2. A **"Pickup Branch"** dropdown appears with all available branches:
   - Mbabane Branch
   - Manzini Branch
   - Siteki Branch
   - Nhlangano Branch
   - Piggs Peak Branch

3. Customer **must select** a branch before completing the order
4. Order is automatically routed to the selected branch via the `deliveryCity` field

### For Delivery Orders:
- Customer selects **"Delivery"** option
- Existing city dropdown appears for delivery address
- Order is routed to the branch based on the delivery city

## 🔧 Technical Implementation

### Files Modified:

#### 1. **delivery.html**
- Added new section: `<div class="pickup-fields" id="pickupFields">`
- Contains dropdown: `<select id="pickupCity">`
- Shows only when pickup is selected
- Hides when delivery is selected

#### 2. **js/delivery.js**
- Updated `selectOrderType()` function:
  - Shows/hides pickup fields based on order type
  - Makes `pickupCity` required for pickup orders
  - Makes delivery fields required for delivery orders

- Updated order validation:
  - Checks if pickup city is selected for pickup orders
  - Shows alert if branch not selected

- Updated order data structure:
  - For **pickup**: `deliveryCity: pickupCity` (routes to selected branch)
  - For **delivery**: `deliveryCity: selectedDeliveryCity` (routes to delivery location)
  - Added `pickupInfo` object for payment page data

### CSS Styling:

```css
.pickup-fields {
    display: block;
}

.pickup-fields.hidden {
    display: none;
}
```

## 📱 Works On All Interfaces

✅ **Mobile App (PWA)** - Fully responsive
✅ **Desktop App** - Windows GUI style maintained
✅ **Web Browser** - All screen sizes

The same HTML file (`delivery.html`) is used across all interfaces, so the branch selection works everywhere.

## 🚀 Branch Routing Logic

### How Orders Are Routed:

1. **Order Placed** → Customer selects branch
2. **Data Saved** → `deliveryCity` field contains branch city name
3. **Admin Dashboard** → Uses branch filtering by `deliveryCity`
4. **Branch Staff** → See only orders for their branch city

### Database Structure:

```javascript
{
  orderType: "pickup",
  deliveryCity: "Mbabane",  // ← Routes to Mbabane branch
  customerName: "Customer Name",
  items: [...],
  // ... other fields
}
```

## 🎨 User Experience

### Before (Problem):
- ❌ Pickup orders had no branch selection
- ❌ All pickup orders went to default branch
- ❌ Wrong branch staff saw irrelevant orders

### After (Solution):
- ✅ Customer selects pickup branch
- ✅ Order routes to correct branch automatically
- ✅ Branch staff see only their branch orders
- ✅ Works for current and future branches

## 🔮 Future Branches

To add a new branch:

1. **Add to dropdown** in `delivery.html`:
```html
<option value="NewCity">NewCity Branch</option>
```

2. **Done!** The filtering system automatically works for the new branch.

No code changes needed in dashboard or filtering logic.

## 📊 Admin Dashboard Integration

The branch filtering in dashboards uses the `deliveryCity` field:

```javascript
// In admin-dashboard.js
function filterOrdersByBranch(orders, branchCity) {
    return orders.filter(order => 
        order.deliveryCity === branchCity
    );
}
```

**Pickup orders** now correctly populate this field with the selected branch, so:
- Mbabane branch staff see Mbabane pickup orders
- Manzini branch staff see Manzini pickup orders
- And so on...

## 🧪 Testing

### To Test Pickup Branch Selection:

1. Go to **menu.html** and add items to cart
2. Click **Checkout**
3. Select **"Pickup (Cashout)"**
4. Verify **"Pickup Branch"** dropdown appears
5. Select a branch (e.g., Mbabane)
6. Fill in name and phone
7. Click **"Show Receipt (Download PDF)"**
8. Verify order saved with correct branch

### To Verify Branch Routing:

1. Login as branch staff (Supervisor/Cashier)
2. Go to dashboard
3. Check that only orders for that branch city appear
4. Verify pickup orders show up correctly

## 🚀 Deployment

Updated files ready in `netlify-deploy` folder:
- `delivery.html` - With pickup branch dropdown
- `js/delivery.js` - With branch routing logic

**To deploy:**
1. Go to https://app.netlify.com
2. Open your site: **thepizzaclubandgrill001**
3. Click "Deploys" → Drag & drop area
4. Select all files from `netlify-deploy` folder
5. Drop and deploy!

## ✨ Benefits

- ✅ Orders automatically route to correct branch
- ✅ No manual sorting needed
- ✅ Scalable for future branches
- ✅ Works on all devices (mobile, desktop, web)
- ✅ Better organization for multi-branch operations
- ✅ Improved order management efficiency

---

**Note:** The `deliveryCity` field is used for both delivery and pickup orders to maintain consistency in the filtering system across all dashboards.
