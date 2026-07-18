const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

/**
 * Generates a unique 6-digit room code.
 * @param {Map<string, Object>} activeRooms - The map of currently active rooms to check for collisions
 * @returns {string} A 6-digit string
 */
function generateRoomCode(activeRooms) {
  let code = '';
  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    const rawUuid = uuidv4();
    // Fast non-cryptographic hash approach (using crypto just for convenience)
    const hash = crypto.createHash('md5').update(rawUuid).digest('hex');
    const num = parseInt(hash.substring(0, 8), 16);
    code = (num % 1000000).toString().padStart(6, '0');

    if (!activeRooms.has(code)) {
      return code;
    }
    attempts++;
  }

  throw new Error('Failed to generate a unique room code after multiple attempts');
}

module.exports = { generateRoomCode };
