import React from "react";
import "../../styles/Room/ScoreboardSidebar.css";

const DisconnectTimer = ({ disconnectTime }) => {
  const [timeLeft, setTimeLeft] = React.useState(10);
  
  React.useEffect(() => {
    if (!disconnectTime) return;
    
    const updateTimer = () => {
      const elapsed = Math.floor((Date.now() - disconnectTime) / 1000);
      setTimeLeft(Math.max(0, 10 - elapsed));
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [disconnectTime]);

  if (timeLeft === 0) return null;

  return (
    <span style={{ color: '#d9534f', fontSize: '12px', fontWeight: 'bold', marginLeft: '8px', fontVariantNumeric: 'tabular-nums' }}>
      00:{timeLeft.toString().padStart(2, '0')}
    </span>
  );
};

export default function ScoreboardSidebar({
  players,
  currentTurnUid,
  ownerUid,
  myUid,
}) {
  const sortedPlayers = Object.values(players).sort(
    (a, b) => b.score - a.score,
  );

  return (
    <div className="scoreboard-sidebar">
      <h3>Players</h3>
      <div className="player-list">
        {sortedPlayers.map((p) => {
          const isDrawing = p.uid === currentTurnUid;
          const isMe = p.uid === myUid;
          const isOwner = p.uid === ownerUid;

          return (
            <div
              key={p.uid}
              className={`player-item ${isDrawing ? "is-drawing" : ""} ${!p.connected ? "disconnected" : ""}`}
              style={{ opacity: p.connected ? 1 : 0.6 }}
            >
              <div
                className="color-swatch-wrapper"
                style={{
                  position: "relative",
                  display: "flex",
                  marginRight: "10px",
                  justifyContent: "center",
                }}
              >
                <div
                  className="color-swatch"
                  style={{ backgroundColor: p.color, filter: !p.connected ? 'grayscale(1)' : 'none' }}
                ></div>
                {isOwner && (
                  <div
                    style={{
                      position: "absolute",
                      top: "-13px",
                      left: "50%",
                      transform: "translateX(-50%)",
                      display: "flex",
                    }}
                  >
                    <svg
                      title="Room Host"
                      viewBox="0 0 24 24"
                      fill="var(--brass)"
                      style={{
                        width: "16px",
                        height: "16px",
                        filter: "drop-shadow(0 2px 2px rgba(0,0,0,0.5))",
                      }}
                    >
                      <path d="M2 22h20v-2H2v2zm2-4h16l2-10-5.5 4L12 2 7.5 12 2 8l2 10z" />
                    </svg>
                  </div>
                )}
              </div>
              <div
                className="player-info"
                style={{ flex: 1, paddingRight: "8px" }}
              >
                <span className="player-name">
                  {p.name} {isMe && "(You)"}
                </span>
                <span className="player-score">{p.score} pts</span>
              </div>
              <div
                className="badges"
                style={{ display: "flex", alignItems: "center" }}
              >
                {isDrawing && (
                  <svg
                    className="icon-brush"
                    title="Currently Drawing"
                    viewBox="0 0 24 24"
                    fill="var(--brass)"
                    style={{
                      width: "18px",
                      height: "18px",
                    }}
                  >
                    <path d="M7 14c-1.66 0-3 1.34-3 3 0 1.31-1.16 2-2 2 .92 1.22 2.49 2 4 2 2.21 0 4-1.79 4-4 0-1.66-1.34-3-3-3zm13.71-9.37l-1.34-1.34a2 2 0 0 0-2.83 0L9 10.83l4.17 4.17 7.54-7.54a2 2 0 0 0 0-2.83z" />
                  </svg>
                )}
                {!p.connected && p.disconnectTime && (
                  <DisconnectTimer disconnectTime={p.disconnectTime} />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
