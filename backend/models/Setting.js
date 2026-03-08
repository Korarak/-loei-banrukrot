const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
    key: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    value: {
        type: String,
        required: true
    },
    description: {
        type: String,
        default: ''
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update timestamp on save
settingSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Setting', settingSchema);
