// models/Order.js
const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        default: null // NULL for POS walk-in customers
    },
    shippingAddressId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CustomerAddress',
        default: null // NULL for POS orders
    },
    shippingMethodId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ShippingMethod',
        default: null
    },
    storeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Store',
        default: null // NULL if not using multiple stores
    },
    cashierUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null // Staff who processed the order (for POS)
    },
    source: {
        type: String,
        enum: ['online', 'pos'],
        required: true
    },
    saleReference: {
        type: String,
        unique: true,
        sparse: true, // Allows multiple null values
        maxlength: 50
    },
    orderDate: {
        type: Date,
        default: Date.now,
        required: true
    },
    totalAmount: {
        type: Number,
        required: true,
        min: 0
    },
    orderStatus: {
        type: String,
        required: true,
        maxlength: 50
    },
    shippingInfo: {
        provider: { type: String, default: '' },
        trackingNumber: { type: String, default: '' },
        cost: { type: Number, default: 0 }
    }
});

// Indexes
orderSchema.index({ customerId: 1 });
orderSchema.index({ orderDate: -1 });
orderSchema.index({ source: 1 });
orderSchema.index({ orderStatus: 1 });
// orderSchema.index({ saleReference: 1 }); // Already defined as unique

module.exports = mongoose.model('Order', orderSchema);
