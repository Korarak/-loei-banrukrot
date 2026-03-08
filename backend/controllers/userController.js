const { User } = require('../models');
const bcrypt = require('bcryptjs');

// @desc    Get current user (me)
// @route   GET /api/users/me
// @access  Private
exports.getMe = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id).select('-passwordHash');
        res.json({
            success: true,
            data: user
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update current user (me)
// @route   PUT /api/users/me
// @access  Private
exports.updateMe = async (req, res, next) => {
    try {
        const { username, email, password, profilePicture } = req.body;
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        if (username) user.username = username;
        if (email) user.email = email;
        if (profilePicture) user.profilePicture = profilePicture;

        if (password) {
            const salt = await bcrypt.genSalt(10);
            user.passwordHash = await bcrypt.hash(password, salt);
        }

        await user.save();

        res.json({
            success: true,
            data: {
                _id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                isActive: user.isActive,
                profilePicture: user.profilePicture
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
exports.getAllUsers = async (req, res, next) => {
    try {
        const users = await User.find().select('-passwordHash');
        res.json({
            success: true,
            count: users.length,
            data: users
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Create new user
// @route   POST /api/users
// @access  Private/Owner
exports.createUser = async (req, res, next) => {
    try {
        const { username, email, password, role, isActive } = req.body;

        // Check if user exists
        const userExists = await User.findOne({ $or: [{ email }, { username }] });
        if (userExists) {
            return res.status(400).json({
                success: false,
                message: 'User already exists'
            });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const user = await User.create({
            username,
            email,
            passwordHash,
            role: role || 'staff',
            isActive: isActive !== undefined ? isActive : true
        });

        res.status(201).json({
            success: true,
            data: {
                _id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                isActive: user.isActive
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin
exports.updateUser = async (req, res, next) => {
    try {
        const { username, email, role, isActive, password } = req.body;
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        user.username = username || user.username;
        user.email = email || user.email;
        user.role = role || user.role;
        if (typeof isActive !== 'undefined') user.isActive = isActive;

        if (password) {
            const salt = await bcrypt.genSalt(10);
            user.passwordHash = await bcrypt.hash(password, salt);
        }

        await user.save();

        res.json({
            success: true,
            data: {
                _id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                isActive: user.isActive
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        await user.deleteOne();

        res.json({
            success: true,
            data: {}
        });
    } catch (error) {
        next(error);
    }
};
