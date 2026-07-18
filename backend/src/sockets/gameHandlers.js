module.exports = function registerGameHandlers(io, socket, activeRooms) {
  
  /**
   * Starts the game from the LOBBY state.
   */
  socket.on('GAME_START', () => {
    const roomCode = socket.data.roomCode;
    const uid = socket.data.uid;

    if (!roomCode) return;
    
    const room = activeRooms.get(roomCode);
    if (!room) return;

    if (room.ownerUid !== uid) {
      return; // Only owner can start
    }

    if (room.state !== 'LOBBY') {
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

    // Pick an imposter
    const imposterIndex = Math.floor(Math.random() * playerIds.length);
    room.imposterUid = playerIds[imposterIndex];

    // Mark the player objects as imposter for server logic (stripped before emit)
    for (const [pUid, p] of room.players.entries()) {
      p.isImposter = (pUid === room.imposterUid);
    }

    // Set the secret word (placeholder word bank for now)
    const words = ["Mona Lisa", "Eiffel Tower", "Banana", "Dragon", "Spaceship"];
    room.currentWord = words[Math.floor(Math.random() * words.length)];

    // Send roles to everyone in a single bulk broadcast to guarantee delivery
    const rolesMap = {};
    for (const [pUid, p] of room.players.entries()) {
      rolesMap[pUid] = { 
        role: p.isImposter ? 'imposter' : 'artist', 
        word: p.isImposter ? null : room.currentWord 
      };
    }
    // Inject rolesMap into the ROOM_STATE_UPDATE payload just for this GAME_START event
    // This absolutely guarantees that if the client receives the countdown (state transition),
    // they also receive the roles in the exact same packet.
    const publicState = room.toPublicState();
    publicState.rolesMap = rolesMap;
    
    console.log("GAME_START: Emitting ROOM_STATE_UPDATE with injected rolesMap to", roomCode);
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
    if (room.state !== 'LOBBY' || room.gamesPlayed < 1) return;

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

  socket.on('DRAW_NEXT_PLAYER', () => {
    const context = getActiveRoomAndValidateTurn(socket);
    if (!context || !context.room.pendingStroke) return;
    const { room } = context;
    
    // Commit stroke
    room.strokes.push(room.pendingStroke);
    const committedStroke = room.pendingStroke;
    room.pendingStroke = null;
    
    io.to(room.code).emit('DRAW_STROKE_COMMITTED', { stroke: committedStroke });

    // Advance turn
    room.currentTurnIndex++;
    
    // Check if round is over
    if (room.currentTurnIndex >= room.drawOrder.length) {
      room.currentTurnIndex = 0;
      room.currentRoundNumber++;
    }

    // Check if game is over (all rounds done)
    if (room.currentRoundNumber > room.settings.roundsPerGame) {
      room.state = 'VOTING';
      io.to(room.code).emit('ROOM_STATE_UPDATE', room.toPublicState());
    } else {
      io.to(room.code).emit('DRAW_TURN_CHANGED', { 
        currentTurnIndex: room.currentTurnIndex,
        currentRoundNumber: room.currentRoundNumber
      });
      // Also broadcast general state update just in case
      io.to(room.code).emit('ROOM_STATE_UPDATE', room.toPublicState());
    }
  });

};
