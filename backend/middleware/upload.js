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

// File filter
const fileFilter = (req, file, cb) => {
    // Accept images only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

module.exports = upload;
