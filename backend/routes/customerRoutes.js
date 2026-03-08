const express = require('express');
const router = express.Router();
const {
    getAllCustomers,
    updateCustomer,
    deleteCustomer,
    createCustomer,
    getCustomerAddresses,
    addCustomerAddress,
    updateCustomerAddress,
    deleteCustomerAddress
} = require('../controllers/customerController');
const { authenticateToken, requireRole, checkCustomerAccess } = require('../middleware/auth');

router.use(authenticateToken());

// Get current customer profile
router.get('/me', (req, res) => {
    const profile = req.customer || req.user;
    if (!profile) {
        return res.status(404).json({ message: 'User not found' });
    }
    res.json(profile);
});

// Admin/Staff only routes
router.route('/')
    .get(requireRole('owner', 'admin', 'staff'), getAllCustomers)
    .post(requireRole('owner', 'admin', 'staff'), createCustomer);

router.route('/:id')
    .put(checkCustomerAccess, updateCustomer)
    .delete(requireRole('owner', 'admin', 'staff'), deleteCustomer);




// Routes accessible by Admin/Staff OR the Customer themselves
router.route('/:id/addresses')
    .get(checkCustomerAccess, getCustomerAddresses)
    .post(checkCustomerAccess, addCustomerAddress);

router.route('/:id/addresses/:addressId')
    .put(checkCustomerAccess, updateCustomerAddress)
    .delete(checkCustomerAccess, deleteCustomerAddress);

// Fix for delete/update address by customer:
// The route is /addresses/:addressId. We don't have :id (customerId) in params.
// We need a middleware that checks if the address belongs to the logged-in customer.
// For now, let's just fix the CREATE issue which is blocking the user.
// The user is hitting POST /api/customers/:id/addresses.

module.exports = router;
