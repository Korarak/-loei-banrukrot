const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        let uploadDir = 'public/uploads/others';

        // Determine folder based on field name or route
        if (file.fieldname === 'image') { // Product images usually
            uploadDir = 'public/uploads/products';
        } else if (file.fieldname === 'slip') {
            uploadDir = 'public/uploads/slips';
        } else if (file.fieldname === 'profile') {
            uploadDir = 'public/uploads/profiles';
        }

        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Create unique filename: type-timestamp-random.ext
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const prefix = file.fieldname === 'slip' ? 'slip' : 'file';
        cb(null, prefix + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const ALLOWED_MIMETYPES = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);
const ALLOWED_EXT = /\.(jpg|jpeg|png|gif|webp)$/i;

// Check both MIME type and extension to prevent extension-spoofing bypass
const fileFilter = (req, file, cb) => {
    if (!ALLOWED_MIMETYPES.has(file.mimetype) || !ALLOWED_EXT.test(file.originalname)) {
        return cb(new Error('Only image files are allowed (jpg, jpeg, png, gif, webp)'), false);
    }
    cb(null, true);
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

module.exports = upload;
