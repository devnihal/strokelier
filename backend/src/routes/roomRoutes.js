const express = require('express');

/**
 * Creates the Express router for room-related HTTP endpoints.
 * @param {Map<string, Object>} activeRooms 
 * @returns {express.Router}
 */
module.exports = function createRoomRoutes(activeRooms) {
  const router = express.Router();

  /**
   * POST /api/room/create
   * Creates a new room and returns the roomCode.
   * Body must contain { uid, name } from the creator.
   */
  router.post('/create', (req, res) => {
    const { uid, name } = req.body;
    if (!uid || !name) {
      return res.status(400).json({ error: 'uid and name are required' });
    }

    // Creating a room involves interacting with the global activeRooms map.
    // The actual initialization of the Room instance is handled by the socket,
    // or we can instantiate it here. We will instantiate it here so it's immediately available.
    
    // We defer to the Room class.
    const Room = require('../game/Room');
    const Player = require('../game/Player');

    try {
      const room = new Room(activeRooms, uid);
      
      // The socket connection will handle joining the room fully, 
      // but we register it in the global map now to reserve the code.
      activeRooms.set(room.code, room);

      res.status(200).json({ 
        roomCode: room.code 
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to create room' });
    }
  });

  /**
   * GET /api/room/:code/verify
   * Verifies if a room exists and is in the LOBBY state.
   */
  router.get('/:code/verify', (req, res) => {
    const { code } = req.params;
    const room = activeRooms.get(code);

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    if (room.players.size >= room.settings.maxPlayers && room.state === 'LOBBY') {
      return res.status(403).json({ error: 'Room is full' });
    }

    res.status(200).json({ valid: true });
  });

  return router;
};
