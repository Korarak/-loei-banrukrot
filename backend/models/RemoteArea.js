const mongoose = require('mongoose');
const { THAI_PROVINCES } = require('../utils/thaiProvinces');

const remoteAreaSchema = new mongoose.Schema({
    province: {
        type: String,
        required: true,
        trim: true,
        unique: true,
        enum: THAI_PROVINCES
    },
    extraCost: {
        type: Number,
        required: true,
        min: 0
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

remoteAreaSchema.index({ isActive: 1 });

module.exports = mongoose.model('RemoteArea', remoteAreaSchema);
