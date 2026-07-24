const RemoteArea = require('../models/RemoteArea');

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
        const area = await RemoteArea.create(req.body);
        res.status(201).json({ success: true, data: area });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ success: false, message: 'จังหวัดนี้ถูกกำหนดเป็นพื้นที่ห่างไกลไว้แล้ว' });
        }
        next(err);
    }
};

// @desc    Update remote area
// @route   PUT /api/remote-areas/admin/:id
// @access  Private/Admin
exports.updateRemoteArea = async (req, res, next) => {
    try {
        const area = await RemoteArea.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        if (!area) {
            return res.status(404).json({ success: false, message: 'Remote area not found' });
        }

        res.status(200).json({ success: true, data: area });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ success: false, message: 'จังหวัดนี้ถูกกำหนดเป็นพื้นที่ห่างไกลไว้แล้ว' });
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
