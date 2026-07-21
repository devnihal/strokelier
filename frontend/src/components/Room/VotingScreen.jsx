import React, { useState, useEffect, useRef } from "react";
import Button from "../common/Button";
import { getRotationForColor } from "../../utils/colorUtils";
import "../../styles/Room/VotingScreen.css";

export default function VotingScreen({ roomState, myPlayer, socket }) {
  const [selectedUids, setSelectedUids] = useState([]);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const canvasRef = useRef(null);

  const players = Object.values(roomState.players);
  const maxSelections = roomState.settings.imposterCount || 1;
  const myVote = roomState.votes[myPlayer?.uid];

  useEffect(() => {
    if (myVote && !hasSubmitted) {
      setHasSubmitted(true);
    }
  }, [myVote, hasSubmitted]);

  const toggleSelection = (uid) => {
    if (hasSubmitted || !myPlayer) return;
    if (selectedUids.includes(uid)) {
      setSelectedUids(selectedUids.filter(id => id !== uid));
    } else {
      if (selectedUids.length < maxSelections) {
        setSelectedUids([...selectedUids, uid]);
      } else {
        // Automatically unselect the oldest choice to make room for the new one (FIFO)
        setSelectedUids([...selectedUids.slice(1), uid]);
      }
    }
  };

  const handleVoteSubmit = () => {
    if (selectedUids.length !== maxSelections) return;
    socket.emit("VOTE_SUBMIT", { votedUids: selectedUids });
    setHasSubmitted(true);
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
      
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontFamily: 'var(--font-ui)', color: 'var(--brass)', fontSize: '24px' }}>
          Who {maxSelections > 1 ? `are the ${maxSelections} Imposters` : 'is the Imposter'}?
        </h2>
        <p style={{ color: 'var(--bone-muted)', fontFamily: 'var(--font-code)', fontSize: '12px', textTransform: 'uppercase' }}>
          Select {maxSelections}
        </p>
      </div>

      <div className="suspect-row">
        {players.map((p) => {
          const isSelected = selectedUids.includes(p.uid);
          // Hide unselected if I have submitted (focuses on my choices)
          if (hasSubmitted && !isSelected) return null;
          
          return (
            <div
              key={p.uid}
              className={`suspect-card-sketch shape-sketch-box ${isSelected ? "selected" : ""}`}
              onClick={() => toggleSelection(p.uid)}
              style={{ cursor: hasSubmitted ? 'default' : 'pointer' }}
            >
              <div className="seal-wrapper" style={{ position: 'relative' }}>
                <div
                  className="seal"
                  style={{
                    backgroundColor: p.color,
transform: `rotate(${getRotationForColor(p.color)}deg)`,
                    width: "32px",
                    height: "32px",
                  }}
                ></div>
              </div>
              <div className="suspect-name">{p.name}</div>
            </div>
          );
        })}
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
        ) : hasSubmitted ? (
          <p className="waiting-msg">Vote cast! Waiting for others...</p>
        ) : (
          <Button onClick={handleVoteSubmit} disabled={selectedUids.length !== maxSelections}>
            Submit Vote
          </Button>
        )}

        {/* Minimal Voted Capsules */}
        {Object.keys(roomState.votes || {}).length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', marginTop: '16px', maxWidth: '400px' }}>
            {Object.entries(roomState.votes).map(([voterUid, voteData]) => {
              const voter = roomState.players[voterUid];
              if (!voter) return null;
              
              const isAnonymous = typeof voteData === 'boolean' || typeof voteData === 'string' && voteData === '';
              let votedTargets = [];
              if (!isAnonymous) {
                if (Array.isArray(voteData)) {
                  votedTargets = voteData.map(id => roomState.players[id]).filter(Boolean);
                } else {
                  votedTargets = [roomState.players[voteData]].filter(Boolean);
                }
              }

              return (
                <div key={voterUid} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'var(--studio-wall-alt)', border: '1px solid var(--hairline)', padding: '4px 8px', borderRadius: '16px' }}>
                  <div className="seal" style={{ width: '12px', height: '12px', backgroundColor: voter.color, filter: 'none', margin: 0, transform: `rotate(${getRotationForColor(voter.color)}deg)` }}></div>
                  <span style={{ fontFamily: 'var(--font-ui)', fontSize: '11px', color: 'var(--bone-muted)' }}>{voter.name}</span>
                  
                  {!isAnonymous && votedTargets.length > 0 && (
                    <>
                      <span style={{ color: 'var(--bone-muted)', fontFamily: 'var(--font-code)', fontSize: '10px', margin: '0 4px' }}>→</span>
                      {votedTargets.map(target => (
                        <div key={target.uid} className="seal" style={{ width: '12px', height: '12px', backgroundColor: target.color, filter: 'none', margin: 0, transform: `rotate(${getRotationForColor(target.color)}deg)` }} title={target.name}></div>
                      ))}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
