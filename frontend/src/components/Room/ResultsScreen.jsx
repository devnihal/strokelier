import React from "react";
import Button from "../common/Button";
import StrokeDivider from "../common/StrokeDivider";
import "../../styles/Room/ResultsScreen.css";

export default function ResultsScreen({ roomState, myPlayer, socket }) {
  const isOwner = myPlayer?.isRoomOwner;
  const imposterUid = roomState.imposterUid;
  const word = roomState.currentWord;
  const players = Object.values(roomState.players).sort(
    (a, b) => b.score - a.score,
  );

  const handleNextRound = () => {
    socket.emit("GAME_NEXT_ROUND"); // assuming backend supports this or GAME_RESTART
  };

  const handleReturnLobby = () => {
    socket.emit("GAME_RETURN_LOBBY"); // assuming backend supports this
  };

  // If backend only supports GAME_RESTART:
  const handleNewGame = () => {
    socket.emit("GAME_RESTART");
  };

  return (
    <div className="results-screen">
      <div className="word-reveal">
        <p
          style={{
            fontFamily: "var(--font-code)",
            fontSize: "16px",
            color: "var(--bone-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.12em",
            margin: "0 0 8px 0",
          }}
        >
          The word was:
        </p>
        <h1 className="revealed-word">{word}</h1>
        <StrokeDivider color="var(--brass)" />
      </div>

      <div className="reveal-row">
        {players.map((p) => {
          const isImposter = p.uid === imposterUid;
          return (
            <div
              key={p.uid}
              className={`reveal-card-sketch ${isImposter ? "forger" : ""}`}
            >
              {isImposter && <div className="stamp forger-stamp">Forger</div>}

              <div className="seal" style={{ backgroundColor: p.color }}></div>
              <div className="artist-title">{p.name}</div>
              <div className="artist-points">+{p.score} PTS</div>
            </div>
          );
        })}
      </div>

      <div
        className="results-actions"
        style={{
          marginTop: "40px",
          display: "flex",
          gap: "16px",
          justifyContent: "center",
        }}
      >
        {isOwner ? (
          <Button onClick={handleNewGame}>Play Again (Same Room)</Button>
        ) : (
          <p className="waiting-msg">Waiting for host to start a new game...</p>
        )}
      </div>
    </div>
  );
}
