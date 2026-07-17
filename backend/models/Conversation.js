// models/Conversation.js
const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        required: true,
        unique: true // one open conversation per customer — no per-topic threads for MVP
    },
    status: {
        type: String,
        enum: ['open', 'closed'],
        default: 'open',
        required: true
    },
    lastMessageAt: {
        type: Date
    },
    lastMessagePreview: {
        type: String,
        maxlength: 200
    },
    lastMessageSenderType: {
        type: String,
        enum: ['customer', 'staff']
    },
    lastReadByCustomerAt: {
        type: Date,
        default: Date.now
    },
    lastReadByStaffAt: {
        type: Date,
        default: null // null = no staff member has ever opened this conversation
    },
    createdAt: {
        type: Date,
        default: Date.now,
        required: true
    }
});

// Indexes
conversationSchema.index({ lastMessageAt: -1 });
conversationSchema.index({ status: 1, lastMessageAt: -1 });

module.exports = mongoose.model('Conversation', conversationSchema);
