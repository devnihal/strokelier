const { calculateScores } = require('../game/scoring');

module.exports = function registerVoteHandlers(io, socket, activeRooms) {
  
  const getActiveRoom = () => {
    const { roomCode } = socket.data;
    if (!roomCode) return null;
    return activeRooms.get(roomCode);
  };

  /**
   * Submit a vote for who the imposter is.
   */
  socket.on('VOTE_SUBMIT', ({ votedUid }) => {
    const room = getActiveRoom();
    const uid = socket.data.uid;
    if (!room || room.state !== 'VOTING') return;

    const player = room.players.get(uid);
    if (!player) return;

    // Record the vote
    room.votes.set(uid, votedUid);

    // Check if everyone has voted
    const eligibleVotersCount = room.players.size;
    
    io.to(room.code).emit('ROOM_STATE_UPDATE', room.toPublicState());

    if (room.votes.size >= eligibleVotersCount) {
      triggerReveal(room, io);
    }
  });

  /**
   * Owner forces reveal if someone is disconnected.
   */
  socket.on('VOTE_FORCE_REVEAL', () => {
    const room = getActiveRoom();
    const uid = socket.data.uid;
    if (!room || room.state !== 'VOTING') return;

    if (room.ownerUid !== uid) return; // Only owner can force

    triggerReveal(room, io);
  });

  /**
   * Owner starts a new game in the same room.
   */
  socket.on('GAME_RESTART', () => {
    const room = getActiveRoom();
    const uid = socket.data.uid;
    if (!room || room.state !== 'RESULTS') return;

    if (room.ownerUid !== uid) return;

    // Reset room state for lobby
    room.state = 'LOBBY';
    room.strokes = [];
    room.pendingStroke = null;
    room.currentWord = null;
    room.imposterUid = null;
    room.votes = new Map();
    room.currentRoundNumber = 1;
    room.currentTurnIndex = 0;
    room.drawOrder = [];

    // Clear roles
    for (const p of room.players.values()) {
      p.isImposter = false;
    }

    // Promote spectators to players
    const { assignColor } = require('./roomHandlers');
    const Player = require('../game/Player');
    for (const [sUid, spec] of room.spectators.entries()) {
      if (room.players.size < room.settings.maxPlayers) {
        const newPlayer = new Player(spec.uid, spec.socketId, spec.name, false);
        newPlayer.color = assignColor(room);
        room.addPlayer(newPlayer);
      }
    }
    room.spectators.clear();

    io.to(room.code).emit('ROOM_STATE_UPDATE', room.toPublicState());
  });
};

function triggerReveal(room, io) {
  room.state = 'RESULTS';
  
  const players = Array.from(room.players.values());
  const votes = Object.fromEntries(room.votes);
  const scoreUpdates = calculateScores(players, votes, room.imposterUid);
  room.lastScoreUpdates = scoreUpdates;
  room.gamesPlayed++;

  // Apply score updates to players
  for (const player of players) {
    if (scoreUpdates[player.uid]) {
      player.score += scoreUpdates[player.uid];
    }
  }

  // We need to send the exact imposter ID to the clients now.
  // We can attach it to the public state temporarily or broadcast an event.
  // Wait, in RESULTS state, the client needs to know who the imposter was.
  // We can just add it to the public state.
  // Let's modify `toPublicState()` in Room.js, or just emit a special REVEAL payload here.
  // Better yet, update `toPublicState()` to include `imposterUid` if state === 'RESULTS'.
  
  io.to(room.code).emit('ROOM_STATE_UPDATE', room.toPublicState());
}
