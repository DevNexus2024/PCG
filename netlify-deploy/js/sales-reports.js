// Sales Reports JavaScript
let currentReportData = [];
let currentReportType = 'daily';

// Check authentication
function checkAuth() {
    firebase.auth().onAuthStateChanged(async (user) => {
        if (!user) {
            console.log('No user logged in, redirecting to login');
            window.location.href = 'login.html';
            return;
        }

        try {
            // Get user data from database
            const userDoc = await firebase.database().ref('users/' + user.uid).once('value');
            const userData = userDoc.val();

            if (!userData) {
                console.log('No user data found');
                window.location.href = 'login.html';
                return;
            }

            // Check if user is accountant
            if (userData.role !== 'accountant') {
                console.log('User is not an accountant:', userData.role);
                alert('Access denied. This page is only for accountants.');
                window.location.href = 'login.html';
                return;
            }

            // Set accountant name - accountants see all branches
            const accountantName = userData.name || userData.fullName || userData.fullname || user.email.split('@')[0];
            document.getElementById('accountantName').textContent = `${accountantName} - Company Accountant (All Branches)`;
            
            console.log('💼 Accountant has access to ALL branches sales data');
            
            // Initialize the page
            setDefaultDates();
            generateReport();
        } catch (error) {
            console.error('Error checking authentication:', error);
            window.location.href = 'login.html';
        }
    });
}

// Set default dates (last 30 days)
function setDefaultDates() {
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    document.getElementById('dateTo').valueAsDate = today;
    document.getElementById('dateFrom').valueAsDate = thirtyDaysAgo;
}

// Select period
function selectPeriod() {
    const period = document.getElementById('periodSelect').value;
    const today = new Date();
    let fromDate = new Date();
    let toDate = new Date();

    switch(period) {
        case 'today':
            fromDate = today;
            toDate = today;
            break;
        case 'yesterday':
            fromDate = new Date(today.getTime() - 24 * 60 * 60 * 1000);
            toDate = new Date(today.getTime() - 24 * 60 * 60 * 1000);
            break;
        case 'week':
            fromDate = new Date(today.getTime() - today.getDay() * 24 * 60 * 60 * 1000);
            toDate = today;
            break;
        case 'last-week':
            const lastWeekEnd = new Date(today.getTime() - today.getDay() * 24 * 60 * 60 * 1000 - 24 * 60 * 60 * 1000);
            fromDate = new Date(lastWeekEnd.getTime() - 6 * 24 * 60 * 60 * 1000);
            toDate = lastWeekEnd;
            break;
        case 'month':
            fromDate = new Date(today.getFullYear(), today.getMonth(), 1);
            toDate = today;
            break;
        case 'last-month':
            fromDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
            toDate = new Date(today.getFullYear(), today.getMonth(), 0);
            break;
        case 'quarter':
            const quarter = Math.floor(today.getMonth() / 3);
            fromDate = new Date(today.getFullYear(), quarter * 3, 1);
            toDate = today;
            break;
        case 'year':
            fromDate = new Date(today.getFullYear(), 0, 1);
            toDate = today;
            break;
        default:
            return;
    }

    document.getElementById('dateFrom').valueAsDate = fromDate;
    document.getElementById('dateTo').valueAsDate = toDate;
}

// Reset filters
function resetFilters() {
    document.getElementById('reportType').value = 'daily';
    setDefaultDates();
    document.getElementById('periodSelect').value = 'custom';
    currentReportType = 'daily';
}

// Change report type
function changeReportType() {
    currentReportType = document.getElementById('reportType').value;
}

// Generate report
async function generateReport() {
    try {
        const dateFrom = document.getElementById('dateFrom').value;
        const dateTo = document.getElementById('dateTo').value;
        const reportType = document.getElementById('reportType').value;

        if (!dateFrom || !dateTo) {
            alert('Please select both from and to dates');
            return;
        }

        // Show loading
        document.getElementById('reportContent').innerHTML = '<div class="loading">Generating report...</div>';

        // Update report date display
        const fromDateObj = new Date(dateFrom);
        const toDateObj = new Date(dateTo);
        document.getElementById('reportDate').textContent = 
            `Report Period: ${fromDateObj.toLocaleDateString()} - ${toDateObj.toLocaleDateString()}`;

        // Fetch orders from database
        const ordersRef = firebase.database().ref('orders');
        const snapshot = await ordersRef.once('value');
        const allOrders = snapshot.val() || {};

        // Filter orders by date range
        const filteredOrders = Object.entries(allOrders).filter(([id, order]) => {
            const orderDate = new Date(order.timestamp);
            const fromDate = new Date(dateFrom);
            const toDate = new Date(dateTo);
            toDate.setHours(23, 59, 59, 999);
            return orderDate >= fromDate && orderDate <= toDate;
        });

        currentReportData = filteredOrders;

        // Generate report based on type
        switch(reportType) {
            case 'daily':
                generateDailyReport(filteredOrders);
                break;
            case 'weekly':
                generateWeeklyReport(filteredOrders);
                break;
            case 'monthly':
                generateMonthlyReport(filteredOrders);
                break;
            case 'product':
                generateProductReport(filteredOrders);
                break;
            case 'customer':
                generateCustomerReport(filteredOrders);
                break;
            case 'payment':
                generatePaymentReport(filteredOrders);
                break;
            case 'trends':
                generateTrendsReport(filteredOrders);
                break;
            default:
                generateDailyReport(filteredOrders);
        }

        // Update summary cards
        updateSummaryCards(filteredOrders);

    } catch (error) {
        console.error('Error generating report:', error);
        document.getElementById('reportContent').innerHTML = 
            '<div class="error">Error generating report. Please try again.</div>';
    }
}

// Update summary cards
function updateSummaryCards(orders) {
    const totalOrders = orders.length;
    let totalSales = 0;
    let totalItems = 0;

    orders.forEach(([id, order]) => {
        totalSales += parseFloat(order.total) || 0;
        totalItems += order.items ? order.items.reduce((sum, item) => sum + item.quantity, 0) : 0;
    });

    const averageOrder = totalOrders > 0 ? totalSales / totalOrders : 0;

    document.getElementById('totalOrders').textContent = totalOrders.toLocaleString();
    document.getElementById('totalSales').textContent = `E ${totalSales.toFixed(2)}`;
    document.getElementById('averageOrder').textContent = `E ${averageOrder.toFixed(2)}`;
    document.getElementById('totalItems').textContent = totalItems.toLocaleString();
}

// Generate Daily Sales Report
function generateDailyReport(orders) {
    // Group orders by date
    const dailySales = {};
    
    orders.forEach(([id, order]) => {
        const date = new Date(order.timestamp).toLocaleDateString();
        if (!dailySales[date]) {
            dailySales[date] = {
                orders: 0,
                sales: 0,
                items: 0
            };
        }
        dailySales[date].orders += 1;
        dailySales[date].sales += parseFloat(order.total) || 0;
        dailySales[date].items += order.items ? order.items.reduce((sum, item) => sum + item.quantity, 0) : 0;
    });

    // Create table
    let html = `
        <table class="report-table">
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Orders</th>
                    <th>Items Sold</th>
                    <th>Total Sales</th>
                    <th>Average Order</th>
                </tr>
            </thead>
            <tbody>
    `;

    let totalOrders = 0;
    let totalSales = 0;
    let totalItems = 0;

    Object.entries(dailySales).sort((a, b) => new Date(b[0]) - new Date(a[0])).forEach(([date, data]) => {
        const avgOrder = data.orders > 0 ? data.sales / data.orders : 0;
        html += `
            <tr>
                <td>${date}</td>
                <td>${data.orders}</td>
                <td>${data.items}</td>
                <td>R ${data.sales.toFixed(2)}</td>
                <td>R ${avgOrder.toFixed(2)}</td>
            </tr>
        `;
        totalOrders += data.orders;
        totalSales += data.sales;
        totalItems += data.items;
    });

    const overallAvg = totalOrders > 0 ? totalSales / totalOrders : 0;

    html += `
            </tbody>
            <tfoot>
                <tr>
                    <td><strong>Total</strong></td>
                    <td><strong>${totalOrders}</strong></td>
                    <td><strong>${totalItems}</strong></td>
                    <td><strong>R ${totalSales.toFixed(2)}</strong></td>
                    <td><strong>R ${overallAvg.toFixed(2)}</strong></td>
                </tr>
            </tfoot>
        </table>
    `;

    document.getElementById('reportContent').innerHTML = html;
}

// Generate Weekly Sales Report
function generateWeeklyReport(orders) {
    // Group orders by week
    const weeklySales = {};
    
    orders.forEach(([id, order]) => {
        const date = new Date(order.timestamp);
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        const weekKey = weekStart.toLocaleDateString();
        
        if (!weeklySales[weekKey]) {
            weeklySales[weekKey] = {
                orders: 0,
                sales: 0,
                items: 0
            };
        }
        weeklySales[weekKey].orders += 1;
        weeklySales[weekKey].sales += parseFloat(order.total) || 0;
        weeklySales[weekKey].items += order.items ? order.items.reduce((sum, item) => sum + item.quantity, 0) : 0;
    });

    // Create table
    let html = `
        <table class="report-table">
            <thead>
                <tr>
                    <th>Week Starting</th>
                    <th>Orders</th>
                    <th>Items Sold</th>
                    <th>Total Sales</th>
                    <th>Average Order</th>
                </tr>
            </thead>
            <tbody>
    `;

    let totalOrders = 0;
    let totalSales = 0;
    let totalItems = 0;

    Object.entries(weeklySales).sort((a, b) => new Date(b[0]) - new Date(a[0])).forEach(([week, data]) => {
        const avgOrder = data.orders > 0 ? data.sales / data.orders : 0;
        html += `
            <tr>
                <td>${week}</td>
                <td>${data.orders}</td>
                <td>${data.items}</td>
                <td>R ${data.sales.toFixed(2)}</td>
                <td>R ${avgOrder.toFixed(2)}</td>
            </tr>
        `;
        totalOrders += data.orders;
        totalSales += data.sales;
        totalItems += data.items;
    });

    const overallAvg = totalOrders > 0 ? totalSales / totalOrders : 0;

    html += `
            </tbody>
            <tfoot>
                <tr>
                    <td><strong>Total</strong></td>
                    <td><strong>${totalOrders}</strong></td>
                    <td><strong>${totalItems}</strong></td>
                    <td><strong>R ${totalSales.toFixed(2)}</strong></td>
                    <td><strong>R ${overallAvg.toFixed(2)}</strong></td>
                </tr>
            </tfoot>
        </table>
    `;

    document.getElementById('reportContent').innerHTML = html;
}

// Generate Monthly Sales Report
function generateMonthlyReport(orders) {
    // Group orders by month
    const monthlySales = {};
    
    orders.forEach(([id, order]) => {
        const date = new Date(order.timestamp);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const monthName = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
        
        if (!monthlySales[monthKey]) {
            monthlySales[monthKey] = {
                name: monthName,
                orders: 0,
                sales: 0,
                items: 0
            };
        }
        monthlySales[monthKey].orders += 1;
        monthlySales[monthKey].sales += parseFloat(order.total) || 0;
        monthlySales[monthKey].items += order.items ? order.items.reduce((sum, item) => sum + item.quantity, 0) : 0;
    });

    // Create table
    let html = `
        <table class="report-table">
            <thead>
                <tr>
                    <th>Month</th>
                    <th>Orders</th>
                    <th>Items Sold</th>
                    <th>Total Sales</th>
                    <th>Average Order</th>
                </tr>
            </thead>
            <tbody>
    `;

    let totalOrders = 0;
    let totalSales = 0;
    let totalItems = 0;

    Object.entries(monthlySales).sort((a, b) => b[0].localeCompare(a[0])).forEach(([month, data]) => {
        const avgOrder = data.orders > 0 ? data.sales / data.orders : 0;
        html += `
            <tr>
                <td>${data.name}</td>
                <td>${data.orders}</td>
                <td>${data.items}</td>
                <td>R ${data.sales.toFixed(2)}</td>
                <td>R ${avgOrder.toFixed(2)}</td>
            </tr>
        `;
        totalOrders += data.orders;
        totalSales += data.sales;
        totalItems += data.items;
    });

    const overallAvg = totalOrders > 0 ? totalSales / totalOrders : 0;

    html += `
            </tbody>
            <tfoot>
                <tr>
                    <td><strong>Total</strong></td>
                    <td><strong>${totalOrders}</strong></td>
                    <td><strong>${totalItems}</strong></td>
                    <td><strong>R ${totalSales.toFixed(2)}</strong></td>
                    <td><strong>R ${overallAvg.toFixed(2)}</strong></td>
                </tr>
            </tfoot>
        </table>
    `;

    document.getElementById('reportContent').innerHTML = html;
}

// Generate Product Sales Report
function generateProductReport(orders) {
    // Group sales by product
    const productSales = {};
    
    orders.forEach(([id, order]) => {
        if (order.items) {
            order.items.forEach(item => {
                if (!productSales[item.name]) {
                    productSales[item.name] = {
                        quantity: 0,
                        revenue: 0,
                        orders: new Set()
                    };
                }
                productSales[item.name].quantity += item.quantity;
                productSales[item.name].revenue += item.quantity * item.price;
                productSales[item.name].orders.add(id);
            });
        }
    });

    // Create table
    let html = `
        <table class="report-table">
            <thead>
                <tr>
                    <th>Product Name</th>
                    <th>Quantity Sold</th>
                    <th>Number of Orders</th>
                    <th>Total Revenue</th>
                    <th>Average Price</th>
                </tr>
            </thead>
            <tbody>
    `;

    let totalQuantity = 0;
    let totalRevenue = 0;

    Object.entries(productSales)
        .sort((a, b) => b[1].revenue - a[1].revenue)
        .forEach(([product, data]) => {
            const avgPrice = data.quantity > 0 ? data.revenue / data.quantity : 0;
            html += `
                <tr>
                    <td>${product}</td>
                    <td>${data.quantity}</td>
                    <td>${data.orders.size}</td>
                    <td>E ${data.revenue.toFixed(2)}</td>
                    <td>E ${avgPrice.toFixed(2)}</td>
                </tr>
            `;
            totalQuantity += data.quantity;
            totalRevenue += data.revenue;
        });

    html += `
            </tbody>
            <tfoot>
                <tr>
                    <td><strong>Total</strong></td>
                    <td><strong>${totalQuantity}</strong></td>
                    <td><strong>-</strong></td>
                    <td><strong>E ${totalRevenue.toFixed(2)}</strong></td>
                    <td><strong>-</strong></td>
                </tr>
            </tfoot>
        </table>
    `;

    document.getElementById('reportContent').innerHTML = html;
}

// Generate Customer Sales Report
function generateCustomerReport(orders) {
    // Group sales by customer
    const customerSales = {};
    
    orders.forEach(([id, order]) => {
        const customerId = order.userId || 'Guest';
        const customerName = order.customerName || 'Unknown Customer';
        
        if (!customerSales[customerId]) {
            customerSales[customerId] = {
                name: customerName,
                orders: 0,
                sales: 0,
                items: 0
            };
        }
        customerSales[customerId].orders += 1;
        customerSales[customerId].sales += parseFloat(order.total) || 0;
        customerSales[customerId].items += order.items ? order.items.reduce((sum, item) => sum + item.quantity, 0) : 0;
    });

    // Create table
    let html = `
        <table class="report-table">
            <thead>
                <tr>
                    <th>Customer Name</th>
                    <th>Total Orders</th>
                    <th>Items Purchased</th>
                    <th>Total Spent</th>
                    <th>Average Order</th>
                </tr>
            </thead>
            <tbody>
    `;

    let totalOrders = 0;
    let totalSales = 0;
    let totalItems = 0;

    Object.entries(customerSales)
        .sort((a, b) => b[1].sales - a[1].sales)
        .forEach(([customerId, data]) => {
            const avgOrder = data.orders > 0 ? data.sales / data.orders : 0;
            html += `
                <tr>
                    <td>${data.name}</td>
                    <td>${data.orders}</td>
                    <td>${data.items}</td>
                    <td>E ${data.sales.toFixed(2)}</td>
                    <td>E ${avgOrder.toFixed(2)}</td>
                </tr>
            `;
            totalOrders += data.orders;
            totalSales += data.sales;
            totalItems += data.items;
        });

    const overallAvg = totalOrders > 0 ? totalSales / totalOrders : 0;

    html += `
            </tbody>
            <tfoot>
                <tr>
                    <td><strong>Total</strong></td>
                    <td><strong>${totalOrders}</strong></td>
                    <td><strong>${totalItems}</strong></td>
                    <td><strong>R ${totalSales.toFixed(2)}</strong></td>
                    <td><strong>R ${overallAvg.toFixed(2)}</strong></td>
                </tr>
            </tfoot>
        </table>
    `;

    document.getElementById('reportContent').innerHTML = html;
}

// Generate Payment Methods Report
function generatePaymentReport(orders) {
    // Group sales by payment method
    const paymentSales = {};
    
    orders.forEach(([id, order]) => {
        const method = order.paymentMethod || 'Not Specified';
        
        if (!paymentSales[method]) {
            paymentSales[method] = {
                orders: 0,
                sales: 0,
                percentage: 0
            };
        }
        paymentSales[method].orders += 1;
        paymentSales[method].sales += parseFloat(order.total) || 0;
    });

    // Calculate percentages
    const totalOrders = orders.length;
    const totalSales = Object.values(paymentSales).reduce((sum, data) => sum + data.sales, 0);
    
    Object.values(paymentSales).forEach(data => {
        data.percentageOrders = totalOrders > 0 ? (data.orders / totalOrders * 100) : 0;
        data.percentageSales = totalSales > 0 ? (data.sales / totalSales * 100) : 0;
    });

    // Create table
    let html = `
        <table class="report-table">
            <thead>
                <tr>
                    <th>Payment Method</th>
                    <th>Number of Orders</th>
                    <th>% of Orders</th>
                    <th>Total Sales</th>
                    <th>% of Sales</th>
                </tr>
            </thead>
            <tbody>
    `;

    Object.entries(paymentSales)
        .sort((a, b) => b[1].sales - a[1].sales)
        .forEach(([method, data]) => {
            html += `
                <tr>
                    <td>${method}</td>
                    <td>${data.orders}</td>
                    <td>${data.percentageOrders.toFixed(1)}%</td>
                    <td>E ${data.sales.toFixed(2)}</td>
                    <td>${data.percentageSales.toFixed(1)}%</td>
                </tr>
            `;
        });

    html += `
            </tbody>
            <tfoot>
                <tr>
                    <td><strong>Total</strong></td>
                    <td><strong>${totalOrders}</strong></td>
                    <td><strong>100%</strong></td>
                    <td><strong>E ${totalSales.toFixed(2)}</strong></td>
                    <td><strong>100%</strong></td>
                </tr>
            </tfoot>
        </table>
    `;

    document.getElementById('reportContent').innerHTML = html;
}

// Generate Sales Trends Report
function generateTrendsReport(orders) {
    // Group orders by date for trend analysis
    const dailyTrend = {};
    
    orders.forEach(([id, order]) => {
        const date = new Date(order.timestamp).toLocaleDateString();
        if (!dailyTrend[date]) {
            dailyTrend[date] = {
                orders: 0,
                sales: 0
            };
        }
        dailyTrend[date].orders += 1;
        dailyTrend[date].sales += parseFloat(order.total) || 0;
    });

    // Sort by date
    const sortedDates = Object.keys(dailyTrend).sort((a, b) => new Date(a) - new Date(b));
    
    // Calculate trends
    let html = `
        <table class="report-table">
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Orders</th>
                    <th>Sales</th>
                    <th>Avg Order Value</th>
                    <th>Trend</th>
                </tr>
            </thead>
            <tbody>
    `;

    let previousSales = 0;
    sortedDates.forEach((date, index) => {
        const data = dailyTrend[date];
        const avgOrder = data.orders > 0 ? data.sales / data.orders : 0;
        
        let trend = '-';
        if (index > 0) {
            const change = ((data.sales - previousSales) / previousSales * 100);
            if (change > 0) {
                trend = `<span style="color: green;">▲ ${change.toFixed(1)}%</span>`;
            } else if (change < 0) {
                trend = `<span style="color: red;">▼ ${Math.abs(change).toFixed(1)}%</span>`;
            } else {
                trend = '→ 0%';
            }
        }
        
        html += `
            <tr>
                <td>${date}</td>
                <td>${data.orders}</td>
                <td>E ${data.sales.toFixed(2)}</td>
                <td>E ${avgOrder.toFixed(2)}</td>
                <td>${trend}</td>
            </tr>
        `;
        previousSales = data.sales;
    });

    html += `
            </tbody>
        </table>
    `;

    document.getElementById('reportContent').innerHTML = html;
}

// Export functions
function exportCSV() {
    const table = document.querySelector('.report-table');
    if (!table) {
        alert('No data to export');
        return;
    }

    let csv = [];
    const rows = table.querySelectorAll('tr');
    
    rows.forEach(row => {
        const cols = row.querySelectorAll('td, th');
        const rowData = Array.from(cols).map(col => {
            let text = col.textContent.trim();
            // Remove HTML tags and extra spaces
            text = text.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ');
            // Escape quotes
            text = text.replace(/"/g, '""');
            return `"${text}"`;
        });
        csv.push(rowData.join(','));
    });

    const csvContent = csv.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
}

function exportExcel() {
    exportCSV(); // Excel can open CSV files
}

function exportPDF() {
    window.print();
}

function exportJSON() {
    const reportData = {
        reportType: currentReportType,
        generatedDate: new Date().toISOString(),
        dateRange: {
            from: document.getElementById('dateFrom').value,
            to: document.getElementById('dateTo').value
        },
        data: currentReportData.map(([id, order]) => ({
            orderId: id,
            ...order
        }))
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales-report-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
}

// Logout function
function handleLogout() {
    firebase.auth().signOut().then(() => {
        window.location.href = 'login.html';
    }).catch((error) => {
        console.error('Error logging out:', error);
    });
}

// Initialize on page load
checkAuth();
