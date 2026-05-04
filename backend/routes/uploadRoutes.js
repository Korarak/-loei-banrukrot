const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../middleware/auth');
const upload = require('../middleware/upload');

// @route   POST /api/upload
// @access  Private (staff/owner)
router.post('/', authenticateToken('user'), requireRole('owner', 'staff'), upload.single('image'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Please upload a file' });
        }

        res.json({
            success: true,
            message: 'File uploaded successfully',
            data: { imagePath: req.file.path },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   POST /api/upload/profile
// @access  Private (Authenticated User)
router.post('/profile', authenticateToken(), upload.single('profile'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Please upload a file' });
        }

        res.json({
            success: true,
            message: 'Profile picture uploaded successfully',
            data: { imagePath: req.file.path },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
