const { calculateScores } = require('../game/scoring');

module.exports = function registerVoteHandlers(io, socket, activeRooms) {
  
  const getActiveRoom = () => {
    const { roomCode } = socket.data;
    if (!roomCode) return null;
    return activeRooms.get(roomCode);
  };

  /**
   * Submit a vote for who the imposters are.
   */
  socket.on('VOTE_SUBMIT', ({ votedUids }) => {
    const room = getActiveRoom();
    const uid = socket.data.uid;
    if (!room || room.state !== 'VOTING') return;

    const player = room.players.get(uid);
    if (!player) return;

    // Record the vote
    room.votes.set(uid, votedUids);

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

    // Check end condition
    let gameOver = false;
    if (room.settings.endCondition === 'score') {
      for (const p of room.players.values()) {
        if (p.score >= room.settings.targetScore) {
          gameOver = true;
          break;
        }
      }
    }

    if (gameOver) {
      room.state = 'LEADERBOARD';
    } else {
      // Reset room state for lobby
      room.state = 'LOBBY';
      room.strokes = [];
      room.pendingStroke = null;
      room.currentWord = null;
      room.imposterUids = [];
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
    }

    io.to(room.code).emit('ROOM_STATE_UPDATE', room.toPublicState());
  });
};

function triggerReveal(room, io) {
  room.state = 'RESULTS';
  
  const players = Array.from(room.players.values());
  const votes = Object.fromEntries(room.votes);
  const scoreUpdates = calculateScores(players, votes, room.imposterUids);
  room.lastScoreUpdates = scoreUpdates;
  room.gamesPlayed++;

  // Apply score updates to players
  for (const player of players) {
    if (scoreUpdates[player.uid]) {
      player.score += scoreUpdates[player.uid];
    }
  }
  
  io.to(room.code).emit('ROOM_STATE_UPDATE', room.toPublicState());
}
