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
    <div className="results-screen">
      <div className="results-header">
        <h1 className="reveal-title">The Imposter Was...</h1>
        <StrokeDivider color="var(--wax-red)" />
        <h2 className="imposter-name" style={{ color: imposterPlayer?.color || 'var(--wax-red)' }}>
          {imposterPlayer?.name}
        </h2>
        <p className="word-reveal">The word was: <span className="highlight">{roomState.currentWord}</span></p>
      </div>

      <div className="scoreboard">
        <h3>Final Scores</h3>
        <div className="score-list">
          {players.map((p, index) => (
            <div key={p.uid} className={`score-row ${p.uid === imposterUid ? 'is-imposter' : ''}`}>
              <span className="rank">#{index + 1}</span>
              <div className="color-swatch" style={{ backgroundColor: p.color }}></div>
              <span className="player-name">{p.name}</span>
              <span className="score-val">{p.score} pts</span>
            </div>
          ))}
        </div>
      </div>

      {isOwner ? (
        <div className="results-actions">
          <Button onClick={handleNewGame}>Play Again (Same Room)</Button>
        </div>
      ) : (
        <p className="waiting-msg">Waiting for host to start a new game...</p>
      )}
    </div>
  );
}
