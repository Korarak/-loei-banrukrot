const ShippingMethod = require('../models/ShippingMethod');

// @desc    Get all shipping methods
// @route   GET /api/shipping-methods
// @access  Public (or Private based on needs, usually Public for checkout)
exports.getShippingMethods = async (req, res, next) => {
    try {
        const methods = await ShippingMethod.find({ isActive: true });
        res.status(200).json({ success: true, count: methods.length, data: methods });
    } catch (err) {
        next(err);
    }
};

// @desc    Get all shipping methods (Admin)
// @route   GET /api/admin/shipping-methods
// @access  Private/Admin
exports.getAdminShippingMethods = async (req, res, next) => {
    try {
        const methods = await ShippingMethod.find();
        res.status(200).json({ success: true, count: methods.length, data: methods });
    } catch (err) {
        next(err);
    }
};

// @desc    Create shipping method
// @route   POST /api/admin/shipping-methods
// @access  Private/Admin
exports.createShippingMethod = async (req, res, next) => {
    try {
        const method = await ShippingMethod.create(req.body);
        res.status(201).json({ success: true, data: method });
    } catch (err) {
        next(err);
    }
};

// @desc    Update shipping method
// @route   PUT /api/admin/shipping-methods/:id
// @access  Private/Admin
exports.updateShippingMethod = async (req, res, next) => {
    try {
        const method = await ShippingMethod.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        if (!method) {
            return res.status(404).json({ success: false, message: 'Shipping method not found' });
        }

        res.status(200).json({ success: true, data: method });
    } catch (err) {
        next(err);
    }
};

// @desc    Delete shipping method
// @route   DELETE /api/admin/shipping-methods/:id
// @access  Private/Admin
exports.deleteShippingMethod = async (req, res, next) => {
    try {
        const method = await ShippingMethod.findByIdAndDelete(req.params.id);

        if (!method) {
            return res.status(404).json({ success: false, message: 'Shipping method not found' });
        }

        res.status(200).json({ success: true, data: {} });
    } catch (err) {
        next(err);
    }
};
