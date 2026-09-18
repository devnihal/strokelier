import { useContext } from 'react';
import { AudioContext } from '../context/AudioContext';

const noopSfx = {
  pencilDown: () => {},
  pencilDraw: () => {},
  pencilStop: () => {},
  pencilUp: () => {},
  strokeCommit: () => {},
  strokeRetry: () => {},
  screenTransition: () => {},
  countdownTick: () => {},
  countdownFinish: () => {},
  roleRevealImposter: () => {},
  roleRevealArtist: () => {},
  suspectSelect: () => {},
  voteCast: () => {},
  stampReveal: () => {},
  resultVictory: () => {},
  resultDefeat: () => {},
  colorSelect: () => {},
  warningBuzz: () => {},
  playerJoined: () => {},
  uiTap: () => {},
};

export function useAudio() {
  const context = useContext(AudioContext);
  if (!context) {
    return {
      sfx: noopSfx,
      isMuted: false,
      volume: 0.65,
      toggleMute: () => {},
      setVolume: () => {},
    };
  }
  return context;
}
