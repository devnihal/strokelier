import React from 'react';
import '../../styles/Room/ScoreboardSidebar.css';

export default function ScoreboardSidebar({ players, currentTurnUid, ownerUid, myUid }) {
  const sortedPlayers = Object.values(players).sort((a, b) => b.score - a.score);

  return (
    <div className="scoreboard-sidebar">
      <h3>Players</h3>
      <div className="player-list">
        {sortedPlayers.map(p => {
          const isDrawing = p.uid === currentTurnUid;
          const isMe = p.uid === myUid;
          const isOwner = p.uid === ownerUid;
          
          return (
            <div key={p.uid} className={`player-item ${isDrawing ? 'is-drawing' : ''}`}>
              <div className="color-swatch" style={{ backgroundColor: p.color }}></div>
              <div className="player-info">
                <span className="player-name">
                  {p.name} {isMe && '(You)'}
                </span>
                <span className="player-score">{p.score} pts</span>
              </div>
              <div className="badges">
                {isOwner && <span className="badge owner" title="Room Host">👑</span>}
                {isDrawing && <span className="badge drawing" title="Currently Drawing">🖌️</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
