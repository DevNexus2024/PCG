// Manage Orders JavaScript
let allOrders = [];
let currentUser = null;

// Load orders on page load
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Manage Orders page loaded');
    checkAuth();
});

// Check authentication
function checkAuth() {
    console.log('🔐 Checking authentication...');
    auth.onAuthStateChanged(async (user) => {
        console.log('Auth state changed. User:', user ? user.email : 'None');
        
        if (!user) {
            console.warn('⚠️ No user logged in, redirecting to login');
            window.location.href = 'login.html';
            return;
        }

        currentUser = user;
        console.log('✅ User authenticated:', user.email);

        // Check if user is staff
        const email = user.email.toLowerCase();
        if (!email.includes('pcg') && !email.includes('@pizzaclubgrill.com')) {
            alert('Access denied. This page is for staff only.');
            window.location.href = 'menu.html';
            return;
        }

        // Verify role in database
        const userDataSnapshot = await database.ref('users/' + user.uid).once('value');
        const userData = userDataSnapshot.val();

        if (!userData || !['admin', 'supervisor', 'cashier'].includes(userData.role)) {
            alert('Access denied. Insufficient permissions.');
            window.location.href = 'menu.html';
            return;
        }

        console.log('✅ User has proper role:', userData.role);
        console.log('📥 Now loading orders...');
        
        // Only load orders after authentication is confirmed
        loadOrders();
    });
}

// Load all orders from Firebase
function loadOrders() {
    console.log('🔍 Loading orders from Firebase...');
    const ordersRef = database.ref('orders');
    
    ordersRef.on('value', (snapshot) => {
        console.log('📦 Firebase snapshot received');
        console.log('Snapshot exists:', snapshot.exists());
        console.log('Number of children:', snapshot.numChildren());
        
        allOrders = [];
        const tableBody = document.getElementById('ordersTableBody');
        
        if (!snapshot.exists()) {
            console.warn('⚠️ No orders found in Firebase');
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="empty-state">
                        <i class="fas fa-shopping-cart"></i>
                        <h3>No Orders Yet</h3>
                        <p>Orders will appear here when customers place them</p>
                        <p style="color: #999; font-size: 0.9rem; margin-top: 1rem;">If you just placed an order, check the browser console for errors.</p>
                    </td>
                </tr>
            `;
            return;
        }

        snapshot.forEach((childSnapshot) => {
            const order = childSnapshot.val();
            console.log('📝 Order loaded:', childSnapshot.key, order);
            allOrders.push({
                id: childSnapshot.key,
                ...order
            });
        });

        console.log(`✅ Total orders loaded: ${allOrders.length}`);
        
        // Sort by date (newest first)
        allOrders.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

        displayOrders(allOrders);
    }, (error) => {
        console.error('❌ Firebase error loading orders:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        
        const tableBody = document.getElementById('ordersTableBody');
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="empty-state" style="color: red;">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Error Loading Orders</h3>
                    <p><strong>Error:</strong> ${error.message}</p>
                    <p style="font-size: 0.9rem; margin-top: 1rem;">
                        ${error.code === 'PERMISSION_DENIED' ? 
                            'Firebase permission denied. Check your database rules in Firebase Console.' : 
                            'Check browser console (F12) for more details.'}
                    </p>
                </td>
            </tr>
        `;
    });
}

// Display orders in table
function displayOrders(orders) {
    console.log('🎨 Displaying orders:', orders.length);
    const tableBody = document.getElementById('ordersTableBody');
    
    if (orders.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="empty-state">
                    <i class="fas fa-search"></i>
                    <p>No orders found matching your filters</p>
                </td>
            </tr>
        `;
        return;
    }

    let tableHTML = '';
    orders.forEach(order => {
        const itemCount = order.items ? order.items.length : 0;
        const statusClass = `status-${order.status || 'pending'}`;
        const statusText = (order.status || 'pending').charAt(0).toUpperCase() + (order.status || 'pending').slice(1);
        
        tableHTML += `
            <tr>
                <td><span class="order-id">#${order.id.substring(0, 8)}</span></td>
                <td>
                    <strong>${order.customerName || 'Unknown'}</strong><br>
                    <small>${order.customerEmail || ''}</small>
                </td>
                <td>${itemCount} item${itemCount !== 1 ? 's' : ''}</td>
                <td><strong>R${parseFloat(order.total || 0).toFixed(2)}</strong></td>
                <td><span class="order-status ${statusClass}">${statusText}</span></td>
                <td>${formatDate(order.createdAt)}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-action btn-view" onclick="viewOrder('${order.id}')" title="View Details">
                            <i class="fas fa-eye"></i> View
                        </button>
                        ${getActionButtons(order)}
                    </div>
                </td>
            </tr>
        `;
    });

    tableBody.innerHTML = tableHTML;
}

// Get action buttons based on order status
function getActionButtons(order) {
    const status = order.status || 'pending';
    let buttons = '';

    switch(status) {
        case 'pending':
            buttons = `
                <button class="btn-action btn-confirm" onclick="confirmOrder('${order.id}')" title="Confirm Order">
                    <i class="fas fa-check"></i> Confirm
                </button>
                <button class="btn-action btn-cancel" onclick="cancelOrder('${order.id}')" title="Cancel Order">
                    <i class="fas fa-times"></i> Cancel
                </button>
            `;
            break;
        case 'confirmed':
            buttons = `
                <button class="btn-action btn-preparing" onclick="updateOrderStatus('${order.id}', 'preparing')" title="Mark as Preparing">
                    <i class="fas fa-fire"></i> Preparing
                </button>
                <button class="btn-action btn-cancel" onclick="cancelOrder('${order.id}')" title="Cancel Order">
                    <i class="fas fa-times"></i> Cancel
                </button>
            `;
            break;
        case 'preparing':
            buttons = `
                <button class="btn-action btn-ready" onclick="updateOrderStatus('${order.id}', 'ready')" title="Mark as Ready">
                    <i class="fas fa-check-circle"></i> Ready
                </button>
            `;
            break;
        case 'ready':
            buttons = `
                <button class="btn-action btn-complete" onclick="updateOrderStatus('${order.id}', 'delivered')" title="Mark as Delivered">
                    <i class="fas fa-check-double"></i> Delivered
                </button>
            `;
            break;
        case 'delivered':
        case 'cancelled':
            buttons = '<span style="color: var(--gray);">No actions available</span>';
            break;
    }

    return buttons;
}

// Confirm order
async function confirmOrder(orderId) {
    if (!confirm('Confirm this order? Customer will be notified.')) {
        return;
    }

    try {
        const orderRef = database.ref('orders/' + orderId);
        const orderSnapshot = await orderRef.once('value');
        const order = orderSnapshot.val();

        if (!order) {
            alert('Order not found');
            return;
        }

        // Update order status
        await orderRef.update({
            status: 'confirmed',
            confirmedAt: firebase.database.ServerValue.TIMESTAMP,
            updatedAt: firebase.database.ServerValue.TIMESTAMP
        });

        // Send notification to customer
        await sendCustomerNotification(order.userId, {
            type: 'order_confirmed',
            title: 'Order Confirmed',
            message: `Your order #${orderId.substring(0, 8)} has been confirmed and is being prepared.`,
            orderId: orderId,
            timestamp: Date.now()
        });

        alert('Order confirmed successfully! Customer has been notified.');
    } catch (error) {
        console.error('Error confirming order:', error);
        alert('Failed to confirm order: ' + error.message);
    }
}

// Update order status
async function updateOrderStatus(orderId, newStatus) {
    const statusMessages = {
        'preparing': 'Mark order as preparing?',
        'ready': 'Mark order as ready for pickup/delivery?',
        'delivered': 'Mark order as delivered?'
    };

    const notificationMessages = {
        'preparing': 'Your order is now being prepared.',
        'ready': 'Your order is ready for pickup/delivery!',
        'delivered': '🎉 Your order has been delivered! Enjoy your meal from The Pizza Club and Grill!'
    };

    if (!confirm(statusMessages[newStatus])) {
        return;
    }

    try {
        const orderRef = database.ref('orders/' + orderId);
        const orderSnapshot = await orderRef.once('value');
        const order = orderSnapshot.val();

        if (!order) {
            alert('Order not found');
            return;
        }

        // Update order status
        await orderRef.update({
            status: newStatus,
            [`${newStatus}At`]: firebase.database.ServerValue.TIMESTAMP,
            updatedAt: firebase.database.ServerValue.TIMESTAMP
        });

        // Send notification to customer
        const notificationTitle = newStatus === 'delivered' ? '🎉 Order Delivered!' : 'Order Update';
        await sendCustomerNotification(order.userId, {
            type: `order_${newStatus}`,
            title: notificationTitle,
            message: `Order #${orderId.substring(0, 8)}: ${notificationMessages[newStatus]}`,
            orderId: orderId,
            timestamp: Date.now()
        });

        alert(`Order status updated to ${newStatus}!`);
    } catch (error) {
        console.error('Error updating order status:', error);
        alert('Failed to update order status: ' + error.message);
    }
}

// Cancel order
async function cancelOrder(orderId) {
    const reason = prompt('Enter cancellation reason:');
    if (!reason) return;

    try {
        const orderRef = database.ref('orders/' + orderId);
        const orderSnapshot = await orderRef.once('value');
        const order = orderSnapshot.val();

        if (!order) {
            alert('Order not found');
            return;
        }

        // Update order status
        await orderRef.update({
            status: 'cancelled',
            cancelledAt: firebase.database.ServerValue.TIMESTAMP,
            cancellationReason: reason,
            updatedAt: firebase.database.ServerValue.TIMESTAMP
        });

        // Send notification to customer
        await sendCustomerNotification(order.userId, {
            type: 'order_cancelled',
            title: 'Order Cancelled',
            message: `Your order #${orderId.substring(0, 8)} has been cancelled. Reason: ${reason}`,
            orderId: orderId,
            timestamp: Date.now()
        });

        alert('Order cancelled. Customer has been notified.');
    } catch (error) {
        console.error('Error cancelling order:', error);
        alert('Failed to cancel order: ' + error.message);
    }
}

// Send notification to customer
async function sendCustomerNotification(customerId, notification) {
    if (!customerId) {
        console.warn('No customer ID provided for notification');
        return;
    }

    try {
        const notificationRef = database.ref(`notifications/${customerId}`).push();
        await notificationRef.set({
            ...notification,
            read: false,
            createdAt: firebase.database.ServerValue.TIMESTAMP
        });
    } catch (error) {
        console.error('Error sending notification:', error);
    }
}

// View order details
async function viewOrder(orderId) {
    try {
        const orderSnapshot = await database.ref('orders/' + orderId).once('value');
        const order = orderSnapshot.val();

        if (!order) {
            alert('Order not found');
            return;
        }

        const detailsHTML = `
            <div class="detail-row">
                <span class="detail-label">Order ID:</span>
                <span class="detail-value">#${orderId.substring(0, 8)}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Customer Name:</span>
                <span class="detail-value">${order.customerName || 'N/A'}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Email:</span>
                <span class="detail-value">${order.customerEmail || 'N/A'}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Phone:</span>
                <span class="detail-value">${order.customerPhone || 'N/A'}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Delivery Address:</span>
                <span class="detail-value">${order.deliveryAddress || 'N/A'}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Status:</span>
                <span class="order-status status-${order.status || 'pending'}">${(order.status || 'pending').toUpperCase()}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Order Date:</span>
                <span class="detail-value">${formatDate(order.createdAt)}</span>
            </div>
            
            <h3 style="margin-top: 1.5rem; margin-bottom: 1rem; color: var(--dark-color);">Order Items</h3>
            <div class="order-items-list">
                ${order.items ? order.items.map(item => `
                    <div class="order-item">
                        <div class="item-info">
                            <div class="item-name">${item.name}</div>
                            <div class="item-quantity">Quantity: ${item.quantity}</div>
                        </div>
                        <div class="item-price">R${(item.price * item.quantity).toFixed(2)}</div>
                    </div>
                `).join('') : '<p>No items</p>'}
            </div>
            
            <div class="order-total">
                <span>Total:</span>
                <span>R${parseFloat(order.total || 0).toFixed(2)}</span>
            </div>
            
            ${order.notes ? `
                <div style="margin-top: 1rem; padding: 1rem; background: var(--light-color); border-radius: 5px;">
                    <strong>Notes:</strong><br>
                    ${order.notes}
                </div>
            ` : ''}
        `;

        document.getElementById('orderDetails').innerHTML = detailsHTML;
        document.getElementById('orderModal').classList.add('active');
    } catch (error) {
        console.error('Error loading order details:', error);
        alert('Failed to load order details: ' + error.message);
    }
}

// Close modal
function closeModal() {
    document.getElementById('orderModal').classList.remove('active');
}

// Filter orders
function filterOrders() {
    const statusFilter = document.getElementById('statusFilter').value;
    const dateFilter = document.getElementById('dateFilter').value;
    
    let filteredOrders = allOrders;
    
    // Filter by status
    if (statusFilter) {
        filteredOrders = filteredOrders.filter(order => (order.status || 'pending') === statusFilter);
    }
    
    // Filter by date
    if (dateFilter) {
        const now = Date.now();
        const oneDayMs = 24 * 60 * 60 * 1000;
        const oneWeekMs = 7 * oneDayMs;
        const oneMonthMs = 30 * oneDayMs;
        
        filteredOrders = filteredOrders.filter(order => {
            const orderDate = order.createdAt || 0;
            
            switch(dateFilter) {
                case 'today':
                    return now - orderDate < oneDayMs;
                case 'week':
                    return now - orderDate < oneWeekMs;
                case 'month':
                    return now - orderDate < oneMonthMs;
                default:
                    return true;
            }
        });
    }
    
    displayOrders(filteredOrders);
}

// Format date
function formatDate(timestamp) {
    if (!timestamp) return 'N/A';
    
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Logout function
function handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
        auth.signOut().then(() => {
            window.location.href = 'login.html';
        }).catch((error) => {
            console.error('Logout error:', error);
            alert('Error logging out. Please try again.');
        });
    }
}

// Make functions globally available
window.loadOrders = loadOrders;
window.viewOrder = viewOrder;
window.confirmOrder = confirmOrder;
window.updateOrderStatus = updateOrderStatus;
window.cancelOrder = cancelOrder;
window.closeModal = closeModal;
window.filterOrders = filterOrders;
window.handleLogout = handleLogout;
