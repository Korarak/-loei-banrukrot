// models/Store.js
const mongoose = require('mongoose');

const storeSchema = new mongoose.Schema({
    storeName: {
        type: String,
        required: true,
        maxlength: 100
    },
    locationAddress: {
        type: String,
        required: true,
        maxlength: 255
    },
    isActive: {
        type: Boolean,
        default: true,
        required: true
    }
});

// Indexes
storeSchema.index({ isActive: 1 });

module.exports = mongoose.model('Store', storeSchema);
