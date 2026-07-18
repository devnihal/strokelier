/**
 * Application constants for the backend.
 * Keeps magic numbers out of the logic files.
 */

const CONSTANTS = {
  // Room logic
  MAX_PLAYERS_HARD_CAP: 20,
  MIN_PLAYERS_TO_START: 3,
  
  // Timings
  EMPTY_ROOM_CLEANUP_MS: 5 * 60 * 1000, // 5 minutes
  RECONNECT_GRACE_MS: 2 * 60 * 1000,    // 2 minutes

  // Valid wax-seal colors for players (from spec)
  VALID_COLORS: [
    '#D94132', '#5C8AB3', '#E5B85C', '#A85C32', '#C9836B', '#7385B8', 
    '#6BB36B', '#7A4A6B', '#6B7580', '#3D7A72', '#8A8148', '#9E5A6B'
  ]
};

module.exports = CONSTANTS;
