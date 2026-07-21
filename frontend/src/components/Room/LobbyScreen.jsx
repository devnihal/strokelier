import React, { useState } from "react";
import Button from "../common/Button";
import DisconnectTimer from "../common/DisconnectTimer";
import SettingsModal from "./SettingsModal";
import { getRotationForColor } from "../../utils/colorUtils";
import "../../styles/Room/LobbyScreen.css";

export default function LobbyScreen({ roomState, isOwner, myPlayer, socket }) {
  const [showSettings, setShowSettings] = useState(false);

  const players = Object.values(roomState.players);
  const slots = Array(roomState.settings.maxPlayers).fill(null);

  // Validation Logic
  const activePlayers = players.length;
  const impostorCount = roomState.settings.imposterCount || 1;
  const hasCategories = roomState.settings.wordCategories && roomState.settings.wordCategories.length > 0;
  const hasCustomWords = roomState.settings.customWords && roomState.settings.customWords.trim().length > 0;
  const hasWords = hasCategories || hasCustomWords;

  let startError = null;
  if (activePlayers < 2) {
    startError = "Need at least 2 players to start";
  } else if (impostorCount >= activePlayers) {
    startError = "Too many impostors! Must be fewer than players.";
  } else if (!hasWords) {
    startError = "Select word categories or add custom words.";
  }

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
                onClick={() => setShowSettings(true)}
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

          <div style={{ textAlign: "left", marginTop: "24px", fontSize: "14px" }}>
            <div className="ledger-row" style={{ marginBottom: "8px" }}>
              <span className="field-label" style={{ color: "var(--bone-muted)" }}>Win Condition</span>
              <span className="leader"></span>
              <span className="field-value">
                {roomState.settings.endCondition === 'score' 
                  ? `First to ${roomState.settings.targetScore} pts` 
                  : `${roomState.settings.roundsPerGame} Rounds`}
              </span>
            </div>
            <div className="ledger-row" style={{ marginBottom: "8px" }}>
              <span className="field-label" style={{ color: "var(--bone-muted)" }}>Artists</span>
              <span className="leader"></span>
              <span className="field-value">Max {roomState.settings.maxPlayers}</span>
            </div>
            <div className="ledger-row" style={{ marginBottom: "8px" }}>
              <span className="field-label" style={{ color: "var(--bone-muted)" }}>Imposters</span>
              <span className="leader"></span>
              <span className="field-value">{roomState.settings.imposterCount || 1}</span>
            </div>
            <div className="ledger-row" style={{ marginBottom: "8px" }}>
              <span className="field-label" style={{ color: "var(--bone-muted)" }}>Time / Strokes</span>
              <span className="leader"></span>
              <span className="field-value">
                {roomState.settings.drawTimeLimit ? `${roomState.settings.drawTimeLimit}s` : '∞'} / {roomState.settings.strokeLimit ? `${roomState.settings.strokeLimit}` : '∞'}
              </span>
            </div>
          </div>

          <div className="lobby-actions">
            {isOwner ? (
              <>
                <Button
                  onClick={handleStartGame}
                  variant="primary"
                  style={{ width: "100%", marginTop: "24px", opacity: startError !== null ? 0.5 : 1 }}
                  disabled={startError !== null}
                >
                  Commence Session
                </Button>
                {startError !== null && (
                  <p style={{ fontSize: "12px", color: "var(--wax-red)", marginTop: "12px", textAlign: "center" }}>
                    {startError}
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
                      cursor: isTaken ? "not-allowed" : "pointer",
                      transform: `rotate(${getRotationForColor(c)}deg)`,
                      position: 'relative'
                    }}
                    onClick={() => {
                      if (!isTaken) socket.emit("UPDATE_COLOR", { color: c });
                    }}
                  >
                    <svg 
                      className={`swatch-scribble ${isTaken ? 'is-taken' : ''}`}
                      viewBox="0 0 24 24" 
                      style={{ 
                        width: '100%', 
                        height: '100%', 
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        transform: `rotate(${-getRotationForColor(c) + 45}deg)`,
                        pointerEvents: 'none'
                      }}>
                      <path 
                        d="M 2 12 Q 3 2 4 15 T 7 4 T 9 19 T 12 3 T 14 21 T 17 5 T 19 18 T 22 8" 
                        stroke="var(--graphite)" 
                        strokeWidth="1.5" 
                        fill="none" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                        pathLength="100"
                      />
                    </svg>
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
                    {!p.connected && p.disconnectTime && (
                      <DisconnectTimer disconnectTime={p.disconnectTime} maxTime={120} />
                    )}
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
        <SettingsModal 
          settings={roomState.settings} 
          onClose={() => setShowSettings(false)} 
          onSave={(newSettings) => {
            socket.emit("UPDATE_SETTINGS", newSettings);
            setShowSettings(false);
          }}
        />
      )}
    </div>
  );
}
