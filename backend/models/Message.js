// models/Message.js
const mongoose = require('mongoose');

// Defined as its own explicit schema (not an inline `{ url: String, type: String }`
// literal) because a field literally named `type` inside an inline subdocument
// definition collides with Mongoose's reserved `type` key — Mongoose reads
// `{ url: String, type: String }` as SchemaTypeOptions (i.e. "this field's
// type is String"), not as a subdocument shape, and silently turns the whole
// array into [String] instead. Wrapping it in a real Schema sidesteps that.
const attachmentSchema = new mongoose.Schema({
    url: { type: String, required: true },
    type: { type: String, required: true }
}, { _id: false });

const messageSchema = new mongoose.Schema({
    conversationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Conversation',
        required: true
    },
    senderType: {
        type: String,
        enum: ['customer', 'staff'],
        required: true
    },
    // Sender's User or Customer id, depending on senderType. Resolved to a
    // display name in the controller (branching on senderType) rather than
    // via a Mongoose refPath — this codebase generally avoids populate().
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    body: {
        // Not required at the schema level — an image-only message has no
        // text. "at least a body or an attachment" is enforced at the
        // validator/controller layer instead.
        type: String,
        default: '',
        trim: true,
        maxlength: 2000
    },
    attachments: {
        type: [attachmentSchema],
        default: []
    },
    createdAt: {
        type: Date,
        default: Date.now,
        required: true
    }
});

// Indexes
messageSchema.index({ conversationId: 1, createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);
