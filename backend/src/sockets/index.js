const registerRoomHandlers = require('./roomHandlers');
const registerGameHandlers = require('./gameHandlers');
const registerVoteHandlers = require('./voteHandlers');
const logger = require('../utils/logger');

/**
 * Attaches middleware to the socket server.
 */
function setupSocketMiddleware(io) {
  io.use((socket, next) => {
    const uid = socket.handshake.auth?.uid;
    if (!uid) {
      return next(new Error('Authentication error: uid required'));
    }
    socket.data.uid = uid;
    next();
  });
}

/**
 * Central registry for Socket.IO handlers.
 * Attaches handlers to each incoming connection.
 */
function registerHandlers(io, socket, activeRooms) {
  registerRoomHandlers(io, socket, activeRooms);
  registerGameHandlers(io, socket, activeRooms);
  registerVoteHandlers(io, socket, activeRooms);

  socket.on('disconnect', () => {
    logger.log(`Socket disconnected: ${socket.id}`);
  });
}

module.exports = { registerHandlers, setupSocketMiddleware };
