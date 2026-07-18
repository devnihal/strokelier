/**
 * Represents a single player in a room.
 */
class Player {
  /**
   * Creates a new Player.
   * @param {string} uid - UUID v4 from the client
   * @param {string} socketId - The initial socket.id of the player
   * @param {string} name - Chosen display name
   * @param {boolean} isRoomOwner - True if this player created the room
   */
  constructor(uid, socketId, name, isRoomOwner = false) {
    this.uid = uid;
    this.socketId = socketId;
    this.name = name;
    this.color = null; // Assigned later from 12 fixed colors
    this.isRoomOwner = isRoomOwner;
    this.isImposter = false;
    this.score = 0;
    this.connected = true;
    this.disconnectTime = null;
    this.joinedAt = Date.now();
  }

  /**
   * Returns a sanitized version of the player for broadcasting.
   * Excludes socketId and isImposter (unless explicitly revealed).
   * @returns {Object}
   */
  toPublicState() {
    return {
      uid: this.uid,
      name: this.name,
      color: this.color,
      isRoomOwner: this.isRoomOwner,
      score: this.score,
      connected: this.connected,
      disconnectTime: this.disconnectTime,
      joinedAt: this.joinedAt,
    };
  }
}

module.exports = Player;
