// utils/stockUtils.js
// Central utility for all stock changes — ensures every change is logged in StockMovement.
const { ProductVariant, StockMovement } = require('../models');

/**
 * Change stock for a variant and log the movement.
 * @param {string} variantId
 * @param {number} delta - signed change (+10 add, -3 deduct)
 * @param {'sale_pos'|'sale_online'|'cancel_online'|'stock_in'|'adjustment'|'shopee_sale'|'shopee_sync'} type
 * @param {string|null} referenceId - orderId for sales/cancels, null for manual
 * @param {'Order'|null} referenceType
 * @param {string} performedBy - user _id
 * @param {string|null} note
 * @returns {{ variant, movement }}
 */
async function changeStock(variantId, delta, type, referenceId, referenceType, performedBy, note = null) {
    // Atomic update — returns the pre-update document so stockBefore is accurate
    const query = delta < 0
        ? { _id: variantId, stockAvailable: { $gte: -delta } }
        : { _id: variantId };

    const before = await ProductVariant.findOneAndUpdate(
        query,
        { $inc: { stockAvailable: delta } },
        { new: false }
    );

    if (!before) {
        const exists = await ProductVariant.findById(variantId);
        if (!exists) throw new Error(`Variant ${variantId} not found`);
        throw new Error(`Insufficient stock for ${exists.sku}`);
    }

    const stockBefore = before.stockAvailable;
    const updated = { ...before.toObject(), stockAvailable: stockBefore + delta };

    const stockAfter = updated.stockAvailable;

    const movement = await StockMovement.create({
        variantId,
        productId: before.productId,
        type,
        quantityChange: delta,
        stockBefore,
        stockAfter,
        referenceId: referenceId || null,
        referenceType: referenceType || null,
        note: note || null,
        performedBy
    });

    return { variant: updated, movement };
}

/**
 * Deduct stock (sale, etc.)
 */
async function deductStock(variantId, quantity, type, referenceId, referenceType, performedBy, note = null) {
    return changeStock(variantId, -Math.abs(quantity), type, referenceId, referenceType, performedBy, note);
}

/**
 * Add stock (receive, cancel restore, etc.)
 */
async function addStock(variantId, quantity, type, referenceId, referenceType, performedBy, note = null) {
    return changeStock(variantId, +Math.abs(quantity), type, referenceId, referenceType, performedBy, note);
}

module.exports = { changeStock, deductStock, addStock };
