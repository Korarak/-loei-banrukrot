const express = require('express');
const router = express.Router();
const {
    getRemoteAreas,
    getAdminRemoteAreas,
    createRemoteArea,
    updateRemoteArea,
    deleteRemoteArea
} = require('../controllers/remoteAreaController');
const { authenticateToken, requireRole } = require('../middleware/auth');

router.route('/')
    .get(getRemoteAreas);

router.route('/admin')
    .get(authenticateToken('user'), requireRole('owner', 'staff'), getAdminRemoteAreas)
    .post(authenticateToken('user'), requireRole('owner', 'staff'), createRemoteArea);

router.route('/admin/:id')
    .put(authenticateToken('user'), requireRole('owner', 'staff'), updateRemoteArea)
    .delete(authenticateToken('user'), requireRole('owner', 'staff'), deleteRemoteArea);

module.exports = router;
