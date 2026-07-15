// models/Counter.js
const mongoose = require('mongoose');

// Backs atomic, per-key sequence numbers (e.g. daily order reference counters).
const counterSchema = new mongoose.Schema({
    _id: {
        type: String,
        required: true // e.g. "ORD-20260712"
    },
    seq: {
        type: Number,
        default: 0
    }
});

module.exports = mongoose.model('Counter', counterSchema);
