// models/ProductImage.js
const mongoose = require('mongoose');

const productImageSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    imagePath: {
        type: String,
        required: true,
        maxlength: 500
    },
    isPrimary: {
        type: Boolean,
        default: false
    },
    sortOrder: {
        type: Number
    }
});

// Indexes
productImageSchema.index({ productId: 1 });
productImageSchema.index({ productId: 1, sortOrder: 1 });

module.exports = mongoose.model('ProductImage', productImageSchema);
