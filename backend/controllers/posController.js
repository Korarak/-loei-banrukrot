// controllers/posController.js
const { Order, OrderDetail, Payment, ProductVariant, ProductImage } = require('../models');
const { deductStock } = require('../utils/stockUtils');

// @desc    Create POS sale (walk-in customer)
// @route   POST /api/pos/sales
// @access  Private (staff/owner)
exports.createPOSSale = async (req, res, next) => {
    try {
        const { items, paymentMethod, customerId, storeId } = req.body;

        // items = [{ variantId, quantity }, ...]

        if (!items || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Items are required'
            });
        }

        // Batch-fetch all variants in one query
        const variantIds = items.map(i => i.variantId);
        const variants = await ProductVariant.find({ _id: { $in: variantIds } }).populate('productId');
        const variantMap = new Map(variants.map(v => [v._id.toString(), v]));

        let totalAmount = 0;
        const variantDetails = [];

        for (const item of items) {
            const variant = variantMap.get(item.variantId.toString());

            if (!variant) {
                return res.status(404).json({
                    success: false,
                    message: `Variant ${item.variantId} not found`
                });
            }

            if (variant.stockAvailable < item.quantity) {
                return res.status(400).json({
                    success: false,
                    message: `Insufficient stock for ${variant.sku}`
                });
            }

            const subtotal = item.quantity * variant.price;
            totalAmount += subtotal;

            variantDetails.push({
                variant,
                quantity: item.quantity,
                subtotal
            });
        }

        // สร้างเลขที่ใบเสร็จ
        const saleReference = `POS-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

        // สร้าง order
        const order = await Order.create({
            customerId: customerId || null, // NULL สำหรับ walk-in
            shippingAddressId: null,
            storeId: storeId || null,
            cashierUserId: req.user._id, // พนักงานที่ทำรายการ
            source: 'pos',
            saleReference,
            totalAmount,
            orderStatus: 'completed' // POS ขายเสร็จทันที
        });

        // สร้าง order details (bulk insert)
        const orderDetails = await OrderDetail.insertMany(
            variantDetails.map(item => ({
                orderId: order._id,
                variantId: item.variant._id,
                quantity: item.quantity,
                pricePerUnit: item.variant.price,
                subtotal: item.subtotal
            }))
        );

        // ลดสต็อก (sequential — each must be atomic)
        for (const item of variantDetails) {
            await deductStock(item.variant._id, item.quantity, 'sale_pos', order._id, 'Order', req.user._id);
        }

        // สร้าง payment record
        await Payment.create({
            orderId: order._id,
            paymentMethod: paymentMethod || 'Cash',
            amountPaid: totalAmount,
            paidByCustomerId: customerId || null
        });

        res.status(201).json({
            success: true,
            message: 'Sale completed successfully',
            data: {
                order,
                orderDetails,
                saleReference,
                totalAmount
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get POS sales history
// @route   GET /api/pos/sales
// @access  Private (staff/owner)
exports.getPOSSales = async (req, res, next) => {
    try {
        const { page = 1, limit = 50, startDate, endDate, storeId } = req.query;

        const query = { source: 'pos' };

        if (storeId) query.storeId = storeId;

        if (startDate || endDate) {
            query.orderDate = {};
            if (startDate) query.orderDate.$gte = new Date(startDate);
            if (endDate) query.orderDate.$lte = new Date(endDate);
        }

        const skip = (page - 1) * limit;

        const [orders, total, totalSalesResult] = await Promise.all([
            Order.find(query)
                .populate('cashierUserId', 'username firstName lastName')
                .populate('storeId')
                .limit(parseInt(limit))
                .skip(skip)
                .sort({ orderDate: -1 }),
            Order.countDocuments(query),
            Order.aggregate([
                { $match: query },
                { $group: { _id: null, total: { $sum: '$totalAmount' } } }
            ])
        ]);

        // Batch-fetch order details and payments
        const orderIds = orders.map(o => o._id);
        const [allDetails, allPayments] = await Promise.all([
            OrderDetail.find({ orderId: { $in: orderIds } })
                .populate({ path: 'variantId', populate: { path: 'productId', select: 'productName' } }),
            Payment.find({ orderId: { $in: orderIds } })
        ]);

        const detailsByOrder = new Map();
        for (const d of allDetails) {
            const key = d.orderId.toString();
            if (!detailsByOrder.has(key)) detailsByOrder.set(key, []);
            detailsByOrder.get(key).push(d);
        }
        const paymentByOrder = new Map(allPayments.map(p => [p.orderId.toString(), p]));

        const sales = orders.map(order => {
            const details = detailsByOrder.get(order._id.toString()) || [];
            const payment = paymentByOrder.get(order._id.toString());
            return {
                ...order.toObject(),
                createdAt: order.orderDate,
                createdBy: order.cashierUserId,
                items: details.map(d => ({
                    product: { _id: d.variantId?.productId?._id, productName: d.variantId?.productId?.productName || 'Unknown' },
                    variant: { _id: d.variantId?._id, sku: d.variantId?.sku, price: d.pricePerUnit },
                    quantity: d.quantity,
                    price: d.pricePerUnit
                })),
                paymentMethod: payment?.paymentMethod || null
            };
        });

        const totalSales = totalSalesResult;

        res.json({
            success: true,
            data: sales,
            summary: {
                totalSales: totalSales[0]?.total || 0,
                totalTransactions: total
            },
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get sale receipt
// @route   GET /api/pos/sales/:saleReference
// @access  Private (staff/owner)
exports.getSaleReceipt = async (req, res, next) => {
    try {
        const order = await Order.findOne({ saleReference: req.params.saleReference })
            .populate('cashierUserId')
            .populate('storeId')
            .populate('customerId');

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Sale not found'
            });
        }

        const [details, payments] = await Promise.all([
            OrderDetail.find({ orderId: order._id })
                .populate({ path: 'variantId', populate: { path: 'productId' } }),
            Payment.find({ orderId: order._id })
        ]);

        const payment = payments[0];

        res.json({
            success: true,
            data: {
                ...order.toObject(),
                createdAt: order.orderDate,
                createdBy: order.cashierUserId,
                paymentMethod: payment?.paymentMethod || null,
                items: details.map(d => ({
                    product: { _id: d.variantId?.productId?._id, productName: d.variantId?.productId?.productName || 'Unknown' },
                    variant: { _id: d.variantId?._id, sku: d.variantId?.sku, price: d.pricePerUnit },
                    quantity: d.quantity,
                    price: d.pricePerUnit
                })),
                payments
            }
        });
    } catch (error) {
        next(error);
    }
};
