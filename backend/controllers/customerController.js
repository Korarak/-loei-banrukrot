const { Customer, CustomerAddress } = require('../models');
const bcrypt = require('bcryptjs');

// @desc    Get all customers
// @route   GET /api/customers
// @access  Private/Admin
exports.getAllCustomers = async (req, res, next) => {
    try {
        const customers = await Customer.find().select('-passwordHash');
        res.json({
            success: true,
            count: customers.length,
            data: customers
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Create new customer
// @route   POST /api/customers
// @access  Private/Admin
exports.createCustomer = async (req, res, next) => {
    try {
        const { firstName, lastName, email, password, phone, isActive } = req.body;

        // Check if customer exists
        const customerExists = await Customer.findOne({ email });
        if (customerExists) {
            return res.status(400).json({
                success: false,
                message: 'Customer already exists'
            });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const customer = await Customer.create({
            firstName,
            lastName,
            email,
            passwordHash,
            phone,
            isActive: isActive !== undefined ? isActive : true
        });

        res.status(201).json({
            success: true,
            data: {
                _id: customer._id,
                firstName: customer.firstName,
                lastName: customer.lastName,
                email: customer.email,
                phone: customer.phone,
                isActive: customer.isActive
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update customer
// @route   PUT /api/customers/:id
// @access  Private/Admin
exports.updateCustomer = async (req, res, next) => {
    try {
        console.log('updateCustomer req.body:', req.body);
        const { firstName, lastName, email, phone, isActive, password, profilePicture } = req.body;
        const customer = await Customer.findById(req.params.id);

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Customer not found'
            });
        }

        customer.firstName = firstName || customer.firstName;
        customer.lastName = lastName || customer.lastName;
        customer.email = email || customer.email;
        if (phone !== undefined) customer.phone = phone;
        if (typeof isActive !== 'undefined') customer.isActive = isActive;
        if (profilePicture) customer.profilePicture = profilePicture;

        if (password) {
            const salt = await bcrypt.genSalt(10);
            customer.passwordHash = await bcrypt.hash(password, salt);
        }

        await customer.save();

        res.json({
            success: true,
            data: {
                _id: customer._id,
                firstName: customer.firstName,
                lastName: customer.lastName,
                email: customer.email,
                phone: customer.phone,
                isActive: customer.isActive,
                profilePicture: customer.profilePicture
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete customer
// @route   DELETE /api/customers/:id
// @access  Private/Admin
exports.deleteCustomer = async (req, res, next) => {
    try {
        const customer = await Customer.findById(req.params.id);

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Customer not found'
            });
        }

        await customer.deleteOne();

        res.json({
            success: true,
            data: {}
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get customer addresses
// @route   GET /api/customers/:id/addresses
// @access  Private/Admin
exports.getCustomerAddresses = async (req, res, next) => {
    try {
        const addresses = await CustomerAddress.find({ customerId: req.params.id });
        res.json({
            success: true,
            count: addresses.length,
            data: addresses
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Add customer address
// @route   POST /api/customers/:id/addresses
// @access  Private/Admin
exports.addCustomerAddress = async (req, res, next) => {
    try {
        const { addressLabel, recipientName, phone, streetAddress, subDistrict, district, province, zipCode, isDefault } = req.body;

        // If set as default, unset other default addresses for this customer
        if (isDefault) {
            await CustomerAddress.updateMany(
                { customerId: req.params.id },
                { isDefault: false }
            );
        }

        const address = await CustomerAddress.create({
            customerId: req.params.id,
            addressLabel,
            recipientName,
            phone,
            streetAddress,
            subDistrict,
            district,
            province,
            zipCode,
            isDefault: isDefault || false
        });

        res.status(201).json({
            success: true,
            data: address
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update customer address
// @route   PUT /api/customers/addresses/:addressId
// @access  Private/Admin
exports.updateCustomerAddress = async (req, res, next) => {
    try {
        const { addressLabel, recipientName, phone, streetAddress, subDistrict, district, province, zipCode, isDefault } = req.body;
        const address = await CustomerAddress.findById(req.params.addressId);

        if (!address) {
            return res.status(404).json({
                success: false,
                message: 'Address not found'
            });
        }

        // If set as default, unset other default addresses for this customer
        if (isDefault) {
            await CustomerAddress.updateMany(
                { customerId: address.customerId },
                { isDefault: false }
            );
        }

        address.addressLabel = addressLabel || address.addressLabel;
        address.recipientName = recipientName || address.recipientName;
        address.phone = phone || address.phone;
        address.streetAddress = streetAddress || address.streetAddress;
        address.subDistrict = subDistrict || address.subDistrict;
        address.district = district || address.district;
        address.province = province || address.province;
        address.zipCode = zipCode || address.zipCode;
        if (typeof isDefault !== 'undefined') address.isDefault = isDefault;

        await address.save();

        res.json({
            success: true,
            data: address
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete customer address
// @route   DELETE /api/customers/addresses/:addressId
// @access  Private/Admin
exports.deleteCustomerAddress = async (req, res, next) => {
    try {
        const address = await CustomerAddress.findById(req.params.addressId);

        if (!address) {
            return res.status(404).json({
                success: false,
                message: 'Address not found'
            });
        }

        await address.deleteOne();

        res.json({
            success: true,
            data: {}
        });
    } catch (error) {
        next(error);
    }
};
