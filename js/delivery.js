// Delivery/Checkout Page JavaScript
let cart = [];
let orderType = 'pickup'; // Default
let currentUser = null;
const DELIVERY_FEE = 20; // E20.00 delivery fee

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    loadCart();
    displayOrderSummary();
});

// Check authentication
function checkAuth() {
    auth.onAuthStateChanged((user) => {
        currentUser = user;
        if (user) {
            // Pre-fill user information
            database.ref('users/' + user.uid).once('value', (snapshot) => {
                const userData = snapshot.val();
                if (userData) {
                    document.getElementById('customerName').value = userData.name || '';
                    document.getElementById('customerEmail').value = userData.email || '';
                }
            });
        }
    });
}

// Load cart from localStorage
function loadCart() {
    cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    if (cart.length === 0) {
        document.getElementById('checkoutContainer').innerHTML = `
            <div class="empty-cart" style="grid-column: 1 / -1;">
                <i class="fas fa-shopping-cart"></i>
                <h2>Your cart is empty</h2>
                <p>Add some items to your cart before checking out</p>
                <a href="menu.html" class="btn btn-primary" style="display: inline-block; margin-top: 1rem; padding: 1rem 2rem; text-decoration: none;">
                    Browse Menu
                </a>
            </div>
        `;
    }
}

// Select order type
window.selectOrderType = function(type) {
    orderType = type;
    
    // Update UI
    document.querySelectorAll('.order-type-option').forEach(option => {
        option.classList.remove('active');
    });
    document.querySelector(`[data-type="${type}"]`).classList.add('active');
    
    // Show/hide delivery fields
    const deliveryFields = document.getElementById('deliveryFields');
    const deliveryFeeRow = document.getElementById('deliveryFeeRow');
    
    if (type === 'delivery') {
        deliveryFields.classList.add('active');
        deliveryFeeRow.style.display = 'flex';
        // Make delivery fields required
        document.getElementById('deliveryAddress').required = true;
        document.getElementById('deliveryCity').required = true;
    } else {
        deliveryFields.classList.remove('active');
        deliveryFeeRow.style.display = 'none';
        // Remove required from delivery fields
        document.getElementById('deliveryAddress').required = false;
        document.getElementById('deliveryCity').required = false;
    }
    
    updateTotals();
}

// Display order summary
function displayOrderSummary() {
    const orderItemsContainer = document.getElementById('orderItems');
    
    if (cart.length === 0) return;
    
    orderItemsContainer.innerHTML = cart.map(item => `
        <div class="order-item">
            <img src="${item.imageUrl || './images/placeholder.jpg'}" alt="${item.name}">
            <div class="order-item-details">
                <h4>${item.name}</h4>
                <p>Quantity: ${item.quantity}</p>
                <p class="order-item-price">E${(item.price * item.quantity).toFixed(2)}</p>
            </div>
        </div>
    `).join('');
    
    updateTotals();
}

// Update totals
function updateTotals() {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const deliveryFee = orderType === 'delivery' ? DELIVERY_FEE : 0;
    const total = subtotal + deliveryFee;
    
    document.getElementById('subtotal').textContent = `E${subtotal.toFixed(2)}`;
    document.getElementById('deliveryFee').textContent = `E${deliveryFee.toFixed(2)}`;
    document.getElementById('grandTotal').textContent = `E${total.toFixed(2)}`;
}

// Go to payment page
window.goToPayment = function() {
    const form = document.getElementById('orderForm');
    
    // Validate form
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    const customerName = document.getElementById('customerName').value.trim();
    const customerPhone = document.getElementById('customerPhone').value.trim();
    const customerEmail = document.getElementById('customerEmail').value.trim();
    const orderNotes = document.getElementById('orderNotes').value.trim();
    
    if (!customerName || !customerPhone) {
        alert('Please fill in all required fields');
        return;
    }
    
    // Delivery specific fields
    let deliveryAddress = '';
    let deliveryCity = '';
    let deliveryZone = '';
    
    if (orderType === 'delivery') {
        deliveryAddress = document.getElementById('deliveryAddress').value.trim();
        deliveryCity = document.getElementById('deliveryCity').value.trim();
        deliveryZone = document.getElementById('deliveryZone').value.trim();
        
        if (!deliveryAddress || !deliveryCity) {
            alert('Please fill in delivery address and city');
            return;
        }
    }
    
    // Calculate totals
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const deliveryFee = orderType === 'delivery' ? DELIVERY_FEE : 0;
    const total = subtotal + deliveryFee;
    
    // Save order data to localStorage for payment page
    const orderData = {
        orderType: orderType,
        customerInfo: {
            name: customerName,
            phone: customerPhone,
            email: customerEmail,
            userId: currentUser ? currentUser.uid : null
        },
        deliveryInfo: orderType === 'delivery' ? {
            address: deliveryAddress,
            city: deliveryCity,
            zone: deliveryZone
        } : null,
        items: cart,
        pricing: {
            subtotal: subtotal,
            deliveryFee: deliveryFee,
            total: total
        },
        orderNotes: orderNotes
    };
    
    // Save to localStorage
    localStorage.setItem('pendingOrder', JSON.stringify(orderData));
    
    // Redirect to payment page
    window.location.href = 'payment.html';
}
