// sockets/io.js — singleton so REST controllers can reach the Socket.io
// instance (Express has no request-scoped place to stash it).
let ioInstance = null;

module.exports = {
    init(io) {
        ioInstance = io;
    },
    get() {
        return ioInstance;
    }
};
