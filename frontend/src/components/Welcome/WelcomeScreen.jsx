import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Wifi, WifiOff } from "lucide-react";
import Button from "../common/Button";
import StrokeDivider from "../common/StrokeDivider";
import { usePlayerSession } from "../../context/PlayerSessionContext";
import "../../styles/Welcome/WelcomeScreen.css";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";

const BouncingDots = () => (
  <div className="bouncing-dots">
    <div className="dot"></div>
    <div className="dot"></div>
    <div className="dot"></div>
  </div>
);

export default function WelcomeScreen() {
  const navigate = useNavigate();
  const { uid } = usePlayerSession();
  const [name, setName] = useState(
    localStorage.getItem("strokelier_name") || "",
  );
  const [roomCode, setRoomCode] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(null); // null, 'creating', 'joining'
  const [serverStatus, setServerStatus] = useState('checking'); // 'checking', 'online', 'offline'
  const [showStatusText, setShowStatusText] = useState(true);

  useEffect(() => {
    let isMounted = true;
    let pollInterval;

    const checkHealth = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/health`);
        if (res.ok) {
          if (isMounted) setServerStatus('online');
          clearInterval(pollInterval);
        } else {
          throw new Error('Not ok');
        }
      } catch (err) {
        if (isMounted) setServerStatus('offline');
      }
    };

    checkHealth();
    pollInterval = setInterval(checkHealth, 3000);

    return () => {
      isMounted = false;
      clearInterval(pollInterval);
    };
  }, []);

  useEffect(() => {
    let timer;
    if (serverStatus === 'online') {
      setShowStatusText(true);
      timer = setTimeout(() => {
        setShowStatusText(false);
      }, 2000);
    } else {
      setShowStatusText(true);
    }
    return () => clearTimeout(timer);
  }, [serverStatus]);

  const handleStatusClick = () => {
    if (serverStatus === 'online') {
      setShowStatusText(true);
      setTimeout(() => setShowStatusText(false), 2000);
    }
  };

  const handleNameChange = (e) => {
    setName(e.target.value);
    localStorage.setItem("strokelier_name", e.target.value);
  };

  const handleCreateGame = async () => {
    if (!name.trim()) {
      setError("Please enter a name first.");
      return;
    }

    setIsSubmitting('creating');
    setError("");

    try {
      const res = await fetch(`${BACKEND_URL}/api/room/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid, name }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to create room");

      navigate(`/room/${data.roomCode}`);
    } catch (err) {
      setError(err.message);
      setIsSubmitting(null);
    }
  };

  const handleJoinGame = async () => {
    if (!name.trim()) {
      setError("Please enter a name first.");
      return;
    }

    const code = roomCode.trim().toUpperCase();
    if (code.length !== 6) {
      setError("Room code must be exactly 6 letters/digits.");
      return;
    }

    setIsSubmitting('joining');
    setError("");

    try {
      const res = await fetch(`${BACKEND_URL}/api/room/${code}/verify`);
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to join room");

      navigate(`/room/${code}`);
    } catch (err) {
      setError(err.message);
      setIsSubmitting(null);
    }
  };

  return (
    <div className="welcome-screen">
      <div 
        className={`server-status-indicator status-${serverStatus}`} 
        onClick={handleStatusClick}
      >
        {serverStatus === 'offline' || serverStatus === 'checking' ? <WifiOff size={16} /> : <Wifi size={16} />}
        <span className={`server-status-text ${!showStatusText ? 'hidden' : ''}`}>
          {serverStatus === 'checking' && 'Waking Server...'}
          {serverStatus === 'online' && 'Server Ready'}
          {serverStatus === 'offline' && 'Server Waking...'}
        </span>
      </div>

      <img 
        src="/logo.svg" 
        alt="Strokelier Stamp"
        style={{
          position: 'absolute',
          top: '32px',
          right: '32px',
          width: '120px',
          opacity: 0.15,
          transform: 'rotate(15deg)',
          filter: 'invert(1)'
        }}
      />

      <h1>STROKELIER</h1>
      <StrokeDivider color="var(--brass)" style={{ marginBottom: '16px', maxWidth: '300px' }} />
      <p className="tagline">
        ATELIER SESSION LEDGER // PHYSICAL INK PARAMETERS
      </p>

      <div className="action-form">
        <div className="input-group">
          <label>Your Alias</label>
          <input
            type="text"
            placeholder="Name..."
            value={name}
            onChange={handleNameChange}
            maxLength={20}
            disabled={!!isSubmitting}
          />
        </div>

        {error && (
          <div style={{ color: "var(--wax-red)", fontSize: "14px" }}>
            {error}
          </div>
        )}

        <div className="action-buttons">
          <Button
            onClick={handleCreateGame}
            disabled={!!isSubmitting || !name}
            variant="primary"
          >
            {isSubmitting === 'creating' ? <BouncingDots /> : 'Create Studio'}
          </Button>
        </div>

        <div className="input-group" style={{ marginTop: "24px" }}>
          <label>Access Code</label>
          <input
            type="text"
            placeholder="6-DIGIT CODE"
            value={roomCode}
            onChange={(e) =>
              setRoomCode(
                e.target.value
                  .replace(/[^A-Za-z0-9]/g, "")
                  .slice(0, 6)
                  .toUpperCase(),
              )
            }
            maxLength={6}
            disabled={!!isSubmitting}
          />
        </div>

        <div className="action-buttons">
          <Button
            onClick={handleJoinGame}
            disabled={!!isSubmitting || !name || roomCode.length !== 6}
            variant="secondary"
          >
            {isSubmitting === 'joining' ? <BouncingDots /> : 'Join Session'}
          </Button>
        </div>
      </div>
    </div>
  );
}

