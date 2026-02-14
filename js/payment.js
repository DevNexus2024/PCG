// Payment Page JavaScript
// The Pizza Club and Grill - Food Ordering Website

let pendingOrder = null;
let currentUser = null;

// Wait for page to load
document.addEventListener('DOMContentLoaded', function() {
    console.log('Payment page loaded');
    
    // Check authentication
    firebase.auth().onAuthStateChanged((user) => {
        if (!user) {
            // User not logged in, redirect to login
            window.location.href = 'login.html?returnUrl=payment.html';
            return;
        }
        
        currentUser = user;
        
        // Load pending order from localStorage
        loadPendingOrder();
    });
    
    // Setup payment method listeners
    setupPaymentMethodListeners();
});

function loadPendingOrder() {
    const orderData = localStorage.getItem('pendingOrder');
    
    if (!orderData) {
        // No pending order, show empty state
        showEmptyState();
        return;
    }
    
    try {
        const rawOrder = JSON.parse(orderData);
        console.log('Raw pending order loaded:', rawOrder);
        
        // Normalize the order structure to flatten nested objects
        pendingOrder = {
            orderType: rawOrder.orderType,
            customerName: rawOrder.customerInfo?.name || rawOrder.customerName,
            customerPhone: rawOrder.customerInfo?.phone || rawOrder.customerPhone,
            customerEmail: rawOrder.customerInfo?.email || rawOrder.customerEmail,
            deliveryAddress: rawOrder.deliveryInfo?.address || rawOrder.deliveryAddress,
            deliveryCity: rawOrder.deliveryInfo?.city || rawOrder.deliveryCity,
            deliveryZone: rawOrder.deliveryInfo?.zone || rawOrder.deliveryZone,
            items: rawOrder.items,
            subtotal: rawOrder.pricing?.subtotal || rawOrder.subtotal || 0,
            deliveryFee: rawOrder.pricing?.deliveryFee || rawOrder.deliveryFee || 0,
            specialInstructions: rawOrder.orderNotes || rawOrder.specialInstructions
        };
        
        console.log('Normalized pending order:', pendingOrder);
        
        // Display order summary
        displayOrderSummary();
        
        // Display customer details
        displayCustomerDetails();
        
    } catch (error) {
        console.error('Error loading pending order:', error);
        showEmptyState();
    }
}

function displayOrderSummary() {
    const orderItemsContainer = document.getElementById('orderItems');
    const subtotalElement = document.getElementById('subtotal');
    const deliveryFeeElement = document.getElementById('deliveryFee');
    const grandTotalElement = document.getElementById('grandTotal');
    
    if (!pendingOrder || !pendingOrder.items || pendingOrder.items.length === 0) {
        orderItemsContainer.innerHTML = '<p style="color: #666; text-align: center;">No items in order</p>';
        return;
    }
    
    // Display items
    let itemsHTML = '';
    pendingOrder.items.forEach(item => {
        const itemTotal = item.price * item.quantity;
        itemsHTML += `
            <div class="order-item">
                <div class="item-details">
                    <div class="item-name">${item.name}</div>
                    <div class="item-quantity">Quantity: ${item.quantity} × E${item.price.toFixed(2)}</div>
                </div>
                <div class="item-price">E${itemTotal.toFixed(2)}</div>
            </div>
        `;
    });
    
    orderItemsContainer.innerHTML = itemsHTML;
    
    // Display totals
    const subtotal = pendingOrder.subtotal || 0;
    const deliveryFee = pendingOrder.deliveryFee || 0;
    const total = subtotal + deliveryFee;
    
    subtotalElement.textContent = `E${subtotal.toFixed(2)}`;
    deliveryFeeElement.textContent = `E${deliveryFee.toFixed(2)}`;
    grandTotalElement.textContent = `E${total.toFixed(2)}`;
}

function displayCustomerDetails() {
    const customerInfoContainer = document.getElementById('customerInfo');
    
    if (!pendingOrder) return;
    
    // Build full delivery address
    let fullAddress = '';
    if (pendingOrder.deliveryAddress) {
        fullAddress = pendingOrder.deliveryAddress;
        if (pendingOrder.deliveryCity) {
            fullAddress += ', ' + pendingOrder.deliveryCity;
        }
        if (pendingOrder.deliveryZone) {
            fullAddress += ', ' + pendingOrder.deliveryZone;
        }
    }
    
    const infoHTML = `
        <div class="info-row">
            <span class="info-label">Name:</span>
            <span class="info-value">${pendingOrder.customerName || 'N/A'}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Phone:</span>
            <span class="info-value">${pendingOrder.customerPhone || 'N/A'}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Email:</span>
            <span class="info-value">${pendingOrder.customerEmail || currentUser.email}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Order Type:</span>
            <span class="info-value">${pendingOrder.orderType === 'delivery' ? 'Delivery' : 'Pickup'}</span>
        </div>
        ${pendingOrder.orderType === 'delivery' && fullAddress ? `
        <div class="info-row">
            <span class="info-label">Address:</span>
            <span class="info-value">${fullAddress}</span>
        </div>
        ` : ''}
        ${pendingOrder.specialInstructions ? `
        <div class="info-row">
            <span class="info-label">Instructions:</span>
            <span class="info-value">${pendingOrder.specialInstructions}</span>
        </div>
        ` : ''}
    `;
    
    customerInfoContainer.innerHTML = infoHTML;
}

function setupPaymentMethodListeners() {
    const mtnOption = document.getElementById('mtnOption');
    const cardOption = document.getElementById('cardOption');
    const codOption = document.getElementById('codOption');
    const mtnInput = document.getElementById('mtnInput');
    const cardInput = document.getElementById('cardInput');
    
    // MTN Mobile Money
    document.getElementById('mtnRadio').addEventListener('change', function() {
        if (this.checked) {
            mtnOption.classList.add('selected');
            cardOption.classList.remove('selected');
            codOption.classList.remove('selected');
            mtnInput.classList.add('show');
            cardInput.classList.remove('show');
            
            // Update MTN amount field with order total
            updateMTNAmount();
        }
    });
    
    // Card Payment
    document.getElementById('cardRadio').addEventListener('change', function() {
        if (this.checked) {
            mtnOption.classList.remove('selected');
            cardOption.classList.add('selected');
            codOption.classList.remove('selected');
            mtnInput.classList.remove('show');
            cardInput.classList.add('show');
        }
    });
    
    // Cash on Delivery
    document.getElementById('codRadio').addEventListener('change', function() {
        if (this.checked) {
            mtnOption.classList.remove('selected');
            cardOption.classList.remove('selected');
            codOption.classList.add('selected');
            mtnInput.classList.remove('show');
            cardInput.classList.remove('show');
        }
    });
    
    // MTN number formatting and validation
    const mtnNumberInput = document.getElementById('mtnNumber');
    if (mtnNumberInput) {
        mtnNumberInput.addEventListener('input', function(e) {
            // Remove non-digits
            let value = e.target.value.replace(/\D/g, '');
            
            // Limit to 11 digits (268 + 8 digits)
            if (value.length > 11) {
                value = value.substring(0, 11);
            }
            
            e.target.value = value;
        });
        
        mtnNumberInput.addEventListener('blur', function(e) {
            let value = e.target.value;
            
            // Auto-add country code if user entered 8 digits
            if (value.length === 8) {
                e.target.value = '268' + value;
            }
        });
    }
    
    // Card number formatting
    const cardNumberInput = document.getElementById('cardNumber');
    if (cardNumberInput) {
        cardNumberInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\s/g, '');
            let formattedValue = value.match(/.{1,4}/g)?.join(' ') || value;
            e.target.value = formattedValue;
        });
    }
    
    // Expiry date formatting
    const expiryDateInput = document.getElementById('expiryDate');
    if (expiryDateInput) {
        expiryDateInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length >= 2) {
                value = value.substring(0, 2) + '/' + value.substring(2, 4);
            }
            e.target.value = value;
        });
    }
    
    // CVV - numbers only
    const cvvInput = document.getElementById('cvv');
    if (cvvInput) {
        cvvInput.addEventListener('input', function(e) {
            e.target.value = e.target.value.replace(/\D/g, '');
        });
    }
}

function updateMTNAmount() {
    if (pendingOrder) {
        const total = pendingOrder.subtotal + pendingOrder.deliveryFee;
        const mtnAmountField = document.getElementById('mtnAmount');
        if (mtnAmountField) {
            mtnAmountField.value = `E${total.toFixed(2)} (SZL)`;
        }
    }
}

async function processPayment() {
    // Get selected payment method
    const selectedMethod = document.querySelector('input[name="paymentMethod"]:checked');
    
    if (!selectedMethod) {
        alert('Please select a payment method');
        return;
    }
    
    const paymentMethod = selectedMethod.value;
    
    // Validate MTN Mobile Money details if MTN is selected
    if (paymentMethod === 'mtn') {
        const mtnAccountName = document.getElementById('mtnAccountName').value.trim();
        const mtnNumber = document.getElementById('mtnNumber').value.trim();
        
        // Validate account holder name
        if (!mtnAccountName || mtnAccountName.length < 3) {
            alert('Please enter the account holder name as registered with MTN (minimum 3 characters)');
            return;
        }
        
        // Validate MTN number format
        if (!mtnNumber) {
            alert('Please enter your MTN Mobile Money number');
            return;
        }
        
        // Check if it's 8 digits or 11 digits (with country code 268)
        const digitsOnly = mtnNumber.replace(/\D/g, '');
        
        if (digitsOnly.length === 8) {
            // Valid 8-digit format
            if (!/^[67]/.test(digitsOnly)) {
                alert('MTN Mobile Money numbers in Eswatini should start with 6 or 7');
                return;
            }
        } else if (digitsOnly.length === 11) {
            // Valid 11-digit format with country code
            if (!digitsOnly.startsWith('268')) {
                alert('Country code must be 268 for Eswatini');
                return;
            }
            if (!/^268[67]/.test(digitsOnly)) {
                alert('MTN Mobile Money numbers in Eswatini should start with 268 followed by 6 or 7');
                return;
            }
        } else {
            alert('Please enter a valid MTN Mobile Money number (8 digits or 11 digits with country code 268)');
            return;
        }
        
        // Additional validation: Check if name matches customer name
        const customerName = pendingOrder.customerName.toLowerCase();
        const accountName = mtnAccountName.toLowerCase();
        
        // Simple check - just warn, don't block
        if (!customerName.includes(accountName.split(' ')[0]) && !accountName.includes(customerName.split(' ')[0])) {
            const confirmMismatch = confirm(
                `The MTN account name "${mtnAccountName}" doesn't match your order name "${pendingOrder.customerName}".\n\n` +
                'Make sure the account name matches the registered MTN Mobile Money account.\n\n' +
                'Continue anyway?'
            );
            if (!confirmMismatch) {
                return;
            }
        }
    }
    
    // Validate card details if Card is selected
    if (paymentMethod === 'card') {
        const cardholderName = document.getElementById('cardholderName').value.trim();
        const cardNumber = document.getElementById('cardNumber').value.replace(/\s/g, '');
        const expiryDate = document.getElementById('expiryDate').value.trim();
        const cvv = document.getElementById('cvv').value.trim();
        
        // Validate cardholder name
        if (!cardholderName || cardholderName.length < 3) {
            alert('Please enter a valid cardholder name');
            return;
        }
        
        // Validate card number (13-19 digits)
        if (!cardNumber || cardNumber.length < 13 || cardNumber.length > 19 || !/^\d+$/.test(cardNumber)) {
            alert('Please enter a valid card number (13-19 digits)');
            return;
        }
        
        // Validate expiry date (MM/YY format)
        if (!expiryDate || !/^\d{2}\/\d{2}$/.test(expiryDate)) {
            alert('Please enter expiry date in MM/YY format');
            return;
        }
        
        // Check if expiry date is valid and not expired
        const [month, year] = expiryDate.split('/').map(Number);
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear() % 100; // Get last 2 digits
        const currentMonth = currentDate.getMonth() + 1;
        
        if (month < 1 || month > 12) {
            alert('Please enter a valid month (01-12)');
            return;
        }
        
        if (year < currentYear || (year === currentYear && month < currentMonth)) {
            alert('Your card has expired. Please use a valid card');
            return;
        }
        
        // Validate CVV (3-4 digits)
        if (!cvv || cvv.length < 3 || cvv.length > 4 || !/^\d+$/.test(cvv)) {
            alert('Please enter a valid CVV (3-4 digits)');
            return;
        }
        
        // Basic Luhn algorithm check for card number
        if (!validateCardNumberLuhn(cardNumber)) {
            alert('Invalid card number. Please check and try again');
            return;
        }
    }
    
    // Disable pay button
    const payButton = document.getElementById('payButton');
    payButton.disabled = true;
    payButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    
    try {
        // Generate unique order number
        const orderNumber = generateOrderNumber();
        
        // Prepare order data
        const orderData = {
            userId: currentUser.uid,
            userEmail: currentUser.email,
            customerName: pendingOrder.customerName,
            customerPhone: pendingOrder.customerPhone,
            customerEmail: pendingOrder.customerEmail || currentUser.email,
            orderType: pendingOrder.orderType,
            deliveryAddress: pendingOrder.deliveryAddress || null,
            specialInstructions: pendingOrder.specialInstructions || null,
            items: pendingOrder.items,
            subtotal: pendingOrder.subtotal,
            deliveryFee: pendingOrder.deliveryFee,
            total: pendingOrder.subtotal + pendingOrder.deliveryFee,
            paymentMethod: paymentMethod,
            paymentStatus: paymentMethod === 'cod' ? 'pending' : 'pending_verification',
            orderStatus: 'pending',
            createdAt: new Date().toISOString(),
            orderNumber: orderNumber
        };
        
        // Add MTN number if applicable
        if (paymentMethod === 'mtn') {
            const mtnAccountName = document.getElementById('mtnAccountName').value.trim();
            const mtnNumber = document.getElementById('mtnNumber').value.trim();
            
            // Normalize phone number (remove country code if present for MSISDN)
            let msisdn = mtnNumber.replace(/\D/g, '');
            if (msisdn.startsWith('268')) {
                msisdn = msisdn.substring(3); // Remove 268 country code
            }
            
            // Store MTN details
            orderData.mtnAccountName = mtnAccountName;
            orderData.mtnNumber = msisdn;
            orderData.mtnFullNumber = mtnNumber; // Store as entered
            
            // Build MTN MoMo requestToPay API payload for Eswatini
            const total = pendingOrder.subtotal + pendingOrder.deliveryFee;
            const momoPayload = {
                amount: total.toString(),
                currency: "SZL",
                externalId: orderNumber,
                payer: {
                    partyIdType: "MSISDN",
                    partyId: msisdn // Use normalized 8-digit number
                },
                payerMessage: `Payment for order ${orderNumber} - The Pizza Club and Grill`,
                payeeNote: `Order ${orderNumber} - ${mtnAccountName} - ${pendingOrder.items.length} item(s)`
            };
            
            console.log('MTN Mobile Money payment payload prepared:', momoPayload);
            
            // TODO: Uncomment when Firebase Cloud Function is deployed
            /*
            try {
                const response = await fetch('https://us-central1-food-ordering-website-2025.cloudfunctions.net/paywithMomo', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(momoPayload)
                });
                
                if (response.ok) {
                    const result = await response.json();
                    console.log('MTN Mobile Money payment successful:', result);
                    
                    // Update payment status with transaction details
                    orderData.paymentStatus = 'paid';
                    orderData.paymentTransactionId = result.transactionId || null;
                    orderData.paymentResponse = result;
                } else {
                    const errorResult = await response.json();
                    console.warn('Payment API error:', errorResult);
                    orderData.paymentStatus = 'pending_verification';
                    orderData.paymentNote = errorResult.error || 'Payment verification pending';
                }
            } catch (fetchError) {
                console.warn('Cloud Function error:', fetchError.message);
                orderData.paymentStatus = 'pending_verification';
                orderData.paymentNote = 'Payment verification pending - Cloud Function unavailable';
            }
            */
            
            // For now, mark MTN payments as pending verification until Cloud Function is deployed
            orderData.paymentStatus = 'pending_verification';
            orderData.paymentNote = 'Payment will be verified - Cloud Function not yet deployed';
            orderData.momoPayload = momoPayload; // Save payload for later processing
            
        } else if (paymentMethod === 'card') {
            // Get card details (store only last 4 digits for security)
            const cardNumber = document.getElementById('cardNumber').value.replace(/\s/g, '');
            const cardholderName = document.getElementById('cardholderName').value.trim();
            const expiryDate = document.getElementById('expiryDate').value.trim();
            
            // Store limited card info for reference (never store full card number or CVV)
            orderData.cardInfo = {
                cardholderName: cardholderName,
                lastFourDigits: cardNumber.slice(-4),
                expiryDate: expiryDate,
                cardType: detectCardType(cardNumber)
            };
            
            // Card payment - mark as pending verification
            orderData.paymentStatus = 'pending_verification';
            orderData.paymentNote = 'Card payment pending verification';
            
        } else if (paymentMethod === 'cod') {
            // Cash on delivery - mark as pending
            orderData.paymentStatus = 'pending';
        }
        
        console.log('Saving order to Firebase:', orderData);
        
        // Save order to Firebase
        const orderRef = await database.ref('orders').push(orderData);
        
        console.log('Order saved successfully:', orderRef.key);
        
        // Clear pending order from localStorage
        localStorage.removeItem('pendingOrder');
        
        // Clear cart
        localStorage.removeItem('cart');
        
        // Show success message
        alert(`Order placed successfully!\nOrder Number: ${orderData.orderNumber}\n\nPayment Method: ${getPaymentMethodName(paymentMethod)}\n\nThank you for your order!`);
        
        // Redirect to menu page
        window.location.href = 'menu.html';
        
    } catch (error) {
        console.error('Error processing payment:', error);
        alert('Error processing payment. Please try again.');
        
        // Re-enable pay button
        payButton.disabled = false;
        payButton.innerHTML = '<i class="fas fa-check-circle"></i> Pay Now';
    }
}

function cancelPayment() {
    if (confirm('Are you sure you want to cancel this payment? You will be redirected back to the delivery page.')) {
        window.location.href = 'delivery.html';
    }
}

function generateOrderNumber() {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `ORD${timestamp}${random}`;
}

function getPaymentMethodName(method) {
    switch (method) {
        case 'mtn':
            return 'MTN Mobile Money';
        case 'card':
            return 'Credit/Debit Card';
        case 'cod':
            return 'Cash on Delivery';
        default:
            return 'Unknown';
    }
}

function showEmptyState() {
    const container = document.getElementById('paymentContent');
    container.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
            <i class="fas fa-shopping-cart"></i>
            <h2>No Pending Order</h2>
            <p>You don't have any pending orders to pay for.</p>
            <button class="btn btn-pay" onclick="window.location.href='menu.html'" style="max-width: 300px; margin: 2rem auto;">
                <i class="fas fa-utensils"></i> Browse Menu
            </button>
        </div>
    `;
}

// Luhn algorithm to validate card number
function validateCardNumberLuhn(cardNumber) {
    let sum = 0;
    let isEven = false;
    
    // Loop through values starting from the rightmost digit
    for (let i = cardNumber.length - 1; i >= 0; i--) {
        let digit = parseInt(cardNumber[i]);
        
        if (isEven) {
            digit *= 2;
            if (digit > 9) {
                digit -= 9;
            }
        }
        
        sum += digit;
        isEven = !isEven;
    }
    
    return (sum % 10) === 0;
}

// Detect card type from card number
function detectCardType(cardNumber) {
    // Remove spaces
    const number = cardNumber.replace(/\s/g, '');
    
    // Visa: starts with 4
    if (/^4/.test(number)) {
        return 'Visa';
    }
    
    // Mastercard: starts with 51-55 or 2221-2720
    if (/^5[1-5]/.test(number) || /^2(22[1-9]|2[3-9]|[3-6]|7[0-1]|720)/.test(number)) {
        return 'Mastercard';
    }
    
    // American Express: starts with 34 or 37
    if (/^3[47]/.test(number)) {
        return 'American Express';
    }
    
    // Discover: starts with 6011, 622126-622925, 644-649, or 65
    if (/^6011|^64[4-9]|^65/.test(number)) {
        return 'Discover';
    }
    
    return 'Unknown';
}
