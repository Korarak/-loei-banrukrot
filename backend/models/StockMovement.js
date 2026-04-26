// models/StockMovement.js
const mongoose = require('mongoose');

const stockMovementSchema = new mongoose.Schema({
    variantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ProductVariant',
        required: true,
        index: true
    },
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
        index: true
    },
    type: {
        type: String,
        enum: ['sale_pos', 'sale_online', 'cancel_online', 'stock_in', 'adjustment', 'shopee_sale', 'shopee_sync'],
        required: true
    },
    quantityChange: {
        type: Number,
        required: true  // signed: -3 deduction, +10 receive
    },
    stockBefore: {
        type: Number,
        required: true
    },
    stockAfter: {
        type: Number,
        required: true
    },
    referenceId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null
    },
    referenceType: {
        type: String,
        enum: ['Order', 'ShopeeWebhook', null],
        default: null
    },
    note: {
        type: String,
        maxlength: 500,
        default: null
    },
    performedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null   // null for system/customer-triggered events
    }
}, {
    timestamps: true
});

stockMovementSchema.index({ createdAt: -1 });
stockMovementSchema.index({ variantId: 1, createdAt: -1 });
stockMovementSchema.index({ productId: 1, createdAt: -1 });
stockMovementSchema.index({ type: 1, createdAt: -1 });

module.exports = mongoose.model('StockMovement', stockMovementSchema);
