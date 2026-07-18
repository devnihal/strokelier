import React, { useEffect } from "react";
import confetti from "canvas-confetti";
import { Crown } from "lucide-react";
import Button from "../common/Button";
import StrokeDivider from "../common/StrokeDivider";
import "../../styles/Room/LeaderboardScreen.css";

export default function LeaderboardScreen({ roomState, myPlayer, socket }) {
  useEffect(() => {
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    const randomInRange = (min, max) => Math.random() * (max - min) + min;

    const interval = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        colors: ['#D94132', '#5C8AB3', '#E5B85C', '#6BB36B']
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        colors: ['#D94132', '#5C8AB3', '#E5B85C', '#6BB36B']
      });
    }, 250);

    return () => clearInterval(interval);
  }, []);

  const isOwner = myPlayer?.isRoomOwner;

  // Sort players descending by score
  const sortedPlayers = Object.values(roomState.players).sort(
    (a, b) => b.score - a.score
  );

  const top3 = sortedPlayers.slice(0, 3);
  const rest = sortedPlayers.slice(3);

  // For visual balance on the podium, usually it's ordered 2nd, 1st, 3rd.
  // If there are exactly 2 players, we just show 2nd, 1st
  const podiumOrder = [];
  if (top3.length >= 2) podiumOrder.push({ ...top3[1], rank: 2 });
  if (top3.length >= 1) podiumOrder.push({ ...top3[0], rank: 1 });
  if (top3.length >= 3) podiumOrder.push({ ...top3[2], rank: 3 });

  const handleReturnLobby = () => {
    socket.emit("GAME_RETURN_LOBBY"); 
  };

  const handleGoHome = () => {
    window.location.href = "/";
  };

  return (
    <div className="leaderboard-screen">
      <h1 className="leaderboard-title">Final Standings</h1>
      <StrokeDivider color="var(--brass)" />

      <div className="podium-container">
        {podiumOrder.map((p, i) => {
          // deterministic pseudo-random rotation based on rank
          const rotate = (p.rank % 2 === 0 ? 1 : -1) * (5 + (p.score % 15));
          return (
            <div key={p.uid} className={`podium-place rank-${p.rank}`}>
              <div className="podium-player-info">
                {p.rank === 1 && (
                  <Crown 
                    size={40} 
                    color="var(--brass)" 
                    fill="var(--brass)"
                    style={{ 
                      position: 'absolute', 
                      top: '-24px',
                      right: '-10px',
                      zIndex: 10,
                      filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))',
                      transform: 'rotate(30deg)'
                    }} 
                  />
                )}
                <div 
                  className="podium-seal" 
                  style={{ 
                    backgroundColor: p.color,
                    transform: `rotate(${rotate}deg)`
                  }}
                ></div>
                <div className="podium-name">{p.name}</div>
                <div className="podium-score">{p.score} pts</div>
              </div>
              <div className="podium-block">
                <span className="podium-rank">{p.rank}</span>
              </div>
            </div>
          );
        })}
      </div>

      {rest.length > 0 && (
        <div className="leaderboard-list">
          {rest.map((p, index) => {
            const rotate = (index % 2 === 0 ? 1 : -1) * (5 + (p.score % 15));
            return (
              <div key={p.uid} className="leaderboard-row">
                <span className="row-rank">{index + 4}.</span>
                <div 
                  className="row-seal" 
                  style={{ 
                    backgroundColor: p.color,
                    transform: `rotate(${rotate}deg)`
                  }}
                ></div>
                <span className="row-name">{p.name}</span>
                <span className="row-score">{p.score} pts</span>
              </div>
            );
          })}
        </div>
      )}

      <div
        className="results-actions"
        style={{
          marginTop: "48px",
          display: "flex",
          gap: "16px",
          justifyContent: "center",
          position: "relative",
          zIndex: 10
        }}
      >
        <Button onClick={handleGoHome} variant="secondary">Leave Room</Button>
        {isOwner && (
          <Button onClick={handleReturnLobby} variant="primary">Play Again (Reset Scores)</Button>
        )}
      </div>
    </div>
  );
}
