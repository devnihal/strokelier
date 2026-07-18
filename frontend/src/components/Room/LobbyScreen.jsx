import React from "react";
import Button from "../common/Button";
import "../../styles/Room/LobbyScreen.css";

export default function LobbyScreen({ roomState, isOwner, myPlayer, socket }) {
  const players = Object.values(roomState.players);
  const slots = Array(roomState.settings.maxPlayers).fill(null);

  const handleStartGame = () => {
    socket.emit("GAME_START");
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomState.code);
  };

  return (
    <div className="lobby-screen">
      <div className="lobby-stack">
        <div className="panel ledger-panel">
          <h3>Session Ledger</h3>

          <div className="ledger-header-zone">
            <span className="code-display-value">{roomState.code}</span>
            <button className="copy-btn" onClick={handleCopyCode}>
              Copy Invite
            </button>
          </div>

          <div style={{ textAlign: "left", marginTop: "24px" }}>
            <div className="ledger-row">
              <span className="field-label">Max Artists</span>
              <span className="leader"></span>
              <span className="field-value">
                {roomState.settings.maxPlayers}
              </span>
            </div>
            <div className="ledger-row">
              <span className="field-label">Rounds</span>
              <span className="leader"></span>
              <span className="field-value">
                {roomState.settings.roundsPerGame}
              </span>
            </div>
          </div>

          <div className="lobby-actions">
            {isOwner ? (
              <Button
                onClick={handleStartGame}
                variant="primary"
                style={{ width: "100%", marginTop: "24px" }}
              >
                Commence Session
              </Button>
            ) : (
              <p className="waiting-msg" style={{ marginTop: "24px" }}>
                Waiting for host to commence...
              </p>
            )}
          </div>
        </div>

        {myPlayer && (
          <div className="panel color-panel">
            <h3>Pigment Swatches</h3>
            <div className="swatch-grid">
              {[
                "#D94132",
                "#5C8AB3",
                "#E5B85C",
                "#A85C32",
                "#C9836B",
                "#7385B8",
                "#6BB36B",
                "#7A4A6B",
                "#6B7580",
                "#3D7A72",
                "#8A8148",
                "#9E5A6B",
              ].map((c, i) => {
                const isTaken = players.some(p => p.uid !== myPlayer.uid && p.color === c);
                const isSelected = myPlayer.color === c;
                return (
                  <div
                    key={c}
                    className={`swatch ${isSelected ? "selected" : ""} ${isTaken ? "taken" : ""}`}
                    style={{
                      backgroundColor: c,
                      transform: `rotate(${i % 2 === 0 ? 5 : -5}deg)`,
                      cursor: isTaken ? "not-allowed" : "pointer"
                    }}
                    onClick={() => {
                      if (!isTaken) socket.emit("UPDATE_COLOR", { color: c });
                    }}
                  >
                    {isTaken && (
                      <svg viewBox="0 0 24 24" style={{ width: '100%', height: '100%', stroke: 'var(--graphite)', strokeWidth: 3 }}>
                        <line x1="4" y1="4" x2="20" y2="20" />
                        <line x1="20" y1="4" x2="4" y2="20" />
                      </svg>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="panel shape-lobby-panel roster-panel">
          <h3>
            Roster · {players.length}/{roomState.settings.maxPlayers}
          </h3>

          <div className="slots">
            {slots.map((_, index) => {
              const p = players[index];
              if (p) {
                return (
                  <div
                    key={p.uid}
                    className={`roster-row ${p.uid === myPlayer?.uid ? "is-me" : ""}`}
                  >
                    <div
                      className="seal"
                      style={{ backgroundColor: p.color }}
                    ></div>
                    <span className="roster-name">{p.name}</span>
                    <span className="roster-leader"></span>
                    {p.isRoomOwner && <span className="roster-tag">HOST</span>}
                  </div>
                );
              }
              return (
                <div key={`empty-${index}`} className="roster-row empty">
                  <span
                    className="roster-name"
                    style={{ color: "var(--bone-muted)" }}
                  >
                    Empty...
                  </span>
                  <span className="roster-leader"></span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
