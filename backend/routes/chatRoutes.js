const express = require('express');
const router = express.Router();
const { rateLimit, ipKeyGenerator } = require('express-rate-limit');
const chatController = require('../controllers/chatController');
const { authenticateToken, requireRole, checkConversationAccess } = require('../middleware/auth');
const validator = require('../middleware/validator');
const upload = require('../middleware/upload');

router.use(authenticateToken()); // both staff and customers use this router

// The app-wide limiter (app.js, 500 req/10min per IP) is too generous to stop
// message spam specifically, and is IP-keyed rather than per-account. This
// mirrors the socket.io send handler's own limit (chatSocket.js) so both
// paths to sending a message are covered equally.
const sendMessageLimiter = rateLimit({
    windowMs: 10_000,
    max: 15,
    keyGenerator: (req) => (req.customer?._id || req.user?._id)?.toString() || ipKeyGenerator(req.ip),
    message: { success: false, message: 'ส่งข้อความเร็วเกินไป กรุณารอสักครู่' },
    standardHeaders: true,
    legacyHeaders: false
});

router.get('/conversations', requireRole('owner', 'staff'), chatController.getConversations);
router.get('/conversations/me', chatController.getOrCreateMyConversation);

router.get('/conversations/:id/messages', checkConversationAccess, chatController.getMessages);
router.post('/conversations/:id/messages', checkConversationAccess, sendMessageLimiter, validator.sendChatMessage, chatController.sendMessageRest);
router.post('/conversations/:id/read', checkConversationAccess, chatController.markRead);

// Upload an image to attach to a chat message — same multer/sharp pipeline as
// product images (uploadRoutes.js), just a smaller max dimension and its own
// subdir ('chat'), open to both staff and customers (unlike the staff-only
// product upload route).
router.post('/upload', upload.single('chatImage'), chatController.uploadChatImage);

module.exports = router;
