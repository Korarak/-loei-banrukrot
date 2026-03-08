// models/Customer.js
const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
        maxlength: 100
    },
    lastName: {
        type: String,
        required: true,
        maxlength: 100
    },
    email: {
        type: String,
        required: true,
        unique: true,
        maxlength: 100
    },
    passwordHash: {
        type: String,
        required: false, // Not required for social login
        maxlength: 255
    },
    phone: {
        type: String,
        maxlength: 20
    },
    dateRegistered: {
        type: Date,
        default: Date.now,
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    provider: {
        type: String,
        enum: ['local', 'google', 'line'],
        default: 'local'
    },
    providerId: {
        type: String
    },
    profilePicture: {
        type: String
    }
});

// Indexes
// customerSchema.index({ email: 1 }); // Already defined as unique
customerSchema.index({ phone: 1 });

module.exports = mongoose.model('Customer', customerSchema);
