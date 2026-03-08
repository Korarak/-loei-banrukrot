// models/CustomerAddress.js
const mongoose = require('mongoose');

const customerAddressSchema = new mongoose.Schema({
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        required: true
    },
    addressLabel: {
        type: String,
        maxlength: 100
    },
    recipientName: {
        type: String,
        required: true,
        maxlength: 255
    },
    streetAddress: {
        type: String,
        required: true,
        maxlength: 255
    },
    subDistrict: {
        type: String,
        maxlength: 100
    },
    district: {
        type: String,
        required: true,
        maxlength: 100
    },
    province: {
        type: String,
        required: true,
        maxlength: 100
    },
    zipCode: {
        type: String,
        required: true,
        maxlength: 10
    },
    isDefault: {
        type: Boolean,
        default: false
    }
});

// Indexes
customerAddressSchema.index({ customerId: 1 });
customerAddressSchema.index({ customerId: 1, isDefault: 1 });

module.exports = mongoose.model('CustomerAddress', customerAddressSchema);
