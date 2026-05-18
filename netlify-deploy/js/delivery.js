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
    
    // Show/hide delivery/pickup fields
    const deliveryFields = document.getElementById('deliveryFields');
    const pickupFields = document.getElementById('pickupFields');
    const deliveryFeeRow = document.getElementById('deliveryFeeRow');
    
    // Toggle buttons based on order type
    const btnGoToPayment = document.getElementById('btnGoToPayment');
    const btnShowReceipt = document.getElementById('btnShowReceipt');
    
    if (type === 'delivery') {
        deliveryFields.classList.add('active');
        pickupFields.classList.add('hidden');
        deliveryFeeRow.style.display = 'flex';
        // Make delivery fields required
        document.getElementById('deliveryAddress').required = true;
        document.getElementById('deliveryCity').required = true;
        document.getElementById('pickupCity').required = false;
        
        // Show payment button, hide receipt button
        btnGoToPayment.style.display = 'block';
        btnShowReceipt.style.display = 'none';
    } else {
        deliveryFields.classList.remove('active');
        pickupFields.classList.remove('hidden');
        deliveryFeeRow.style.display = 'none';
        // Remove required from delivery fields, add to pickup
        document.getElementById('deliveryAddress').required = false;
        document.getElementById('deliveryCity').required = false;
        document.getElementById('pickupCity').required = true;
        
        // Show receipt button, hide payment button
        btnGoToPayment.style.display = 'none';
        btnShowReceipt.style.display = 'block';
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
    let pickupCity = '';
    
    if (orderType === 'delivery') {
        deliveryAddress = document.getElementById('deliveryAddress').value.trim();
        deliveryCity = document.getElementById('deliveryCity').value.trim();
        deliveryZone = document.getElementById('deliveryZone').value.trim();
        
        if (!deliveryAddress || !deliveryCity) {
            alert('Please fill in delivery address and city');
            return;
        }
    } else if (orderType === 'pickup') {
        pickupCity = document.getElementById('pickupCity').value.trim();
        
        if (!pickupCity) {
            alert('Please select a pickup branch');
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
        pickupInfo: orderType === 'pickup' ? {
            branch: pickupCity
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

// Generate receipt for pickup orders
window.generateReceipt = async function() {
    console.log('🧾 Starting receipt generation process...');
    
    const form = document.getElementById('orderForm');
    
    // Validate form
    if (!form.checkValidity()) {
        console.warn('⚠️ Form validation failed');
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
    
    // Get pickup city
    const pickupCity = document.getElementById('pickupCity').value.trim();
    
    if (!pickupCity) {
        alert('Please select a pickup branch');
        return;
    }
    
    console.log('✅ Form validated');
    
    // Calculate totals
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const deliveryFee = 0; // No delivery fee for pickup
    const total = subtotal + deliveryFee;
    
    console.log('💰 Order total:', total);
    console.log('📍 Pickup branch:', pickupCity);
    
    try {
        // Generate order number
        console.log('🔢 Generating order number...');
        const orderNumber = await generateDailyOrderNumber();
        console.log('✅ Order number generated:', orderNumber);
        
        // Prepare order data to save to Firebase
        const orderData = {
            orderType: 'pickup',
            customerName: customerName,
            customerPhone: customerPhone,
            customerEmail: customerEmail,
            userId: currentUser ? currentUser.uid : null,
            deliveryAddress: null,
            deliveryCity: pickupCity,
            deliveryZone: null,
            specialInstructions: orderNotes,
            items: cart,
            subtotal: subtotal,
            deliveryFee: 0,
            total: total,
            paymentMethod: 'cod', // Cash on Pickup
            paymentStatus: 'pending',
            status: 'pending',
            createdAt: Date.now(),
            orderNumber: orderNumber
        };
        
        // Save order to Firebase
        console.log('💾 Saving order to Firebase...');
        const orderRef = await database.ref('orders').push(orderData);
        console.log('✅ Pickup order saved to Firebase:', orderRef.key);
        
        // Generate PDF receipt
        console.log('📄 Generating PDF receipt...');
        await createPDFReceipt(orderData, orderNumber);
        console.log('✅ PDF generation completed');
        
        // Clear cart after successful order
        localStorage.removeItem('cart');
        cart = [];
        console.log('🛒 Cart cleared');
        
        // Show success message
        alert(`Order placed successfully!\nOrder Number: ${orderNumber}\n\nYour receipt has been downloaded.\n\nPlease bring this receipt when picking up your order.\n\nPay at pickup: E${total.toFixed(2)}`);
        
        // Redirect to menu
        setTimeout(() => {
            console.log('↩️ Redirecting to menu...');
            window.location.href = 'menu.html';
        }, 1000);
        
    } catch (error) {
        console.error('❌ Error in receipt generation process:', error);
        console.error('Error details:', error.message, error.stack);
        alert(`Error generating receipt: ${error.message}\n\nPlease check the browser console (F12) for details and try again.`);
    }
}

// Generate daily sequential order number
async function generateDailyOrderNumber() {
    try {
        const today = new Date();
        const dateKey = today.toISOString().split('T')[0];
        
        console.log('📅 Getting order counter for date:', dateKey);
        
        const counterRef = database.ref(`orderCounters/${dateKey}`);
        
        const result = await counterRef.transaction((currentValue) => {
            return (currentValue || 0) + 1;
        });
        
        if (!result.committed) {
            throw new Error('Failed to generate order number');
        }
        
        const orderNumber = result.snapshot.val();
        const formattedNumber = String(orderNumber).padStart(5, '0');
        
        console.log('📋 Generated order number:', formattedNumber);
        
        return formattedNumber;
        
    } catch (error) {
        console.error('❌ Error generating order number:', error);
        const fallback = String(Date.now()).slice(-5);
        console.warn('⚠️ Using fallback order number:', fallback);
        return fallback;
    }
}

// Create PDF receipt
async function createPDFReceipt(orderData, orderNumber) {
    console.log('📄 Starting PDF generation...');
    
    try {
        // Check if jsPDF is loaded
        if (!window.jspdf || !window.jspdf.jsPDF) {
            throw new Error('jsPDF library is not loaded. Please refresh the page and try again.');
        }
        
        const { jsPDF } = window.jspdf;
        console.log('✅ jsPDF library loaded');
        
        const doc = new jsPDF();
        console.log('✅ PDF document created');
        
        // Set font
        doc.setFont('helvetica');
        
        // Add logo with timeout to prevent hanging
        try {
            console.log('🖼️ Loading company logo...');
            
            const logoImg = new Image();
            // Use absolute path from window location for app mode compatibility
            const basePath = window.location.href.substring(0, window.location.href.lastIndexOf('/') + 1);
            logoImg.src = basePath + 'images/images_(1).jpeg';
            
            // Add timeout to prevent hanging (5 seconds max)
            const logoLoadPromise = new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    console.warn('⏱️ Logo loading timed out');
                    reject(new Error('Logo loading timeout'));
                }, 5000);
                
                logoImg.onload = () => {
                    clearTimeout(timeout);
                    console.log('✅ Logo loaded successfully');
                    try {
                        // Calculate logo dimensions (maintain aspect ratio)
                        const logoWidth = 40;
                        const logoHeight = (logoImg.height / logoImg.width) * logoWidth;
                        const logoX = (doc.internal.pageSize.width - logoWidth) / 2;
                        
                        doc.addImage(logoImg, 'JPEG', logoX, 10, logoWidth, logoHeight);
                        resolve();
                    } catch (err) {
                        console.warn('⚠️ Error adding logo to PDF:', err);
                        resolve(); // Continue without logo
                    }
                };
                
                logoImg.onerror = () => {
                    clearTimeout(timeout);
                    console.warn('❌ Could not load logo image');
                    resolve(); // Continue without logo
                };
            });
            
            await logoLoadPromise;
            
        } catch (error) {
            console.warn('⚠️ Error loading logo (continuing without it):', error.message);
        }
    
    // Header
    doc.setFontSize(20);
    doc.setTextColor(220, 53, 69); // Primary red color
    doc.text('THE PIZZA CLUB AND GRILL', doc.internal.pageSize.width / 2, 50, { align: 'center' });
    
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text('ORDER RECEIPT', doc.internal.pageSize.width / 2, 58, { align: 'center' });
    
    // Order info
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    const currentDate = new Date().toLocaleString();
    doc.text(`Date: ${currentDate}`, 20, 70);
    doc.text(`Order Type: PICKUP (Cash on Pickup)`, 20, 76);
    
    // Order Number - Highlighted
    doc.setFillColor(220, 53, 69);
    doc.rect(20, 82, 170, 10, 'F');
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.text(`ORDER NUMBER: #${orderNumber}`, doc.internal.pageSize.width / 2, 89, { align: 'center' });
    
    // Customer Information
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text('Customer Information:', 20, 102);
    
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    doc.text(`Name: ${orderData.customerName}`, 20, 110);
    doc.text(`Phone: ${orderData.customerPhone}`, 20, 116);
    if (orderData.customerEmail) {
        doc.text(`Email: ${orderData.customerEmail}`, 20, 122);
    }
    
    // Items table header
    let yPos = orderData.customerEmail ? 135 : 129;
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text('Order Items:', 20, yPos);
    
    yPos += 8;
    doc.setFillColor(240, 240, 240);
    doc.rect(20, yPos - 5, 170, 8, 'F');
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text('Item', 25, yPos);
    doc.text('Qty', 120, yPos);
    doc.text('Price', 145, yPos);
    doc.text('Total', 170, yPos);
    
    // Items
    yPos += 8;
    doc.setFontSize(9);
    doc.setTextColor(60, 60, 60);
    
    orderData.items.forEach((item, index) => {
        if (yPos > 250) { // Add new page if needed
            doc.addPage();
            yPos = 20;
        }
        
        const itemTotal = item.price * item.quantity;
        doc.text(item.name.substring(0, 30), 25, yPos); // Truncate long names
        doc.text(String(item.quantity), 120, yPos);
        doc.text(`E${item.price.toFixed(2)}`, 145, yPos);
        doc.text(`E${itemTotal.toFixed(2)}`, 170, yPos);
        yPos += 6;
    });
    
    // Totals
    yPos += 5;
    doc.setDrawColor(200, 200, 200);
    doc.line(20, yPos, 190, yPos);
    
    yPos += 8;
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text('Subtotal:', 120, yPos);
    doc.text(`E${orderData.subtotal.toFixed(2)}`, 170, yPos);
    
    yPos += 6;
    doc.text('Delivery Fee:', 120, yPos);
    doc.text('E0.00', 170, yPos);
    
    yPos += 8;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL TO PAY:', 120, yPos);
    doc.text(`E${orderData.total.toFixed(2)}`, 170, yPos);
    
    // Special instructions
    if (orderData.specialInstructions) {
        yPos += 12;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('Special Instructions:', 20, yPos);
        yPos += 6;
        doc.setFontSize(9);
        doc.setTextColor(60, 60, 60);
        const lines = doc.splitTextToSize(orderData.specialInstructions, 170);
        doc.text(lines, 20, yPos);
        yPos += lines.length * 5;
    }
    
    // Footer
    yPos = doc.internal.pageSize.height - 30;
    doc.setFontSize(10);
    doc.setTextColor(220, 53, 69);
    doc.setFont('helvetica', 'bold');
    doc.text('IMPORTANT: BRING THIS RECEIPT WHEN PICKING UP YOUR ORDER', doc.internal.pageSize.width / 2, yPos, { align: 'center' });
    
    yPos += 8;
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.setFont('helvetica', 'normal');
    doc.text('Payment will be collected at pickup.', doc.internal.pageSize.width / 2, yPos, { align: 'center' });
    
    yPos += 6;
    doc.text('Thank you for your order!', doc.internal.pageSize.width / 2, yPos, { align: 'center' });
    
    yPos += 6;
    doc.setFontSize(8);
    doc.text('The Pizza Club and Grill - Eswatini', doc.internal.pageSize.width / 2, yPos, { align: 'center' });
    
        // Save PDF with error handling
        try {
            console.log('💾 Saving PDF...');
            doc.save(`Receipt_Order_${orderNumber}.pdf`);
            console.log('✅ PDF receipt generated and downloaded successfully');
        } catch (saveError) {
            console.error('❌ Error saving PDF:', saveError);
            throw new Error('Failed to save PDF: ' + saveError.message);
        }
        
    } catch (error) {
        console.error('❌ Error in PDF generation:', error);
        throw error; // Re-throw to be caught by generateReceipt
    }
}
