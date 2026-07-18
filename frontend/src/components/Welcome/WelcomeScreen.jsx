import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlayerSession } from '../../context/PlayerSessionContext';
import Logo from '../common/Logo';
import StrokeDivider from '../common/StrokeDivider';
import Button from '../common/Button';
import Input from '../common/Input';
import '../../styles/Welcome/WelcomeScreen.css';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

export default function WelcomeScreen() {
  const { uid } = usePlayerSession();
  const navigate = useNavigate();
  
  const [name, setName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Restore name from local storage if available
  useEffect(() => {
    const savedName = localStorage.getItem('strokelier_name');
    if (savedName) setName(savedName);
  }, []);

  const handleNameChange = (e) => {
    setName(e.target.value);
    localStorage.setItem('strokelier_name', e.target.value);
    setError('');
  };

  const handleCreateGame = async () => {
    if (!name.trim()) {
      setError('Please enter a name first.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const res = await fetch(`${BACKEND_URL}/api/room/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid, name: name.trim() })
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Failed to create room');
      
      navigate(`/room/${data.roomCode}`);
    } catch (err) {
      setError(err.message);
      setIsSubmitting(false);
    }
  };

  const handleJoinGame = async () => {
    if (!name.trim()) {
      setError('Please enter a name first.');
      return;
    }
    
    const code = roomCode.trim();
    if (code.length !== 6) {
      setError('Room code must be 6 digits.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const res = await fetch(`${BACKEND_URL}/api/room/${code}/verify`);
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to join room');

      navigate(`/room/${code}`);
    } catch (err) {
      setError(err.message);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="welcome-screen">
      <h2 className="welcome-label">Welcome Atelier</h2>
      <Logo />
      <StrokeDivider />

      <div className="welcome-form">
        <div className="form-group">
          <label htmlFor="playerName">Your Name</label>
          <Input 
            id="playerName"
            type="text" 
            placeholder="e.g. Master Painter" 
            value={name}
            onChange={handleNameChange}
            maxLength={20}
            disabled={isSubmitting}
          />
        </div>

        {error && <div className="error-msg">{error}</div>}

        <div className="actions">
          <Button onClick={handleCreateGame} disabled={isSubmitting}>
            Create Game
          </Button>

          <StrokeDivider color="var(--ink-blue)" variant="flat" />

          <div className="join-group">
            <Input 
              type="text" 
              placeholder="000000" 
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              maxLength={6}
              disabled={isSubmitting}
            />
            <Button onClick={handleJoinGame} disabled={isSubmitting}>
              Join Game
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
