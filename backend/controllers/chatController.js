// controllers/chatController.js
const path = require('path');
const fs = require('fs');
const { Conversation, Message, User, Customer } = require('../models');
const io = require('../sockets/io');
const { notifyOwner } = require('../utils/webPush');
const { processImage, generateBlurPlaceholder } = require('../utils/imageProcessing');
const { UPLOADS_BASE, getUploadSubdir } = require('../middleware/upload');

function uniqueWebpFilename(prefix) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    return `${prefix}-${uniqueSuffix}.webp`;
}

async function resolveSenderName(senderType, senderId) {
    if (senderType === 'staff') {
        const user = await User.findById(senderId).select('username');
        return user?.username || 'พนักงาน';
    }
    const customer = await Customer.findById(senderId).select('firstName lastName');
    return customer ? `${customer.firstName} ${customer.lastName}`.trim() : 'ลูกค้า';
}

// True if any currently-connected socket for this principal is joined to the room —
// used to decide whether a push notification would be redundant.
function isPrincipalInRoom(ioInstance, roomName, principalId) {
    const room = ioInstance.sockets.adapter.rooms.get(roomName);
    if (!room) return false;
    for (const socketId of room) {
        const socket = ioInstance.sockets.sockets.get(socketId);
        if (socket?.data?.principal?._id?.toString() === principalId.toString()) return true;
    }
    return false;
}

// Push notifications are gated on presence, not fired unconditionally:
//   - a customer is pushed only if they have no socket connected at all
//     (if their tab is open anywhere, they already see the live badge)
//   - a staff member is pushed only if they aren't currently viewing this
//     specific thread (conversation:<id> room, joined via chat:thread:open)
// Fire-and-forget — push delivery latency must never delay the chat response,
// and notifyOwner() already swallows per-subscription errors internally.
function pushNewMessage(conversation, senderType, message) {
    const ioInstance = io.get();
    const roomName = `conversation:${conversation._id}`;
    const notificationBody = message.body
        ? message.body.slice(0, 120)
        : (message.attachments?.length > 0 ? '[รูปภาพ]' : '');

    const task = senderType === 'customer'
        ? (async () => {
            const staffList = await User.find({ role: { $in: ['owner', 'staff'] }, isActive: true }).select('_id');
            await Promise.all(staffList.map((staff) => {
                if (ioInstance && isPrincipalInRoom(ioInstance, roomName, staff._id)) return null;
                return notifyOwner('User', staff._id, {
                    title: 'ข้อความใหม่จากลูกค้า',
                    body: notificationBody,
                    url: '/admin/chat',
                    tag: `chat-${conversation._id}`
                });
            }));
        })()
        : (async () => {
            if (ioInstance && isPrincipalInRoom(ioInstance, roomName, conversation.customerId)) return;
            await notifyOwner('Customer', conversation.customerId, {
                title: 'ข้อความใหม่จากร้านค้า',
                body: notificationBody,
                url: '/',
                tag: `chat-${conversation._id}`
            });
        })();

    task.catch((err) => console.error('pushNewMessage error:', err));
}

// Get-or-create the one open conversation for a customer
async function getOrCreateConversation(customerId) {
    let conversation = await Conversation.findOne({ customerId });
    if (!conversation) {
        conversation = await Conversation.create({ customerId });
    }
    return conversation;
}

// Persists a message, updates the conversation's denormalized fields, and
// broadcasts it over sockets. Shared by the REST POST handler and the
// chat:message:send socket event — the single write path for chat messages
// (mirrors how stockUtils.changeStock is the one path for stock writes).
async function sendMessage({ conversationId, customerId, senderType, senderId, body, attachments }) {
    let conversation;
    if (senderType === 'customer') {
        conversation = await getOrCreateConversation(customerId);
    } else {
        conversation = await Conversation.findById(conversationId);
        if (!conversation) {
            throw Object.assign(new Error('ไม่พบบทสนทนา'), { status: 404 });
        }
    }

    const safeBody = body || '';
    const safeAttachments = Array.isArray(attachments) ? attachments : [];

    const message = await Message.create({
        conversationId: conversation._id,
        senderType,
        senderId,
        body: safeBody,
        attachments: safeAttachments
    });

    const preview = safeBody
        ? safeBody.slice(0, 200)
        : (safeAttachments.length > 0 ? '[รูปภาพ]' : '');

    conversation.lastMessageAt = message.createdAt;
    conversation.lastMessagePreview = preview;
    conversation.lastMessageSenderType = senderType;
    if (senderType === 'staff') {
        conversation.lastReadByStaffAt = message.createdAt;
    } else {
        conversation.lastReadByCustomerAt = message.createdAt;
    }
    await conversation.save();

    const senderName = await resolveSenderName(senderType, senderId);
    const payload = {
        _id: message._id,
        conversationId: conversation._id,
        senderType,
        senderId,
        senderName,
        body: message.body,
        attachments: message.attachments,
        createdAt: message.createdAt
    };

    const ioInstance = io.get();
    if (ioInstance) {
        ioInstance.to(`conversation:${conversation._id}`).emit('chat:message:new', payload);
        ioInstance.to('staff:inbox').emit('chat:message:new', payload);
    }

    pushNewMessage(conversation, senderType, payload);

    return { message: payload, conversation };
}

// @desc    List conversations for the staff inbox, newest first
// @route   GET /api/chat/conversations
// @access  Private (staff/owner)
exports.getConversations = async (req, res, next) => {
    try {
        const { cursor, limit = 30 } = req.query;
        const query = {};
        if (cursor) {
            query.lastMessageAt = { $lt: new Date(cursor) };
        }

        const conversations = await Conversation.find(query)
            .sort({ lastMessageAt: -1 })
            .limit(Math.min(parseInt(limit) || 30, 100))
            .populate('customerId', 'firstName lastName email profilePicture');

        const unreadCounts = await Promise.all(conversations.map(c =>
            Message.countDocuments({
                conversationId: c._id,
                senderType: 'customer',
                createdAt: { $gt: c.lastReadByStaffAt || new Date(0) }
            })
        ));

        res.json({
            success: true,
            data: conversations.map((c, i) => ({ ...c.toObject(), unreadCount: unreadCounts[i] }))
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get (or lazily create) the current customer's own conversation
// @route   GET /api/chat/conversations/me
// @access  Private (customer)
exports.getOrCreateMyConversation = async (req, res, next) => {
    try {
        if (!req.customer) {
            return res.status(403).json({ success: false, message: 'สำหรับลูกค้าเท่านั้น' });
        }
        const conversation = await getOrCreateConversation(req.customer._id);
        const unreadCount = await Message.countDocuments({
            conversationId: conversation._id,
            senderType: 'staff',
            createdAt: { $gt: conversation.lastReadByCustomerAt || new Date(0) }
        });
        res.json({ success: true, data: { ...conversation.toObject(), unreadCount } });
    } catch (error) {
        next(error);
    }
};

// @desc    Cursor-paginated message history for a conversation
// @route   GET /api/chat/conversations/:id/messages
// @access  Private (staff, or the owning customer — see checkConversationAccess)
exports.getMessages = async (req, res, next) => {
    try {
        const conversation = await Conversation.findById(req.params.id);
        if (!conversation) {
            return res.status(404).json({ success: false, message: 'ไม่พบบทสนทนา' });
        }

        const { before, limit = 30 } = req.query;
        const query = { conversationId: conversation._id };
        if (before) {
            query.createdAt = { $lt: new Date(before) };
        }

        const messages = await Message.find(query)
            .sort({ createdAt: -1 })
            .limit(Math.min(parseInt(limit) || 30, 100));

        res.json({ success: true, data: messages.reverse() });
    } catch (error) {
        next(error);
    }
};

// @desc    Send a message (REST fallback — same write path as the socket event)
// @route   POST /api/chat/conversations/:id/messages
// @access  Private (staff, or the owning customer — see checkConversationAccess)
exports.sendMessageRest = async (req, res, next) => {
    try {
        const { body, attachments } = req.body;
        const senderType = req.customer ? 'customer' : 'staff';
        const senderId = req.customer ? req.customer._id : req.user._id;

        const result = await sendMessage({
            conversationId: req.params.id,
            customerId: req.customer?._id,
            senderType,
            senderId,
            body,
            attachments
        });

        res.status(201).json({ success: true, data: result.message });
    } catch (error) {
        if (error.status) {
            return res.status(error.status).json({ success: false, message: error.message });
        }
        next(error);
    }
};

// @desc    Mark a conversation as read by the current side
// @route   POST /api/chat/conversations/:id/read
// @access  Private (staff, or the owning customer — see checkConversationAccess)
exports.markRead = async (req, res, next) => {
    try {
        const conversation = await Conversation.findById(req.params.id);
        if (!conversation) {
            return res.status(404).json({ success: false, message: 'ไม่พบบทสนทนา' });
        }

        const by = req.user ? 'staff' : 'customer';
        const now = new Date();
        if (by === 'staff') {
            conversation.lastReadByStaffAt = now;
        } else {
            conversation.lastReadByCustomerAt = now;
        }
        await conversation.save();

        const ioInstance = io.get();
        if (ioInstance) {
            ioInstance.to(`conversation:${conversation._id}`).emit('chat:read:updated', {
                conversationId: conversation._id,
                by,
                at: now
            });
        }

        res.json({ success: true });
    } catch (error) {
        next(error);
    }
};

// @desc    Upload an image to attach to a chat message
// @route   POST /api/chat/upload
// @access  Private (staff or customer)
exports.uploadChatImage = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Please upload a file' });
        }

        let processedBuffer, blurDataURL;
        try {
            [processedBuffer, blurDataURL] = await Promise.all([
                processImage(req.file.buffer, { maxDimension: 1280 }),
                generateBlurPlaceholder(req.file.buffer)
            ]);
        } catch (imgError) {
            return res.status(400).json({ success: false, message: 'Could not process image: ' + imgError.message });
        }

        const subDir = getUploadSubdir('chatImage');
        const uploadDir = path.join(UPLOADS_BASE, subDir);
        fs.mkdirSync(uploadDir, { recursive: true });
        const filename = uniqueWebpFilename('chat');
        fs.writeFileSync(path.join(uploadDir, filename), processedBuffer);

        res.json({
            success: true,
            data: {
                url: `/uploads/${subDir}/${filename}`,
                blurDataURL
            }
        });
    } catch (error) {
        next(error);
    }
};

exports.getOrCreateConversation = getOrCreateConversation;
exports.sendMessage = sendMessage;
