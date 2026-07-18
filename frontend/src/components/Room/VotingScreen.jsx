import React, { useState, useEffect, useRef } from "react";
import { flushSync } from "react-dom";
import Button from "../common/Button";
import "../../styles/Room/VotingScreen.css";

export default function VotingScreen({ roomState, myPlayer, socket }) {
  const [selectedUid, setSelectedUid] = useState(null);
  const [hasVoted, setHasVoted] = useState(false);
  const canvasRef = useRef(null);

  const players = Object.values(roomState.players);
  const myVote = roomState.votes[myPlayer?.uid];
  const [displayedVote, setDisplayedVote] = useState(myVote);

  useEffect(() => {
    if (myVote && !displayedVote) {
      if (document.startViewTransition) {
        document.startViewTransition(() => {
          flushSync(() => {
            setDisplayedVote(myVote);
          });
        });
      } else {
        setDisplayedVote(myVote);
      }
    } else if (!myVote && displayedVote) {
      setDisplayedVote(null);
    }
  }, [myVote, displayedVote]);

  const handleVoteSubmit = () => {
    if (!selectedUid) return;
    socket.emit("VOTE_SUBMIT", { votedUid: selectedUid });
    setHasVoted(true);
  };

  const handleForceReveal = () => {
    socket.emit("VOTE_FORCE_REVEAL");
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    const ctx = canvas.getContext("2d");
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    roomState.strokes.forEach((stroke) => {
      if (!stroke.points || stroke.points.length === 0) return;
      ctx.beginPath();
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.moveTo(
        stroke.points[0].x * canvas.width,
        stroke.points[0].y * canvas.height,
      );
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(
          stroke.points[i].x * canvas.width,
          stroke.points[i].y * canvas.height,
        );
      }
      ctx.stroke();
    });
  }, [roomState.strokes]);

  return (
    <div className="voting-screen">
      <div className="voting-canvas-preview">
        <canvas ref={canvasRef} className="preview-canvas" />
      </div>

      <div className="suspect-row">
        {players
          .filter((p) => !displayedVote || displayedVote === p.uid)
          .map((p) => (
          <div
            key={p.uid}
            style={{ viewTransitionName: `suspect-${p.uid}` }}
            className={`suspect-card-sketch shape-sketch-box ${selectedUid === p.uid ? "selected" : ""}`}
            onClick={() => myPlayer && !displayedVote && setSelectedUid(p.uid)}
          >
            <div className="seal-wrapper">
              <div
                className="seal"
                style={{
                  backgroundColor: p.color,
                  width: "32px",
                  height: "32px",
                }}
              ></div>
            </div>
            <div className="suspect-name">{p.name}</div>
          </div>
        ))}
      </div>

      <div
        className="voting-actions"
        style={{
          marginTop: "40px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          alignItems: "center",
        }}
      >
        {!myPlayer ? (
          <p className="waiting-msg">
            Spectating... waiting for players to vote
          </p>
        ) : displayedVote ? (
          <p className="waiting-msg">Vote cast! Waiting for others...</p>
        ) : (
          <Button onClick={handleVoteSubmit} disabled={!selectedUid}>
            Submit Vote
          </Button>
        )}

        {/* {roomState.ownerUid === myPlayer?.uid && (
          <Button onClick={handleForceReveal} variant="danger">
            Force Reveal
          </Button>
        )} */}
      </div>
    </div>
  );
}
