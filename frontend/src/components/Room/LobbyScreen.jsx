import React from 'react';
import Button from '../common/Button';
import '../../styles/Room/LobbyScreen.css';

export default function LobbyScreen({ roomState, isOwner, myPlayer, socket }) {
  const players = Object.values(roomState.players);
  
  const handleStartGame = () => {
    socket.emit('GAME_START');
  };

  const copyInvite = () => {
    navigator.clipboard.writeText(roomState.code);
  };

  return (
    <div className="wrap">
      <section>
        <h2 className="label">Studio Lobby — Sketch-Framed Portals</h2>
        <div className="lobby-grid">
          
          {/* LEFT PANEL: Roster */}
          <div className="shape-lobby-panel panel-left">
            <svg className="doodle-illustration" style={{ top: '-12px', right: '15px', width: '30px', height: '30px' }} viewBox="0 0 24 24" fill="none" stroke="var(--bone-muted)" strokeWidth="1.2">
              <path d="M8 12c-1-2-3-1-4-3s2-4 5-3 4-3 6-1 2 4-1 5-3 4-6 2z" fill="var(--bone-muted)" opacity="0.15"/>
              <circle cx="18" cy="6" r="1" fill="var(--bone-muted)"/>
            </svg>

            <h3>Roster · {players.length}/{roomState.settings.maxPlayers}</h3>
            
            <div className="roster-list">
              {players.map((p, i) => {
                const rotation = (i % 2 === 0 ? 1 : -1) * (3 + (i * 2));
                return (
                  <div key={p.uid} className="roster-row">
                    <div 
                      className="seal" 
                      style={{ 
                        background: p.color || 'var(--brass)', 
                        width: '20px', height: '20px', 
                        borderRadius: '42% 58% 55% 45% / 45% 42% 58% 55%', 
                        transform: `rotate(${rotation}deg)` 
                      }}
                    />
                    <span className="roster-name">{p.name}</span>
                    <span className="roster-leader"></span>
                    {p.isRoomOwner && <span className="roster-tag">HOST</span>}
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* RIGHT PANEL: Settings & Code */}
          <div className="shape-lobby-panel panel-right">
            <h3>Session Ledger</h3>
            <div className="ledger-header-zone">
              <span className="code-display-value">{roomState.code}</span>
              <button className="copy-btn" onClick={copyInvite}>Copy Invite</button>
            </div>
            <div style={{ textAlign: 'left' }}>
              <div className="ledger-row">
                <span className="field-label">Max Artists</span>
                <span className="leader"></span>
                <span className="field-value">{roomState.settings.maxPlayers}</span>
              </div>
              <div className="ledger-row">
                <span className="field-label">Ink Strokes</span>
                <span className="leader"></span>
                <span className="field-value">{roomState.settings.roundsPerGame} / Rnd</span>
              </div>
              <div className="ledger-row">
                <span className="field-label">Subject Collection</span>
                <span className="leader"></span>
                <span className="field-value">Classical</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      <div className="lobby-actions" style={{ maxWidth: '400px', margin: '0 auto', textAlign: 'center' }}>
        {isOwner ? (
          <Button onClick={handleStartGame}>Commence Session</Button>
        ) : (
          <p style={{ fontFamily: 'var(--font-hand)', color: 'var(--bone-muted)' }}>
            Waiting for host to commence...
          </p>
        )}
      </div>
    </div>
  );
}
