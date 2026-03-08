const express = require('express');
const router = express.Router();
const { getAllUsers, createUser, updateUser, deleteUser, getMe, updateMe } = require('../controllers/userController');
const { authenticateToken, requireRole } = require('../middleware/auth');

router.use(authenticateToken('user'));

// Public to authenticated users (Staff/Owner)
router.route('/me')
    .get(getMe)
    .put(updateMe);

// Owner only routes
router.use(requireRole('owner'));

router.route('/')
    .get(getAllUsers)
    .post(createUser);

router.route('/:id')
    .put(updateUser)
    .delete(deleteUser);

module.exports = router;
