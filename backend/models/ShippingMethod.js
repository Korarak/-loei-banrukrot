const mongoose = require('mongoose');

const shippingMethodSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    description: {
        type: String,
        trim: true,
        maxlength: 500
    },
    supportedSizes: {
        type: [String],
        enum: ['small', 'large'],
        default: ['small'],
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('ShippingMethod', shippingMethodSchema);
