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
      
      /**
       * Sticky Host: Original creator instantly reclaims host upon rejoining
       */
      if (room.originalOwnerUid === uid && room.ownerUid !== uid) {
        const currentOwner = room.players.get(room.ownerUid);
        if (currentOwner) currentOwner.isRoomOwner = false;
        room.ownerUid = uid;
      }

      const isOwner = (room.ownerUid === uid);
      let player = room.getPlayer(uid);

      if (room.state !== 'LOBBY') {
        if (player) {
          // Reconnecting during game
          player.socketId = socket.id;
          player.connected = true;
          player.disconnectTime = null;
          player.name = name;
        } else {
          // Join as spectator
          if (room.players.size + room.spectators.size >= room.settings.maxPlayers) {
            return callback({ success: false, error: 'Maximum number of players in room reached.' });
          }
          room.spectators.set(uid, { uid, socketId: socket.id, name });
          socket.data.roomCode = roomCode;
          socket.join(roomCode);
          socket.join(uid);
          socket.to(roomCode).emit('ROOM_STATE_UPDATE', room.toPublicState());
          return callback({ success: true, state: room.toPublicState(), isSpectator: true });
        }
      } else {
        // Lobby state
        if (!player) {
          if (room.players.size + room.spectators.size >= room.settings.maxPlayers) {
            return callback({ success: false, error: 'Maximum number of players in room reached.' });
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

          // If it's their turn, restore their full turn timer
          if (room.state === 'DRAWING' && room.drawOrder[room.currentTurnIndex] === uid) {
            if (room.startTurnTimer) {
              room.startTurnTimer();
            }
          }
        }
      }

      // Store roomCode in socket for disconnect handling
      socket.data.roomCode = roomCode;
      socket.join(roomCode);
      socket.join(uid);

      socket.to(roomCode).emit('ROOM_STATE_UPDATE', room.toPublicState());

      const response = { success: true, state: room.toPublicState() };
      
      /**
       * If reconnecting during an active game, securely bundle their specific
       * secret role and word into the private reconnect response.
       */
      if (room.state !== 'LOBBY' && room.state !== 'RESULTS' && player) {
        response.roleInfo = {
          role: player.isImposter ? 'imposter' : 'artist',
          word: player.isImposter ? null : room.currentWord
        };
      }

      callback(response);

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

  socket.on('UPDATE_SETTINGS', (settings) => {
    const roomCode = socket.data.roomCode;
    const uid = socket.data.uid;
    if (roomCode && uid && settings) {
      const room = activeRooms.get(roomCode);
      if (room && room.ownerUid === uid && room.state === 'LOBBY') {
        if (settings.maxPlayers !== undefined) {
          room.settings.maxPlayers = Math.max(3, Math.min(12, settings.maxPlayers));
        }
        if (settings.roundsPerGame !== undefined) {
          room.settings.roundsPerGame = Math.max(1, Math.min(10, settings.roundsPerGame));
        }
        if (settings.drawTimeLimit !== undefined) room.settings.drawTimeLimit = settings.drawTimeLimit;
        if (settings.strokeLimit !== undefined) room.settings.strokeLimit = settings.strokeLimit;
        if (settings.imposterCount !== undefined) {
          room.settings.imposterCount = Math.max(1, Math.min(5, settings.imposterCount));
        }
        if (settings.anonymousVoting !== undefined) room.settings.anonymousVoting = !!settings.anonymousVoting;
        if (settings.wordCategories !== undefined) room.settings.wordCategories = settings.wordCategories;
        if (settings.customWords !== undefined) room.settings.customWords = settings.customWords;
        if (settings.targetScore !== undefined) room.settings.targetScore = Math.max(100, settings.targetScore);
        if (settings.endCondition !== undefined) room.settings.endCondition = settings.endCondition;

        io.to(roomCode).emit('ROOM_STATE_UPDATE', room.toPublicState());
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
        if (player && player.socketId === socket.id) {
          if (room.state === 'LOBBY') {
            if (room.ownerUid === uid) {
              /** 15s grace period for host in lobby */
              player.connected = false;
              player.disconnectTime = Date.now();
              stateChanged = true;

              setTimeout(() => {
                const currentRoom = activeRooms.get(roomCode);
                if (currentRoom && currentRoom.state === 'LOBBY') {
                  const p = currentRoom.getPlayer(uid);
                  if (p && !p.connected) {
                    currentRoom.removePlayer(uid);
                    if (currentRoom.ownerUid === uid && currentRoom.players.size > 0) {
                      const nextOwner = Array.from(currentRoom.players.values())[0];
                      if (nextOwner) {
                        currentRoom.ownerUid = nextOwner.uid;
                        nextOwner.isRoomOwner = true;
                      }
                    }
                    io.to(roomCode).emit('ROOM_STATE_UPDATE', currentRoom.toPublicState());
                  }
                }
              }, 15000);
            } else {
              room.removePlayer(uid);
              stateChanged = true;
            }
          } else {
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
                  if (currentRoom.advanceTurn) {
                    // Call advanceTurn to properly reset timers and notify players
                    currentRoom.advanceTurn();
                  } else {
                    // Fallback
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
                }

                if (delayedStateChange) {
                  io.to(currentRoom.code).emit('ROOM_STATE_UPDATE', currentRoom.toPublicState());
                }
              }
            }, 10000);
          }
        }

        if (stateChanged) {
          io.to(roomCode).emit('ROOM_STATE_UPDATE', room.toPublicState());
        }
      }
    }
  };

  socket.on('ROOM_LEAVE', (callback) => {
    const roomCode = socket.data.roomCode;
    // Let handleLeaveOrDisconnect properly handle the state updates and removal
    handleLeaveOrDisconnect();
    
    if (roomCode) {
      socket.leave(roomCode);
    }
    socket.data.roomCode = null;
    if (callback) callback({ success: true });
  });

  socket.on('disconnect', () => {
    handleLeaveOrDisconnect();
  });

}

module.exports = registerRoomHandlers;
module.exports.assignColor = assignColor;
