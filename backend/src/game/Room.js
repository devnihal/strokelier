const Player = require('./Player');
const { generateRoomCode } = require('./roomCodeGenerator');

/**
 * Represents a game room.
 * Keeps track of all state related to a specific room.
 */
class Room {
  /**
   * @param {Map<string, Room>} activeRooms - Global active rooms map
   * @param {string} ownerUid
   */
  constructor(activeRooms, ownerUid) {
    this.code = generateRoomCode(activeRooms);
    this.ownerUid = ownerUid;
    this.players = new Map(); // uid -> Player
    this.spectators = new Map(); // uid -> { uid, socketId, name }
    this.settings = {
      maxPlayers: 8,
      roundsPerGame: 3,
      wordBank: null,
    };
    this.state = 'LOBBY';
    this.currentWord = null;
    this.imposterUid = null;
    this.drawOrder = [];
    this.currentTurnIndex = 0;
    this.currentRoundNumber = 1;
    this.strokes = [];
    this.pendingStroke = null;
    this.votes = new Map(); // voterUid -> votedUid
    this.createdAt = Date.now();
    this.emptySince = null;
    this.gamesPlayed = 0;
  }

  /**
   * Returns a sanitized snapshot of the room state for broadcasting.
   * @returns {Object}
   */
  toPublicState() {
    const publicPlayers = {};
    for (const [uid, player] of this.players.entries()) {
      publicPlayers[uid] = player.toPublicState();
    }
    
    const publicSpectators = {};
    for (const [uid, spec] of this.spectators.entries()) {
      publicSpectators[uid] = { uid: spec.uid, name: spec.name };
    }

    return {
      code: this.code,
      ownerUid: this.ownerUid,
      players: publicPlayers,
      spectators: publicSpectators,
      settings: this.settings,
      state: this.state,
      // Imposter and word are hidden from the public state UNLESS the game is over
      imposterUid: this.state === 'RESULTS' ? this.imposterUid : undefined,
      currentWord: this.state === 'RESULTS' ? this.currentWord : undefined,
      lastScoreUpdates: this.state === 'RESULTS' ? this.lastScoreUpdates : undefined,
      drawOrder: this.drawOrder,
      currentTurnIndex: this.currentTurnIndex,
      currentRoundNumber: this.currentRoundNumber,
      gamesPlayed: this.gamesPlayed,
      strokes: this.strokes,
      pendingStroke: this.pendingStroke,
      votes: Object.fromEntries(this.votes),
      createdAt: this.createdAt,
    };
  }

  addPlayer(player) {
    this.players.set(player.uid, player);
    if (this.players.size === 1) {
      this.emptySince = null; // Room is no longer empty
    }
  }

  removePlayer(uid) {
    this.players.delete(uid);
    if (this.players.size === 0) {
      this.emptySince = Date.now();
    }
  }

  getPlayer(uid) {
    return this.players.get(uid);
  }
}

module.exports = Room;
