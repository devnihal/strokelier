/**
 * Central registry for Socket.IO handlers.
 * Attaches handlers to each incoming connection.
 *
 * @param {import("socket.io").Server} io - The socket.io server instance
 * @param {import("socket.io").Socket} socket - The connected socket instance
 */
function registerHandlers(io, socket) {
  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
}

module.exports = { registerHandlers };
