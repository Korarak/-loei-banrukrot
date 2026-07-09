const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { processImage, generateBlurPlaceholder } = require('../utils/imageProcessing');

const upload = require('../middleware/upload');
const { UPLOADS_BASE, getUploadSubdir } = upload;

function uniqueWebpFilename(prefix) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    return `${prefix}-${uniqueSuffix}.webp`;
}

// @desc    Upload product/category image
// @route   POST /api/upload
// @access  Private (staff/owner)
router.post('/', authenticateToken('user'), requireRole('owner', 'staff'), upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Please upload a file'
            });
        }

        // Corrupt/unsupported image data that passed the mimetype check but
        // sharp can't decode is a client error (400), not a 500.
        let processedBuffer, blurDataURL;
        try {
            [processedBuffer, blurDataURL] = await Promise.all([
                processImage(req.file.buffer, { maxDimension: 1920 }),
                generateBlurPlaceholder(req.file.buffer)
            ]);
        } catch (imgError) {
            return res.status(400).json({
                success: false,
                message: 'Could not process image: ' + imgError.message
            });
        }

        const subDir = getUploadSubdir('image');
        const uploadDir = path.join(UPLOADS_BASE, subDir);
        fs.mkdirSync(uploadDir, { recursive: true });
        const filename = uniqueWebpFilename('file');
        fs.writeFileSync(path.join(uploadDir, filename), processedBuffer);

        const imagePath = `/uploads/${subDir}/${filename}`;

        res.json({
            success: true,
            message: 'File uploaded successfully',
            data: {
                imagePath,
                blurDataURL
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
router.post('/profile', authenticateToken(), upload.single('profile'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Please upload a file'
            });
        }

        let processedBuffer;
        try {
            processedBuffer = await processImage(req.file.buffer, { maxDimension: 512 });
        } catch (imgError) {
            return res.status(400).json({
                success: false,
                message: 'Could not process image: ' + imgError.message
            });
        }

        const subDir = getUploadSubdir('profile');
        const uploadDir = path.join(UPLOADS_BASE, subDir);
        fs.mkdirSync(uploadDir, { recursive: true });
        const filename = uniqueWebpFilename('file');
        fs.writeFileSync(path.join(uploadDir, filename), processedBuffer);

        const imagePath = `/uploads/${subDir}/${filename}`;

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
