import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSocket } from "../../hooks/useSocket";
import { usePlayerSession } from "../../context/PlayerSessionContext";
import LobbyScreen from "./LobbyScreen";
import CanvasScreen from "./CanvasScreen";
import VotingScreen from "./VotingScreen";
import ResultsScreen from "./ResultsScreen";
import "../../styles/Room/RoomScreen.css";

function CountdownOverlay({ seconds, message, onComplete }) {
  const [count, setCount] = useState(seconds);

  useEffect(() => {
    if (count <= 0) {
      onComplete();
      return;
    }
    const timer = setTimeout(() => setCount((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [count, onComplete]);

  return (
    <div className="countdown-overlay">
      <div className="countdown-content">
        <p className="countdown-msg">{message}</p>
        <h1 className="countdown-number" key={count}>
          {count > 0 ? count : ""}
        </h1>
      </div>
    </div>
  );
}

export default function RoomScreen() {
  const { code } = useParams();
  const socket = useSocket();
  const { uid } = usePlayerSession();
  const navigate = useNavigate();

  const [roomState, setRoomState] = useState(null);
  const [error, setError] = useState(null);

  // Transition state
  const [displayedState, setDisplayedState] = useState(null);
  const [countdown, setCountdown] = useState(null); // { seconds, message, targetState }
  const [fadeClass, setFadeClass] = useState("fade-in");

  const [needsName, setNeedsName] = useState(false);
  const [tempName, setTempName] = useState('');

  useEffect(() => {
    if (!socket || !code) return;

    const savedName = localStorage.getItem("strokelier_name");
    
    if (!savedName) {
      setNeedsName(true);
      return;
    }

    joinRoom(savedName);
  }, [socket, code]);

  const joinRoom = (playerName) => {
    socket.emit(
      "ROOM_JOIN",
      { roomCode: code, name: playerName },
      (response) => {
        if (response.error) {
          setError(response.error);
        } else {
          setRoomState(response.state);
          setDisplayedState(response.state.state);
        }
      }
    );
  };

  const handleNameSubmit = (e) => {
    e.preventDefault();
    if (tempName.trim()) {
      localStorage.setItem("strokelier_name", tempName.trim());
      setNeedsName(false);
      joinRoom(tempName.trim());
    }
  };

  useEffect(() => {
    if (!socket || !code) return;
    
    const handleStateUpdate = (newState) => {
      setRoomState((prev) => {
        if (!prev) return newState;

        // Check for state transitions to trigger countdowns
        if (prev.state === "LOBBY" && newState.state === "DRAWING") {
          setCountdown({
            seconds: 5,
            message: "GAME STARTS IN",
            targetState: "DRAWING",
          });
        } else if (prev.state === "DRAWING" && newState.state === "VOTING") {
          setCountdown({
            seconds: 3,
            message: "PREPARE TO ACCUSE",
            targetState: "VOTING",
          });
        } else if (prev.state === "VOTING" && newState.state === "RESULTS") {
          setCountdown({
            seconds: 3,
            message: "RESULTS IN",
            targetState: "RESULTS",
          });
        } else if (prev.state !== newState.state && !countdown) {
          // Normal crossfade for other state changes
          setFadeClass("fade-out");
          setTimeout(() => {
            setDisplayedState(newState.state);
            setFadeClass("fade-in");
          }, 300); // 300ms fade
        }
        return newState;
      });
    };

    socket.on("ROOM_STATE_UPDATE", handleStateUpdate);

    return () => {
      socket.emit("ROOM_LEAVE");
      socket.off("ROOM_STATE_UPDATE", handleStateUpdate);
    };
  }, [socket, code]);

  if (needsName) {
    return (
      <div className="room-screen" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ textAlign: 'center', width: '100%', maxWidth: '400px' }}>
          <h2 style={{ fontFamily: 'var(--font-heading)', color: 'var(--bone)', marginBottom: '16px' }}>Identify Yourself</h2>
          <p style={{ fontFamily: 'var(--font-ui)', color: 'var(--bone-muted)', marginBottom: '32px' }}>Joining Room {code}</p>
          <form onSubmit={handleNameSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <input 
              autoFocus
              className="name-input"
              style={{ margin: '0 auto', display: 'block', width: '100%', maxWidth: '280px', background: 'var(--studio-wall-alt)', border: '1px solid var(--hairline)', color: 'var(--bone)', fontFamily: 'var(--font-hand)', fontSize: '16px', padding: '12px 14px', textAlign: 'center', outline: 'none' }}
              placeholder="ENTER ARTIST ALIAS"
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
            />
            <button 
              type="submit"
              disabled={!tempName.trim()}
              style={{ fontFamily: 'var(--font-ui)', fontWeight: 500, fontSize: '14px', background: 'transparent', border: '1px solid var(--brass)', color: 'var(--brass)', padding: '14px 28px', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.05em', width: 'max-content', margin: '0 auto' }}
            >
              Enter Atelier
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="room-error">
        <h2>Cannot join room</h2>
        <p>{error}</p>
        <button onClick={() => navigate("/")} style={{ fontFamily: 'var(--font-ui)', fontWeight: 500, fontSize: '14px', background: 'transparent', border: '1px solid var(--brass)', color: 'var(--brass)', padding: '14px 28px', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Go Home</button>
      </div>
    );
  }

  if (!roomState || !displayedState) {
    return <div className="room-loading">Connecting to Atelier...</div>;
  }

  const isOwner = roomState.ownerUid === uid;
  const myPlayer = roomState.players[uid];

  const handleCountdownComplete = () => {
    setFadeClass("fade-out");
    setTimeout(() => {
      setDisplayedState(countdown.targetState);
      setCountdown(null);
      setFadeClass("fade-in");
    }, 300);
  };

  const renderScreen = () => {
    switch (displayedState) {
      case "LOBBY":
        return (
          <LobbyScreen
            roomState={roomState}
            isOwner={isOwner}
            myPlayer={myPlayer}
            socket={socket}
          />
        );
      case "DRAWING":
        return (
          <CanvasScreen
            roomState={roomState}
            myPlayer={myPlayer}
            socket={socket}
          />
        );
      case "VOTING":
        return (
          <VotingScreen
            roomState={roomState}
            myPlayer={myPlayer}
            socket={socket}
          />
        );
      case "RESULTS":
        return (
          <ResultsScreen
            roomState={roomState}
            myPlayer={myPlayer}
            socket={socket}
          />
        );
      default:
        return <div>Unknown game state.</div>;
    }
  };

  return (
    <div className="room-screen">
      <div className={`screen-transition-wrapper ${fadeClass}`}>
        {renderScreen()}
      </div>

      {countdown && (
        <CountdownOverlay
          seconds={countdown.seconds}
          message={countdown.message}
          onComplete={handleCountdownComplete}
        />
      )}
    </div>
  );
}
