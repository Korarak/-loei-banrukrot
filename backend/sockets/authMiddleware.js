// sockets/authMiddleware.js
const { verifyTokenAndLoadUser } = require('../middleware/auth');

// Socket.io connection-level auth — mirrors authenticateToken() in
// middleware/auth.js but reads the token from the handshake instead of a
// request header, and rejects the connection outright on failure.
module.exports = async (socket, next) => {
    const token = socket.handshake.auth?.token;
    const result = await verifyTokenAndLoadUser(token);

    if (!result.ok) {
        return next(new Error(result.message));
    }

    socket.data.type = result.type; // 'user' | 'customer'
    socket.data.principal = result.principal;
    next();
};
