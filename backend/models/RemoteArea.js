const mongoose = require('mongoose');
const { THAI_PROVINCES } = require('../utils/thaiProvinces');

const remoteAreaSchema = new mongoose.Schema({
    province: {
        type: String,
        required: true,
        trim: true,
        enum: THAI_PROVINCES
    },
    // Optional — Kerry/ไปรษณีย์ mark some provinces remote only in specific
    // อำเภอ. Left blank, the entry applies as a whole-province default;
    // order matching prefers a district-specific match over the blank one.
    district: {
        type: String,
        trim: true,
        default: null,
        maxlength: 100
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
// One rule per (province, district) — district: null covers the whole province.
remoteAreaSchema.index({ province: 1, district: 1 }, { unique: true });

module.exports = mongoose.model('RemoteArea', remoteAreaSchema);
