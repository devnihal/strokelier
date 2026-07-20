import React from "react";
import Button from "../common/Button";
import StrokeDivider from "../common/StrokeDivider";
import Confetti from "react-confetti";
import "../../styles/Room/ResultsScreen.css";

export default function ResultsScreen({ roomState, myPlayer, socket }) {
  const isOwner = myPlayer?.isRoomOwner;
  const imposterUids = roomState.imposterUids || [];
  const word = roomState.currentWord;
  const players = Object.values(roomState.players).sort((a, b) => {
    const incA = roomState.lastScoreUpdates ? (roomState.lastScoreUpdates[a.uid] || 0) : 0;
    const incB = roomState.lastScoreUpdates ? (roomState.lastScoreUpdates[b.uid] || 0) : 0;
    if (incB !== incA) return incB - incA;
    return b.score - a.score;
  });

  const handleNewGame = () => {
    socket.emit("GAME_RESTART");
  };

  const getVotersForImposter = (imposterUid) => {
    const voters = [];
    if (!roomState.votes) return voters;
    for (const [voterUid, votedUids] of Object.entries(roomState.votes)) {
      if (!imposterUids.includes(voterUid) && votedUids.includes(imposterUid)) {
        voters.push(roomState.players[voterUid]);
      }
    }
    return voters.filter(Boolean);
  };

  // Check global status for header
  const caughtImpostorsCount = imposterUids.filter(uid => getVotersForImposter(uid).length > 0).length;
  const allEscaped = caughtImpostorsCount === 0;

  // If I am an impostor, did I escape?
  const amImpostor = imposterUids.includes(myPlayer?.uid);
  const myImpostorVoters = amImpostor ? getVotersForImposter(myPlayer.uid) : [];
  const iEscaped = amImpostor && myImpostorVoters.length === 0;

  // If I am NOT an impostor, did I catch all impostors?
  const myVotes = (myPlayer && roomState.votes && roomState.votes[myPlayer.uid]) || [];
  const caughtByMeCount = myVotes.filter(uid => imposterUids.includes(uid)).length;
  const iCaughtAll = !amImpostor && imposterUids.length > 0 && caughtByMeCount === imposterUids.length;
  const iCaughtSome = !amImpostor && caughtByMeCount > 0 && caughtByMeCount < imposterUids.length;
  
  const showConfetti = iEscaped || iCaughtAll;

  return (
    <div className="results-screen">
      {showConfetti && <Confetti width={window.innerWidth} height={window.innerHeight} recycle={false} numberOfPieces={400} colors={['#e5b85c', '#d94132', '#6bb36b', '#5c8ab3', '#fff6e5']} style={{ zIndex: 9999, position: 'fixed', top: 0, left: 0 }} />}
      
      {amImpostor && (
        <div style={{ textAlign: 'center', marginBottom: '24px', zIndex: 100 }}>
          {iEscaped ? (
            <>
              <h2 style={{ fontFamily: 'var(--font-heading)', color: 'var(--brass)', fontSize: '48px', margin: '0 0 8px 0' }}>You Escaped!</h2>
              <p style={{ fontFamily: 'var(--font-code)', color: 'var(--brass)', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>No one guessed you</p>
            </>
          ) : (
            <>
              <h2 style={{ fontFamily: 'var(--font-heading)', color: 'var(--wax-red)', fontSize: '48px', margin: '0 0 8px 0' }}>Busted!</h2>
              <p style={{ fontFamily: 'var(--font-code)', color: 'var(--wax-red)', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>You were caught</p>
            </>
          )}
        </div>
      )}

      {!amImpostor && (
        <div style={{ textAlign: 'center', marginBottom: '24px', zIndex: 100 }}>
          {iCaughtAll ? (
            <>
              <h2 style={{ fontFamily: 'var(--font-heading)', color: 'var(--wax-green)', fontSize: '48px', margin: '0 0 8px 0' }}>
                {imposterUids.length > 1 ? "You Caught 'Em All!" : "You Caught The Impostor!"}
              </h2>
              <p style={{ fontFamily: 'var(--font-code)', color: 'var(--wax-green)', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>Sharp Eye, Detective</p>
            </>
          ) : iCaughtSome ? (
            <>
              <h2 style={{ fontFamily: 'var(--font-heading)', color: 'var(--brass)', fontSize: '48px', margin: '0 0 8px 0' }}>You Caught One!</h2>
              <p style={{ fontFamily: 'var(--font-code)', color: 'var(--brass)', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>But the other got away...</p>
            </>
          ) : (
            <>
              <h2 style={{ fontFamily: 'var(--font-heading)', color: 'var(--wax-red)', fontSize: '48px', margin: '0 0 8px 0' }}>You Were Fooled!</h2>
              <p style={{ fontFamily: 'var(--font-code)', color: 'var(--wax-red)', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>The Impostor Escaped</p>
            </>
          )}
        </div>
      )}

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
          const isImposter = imposterUids.includes(p.uid);
          const increment = roomState.lastScoreUpdates ? (roomState.lastScoreUpdates[p.uid] || 0) : 0;
          
          let stampClass = "";
          let stampText = "";
          let showDetectives = false;
          let detectives = [];

          if (isImposter) {
            const voters = getVotersForImposter(p.uid);
            const caughtByMe = !amImpostor && myPlayer && roomState.votes[myPlayer.uid]?.includes(p.uid);
            
            if (p.uid === myPlayer?.uid) {
               if (voters.length > 0) {
                 showDetectives = true;
                 detectives = voters;
               }
            } else {
               if (caughtByMe) {
                 stampClass = "caught-stamp";
                 stampText = "Caught";
               } else {
                 stampClass = "forger-stamp";
                 stampText = "Forger";
               }
            }
          }

          return (
            <div
              key={p.uid}
              className={`reveal-card-sketch ${isImposter ? "forger" : ""}`}
            >
              {isImposter && stampText && <div className={`stamp ${stampClass}`}>{stampText}</div>}

              <div className="seal" style={{ backgroundColor: p.color }}></div>
              <div className="artist-title">{p.name}</div>
              <div className="artist-points">{increment >= 0 ? `+${increment}` : increment} PTS</div>

              {showDetectives && (
                <div className="detectives-list" style={{ marginTop: 'auto', paddingTop: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <p style={{ fontSize: '10px', color: 'var(--bone-muted)', margin: '0 0 6px 0', fontFamily: 'var(--font-code)', textTransform: 'uppercase' }}>Caught By:</p>
                  <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    {detectives.map(det => (
                      <div key={det.uid} className="seal" style={{ backgroundColor: det.color, width: '16px', height: '16px', margin: 0 }} title={det.name} />
                    ))}
                  </div>
                </div>
              )}
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
          <>
            <Button onClick={handleNewGame}>Play Again (Same Room)</Button>
            <Button variant="danger" onClick={() => socket.emit("GAME_END")}>End Game</Button>
          </>
        ) : (
          <p className="waiting-msg">Waiting for host to start a new game...</p>
        )}
      </div>
    </div>
  );
}
