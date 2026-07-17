// controllers/pushController.js
const { PushSubscription } = require('../models');

// @desc    Subscribe the current device to push notifications
// @route   POST /api/push/subscribe
// @access  Private (staff or customer)
exports.subscribe = async (req, res, next) => {
    try {
        const { endpoint, keys } = req.body;
        // ownerType/ownerId are derived server-side from the JWT, never client-sent,
        // so a subscription can't be registered against someone else's account.
        const ownerType = req.user ? 'User' : 'Customer';
        const ownerId = req.user ? req.user._id : req.customer._id;

        await PushSubscription.findOneAndUpdate(
            { endpoint },
            { ownerType, ownerId, keys, userAgent: req.headers['user-agent'] },
            { upsert: true, new: true, runValidators: true }
        );

        res.status(201).json({ success: true, message: 'Subscribed' });
    } catch (error) {
        next(error);
    }
};

// @desc    Unsubscribe a device from push notifications
// @route   POST /api/push/unsubscribe
// @access  Private (staff or customer)
exports.unsubscribe = async (req, res, next) => {
    try {
        const { endpoint } = req.body;
        await PushSubscription.deleteOne({ endpoint });
        res.json({ success: true, message: 'Unsubscribed' });
    } catch (error) {
        next(error);
    }
};
