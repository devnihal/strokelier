import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../common/Button';
import { BACKEND_URL } from '../../config/api';
import '../../styles/Welcome/WelcomeScreen.css';

export default function WelcomeScreen() {
  const navigate = useNavigate();
  const [name, setName] = useState(localStorage.getItem('strokelier_name') || '');
  const [roomCode, setRoomCode] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleNameChange = (e) => {
    setName(e.target.value);
    localStorage.setItem('strokelier_name', e.target.value);
  };

  const handleCreateGame = async () => {
    if (!name.trim()) {
      setError('Please enter a name first.');
      return;
    }
    
    setIsSubmitting(true);
    setError('');

    try {
      const res = await fetch(`${BACKEND_URL}/api/room/create`, { method: 'POST' });
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
      <h1>STROKELIER</h1>
      <p className="tagline">ATELIER SESSION LEDGER // PHYSICAL INK PARAMETERS</p>
      
      <div className="action-form">
        <div className="input-group">
          <label>Your Alias</label>
          <input 
            type="text" 
            placeholder="Name..." 
            value={name}
            onChange={handleNameChange}
            maxLength={20}
            disabled={isSubmitting}
          />
        </div>

        {error && <div style={{ color: 'var(--wax-red)', fontSize: '14px' }}>{error}</div>}

        <div className="action-buttons">
          <Button onClick={handleCreateGame} disabled={isSubmitting || !name} variant="primary">
            Create Studio
          </Button>
        </div>

        <div className="input-group" style={{ marginTop: '24px' }}>
          <label>Access Code</label>
          <input 
            type="text" 
            placeholder="6-DIGIT CODE" 
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            maxLength={6}
            disabled={isSubmitting}
          />
        </div>

        <div className="action-buttons">
          <Button onClick={handleJoinGame} disabled={isSubmitting || !name || roomCode.length !== 6}>
            Join Studio
          </Button>
        </div>
      </div>
    </div>
  );
}
