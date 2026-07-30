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
    // ยืนยันอีเมลแบบ soft — ไม่ยืนยันก็ยังสั่งซื้อได้ตามปกติ มีแค่แบนเนอร์เตือนบนหน้าร้าน
    // บัญชีที่มาจาก Google ถือว่ายืนยันแล้ว (Google ยืนยันอีเมลให้อยู่แล้ว)
    emailVerified: {
        type: Boolean,
        default: false
    },
    // เก็บเฉพาะ SHA-256 ของ token — ถ้า DB หลุด token ที่ยังไม่หมดอายุจะเอาไปใช้ไม่ได้
    emailVerificationTokenHash: {
        type: String,
        select: false
    },
    emailVerificationExpires: {
        type: Date,
        select: false
    },
    passwordResetTokenHash: {
        type: String,
        select: false
    },
    passwordResetExpires: {
        type: Date,
        select: false
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
