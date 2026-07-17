// sockets/chatSocket.js
const chatController = require('../controllers/chatController');
const { Conversation } = require('../models');

const STAFF_ROLES = ['owner', 'staff'];

// The Express rate limiter (app.js) only covers HTTP requests, not socket.io
// events — chat:message:send needs its own, since it's the one socket event
// that writes to the DB and fans out pushes. Simple fixed-window counter per
// socket connection, reset each window; good enough to stop a runaway client
// without the complexity of a real token bucket.
const RATE_LIMIT_MAX_MESSAGES = 15;
const RATE_LIMIT_WINDOW_MS = 10_000;

function isRateLimited(socket) {
    const now = Date.now();
    const state = socket.data.messageRateLimit;
    if (!state || now - state.windowStart > RATE_LIMIT_WINDOW_MS) {
        socket.data.messageRateLimit = { windowStart: now, count: 1 };
        return false;
    }
    state.count += 1;
    return state.count > RATE_LIMIT_MAX_MESSAGES;
}

module.exports = (io) => {
    io.on('connection', async (socket) => {
        const isStaff = socket.data.type === 'user' && STAFF_ROLES.includes(socket.data.principal.role);

        if (isStaff) {
            socket.join('staff:inbox');
        } else if (socket.data.type === 'customer') {
            const conversation = await chatController.getOrCreateConversation(socket.data.principal._id);
            socket.data.conversationId = conversation._id.toString();
            socket.join(`conversation:${conversation._id}`);
        }

        // Staff opens/closes a specific thread in the admin inbox — this join
        // state is what push-notification presence checks (Phase 2) rely on.
        socket.on('chat:thread:open', async ({ conversationId }) => {
            if (!isStaff || !conversationId) return;
            socket.join(`conversation:${conversationId}`);

            try {
                const conversation = await Conversation.findById(conversationId);
                if (conversation) {
                    conversation.lastReadByStaffAt = new Date();
                    await conversation.save();
                    io.to(`conversation:${conversationId}`).emit('chat:read:updated', {
                        conversationId,
                        by: 'staff',
                        at: conversation.lastReadByStaffAt
                    });
                }
            } catch (err) {
                console.error('chat:thread:open error:', err);
            }
        });

        socket.on('chat:thread:close', ({ conversationId }) => {
            if (!isStaff || !conversationId) return;
            socket.leave(`conversation:${conversationId}`);
        });

        socket.on('chat:message:send', async ({ conversationId, body, attachments }, ack) => {
            try {
                if (isRateLimited(socket)) {
                    return ack?.({ ok: false, message: 'ส่งข้อความเร็วเกินไป กรุณารอสักครู่' });
                }

                const trimmedBody = (body || '').trim();
                const hasAttachments = Array.isArray(attachments) && attachments.length > 0;
                if (!trimmedBody && !hasAttachments) {
                    return ack?.({ ok: false, message: 'ข้อความว่างเปล่า' });
                }

                const senderType = isStaff ? 'staff' : 'customer';
                const senderId = socket.data.principal._id;
                const targetConversationId = isStaff ? conversationId : socket.data.conversationId;

                const result = await chatController.sendMessage({
                    conversationId: targetConversationId,
                    customerId: isStaff ? undefined : senderId,
                    senderType,
                    senderId,
                    body: trimmedBody,
                    attachments
                });

                ack?.({ ok: true, message: result.message });
            } catch (err) {
                console.error('chat:message:send error:', err);
                ack?.({ ok: false, message: err.message || 'ส่งข้อความไม่สำเร็จ' });
            }
        });

        socket.on('chat:read', async ({ conversationId }) => {
            const targetId = isStaff ? conversationId : socket.data.conversationId;
            if (!targetId) return;

            try {
                const conversation = await Conversation.findById(targetId);
                if (!conversation) return;

                const now = new Date();
                if (isStaff) {
                    conversation.lastReadByStaffAt = now;
                } else {
                    conversation.lastReadByCustomerAt = now;
                }
                await conversation.save();

                io.to(`conversation:${targetId}`).emit('chat:read:updated', {
                    conversationId: targetId,
                    by: isStaff ? 'staff' : 'customer',
                    at: now
                });
            } catch (err) {
                console.error('chat:read error:', err);
            }
        });

        // Ephemeral — no persistence, just a live "is typing" ping. socket.to()
        // (not io.to()) excludes the sender's own socket from the broadcast.
        socket.on('chat:typing', ({ conversationId }) => {
            const targetId = isStaff ? conversationId : socket.data.conversationId;
            if (!targetId) return;
            socket.to(`conversation:${targetId}`).emit('chat:typing', {
                conversationId: targetId,
                senderType: isStaff ? 'staff' : 'customer'
            });
        });
    });
};
