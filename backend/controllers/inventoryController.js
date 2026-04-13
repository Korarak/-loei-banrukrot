// controllers/inventoryController.js
const { ProductVariant, StockMovement } = require('../models');
const { changeStock, addStock } = require('../utils/stockUtils');

const LOW_STOCK_THRESHOLD = 5;

const TYPE_LABELS = {
    sale_pos: 'ขายหน้าร้าน',
    sale_online: 'ขายออนไลน์',
    cancel_online: 'ยกเลิกออเดอร์',
    stock_in: 'รับสินค้าเข้า',
    adjustment: 'ปรับสต็อก'
};

// @desc    Get stock movement history (paginated, filterable)
// @route   GET /api/inventory/movements
// @access  Private (staff/owner)
exports.getStockMovements = async (req, res, next) => {
    try {
        const { variantId, productId, type, startDate, endDate, page = 1, limit = 30 } = req.query;

        const query = {};
        if (variantId) query.variantId = variantId;
        if (productId) query.productId = productId;
        if (type) query.type = type;
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                query.createdAt.$lte = end;
            }
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const total = await StockMovement.countDocuments(query);

        const movements = await StockMovement.find(query)
            .populate({ path: 'variantId', select: 'sku option1Value option2Value stockAvailable' })
            .populate({ path: 'productId', select: 'productName imageUrl' })
            .populate({ path: 'performedBy', select: 'username' })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        res.json({
            success: true,
            data: movements,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get low stock alerts
// @route   GET /api/inventory/low-stock
// @access  Private (staff/owner)
exports.getLowStockAlerts = async (req, res, next) => {
    try {
        const threshold = parseInt(req.query.threshold) || LOW_STOCK_THRESHOLD;

        const variants = await ProductVariant.find({ stockAvailable: { $lte: threshold } })
            .populate({ path: 'productId', select: 'productName imageUrl isActive' })
            .sort({ stockAvailable: 1 });

        res.json({
            success: true,
            data: variants,
            threshold
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get inventory summary stats
// @route   GET /api/inventory/summary
// @access  Private (staff/owner)
exports.getInventorySummary = async (req, res, next) => {
    try {
        const threshold = LOW_STOCK_THRESHOLD;

        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const [totalVariants, outOfStock, lowStock, stockInThisMonth, adjustmentsThisMonth] = await Promise.all([
            ProductVariant.countDocuments(),
            ProductVariant.countDocuments({ stockAvailable: 0 }),
            ProductVariant.countDocuments({ stockAvailable: { $gt: 0, $lte: threshold } }),
            StockMovement.countDocuments({ type: 'stock_in', createdAt: { $gte: startOfMonth } }),
            StockMovement.countDocuments({ type: 'adjustment', createdAt: { $gte: startOfMonth } }),
        ]);

        // Total stock value (units) received this month
        const stockInVolume = await StockMovement.aggregate([
            { $match: { type: 'stock_in', createdAt: { $gte: startOfMonth } } },
            { $group: { _id: null, total: { $sum: '$quantityChange' } } }
        ]);

        res.json({
            success: true,
            data: {
                totalVariants,
                outOfStock,
                lowStock,
                stockInThisMonth,
                adjustmentsThisMonth,
                stockInVolumeThisMonth: stockInVolume[0]?.total || 0,
                threshold
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Receive stock (stock-in from supplier)
// @route   POST /api/inventory/receive
// @access  Private (staff/owner)
exports.receiveStock = async (req, res, next) => {
    try {
        const { variantId, quantity, note } = req.body;

        if (!variantId || !quantity || quantity <= 0) {
            return res.status(400).json({
                success: false,
                message: 'variantId และ quantity (> 0) เป็นข้อมูลที่จำเป็น'
            });
        }

        const { variant, movement } = await addStock(
            variantId,
            quantity,
            'stock_in',
            null,
            null,
            req.user._id,
            note || null
        );

        res.status(201).json({
            success: true,
            message: `รับสินค้าเข้าคลังสำเร็จ (${movement.stockBefore} → ${movement.stockAfter})`,
            data: { variant, movement }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Manual stock adjustment (+/-)
// @route   POST /api/inventory/adjust
// @access  Private (staff/owner)
exports.adjustStock = async (req, res, next) => {
    try {
        const { variantId, quantity, note } = req.body;

        if (!variantId || quantity === undefined || quantity === null || quantity === 0) {
            return res.status(400).json({
                success: false,
                message: 'variantId และ quantity (ไม่ใช่ 0) เป็นข้อมูลที่จำเป็น'
            });
        }

        const { variant, movement } = await changeStock(
            variantId,
            quantity, // signed
            'adjustment',
            null,
            null,
            req.user._id,
            note || null
        );

        res.status(201).json({
            success: true,
            message: `ปรับสต็อกสำเร็จ (${movement.stockBefore} → ${movement.stockAfter})`,
            data: { variant, movement }
        });
    } catch (error) {
        next(error);
    }
};
