const RemoteArea = require('../models/RemoteArea');
const { THAI_DISTRICTS_BY_PROVINCE } = require('../utils/thaiDistricts');

// อำเภอ (ถ้าระบุ) ต้องมีอยู่จริงในจังหวัดนั้น
const isValidDistrict = (province, district) => {
    if (!district) return true;
    return THAI_DISTRICTS_BY_PROVINCE[province]?.includes(district) ?? false;
};

// @desc    Get all active remote areas
// @route   GET /api/remote-areas
// @access  Public (used by checkout to display surcharge)
exports.getRemoteAreas = async (req, res, next) => {
    try {
        const areas = await RemoteArea.find({ isActive: true });
        res.status(200).json({ success: true, count: areas.length, data: areas });
    } catch (err) {
        next(err);
    }
};

// @desc    Get all remote areas (Admin)
// @route   GET /api/remote-areas/admin
// @access  Private/Admin
exports.getAdminRemoteAreas = async (req, res, next) => {
    try {
        const areas = await RemoteArea.find();
        res.status(200).json({ success: true, count: areas.length, data: areas });
    } catch (err) {
        next(err);
    }
};

// @desc    Create remote area
// @route   POST /api/remote-areas/admin
// @access  Private/Admin
exports.createRemoteArea = async (req, res, next) => {
    try {
        const district = req.body.district?.trim() || null;
        if (!isValidDistrict(req.body.province, district)) {
            return res.status(400).json({ success: false, message: `"${district}" ไม่ใช่อำเภอในจังหวัด "${req.body.province}"` });
        }
        const area = await RemoteArea.create({ ...req.body, district });
        res.status(201).json({ success: true, data: area });
    } catch (err) {
        if (err.code === 11000) {
            const message = req.body.district
                ? `อำเภอ "${req.body.district}" ในจังหวัดนี้ถูกกำหนดเป็นพื้นที่ห่างไกลไว้แล้ว`
                : 'จังหวัดนี้ถูกกำหนดเป็นพื้นที่ห่างไกลไว้แล้ว (แบบไม่ระบุอำเภอ)';
            return res.status(400).json({ success: false, message });
        }
        next(err);
    }
};

// @desc    Update remote area
// @route   PUT /api/remote-areas/admin/:id
// @access  Private/Admin
exports.updateRemoteArea = async (req, res, next) => {
    try {
        const existing = await RemoteArea.findById(req.params.id);
        if (!existing) {
            return res.status(404).json({ success: false, message: 'Remote area not found' });
        }

        const province = req.body.province ?? existing.province;
        const district = req.body.district?.trim() || null;
        if (!isValidDistrict(province, district)) {
            return res.status(400).json({ success: false, message: `"${district}" ไม่ใช่อำเภอในจังหวัด "${province}"` });
        }

        const area = await RemoteArea.findByIdAndUpdate(
            req.params.id,
            { ...req.body, district },
            { new: true, runValidators: true }
        );

        if (!area) {
            return res.status(404).json({ success: false, message: 'Remote area not found' });
        }

        res.status(200).json({ success: true, data: area });
    } catch (err) {
        if (err.code === 11000) {
            const message = req.body.district
                ? `อำเภอ "${req.body.district}" ในจังหวัดนี้ถูกกำหนดเป็นพื้นที่ห่างไกลไว้แล้ว`
                : 'จังหวัดนี้ถูกกำหนดเป็นพื้นที่ห่างไกลไว้แล้ว (แบบไม่ระบุอำเภอ)';
            return res.status(400).json({ success: false, message });
        }
        next(err);
    }
};

// @desc    Delete remote area
// @route   DELETE /api/remote-areas/admin/:id
// @access  Private/Admin
exports.deleteRemoteArea = async (req, res, next) => {
    try {
        const area = await RemoteArea.findByIdAndDelete(req.params.id);

        if (!area) {
            return res.status(404).json({ success: false, message: 'Remote area not found' });
        }

        res.status(200).json({ success: true, data: {} });
    } catch (err) {
        next(err);
    }
};
