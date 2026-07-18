import React, { createContext, useContext, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

const PlayerSessionContext = createContext(null);

export const usePlayerSession = () => useContext(PlayerSessionContext);

/**
 * Manages the user's persistent UID in localStorage.
 * Ensures the same user can reconnect to a session.
 */
export function PlayerSessionProvider({ children }) {
  const [uid, setUid] = useState(null);

  useEffect(() => {
    let storedUid = localStorage.getItem('strokelier_uid');
    if (!storedUid) {
      storedUid = uuidv4();
      localStorage.setItem('strokelier_uid', storedUid);
    }
    setUid(storedUid);
  }, []);

  if (!uid) {
    return null; // Wait until UID is loaded/generated before rendering app
  }

  return (
    <PlayerSessionContext.Provider value={{ uid }}>
      {children}
    </PlayerSessionContext.Provider>
  );
}
