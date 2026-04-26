const Setting = require('../models/Setting');

// Keys visible to unauthenticated customers
const PUBLIC_KEYS = [
    'payment_bank_name',
    'payment_bank_account_number',
    'payment_bank_account_name',
    'store_name',
    'store_phone',
    'store_address',
];

const DEFAULT_SETTINGS = [
    { key: 'payment_bank_name', value: 'กสิกรไทย (K-Bank)', description: 'ชื่อธนาคาร' },
    { key: 'payment_bank_account_number', value: '123-4-56789-0', description: 'เลขที่บัญชีธนาคาร' },
    { key: 'payment_bank_account_name', value: 'บจก. บ้านรักรถ จ.เลย', description: 'ชื่อบัญชีธนาคาร' },
    { key: 'store_name', value: 'บ้านรักรถ', description: 'ชื่อร้าน' },
    { key: 'store_phone', value: '', description: 'เบอร์โทรร้าน' },
    { key: 'store_address', value: '', description: 'ที่อยู่ร้าน' },
];

// Seed defaults that don't exist yet
async function seedDefaults() {
    for (const def of DEFAULT_SETTINGS) {
        await Setting.findOneAndUpdate(
            { key: def.key },
            { $setOnInsert: { key: def.key, value: def.value, description: def.description } },
            { upsert: true, new: false }
        );
    }
}

// @desc  Get all settings
// @route GET /api/settings
// @access Private (staff/owner)
exports.getSettings = async (req, res, next) => {
    try {
        await seedDefaults();
        const settings = await Setting.find().sort({ key: 1 });
        res.json({ success: true, data: settings });
    } catch (error) {
        next(error);
    }
};

// @desc  Get public (non-sensitive) settings
// @route GET /api/settings/public
// @access Public
exports.getPublicSettings = async (req, res, next) => {
    try {
        await seedDefaults();
        const settings = await Setting.find({ key: { $in: PUBLIC_KEYS } });
        const map = {};
        for (const s of settings) map[s.key] = s.value;
        res.json({ success: true, data: map });
    } catch (error) {
        next(error);
    }
};

// @desc  Update a setting by key
// @route PUT /api/settings/:key
// @access Private (owner only)
exports.updateSetting = async (req, res, next) => {
    try {
        const { value } = req.body;
        if (value === undefined || value === null) {
            return res.status(400).json({ success: false, message: 'value is required' });
        }

        const setting = await Setting.findOneAndUpdate(
            { key: req.params.key },
            { value: String(value), updatedAt: new Date() },
            { new: true, upsert: true }
        );

        res.json({ success: true, data: setting });
    } catch (error) {
        next(error);
    }
};
