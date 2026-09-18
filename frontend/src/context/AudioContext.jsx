import { createContext, useState, useEffect, useCallback } from 'react';
import soundEngine from '../audio/SoundEngine';

export const AudioContext = createContext(null);

export function AudioProvider({ children }) {
  const [isMuted, setIsMuted] = useState(soundEngine.isMuted);
  const [volume, setVolumeState] = useState(soundEngine.volume);

  useEffect(() => {
    // Unlock AudioContext on first user interaction to comply with browser autoplay policies
    const handleFirstGesture = () => {
      soundEngine.unlock();
      window.removeEventListener('pointerdown', handleFirstGesture);
      window.removeEventListener('keydown', handleFirstGesture);
      window.removeEventListener('touchstart', handleFirstGesture);
      window.removeEventListener('click', handleFirstGesture);
    };

    window.addEventListener('pointerdown', handleFirstGesture, { passive: true });
    window.addEventListener('keydown', handleFirstGesture, { passive: true });
    window.addEventListener('touchstart', handleFirstGesture, { passive: true });
    window.addEventListener('click', handleFirstGesture, { passive: true });

    return () => {
      window.removeEventListener('pointerdown', handleFirstGesture);
      window.removeEventListener('keydown', handleFirstGesture);
      window.removeEventListener('touchstart', handleFirstGesture);
      window.removeEventListener('click', handleFirstGesture);
    };
  }, []);

  const toggleMute = useCallback(() => {
    const next = soundEngine.toggleMute();
    setIsMuted(next);
  }, []);

  const setVolume = useCallback((val) => {
    soundEngine.setVolume(val);
    setVolumeState(soundEngine.volume);
  }, []);

  return (
    <AudioContext.Provider
      value={{
        sfx: soundEngine,
        isMuted,
        volume,
        toggleMute,
        setVolume,
      }}
    >
      {children}
    </AudioContext.Provider>
  );
}
