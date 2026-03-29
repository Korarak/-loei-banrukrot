// controllers/reportController.js
const { Order, OrderDetail, Product, ProductVariant, Customer, Category } = require('../models');

// Helper: Parse date range from query params
const getDateRange = (startDate, endDate) => {
    let start, end;
    if (startDate && endDate) {
        start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
    } else {
        // Default to last 30 days
        const now = new Date();
        start = new Date(now);
        start.setDate(start.getDate() - 30);
        start.setHours(0, 0, 0, 0);
        end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    }
    return { start, end };
};

// @desc    Get sales report
// @route   GET /api/reports/sales
// @access  Private (Admin/Staff)
exports.getSalesReport = async (req, res, next) => {
    try {
        const { startDate, endDate, source, status } = req.query;
        const { start, end } = getDateRange(startDate, endDate);

        const matchStage = { orderDate: { $gte: start, $lte: end } };
        if (source && source !== 'all') matchStage.source = source;
        if (status && status !== 'all') matchStage.orderStatus = status;

        const salesData = await Order.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$orderDate" } },
                    revenue: { $sum: '$totalAmount' },
                    ordersCount: { $sum: 1 },
                    shippingCost: { $sum: { $ifNull: ['$shippingInfo.cost', 0] } }
                }
            },
            { $sort: { _id: -1 } }
        ]);

        const summary = salesData.reduce((acc, curr) => {
            acc.totalRevenue += curr.revenue;
            acc.totalOrders += curr.ordersCount;
            acc.totalShipping += curr.shippingCost;
            return acc;
        }, { totalRevenue: 0, totalOrders: 0, totalShipping: 0 });

        res.json({
            success: true,
            data: {
                dateRange: { start, end },
                summary,
                dailyData: salesData
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get product performance report
// @route   GET /api/reports/products
// @access  Private (Admin/Staff)
exports.getProductReport = async (req, res, next) => {
    try {
        const { startDate, endDate, categoryId } = req.query;
        const { start, end } = getDateRange(startDate, endDate);

        const matchStage = { 'order.orderDate': { $gte: start, $lte: end } };

        const productData = await OrderDetail.aggregate([
            {
                $lookup: {
                    from: 'orders',
                    localField: 'orderId',
                    foreignField: '_id',
                    as: 'order'
                }
            },
            { $unwind: '$order' },
            { $match: matchStage },
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
            // Optional: filter by category
            ...(categoryId && categoryId !== 'all' ? [{ $match: { 'product.categoryId': require('mongoose').Types.ObjectId(categoryId) } }] : []),
            {
                $group: {
                    _id: '$product._id',
                    productName: { $first: '$product.productName' },
                    sku: { $first: '$variant.sku' },
                    itemsSold: { $sum: '$quantity' },
                    revenue: { $sum: '$subtotal' }
                }
            },
            { $sort: { revenue: -1 } },
            { $limit: 100 }
        ]);

        res.json({
            success: true,
            data: productData
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get customer report
// @route   GET /api/reports/customers
// @access  Private (Admin/Staff)
exports.getCustomerReport = async (req, res, next) => {
    try {
        const { startDate, endDate } = req.query;
        const { start, end } = getDateRange(startDate, endDate);

        const customerData = await Order.aggregate([
            { $match: { orderDate: { $gte: start, $lte: end }, customerId: { $ne: null } } },
            {
                $group: {
                    _id: '$customerId',
                    totalSpent: { $sum: '$totalAmount' },
                    ordersCount: { $sum: 1 },
                    lastOrderDate: { $max: '$orderDate' }
                }
            },
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
                    firstName: '$customer.firstName',
                    lastName: '$customer.lastName',
                    email: '$customer.email',
                    phone: '$customer.phone',
                    dateRegistered: '$customer.dateRegistered',
                    totalSpent: 1,
                    ordersCount: 1,
                    lastOrderDate: 1
                }
            },
            { $sort: { totalSpent: -1 } },
            { $limit: 100 }
        ]);

        res.json({
            success: true,
            data: customerData
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Export report to CSV
// @route   GET /api/reports/export/csv
// @access  Private (Admin/Staff)
exports.exportCSV = async (req, res, next) => {
    try {
        const { type, startDate, endDate, source, status } = req.query;
        const { start, end } = getDateRange(startDate, endDate);

        let csvData = '';
        let filename = `export_${type}_${Date.now()}.csv`;

        if (type === 'sales') {
            const matchStage = { orderDate: { $gte: start, $lte: end } };
            if (source && source !== 'all') matchStage.source = source;
            if (status && status !== 'all') matchStage.orderStatus = status;

            const orders = await Order.find(matchStage)
                .populate('customerId', 'firstName lastName')
                .populate('shippingMethodId', 'name')
                .sort({ orderDate: -1 });

            // CSV Header
            csvData += '\uFEFF'; // BOM for Excel UTF-8
            csvData += 'Date,Reference,Customer,Source,Status,Shipping Method,Total Amount\n';

            orders.forEach(order => {
                const date = order.orderDate.toISOString().split('T')[0];
                const customer = order.customerId ? `${order.customerId.firstName} ${order.customerId.lastName}` : 'N/A';
                const shipping = order.shippingMethodId ? order.shippingMethodId.name : order.shippingInfo?.provider || 'N/A';
                csvData += `${date},${order.saleReference || order._id},"${customer}",${order.source},${order.orderStatus},"${shipping}",${order.totalAmount}\n`;
            });

        } else if (type === 'products') {
             // simplified version for fast export
             const productData = await OrderDetail.aggregate([
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
                        _id: '$product._id',
                        productName: { $first: '$product.productName' },
                        sku: { $first: '$variant.sku' },
                        itemsSold: { $sum: '$quantity' },
                        revenue: { $sum: '$subtotal' }
                    }
                },
                { $sort: { revenue: -1 } }
            ]);

            csvData += '\uFEFF'; 
            csvData += 'Product Name,SKU,Items Sold,Revenue\n';
            productData.forEach(p => {
                csvData += `"${p.productName}","${p.sku}",${p.itemsSold},${p.revenue}\n`;
            });
            
        } else if (type === 'customers') {
            const customerData = await Order.aggregate([
                { $match: { orderDate: { $gte: start, $lte: end }, customerId: { $ne: null } } },
                {
                    $group: {
                        _id: '$customerId',
                        totalSpent: { $sum: '$totalAmount' },
                        ordersCount: { $sum: 1 },
                    }
                },
                {
                    $lookup: {
                        from: 'customers',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'customer'
                    }
                },
                { $unwind: '$customer' },
            ]);

            csvData += '\uFEFF'; 
            csvData += 'First Name,Last Name,Email,Phone,Total Spent,Orders Count\n';
            customerData.forEach(c => {
                const fname = c.customer.firstName || '';
                const lname = c.customer.lastName || '';
                const email = c.customer.email || '';
                const phone = c.customer.phone || '';
                csvData += `"${fname}","${lname}","${email}","${phone}",${c.totalSpent},${c.ordersCount}\n`;
            });
        }

        res.setHeader('Content-disposition', `attachment; filename=${filename}`);
        res.set('Content-Type', 'text/csv; charset=utf-8');
        res.status(200).send(csvData);

    } catch (error) {
        next(error);
    }
};
