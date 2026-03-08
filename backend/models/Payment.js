// models/Payment.js
const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true
    },
    paymentMethod: {
        type: String,
        enum: ['Cash', 'Card', 'Transfer', 'QR', 'ShopeePay', 'Other'],
        required: true
    },
    amountPaid: {
        type: Number,
        required: true,
        min: 0
    },
    transactionDate: {
        type: Date,
        default: Date.now,
        required: true
    },
    referenceNo: {
        type: String,
        maxlength: 100
    },
    paidByCustomerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        default: null
    },
    slipImage: {
        type: String,
        default: null
    },
    isVerified: {
        type: Boolean,
        default: false
    }
});

// Indexes
paymentSchema.index({ orderId: 1 });
paymentSchema.index({ transactionDate: -1 });
paymentSchema.index({ paymentMethod: 1 });

module.exports = mongoose.model('Payment', paymentSchema);
