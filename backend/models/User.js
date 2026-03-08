// models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        maxlength: 50
    },
    passwordHash: {
        type: String,
        required: true,
        maxlength: 255
    },
    email: {
        type: String,
        required: true,
        unique: true,
        maxlength: 100
    },
    role: {
        type: String,
        enum: ['owner', 'staff'],
        default: 'staff',
        required: true
    },
    isActive: {
        type: Boolean,
        default: true,
        required: true
    },
    dateCreated: {
        type: Date,
        default: Date.now,
        required: true
    },
    profilePicture: {
        type: String
    }
});

// Indexes
// userSchema.index({ username: 1 }); // Already defined as unique
// userSchema.index({ email: 1 }); // Already defined as unique

module.exports = mongoose.model('User', userSchema);
