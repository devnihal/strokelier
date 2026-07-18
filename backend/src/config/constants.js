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
    '#B23A2E', // Seal Red
    '#5C7A4A', // Moss
    '#4C6B8A', // Ink Blue
    '#7A4A6B', // Plum
    '#CBA045', // Brass
    '#6B7580', // Slate
    '#A85C32', // Rust
    '#3D7A72', // Teal Ink
    '#C9836B', // Blush Clay
    '#8A8148', // Olive
    '#7385B8', // Periwinkle
    '#9E5A6B', // Charcoal Rose
  ],
};

module.exports = CONSTANTS;
