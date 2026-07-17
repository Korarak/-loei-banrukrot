// controllers/orderController.js
const { Order, OrderDetail, Payment, ProductVariant, Cart, CartItem, CustomerAddress, ShippingMethod, ProductImage } = require('../models');

// @desc    Create order from cart (E-commerce)
// @route   POST /api/orders
// @access  Private (customer)
const { generateQRCodeDataURL } = require('../utils/promptpay');
const { deductStock, addStock } = require('../utils/stockUtils');
const { generateSaleReference } = require('../utils/saleReference');
const { applyDiscount } = require('../utils/pricing');
const { processImage } = require('../utils/imageProcessing');
const { UPLOADS_BASE, getUploadSubdir } = require('../middleware/upload');
const path = require('path');
const fs = require('fs');

// @desc    Create order from cart (E-commerce)
// @route   POST /api/orders
// @access  Private (customer)
exports.createOrderFromCart = async (req, res, next) => {
    try {
        let { shippingAddressId, paymentMethod, shippingMethodId, itemIds } = req.body;

        // Default payment method if not provided
        if (!paymentMethod) {
            paymentMethod = 'Transfer';
        }

        // ดึง cart และ items
        const cart = await Cart.findOne({ customerId: req.customer._id });
        if (!cart) {
            return res.status(404).json({
                success: false,
                message: 'Cart not found'
            });
        }

        const allCartItems = await CartItem.find({ cartId: cart._id })
            .populate({ path: 'variantId', populate: { path: 'productId', select: 'discountPercent' } });

        // Filter out ghost items (variant was deleted)
        const ghostItems = allCartItems.filter(item => !item.variantId);
        if (ghostItems.length > 0) {
            await CartItem.deleteMany({ _id: { $in: ghostItems.map(i => i._id) } });
        }

        let cartItems = allCartItems.filter(item => item.variantId);

        // สั่งเฉพาะรายการที่เลือก (itemIds) — ไม่ส่งมา = สั่งทั้งตะกร้า (client เก่า)
        if (Array.isArray(itemIds) && itemIds.length > 0) {
            const selectedIds = new Set(itemIds.map(String));
            cartItems = cartItems.filter(item => selectedIds.has(item._id.toString()));
        }

        if (cartItems.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'ไม่มีสินค้าที่เลือกสั่งซื้อ'
            });
        }

        // ตรวจสอบสต็อกและคำนวณยอดรวม
        let totalAmount = 0;
        for (const item of cartItems) {
            if (item.variantId.stockAvailable < item.quantity) {
                const remaining = item.variantId.stockAvailable;
                return res.status(400).json({
                    success: false,
                    message: remaining <= 0
                        ? `สินค้า ${item.variantId.sku} หมดสต็อก กรุณานำออกจากรายการที่เลือก`
                        : `สินค้า ${item.variantId.sku} มีไม่เพียงพอ (คงเหลือ ${remaining} ชิ้น) กรุณาปรับจำนวน`
                });
            }
            totalAmount += item.quantity * applyDiscount(item.variantId.price, item.variantId.productId?.discountPercent);
        }

        // ตรวจสอบที่อยู่จัดส่ง
        const address = await CustomerAddress.findById(shippingAddressId);
        if (!address) {
            return res.status(400).json({
                success: false,
                message: 'Invalid shipping address: Address not found'
            });
        }

        if (address.customerId.toString() !== req.customer._id.toString()) {
            return res.status(400).json({
                success: false,
                message: 'Invalid shipping address: Does not belong to customer'
            });
        }

        // ตรวจสอบ Shipping Method
        const shippingMethod = await ShippingMethod.findById(shippingMethodId);
        if (!shippingMethod || !shippingMethod.isActive) {
            return res.status(400).json({
                success: false,
                message: 'Invalid shipping method'
            });
        }

        // Add shipping cost to total
        const shippingCost = shippingMethod.price;
        totalAmount += shippingCost;

        // Generate Sale Reference
        const saleReference = await generateSaleReference('ORD');

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

        // สร้าง order details (bulk insert)
        const orderDetails = await OrderDetail.insertMany(
            cartItems.map(item => {
                const pricePerUnit = applyDiscount(item.variantId.price, item.variantId.productId?.discountPercent);
                return {
                    orderId: order._id,
                    variantId: item.variantId._id,
                    quantity: item.quantity,
                    pricePerUnit,
                    subtotal: item.quantity * pricePerUnit
                };
            })
        );

        // ลดสต็อก (sequential — each must be atomic)
        for (const item of cartItems) {
            await deductStock(item.variantId._id, item.quantity, 'sale_online', order._id, 'Order', null);
        }

        // สร้าง payment record
        await Payment.create({
            orderId: order._id,
            paymentMethod,
            amountPaid: totalAmount,
            paidByCustomerId: req.customer._id
        });

        // ลบเฉพาะรายการที่สั่งซื้อ — รายการที่ไม่ได้เลือก (เช่น ของหมด) คงอยู่ในรถเข็น
        await CartItem.deleteMany({ _id: { $in: cartItems.map(item => item._id) } });

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
            .sort({ orderDate: -1 })
            .limit(50);

        const orderIds = orders.map(o => o._id);

        // Batch fetch all related data in 3 parallel queries instead of N*3
        const [allDetails, allPayments] = await Promise.all([
            OrderDetail.find({ orderId: { $in: orderIds } })
                .populate({ path: 'variantId', populate: { path: 'productId' } }),
            Payment.find({ orderId: { $in: orderIds } })
        ]);

        const productIds = [...new Set(
            allDetails.map(d => d.variantId?.productId?._id?.toString()).filter(Boolean)
        )];
        const allImages = await ProductImage.find({ productId: { $in: productIds } });

        // Build lookup maps for O(1) access
        const detailsByOrder = new Map();
        allDetails.forEach(d => {
            const key = d.orderId.toString();
            if (!detailsByOrder.has(key)) detailsByOrder.set(key, []);
            detailsByOrder.get(key).push(d);
        });

        const paymentByOrder = new Map(allPayments.map(p => [p.orderId.toString(), p]));

        const imagesByProduct = new Map();
        allImages.forEach(img => {
            const key = img.productId.toString();
            if (!imagesByProduct.has(key)) imagesByProduct.set(key, []);
            imagesByProduct.get(key).push(img);
        });

        const ordersWithDetails = orders.map(order => {
            const details = detailsByOrder.get(order._id.toString()) || [];
            const payment = paymentByOrder.get(order._id.toString());

            const formattedItems = details.map(item => {
                const product = item.variantId?.productId;
                const imgs = imagesByProduct.get(product?._id?.toString()) || [];
                const primaryImg = imgs.find(img => img.isPrimary) || imgs[0];
                return {
                    productName: product?.productName || 'Unknown Product',
                    sku: item.variantId?.sku,
                    quantity: item.quantity,
                    price: item.pricePerUnit,
                    shippingSize: product?.shippingSize || 'small',
                    imageUrl: primaryImg?.imagePath || product?.imageUrl
                };
            });

            return {
                ...order.toObject(),
                orderReference: order.saleReference || order._id.toString().slice(-6).toUpperCase(),
                createdAt: order.orderDate,
                items: formattedItems,
                paymentMethod: payment?.paymentMethod || 'Transfer',
                hasSlip: !!payment?.slipImage,
                slipVerified: !!payment?.isVerified,
            };
        });

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
        // POS orders have no customerId — deny customer tokens from accessing them
        if (req.customer) {
            if (!order.customerId || order.customerId._id.toString() !== req.customer._id.toString()) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied'
                });
            }
        }

        const [details, payments] = await Promise.all([
            OrderDetail.find({ orderId: order._id })
                .populate({ path: 'variantId', populate: { path: 'productId' } }),
            Payment.find({ orderId: order._id }),
        ]);

        const productIds = details.map(d => d.variantId?.productId?._id).filter(id => id);
        const productImages = await ProductImage.find({ productId: { $in: productIds } });

        // Build map for O(1) lookup instead of O(N) find per item
        const imagesByProduct = new Map();
        for (const img of productImages) {
            const key = img.productId.toString();
            if (!imagesByProduct.has(key)) imagesByProduct.set(key, { primary: null, any: null });
            const entry = imagesByProduct.get(key);
            if (img.isPrimary) entry.primary = img;
            else if (!entry.any) entry.any = img;
        }

        const formattedItems = details.map(item => {
            const product = item.variantId?.productId;
            const imgs = imagesByProduct.get(product?._id?.toString());
            return {
                productName: product?.productName || 'Unknown Product',
                sku: item.variantId?.sku,
                quantity: item.quantity,
                price: item.pricePerUnit,
                shippingSize: product?.shippingSize || 'small',
                imageUrl: imgs?.primary?.imagePath || imgs?.any?.imagePath || product?.imageUrl
            };
        });

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

        // Cancelled is terminal — once cancelled, stock has been restored and the
        // order must not be reopened (would let staff replay cancel→other→cancel to
        // inflate stock indefinitely).
        if (order.orderStatus === 'cancelled' && orderStatus && orderStatus !== 'cancelled') {
            return res.status(400).json({
                success: false,
                message: 'ไม่สามารถเปลี่ยนสถานะออเดอร์ที่ยกเลิกแล้วได้'
            });
        }

        // Check if cancelling and not already cancelled
        if (orderStatus === 'cancelled' && order.orderStatus !== 'cancelled') {
            const orderDetails = await OrderDetail.find({ orderId: order._id });

            // Restore stock + log movement (parallel — cancellations are staff-triggered, low concurrency risk)
            await Promise.all(orderDetails.map(item =>
                addStock(item.variantId, item.quantity, 'cancel_online', order._id, 'Order', req.user?._id || null)
            ));
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

// Thai labels for order statuses — mirrors frontend/src/lib/order-status.ts,
// kept minimal here since this is the only backend message that needs them.
const ORDER_STATUS_LABELS_TH = {
    pending: 'กำลังดำเนินการ',
    confirmed: 'ยืนยันแล้ว',
    processing: 'กำลังเตรียมสินค้า',
    shipped: 'เริ่มการจัดส่ง',
    delivered: 'จัดส่งสำเร็จ',
    cancelled: 'ยกเลิก',
    completed: 'เสร็จรับเงิน'
};

// @desc    Confirm packing via QR scan on the shipping label — only allowed
//          from 'confirmed' (prevents re-scanning an already-processing/shipped
//          box from silently reopening its status)
// @route   POST /api/orders/:id/scan-pack
// @access  Private (staff/owner)
exports.scanPackOrder = async (req, res, next) => {
    try {
        // Atomic conditional update — the 'confirmed' filter is checked and
        // written in one MongoDB operation, so two near-simultaneous scans of
        // the same box (two staff, or a double-tap) can never both win: only
        // one request's filter can still match by the time it executes.
        const order = await Order.findOneAndUpdate(
            { _id: req.params.id, orderStatus: 'confirmed' },
            { $set: { orderStatus: 'processing' } },
            { new: true }
        );

        if (!order) {
            const existing = await Order.findById(req.params.id);
            if (!existing) {
                return res.status(404).json({
                    success: false,
                    message: 'ไม่พบออเดอร์นี้'
                });
            }
            const currentLabel = ORDER_STATUS_LABELS_TH[existing.orderStatus] || existing.orderStatus;
            return res.status(400).json({
                success: false,
                message: `ออเดอร์นี้อยู่ในสถานะ "${currentLabel}" ไม่ใช่ "ยืนยันแล้ว" จึงเปลี่ยนเป็น "กำลังเตรียมสินค้า" ผ่านการสแกนไม่ได้`
            });
        }

        res.json({
            success: true,
            message: 'อัปเดตสถานะเป็น "กำลังเตรียมสินค้า" แล้ว',
            data: {
                _id: order._id,
                orderReference: order.saleReference || order._id.toString().slice(-6).toUpperCase(),
                orderStatus: order.orderStatus
            }
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
        const { page = 1, limit = 50, status, source } = req.query;

        const query = {};
        if (status) query.orderStatus = status;
        if (source) query.source = source;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [orders, total] = await Promise.all([
            Order.find(query)
                .populate('customerId')
                .populate('cashierUserId')
                .populate('shippingAddressId')
                .limit(parseInt(limit))
                .skip(skip)
                .sort({ orderDate: -1 }),
            Order.countDocuments(query),
        ]);

        // Batch-fetch all order details and payments in parallel
        const orderIds = orders.map(o => o._id);
        const [allDetails, allPayments] = await Promise.all([
            OrderDetail.find({ orderId: { $in: orderIds } })
                .populate({ path: 'variantId', populate: { path: 'productId' } }),
            Payment.find({ orderId: { $in: orderIds } })
        ]);

        const detailsByOrder = new Map();
        for (const d of allDetails) {
            const key = d.orderId.toString();
            if (!detailsByOrder.has(key)) detailsByOrder.set(key, []);
            detailsByOrder.get(key).push(d);
        }

        const paymentsByOrder = new Map();
        for (const p of allPayments) {
            const key = p.orderId.toString();
            if (!paymentsByOrder.has(key)) paymentsByOrder.set(key, []);
            paymentsByOrder.get(key).push(p);
        }

        const ordersWithItems = orders.map(order => {
            const items = detailsByOrder.get(order._id.toString()) || [];
            const payments = paymentsByOrder.get(order._id.toString()) || [];
            const payment = payments[0];
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
                customer: order.customerId,
                items: formattedItems,
                paymentMethod: payment?.paymentMethod || null,
                hasSlip: !!payment?.slipImage,
                slipVerified: !!payment?.isVerified,
                payments,
            };
        });

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

        // Resize/compress the slip — receipts need to stay legible, so a
        // higher cap/quality than product thumbnails, but still never store
        // an unprocessed multi-MB phone photo. Done before touching the DB
        // so a corrupt/unsupported image fails fast without side effects.
        let processedBuffer;
        try {
            processedBuffer = await processImage(req.file.buffer, { maxDimension: 2000, quality: 85 });
        } catch (imgError) {
            return res.status(400).json({
                success: false,
                message: 'Could not process image: ' + imgError.message
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

        const subDir = getUploadSubdir('slip');
        const uploadDir = path.join(UPLOADS_BASE, subDir);
        fs.mkdirSync(uploadDir, { recursive: true });
        const filename = `slip-${Date.now()}-${Math.round(Math.random() * 1E9)}.webp`;
        fs.writeFileSync(path.join(uploadDir, filename), processedBuffer);

        // Update payment with slip
        const slipPath = `/uploads/${subDir}/${filename}`;
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

// @desc    Cancel order by customer (only when pending + no slip)
// @route   POST /api/orders/:id/cancel
// @access  Private (customer)
exports.cancelOrderByCustomer = async (req, res, next) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ success: false, message: 'ไม่พบคำสั่งซื้อ' });
        }

        if (order.customerId.toString() !== req.customer._id.toString()) {
            return res.status(403).json({ success: false, message: 'ไม่มีสิทธิ์ยกเลิกคำสั่งซื้อนี้' });
        }

        if (order.orderStatus !== 'pending') {
            return res.status(400).json({ success: false, message: 'ยกเลิกได้เฉพาะคำสั่งซื้อที่รอดำเนินการเท่านั้น' });
        }

        // Block if slip already uploaded
        const payment = await Payment.findOne({ orderId: order._id });
        if (payment?.slipImage) {
            return res.status(400).json({ success: false, message: 'ไม่สามารถยกเลิกได้ เนื่องจากได้แนบสลิปชำระเงินแล้ว กรุณาติดต่อทีมงาน' });
        }

        // Restore stock
        const orderDetails = await OrderDetail.find({ orderId: order._id });
        await Promise.all(orderDetails.map(item =>
            addStock(item.variantId, item.quantity, 'cancel_online', order._id, 'Order', null)
        ));

        order.orderStatus = 'cancelled';
        await order.save();

        res.json({ success: true, message: 'ยกเลิกคำสั่งซื้อสำเร็จ', data: order });
    } catch (error) {
        next(error);
    }
};

