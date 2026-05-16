// Order Tracking JavaScript
let currentUser = null;
let userOrders = [];

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    initializeAuth();
    setupUserButton();
});

// Initialize authentication
function initializeAuth() {
    auth.onAuthStateChanged((user) => {
        currentUser = user;
        
        if (user) {
            document.getElementById('userName').textContent = user.displayName || user.email.split('@')[0];
            loadUserOrders(user.uid);
        } else {
            // Redirect to login
            window.location.href = 'login.html?redirect=order-tracking.html';
        }
    });
}

// Setup user button
function setupUserButton() {
    const userBtn = document.getElementById('userBtn');
    
    userBtn.addEventListener('click', () => {
        if (currentUser) {
            if (confirm('Do you want to logout?')) {
                auth.signOut().then(() => {
                    window.location.href = 'index.html';
                });
            }
        } else {
            window.location.href = 'login.html';
        }
    });
}

// Load user orders with real-time updates
function loadUserOrders(userId) {
    showLoading(true);
    
    const ordersRef = database.ref('orders');
    
    // Listen for real-time updates
    ordersRef.orderByChild('userId').equalTo(userId).on('value', (snapshot) => {
        userOrders = [];
        
        if (!snapshot.exists()) {
            showEmptyState();
            return;
        }
        
        snapshot.forEach((childSnapshot) => {
            const order = {
                id: childSnapshot.key,
                ...childSnapshot.val()
            };
            userOrders.push(order);
        });
        
        // Sort by date (newest first)
        userOrders.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        
        displayOrders();
        showLoading(false);
    });
    
    // Listen for status changes specifically for notifications
    ordersRef.orderByChild('userId').equalTo(userId).on('child_changed', (snapshot) => {
        const updatedOrder = {
            id: snapshot.key,
            ...snapshot.val()
        };
        
        // Check if order was just delivered
        if (updatedOrder.status === 'delivered') {
            showDeliveredNotification(updatedOrder);
        }
    });
}

// Show delivered notification
function showDeliveredNotification(order) {
    // Show browser notification
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Order Delivered! 🎉', {
            body: `Your order #${order.orderNumber || order.id.substring(0, 8)} has been delivered. Enjoy your meal!`,
            icon: 'images/images_(1).jpeg',
            badge: 'images/images_(1).jpeg'
        });
    }
    
    // Show in-page notification
    showInPageNotification('🎉 Order Delivered!', `Your order #${order.orderNumber || order.id.substring(0, 8)} has been delivered. Enjoy!`);
    
    // Play notification sound
    playNotificationSound();
}

// Show in-page notification
function showInPageNotification(title, message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: white;
        padding: 1.5rem;
        border-radius: 10px;
        box-shadow: 0 8px 24px rgba(0,0,0,0.15);
        z-index: 9999;
        animation: slideIn 0.3s ease;
        max-width: 350px;
        border-left: 5px solid var(--primary-color);
    `;
    
    notification.innerHTML = `
        <div style="display: flex; align-items: start; gap: 1rem;">
            <div style="font-size: 2rem;">🎉</div>
            <div>
                <div style="font-weight: 600; font-size: 1.1rem; margin-bottom: 0.5rem; color: var(--dark-color);">${title}</div>
                <div style="color: var(--gray); font-size: 0.95rem;">${message}</div>
            </div>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}

// Play notification sound
function playNotificationSound() {
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZUQ4PWqzn77BdGAg+ltryxnMnBSp+zPLaizsIGGS57OihUhILTKXh8bllHAU2jdXz0YA1Bx1tvO/omkwPD1ms6O+wXBkIPpba8sZ0JgQpfszx2Ys7CBhkuOznolITCkyj4PG6ZRsENYzU89GBNgYdbLvv6ZtLEA5WrOjusF0aCDyU2PL2hS0GK4DN8ty3NAcYZLfs6KJSEw');
    audio.volume = 0.5;
    audio.play().catch(() => {});
}

// Request notification permission
if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
}

// Display orders
function displayOrders() {
    const ordersList = document.getElementById('ordersList');
    
    if (userOrders.length === 0) {
        showEmptyState();
        return;
    }
    
    ordersList.innerHTML = userOrders.map(order => createOrderCard(order)).join('');
}

// Create order card HTML
function createOrderCard(order) {
    const status = order.status || 'pending';
    const statusText = status.charAt(0).toUpperCase() + status.slice(1);
    const itemCount = order.items ? order.items.length : 0;
    const total = parseFloat(order.total || 0).toFixed(2);
    
    return `
        <div class="order-card" data-order-id="${order.id}">
            <div class="order-header">
                <div class="order-id-section">
                    <div class="order-icon">
                        <i class="fas fa-receipt"></i>
                    </div>
                    <div class="order-id-info">
                        <h3>Order #${order.orderNumber || order.id.substring(0, 8)}</h3>
                        <div class="order-date">
                            <i class="fas fa-clock"></i> ${formatDate(order.createdAt)}
                        </div>
                    </div>
                </div>
                <div class="order-status-badge status-${status}">
                    ${getStatusIcon(status)} ${statusText}
                </div>
            </div>

            ${createTimeline(order)}

            <div class="order-details">
                <div class="details-grid">
                    <div class="detail-card">
                        <div class="detail-label">Order Type</div>
                        <div class="detail-value">${order.orderType || 'Delivery'}</div>
                    </div>
                    <div class="detail-card">
                        <div class="detail-label">Items</div>
                        <div class="detail-value">${itemCount} item${itemCount !== 1 ? 's' : ''}</div>
                    </div>
                    <div class="detail-card">
                        <div class="detail-label">Payment Method</div>
                        <div class="detail-value">${formatPaymentMethod(order.paymentMethod)}</div>
                    </div>
                    <div class="detail-card">
                        <div class="detail-label">Total Amount</div>
                        <div class="detail-value total">E${total}</div>
                    </div>
                </div>

                ${order.deliveryAddress ? `
                    <div class="detail-card">
                        <div class="detail-label">Delivery Address</div>
                        <div class="detail-value">
                            <i class="fas fa-map-marker-alt"></i> ${order.deliveryAddress}
                        </div>
                    </div>
                ` : ''}

                ${createItemsList(order.items)}
            </div>
        </div>
    `;
}

// Create timeline for order status
function createTimeline(order) {
    const status = order.status || 'pending';
    const steps = [
        { key: 'pending', label: 'Order Placed', icon: 'fa-shopping-cart' },
        { key: 'confirmed', label: 'Confirmed', icon: 'fa-check-circle' },
        { key: 'preparing', label: 'Preparing', icon: 'fa-fire' },
        { key: 'ready', label: 'Ready', icon: 'fa-box' },
        { key: 'delivered', label: 'Delivered', icon: 'fa-check-double' }
    ];
    
    const currentStepIndex = steps.findIndex(s => s.key === status);
    const progress = ((currentStepIndex + 1) / steps.length) * 100;
    
    const stepsHTML = steps.map((step, index) => {
        const isCompleted = index < currentStepIndex;
        const isActive = index === currentStepIndex;
        const statusClass = isCompleted ? 'completed' : (isActive ? 'active' : '');
        
        // Get timestamp for this step
        let timestamp = '';
        if (step.key === 'pending' && order.createdAt) {
            timestamp = formatTime(order.createdAt);
        } else if (order[`${step.key}At`]) {
            timestamp = formatTime(order[`${step.key}At`]);
        }
        
        return `
            <div class="timeline-step ${statusClass}">
                <div class="timeline-circle">
                    <i class="fas ${step.icon}"></i>
                </div>
                <div class="timeline-label">${step.label}</div>
                ${timestamp ? `<div class="timeline-time">${timestamp}</div>` : ''}
            </div>
        `;
    }).join('');
    
    return `
        <div class="order-timeline">
            <div class="timeline-steps">
                <div class="timeline-line">
                    <div class="timeline-progress" style="width: ${progress}%"></div>
                </div>
                ${stepsHTML}
            </div>
        </div>
    `;
}

// Create items list
function createItemsList(items) {
    if (!items || items.length === 0) {
        return '';
    }
    
    const itemsHTML = items.map(item => `
        <div class="item-row">
            <div class="item-info">
                <div class="item-name">${item.name}</div>
                <div class="item-quantity">Qty: ${item.quantity}</div>
            </div>
            <div class="item-price">E${(parseFloat(item.price) * item.quantity).toFixed(2)}</div>
        </div>
    `).join('');
    
    return `
        <div class="order-items-section">
            <div class="section-title">
                <i class="fas fa-utensils"></i> Order Items
            </div>
            <div class="items-list">
                ${itemsHTML}
            </div>
        </div>
    `;
}

// Get status icon
function getStatusIcon(status) {
    const icons = {
        pending: '⏳',
        confirmed: '✅',
        preparing: '🔥',
        ready: '📦',
        delivered: '✅',
        cancelled: '❌'
    };
    return icons[status] || '📋';
}

// Format payment method
function formatPaymentMethod(method) {
    const methods = {
        'mtn_mobile_money': 'MTN Mobile Money',
        'card': 'Credit/Debit Card',
        'cash_on_delivery': 'Cash on Delivery'
    };
    return methods[method] || method || 'Not specified';
}

// Format date
function formatDate(timestamp) {
    if (!timestamp) return 'N/A';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
        return 'Today at ' + date.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    } else if (diffDays === 1) {
        return 'Yesterday at ' + date.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    } else {
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}

// Format time only
function formatTime(timestamp) {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
}

// Show loading state
function showLoading(show) {
    const loadingState = document.getElementById('loadingState');
    const ordersList = document.getElementById('ordersList');
    
    if (show) {
        loadingState.style.display = 'block';
        ordersList.style.display = 'none';
    } else {
        loadingState.style.display = 'none';
        ordersList.style.display = 'flex';
    }
}

// Show empty state
function showEmptyState() {
    const ordersList = document.getElementById('ordersList');
    
    ordersList.innerHTML = `
        <div class="empty-state">
            <i class="fas fa-receipt"></i>
            <h2>No Orders Yet</h2>
            <p>You haven't placed any orders yet. Browse our menu and order your favorite meals!</p>
            <a href="menu.html" class="btn-browse">
                <i class="fas fa-utensils"></i> Browse Menu
            </a>
        </div>
    `;
    
    showLoading(false);
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
