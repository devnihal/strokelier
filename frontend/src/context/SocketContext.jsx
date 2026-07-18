import React, { createContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { usePlayerSession } from './PlayerSessionContext';

export const SocketContext = createContext(null);

/**
 * Manages the Socket.IO connection to the backend.
 * Uses the PlayerSession's UID for persistent connection auth.
 */
export function SocketProvider({ children }) {
  const { uid } = usePlayerSession();
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Determine backend URL (fallback to localhost:3001 in dev)
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

    const newSocket = io(backendUrl, {
      auth: { uid },
      transports: ['websocket', 'polling'], // fallback support
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [uid]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
}
