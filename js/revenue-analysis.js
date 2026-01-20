// Revenue Analysis JavaScript
let currentAnalysisData = [];
let currentAnalysisType = 'overview';
let comparisonData = null;

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

            // Set accountant name
            document.getElementById('accountantName').textContent = userData.name || 'Accountant';
            
            // Initialize the page
            setDefaultDates();
            generateAnalysis();
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
    document.getElementById('analysisType').value = 'overview';
    document.getElementById('comparisonPeriod').value = 'none';
    setDefaultDates();
    document.getElementById('periodSelect').value = 'custom';
    currentAnalysisType = 'overview';
}

// Change analysis type
function changeAnalysisType() {
    currentAnalysisType = document.getElementById('analysisType').value;
}

// Generate analysis
async function generateAnalysis() {
    try {
        const dateFrom = document.getElementById('dateFrom').value;
        const dateTo = document.getElementById('dateTo').value;
        const analysisType = document.getElementById('analysisType').value;
        const comparisonPeriod = document.getElementById('comparisonPeriod').value;

        if (!dateFrom || !dateTo) {
            alert('Please select both from and to dates');
            return;
        }

        // Show loading
        document.getElementById('analysisContent').innerHTML = '<div class="loading">Generating analysis...</div>';

        // Update report date display
        const fromDateObj = new Date(dateFrom);
        const toDateObj = new Date(dateTo);
        document.getElementById('reportDate').textContent = 
            `Analysis Period: ${fromDateObj.toLocaleDateString()} - ${toDateObj.toLocaleDateString()}`;

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

        currentAnalysisData = filteredOrders;

        // Get comparison data if needed
        comparisonData = null;
        if (comparisonPeriod !== 'none') {
            comparisonData = await getComparisonData(fromDateObj, toDateObj, comparisonPeriod, allOrders);
        }

        // Generate analysis based on type
        switch(analysisType) {
            case 'overview':
                generateOverviewAnalysis(filteredOrders);
                break;
            case 'category':
                generateCategoryAnalysis(filteredOrders);
                break;
            case 'product':
                generateProductAnalysis(filteredOrders);
                break;
            case 'time':
                generateTimeAnalysis(filteredOrders);
                break;
            case 'growth':
                generateGrowthAnalysis(filteredOrders);
                break;
            case 'margins':
                generateMarginsAnalysis(filteredOrders);
                break;
            case 'forecast':
                generateForecastAnalysis(filteredOrders);
                break;
            default:
                generateOverviewAnalysis(filteredOrders);
        }

        // Update summary cards
        updateSummaryCards(filteredOrders);

    } catch (error) {
        console.error('Error generating analysis:', error);
        document.getElementById('analysisContent').innerHTML = 
            '<div class="error">Error generating analysis. Please try again.</div>';
    }
}

// Get comparison data
async function getComparisonData(fromDate, toDate, comparisonType, allOrders) {
    const daysDiff = Math.ceil((toDate - fromDate) / (1000 * 60 * 60 * 24));
    let compFromDate, compToDate;

    if (comparisonType === 'previous') {
        compToDate = new Date(fromDate.getTime() - 24 * 60 * 60 * 1000);
        compFromDate = new Date(compToDate.getTime() - daysDiff * 24 * 60 * 60 * 1000);
    } else if (comparisonType === 'last-year') {
        compFromDate = new Date(fromDate.getFullYear() - 1, fromDate.getMonth(), fromDate.getDate());
        compToDate = new Date(toDate.getFullYear() - 1, toDate.getMonth(), toDate.getDate());
    }

    const compOrders = Object.entries(allOrders).filter(([id, order]) => {
        const orderDate = new Date(order.timestamp);
        return orderDate >= compFromDate && orderDate <= compToDate;
    });

    return compOrders;
}

// Update summary cards
function updateSummaryCards(orders) {
    let totalRevenue = 0;
    let totalCOGS = 0;
    let dayCount = 0;

    orders.forEach(([id, order]) => {
        totalRevenue += parseFloat(order.total) || 0;
    });

    // Estimate COGS at 30% of revenue
    totalCOGS = totalRevenue * 0.30;
    const grossProfit = totalRevenue - totalCOGS;
    const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue * 100) : 0;

    // Calculate days in period
    const dateFrom = new Date(document.getElementById('dateFrom').value);
    const dateTo = new Date(document.getElementById('dateTo').value);
    dayCount = Math.ceil((dateTo - dateFrom) / (1000 * 60 * 60 * 24)) + 1;
    const avgDailyRevenue = dayCount > 0 ? totalRevenue / dayCount : 0;

    document.getElementById('totalRevenue').textContent = `E ${totalRevenue.toFixed(2)}`;
    document.getElementById('grossProfit').textContent = `E ${grossProfit.toFixed(2)}`;
    document.getElementById('profitMargin').textContent = `${profitMargin.toFixed(1)}%`;
    document.getElementById('avgDailyRevenue').textContent = `E ${avgDailyRevenue.toFixed(2)}`;

    // Calculate comparison changes if available
    if (comparisonData) {
        let compRevenue = 0;
        comparisonData.forEach(([id, order]) => {
            compRevenue += parseFloat(order.total) || 0;
        });

        const compCOGS = compRevenue * 0.30;
        const compGrossProfit = compRevenue - compCOGS;
        const compMargin = compRevenue > 0 ? (compGrossProfit / compRevenue * 100) : 0;
        const compAvgDaily = comparisonData.length > 0 ? compRevenue / dayCount : 0;

        // Revenue change
        const revenueChange = compRevenue > 0 ? ((totalRevenue - compRevenue) / compRevenue * 100) : 0;
        document.getElementById('revenueChange').innerHTML = getChangeHTML(revenueChange);

        // Profit change
        const profitChange = compGrossProfit > 0 ? ((grossProfit - compGrossProfit) / compGrossProfit * 100) : 0;
        document.getElementById('profitChange').innerHTML = getChangeHTML(profitChange);

        // Margin change
        const marginChange = compMargin > 0 ? ((profitMargin - compMargin) / compMargin * 100) : 0;
        document.getElementById('marginChange').innerHTML = getChangeHTML(marginChange);

        // Daily revenue change
        const dailyChange = compAvgDaily > 0 ? ((avgDailyRevenue - compAvgDaily) / compAvgDaily * 100) : 0;
        document.getElementById('dailyChange').innerHTML = getChangeHTML(dailyChange);
    } else {
        document.getElementById('revenueChange').innerHTML = '';
        document.getElementById('profitChange').innerHTML = '';
        document.getElementById('marginChange').innerHTML = '';
        document.getElementById('dailyChange').innerHTML = '';
    }
}

// Helper function to format change percentage
function getChangeHTML(changePercent) {
    if (changePercent > 0) {
        return `<span style="color: #28a745;">▲ ${changePercent.toFixed(1)}%</span>`;
    } else if (changePercent < 0) {
        return `<span style="color: #dc3545;">▼ ${Math.abs(changePercent).toFixed(1)}%</span>`;
    } else {
        return `<span style="color: #6c757d;">→ 0%</span>`;
    }
}

// Generate Overview Analysis
function generateOverviewAnalysis(orders) {
    let totalRevenue = 0;
    let totalOrders = orders.length;
    let totalItems = 0;
    let revenueByDay = {};

    orders.forEach(([id, order]) => {
        totalRevenue += parseFloat(order.total) || 0;
        totalItems += order.items ? order.items.reduce((sum, item) => sum + item.quantity, 0) : 0;
        
        const date = new Date(order.timestamp).toLocaleDateString();
        if (!revenueByDay[date]) {
            revenueByDay[date] = 0;
        }
        revenueByDay[date] += parseFloat(order.total) || 0;
    });

    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const avgItemsPerOrder = totalOrders > 0 ? totalItems / totalOrders : 0;

    let html = `
        <div class="overview-grid">
            <div class="overview-card">
                <h4>Revenue Breakdown</h4>
                <table class="report-table">
                    <tbody>
                        <tr>
                            <td>Total Revenue</td>
                            <td><strong>E ${totalRevenue.toFixed(2)}</strong></td>
                        </tr>
                        <tr>
                            <td>Cost of Goods Sold (30%)</td>
                            <td>E ${(totalRevenue * 0.30).toFixed(2)}</td>
                        </tr>
                        <tr>
                            <td>Gross Profit (70%)</td>
                            <td><strong>E ${(totalRevenue * 0.70).toFixed(2)}</strong></td>
                        </tr>
                        <tr>
                            <td>VAT Collected (15%)</td>
                            <td>E ${(totalRevenue * 0.15).toFixed(2)}</td>
                        </tr>
                        <tr>
                            <td>Revenue Before Tax</td>
                            <td>E ${(totalRevenue * 0.85).toFixed(2)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div class="overview-card">
                <h4>Key Metrics</h4>
                <table class="report-table">
                    <tbody>
                        <tr>
                            <td>Total Orders</td>
                            <td><strong>${totalOrders}</strong></td>
                        </tr>
                        <tr>
                            <td>Total Items Sold</td>
                            <td><strong>${totalItems}</strong></td>
                        </tr>
                        <tr>
                            <td>Average Order Value</td>
                            <td><strong>E ${avgOrderValue.toFixed(2)}</strong></td>
                        </tr>
                        <tr>
                            <td>Average Items per Order</td>
                            <td><strong>${avgItemsPerOrder.toFixed(1)}</strong></td>
                        </tr>
                        <tr>
                            <td>Revenue per Item</td>
                            <td><strong>E ${(totalItems > 0 ? totalRevenue / totalItems : 0).toFixed(2)}</strong></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <h4 style="margin-top: 30px;">Daily Revenue Trend</h4>
        <table class="report-table">
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Revenue</th>
                    <th>% of Total</th>
                </tr>
            </thead>
            <tbody>
    `;

    Object.entries(revenueByDay).sort((a, b) => new Date(b[0]) - new Date(a[0])).forEach(([date, revenue]) => {
        const percentage = totalRevenue > 0 ? (revenue / totalRevenue * 100) : 0;
        html += `
            <tr>
                <td>${date}</td>
                <td>E ${revenue.toFixed(2)}</td>
                <td>${percentage.toFixed(1)}%</td>
            </tr>
        `;
    });

    html += `
            </tbody>
        </table>
    `;

    document.getElementById('analysisContent').innerHTML = html;
}

// Generate Category Analysis
function generateCategoryAnalysis(orders) {
    const categoryRevenue = {};
    
    orders.forEach(([id, order]) => {
        if (order.items) {
            order.items.forEach(item => {
                const category = item.category || 'Uncategorized';
                if (!categoryRevenue[category]) {
                    categoryRevenue[category] = {
                        revenue: 0,
                        quantity: 0,
                        orders: new Set()
                    };
                }
                categoryRevenue[category].revenue += item.quantity * item.price;
                categoryRevenue[category].quantity += item.quantity;
                categoryRevenue[category].orders.add(id);
            });
        }
    });

    const totalRevenue = Object.values(categoryRevenue).reduce((sum, cat) => sum + cat.revenue, 0);

    let html = `
        <table class="report-table">
            <thead>
                <tr>
                    <th>Category</th>
                    <th>Revenue</th>
                    <th>% of Total</th>
                    <th>Items Sold</th>
                    <th>Orders</th>
                    <th>Avg Revenue/Order</th>
                </tr>
            </thead>
            <tbody>
    `;

    Object.entries(categoryRevenue)
        .sort((a, b) => b[1].revenue - a[1].revenue)
        .forEach(([category, data]) => {
            const percentage = totalRevenue > 0 ? (data.revenue / totalRevenue * 100) : 0;
            const avgPerOrder = data.orders.size > 0 ? data.revenue / data.orders.size : 0;
            html += `
                <tr>
                    <td>${category}</td>
                    <td>E ${data.revenue.toFixed(2)}</td>
                    <td>${percentage.toFixed(1)}%</td>
                    <td>${data.quantity}</td>
                    <td>${data.orders.size}</td>
                    <td>E ${avgPerOrder.toFixed(2)}</td>
                </tr>
            `;
        });

    html += `
            </tbody>
            <tfoot>
                <tr>
                    <td><strong>Total</strong></td>
                    <td><strong>R ${totalRevenue.toFixed(2)}</strong></td>
                    <td><strong>100%</strong></td>
                    <td><strong>${Object.values(categoryRevenue).reduce((sum, cat) => sum + cat.quantity, 0)}</strong></td>
                    <td><strong>-</strong></td>
                    <td><strong>-</strong></td>
                </tr>
            </tfoot>
        </table>
    `;

    document.getElementById('analysisContent').innerHTML = html;
}

// Generate Product Analysis
function generateProductAnalysis(orders) {
    const productRevenue = {};
    
    orders.forEach(([id, order]) => {
        if (order.items) {
            order.items.forEach(item => {
                if (!productRevenue[item.name]) {
                    productRevenue[item.name] = {
                        revenue: 0,
                        quantity: 0,
                        orders: new Set(),
                        avgPrice: 0
                    };
                }
                productRevenue[item.name].revenue += item.quantity * item.price;
                productRevenue[item.name].quantity += item.quantity;
                productRevenue[item.name].orders.add(id);
                productRevenue[item.name].avgPrice = item.price;
            });
        }
    });

    const totalRevenue = Object.values(productRevenue).reduce((sum, prod) => sum + prod.revenue, 0);

    let html = `
        <table class="report-table">
            <thead>
                <tr>
                    <th>Product</th>
                    <th>Revenue</th>
                    <th>% of Total</th>
                    <th>Units Sold</th>
                    <th>Avg Price</th>
                    <th>Revenue/Unit</th>
                </tr>
            </thead>
            <tbody>
    `;

    Object.entries(productRevenue)
        .sort((a, b) => b[1].revenue - a[1].revenue)
        .forEach(([product, data]) => {
            const percentage = totalRevenue > 0 ? (data.revenue / totalRevenue * 100) : 0;
            const revenuePerUnit = data.quantity > 0 ? data.revenue / data.quantity : 0;
            html += `
                <tr>
                    <td>${product}</td>
                    <td>E ${data.revenue.toFixed(2)}</td>
                    <td>${percentage.toFixed(1)}%</td>
                    <td>${data.quantity}</td>
                    <td>E ${data.avgPrice.toFixed(2)}</td>
                    <td>E ${revenuePerUnit.toFixed(2)}</td>
                </tr>
            `;
        });

    html += `
            </tbody>
            <tfoot>
                <tr>
                    <td><strong>Total</strong></td>
                    <td><strong>R ${totalRevenue.toFixed(2)}</strong></td>
                    <td><strong>100%</strong></td>
                    <td><strong>${Object.values(productRevenue).reduce((sum, prod) => sum + prod.quantity, 0)}</strong></td>
                    <td><strong>-</strong></td>
                    <td><strong>-</strong></td>
                </tr>
            </tfoot>
        </table>
    `;

    document.getElementById('analysisContent').innerHTML = html;
}

// Generate Time Analysis
function generateTimeAnalysis(orders) {
    const hourlyRevenue = {};
    const dayOfWeekRevenue = {
        'Sunday': 0, 'Monday': 0, 'Tuesday': 0, 'Wednesday': 0, 
        'Thursday': 0, 'Friday': 0, 'Saturday': 0
    };
    
    orders.forEach(([id, order]) => {
        const date = new Date(order.timestamp);
        const hour = date.getHours();
        const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
        const revenue = parseFloat(order.total) || 0;

        if (!hourlyRevenue[hour]) {
            hourlyRevenue[hour] = 0;
        }
        hourlyRevenue[hour] += revenue;
        dayOfWeekRevenue[dayName] += revenue;
    });

    let html = `
        <h4>Revenue by Hour of Day</h4>
        <table class="report-table">
            <thead>
                <tr>
                    <th>Hour</th>
                    <th>Revenue</th>
                    <th>Time Period</th>
                </tr>
            </thead>
            <tbody>
    `;

    for (let hour = 0; hour < 24; hour++) {
        const revenue = hourlyRevenue[hour] || 0;
        const timeRange = `${hour.toString().padStart(2, '0')}:00 - ${(hour + 1).toString().padStart(2, '0')}:00`;
        const period = hour < 12 ? 'Morning' : hour < 17 ? 'Afternoon' : 'Evening';
        
        html += `
            <tr>
                <td>${timeRange}</td>
                <td>E ${revenue.toFixed(2)}</td>
                <td>${period}</td>
            </tr>
        `;
    }

    html += `
            </tbody>
        </table>

        <h4 style="margin-top: 30px;">Revenue by Day of Week</h4>
        <table class="report-table">
            <thead>
                <tr>
                    <th>Day</th>
                    <th>Revenue</th>
                    <th>% of Total</th>
                </tr>
            </thead>
            <tbody>
    `;

    const totalWeekRevenue = Object.values(dayOfWeekRevenue).reduce((sum, rev) => sum + rev, 0);
    const daysOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    
    daysOrder.forEach(day => {
        const revenue = dayOfWeekRevenue[day];
        const percentage = totalWeekRevenue > 0 ? (revenue / totalWeekRevenue * 100) : 0;
        html += `
            <tr>
                <td>${day}</td>
                <td>E ${revenue.toFixed(2)}</td>
                <td>${percentage.toFixed(1)}%</td>
            </tr>
        `;
    });

    html += `
            </tbody>
        </table>
    `;

    document.getElementById('analysisContent').innerHTML = html;
}

// Generate Growth Analysis
function generateGrowthAnalysis(orders) {
    const dailyRevenue = {};
    
    orders.forEach(([id, order]) => {
        const date = new Date(order.timestamp).toLocaleDateString();
        if (!dailyRevenue[date]) {
            dailyRevenue[date] = 0;
        }
        dailyRevenue[date] += parseFloat(order.total) || 0;
    });

    const sortedDates = Object.keys(dailyRevenue).sort((a, b) => new Date(a) - new Date(b));

    let html = `
        <table class="report-table">
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Revenue</th>
                    <th>Growth Rate</th>
                    <th>Cumulative Revenue</th>
                </tr>
            </thead>
            <tbody>
    `;

    let cumulativeRevenue = 0;
    let previousRevenue = 0;

    sortedDates.forEach((date, index) => {
        const revenue = dailyRevenue[date];
        cumulativeRevenue += revenue;
        
        let growthRate = '-';
        if (index > 0 && previousRevenue > 0) {
            const growth = ((revenue - previousRevenue) / previousRevenue * 100);
            growthRate = getChangeHTML(growth);
        }

        html += `
            <tr>
                <td>${date}</td>
                <td>E ${revenue.toFixed(2)}</td>
                <td>${growthRate}</td>
                <td>E ${cumulativeRevenue.toFixed(2)}</td>
            </tr>
        `;
        previousRevenue = revenue;
    });

    html += `
            </tbody>
        </table>
    `;

    document.getElementById('analysisContent').innerHTML = html;
}

// Generate Margins Analysis
function generateMarginsAnalysis(orders) {
    const productMargins = {};
    
    orders.forEach(([id, order]) => {
        if (order.items) {
            order.items.forEach(item => {
                if (!productMargins[item.name]) {
                    productMargins[item.name] = {
                        revenue: 0,
                        quantity: 0,
                        cogs: 0,
                        grossProfit: 0,
                        margin: 0
                    };
                }
                const itemRevenue = item.quantity * item.price;
                const itemCOGS = itemRevenue * 0.30; // Assume 30% COGS
                
                productMargins[item.name].revenue += itemRevenue;
                productMargins[item.name].quantity += item.quantity;
                productMargins[item.name].cogs += itemCOGS;
                productMargins[item.name].grossProfit += (itemRevenue - itemCOGS);
            });
        }
    });

    // Calculate margins
    Object.keys(productMargins).forEach(product => {
        const data = productMargins[product];
        data.margin = data.revenue > 0 ? (data.grossProfit / data.revenue * 100) : 0;
    });

    let html = `
        <table class="report-table">
            <thead>
                <tr>
                    <th>Product</th>
                    <th>Revenue</th>
                    <th>COGS (30%)</th>
                    <th>Gross Profit</th>
                    <th>Profit Margin</th>
                    <th>Units Sold</th>
                </tr>
            </thead>
            <tbody>
    `;

    let totalRevenue = 0;
    let totalCOGS = 0;
    let totalProfit = 0;

    Object.entries(productMargins)
        .sort((a, b) => b[1].margin - a[1].margin)
        .forEach(([product, data]) => {
            html += `
                <tr>
                    <td>${product}</td>
                    <td>E ${data.revenue.toFixed(2)}</td>
                    <td>E ${data.cogs.toFixed(2)}</td>
                    <td>E ${data.grossProfit.toFixed(2)}</td>
                    <td>${data.margin.toFixed(1)}%</td>
                    <td>${data.quantity}</td>
                </tr>
            `;
            totalRevenue += data.revenue;
            totalCOGS += data.cogs;
            totalProfit += data.grossProfit;
        });

    const overallMargin = totalRevenue > 0 ? (totalProfit / totalRevenue * 100) : 0;

    html += `
            </tbody>
            <tfoot>
                <tr>
                    <td><strong>Total</strong></td>
                    <td><strong>E ${totalRevenue.toFixed(2)}</strong></td>
                    <td><strong>E ${totalCOGS.toFixed(2)}</strong></td>
                    <td><strong>E ${totalProfit.toFixed(2)}</strong></td>
                    <td><strong>${overallMargin.toFixed(1)}%</strong></td>
                    <td><strong>-</strong></td>
                </tr>
            </tfoot>
        </table>
    `;

    document.getElementById('analysisContent').innerHTML = html;
}

// Generate Forecast Analysis
function generateForecastAnalysis(orders) {
    const dailyRevenue = {};
    
    orders.forEach(([id, order]) => {
        const date = new Date(order.timestamp).toLocaleDateString();
        if (!dailyRevenue[date]) {
            dailyRevenue[date] = 0;
        }
        dailyRevenue[date] += parseFloat(order.total) || 0;
    });

    const revenues = Object.values(dailyRevenue);
    const avgDaily = revenues.length > 0 ? revenues.reduce((sum, rev) => sum + rev, 0) / revenues.length : 0;
    
    // Simple forecast using average
    const next7Days = avgDaily * 7;
    const next30Days = avgDaily * 30;
    const next90Days = avgDaily * 90;

    let html = `
        <div class="overview-grid">
            <div class="overview-card">
                <h4>Historical Performance</h4>
                <table class="report-table">
                    <tbody>
                        <tr>
                            <td>Average Daily Revenue</td>
                            <td><strong>E ${avgDaily.toFixed(2)}</strong></td>
                        </tr>
                        <tr>
                            <td>Days Analyzed</td>
                            <td><strong>${Object.keys(dailyRevenue).length}</strong></td>
                        </tr>
                        <tr>
                            <td>Total Revenue</td>
                            <td><strong>E ${revenues.reduce((sum, rev) => sum + rev, 0).toFixed(2)}</strong></td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div class="overview-card">
                <h4>Revenue Forecast</h4>
                <table class="report-table">
                    <tbody>
                        <tr>
                            <td>Next 7 Days</td>
                            <td><strong>E ${next7Days.toFixed(2)}</strong></td>
                        </tr>
                        <tr>
                            <td>Next 30 Days</td>
                            <td><strong>E ${next30Days.toFixed(2)}</strong></td>
                        </tr>
                        <tr>
                            <td>Next 90 Days</td>
                            <td><strong>E ${next90Days.toFixed(2)}</strong></td>
                        </tr>
                        <tr>
                            <td>Projected Annual</td>
                            <td><strong>E ${(avgDaily * 365).toFixed(2)}</strong></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <p style="margin-top: 20px; color: #666; font-style: italic;">
            * Forecast based on simple average method. Actual results may vary based on seasonality, trends, and market conditions.
        </p>
    `;

    document.getElementById('analysisContent').innerHTML = html;
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
            text = text.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ');
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
    a.download = `revenue-analysis-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
}

function exportExcel() {
    exportCSV();
}

function exportPDF() {
    window.print();
}

function exportJSON() {
    const analysisData = {
        analysisType: currentAnalysisType,
        generatedDate: new Date().toISOString(),
        dateRange: {
            from: document.getElementById('dateFrom').value,
            to: document.getElementById('dateTo').value
        },
        data: currentAnalysisData.map(([id, order]) => ({
            orderId: id,
            ...order
        }))
    };

    const blob = new Blob([JSON.stringify(analysisData, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `revenue-analysis-${new Date().toISOString().split('T')[0]}.json`;
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
