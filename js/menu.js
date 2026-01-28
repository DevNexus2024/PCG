// Menu functionality
let currentCategory = 'all';
let menuItems = [];
let categories = {};
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let currentUser = null;
let notifications = [];

// Initialize menu
document.addEventListener('DOMContentLoaded', () => {
    loadCategories();
    loadMenuItems();
    setupCategoryFilters();
    setupCartToggle();
    updateCartUI();
    initializeAuth();
});

// Initialize authentication and notifications
function initializeAuth() {
    auth.onAuthStateChanged((user) => {
        currentUser = user;
        if (user) {
            listenForNotifications(user.uid);
            document.getElementById('userName').textContent = user.displayName || user.email.split('@')[0];
        } else {
            document.getElementById('userName').textContent = 'Login';
        }
    });
}

// Listen for customer notifications
function listenForNotifications(userId) {
    const notificationsRef = database.ref(`notifications/${userId}`);
    
    notificationsRef.on('child_added', (snapshot) => {
        const notification = {
            id: snapshot.key,
            ...snapshot.val()
        };
        
        // Only show new notifications (not historical ones on load)
        if (Date.now() - notification.timestamp < 5000) {
            showBrowserNotification(notification);
            playNotificationSound();
        }
        
        loadAllNotifications(userId);
    });
    
    // Load existing notifications on startup
    loadAllNotifications(userId);
}

// Load all notifications
function loadAllNotifications(userId) {
    const notificationsRef = database.ref(`notifications/${userId}`);
    
    notificationsRef.once('value', (snapshot) => {
        notifications = [];
        const notificationList = document.getElementById('notificationList');
        
        if (!snapshot.exists()) {
            notificationList.innerHTML = '<p class="empty-notifications">No notifications yet</p>';
            updateNotificationCount(0);
            return;
        }
        
        snapshot.forEach((childSnapshot) => {
            notifications.push({
                id: childSnapshot.key,
                ...childSnapshot.val()
            });
        });
        
        // Sort by timestamp (newest first)
        notifications.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        
        displayNotifications();
        updateNotificationCount();
    });
}

// Display notifications in panel
function displayNotifications() {
    const notificationList = document.getElementById('notificationList');
    
    if (notifications.length === 0) {
        notificationList.innerHTML = '<p class="empty-notifications">No notifications yet</p>';
        return;
    }
    
    const notificationsHTML = notifications.map(notif => {
        const readClass = notif.read ? '' : 'unread';
        const timeAgo = getTimeAgo(notif.timestamp);
        
        return `
            <div class="notification-item ${readClass}" onclick="markNotificationAsRead('${notif.id}')">
                <div class="notification-title">${notif.title || 'Notification'}</div>
                <div class="notification-message">${notif.message}</div>
                <div class="notification-time">${timeAgo}</div>
                ${notif.orderId ? `<div class="notification-badge">Order #${notif.orderId.substring(0, 8)}</div>` : ''}
            </div>
        `;
    }).join('');
    
    notificationList.innerHTML = notificationsHTML;
}

// Mark notification as read
window.markNotificationAsRead = function(notificationId) {
    if (!currentUser) return;
    
    const notificationRef = database.ref(`notifications/${currentUser.uid}/${notificationId}`);
    notificationRef.update({ read: true }).then(() => {
        loadAllNotifications(currentUser.uid);
    });
};

// Update notification count
function updateNotificationCount() {
    const unreadCount = notifications.filter(n => !n.read).length;
    const countElement = document.getElementById('notificationCount');
    
    if (unreadCount > 0) {
        countElement.textContent = unreadCount > 99 ? '99+' : unreadCount;
        countElement.style.display = 'inline-flex';
    } else {
        countElement.style.display = 'none';
    }
}

// Show browser notification
function showBrowserNotification(notification) {
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(notification.title || 'Order Update', {
            body: notification.message,
            icon: 'images/images_(1).jpeg',
            badge: 'images/images_(1).jpeg'
        });
    }
    
    showInPageNotification(notification.message);
}

// Show in-page notification
function showInPageNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: var(--primary-color);
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 5px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        z-index: 9999;
        animation: slideIn 0.3s ease;
        max-width: 300px;
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}

// Play notification sound
function playNotificationSound() {
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZUQ4PWqzn77BdGAg+ltryxnMnBSp+zPLaizsIGGS57OihUhILTKXh8bllHAU2jdXz0YA1Bx1tvO/omkwPD1ms6O+wXBkIPpba8sZ0JgQpfszx2Ys7CBhkuOznolITCkyj4PG6ZRsENYzU89GBNgYdbLvv6ZtLEA5WrOjusF0aCDyU2PL2hS0GK4DN8ty3NAcYZLfs6KJSEw');
    audio.volume = 0.3;
    audio.play().catch(() => {});
}

// Get time ago
function getTimeAgo(timestamp) {
    if (!timestamp) return 'Just now';
    
    const now = Date.now();
    const diff = now - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'Just now';
}

// Request notification permission
if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
}

// Load categories from Firebase
function loadCategories() {
    const categoriesRef = database.ref('categories');
    
    categoriesRef.on('value', (snapshot) => {
        categories = {};
        const categoryFilter = document.querySelector('.category-filter');
        
        // Start with "All Items" button
        let filterHTML = '<button class="filter-btn active" data-category="all">All Items</button>';
        
        if (snapshot.exists()) {
            snapshot.forEach((childSnapshot) => {
                const category = childSnapshot.val();
                const categoryId = childSnapshot.key;
                
                if (category.status === 'active') {
                    categories[categoryId] = category.name;
                    // Add filter button with category ID
                    filterHTML += `<button class="filter-btn" data-category="${categoryId}">${category.name}</button>`;
                }
            });
        }
        
        // Update the category filter buttons
        if (categoryFilter) {
            categoryFilter.innerHTML = filterHTML;
            setupCategoryFilters(); // Re-setup event listeners
        }
    });
}

// Load menu items from Firebase
function loadMenuItems() {
    const menuRef = database.ref('menuItems');
    
    menuRef.on('value', (snapshot) => {
        menuItems = [];
        const menuGrid = document.getElementById('menuGrid');
        
        console.log('Loading menu items...', snapshot.exists());
        
        if (snapshot.exists()) {
            snapshot.forEach((childSnapshot) => {
                const item = {
                    id: childSnapshot.key,
                    ...childSnapshot.val()
                };
                console.log('Menu item loaded:', item);
                // Add all items regardless of status for now
                menuItems.push(item);
            });
            console.log('Total items loaded:', menuItems.length);
            displayMenuItems(menuItems);
        } else {
            menuGrid.innerHTML = '<p class="loading-text">No menu items available</p>';
        }
    });
}

// Display menu items
function displayMenuItems(items) {
    const menuGrid = document.getElementById('menuGrid');
    
    console.log('displayMenuItems called with items:', items);
    console.log('Current category:', currentCategory);
    console.log('Categories loaded:', categories);
    
    // Filter by category
    const filteredItems = currentCategory === 'all' 
        ? items 
        : items.filter(item => item.category === currentCategory);
    
    console.log('Filtered items:', filteredItems);
    
    if (filteredItems.length === 0) {
        menuGrid.innerHTML = '<p class="loading-text">No items in this category</p>';
        return;
    }
    
    menuGrid.innerHTML = filteredItems.map(item => {
        const categoryName = categories[item.category] || 'Uncategorized';
        // Item is available if status is 'active' OR if status is not set, AND available is not explicitly false
        const available = (item.status === 'active' || !item.status) && item.available !== false;
        
        console.log(`Item ${item.name}: status=${item.status}, available field=${item.available}, final available=${available}`);
        
        return `
        <div class="menu-item-card" data-id="${item.id}">
            <div class="item-image">
                <img src="${item.imageUrl || './images/placeholder.jpg'}" alt="${item.name}">
                ${!available ? '<div class="out-of-stock">Out of Stock</div>' : ''}
            </div>
            <div class="item-content">
                <div class="item-header">
                    <h3>${item.name}</h3>
                    <span class="item-category">${categoryName}</span>
                </div>
                <p class="item-description">${item.description || 'Delicious food item'}</p>
                <div class="item-footer">
                    <span class="item-price">E${parseFloat(item.price).toFixed(2)}</span>
                    <button class="add-to-cart-btn" onclick="addToCart('${item.id}')" 
                        ${!available ? 'disabled' : ''}>
                        <i class="fas fa-plus"></i> Add to Cart
                    </button>
                </div>
            </div>
        </div>
    `;
    }).join('');
}

// Setup category filters
function setupCategoryFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentCategory = btn.dataset.category;
            displayMenuItems(menuItems);
        });
    });
}

// Add to cart
window.addToCart = function(itemId) {
    const item = menuItems.find(i => i.id === itemId);
    if (!item) return;
    
    // Check if item is available
    const available = (item.status === 'active' || !item.status) && item.available !== false;
    if (!available) {
        showInPageNotification('This item is currently out of stock');
        return;
    }
    
    const existingItem = cart.find(i => i.id === itemId);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: 1,
            imageUrl: item.imageUrl
        });
    }
    
    saveCart();
    updateCartUI();
    showInPageNotification('Item added to cart!');
}

// Remove from cart
window.removeFromCart = function(itemId) {
    cart = cart.filter(item => item.id !== itemId);
    saveCart();
    updateCartUI();
}

// Update quantity
window.updateQuantity = function(itemId, change) {
    const item = cart.find(i => i.id === itemId);
    if (item) {
        item.quantity += change;
        if (item.quantity <= 0) {
            removeFromCart(itemId);
        } else {
            saveCart();
            updateCartUI();
        }
    }
}

// Save cart to localStorage
function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

// Update cart UI
function updateCartUI() {
    const cartItemsContainer = document.getElementById('cartItems');
    const cartCount = document.querySelectorAll('.cart-count');
    const cartTotal = document.getElementById('cartTotal');
    
    // Update cart count badges
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.forEach(badge => {
        badge.textContent = totalItems;
        badge.style.display = totalItems > 0 ? 'flex' : 'none';
    });
    
    // Update cart items
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p class="empty-cart">Your cart is empty</p>';
    } else {
        cartItemsContainer.innerHTML = cart.map(item => `
            <div class="cart-item">
                <img src="${item.imageUrl || './images/placeholder.jpg'}" alt="${item.name}">
                <div class="cart-item-info">
                    <h4>${item.name}</h4>
                    <p class="cart-item-price">E${parseFloat(item.price).toFixed(2)}</p>
                </div>
                <div class="cart-item-controls">
                    <button onclick="updateQuantity('${item.id}', -1)">
                        <i class="fas fa-minus"></i>
                    </button>
                    <span>${item.quantity}</span>
                    <button onclick="updateQuantity('${item.id}', 1)">
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
                <button class="remove-item" onclick="removeFromCart('${item.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `).join('');
    }
    
    // Update total
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    cartTotal.textContent = `E${total.toFixed(2)}`;
}

// Toggle cart sidebar
window.toggleCart = function() {
    const cartSidebar = document.getElementById('cartSidebar');
    cartSidebar.classList.toggle('active');
}

// Setup cart toggle
function setupCartToggle() {
    // Cart toggle is handled by onclick="toggleCart()" in HTML
    // No additional setup needed
}

// Checkout function
window.checkout = function() {
    if (cart.length === 0) {
        showInPageNotification('Your cart is empty');
        return;
    }
    
    // Redirect to delivery/checkout page
    window.location.href = 'delivery.html';
}

// Checkout button handler (if exists)
document.getElementById('checkout-btn')?.addEventListener('click', checkout);

// Show notification
function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: var(--primary-color);
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 5px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        z-index: 9999;
        animation: slideIn 0.3s ease;
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 2000);
}
