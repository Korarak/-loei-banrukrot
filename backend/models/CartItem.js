// models/CartItem.js
const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
    cartId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Cart',
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
    }
});

// Compound unique index to prevent duplicate items in cart
cartItemSchema.index({ cartId: 1, variantId: 1 }, { unique: true });

module.exports = mongoose.model('CartItem', cartItemSchema);
