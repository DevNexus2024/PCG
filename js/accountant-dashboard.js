// Accountant Dashboard JavaScript

// Check authentication
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    loadFinancialData();
});

// Check authentication
function checkAuth() {
    // Wait for auth state to be ready
    auth.onAuthStateChanged(async (user) => {
        if (!user) {
            console.log('No user found, redirecting to login');
            window.location.href = 'login.html';
            return;
        }

        console.log('User found:', user.email);

        // Verify role in database
        try {
            const userDataSnapshot = await database.ref('users/' + user.uid).once('value');
            const userData = userDataSnapshot.val();

            console.log('User data:', userData);

            if (!userData) {
                console.log('No user data found');
                alert('Account data not found. Please contact administrator.');
                await auth.signOut();
                window.location.href = 'login.html';
                return;
            }

            if (userData.role !== 'accountant') {
                console.log('User is not accountant, role:', userData.role);
                alert('Access denied. This page is for accountants only.');
                window.location.href = userData.role === 'admin' || userData.role === 'supervisor' || userData.role === 'cashier' ? 'admin-dashboard.html' : 'menu.html';
                return;
            }

            // Display user name
            console.log('Accountant verified, displaying dashboard');
            document.getElementById('accountantName').textContent = userData.fullname || user.email.split('@')[0];
        } catch (error) {
            console.error('Error checking auth:', error);
            alert('Error verifying credentials. Please try again.');
            window.location.href = 'login.html';
        }
    });
}

// Load financial data
async function loadFinancialData() {
    try {
        await Promise.all([
            loadRevenueStats(),
            loadRecentTransactions(),
            loadTopSellingItems(),
            loadPaymentMethods()
        ]);
    } catch (error) {
        console.error('Error loading financial data:', error);
    }
}

// Load revenue statistics
async function loadRevenueStats() {
    const ordersRef = database.ref('orders');
    
    ordersRef.on('value', (snapshot) => {
        if (!snapshot.exists()) {
            return;
        }

        let totalRevenue = 0;
        let totalTransactions = 0;
        let todaySales = 0;
        let weekSales = 0;
        let monthSales = 0;
        let yearSales = 0;

        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        const weekAgo = today - (7 * 24 * 60 * 60 * 1000);
        const monthAgo = today - (30 * 24 * 60 * 60 * 1000);
        const yearStart = new Date(now.getFullYear(), 0, 1).getTime();

        snapshot.forEach((childSnapshot) => {
            const order = childSnapshot.val();
            
            // Only count completed/delivered orders
            if (order.status === 'delivered') {
                const amount = parseFloat(order.total || 0);
                totalRevenue += amount;
                totalTransactions++;

                const orderDate = order.createdAt || 0;

                if (orderDate >= today) {
                    todaySales += amount;
                }
                if (orderDate >= weekAgo) {
                    weekSales += amount;
                }
                if (orderDate >= monthAgo) {
                    monthSales += amount;
                }
                if (orderDate >= yearStart) {
                    yearSales += amount;
                }
            }
        });

        // Update UI
        document.getElementById('totalRevenue').textContent = `E ${totalRevenue.toFixed(2)}`;
        document.getElementById('totalTransactions').textContent = totalTransactions;
        document.getElementById('todaySales').textContent = `E ${todaySales.toFixed(2)}`;
        document.getElementById('weekSales').textContent = `E ${weekSales.toFixed(2)}`;
        document.getElementById('monthSales').textContent = `E ${monthSales.toFixed(2)}`;
        document.getElementById('yearSales').textContent = `E ${yearSales.toFixed(2)}`;

        // Calculate net profit (assuming 30% expense ratio for demo)
        const expenses = totalRevenue * 0.30;
        const netProfit = totalRevenue - expenses;
        document.getElementById('totalExpenses').textContent = `E ${expenses.toFixed(2)}`;
        document.getElementById('netProfit').textContent = `E ${netProfit.toFixed(2)}`;
    });
}

// Load recent transactions
async function loadRecentTransactions() {
    const ordersRef = database.ref('orders');
    
    ordersRef.on('value', (snapshot) => {
        const transactions = [];
        const tableBody = document.getElementById('transactionsTableBody');

        if (!snapshot.exists()) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center">No transactions found</td>
                </tr>
            `;
            return;
        }

        snapshot.forEach((childSnapshot) => {
            const order = childSnapshot.val();
            if (order.status === 'delivered') {
                transactions.push({
                    id: childSnapshot.key,
                    ...order
                });
            }
        });

        // Sort by date (newest first)
        transactions.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

        // Display only last 10 transactions
        const recentTransactions = transactions.slice(0, 10);

        if (recentTransactions.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center">No completed transactions yet</td>
                </tr>
            `;
            return;
        }

        const transactionsHTML = recentTransactions.map(transaction => `
            <tr>
                <td><span class="order-id">#${transaction.id.substring(0, 8)}</span></td>
                <td><span class="order-id">#${transaction.id.substring(0, 8)}</span></td>
                <td>${transaction.customerName || 'Unknown'}</td>
                <td><strong>E${parseFloat(transaction.total || 0).toFixed(2)}</strong></td>
                <td>${transaction.paymentMethod || 'Cash'}</td>
                <td>${formatDate(transaction.createdAt)}</td>
                <td><span class="order-status status-delivered">Completed</span></td>
            </tr>
        `).join('');

        tableBody.innerHTML = transactionsHTML;
    });
}

// Load top selling items
async function loadTopSellingItems() {
    const ordersRef = database.ref('orders');
    
    ordersRef.once('value', (snapshot) => {
        const itemsList = document.getElementById('topItemsList');
        const itemSales = {};

        if (!snapshot.exists()) {
            itemsList.innerHTML = '<p class="text-center" style="color: var(--gray); padding: 2rem;">No sales data available</p>';
            return;
        }

        // Count item sales
        snapshot.forEach((childSnapshot) => {
            const order = childSnapshot.val();
            if (order.status === 'delivered' && order.items) {
                order.items.forEach(item => {
                    if (!itemSales[item.name]) {
                        itemSales[item.name] = {
                            name: item.name,
                            quantity: 0,
                            revenue: 0
                        };
                    }
                    itemSales[item.name].quantity += item.quantity;
                    itemSales[item.name].revenue += item.price * item.quantity;
                });
            }
        });

        // Convert to array and sort by quantity
        const topItems = Object.values(itemSales)
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 5);

        if (topItems.length === 0) {
            itemsList.innerHTML = '<p class="text-center" style="color: var(--gray); padding: 2rem;">No sales data available</p>';
            return;
        }

        const itemsHTML = topItems.map((item, index) => `
            <div class="top-item">
                <div class="item-rank">${index + 1}</div>
                <div class="item-details">
                    <div class="item-name">${item.name}</div>
                    <div class="item-stats">
                        <span><i class="fas fa-shopping-cart"></i> ${item.quantity} sold</span>
                        <span><i class="fas fa-dollar-sign"></i> E${item.revenue.toFixed(2)}</span>
                    </div>
                </div>
            </div>
        `).join('');

        itemsList.innerHTML = itemsHTML;
    });
}

// Load payment methods statistics
async function loadPaymentMethods() {
    const ordersRef = database.ref('orders');
    
    ordersRef.once('value', (snapshot) => {
        let cardPayments = 0;
        let cashPayments = 0;
        let mobilePayments = 0;

        if (!snapshot.exists()) {
            return;
        }

        snapshot.forEach((childSnapshot) => {
            const order = childSnapshot.val();
            if (order.status === 'delivered') {
                const amount = parseFloat(order.total || 0);
                const paymentMethod = (order.paymentMethod || 'cash').toLowerCase();

                if (paymentMethod.includes('card') || paymentMethod.includes('credit') || paymentMethod.includes('debit')) {
                    cardPayments += amount;
                } else if (paymentMethod.includes('mobile') || paymentMethod.includes('wallet') || paymentMethod.includes('online')) {
                    mobilePayments += amount;
                } else {
                    cashPayments += amount;
                }
            }
        });

        document.getElementById('cardPayments').textContent = `E ${cardPayments.toFixed(2)}`;
        document.getElementById('cashPayments').textContent = `E ${cashPayments.toFixed(2)}`;
        document.getElementById('mobilePayments').textContent = `E ${mobilePayments.toFixed(2)}`;
    });
}

// Export transactions
function exportTransactions() {
    alert('Export functionality coming soon! This will download a CSV file with all transactions.');
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
window.handleLogout = handleLogout;
window.exportTransactions = exportTransactions;
