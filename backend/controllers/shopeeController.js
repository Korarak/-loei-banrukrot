// controllers/shopeeController.js
const crypto = require('crypto');
const { ProductVariant } = require('../models');
const { deductStock, addStock } = require('../utils/stockUtils');

const PARTNER_KEY = process.env.SHOPEE_PARTNER_KEY;
const PARTNER_ID = process.env.SHOPEE_PARTNER_ID;

// Shopee signature: HMAC-SHA256(partner_key, partner_id + url + timestamp + rawBody)
function verifyShopeeSignature(req) {
    if (!PARTNER_KEY || !PARTNER_ID) {
        console.warn('[Shopee] SHOPEE_PARTNER_KEY/SHOPEE_PARTNER_ID not set — skipping signature verification');
        return true;
    }
    const signature = req.headers['authorization'];
    if (!signature) return false;
    const timestamp = req.body?.timestamp ?? '';
    const rawBody = req.rawBody?.toString('utf8') ?? JSON.stringify(req.body);
    const url = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
    const expected = crypto
        .createHmac('sha256', PARTNER_KEY)
        .update(`${PARTNER_ID}${url}${timestamp}${rawBody}`)
        .digest('hex');
    return signature === expected;
}

// @route   GET /api/shopee/status
// @access  Private (owner/staff)
exports.getStatus = (req, res) => {
    const configured = !!(PARTNER_KEY && PARTNER_ID && process.env.SHOPEE_SHOP_ID);
    res.json({
        success: true,
        data: {
            configured,
            partnerId: PARTNER_ID || null,
            shopId: process.env.SHOPEE_SHOP_ID || null,
        }
    });
};

// @route   GET /api/shopee/mapping
// @access  Private (owner/staff)
exports.getMapping = async (req, res, next) => {
    try {
        const { page = 1, limit = 30, mapped } = req.query;
        const query = {};
        if (mapped === 'true') query.shopeeItemId = { $ne: null };
        if (mapped === 'false') query.$or = [{ shopeeItemId: null }, { shopeeItemId: { $exists: false } }];

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const [variants, total] = await Promise.all([
            ProductVariant.find(query)
                .populate({ path: 'productId', select: 'productName imageUrl' })
                .sort({ updatedAt: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            ProductVariant.countDocuments(query)
        ]);

        res.json({
            success: true,
            data: variants,
            pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) }
        });
    } catch (error) {
        next(error);
    }
};

// @route   PATCH /api/shopee/mapping/:variantId
// @access  Private (owner/staff)
exports.updateMapping = async (req, res, next) => {
    try {
        const { variantId } = req.params;
        const { shopeeItemId, shopeeModelId } = req.body;

        if (!shopeeItemId) {
            return res.status(400).json({ success: false, message: 'shopeeItemId จำเป็นต้องระบุ' });
        }

        const variant = await ProductVariant.findByIdAndUpdate(
            variantId,
            { shopeeItemId: String(shopeeItemId), shopeeModelId: shopeeModelId ? String(shopeeModelId) : null },
            { new: true }
        ).populate({ path: 'productId', select: 'productName' });

        if (!variant) return res.status(404).json({ success: false, message: 'ไม่พบ variant' });

        res.json({ success: true, message: 'บันทึก Shopee mapping สำเร็จ', data: variant });
    } catch (error) {
        next(error);
    }
};

// @route   DELETE /api/shopee/mapping/:variantId
// @access  Private (owner/staff)
exports.removeMapping = async (req, res, next) => {
    try {
        const { variantId } = req.params;
        const variant = await ProductVariant.findByIdAndUpdate(
            variantId,
            { shopeeItemId: null, shopeeModelId: null },
            { new: true }
        );
        if (!variant) return res.status(404).json({ success: false, message: 'ไม่พบ variant' });
        res.json({ success: true, message: 'ลบ Shopee mapping สำเร็จ' });
    } catch (error) {
        next(error);
    }
};

// @route   POST /api/shopee/webhook
// @access  Public (called by Shopee server, verified via HMAC)
exports.webhookHandler = async (req, res) => {
    try {
        if (!verifyShopeeSignature(req)) {
            return res.status(401).json({ success: false, message: 'Invalid signature' });
        }

        const { code, data, shop_id, timestamp } = req.body;
        console.log(`[Shopee Webhook] code=${code} shop_id=${shop_id} ts=${timestamp}`);

        // code 3 = order status update
        if (code === 3 && data?.ordersn) {
            await handleOrderStatusEvent(data);
        }

        // Always respond 200 quickly to prevent Shopee retries
        res.json({ success: true });
    } catch (error) {
        console.error('[Shopee Webhook] Error:', error.message);
        res.json({ success: false });
    }
};

// Shopee webhook only sends ordersn + status.
// Full item details require a follow-up call to Order Detail API (needs access_token).
// When SHOPEE_PARTNER_KEY is configured and access_token flow is implemented,
// replace this stub with an actual API call to get item quantities.
async function handleOrderStatusEvent(data) {
    const { ordersn, status } = data;

    if (!['READY_TO_SHIP', 'SHIPPED', 'CANCELLED'].includes(status)) return;

    // TODO: call GET /api/v2/order/get_order_detail to fetch item list
    // then match each item.model_id / item.item_id to ProductVariant.shopeeModelId / shopeeItemId
    // and call deductStock / addStock accordingly
    console.log(`[Shopee Webhook] Order ${ordersn} status=${status} — stock adjustment pending API credentials`);
}
