const multer = require('multer');

// Base uploads directory — anchored to this file, not process CWD
const path = require('path');
const UPLOADS_BASE = path.join(__dirname, '..', 'public', 'uploads');

// Determine destination subdir based on field name — files are no longer
// written to disk by multer itself (see memoryStorage below); each route
// processes the buffer with sharp first, so it looks this up manually.
function getUploadSubdir(fieldname) {
    if (fieldname === 'image') return 'products'; // Product/category images
    if (fieldname === 'slip') return 'slips';
    if (fieldname === 'profile') return 'profiles';
    return 'others';
}

const ALLOWED_MIMETYPES = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);
const ALLOWED_EXT = /\.(jpg|jpeg|png|gif|webp)$/i;

// Check both MIME type and extension to prevent extension-spoofing bypass
const fileFilter = (req, file, cb) => {
    if (!ALLOWED_MIMETYPES.has(file.mimetype) || !ALLOWED_EXT.test(file.originalname)) {
        return cb(new Error('Only image files are allowed (jpg, jpeg, png, gif, webp)'), false);
    }
    cb(null, true);
};

// Memory storage — every upload is resized/compressed via sharp (see
// utils/imageProcessing.js) before being written to disk, so multer never
// writes the raw, unprocessed original itself.
const upload = multer({
    storage: multer.memoryStorage(),
    fileFilter: fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

module.exports = upload;
module.exports.UPLOADS_BASE = UPLOADS_BASE;
module.exports.getUploadSubdir = getUploadSubdir;
