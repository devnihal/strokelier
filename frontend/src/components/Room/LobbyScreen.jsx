import React from 'react';
import Button from '../common/Button';
import StrokeDivider from '../common/StrokeDivider';
import '../../styles/Room/LobbyScreen.css';

/**
 * Renders the lobby screen where players wait before the game starts.
 */
export default function LobbyScreen({ roomState, isOwner, myPlayer, socket }) {
  const players = Object.values(roomState.players);
  const slots = Array(roomState.settings.maxPlayers).fill(null);

  const handleStartGame = () => {
    socket.emit('GAME_START');
  };

  return (
    <div className="lobby-screen">
      <div className="lobby-header">
        <h1 className="room-code">{roomState.code}</h1>
        <p className="room-subtitle">Atelier Code</p>
        <StrokeDivider color="var(--brass)" variant="flat" />
      </div>

      <div className="player-list">
        <div className="player-count">
          Players: {players.length}/{roomState.settings.maxPlayers}
        </div>
        <div className="slots">
          {slots.map((_, index) => {
            const p = players[index];
            if (p) {
              return (
                <div key={p.uid} className={`player-slot occupied ${p.uid === myPlayer?.uid ? 'is-me' : ''}`}>
                  <div className="color-swatch" style={{ backgroundColor: p.color }}></div>
                  <span className="player-name">{p.name} {p.isRoomOwner ? '(Host)' : ''}</span>
                </div>
              );
            }
            return (
              <div key={`empty-${index}`} className="player-slot empty">
                Empty...
              </div>
            );
          })}
        </div>
      </div>

      <div className="lobby-actions">
        {isOwner ? (
          <Button 
            onClick={handleStartGame} 
          >
            Commence Session
          </Button>
        ) : (
          <p className="waiting-msg">Waiting for host to commence...</p>
        )}
      </div>
    </div>
  );
}
