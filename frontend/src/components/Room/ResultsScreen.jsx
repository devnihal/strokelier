import React from 'react';
import Button from '../common/Button';
import StrokeDivider from '../common/StrokeDivider';
import '../../styles/Room/ResultsScreen.css';

export default function ResultsScreen({ roomState, myPlayer, socket }) {
  const isOwner = myPlayer?.isRoomOwner;
  const imposterUid = roomState.imposterUid;
  const imposterPlayer = roomState.players[imposterUid];

  const players = Object.values(roomState.players).sort((a, b) => b.score - a.score);

  const handleNewGame = () => {
    socket.emit('GAME_RESTART');
  };

  return (
    <div className="wrap">
      <section>
        <h2 className="label">Exhibition Results — Ink Revelations</h2>
        
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <p style={{ fontFamily: 'var(--font-hand)', color: 'var(--bone-muted)' }}>The secret subject was</p>
          <h2 style={{ fontFamily: 'var(--font-heading)', color: 'var(--ink-blue)', fontSize: '32px' }}>{roomState.currentWord}</h2>
        </div>

        <div className="reveal-row">
          {players.map((p, index) => {
            const isImposter = p.uid === imposterUid;
            const rotation = (index % 2 === 0 ? 1 : -1) * (2 + (index % 7));
            const radii = [
              '42% 58% 55% 45% / 45% 42% 58% 55%',
              '58% 42% 38% 62% / 62% 55% 45% 38%',
              '35% 65% 60% 40% / 55% 35% 65% 45%',
              '65% 35% 45% 55% / 40% 60% 40% 60%'
            ];
            const radius = radii[index % radii.length];

            return (
              <div key={p.uid} className="reveal-card-sketch">
                <svg className="torn-corner" viewBox="0 0 24 24">
                  <path d="M 0 24 L 24 24 L 24 0 C 20 5, 15 8, 0 24 Z" />
                  <path d="M 0 24 C 15 8, 20 5, 24 0" fill="none" />
                </svg>

                {isImposter ? (
                  <div className="stamp play">Forger</div>
                ) : (
                  <div className="stamp caught play">Artist</div>
                )}
                
                <div 
                  className="seal" 
                  style={{ 
                    background: p.color || 'var(--bone-muted)', 
                    width: '32px', height: '32px', 
                    borderRadius: radius,
                    marginBottom: '10px',
                    transform: `rotate(${rotation}deg)`
                  }} 
                />
                <div className="artist-title">{p.name}</div>
                <div className="artist-points">{p.score} PTS</div>
              </div>
            );
          })}
        </div>

        <div style={{ textAlign: 'center', marginTop: '48px' }}>
          {isOwner ? (
            <Button onClick={handleNewGame}>Play Again (Same Room)</Button>
          ) : (
            <p style={{ fontFamily: 'var(--font-hand)', color: 'var(--bone-muted)' }}>Waiting for host to start a new game...</p>
          )}
        </div>
      </section>
    </div>
  );
}
