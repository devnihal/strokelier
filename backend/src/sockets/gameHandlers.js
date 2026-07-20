module.exports = function registerGameHandlers(io, socket, activeRooms) {
  
  const startTurnTimer = (room) => {
    if (room.turnTimeoutId) clearTimeout(room.turnTimeoutId);
    
    const currentPlayerUid = room.drawOrder[room.currentTurnIndex];
    const currentPlayer = room.players.get(currentPlayerUid);
    const isOffline = currentPlayer && !currentPlayer.connected;

    if (isOffline) {
      // 10-second fast-forward if drawer is already offline when turn starts
      room.turnStartTime = Date.now();
      room.turnTimeoutId = setTimeout(() => {
        handleTurnTimeout(room);
      }, 10000);
    } else if (room.settings.drawTimeLimit) {
      room.turnStartTime = Date.now();
      room.turnTimeoutId = setTimeout(() => {
        handleTurnTimeout(room);
      }, room.settings.drawTimeLimit * 1000);
    } else {
      room.turnStartTime = null;
      room.turnTimeoutId = null;
    }
  };

  const handleTurnTimeout = (room) => {
    if (room.pendingStroke) {
      room.strokes.push(room.pendingStroke);
      const committedStroke = room.pendingStroke;
      room.pendingStroke = null;
      io.to(room.code).emit('DRAW_STROKE_COMMITTED', { stroke: committedStroke });
    }
    advanceTurn(room);
  };

  const advanceTurn = (room) => {
    if (room.turnTimeoutId) clearTimeout(room.turnTimeoutId);
    
    room.currentTurnIndex++;
    
    // Check if round is over
    if (room.currentTurnIndex >= room.drawOrder.length) {
      room.currentTurnIndex = 0;
      room.currentRoundNumber++;
    }

    // Check if drawing phase is over (rounds limit reached for this voting cycle)
    if (room.currentRoundNumber > room.settings.roundsPerGame) {
      
      // Before entering VOTING, instantly kick any offline players
      let playersKicked = false;
      let gameAborted = false;
      for (const [uid, player] of room.players.entries()) {
        if (!player.connected) {
          room.removePlayer(uid);
          playersKicked = true;

          const imposterIdx = room.imposterUids.indexOf(uid);
          if (imposterIdx !== -1) {
            room.imposterUids.splice(imposterIdx, 1);
          }

          if (room.imposterUids.length === 0 || room.players.size < 3) {
            gameAborted = true;
          }
        }
      }

      if (gameAborted) {
        room.state = 'LOBBY';
        room.turnTimeoutId = null;
        room.turnStartTime = null;
        room.pendingStroke = null;
        io.to(room.code).emit('ROOM_STATE_UPDATE', room.toPublicState());
        return;
      }

      room.state = 'VOTING';
      room.turnStartTime = null;
      room.turnTimeoutId = null;
      io.to(room.code).emit('ROOM_STATE_UPDATE', room.toPublicState());
    } else {
      startTurnTimer(room);
      io.to(room.code).emit('DRAW_TURN_CHANGED', { 
        currentTurnIndex: room.currentTurnIndex,
        currentRoundNumber: room.currentRoundNumber
      });
      io.to(room.code).emit('ROOM_STATE_UPDATE', room.toPublicState());
    }
  };

  /**
   * Starts the game from the LOBBY state.
   */
  socket.on('GAME_START', () => {
    const roomCode = socket.data.roomCode;
    const uid = socket.data.uid;
    if (!roomCode) return;

    const room = activeRooms.get(roomCode);
    if (!room) return;

    // Attach methods to room for external access (cleanup/reconnect)
    room.advanceTurn = () => advanceTurn(room);
    room.startTurnTimer = () => startTurnTimer(room);

    if (room.ownerUid !== uid) {
      return; // Only owner can start
    }

    if (room.state !== 'LOBBY' && room.state !== 'RESULTS') {
      return; // Already started
    }

    // Initialize game
    room.state = 'DRAWING';
    room.strokes = [];
    room.currentRoundNumber = 1;
    
    // Create randomized draw order
    const playerIds = Array.from(room.players.keys());
    for (let i = playerIds.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [playerIds[i], playerIds[j]] = [playerIds[j], playerIds[i]];
    }
    room.drawOrder = playerIds;
    room.currentTurnIndex = 0;

    // Pick imposters
    const numImposters = Math.min(room.settings.imposterCount || 1, playerIds.length - 1);
    room.imposterUids = [];
    let availableIds = [...playerIds];
    for(let i=0; i<numImposters; i++){
      if(availableIds.length === 0) break;
      const idx = Math.floor(Math.random() * availableIds.length);
      room.imposterUids.push(availableIds[idx]);
      availableIds.splice(idx, 1);
    }

    // Mark the player objects as imposter for server logic (stripped before emit)
    for (const [pUid, p] of room.players.entries()) {
      p.isImposter = room.imposterUids.includes(pUid);
    }

    // Set the secret word using wordLoader
    const { getRandomWord } = require('../game/wordLoader');
    room.currentWord = getRandomWord(room.settings, room.usedWords);

    startTurnTimer(room);

    // Send roles to everyone in a single bulk broadcast to guarantee delivery
    const rolesMap = {};
    for (const [pUid, p] of room.players.entries()) {
      rolesMap[pUid] = { 
        role: p.isImposter ? 'imposter' : 'artist', 
        word: p.isImposter ? null : room.currentWord 
      };
    }
    
    const publicState = room.toPublicState();
    publicState.rolesMap = rolesMap;
    
    io.to(roomCode).emit('ROOM_STATE_UPDATE', publicState);
  });

  const getActiveRoomAndValidateTurn = (socket) => {
    const { roomCode, uid } = socket.data;
    if (!roomCode) return null;
    const room = activeRooms.get(roomCode);
    if (!room || room.state !== 'DRAWING') return null;
    
    const currentPlayerUid = room.drawOrder[room.currentTurnIndex];
    if (currentPlayerUid !== uid) return null; // Not this player's turn
    
    return { room, uid };
  };

  socket.on('DRAW_STROKE_START', ({ width, color }) => {
    const context = getActiveRoomAndValidateTurn(socket);
    if (!context) return;
    const { room, uid } = context;

    const player = room.players.get(uid);
    room.pendingStroke = {
      playerUid: uid,
      color: color || player.color,
      width: width || 4,
      points: []
    };
    
    // Broadcast to others so they can prepare
    socket.to(room.code).emit('DRAW_STROKE_START_BROADCAST', room.pendingStroke);
  });

  socket.on('DRAW_STROKE_POINT', ({ x, y }) => {
    const context = getActiveRoomAndValidateTurn(socket);
    if (!context || !context.room.pendingStroke) return;
    
    context.room.pendingStroke.points.push({ x, y });
    
    // Broadcast just the point to others
    socket.to(context.room.code).emit('DRAW_STROKE_POINT_BROADCAST', { x, y });
  });

  socket.on('GAME_RETURN_LOBBY', () => {
    const context = getActiveRoomAndValidateTurn(socket);
    if (!context) return;
    const { room } = context;
    if (room.state !== 'RESULTS' && room.state !== 'LEADERBOARD') return;

    if (room.state === 'LEADERBOARD') {
      room.gamesPlayed = 0;
      for (const p of room.players.values()) {
        p.score = 0;
      }
    }

    room.state = 'LOBBY';
    io.to(room.code).emit('ROOM_STATE_UPDATE', room.toPublicState());
  });

  socket.on('GAME_END', () => {
    const roomCode = socket.data.roomCode;
    const room = activeRooms.get(roomCode);
    if (!room || room.ownerUid !== socket.data.uid) return;
    if (room.state !== 'LOBBY' && room.gamesPlayed < 1) return;

    if(room.turnTimeoutId) clearTimeout(room.turnTimeoutId);

    room.state = 'LEADERBOARD';
    io.to(room.code).emit('ROOM_STATE_UPDATE', room.toPublicState());
  });

  socket.on('DRAW_STROKE_END', () => {
    const context = getActiveRoomAndValidateTurn(socket);
    if (!context || !context.room.pendingStroke) return;
    
    socket.to(context.room.code).emit('DRAW_STROKE_END_BROADCAST');
  });

  socket.on('DRAW_RETRY', () => {
    const context = getActiveRoomAndValidateTurn(socket);
    if (!context || !context.room.pendingStroke) return;
    
    context.room.pendingStroke = null;
    io.to(context.room.code).emit('DRAW_STROKE_CLEARED');
  });

  socket.on('DRAW_COMMIT_STROKE', () => {
    const context = getActiveRoomAndValidateTurn(socket);
    if (!context || !context.room.pendingStroke) return;
    const { room } = context;

    room.strokes.push(room.pendingStroke);
    const committedStroke = room.pendingStroke;
    room.pendingStroke = null;

    io.to(room.code).emit('DRAW_STROKE_COMMITTED', { stroke: committedStroke });
  });

  socket.on('DRAW_NEXT_PLAYER', () => {
    const context = getActiveRoomAndValidateTurn(socket);
    if (!context) return;
    const { room } = context;
    
    if (room.pendingStroke) {
      // Commit stroke before advancing
      room.strokes.push(room.pendingStroke);
      const committedStroke = room.pendingStroke;
      room.pendingStroke = null;
      io.to(room.code).emit('DRAW_STROKE_COMMITTED', { stroke: committedStroke });
    }

    advanceTurn(room);
  });

};
