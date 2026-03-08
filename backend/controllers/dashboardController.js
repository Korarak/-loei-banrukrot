const { Order, Product, User, Customer } = require('../models');

// @desc    Get dashboard summary
// @route   GET /api/dashboard/summary
// @access  Private (Admin/Staff)
exports.getDashboardSummary = async (req, res, next) => {
    try {
        // 1. Total Revenue & Orders (Split by Source)
        const revenueStats = await Order.aggregate([
            {
                $group: {
                    _id: '$source',
                    totalRevenue: { $sum: '$totalAmount' },
                    totalOrders: { $count: {} }
                }
            }
        ]);

        const posStats = revenueStats.find(s => s._id === 'pos') || { totalRevenue: 0, totalOrders: 0 };
        const onlineStats = revenueStats.find(s => s._id === 'online') || { totalRevenue: 0, totalOrders: 0 };

        // 2. Statistics Counts
        const [totalProducts, posProducts, onlineProducts, activeCustomers] = await Promise.all([
            Product.countDocuments(),
            Product.countDocuments({ isPos: true }),
            Product.countDocuments({ isOnline: true }),
            Customer.countDocuments({ isActive: true })
        ]);

        // 3. Recent Orders
        const recentOrders = await Order.find()
            .sort({ orderDate: -1 })
            .limit(5)
            .populate('customerId', 'firstName lastName email')
            .select('orderDate totalAmount source orderStatus');

        // 4. Monthly Revenue (for Chart)
        const monthlyRevenue = await Order.aggregate([
            {
                $group: {
                    _id: { $month: '$orderDate' },
                    revenue: { $sum: '$totalAmount' }
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

        // 6. Top Selling Products
        const topSellingProducts = await Order.aggregate([
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

        // 7. Order Status Distribution
        const orderStatusDistribution = await Order.aggregate([
            { $group: { _id: "$orderStatus", count: { $sum: 1 } } }
        ]);

        // 8. Recent Customers
        const recentCustomers = await Customer.find()
            .sort({ dateRegistered: -1 })
            .limit(5)
            .select('firstName lastName email dateRegistered');

        res.json({
            success: true,
            data: {
                revenue: {
                    total: posStats.totalRevenue + onlineStats.totalRevenue,
                    pos: posStats.totalRevenue,
                    online: onlineStats.totalRevenue
                },
                orders: {
                    total: posStats.totalOrders + onlineStats.totalOrders,
                    pos: posStats.totalOrders,
                    online: onlineStats.totalOrders
                },
                products: {
                    total: totalProducts,
                    pos: posProducts,
                    online: onlineProducts
                },
                customers: activeCustomers,
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
