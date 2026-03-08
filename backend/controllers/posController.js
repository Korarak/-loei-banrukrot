// controllers/posController.js
const { Order, OrderDetail, Payment, ProductVariant } = require('../models');

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

        // ตรวจสอบสต็อกและคำนวณยอดรวม
        let totalAmount = 0;
        const variantDetails = [];

        for (const item of items) {
            const variant = await ProductVariant.findById(item.variantId).populate('productId');

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

        // สร้าง order details และลดสต็อก
        const orderDetails = [];
        for (const item of variantDetails) {
            const detail = await OrderDetail.create({
                orderId: order._id,
                variantId: item.variant._id,
                quantity: item.quantity,
                pricePerUnit: item.variant.price,
                subtotal: item.subtotal
            });
            orderDetails.push(detail);

            // ลดสต็อก
            await ProductVariant.findByIdAndUpdate(
                item.variant._id,
                { $inc: { stockAvailable: -item.quantity } }
            );
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

        const sales = await Order.find(query)
            .populate('cashierUserId')
            .populate('storeId')
            .limit(parseInt(limit))
            .skip(skip)
            .sort({ orderDate: -1 });

        const total = await Order.countDocuments(query);

        // คำนวณยอดขายรวม
        const totalSales = await Order.aggregate([
            { $match: query },
            { $group: { _id: null, total: { $sum: '$totalAmount' } } }
        ]);

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

        const details = await OrderDetail.find({ orderId: order._id })
            .populate({
                path: 'variantId',
                populate: { path: 'productId' }
            });

        const payments = await Payment.find({ orderId: order._id });

        res.json({
            success: true,
            data: {
                ...order.toObject(),
                items: details,
                payments
            }
        });
    } catch (error) {
        next(error);
    }
};
