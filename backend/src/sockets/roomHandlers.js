const Player = require('../game/Player');
const { VALID_COLORS } = require('../config/constants');

/**
 * Assigns an available color from the 12 constants.
 */
const assignColor = (room) => {
  const usedColors = new Set(
    Array.from(room.players.values()).map(p => p.color)
  );
  for (const color of VALID_COLORS) {
    if (!usedColors.has(color)) return color;
  }
  return VALID_COLORS[0]; // Fallback if all 12 somehow taken
};

function registerRoomHandlers(io, socket, activeRooms) {
  
  /**
   * Joins a room, creates the Player instance.
   */
  socket.on('ROOM_JOIN', ({ roomCode, name }, callback) => {
    try {
      const room = activeRooms.get(roomCode);
      if (!room) {
        return callback({ error: 'Room not found' });
      }

      const uid = socket.data.uid; // Bound in auth middleware
      const isOwner = (room.ownerUid === uid);
      let player = room.getPlayer(uid);

      if (room.state !== 'LOBBY') {
        if (player) {
          // Reconnecting mid-game
          player.socketId = socket.id;
          player.connected = true;
          player.disconnectTime = null;
          player.name = name;
        } else {
          // Join as spectator
          room.spectators.set(uid, { uid, socketId: socket.id, name });
          socket.data.roomCode = roomCode;
          socket.join(roomCode);
          socket.to(roomCode).emit('ROOM_STATE_UPDATE', room.toPublicState());
          return callback({ success: true, state: room.toPublicState(), isSpectator: true });
        }
      } else {
        // Lobby state
        if (!player) {
          if (room.players.size >= room.settings.maxPlayers) {
            return callback({ error: 'Room is full' });
          }
          player = new Player(uid, socket.id, name, isOwner);
          player.color = assignColor(room);
          room.addPlayer(player);
        } else {
          // Reconnecting in lobby
          player.socketId = socket.id;
          player.connected = true;
          player.disconnectTime = null;
          player.name = name;
        }
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

  socket.on('UPDATE_COLOR', ({ color }) => {
    const roomCode = socket.data.roomCode;
    const uid = socket.data.uid;
    if (roomCode && uid) {
      const room = activeRooms.get(roomCode);
      if (room && room.state === 'LOBBY' && VALID_COLORS.includes(color)) {
        const player = room.getPlayer(uid);
        if (player) {
          player.color = color;
          io.to(roomCode).emit('ROOM_STATE_UPDATE', room.toPublicState());
        }
      }
    }
  });

  const handleLeaveOrDisconnect = () => {
    const roomCode = socket.data.roomCode;
    const uid = socket.data.uid;
    if (roomCode) {
      const room = activeRooms.get(roomCode);
      if (room) {
        let stateChanged = false;
        
        if (room.spectators.has(uid)) {
          room.spectators.delete(uid);
          stateChanged = true;
        }

        const player = room.getPlayer(uid);
        if (player) {
          player.connected = false;
          player.disconnectTime = Date.now();
          stateChanged = true;

          // Transfer ownership and skip turn if needed after 10s
          setTimeout(() => {
            const currentRoom = activeRooms.get(roomCode);
            if (!currentRoom) return;
            const p = currentRoom.getPlayer(uid);
            
            // If they are still disconnected after 10s
            if (p && !p.connected) {
              let delayedStateChange = false;

              // Handle ownership transfer
              if (currentRoom.ownerUid === uid) {
                const nextOwner = Array.from(currentRoom.players.values()).find(otherP => otherP.connected && otherP.uid !== uid);
                if (nextOwner) {
                  currentRoom.ownerUid = nextOwner.uid;
                  nextOwner.isRoomOwner = true;
                  p.isRoomOwner = false;
                  delayedStateChange = true;
                }
              }

              // Handle turn skipping
              if (currentRoom.state === 'DRAWING' && currentRoom.drawOrder[currentRoom.currentTurnIndex] === uid) {
                currentRoom.pendingStroke = null;
                currentRoom.currentTurnIndex++;
                if (currentRoom.currentTurnIndex >= currentRoom.drawOrder.length) {
                  currentRoom.currentTurnIndex = 0;
                  currentRoom.currentRoundNumber++;
                }
                if (currentRoom.currentRoundNumber > currentRoom.settings.roundsPerGame) {
                  currentRoom.state = 'VOTING';
                }
                delayedStateChange = true;
              }

              if (delayedStateChange) {
                io.to(currentRoom.code).emit('ROOM_STATE_UPDATE', currentRoom.toPublicState());
              }
            }
          }, 10000);
        }

        if (stateChanged) {
          io.to(roomCode).emit('ROOM_STATE_UPDATE', room.toPublicState());
        }
      }
    }
  };

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
      }
    }
    handleLeaveOrDisconnect();
    socket.data.roomCode = null;
    if (callback) callback({ success: true });
  });

  socket.on('disconnect', () => {
    handleLeaveOrDisconnect();
  });

}

module.exports = registerRoomHandlers;
module.exports.assignColor = assignColor;
