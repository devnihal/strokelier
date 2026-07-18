import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocket } from '../../hooks/useSocket';
import { usePlayerSession } from '../../context/PlayerSessionContext';
import LobbyScreen from './LobbyScreen';
import CanvasScreen from './CanvasScreen';
import VotingScreen from './VotingScreen';
import ResultsScreen from './ResultsScreen';
import '../../styles/Room/RoomScreen.css';

/**
 * Main container for a specific room.
 * Connects to the room via Socket, holds room state, and renders 
 * either LobbyScreen or CanvasScreen based on state.
 */
export default function RoomScreen() {
  const { code } = useParams();
  const socket = useSocket();
  const { uid } = usePlayerSession();
  const navigate = useNavigate();

  const [roomState, setRoomState] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!socket || !code) return;

    const savedName = localStorage.getItem('strokelier_name') || 'Anonymous';

    // Request to join the room
    socket.emit('ROOM_JOIN', { roomCode: code, name: savedName }, (response) => {
      if (response.error) {
        setError(response.error);
      } else {
        setRoomState(response.state);
      }
    });

    // Listen for room updates
    const handleStateUpdate = (newState) => {
      setRoomState(newState);
    };

    socket.on('ROOM_STATE_UPDATE', handleStateUpdate);

    return () => {
      socket.emit('ROOM_LEAVE');
      socket.off('ROOM_STATE_UPDATE', handleStateUpdate);
    };
  }, [socket, code]);

  if (error) {
    return (
      <div className="room-error">
        <h2>Cannot join room</h2>
        <p>{error}</p>
        <button onClick={() => navigate('/')}>Go Home</button>
      </div>
    );
  }

  if (!roomState) {
    return <div className="room-loading">Connecting to Atelier...</div>;
  }

  const isOwner = roomState.ownerUid === uid;
  const myPlayer = roomState.players[uid];

  const renderScreen = () => {
    switch (roomState.state) {
      case 'LOBBY':
        return <LobbyScreen roomState={roomState} isOwner={isOwner} myPlayer={myPlayer} socket={socket} />;
      case 'DRAWING':
        return <CanvasScreen roomState={roomState} myPlayer={myPlayer} socket={socket} />;
      case 'VOTING':
        return <VotingScreen roomState={roomState} myPlayer={myPlayer} socket={socket} />;
      case 'RESULTS':
        return <ResultsScreen roomState={roomState} myPlayer={myPlayer} socket={socket} />;
      default:
        return <div>Unknown game state.</div>;
    }
  };

  return (
    <div className="room-screen">
      {renderScreen()}
    </div>
  );
}
