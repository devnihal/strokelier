const logger = require('./logger');

const KICK_TIMEOUT_MS = 2 * 60 * 1000;
const EMPTY_ROOM_TIMEOUT_MS = 5 * 60 * 1000;
const CLEANUP_INTERVAL_MS = 10 * 1000;

/**
 * Starts a background interval to periodically sweep active rooms.
 * Enforces the 5-minute empty room deletion limit and the 2-minute
 * disconnected player kick limit. Transfers ownership if the owner is kicked.
 * 
 * @param {import('socket.io').Server} io - The Socket.IO server instance
 * @param {Map<string, Object>} activeRooms - The global map of active rooms
 */
function startCleanupWorker(io, activeRooms) {
  setInterval(() => {
    const now = Date.now();

    for (const [roomCode, room] of activeRooms.entries()) {
      if (room.players.size === 0) {
        if (!room.emptySince) {
          room.emptySince = now;
        } else if (now - room.emptySince > EMPTY_ROOM_TIMEOUT_MS) {
          logger.log(`Room ${roomCode} has been empty for > 5 mins. Deleting.`);
          activeRooms.delete(roomCode);
          continue;
        }
      }

      let playersKicked = false;
      let gameAborted = false;

      for (const [uid, player] of room.players.entries()) {
        if (!player.connected && player.disconnectTime) {
          if (now - player.disconnectTime > KICK_TIMEOUT_MS) {
            logger.log(`Kicking player ${uid} from room ${roomCode} due to 2 min timeout.`);
            room.removePlayer(uid);
            playersKicked = true;

            // Handle mid-game kicks
            if (room.state !== 'LOBBY' && room.state !== 'RESULTS' && room.state !== 'LEADERBOARD') {
              const imposterIdx = room.imposterUids.indexOf(uid);
              if (imposterIdx !== -1) {
                room.imposterUids.splice(imposterIdx, 1);
              }

              // Check if game is unplayable
              if (room.imposterUids.length === 0 || room.players.size < 3) {
                gameAborted = true;
                room.state = 'LOBBY';
                if (room.turnTimeoutId) clearTimeout(room.turnTimeoutId);
                room.turnTimeoutId = null;
                room.turnStartTime = null;
                room.pendingStroke = null;
              } else {
                // Game continues: remove from draw order
                const drawIdx = room.drawOrder.indexOf(uid);
                if (drawIdx !== -1) {
                  room.drawOrder.splice(drawIdx, 1);
                  if (drawIdx < room.currentTurnIndex) {
                    room.currentTurnIndex--;
                  } else if (drawIdx === room.currentTurnIndex) {
                    // It was their turn! Shift index back one and trigger advanceTurn
                    if (room.advanceTurn) {
                      room.currentTurnIndex--;
                      room.advanceTurn();
                    }
                  }
                }
              }
            }
          }
        }
      }

      if (playersKicked && room.players.size > 0) {
        if (room.state === 'LOBBY' && room.players.size > 0) {
          let hasOwner = false;
          for (const p of room.players.values()) {
            if (p.isOwner) {
              hasOwner = true;
              break;
            }
          }
          if (!hasOwner) {
            const firstPlayer = room.players.values().next().value;
            firstPlayer.isOwner = true;
            room.ownerUid = firstPlayer.uid;
          }
        }

        io.to(roomCode).emit('ROOM_STATE_UPDATE', room.toPublicState());
      }
    }
  }, CLEANUP_INTERVAL_MS);
}

module.exports = { startCleanupWorker };
