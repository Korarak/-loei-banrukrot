// models/OrderDetail.js
const mongoose = require('mongoose');

const orderDetailSchema = new mongoose.Schema({
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true
    },
    variantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ProductVariant',
        required: true
    },
    // Snapshot of product/variant identity at time of sale — kept even if the
    // Product/ProductVariant is later deleted, so receipts/tax records never change.
    productNameSnapshot: {
        type: String
    },
    skuSnapshot: {
        type: String
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    pricePerUnit: {
        type: Number,
        required: true,
        min: 0
    },
    subtotal: {
        type: Number,
        required: true,
        min: 0
    }
});

// Indexes
orderDetailSchema.index({ orderId: 1 });
orderDetailSchema.index({ variantId: 1 });

module.exports = mongoose.model('OrderDetail', orderDetailSchema);
