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
    <div className="voting-screen">
      <div className="voting-header">
        <h1>Who is the Imposter?</h1>
        <StrokeDivider />
        <p>Review the canvas and cast your vote.</p>
      </div>

      <div className="voting-canvas-preview">
        {/* We can re-render the canvas here for review, or just tell them to vote for now. */}
        <p className="preview-placeholder">Canvas Review</p>
      </div>

      <div className="suspect-grid">
        {players.map(p => (
          <div 
            key={p.uid} 
            className={`suspect-card ${selectedUid === p.uid ? 'selected' : ''}`}
            style={{ borderColor: selectedUid === p.uid ? p.color : 'var(--bone-muted)' }}
            onClick={() => !myVote && setSelectedUid(p.uid)}
          >
            <div className="color-swatch" style={{ backgroundColor: p.color }}></div>
            <span className="player-name">{p.name}</span>
          </div>
        ))}
      </div>

      <div className="voting-actions">
        {myVote ? (
          <p className="waiting-msg">Vote cast! Waiting for others...</p>
        ) : (
          <Button onClick={handleVoteSubmit} disabled={!selectedUid}>
            Submit Vote
          </Button>
        )}
        
        {roomState.ownerUid === myPlayer?.uid && (
          <Button onClick={handleForceReveal} variant="danger" style={{ marginTop: 16 }}>
            Force Reveal
          </Button>
        )}
      </div>
    </div>
  );
}
