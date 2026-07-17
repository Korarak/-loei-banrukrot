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
        // Comma-separated list of brand names, e.g. "SIP, PIAGGIO" — 255 leaves
        // room for several names concatenated together.
        maxlength: 255
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
    discountPercent: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
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
productSchema.index({ categoryId: 1, isActive: 1 }); // Covers category-filtered product listings
productSchema.index({ isOnline: 1, isActive: 1 });
productSchema.index({ isPos: 1, isActive: 1 });

module.exports = mongoose.model('Product', productSchema);
