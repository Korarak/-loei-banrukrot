// models/Cart.js
const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        required: true,
        unique: true
    },
    dateCreated: {
        type: Date,
        default: Date.now,
        required: true
    },
    lastUpdated: {
        type: Date,
        default: Date.now,
        required: true
    }
});

// Update lastUpdated on save
cartSchema.pre('save', function (next) {
    this.lastUpdated = Date.now();
    next();
});

// Indexes
// cartSchema.index({ customerId: 1 }); // Already defined as unique

module.exports = mongoose.model('Cart', cartSchema);
