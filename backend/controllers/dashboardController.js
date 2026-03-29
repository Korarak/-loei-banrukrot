const { Order, Product, User, Customer, Category, OrderDetail } = require('../models');

// Helper: Parse date range from query params
const getDateRange = (range, startDate, endDate) => {
    const now = new Date();
    let start, end;
    end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    switch (range) {
        case '7d':
            start = new Date(now);
            start.setDate(start.getDate() - 6);
            start.setHours(0, 0, 0, 0);
            break;
        case '90d':
            start = new Date(now);
            start.setDate(start.getDate() - 89);
            start.setHours(0, 0, 0, 0);
            break;
        case 'custom':
            if (startDate && endDate) {
                start = new Date(startDate);
                start.setHours(0, 0, 0, 0);
                end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
            } else {
                start = new Date(now);
                start.setDate(start.getDate() - 29);
                start.setHours(0, 0, 0, 0);
            }
            break;
        case '30d':
        default:
            start = new Date(now);
            start.setDate(start.getDate() - 29);
            start.setHours(0, 0, 0, 0);
            break;
    }

    return { start, end };
};

// Helper: Get previous period for comparison
const getPreviousPeriod = (start, end) => {
    const duration = end.getTime() - start.getTime();
    const prevEnd = new Date(start.getTime() - 1);
    const prevStart = new Date(prevEnd.getTime() - duration);
    return { prevStart, prevEnd };
};

// Helper: Calculate percentage change
const calcChange = (current, previous) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Number(((current - previous) / previous * 100).toFixed(1));
};

// @desc    Get dashboard summary (enhanced with real % changes)
// @route   GET /api/dashboard/summary
// @access  Private (Admin/Staff)
exports.getDashboardSummary = async (req, res, next) => {
    try {
        const { range = '30d', startDate, endDate } = req.query;
        const { start, end } = getDateRange(range, startDate, endDate);
        const { prevStart, prevEnd } = getPreviousPeriod(start, end);

        const dateFilter = { orderDate: { $gte: start, $lte: end } };
        const prevDateFilter = { orderDate: { $gte: prevStart, $lte: prevEnd } };

        // 1. Revenue & Orders — Current Period (Split by Source)
        const [revenueStats, prevRevenueStats] = await Promise.all([
            Order.aggregate([
                { $match: dateFilter },
                {
                    $group: {
                        _id: '$source',
                        totalRevenue: { $sum: '$totalAmount' },
                        totalOrders: { $count: {} }
                    }
                }
            ]),
            Order.aggregate([
                { $match: prevDateFilter },
                {
                    $group: {
                        _id: '$source',
                        totalRevenue: { $sum: '$totalAmount' },
                        totalOrders: { $count: {} }
                    }
                }
            ])
        ]);

        const posStats = revenueStats.find(s => s._id === 'pos') || { totalRevenue: 0, totalOrders: 0 };
        const onlineStats = revenueStats.find(s => s._id === 'online') || { totalRevenue: 0, totalOrders: 0 };
        const prevPosStats = prevRevenueStats.find(s => s._id === 'pos') || { totalRevenue: 0, totalOrders: 0 };
        const prevOnlineStats = prevRevenueStats.find(s => s._id === 'online') || { totalRevenue: 0, totalOrders: 0 };

        const currentTotalRevenue = posStats.totalRevenue + onlineStats.totalRevenue;
        const prevTotalRevenue = prevPosStats.totalRevenue + prevOnlineStats.totalRevenue;
        const currentTotalOrders = posStats.totalOrders + onlineStats.totalOrders;
        const prevTotalOrders = prevPosStats.totalOrders + prevOnlineStats.totalOrders;

        // 2. Statistics Counts
        const [totalProducts, posProducts, onlineProducts, activeCustomers, prevActiveCustomers] = await Promise.all([
            Product.countDocuments(),
            Product.countDocuments({ isPos: true }),
            Product.countDocuments({ isOnline: true }),
            Customer.countDocuments({ isActive: true }),
            Customer.countDocuments({ isActive: true, dateRegistered: { $lte: prevEnd } })
        ]);

        // New customers in period
        const newCustomersInPeriod = await Customer.countDocuments({
            dateRegistered: { $gte: start, $lte: end }
        });
        const prevNewCustomers = await Customer.countDocuments({
            dateRegistered: { $gte: prevStart, $lte: prevEnd }
        });

        // 3. Recent Orders
        const recentOrders = await Order.find(dateFilter)
            .sort({ orderDate: -1 })
            .limit(5)
            .populate('customerId', 'firstName lastName email')
            .select('orderDate totalAmount source orderStatus saleReference');

        // 4. Monthly Revenue (for Chart)
        const monthlyRevenue = await Order.aggregate([
            { $match: { orderDate: { $gte: new Date(new Date().getFullYear(), 0, 1) } } },
            {
                $group: {
                    _id: { $month: '$orderDate' },
                    revenue: { $sum: '$totalAmount' },
                    orders: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // 5. Low Stock Products (Stock <= 10)
        const lowStockProducts = await Product.aggregate([
            { $unwind: "$variants" },
            { $match: { "variants.stock": { $lte: 10 } } },
            { $project: { productName: 1, "variants.sku": 1, "variants.stock": 1, "variants.price": 1, imageUrl: 1 } },
            { $limit: 10 }
        ]);

        // 6. Top Selling Products (within date range)
        const topSellingProducts = await Order.aggregate([
            { $match: dateFilter },
            { $unwind: "$items" },
            {
                $group: {
                    _id: "$items.productName",
                    totalSold: { $sum: "$items.quantity" },
                    revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } }
                }
            },
            { $sort: { totalSold: -1 } },
            { $limit: 5 }
        ]);

        // 7. Order Status Distribution (within date range)
        const orderStatusDistribution = await Order.aggregate([
            { $match: dateFilter },
            { $group: { _id: "$orderStatus", count: { $sum: 1 } } }
        ]);

        // 8. Recent Customers
        const recentCustomers = await Customer.find()
            .sort({ dateRegistered: -1 })
            .limit(5)
            .select('firstName lastName email dateRegistered');

        // 9. Average Order Value
        const avgOrderValue = currentTotalOrders > 0
            ? Math.round(currentTotalRevenue / currentTotalOrders)
            : 0;
        const prevAvgOrderValue = prevTotalOrders > 0
            ? Math.round(prevTotalRevenue / prevTotalOrders)
            : 0;

        res.json({
            success: true,
            data: {
                dateRange: { start, end, range },
                revenue: {
                    total: currentTotalRevenue,
                    pos: posStats.totalRevenue,
                    online: onlineStats.totalRevenue,
                    change: calcChange(currentTotalRevenue, prevTotalRevenue)
                },
                orders: {
                    total: currentTotalOrders,
                    pos: posStats.totalOrders,
                    online: onlineStats.totalOrders,
                    change: calcChange(currentTotalOrders, prevTotalOrders)
                },
                products: {
                    total: totalProducts,
                    pos: posProducts,
                    online: onlineProducts
                },
                customers: activeCustomers,
                customersChange: calcChange(newCustomersInPeriod, prevNewCustomers),
                avgOrderValue,
                avgOrderValueChange: calcChange(avgOrderValue, prevAvgOrderValue),
                recentOrders,
                monthlyRevenue,
                lowStockProducts,
                topSellingProducts,
                orderStatusDistribution,
                recentCustomers
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get daily revenue for the selected period
// @route   GET /api/dashboard/daily-revenue
// @access  Private (Admin/Staff)
exports.getDailyRevenue = async (req, res, next) => {
    try {
        const { range = '30d', startDate, endDate } = req.query;
        const { start, end } = getDateRange(range, startDate, endDate);

        const dailyRevenue = await Order.aggregate([
            { $match: { orderDate: { $gte: start, $lte: end } } },
            {
                $group: {
                    _id: {
                        year: { $year: '$orderDate' },
                        month: { $month: '$orderDate' },
                        day: { $dayOfMonth: '$orderDate' }
                    },
                    revenue: { $sum: '$totalAmount' },
                    orders: { $sum: 1 },
                    posRevenue: {
                        $sum: { $cond: [{ $eq: ['$source', 'pos'] }, '$totalAmount', 0] }
                    },
                    onlineRevenue: {
                        $sum: { $cond: [{ $eq: ['$source', 'online'] }, '$totalAmount', 0] }
                    }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
        ]);

        // Fill missing days with 0
        const filledData = [];
        const current = new Date(start);
        while (current <= end) {
            const y = current.getFullYear();
            const m = current.getMonth() + 1;
            const d = current.getDate();

            const found = dailyRevenue.find(
                r => r._id.year === y && r._id.month === m && r._id.day === d
            );

            filledData.push({
                date: new Date(y, m - 1, d).toISOString().slice(0, 10),
                revenue: found ? found.revenue : 0,
                orders: found ? found.orders : 0,
                posRevenue: found ? found.posRevenue : 0,
                onlineRevenue: found ? found.onlineRevenue : 0
            });

            current.setDate(current.getDate() + 1);
        }

        res.json({
            success: true,
            data: filledData
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get revenue comparison (current vs previous period)
// @route   GET /api/dashboard/revenue-comparison
// @access  Private (Admin/Staff)
exports.getRevenueComparison = async (req, res, next) => {
    try {
        const { range = '30d', startDate, endDate } = req.query;
        const { start, end } = getDateRange(range, startDate, endDate);
        const { prevStart, prevEnd } = getPreviousPeriod(start, end);

        // Get daily data for both periods
        const [currentData, prevData] = await Promise.all([
            Order.aggregate([
                { $match: { orderDate: { $gte: start, $lte: end } } },
                {
                    $group: {
                        _id: { $dayOfMonth: '$orderDate' },
                        revenue: { $sum: '$totalAmount' },
                        orders: { $sum: 1 }
                    }
                },
                { $sort: { _id: 1 } }
            ]),
            Order.aggregate([
                { $match: { orderDate: { $gte: prevStart, $lte: prevEnd } } },
                {
                    $group: {
                        _id: { $dayOfMonth: '$orderDate' },
                        revenue: { $sum: '$totalAmount' },
                        orders: { $sum: 1 }
                    }
                },
                { $sort: { _id: 1 } }
            ])
        ]);

        // Summary
        const currentTotal = currentData.reduce((sum, d) => sum + d.revenue, 0);
        const prevTotal = prevData.reduce((sum, d) => sum + d.revenue, 0);

        res.json({
            success: true,
            data: {
                current: {
                    period: { start, end },
                    total: currentTotal,
                    dailyData: currentData
                },
                previous: {
                    period: { start: prevStart, end: prevEnd },
                    total: prevTotal,
                    dailyData: prevData
                },
                change: calcChange(currentTotal, prevTotal)
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get hourly sales pattern
// @route   GET /api/dashboard/hourly-sales
// @access  Private (Admin/Staff)
exports.getHourlySales = async (req, res, next) => {
    try {
        const { range = '30d', startDate, endDate } = req.query;
        const { start, end } = getDateRange(range, startDate, endDate);

        const hourlySales = await Order.aggregate([
            { $match: { orderDate: { $gte: start, $lte: end } } },
            {
                $group: {
                    _id: {
                        hour: { $hour: '$orderDate' },
                        dayOfWeek: { $dayOfWeek: '$orderDate' } // 1=Sunday, 7=Saturday
                    },
                    revenue: { $sum: '$totalAmount' },
                    orders: { $sum: 1 }
                }
            },
            { $sort: { '_id.dayOfWeek': 1, '_id.hour': 1 } }
        ]);

        // Also provide hourly summary (averaged)
        const hourlySummary = [];
        for (let h = 0; h < 24; h++) {
            const hourData = hourlySales.filter(s => s._id.hour === h);
            const totalRevenue = hourData.reduce((sum, d) => sum + d.revenue, 0);
            const totalOrders = hourData.reduce((sum, d) => sum + d.orders, 0);
            hourlySummary.push({
                hour: h,
                revenue: totalRevenue,
                orders: totalOrders
            });
        }

        res.json({
            success: true,
            data: {
                heatmap: hourlySales,
                summary: hourlySummary
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get customer insights
// @route   GET /api/dashboard/customer-insights
// @access  Private (Admin/Staff)
exports.getCustomerInsights = async (req, res, next) => {
    try {
        const { range = '30d', startDate, endDate } = req.query;
        const { start, end } = getDateRange(range, startDate, endDate);

        // 1. New customers in period
        const newCustomers = await Customer.countDocuments({
            dateRegistered: { $gte: start, $lte: end }
        });

        // 2. Customers who ordered in this period
        const orderingCustomers = await Order.distinct('customerId', {
            orderDate: { $gte: start, $lte: end },
            customerId: { $ne: null }
        });

        // 3. Of those, find returning customers (ordered before the period too)
        let returningCount = 0;
        if (orderingCustomers.length > 0) {
            const returningCustomers = await Order.distinct('customerId', {
                orderDate: { $lt: start },
                customerId: { $in: orderingCustomers }
            });
            returningCount = returningCustomers.length;
        }

        const newBuyerCount = orderingCustomers.length - returningCount;

        // 4. Top customers by spend
        const topCustomers = await Order.aggregate([
            { $match: { orderDate: { $gte: start, $lte: end }, customerId: { $ne: null } } },
            {
                $group: {
                    _id: '$customerId',
                    totalSpent: { $sum: '$totalAmount' },
                    orderCount: { $sum: 1 }
                }
            },
            { $sort: { totalSpent: -1 } },
            { $limit: 5 },
            {
                $lookup: {
                    from: 'customers',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'customer'
                }
            },
            { $unwind: '$customer' },
            {
                $project: {
                    _id: 1,
                    totalSpent: 1,
                    orderCount: 1,
                    firstName: '$customer.firstName',
                    lastName: '$customer.lastName',
                    email: '$customer.email'
                }
            }
        ]);

        // 5. Customer registration trend (by day for the period)
        const registrationTrend = await Customer.aggregate([
            { $match: { dateRegistered: { $gte: start, $lte: end } } },
            {
                $group: {
                    _id: {
                        year: { $year: '$dateRegistered' },
                        month: { $month: '$dateRegistered' },
                        day: { $dayOfMonth: '$dateRegistered' }
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
        ]);

        res.json({
            success: true,
            data: {
                newCustomers,
                activeCustomers: orderingCustomers.length,
                returningCustomers: returningCount,
                newBuyers: newBuyerCount,
                topCustomers,
                registrationTrend
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get top categories by revenue
// @route   GET /api/dashboard/top-categories
// @access  Private (Admin/Staff)
exports.getTopCategories = async (req, res, next) => {
    try {
        const { range = '30d', startDate, endDate } = req.query;
        const { start, end } = getDateRange(range, startDate, endDate);

        // Get order details within date range and join with product info
        const topCategories = await OrderDetail.aggregate([
            {
                $lookup: {
                    from: 'orders',
                    localField: 'orderId',
                    foreignField: '_id',
                    as: 'order'
                }
            },
            { $unwind: '$order' },
            { $match: { 'order.orderDate': { $gte: start, $lte: end } } },
            {
                $lookup: {
                    from: 'productvariants',
                    localField: 'variantId',
                    foreignField: '_id',
                    as: 'variant'
                }
            },
            { $unwind: '$variant' },
            {
                $lookup: {
                    from: 'products',
                    localField: 'variant.productId',
                    foreignField: '_id',
                    as: 'product'
                }
            },
            { $unwind: '$product' },
            {
                $group: {
                    _id: '$product.categoryId',
                    revenue: { $sum: '$subtotal' },
                    itemsSold: { $sum: '$quantity' }
                }
            },
            { $sort: { revenue: -1 } },
            { $limit: 10 },
            {
                $lookup: {
                    from: 'categories',
                    localField: '_id',
                    foreignField: 'categoryId',
                    as: 'category'
                }
            },
            {
                $project: {
                    _id: 1,
                    revenue: 1,
                    itemsSold: 1,
                    categoryName: {
                        $ifNull: [{ $arrayElemAt: ['$category.name', 0] }, 'ไม่ระบุหมวดหมู่']
                    }
                }
            }
        ]);

        res.json({
            success: true,
            data: topCategories
        });
    } catch (error) {
        next(error);
    }
};
