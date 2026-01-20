// Financial Reports JavaScript

let reportData = [];
let currentReportType = 'sales';

// Check authentication
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    setDefaultDates();
});

// Check authentication
function checkAuth() {
    auth.onAuthStateChanged(async (user) => {
        if (!user) {
            window.location.href = 'login.html';
            return;
        }

        try {
            const userDataSnapshot = await database.ref('users/' + user.uid).once('value');
            const userData = userDataSnapshot.val();

            if (!userData || userData.role !== 'accountant') {
                alert('Access denied. This page is for accountants only.');
                window.location.href = 'menu.html';
                return;
            }

            document.getElementById('accountantName').textContent = userData.fullname || user.email.split('@')[0];
        } catch (error) {
            console.error('Error checking auth:', error);
            window.location.href = 'login.html';
        }
    });
}

// Set default dates (last 30 days)
function setDefaultDates() {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);

    document.getElementById('dateTo').valueAsDate = today;
    document.getElementById('dateFrom').valueAsDate = thirtyDaysAgo;
}

// Select period preset
function selectPeriod() {
    const periodType = document.getElementById('periodType').value;
    const today = new Date();
    let fromDate = new Date();
    let toDate = new Date();

    switch(periodType) {
        case 'today':
            fromDate = today;
            break;
        case 'yesterday':
            fromDate.setDate(today.getDate() - 1);
            toDate.setDate(today.getDate() - 1);
            break;
        case 'week':
            fromDate.setDate(today.getDate() - today.getDay());
            break;
        case 'last-week':
            fromDate.setDate(today.getDate() - today.getDay() - 7);
            toDate.setDate(today.getDate() - today.getDay() - 1);
            break;
        case 'month':
            fromDate = new Date(today.getFullYear(), today.getMonth(), 1);
            break;
        case 'last-month':
            fromDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
            toDate = new Date(today.getFullYear(), today.getMonth(), 0);
            break;
        case 'quarter':
            const quarter = Math.floor(today.getMonth() / 3);
            fromDate = new Date(today.getFullYear(), quarter * 3, 1);
            break;
        case 'year':
            fromDate = new Date(today.getFullYear(), 0, 1);
            break;
        case 'custom':
            return; // Don't change dates for custom
    }

    document.getElementById('dateFrom').valueAsDate = fromDate;
    document.getElementById('dateTo').valueAsDate = toDate;
}

// Change report type
function changeReportType() {
    currentReportType = document.getElementById('reportType').value;
    const titles = {
        'sales': 'Sales Report',
        'revenue': 'Revenue Report',
        'expense': 'Expense Report',
        'profit-loss': 'Profit & Loss Statement',
        'tax': 'Tax Report',
        'inventory': 'Inventory Report'
    };
    document.getElementById('reportTitle').textContent = titles[currentReportType] || 'Report';
}

// Generate report
async function generateReport() {
    const dateFrom = new Date(document.getElementById('dateFrom').value);
    const dateTo = new Date(document.getElementById('dateTo').value);
    dateTo.setHours(23, 59, 59, 999); // End of day

    if (!dateFrom || !dateTo) {
        alert('Please select both start and end dates');
        return;
    }

    if (dateFrom > dateTo) {
        alert('Start date cannot be after end date');
        return;
    }

    // Update report date display
    document.getElementById('reportDate').textContent = 
        `${formatDateShort(dateFrom)} - ${formatDateShort(dateTo)}`;

    try {
        const ordersSnapshot = await database.ref('orders').once('value');
        const orders = [];

        ordersSnapshot.forEach((childSnapshot) => {
            const order = {
                id: childSnapshot.key,
                ...childSnapshot.val()
            };
            
            const orderDate = new Date(order.createdAt);
            if (orderDate >= dateFrom && orderDate <= dateTo) {
                orders.push(order);
            }
        });

        reportData = orders;

        switch(currentReportType) {
            case 'sales':
                generateSalesReport(orders);
                break;
            case 'revenue':
                generateRevenueReport(orders);
                break;
            case 'expense':
                generateExpenseReport(orders);
                break;
            case 'profit-loss':
                generateProfitLossReport(orders);
                break;
            case 'tax':
                generateTaxReport(orders);
                break;
            case 'inventory':
                generateInventoryReport(orders);
                break;
        }

        updateSummaryCards(orders);
    } catch (error) {
        console.error('Error generating report:', error);
        alert('Error generating report. Please try again.');
    }
}

// Generate Sales Report
function generateSalesReport(orders) {
    const tableHead = document.getElementById('reportTableHead');
    const tableBody = document.getElementById('reportTableBody');
    const tableFoot = document.getElementById('reportTableFoot');

    tableHead.innerHTML = `
        <tr>
            <th>Order ID</th>
            <th>Date</th>
            <th>Customer</th>
            <th>Items</th>
            <th>Quantity</th>
            <th>Subtotal</th>
            <th>Tax (15%)</th>
            <th>Total</th>
            <th>Payment Method</th>
            <th>Status</th>
        </tr>
    `;

    let totalSales = 0;
    let totalQuantity = 0;
    let totalTax = 0;

    const rows = orders.map(order => {
        const itemCount = order.items ? order.items.length : 0;
        const quantity = order.items ? order.items.reduce((sum, item) => sum + item.quantity, 0) : 0;
        const subtotal = parseFloat(order.total || 0) / 1.15; // Remove VAT
        const tax = subtotal * 0.15;
        const total = parseFloat(order.total || 0);

        totalSales += total;
        totalQuantity += quantity;
        totalTax += tax;

        return `
            <tr>
                <td>#${order.id.substring(0, 8)}</td>
                <td>${formatDate(order.createdAt)}</td>
                <td>${order.customerName || 'N/A'}</td>
                <td>${itemCount}</td>
                <td>${quantity}</td>
                <td>E ${subtotal.toFixed(2)}</td>
                <td>E ${tax.toFixed(2)}</td>
                <td><strong>R ${total.toFixed(2)}</strong></td>
                <td>${order.paymentMethod || 'Cash'}</td>
                <td><span class="order-status status-${order.status}">${(order.status || 'pending').toUpperCase()}</span></td>
            </tr>
        `;
    }).join('');

    tableBody.innerHTML = rows || '<tr><td colspan="10" class="text-center">No sales found for this period</td></tr>';

    tableFoot.innerHTML = `
        <tr style="font-weight: bold; background: var(--light-color);">
            <td colspan="4">TOTALS</td>
            <td>${totalQuantity}</td>
            <td>E ${(totalSales / 1.15).toFixed(2)}</td>
            <td>E ${totalTax.toFixed(2)}</td>
            <td>E ${totalSales.toFixed(2)}</td>
            <td colspan="2"></td>
        </tr>
    `;
}

// Generate Revenue Report
function generateRevenueReport(orders) {
    const tableHead = document.getElementById('reportTableHead');
    const tableBody = document.getElementById('reportTableBody');
    const tableFoot = document.getElementById('reportTableFoot');

    // Group by date
    const revenueByDate = {};
    orders.forEach(order => {
        if (order.status === 'delivered') {
            const date = new Date(order.createdAt).toLocaleDateString();
            if (!revenueByDate[date]) {
                revenueByDate[date] = {
                    revenue: 0,
                    orders: 0,
                    items: 0
                };
            }
            revenueByDate[date].revenue += parseFloat(order.total || 0);
            revenueByDate[date].orders += 1;
            revenueByDate[date].items += order.items ? order.items.length : 0;
        }
    });

    tableHead.innerHTML = `
        <tr>
            <th>Date</th>
            <th>Orders</th>
            <th>Items Sold</th>
            <th>Gross Revenue</th>
            <th>VAT (15%)</th>
            <th>Net Revenue</th>
            <th>Avg Order Value</th>
        </tr>
    `;

    let totalRevenue = 0;
    let totalOrders = 0;
    let totalItems = 0;

    const rows = Object.entries(revenueByDate).map(([date, data]) => {
        const vat = data.revenue * 0.15;
        const netRevenue = data.revenue - vat;
        const avgOrder = data.revenue / data.orders;

        totalRevenue += data.revenue;
        totalOrders += data.orders;
        totalItems += data.items;

        return `
            <tr>
                <td>${date}</td>
                <td>${data.orders}</td>
                <td>${data.items}</td>
                <td>E ${data.revenue.toFixed(2)}</td>
                <td>E ${vat.toFixed(2)}</td>
                <td>E ${netRevenue.toFixed(2)}</td>
                <td>E ${avgOrder.toFixed(2)}</td>
            </tr>
        `;
    }).join('');

    tableBody.innerHTML = rows || '<tr><td colspan="7" class="text-center">No revenue data for this period</td></tr>';

    const totalVat = totalRevenue * 0.15;
    const totalNet = totalRevenue - totalVat;

    tableFoot.innerHTML = `
        <tr style="font-weight: bold; background: var(--light-color);">
            <td>TOTALS</td>
            <td>${totalOrders}</td>
            <td>${totalItems}</td>
            <td>E ${totalRevenue.toFixed(2)}</td>
            <td>E ${totalVat.toFixed(2)}</td>
            <td>E ${totalNet.toFixed(2)}</td>
            <td>E ${(totalRevenue / totalOrders || 0).toFixed(2)}</td>
        </tr>
    `;
}

// Generate Expense Report
function generateExpenseReport(orders) {
    const tableHead = document.getElementById('reportTableHead');
    const tableBody = document.getElementById('reportTableBody');
    const tableFoot = document.getElementById('reportTableFoot');

    tableHead.innerHTML = `
        <tr>
            <th>Category</th>
            <th>Description</th>
            <th>Amount</th>
            <th>Percentage</th>
        </tr>
    `;

    const totalRevenue = orders
        .filter(o => o.status === 'delivered')
        .reduce((sum, o) => sum + parseFloat(o.total || 0), 0);

    // Estimate expenses (this would come from actual expense tracking in production)
    const expenses = [
        { category: 'Cost of Goods Sold (COGS)', description: 'Food ingredients and supplies', amount: totalRevenue * 0.30 },
        { category: 'Labor', description: 'Staff salaries and wages', amount: totalRevenue * 0.25 },
        { category: 'Rent & Utilities', description: 'Facility costs', amount: totalRevenue * 0.10 },
        { category: 'Marketing', description: 'Advertising and promotions', amount: totalRevenue * 0.05 },
        { category: 'Equipment & Maintenance', description: 'Kitchen equipment', amount: totalRevenue * 0.03 },
        { category: 'Other Operating Expenses', description: 'Miscellaneous costs', amount: totalRevenue * 0.02 }
    ];

    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

    const rows = expenses.map(expense => {
        const percentage = (expense.amount / totalRevenue * 100).toFixed(1);
        return `
            <tr>
                <td><strong>${expense.category}</strong></td>
                <td>${expense.description}</td>
                <td>E ${expense.amount.toFixed(2)}</td>
                <td>${percentage}%</td>
            </tr>
        `;
    }).join('');

    tableBody.innerHTML = rows;

    tableFoot.innerHTML = `
        <tr style="font-weight: bold; background: var(--light-color);">
            <td colspan="2">TOTAL EXPENSES</td>
            <td>E ${totalExpenses.toFixed(2)}</td>
            <td>${(totalExpenses / totalRevenue * 100).toFixed(1)}%</td>
        </tr>
    `;
}

// Generate Profit & Loss Report
function generateProfitLossReport(orders) {
    const tableHead = document.getElementById('reportTableHead');
    const tableBody = document.getElementById('reportTableBody');
    const tableFoot = document.getElementById('reportTableFoot');

    tableHead.innerHTML = `
        <tr>
            <th>Category</th>
            <th>Amount</th>
            <th>% of Revenue</th>
        </tr>
    `;

    const totalRevenue = orders
        .filter(o => o.status === 'delivered')
        .reduce((sum, o) => sum + parseFloat(o.total || 0), 0);

    const cogs = totalRevenue * 0.30;
    const grossProfit = totalRevenue - cogs;
    const operatingExpenses = totalRevenue * 0.45;
    const operatingIncome = grossProfit - operatingExpenses;
    const taxes = operatingIncome * 0.28; // Corporate tax
    const netIncome = operatingIncome - taxes;

    tableBody.innerHTML = `
        <tr style="background: #e8f5e9;">
            <td><strong>Revenue</strong></td>
            <td><strong>E ${totalRevenue.toFixed(2)}</strong></td>
            <td>100.0%</td>
        </tr>
        <tr>
            <td style="padding-left: 2rem;">Cost of Goods Sold</td>
            <td>E ${cogs.toFixed(2)}</td>
            <td>${(cogs / totalRevenue * 100).toFixed(1)}%</td>
        </tr>
        <tr style="background: #fff3e0;">
            <td><strong>Gross Profit</strong></td>
            <td><strong>E ${grossProfit.toFixed(2)}</strong></td>
            <td><strong>${(grossProfit / totalRevenue * 100).toFixed(1)}%</strong></td>
        </tr>
        <tr>
            <td style="padding-left: 2rem;">Operating Expenses</td>
            <td>E ${operatingExpenses.toFixed(2)}</td>
            <td>${(operatingExpenses / totalRevenue * 100).toFixed(1)}%</td>
        </tr>
        <tr style="background: #e3f2fd;">
            <td><strong>Operating Income (EBIT)</strong></td>
            <td><strong>E ${operatingIncome.toFixed(2)}</strong></td>
            <td><strong>${(operatingIncome / totalRevenue * 100).toFixed(1)}%</strong></td>
        </tr>
        <tr>
            <td style="padding-left: 2rem;">Income Tax (28%)</td>
            <td>E ${taxes.toFixed(2)}</td>
            <td>${(taxes / totalRevenue * 100).toFixed(1)}%</td>
        </tr>
    `;

    tableFoot.innerHTML = `
        <tr style="font-weight: bold; background: ${netIncome >= 0 ? '#c8e6c9' : '#ffcdd2'};">
            <td>NET INCOME</td>
            <td>E ${netIncome.toFixed(2)}</td>
            <td>${(netIncome / totalRevenue * 100).toFixed(1)}%</td>
        </tr>
    `;
}

// Generate Tax Report
function generateTaxReport(orders) {
    const tableHead = document.getElementById('reportTableHead');
    const tableBody = document.getElementById('reportTableBody');
    const tableFoot = document.getElementById('reportTableFoot');

    tableHead.innerHTML = `
        <tr>
            <th>Month</th>
            <th>Gross Sales</th>
            <th>VAT Collected (15%)</th>
            <th>Net Sales</th>
            <th>Income Tax (28%)</th>
        </tr>
    `;

    // Group by month
    const salesByMonth = {};
    orders.forEach(order => {
        if (order.status === 'delivered') {
            const date = new Date(order.createdAt);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const monthName = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
            
            if (!salesByMonth[monthKey]) {
                salesByMonth[monthKey] = {
                    name: monthName,
                    sales: 0
                };
            }
            salesByMonth[monthKey].sales += parseFloat(order.total || 0);
        }
    });

    let totalSales = 0;
    let totalVAT = 0;
    let totalNet = 0;
    let totalIncomeTax = 0;

    const rows = Object.values(salesByMonth).map(month => {
        const vat = month.sales * 0.15;
        const netSales = month.sales - vat;
        const profit = netSales * 0.25; // Estimated 25% profit margin
        const incomeTax = profit * 0.28;

        totalSales += month.sales;
        totalVAT += vat;
        totalNet += netSales;
        totalIncomeTax += incomeTax;

        return `
            <tr>
                <td>${month.name}</td>
                <td>E ${month.sales.toFixed(2)}</td>
                <td>E ${vat.toFixed(2)}</td>
                <td>E ${netSales.toFixed(2)}</td>
                <td>E ${incomeTax.toFixed(2)}</td>
            </tr>
        `;
    }).join('');

    tableBody.innerHTML = rows || '<tr><td colspan="5" class="text-center">No tax data for this period</td></tr>';

    tableFoot.innerHTML = `
        <tr style="font-weight: bold; background: var(--light-color);">
            <td>TOTALS</td>
            <td>E ${totalSales.toFixed(2)}</td>
            <td>E ${totalVAT.toFixed(2)}</td>
            <td>E ${totalNet.toFixed(2)}</td>
            <td>E ${totalIncomeTax.toFixed(2)}</td>
        </tr>
    `;
}

// Generate Inventory Report
function generateInventoryReport(orders) {
    const tableHead = document.getElementById('reportTableHead');
    const tableBody = document.getElementById('reportTableBody');

    tableHead.innerHTML = `
        <tr>
            <th>Item Name</th>
            <th>Units Sold</th>
            <th>Revenue</th>
            <th>Avg Price</th>
            <th>% of Total Sales</th>
        </tr>
    `;

    // Aggregate items sold
    const itemsSold = {};
    let totalRevenue = 0;

    orders.forEach(order => {
        if (order.status === 'delivered' && order.items) {
            order.items.forEach(item => {
                if (!itemsSold[item.name]) {
                    itemsSold[item.name] = {
                        quantity: 0,
                        revenue: 0
                    };
                }
                itemsSold[item.name].quantity += item.quantity;
                itemsSold[item.name].revenue += item.price * item.quantity;
                totalRevenue += item.price * item.quantity;
            });
        }
    });

    const rows = Object.entries(itemsSold)
        .sort((a, b) => b[1].revenue - a[1].revenue)
        .map(([name, data]) => {
            const avgPrice = data.revenue / data.quantity;
            const percentage = (data.revenue / totalRevenue * 100).toFixed(1);
            
            return `
                <tr>
                    <td><strong>${name}</strong></td>
                    <td>${data.quantity}</td>
                    <td>E ${data.revenue.toFixed(2)}</td>
                    <td>E ${avgPrice.toFixed(2)}</td>
                    <td>${percentage}%</td>
                </tr>
            `;
        }).join('');

    tableBody.innerHTML = rows || '<tr><td colspan="5" class="text-center">No inventory data for this period</td></tr>';
    document.getElementById('reportTableFoot').innerHTML = '';
}

// Update summary cards
function updateSummaryCards(orders) {
    const completedOrders = orders.filter(o => o.status === 'delivered');
    const totalRevenue = completedOrders.reduce((sum, o) => sum + parseFloat(o.total || 0), 0);
    const totalExpenses = totalRevenue * 0.75; // 75% expenses estimate
    const netProfit = totalRevenue - totalExpenses;

    document.getElementById('summaryRevenue').textContent = `E ${totalRevenue.toFixed(2)}`;
    document.getElementById('summaryExpenses').textContent = `E ${totalExpenses.toFixed(2)}`;
    document.getElementById('summaryProfit').textContent = `E ${netProfit.toFixed(2)}`;
    document.getElementById('summaryTransactions').textContent = completedOrders.length;
}

// Export report
function exportReport(format) {
    if (!reportData || reportData.length === 0) {
        alert('Please generate a report first');
        return;
    }

    switch(format) {
        case 'csv':
            exportCSV();
            break;
        case 'excel':
            exportExcel();
            break;
        case 'pdf':
            exportPDF();
            break;
        case 'json':
            exportJSON();
            break;
    }
}

// Export to CSV
function exportCSV() {
    const table = document.getElementById('reportTable');
    let csv = [];

    // Headers
    const headers = Array.from(table.querySelectorAll('thead th')).map(th => th.textContent);
    csv.push(headers.join(','));

    // Rows
    table.querySelectorAll('tbody tr').forEach(tr => {
        const row = Array.from(tr.querySelectorAll('td')).map(td => {
            let text = td.textContent.replace(/,/g, '');
            return `"${text}"`;
        });
        csv.push(row.join(','));
    });

    // Footer
    if (table.querySelector('tfoot')) {
        table.querySelectorAll('tfoot tr').forEach(tr => {
            const row = Array.from(tr.querySelectorAll('td')).map(td => {
                let text = td.textContent.replace(/,/g, '');
                return `"${text}"`;
            });
            csv.push(row.join(','));
        });
    }

    downloadFile(csv.join('\n'), `${currentReportType}_report_${Date.now()}.csv`, 'text/csv');
}

// Export to Excel (CSV format that Excel can open)
function exportExcel() {
    exportCSV(); // For now, using CSV which Excel can open
    // In production, you'd use a library like SheetJS/xlsx
}

// Export to PDF
function exportPDF() {
    window.print(); // Opens print dialog, user can save as PDF
    // In production, you'd use a library like jsPDF
}

// Export to JSON
function exportJSON() {
    const data = {
        reportType: currentReportType,
        generatedAt: new Date().toISOString(),
        dateRange: {
            from: document.getElementById('dateFrom').value,
            to: document.getElementById('dateTo').value
        },
        data: reportData
    };

    downloadFile(JSON.stringify(data, null, 2), `${currentReportType}_report_${Date.now()}.json`, 'application/json');
}

// Download file helper
function downloadFile(content, filename, contentType) {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// Print report
function printReport() {
    window.print();
}

// Reset filters
function resetFilters() {
    setDefaultDates();
    document.getElementById('periodType').value = 'custom';
    document.getElementById('reportType').value = 'sales';
    currentReportType = 'sales';
    changeReportType();
}

// Format date
function formatDate(timestamp) {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Format date short
function formatDateShort(date) {
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Logout
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
window.selectPeriod = selectPeriod;
window.changeReportType = changeReportType;
window.generateReport = generateReport;
window.exportReport = exportReport;
window.printReport = printReport;
window.resetFilters = resetFilters;
window.handleLogout = handleLogout;
