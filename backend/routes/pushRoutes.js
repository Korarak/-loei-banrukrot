const express = require('express');
const router = express.Router();
const pushController = require('../controllers/pushController');
const { authenticateToken } = require('../middleware/auth');
const validator = require('../middleware/validator');

router.use(authenticateToken()); // both staff and customers can subscribe

router.post('/subscribe', validator.subscribePush, pushController.subscribe);
router.post('/unsubscribe', pushController.unsubscribe);

module.exports = router;
