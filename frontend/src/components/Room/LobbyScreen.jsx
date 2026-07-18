import React, { useState } from "react";
import Button from "../common/Button";
import "../../styles/Room/LobbyScreen.css";

export default function LobbyScreen({ roomState, isOwner, myPlayer, socket }) {
  const [showSettings, setShowSettings] = useState(false);
  const [tempMaxPlayers, setTempMaxPlayers] = useState(roomState.settings.maxPlayers);
  const [tempRounds, setTempRounds] = useState(roomState.settings.roundsPerGame);

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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid var(--hairline)', paddingBottom: '12px' }}>
            <h3 style={{ margin: 0, padding: 0, fontSize: '20px' }}>Session Ledger</h3>
            {isOwner && (
              <button 
                onClick={() => {
                  setTempMaxPlayers(roomState.settings.maxPlayers);
                  setTempRounds(roomState.settings.roundsPerGame);
                  setShowSettings(true);
                }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', color: 'var(--brass)' }}
                title="Settings"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3"></circle>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                </svg>
              </button>
            )}
          </div>

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
              <>
                <Button
                  onClick={handleStartGame}
                  variant="primary"
                  style={{ width: "100%", marginTop: "24px", opacity: (players.length + Object.keys(roomState.spectators || {}).length) < 2 ? 0.5 : 1 }}
                  disabled={(players.length + Object.keys(roomState.spectators || {}).length) < 2}
                >
                  Commence Session
                </Button>
                {(players.length + Object.keys(roomState.spectators || {}).length) < 2 && (
                  <p style={{ fontSize: "12px", color: "var(--bone-muted)", marginTop: "8px", textAlign: "center" }}>
                    Need at least 2 people to start
                  </p>
                )}
                {roomState.gamesPlayed >= 1 && (
                  <Button
                    onClick={() => socket.emit("GAME_END")}
                    variant="danger"
                    style={{ width: "100%", marginTop: "12px", borderColor: "var(--crimson)", color: "var(--crimson)" }}
                  >
                    End Game
                  </Button>
                )}
              </>
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
                    <span className="roster-score" style={{ marginLeft: "8px", fontSize: "14px", color: "var(--bone-muted)" }}>{p.score} pts</span>
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

      {showSettings && (
        <div className="modal-scrim open" style={{ zIndex: 100 }}>
          <div className="shape-citadel play theme-word" style={{ maxWidth: '400px', width: '90%', border: '1px solid var(--brass)' }}>
            <span className="popup-header-label">Studio Settings</span>
            <div style={{ textAlign: "left", marginTop: "24px", padding: "0 24px" }}>
              
              <div style={{ marginBottom: "24px" }}>
                <label style={{ display: "block", fontFamily: "var(--font-code)", fontSize: "11px", color: "var(--bone-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>Max Artists: {tempMaxPlayers}</label>
                <input
                  type="range"
                  min="3"
                  max="12"
                  value={tempMaxPlayers}
                  onChange={(e) => setTempMaxPlayers(Number(e.target.value))}
                  style={{ width: "100%", accentColor: "var(--brass)", cursor: "pointer", filter: "url(#sketch-filter-1)" }}
                />
              </div>

              <div style={{ marginBottom: "32px" }}>
                <label style={{ display: "block", fontFamily: "var(--font-code)", fontSize: "11px", color: "var(--bone-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>Rounds: {tempRounds}</label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={tempRounds}
                  onChange={(e) => setTempRounds(Number(e.target.value))}
                  style={{ width: "100%", accentColor: "var(--brass)", cursor: "pointer", filter: "url(#sketch-filter-1)" }}
                />
              </div>

              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", paddingBottom: "24px" }}>
                <Button variant="secondary" onClick={() => setShowSettings(false)}>Cancel</Button>
                <Button variant="primary" onClick={() => {
                  socket.emit("UPDATE_SETTINGS", { maxPlayers: tempMaxPlayers, roundsPerGame: tempRounds });
                  setShowSettings(false);
                }}>Save</Button>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
