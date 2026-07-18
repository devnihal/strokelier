import { useContext } from 'react';
import { SocketContext } from '../context/SocketContext';

/**
 * Custom hook to consume the Socket instance from context.
 * Returns the socket instance (or null if not yet connected).
 */
export function useSocket() {
  const socket = useContext(SocketContext);
  return socket;
}
