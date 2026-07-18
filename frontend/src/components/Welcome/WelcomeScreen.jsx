import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlayerSession } from '../../context/PlayerSessionContext';
import Button from '../common/Button';
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
    <div className="wrap">
      <section className="welcome shape-prime">
        {/* Contextual Motif: Sketched Pen Nib & Splatter */}
        <svg className="doodle-illustration" style={{ top: '15px', left: '20px', width: '40px', height: '40px' }} viewBox="0 0 24 24" fill="none" stroke="var(--brass)" strokeWidth="1.2" strokeLinecap="round">
          <path d="M12 2L9 9v3h6V9l-3-7zM12 2v10M10 17c1 0 0 2 2 2s1-2 2-2" />
          <circle cx="6" cy="7" r="1" fill="var(--brass)"/>
          <circle cx="5" cy="12" r="0.7" fill="var(--brass)"/>
        </svg>

        <h2 className="label" style={{ justifyContent: 'center' }}>Welcome Atelier</h2>
        <h1 style={{ textAlign: 'center' }}>strokelier</h1>
        <svg className="stroke-underline" width="220" height="20" viewBox="0 0 220 20" style={{ display: 'block', margin: '8px auto 0' }}>
          <path d="M4 12 C 45 4, 75 16, 115 7 S 175 3, 216 13" fill="none" stroke="var(--brass)" strokeWidth="2.5" strokeLinecap="round"/>
        </svg>

        <input 
          className="name-input" 
          placeholder="ENTER ARTIST ALIAS" 
          value={name}
          onChange={handleNameChange}
          style={{ marginTop: '48px', marginBottom: '24px' }}
          disabled={isSubmitting}
        />
        
        {error && <div style={{ color: 'var(--wax-red)', textAlign: 'center', marginBottom: '16px', fontFamily: 'var(--font-ui)' }}>{error}</div>}

        <div className="plaque-row">
          <Button onClick={handleCreateGame} disabled={isSubmitting}>Open Atelier</Button>
        </div>

        <div className="join-row" style={{ marginTop: '24px', display: 'flex', gap: '16px', justifyContent: 'center' }}>
          <input 
            className="name-input code-input"
            placeholder="INVITE CODE" 
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            style={{ margin: 0, width: '160px' }}
            disabled={isSubmitting}
          />
          <Button onClick={handleJoinGame} disabled={isSubmitting} style={{ width: 'auto' }}>Join Drawing</Button>
        </div>
      </section>
    </div>
  );
}
