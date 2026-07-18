const Player = require('../game/Player');
const { PLAYER_COLORS } = require('../config/constants');

module.exports = function registerRoomHandlers(io, socket, activeRooms) {
  
  /**
   * Assigns an available color from the 12 constants.
   */
  const assignColor = (room) => {
    const usedColors = new Set(
      Array.from(room.players.values()).map(p => p.color)
    );
    for (const color of PLAYER_COLORS) {
      if (!usedColors.has(color)) return color;
    }
    return PLAYER_COLORS[0]; // Fallback if all 12 somehow taken
  };

  /**
   * Joins a room, creates the Player instance.
   */
  socket.on('ROOM_JOIN', ({ roomCode, name }, callback) => {
    try {
      const room = activeRooms.get(roomCode);
      if (!room) {
        return callback({ error: 'Room not found' });
      }

      if (room.state !== 'LOBBY') {
        return callback({ error: 'Room is in progress' });
      }

      const uid = socket.data.uid; // Bound in auth middleware
      const isOwner = (room.ownerUid === uid);

      // Handle reconnect or new join
      let player = room.getPlayer(uid);
      if (!player) {
        if (room.players.size >= room.settings.maxPlayers) {
          return callback({ error: 'Room is full' });
        }
        player = new Player(uid, socket.id, name, isOwner);
        player.color = assignColor(room);
        room.addPlayer(player);
      } else {
        // Reconnecting
        player.socketId = socket.id;
        player.connected = true;
        player.name = name; // They can update their name when re-joining lobby
      }

      // Store roomCode in socket for disconnect handling
      socket.data.roomCode = roomCode;
      socket.join(roomCode);

      // Notify others
      socket.to(roomCode).emit('ROOM_STATE_UPDATE', room.toPublicState());

      // Respond success
      callback({ success: true, state: room.toPublicState() });

    } catch (err) {
      console.error(err);
      callback({ error: 'Failed to join room' });
    }
  });

  /**
   * Handle explicit leave or kick
   */
  socket.on('ROOM_LEAVE', (callback) => {
    const roomCode = socket.data.roomCode;
    const uid = socket.data.uid;
    if (roomCode) {
      const room = activeRooms.get(roomCode);
      if (room) {
        room.removePlayer(uid);
        socket.leave(roomCode);
        
        // If empty, we can choose to delete immediately or wait for cleanup job.
        // We'll let the cleanup job handle empty rooms to allow for quick reconnects.
        
        io.to(roomCode).emit('ROOM_STATE_UPDATE', room.toPublicState());
      }
      socket.data.roomCode = null;
    }
    if (callback) callback({ success: true });
  });

};
