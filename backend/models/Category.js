// models/Category.js
const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    categoryId: {
        type: Number,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true,
        maxlength: 100
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        maxlength: 100
    },
    description: {
        type: String,
        maxlength: 500
    },
    isActive: {
        type: Boolean,
        default: true,
        required: true
    },
    imageUrl: {
        type: String,
        maxlength: 500
    },
    sortOrder: {
        type: Number,
        default: 0
    },
    dateCreated: {
        type: Date,
        default: Date.now,
        required: true
    }
});

// Indexes
// categorySchema.index({ categoryId: 1 }); // Already defined as unique
// categorySchema.index({ slug: 1 }); // Already defined as unique
categorySchema.index({ isActive: 1 });
categorySchema.index({ sortOrder: 1 });

module.exports = mongoose.model('Category', categorySchema);
