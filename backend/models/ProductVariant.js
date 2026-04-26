// models/ProductVariant.js
const mongoose = require('mongoose');

const productVariantSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    sku: {
        type: String,
        required: true,
        unique: true,
        maxlength: 100
    },
    option1Value: {
        type: String,
        maxlength: 100
    },
    option2Value: {
        type: String,
        maxlength: 100
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    stockAvailable: {
        type: Number,
        required: true,
        min: 0,
        default: 0
    },
    shopeeItemId: {
        type: String,
        default: null,
        index: true
    },
    shopeeModelId: {
        type: String,
        default: null
    }
});

// Indexes
productVariantSchema.index({ productId: 1 });
// productVariantSchema.index({ sku: 1 }); // Already defined as unique
productVariantSchema.index({ productId: 1, stockAvailable: 1 });

module.exports = mongoose.model('ProductVariant', productVariantSchema);
