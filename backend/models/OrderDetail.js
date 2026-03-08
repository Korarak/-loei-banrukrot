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
