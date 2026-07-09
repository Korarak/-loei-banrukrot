const multer = require('multer');

const ALLOWED_MIMETYPES = new Set(['text/csv', 'application/vnd.ms-excel', 'application/csv']);
const ALLOWED_EXT = /\.csv$/i;

// Check both MIME type and extension to prevent extension-spoofing bypass
const fileFilter = (req, file, cb) => {
    if (!ALLOWED_MIMETYPES.has(file.mimetype) || !ALLOWED_EXT.test(file.originalname)) {
        return cb(new Error('Only CSV files are allowed'), false);
    }
    cb(null, true);
};

// Memory storage — the CSV is parsed once from the buffer, never persisted to disk
const uploadCsv = multer({
    storage: multer.memoryStorage(),
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

module.exports = uploadCsv;
