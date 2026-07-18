import React, { useState } from 'react';
import Button from '../common/Button';
import StrokeDivider from '../common/StrokeDivider';
import '../../styles/Room/VotingScreen.css';

export default function VotingScreen({ roomState, myPlayer, socket }) {
  const [selectedUid, setSelectedUid] = useState(null);
  const [hasVoted, setHasVoted] = useState(false);

  // We don't need isImposter for now as the server validates if the player can vote
  // For now, let's assume we can deduce it if they can't vote, or we just rely on `roleInfo` passed down, but we don't have it passed down here since it's local to CanvasScreen right now.
  // Wait, I should lift `roleInfo` state to `RoomScreen`!
  // Let's do that in a bit. For now I'll just check if they have voted.

  const players = Object.values(roomState.players);
  const myVote = roomState.votes[myPlayer?.uid];

  const handleVoteSubmit = () => {
    if (!selectedUid) return;
    socket.emit('VOTE_SUBMIT', { votedUid: selectedUid });
    setHasVoted(true);
  };

  const handleForceReveal = () => {
    socket.emit('VOTE_FORCE_REVEAL');
  };

  return (
    <div className="wrap">
      <section>
        <h2 className="label">Accusation — Identify the Master Forger</h2>
        
        <div style={{ position: 'relative', paddingTop: '10px' }}>
          <div className="suspect-row" id="suspectRow">
            {players.map((p, index) => {
              const rotation = (index % 2 === 0 ? 1 : -1) * (2 + (index % 7));
              const radii = [
                '42% 58% 55% 45% / 45% 42% 58% 55%',
                '58% 42% 38% 62% / 62% 55% 45% 38%',
                '35% 65% 60% 40% / 55% 35% 65% 45%',
                '65% 35% 45% 55% / 40% 60% 40% 60%'
              ];
              const radius = radii[index % radii.length];
              const isSelected = selectedUid === p.uid;

              return (
                <div 
                  key={p.uid}
                  className={`suspect-card-sketch shape-sketch-box ${isSelected ? 'selected' : ''}`}
                  onClick={() => !myVote && setSelectedUid(p.uid)}
                >
                  <div className="seal-wrapper">
                    <div 
                      className="seal" 
                      style={{ 
                        background: p.color || 'var(--bone-muted)', 
                        width: '32px', height: '32px', 
                        borderRadius: radius,
                        transform: `rotate(${rotation}deg)`
                      }} 
                    />
                  </div>
                  <div className="suspect-name">{p.name}</div>
                </div>
              );
            })}
          </div>
        </div>
        
        <div style={{ textAlign: 'center', marginTop: '40px' }}>
          {myVote ? (
            <p style={{ fontFamily: 'var(--font-hand)', color: 'var(--bone-muted)' }}>Vote cast! Waiting for others...</p>
          ) : (
            <button className="confirm-vote" onClick={handleVoteSubmit} disabled={!selectedUid}>
              Cast Accusation Plaque
            </button>
          )}

          {roomState.ownerUid === myPlayer?.uid && (
            <div style={{ marginTop: '24px' }}>
              <Button onClick={handleForceReveal} variant="danger">
                Force Reveal (Host)
              </Button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
