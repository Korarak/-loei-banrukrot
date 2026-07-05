const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Base uploads directory — anchored to this file, not process CWD
const UPLOADS_BASE = path.join(__dirname, '..', 'public', 'uploads');

// Configure storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        let subDir = 'others';

        // Determine folder based on field name or route
        if (file.fieldname === 'image') { // Product images usually
            subDir = 'products';
        } else if (file.fieldname === 'slip') {
            subDir = 'slips';
        } else if (file.fieldname === 'profile') {
            subDir = 'profiles';
        }

        const uploadDir = path.join(UPLOADS_BASE, subDir);

        // mkdir failure (e.g. EACCES on bind mount) must fail this request,
        // not crash the process
        try {
            fs.mkdirSync(uploadDir, { recursive: true });
            cb(null, uploadDir);
        } catch (err) {
            cb(err);
        }
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
