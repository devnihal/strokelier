/**
 * Single source of truth for Socket.IO event name string constants.
 */
export const SOCKET_EVENTS = {
  // Room
  ROOM_CREATE: 'room:create',
  ROOM_JOIN: 'room:join',
  ROOM_SET_COLOR: 'room:setColor',
  ROOM_SET_NAME: 'room:setName',
  ROOM_UPDATE_SETTINGS: 'room:updateSettings',
  ROOM_START_GAME: 'room:startGame',
  ROOM_LEAVE: 'room:leave',
  ROOM_STATE: 'room:state',
  ROOM_PLAYER_JOINED: 'room:playerJoined',
  ROOM_PLAYER_LEFT: 'room:playerLeft',
  ROOM_NOT_FOUND: 'room:notFound',

  // Game
  GAME_COUNTDOWN: 'game:countdown',
  GAME_ROLE_REVEAL: 'game:roleReveal',
  GAME_NEW_GAME: 'game:newGame',

  // Draw
  DRAW_STROKE_START: 'draw:strokeStart',
  DRAW_STROKE_POINT: 'draw:strokePoint',
  DRAW_STROKE_END: 'draw:strokeEnd',
  DRAW_RETRY: 'draw:retry',
  DRAW_NEXT_PLAYER: 'draw:nextPlayer',
  DRAW_TURN_CHANGED: 'draw:turnChanged',
  DRAW_STROKE_BROADCAST: 'draw:strokeBroadcast',
  DRAW_STROKE_CLEARED: 'draw:strokeCleared',
  DRAW_STROKE_COMMITTED: 'draw:strokeCommitted',

  // Vote
  VOTE_SUBMIT: 'vote:submit',
  VOTE_PHASE_STARTED: 'vote:phaseStarted',
  VOTE_TALLY: 'vote:tally',

  // Error
  ERROR: 'error',
};
