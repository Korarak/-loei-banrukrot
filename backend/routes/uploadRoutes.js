const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticateToken, requireRole } = require('../middleware/auth');

const upload = require('../middleware/upload');

// @desc    Upload product image
// @route   POST /api/upload
// @access  Private (staff/owner)
router.post('/', authenticateToken('user'), requireRole('owner', 'staff'), upload.single('image'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Please upload a file'
            });
        }

        // Return the path relative to the server
        // Assuming server serves 'public' folder as static
        const imagePath = `/uploads/products/${req.file.filename}`;

        res.json({
            success: true,
            message: 'File uploaded successfully',
            data: {
                imagePath
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// @desc    Upload profile picture
// @route   POST /api/upload/profile
// @access  Private (Authenticated User)
router.post('/profile', authenticateToken(), upload.single('profile'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Please upload a file'
            });
        }

        const imagePath = `/uploads/profiles/${req.file.filename}`;

        res.json({
            success: true,
            message: 'Profile picture uploaded successfully',
            data: {
                imagePath
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;
