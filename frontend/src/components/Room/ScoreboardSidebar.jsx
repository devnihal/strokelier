import React from 'react';
import '../../styles/Room/ScoreboardSidebar.css';

export default function ScoreboardSidebar({ players, currentTurnUid, ownerUid, myUid }) {
  const sortedPlayers = Object.values(players).sort((a, b) => b.score - a.score);

  return (
    <div style={{ position: 'relative', maxWidth: '600px', margin: '40px auto 0' }}>
      <h2 className="label">Drawing Sequence — Studio Turn Stream</h2>
      
      {/* Contextual Motif: Inkwell */}
      <svg className="doodle-illustration" style={{ right: '-35px', bottom: '20px', width: '32px', height: '32px' }} viewBox="0 0 24 24" fill="none" stroke="var(--brass)" strokeWidth="1.2" strokeLinecap="round">
        <path d="M6 20h12v-6H6v6zM9 14v-4h6v4M10 10V7h4v3" />
        <path d="M7 16h10" strokeDasharray="2 2"/>
      </svg>

      <div className="turn-roster-stream">
        {sortedPlayers.map((p, index) => {
          const isDrawing = p.uid === currentTurnUid;
          const isMe = p.uid === myUid;
          const isOwner = p.uid === ownerUid;
          const rotation = (index % 2 === 0 ? 1 : -1) * (3 + (index * 2));
          
          return (
            <div key={p.uid} className={`turn-roster-node ${isDrawing ? 'active' : ''}`}>
              <div className="node-indicator">
                <span style={{ display: 'block', fontSize: '10px', color: 'var(--brass)' }}>{p.score} PTS</span>
                {isOwner && <span style={{ fontSize: '10px', color: 'var(--bone-muted)' }}>HOST</span>}
              </div>
              <div className="node-profile">
                <div 
                  className="seal" 
                  style={{ 
                    background: p.color || 'var(--bone-muted)', 
                    width: '16px', height: '16px', 
                    borderRadius: '42% 58% 55% 45% / 45% 42% 58% 55%',
                    transform: `rotate(${rotation}deg)`
                  }}
                />
                <span>{p.name} {isMe ? '(You)' : ''}</span>
              </div>
              <span className="active-chevron">● AT CANVAS</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
