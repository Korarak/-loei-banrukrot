// utils/stockUtils.js
// Central utility for all stock changes — ensures every change is logged in StockMovement.
const { ProductVariant, StockMovement } = require('../models');

/**
 * Change stock for a variant and log the movement.
 * @param {string} variantId
 * @param {number} delta - signed change (+10 add, -3 deduct)
 * @param {'sale_pos'|'sale_online'|'cancel_online'|'stock_in'|'adjustment'} type
 * @param {string|null} referenceId - orderId for sales/cancels, null for manual
 * @param {'Order'|null} referenceType
 * @param {string} performedBy - user _id
 * @param {string|null} note
 * @returns {{ variant, movement }}
 */
async function changeStock(variantId, delta, type, referenceId, referenceType, performedBy, note = null) {
    const variant = await ProductVariant.findById(variantId);
    if (!variant) throw new Error(`Variant ${variantId} not found`);

    const stockBefore = variant.stockAvailable;
    const stockAfter = stockBefore + delta;

    if (stockAfter < 0) throw new Error(`Insufficient stock for ${variant.sku}`);

    const updated = await ProductVariant.findByIdAndUpdate(
        variantId,
        { $inc: { stockAvailable: delta } },
        { new: true }
    );

    const movement = await StockMovement.create({
        variantId,
        productId: variant.productId,
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
