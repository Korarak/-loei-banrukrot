// models/Product.js
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    productName: {
        type: String,
        required: true,
        maxlength: 255
    },
    description: {
        type: String
    },
    categoryId: {
        type: Number
    },
    brand: {
        type: String,
        maxlength: 100
    },
    imageUrl: {
        type: String,
        maxlength: 500
    },
    shippingSize: {
        type: String,
        enum: ['small', 'large'],
        default: 'small',
        required: true
    },
    isActive: {
        type: Boolean,
        default: true,
        required: true
    },
    isOnline: {
        type: Boolean,
        default: true
    },
    isPos: {
        type: Boolean,
        default: true
    },
    dateCreated: {
        type: Date,
        default: Date.now,
        required: true
    }
});

// Indexes
productSchema.index({ productName: 1 });
productSchema.index({ categoryId: 1 });
productSchema.index({ isActive: 1 });

module.exports = mongoose.model('Product', productSchema);
