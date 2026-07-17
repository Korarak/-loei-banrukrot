// models/PushSubscription.js
const mongoose = require('mongoose');

const pushSubscriptionSchema = new mongoose.Schema({
    ownerType: {
        type: String,
        enum: ['User', 'Customer'],
        required: true
    },
    ownerId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: 'ownerType'
    },
    endpoint: {
        type: String,
        required: true,
        unique: true // also serves as the natural upsert key on re-subscribe
    },
    keys: {
        p256dh: { type: String, required: true },
        auth: { type: String, required: true }
    },
    userAgent: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now,
        required: true
    }
});

// Indexes
pushSubscriptionSchema.index({ ownerType: 1, ownerId: 1 });

module.exports = mongoose.model('PushSubscription', pushSubscriptionSchema);
