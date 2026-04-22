// Admin Dashboard JavaScript
// Handles dashboard data loading and management

document.addEventListener('DOMContentLoaded', function() {
    // Check if user is authenticated and is admin
    checkAdminAuth();
    
    // Load dashboard data
    loadDashboardStats();
    loadRecentOrders();
    loadMenuItems();
    loadCategories();
    loadQuickStats();
    
    // Set up real-time listeners
    setupRealtimeListeners();
    
    // Initialize notifications
    initializeNotifications();
});

// Check admin authentication
function checkAdminAuth() {
    auth.onAuthStateChanged((user) => {
        if (!user) {
            // Not logged in, redirect to login
            window.location.href = 'login.html';
            return;
        }
        
        // Check if user is admin/supervisor/cashier
        database.ref('users/' + user.uid).once('value').then((snapshot) => {
            const userData = snapshot.val();
            
            if (userData && userData.role && (userData.role === 'admin' || userData.role === 'supervisor' || userData.role === 'cashier')) {
                // User is authorized
                document.getElementById('adminName').textContent = userData.fullName || user.email;
            } else {
                // Not authorized, redirect to login
                alert('Access denied. Admin privileges required.');
                window.location.href = 'login.html';
            }
        });
    });
}

// Load Dashboard Statistics
async function loadDashboardStats() {
    try {
        // Get total orders
        const ordersSnapshot = await database.ref('orders').once('value');
        const orders = ordersSnapshot.val();
        const totalOrders = orders ? Object.keys(orders).length : 0;
        document.getElementById('totalOrders').textContent = totalOrders;
        
        // Get total categories
        const categoriesSnapshot = await database.ref('categories').once('value');
        const categories = categoriesSnapshot.val();
        const totalCategories = categories ? Object.keys(categories).length : 0;
        document.getElementById('totalCategories').textContent = totalCategories;
        
        // Get total menu items
        const menuSnapshot = await database.ref('menuItems').once('value');
        const menuItems = menuSnapshot.val();
        const totalMenuItems = menuItems ? Object.keys(menuItems).length : 0;
        document.getElementById('totalMenuItems').textContent = totalMenuItems;
        
        // Calculate total revenue
        let totalRevenue = 0;
        if (orders) {
            Object.values(orders).forEach(order => {
                if (order.status === 'completed') {
                    totalRevenue += parseFloat(order.total || 0);
                }
            });
        }
        document.getElementById('totalRevenue').textContent = '$' + totalRevenue.toFixed(2);
        
    } catch (error) {
        console.error('Error loading dashboard stats:', error);
    }
}

// Load Recent Orders
async function loadRecentOrders() {
    try {
        const ordersRef = database.ref('orders').orderByChild('timestamp').limitToLast(10);
        const snapshot = await ordersRef.once('value');
        const orders = snapshot.val();
        
        const tbody = document.getElementById('ordersTableBody');
        tbody.innerHTML = '';
        
        if (!orders) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center">No orders found</td></tr>';
            return;
        }
        
        // Convert to array and reverse (newest first)
        const ordersArray = Object.entries(orders).reverse();
        
        ordersArray.forEach(([orderId, order]) => {
            const row = document.createElement('tr');
            const date = new Date(order.timestamp).toLocaleDateString();
            const itemCount = order.items ? order.items.length : 0;
            
            row.innerHTML = `
                <td>#${order.orderNumber || orderId.substring(0, 8)}</td>
                <td>${order.customerName || 'N/A'}</td>
                <td>${itemCount} items</td>
                <td>$${parseFloat(order.total || 0).toFixed(2)}</td>
                <td><span class="status-badge status-${order.status}">${order.status}</span></td>
                <td>${date}</td>
            `;
            tbody.appendChild(row);
        });
        
    } catch (error) {
        console.error('Error loading recent orders:', error);
        document.getElementById('ordersTableBody').innerHTML = 
            '<tr><td colspan="6" class="text-center">Error loading orders</td></tr>';
    }
}

// Load Menu Items
async function loadMenuItems() {
    try {
        const snapshot = await database.ref('menuItems').once('value');
        const menuItems = snapshot.val();
        
        const tbody = document.getElementById('menuItemsTableBody');
        tbody.innerHTML = '';
        
        if (!menuItems) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center">No menu items found</td></tr>';
            return;
        }
        
        Object.entries(menuItems).forEach(([itemId, item]) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>
                    <strong>${item.name}</strong>
                </td>
                <td>${item.category || 'Uncategorized'}</td>
                <td>$${parseFloat(item.price || 0).toFixed(2)}</td>
                <td><span class="status-badge status-${item.available ? 'available' : 'unavailable'}">${item.available ? 'Available' : 'Unavailable'}</span></td>
                <td>
                    <button class="action-btn" onclick="editMenuItem('${itemId}')" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete" onclick="deleteMenuItem('${itemId}')" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
        
    } catch (error) {
        console.error('Error loading menu items:', error);
        document.getElementById('menuItemsTableBody').innerHTML = 
            '<tr><td colspan="5" class="text-center">Error loading menu items</td></tr>';
    }
}

// Load Categories
async function loadCategories() {
    try {
        const snapshot = await database.ref('categories').once('value');
        const categories = snapshot.val();
        
        const grid = document.getElementById('categoriesGrid');
        grid.innerHTML = '';
        
        if (!categories) {
            grid.innerHTML = '<p class="text-center">No categories found</p>';
            return;
        }
        
        Object.entries(categories).forEach(([catId, category]) => {
            const div = document.createElement('div');
            div.className = 'category-item';
            div.innerHTML = `
                <i class="fas fa-${category.icon || 'utensils'}"></i>
                <h4>${category.name}</h4>
                <p>${category.itemCount || 0} items</p>
            `;
            div.onclick = () => filterByCategory(catId);
            grid.appendChild(div);
        });
        
    } catch (error) {
        console.error('Error loading categories:', error);
        document.getElementById('categoriesGrid').innerHTML = 
            '<p class="text-center">Error loading categories</p>';
    }
}

// Load Quick Stats
async function loadQuickStats() {
    try {
        const ordersSnapshot = await database.ref('orders').once('value');
        const orders = ordersSnapshot.val();
        
        let todayOrders = 0;
        let pendingOrders = 0;
        let completedOrders = 0;
        
        const today = new Date().toDateString();
        
        if (orders) {
            Object.values(orders).forEach(order => {
                const orderDate = new Date(order.timestamp).toDateString();
                
                if (orderDate === today) {
                    todayOrders++;
                }
                
                if (order.status === 'pending' || order.status === 'processing') {
                    pendingOrders++;
                }
                
                if (order.status === 'completed') {
                    completedOrders++;
                }
            });
        }
        
        document.getElementById('todayOrders').textContent = todayOrders;
        document.getElementById('pendingOrders').textContent = pendingOrders;
        document.getElementById('completedOrders').textContent = completedOrders;
        
        // Get total customers
        const usersSnapshot = await database.ref('users').once('value');
        const users = usersSnapshot.val();
        const totalCustomers = users ? Object.keys(users).length : 0;
        document.getElementById('totalCustomers').textContent = totalCustomers;
        
    } catch (error) {
        console.error('Error loading quick stats:', error);
    }
}

// Setup Real-time Listeners
function setupRealtimeListeners() {
    // Listen for new orders
    database.ref('orders').on('child_added', () => {
        loadDashboardStats();
        loadRecentOrders();
        loadQuickStats();
    });
    
    // Listen for order updates
    database.ref('orders').on('child_changed', () => {
        loadDashboardStats();
        loadRecentOrders();
        loadQuickStats();
    });
    
    // Listen for menu item changes
    database.ref('menuItems').on('value', () => {
        loadMenuItems();
        loadDashboardStats();
    });
    
    // Listen for category changes
    database.ref('categories').on('value', () => {
        loadCategories();
        loadDashboardStats();
    });
}

// Menu Item Actions
function editMenuItem(itemId) {
    // TODO: Implement edit modal
    alert('Edit functionality coming soon! Item ID: ' + itemId);
}

function deleteMenuItem(itemId) {
    if (confirm('Are you sure you want to delete this menu item?')) {
        database.ref('menuItems/' + itemId).remove()
            .then(() => {
                alert('Menu item deleted successfully!');
            })
            .catch((error) => {
                console.error('Error deleting menu item:', error);
                alert('Failed to delete menu item.');
            });
    }
}

function showAddItemModal() {
    // TODO: Implement add item modal
    alert('Add item functionality coming soon!');
}

function showAddCategoryModal() {
    // TODO: Implement add category modal
    alert('Add category functionality coming soon!');
}

function filterByCategory(categoryId) {
    // TODO: Implement category filtering
    console.log('Filter by category:', categoryId);
}

// Logout function
function handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
        auth.signOut().then(() => {
            window.location.href = 'login.html';
        }).catch((error) => {
            console.error('Logout error:', error);
        });
    }
}

// ===== NOTIFICATIONS SYSTEM =====

let notifications = [];
let unreadCount = 0;
let lastCheckedTime = Date.now();

// Initialize notifications
function initializeNotifications() {
    // Load existing notifications from localStorage
    const savedNotifications = localStorage.getItem('adminNotifications');
    if (savedNotifications) {
        notifications = JSON.parse(savedNotifications);
        updateNotificationUI();
    }
    
    // Set up real-time listener for new orders
    listenForNewOrders();
}

// Listen for new orders in real-time
function listenForNewOrders() {
    const ordersRef = database.ref('orders');
    
    // Listen for new orders added
    ordersRef.on('child_added', (snapshot) => {
        const order = snapshot.val();
        const orderId = snapshot.key;
        
        // Only create notification for orders created after page load
        if (order.createdAt && order.createdAt > lastCheckedTime) {
            createNotification(order, orderId);
        }
    });
    
    // Listen for order status changes
    ordersRef.on('child_changed', (snapshot) => {
        const order = snapshot.val();
        const orderId = snapshot.key;
        
        // Optionally notify on status changes
        // createStatusChangeNotification(order, orderId);
    });
}

// Create a new notification
function createNotification(order, orderId) {
    const notification = {
        id: Date.now() + '_' + orderId,
        orderId: orderId,
        title: 'New Order Received',
        message: `Order #${order.orderNumber || orderId.substring(0, 8)} from ${order.customerName || 'Customer'}`,
        customerName: order.customerName || 'Unknown Customer',
        customerEmail: order.customerEmail || '',
        orderTotal: order.total || 0,
        timestamp: Date.now(),
        read: false,
        type: 'new_order'
    };
    
    // Add to notifications array
    notifications.unshift(notification);
    
    // Keep only last 50 notifications
    if (notifications.length > 50) {
        notifications = notifications.slice(0, 50);
    }
    
    // Save to localStorage
    localStorage.setItem('adminNotifications', JSON.stringify(notifications));
    
    // Update UI
    updateNotificationUI();
    
    // Show browser notification if permitted
    showBrowserNotification(notification);
    
    // Play sound
    playNotificationSound();
}

// Update notification UI
function updateNotificationUI() {
    const notificationList = document.getElementById('notificationList');
    const notificationCount = document.getElementById('notificationCount');
    const notificationBell = document.getElementById('notificationBell');
    
    // Count unread notifications
    unreadCount = notifications.filter(n => !n.read).length;
    
    // Update count badge
    if (unreadCount > 0) {
        notificationCount.textContent = unreadCount > 99 ? '99+' : unreadCount;
        notificationCount.style.display = 'flex';
        notificationBell.classList.add('has-notifications');
    } else {
        notificationCount.style.display = 'none';
        notificationBell.classList.remove('has-notifications');
    }
    
    // Update notification list
    if (notifications.length === 0) {
        notificationList.innerHTML = `
            <div class="empty-notifications">
                <i class="fas fa-bell-slash"></i>
                <p>No notifications</p>
            </div>
        `;
    } else {
        notificationList.innerHTML = notifications.map(notification => `
            <div class="notification-item ${!notification.read ? 'unread' : ''}" 
                 onclick="markAsRead('${notification.id}')" 
                 style="position: relative;">
                <div class="notification-icon">
                    <i class="fas ${getNotificationIcon(notification.type)}"></i>
                </div>
                <div class="notification-content">
                    <div class="notification-title">${notification.title}</div>
                    <div class="notification-message">${notification.message}</div>
                    <div class="notification-time">${formatTime(notification.timestamp)}</div>
                </div>
            </div>
        `).join('');
    }
}

// Get notification icon based on type
function getNotificationIcon(type) {
    switch(type) {
        case 'new_order':
            return 'fa-shopping-cart';
        case 'order_completed':
            return 'fa-check-circle';
        case 'order_cancelled':
            return 'fa-times-circle';
        default:
            return 'fa-bell';
    }
}

// Format timestamp to relative time
function formatTime(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;
    
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (seconds < 60) return 'Just now';
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    return `${days} day${days > 1 ? 's' : ''} ago`;
}

// Toggle notification panel
function toggleNotifications() {
    const panel = document.getElementById('notificationPanel');
    panel.classList.toggle('active');
}

// Mark notification as read
function markAsRead(notificationId) {
    const notification = notifications.find(n => n.id === notificationId);
    if (notification && !notification.read) {
        notification.read = true;
        localStorage.setItem('adminNotifications', JSON.stringify(notifications));
        updateNotificationUI();
    }
}

// Mark all as read
function markAllAsRead() {
    notifications.forEach(n => n.read = true);
    localStorage.setItem('adminNotifications', JSON.stringify(notifications));
    updateNotificationUI();
}

// Show browser notification
function showBrowserNotification(notification) {
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(notification.title, {
            body: notification.message,
            icon: './images/images_(1).jpeg',
            tag: notification.id
        });
    } else if ('Notification' in window && Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                new Notification(notification.title, {
                    body: notification.message,
                    icon: './images/images_(1).jpeg',
                    tag: notification.id
                });
            }
        });
    }
}

// Play notification sound
function playNotificationSound() {
    // Create a simple beep sound using Web Audio API
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
        console.log('Could not play notification sound:', error);
    }
}

// Make functions globally available
window.toggleNotifications = toggleNotifications;
window.markAsRead = markAsRead;
window.markAllAsRead = markAllAsRead;
