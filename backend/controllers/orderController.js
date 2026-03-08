// controllers/orderController.js
const { Order, OrderDetail, Payment, ProductVariant, Cart, CartItem, CustomerAddress, ShippingMethod, ProductImage } = require('../models');

// @desc    Create order from cart (E-commerce)
// @route   POST /api/orders
// @access  Private (customer)
const fs = require('fs');
const path = require('path');

const { generateQRCodeDataURL } = require('../utils/promptpay');

// @desc    Create order from cart (E-commerce)
// @route   POST /api/orders
// @access  Private (customer)
exports.createOrderFromCart = async (req, res, next) => {
    try {
        let { shippingAddressId, paymentMethod, shippingMethodId } = req.body;

        const logFile = path.join(__dirname, '../debug_order.log');
        const log = (msg) => {
            try {
                fs.appendFileSync(logFile, new Date().toISOString() + ': ' + msg + '\n');
            } catch (e) {
                console.error('Logging failed:', e);
            }
        };

        // Default payment method if not provided
        if (!paymentMethod) {
            paymentMethod = 'Transfer';
        }

        log(`Create Order Request: Body=${JSON.stringify(req.body)}, Customer=${req.customer?._id}`);

        // ดึง cart และ items
        const cart = await Cart.findOne({ customerId: req.customer._id });
        if (!cart) {
            log(`Cart not found for customer: ${req.customer._id}`);
            return res.status(404).json({
                success: false,
                message: 'Cart not found'
            });
        }

        const cartItems = await CartItem.find({ cartId: cart._id }).populate('variantId');
        if (cartItems.length === 0) {
            log('Cart is empty');
            return res.status(400).json({
                success: false,
                message: 'Cart is empty'
            });
        }

        // ตรวจสอบสต็อกและคำนวณยอดรวม
        let totalAmount = 0;
        for (const item of cartItems) {
            if (item.variantId.stockAvailable < item.quantity) {
                console.log('Insufficient stock:', item.variantId.sku);
                return res.status(400).json({
                    success: false,
                    message: `Insufficient stock for ${item.variantId.sku}`
                });
            }
            totalAmount += item.quantity * item.variantId.price;
        }

        // ตรวจสอบที่อยู่จัดส่ง
        console.log('Validating Address ID:', shippingAddressId);
        const address = await CustomerAddress.findById(shippingAddressId);
        if (!address) {
            console.log('Address not found');
            return res.status(400).json({
                success: false,
                message: 'Invalid shipping address: Address not found'
            });
        }

        if (address.customerId.toString() !== req.customer._id.toString()) {
            console.log('Address does not belong to customer:', {
                addressCustomerId: address.customerId,
                reqCustomerId: req.customer._id
            });
            return res.status(400).json({
                success: false,
                message: 'Invalid shipping address: Does not belong to customer'
            });
        }

        // ตรวจสอบ Shipping Method
        log(`Validating Shipping Method ID: ${shippingMethodId}`);
        const shippingMethod = await ShippingMethod.findById(shippingMethodId);
        if (!shippingMethod || !shippingMethod.isActive) {
            log('Invalid shipping method');
            return res.status(400).json({
                success: false,
                message: 'Invalid shipping method'
            });
        }

        // Add shipping cost to total
        const shippingCost = shippingMethod.price;
        totalAmount += shippingCost;

        // Generate Sale Reference
        const date = new Date();
        const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
        const randomStr = Math.random().toString(36).substring(2, 7).toUpperCase();
        const saleReference = `ORD-${dateStr}-${randomStr}`;

        // สร้าง order
        const order = await Order.create({
            customerId: req.customer._id,
            shippingAddressId,
            shippingMethodId,
            source: 'online',
            totalAmount,
            orderStatus: 'pending',
            saleReference,
            orderDate: new Date(),
            shippingInfo: {
                provider: shippingMethod.name,
                cost: shippingCost
            }
        });

        // สร้าง order details และลดสต็อก
        const orderDetails = [];
        for (const item of cartItems) {
            const detail = await OrderDetail.create({
                orderId: order._id,
                variantId: item.variantId._id,
                quantity: item.quantity,
                pricePerUnit: item.variantId.price,
                subtotal: item.quantity * item.variantId.price
            });
            orderDetails.push(detail);

            // ลดสต็อก
            await ProductVariant.findByIdAndUpdate(
                item.variantId._id,
                { $inc: { stockAvailable: -item.quantity } }
            );
        }

        // สร้าง payment record
        await Payment.create({
            orderId: order._id,
            paymentMethod,
            amountPaid: totalAmount,
            paidByCustomerId: req.customer._id
        });

        // ล้าง cart
        await CartItem.deleteMany({ cartId: cart._id });

        res.status(201).json({
            success: true,
            message: 'Order created successfully',
            data: {
                ...order.toObject(),
                orderReference: saleReference,
                createdAt: order.orderDate,
                items: orderDetails
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get customer's orders
// @route   GET /api/orders
// @access  Private (customer)
exports.getCustomerOrders = async (req, res, next) => {
    try {
        const orders = await Order.find({ customerId: req.customer._id })
            .populate('shippingAddressId')
            .sort({ orderDate: -1 });

        // Get order details for each order
        const ordersWithDetails = await Promise.all(
            orders.map(async (order) => {
                const details = await OrderDetail.find({ orderId: order._id })
                    .populate({
                        path: 'variantId',
                        populate: { path: 'productId' }
                    });

                // Get images
                const productIds = details.map(d => d.variantId?.productId?._id).filter(id => id);
                const productImages = await ProductImage.find({ productId: { $in: productIds } });

                const formattedItems = details.map(item => {
                    const product = item.variantId?.productId;
                    const primaryImg = productImages.find(img => img.productId.toString() === product?._id?.toString() && img.isPrimary);
                    const anyImg = productImages.find(img => img.productId.toString() === product?._id?.toString());

                    return {
                        productName: product?.productName || 'Unknown Product',
                        sku: item.variantId?.sku,
                        quantity: item.quantity,
                        price: item.pricePerUnit,
                        shippingSize: product?.shippingSize || 'small',
                        imageUrl: primaryImg?.imagePath || anyImg?.imagePath || product?.imageUrl // Add image
                    };
                });

                return {
                    ...order.toObject(),
                    orderReference: order.saleReference || order._id.toString().slice(-6).toUpperCase(),
                    createdAt: order.orderDate,
                    items: formattedItems
                };
            })
        );

        res.json({
            success: true,
            data: ordersWithDetails
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private (customer/staff)
exports.getOrderById = async (req, res, next) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('customerId')
            .populate('shippingAddressId')
            .populate('cashierUserId');

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // ตรวจสอบสิทธิ์ (customer สามารถดูได้เฉพาะ order ของตัวเอง)
        if (req.customer && order.customerId._id.toString() !== req.customer._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        const details = await OrderDetail.find({ orderId: order._id })
            .populate({
                path: 'variantId',
                populate: { path: 'productId' }
            });

        // Get images
        const productIds = details.map(d => d.variantId?.productId?._id).filter(id => id);
        const productImages = await ProductImage.find({ productId: { $in: productIds } });

        const formattedItems = details.map(item => {
            const product = item.variantId?.productId;
            const primaryImg = productImages.find(img => img.productId.toString() === product?._id?.toString() && img.isPrimary);
            const anyImg = productImages.find(img => img.productId.toString() === product?._id?.toString());

            return {
                productName: product?.productName || 'Unknown Product',
                sku: item.variantId?.sku,
                quantity: item.quantity,
                price: item.pricePerUnit,
                shippingSize: product?.shippingSize || 'small',
                imageUrl: primaryImg?.imagePath || anyImg?.imagePath || product?.imageUrl
            };
        });

        const payments = await Payment.find({ orderId: order._id });

        res.json({
            success: true,
            data: {
                ...order.toObject(),
                orderReference: order.saleReference || order._id.toString().slice(-6).toUpperCase(),
                createdAt: order.orderDate,
                customer: order.customerId, // Map customerId to customer
                items: formattedItems,
                payments
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update order status
// @route   PATCH /api/orders/:id/status
// @access  Private (staff/owner)
// @desc    Update order status
// @route   PATCH /api/orders/:id/status
// @access  Private (staff/owner)
exports.updateOrderStatus = async (req, res, next) => {
    try {
        const { orderStatus, shippingInfo } = req.body;

        // Find order first to check current status
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // Check if cancelling and not already cancelled
        if (orderStatus === 'cancelled' && order.orderStatus !== 'cancelled') {
            const orderDetails = await OrderDetail.find({ orderId: order._id });

            // Restore stock
            for (const item of orderDetails) {
                await ProductVariant.findByIdAndUpdate(
                    item.variantId,
                    { $inc: { stockAvailable: item.quantity } }
                );
            }
        }

        // Update fields
        if (orderStatus) order.orderStatus = orderStatus;
        if (shippingInfo) order.shippingInfo = shippingInfo;

        await order.save();

        res.json({
            success: true,
            message: 'Order status updated',
            data: order
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get all orders (for staff)
// @route   GET /api/orders/all
// @access  Private (staff/owner)
exports.getAllOrders = async (req, res, next) => {
    try {
        const { page = 1, limit = 20, status, source } = req.query;

        const query = {};
        if (status) query.orderStatus = status;
        if (source) query.source = source;

        const skip = (page - 1) * limit;

        const orders = await Order.find(query)
            .populate('customerId')
            .populate('cashierUserId')
            .limit(parseInt(limit))
            .skip(skip)
            .sort({ orderDate: -1 });

        const total = await Order.countDocuments(query);

        // Attach items to each order
        const ordersWithItems = await Promise.all(orders.map(async (order) => {
            const items = await OrderDetail.find({ orderId: order._id })
                .populate({
                    path: 'variantId',
                    populate: { path: 'productId' } // Populate product info
                });

            // Format items to match frontend expectation if needed, or just return details
            // Frontend expects: items: [{ productName, quantity, price, ... }]
            // OrderDetail has: variantId (populated), quantity, pricePerUnit

            const formattedItems = items.map(item => ({
                productName: item.variantId?.productId?.productName || 'Unknown Product',
                sku: item.variantId?.sku,
                quantity: item.quantity,
                price: item.pricePerUnit
            }));

            return {
                ...order.toObject(),
                orderReference: order.saleReference || order._id.toString().slice(-6).toUpperCase(),
                createdAt: order.orderDate,
                customer: order.customerId, // Map customerId to customer
                items: formattedItems
            };
        }));

        res.json({
            success: true,
            data: ordersWithItems,
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
// @desc    Upload payment slip
// @route   POST /api/orders/:id/slip
// @access  Private (customer)
exports.uploadPaymentSlip = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Please upload a file'
            });
        }

        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // Check ownership
        if (order.customerId.toString() !== req.customer._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        // Find payment record
        let payment = await Payment.findOne({ orderId: order._id });

        // If no payment record exists (legacy or error), create one
        if (!payment) {
            payment = await Payment.create({
                orderId: order._id,
                paymentMethod: 'Transfer', // Assume transfer if uploading slip
                amountPaid: order.totalAmount,
                paidByCustomerId: req.customer._id
            });
        }

        // Update payment with slip
        const slipPath = `/uploads/slips/${req.file.filename}`;
        payment.slipImage = slipPath;
        payment.isVerified = false; // Reset verification on new upload
        await payment.save();

        res.json({
            success: true,
            message: 'Payment slip uploaded successfully',
            data: {
                slipImage: slipPath
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Verify payment slip (admin)
// @route   POST /api/orders/:id/verify-payment
// @access  Private (staff/owner)
exports.verifyPayment = async (req, res, next) => {
    try {
        const { isVerified } = req.body;

        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        const payment = await Payment.findOne({ orderId: order._id });
        if (!payment) {
            return res.status(404).json({
                success: false,
                message: 'Payment record not found'
            });
        }

        payment.isVerified = isVerified;
        await payment.save();

        // If verified, update order status to confirmed or paid
        if (isVerified) {
            order.orderStatus = 'confirmed';
            await order.save();
        }

        res.json({
            success: true,
            message: isVerified ? 'Payment verified and order confirmed' : 'Payment verification status updated',
            data: {
                isVerified: payment.isVerified,
                orderStatus: order.orderStatus
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get PromptPay QR Code for order
// @route   GET /api/orders/:id/qrcode
// @access  Private (customer)
exports.getOrderQRCode = async (req, res, next) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // Check ownership
        if (order.customerId.toString() !== req.customer._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        const qrCode = await generateQRCodeDataURL(order.totalAmount);

        res.json({
            success: true,
            data: {
                qrCode
            }
        });
    } catch (error) {
        next(error);
    }
};

