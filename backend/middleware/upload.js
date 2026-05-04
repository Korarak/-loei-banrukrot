const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const storage = new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => {
        let folder = 'banrakrod/others';
        if (file.fieldname === 'image') folder = 'banrakrod/products';
        else if (file.fieldname === 'slip') folder = 'banrakrod/slips';
        else if (file.fieldname === 'profile') folder = 'banrakrod/profiles';

        return {
            folder,
            allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
            transformation: [{ quality: 'auto', fetch_format: 'auto' }],
        };
    },
});

const fileFilter = (req, file, cb) => {
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 50 * 1024 * 1024 },
});

module.exports = upload;
