// Web Audio API procedural sound engine for Strokelier
// Synthesizes tactile pencil, paper, stamp, and atelier sounds without external audio assets.

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.isMuted = localStorage.getItem('strokelier_muted') === 'true';
    const savedVol = localStorage.getItem('strokelier_volume');
    this.volume = savedVol !== null ? parseFloat(savedVol) : 0.65;

    this.isUnlocked = false;
    this.pencilNode = null;
    this.pencilGain = null;
    this.pencilFilter = null;
    this.noiseBuffer = null;
    this.lastPencilTime = 0;
  }

  // Lazy initialize AudioContext on first user interaction
  init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.createNoiseBuffer();
    } catch (e) {
      console.warn('Web Audio API not supported or failed to initialize:', e);
    }
  }

  // Unlock audio context on user gesture
  unlock() {
    this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().then(() => {
        this.isUnlocked = true;
      }).catch(() => {});
    } else if (this.ctx) {
      this.isUnlocked = true;
    }
  }

  // Pre-generate 2 seconds of pink/white noise for friction and rustle effects
  createNoiseBuffer() {
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    
    // Pink noise approximation for a warmer, more organic paper grain (used by rustles & stamps)
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    }
    this.noiseBuffer = buffer;

    // Dedicated high-frequency pencil grain buffer for realistic graphite-on-paper rasp
    const grainBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const grainData = grainBuffer.getChannelData(0);
    let lastSample = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      // High-pass differentiation: emphasizes the 3.5kHz - 8kHz paper tooth rasp
      const highFreq = white - lastSample * 0.78;
      lastSample = white;
      // Micro-texture variation (irregular paper tooth)
      const textureVar = 0.75 + 0.25 * Math.sin(i * 0.003);
      grainData[i] = highFreq * textureVar * 0.3;
    }
    this.pencilGrainBuffer = grainBuffer;
  }

  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, vol));
    localStorage.setItem('strokelier_volume', this.volume.toString());
    if (this.masterGain && this.ctx && !this.isMuted) {
      this.masterGain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.02);
    }
  }

  setMuted(muted) {
    this.isMuted = !!muted;
    localStorage.setItem('strokelier_muted', this.isMuted.toString());
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime, 0.02);
    }
    if (this.isMuted) {
      this.pencilUp();
    }
  }

  toggleMute() {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  // --- Tactile Sound Synthesizers ---

  // 1. Pencil Down: Tiny, crisp pencil-lead contact tap (delicate paper touch)
  pencilDown() {
    this.unlock();
    if (!this.ctx || this.isMuted || !this.pencilGrainBuffer) return;
    const now = this.ctx.currentTime;

    const source = this.ctx.createBufferSource();
    source.buffer = this.pencilGrainBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(3600, now);
    filter.Q.setValueAtTime(1.8, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.12, now + 0.003);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.018);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    source.start(now);
    source.stop(now + 0.022);

    // Pre-arm the continuous scratch chain in silence so it responds instantly to motion
    this.startPencilScratchNode();
  }

  startPencilScratchNode() {
    if (!this.ctx || this.isMuted || !this.pencilGrainBuffer) return;
    if (this.pencilNode) {
      try { this.pencilNode.stop(); } catch (e) {}
    }
    const now = this.ctx.currentTime;
    const source = this.ctx.createBufferSource();
    source.buffer = this.pencilGrainBuffer;
    source.loop = true;

    // Filter 1: Highpass at 2800 Hz to cut out all hollow low/mid wind drone
    const hp = this.ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.setValueAtTime(2800, now);

    // Filter 2: Bandpass at 4800 Hz sculpting the signature tactile graphite-on-paper rasp
    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(4800, now);
    bp.Q.setValueAtTime(1.6, now);

    // Gain node: begins in complete silence
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);

    source.connect(hp);
    hp.connect(bp);
    bp.connect(gain);
    gain.connect(this.masterGain);

    source.start(now);

    this.pencilNode = source;
    this.pencilFilter = bp;
    this.pencilGain = gain;
  }

  // 2. Pencil Draw: Only sounds when pen is actively moving; silences immediately when stationary!
  pencilDraw(speed = 0.05) {
    this.unlock();
    if (!this.ctx || this.isMuted || !this.pencilGrainBuffer) return;
    const now = this.ctx.currentTime;

    if (!this.pencilNode || !this.pencilGain) {
      this.startPencilScratchNode();
    }

    if (this.pencilGain && this.pencilFilter) {
      // Scale gain organically with hand displacement speed (clamp between whisper 0.04 and crisp rasp 0.22)
      const targetGain = Math.min(0.22, Math.max(0.04, speed * 4.2));

      // Dynamic frequency shift based on hand speed
      const baseFreq = 4400 + Math.min(1600, speed * 22000);
      const wobble = baseFreq + (Math.random() * 500 - 250);

      this.pencilFilter.frequency.cancelScheduledValues(now);
      this.pencilFilter.frequency.setValueAtTime(wobble, now);

      // Instant attack as long as pointer is moving
      this.pencilGain.gain.cancelScheduledValues(now);
      this.pencilGain.gain.setValueAtTime(targetGain, now);

      // CRITICAL: Rapid auto-decay curve down to silence within ~35ms.
      // If movement stops mid-drawing (cursor pauses), no new pointermove events fire,
      // and this decay immediately silences the sound.
      this.pencilGain.gain.setTargetAtTime(0.0001, now + 0.012, 0.015);
    }
  }

  pencilStop() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    if (this.pencilGain) {
      this.pencilGain.gain.cancelScheduledValues(now);
      this.pencilGain.gain.setValueAtTime(0.0001, now);
    }
  }

  // 3. Pencil Up: Immediately silences scratch and plays soft lift click
  pencilUp() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    this.pencilStop();

    if (this.pencilNode) {
      const oldNode = this.pencilNode;
      setTimeout(() => {
        try { if (oldNode) oldNode.stop(); } catch (e) {}
      }, 30);
      this.pencilNode = null;
      this.pencilFilter = null;
      this.pencilGain = null;
    }

    // Soft lift release
    if (!this.isMuted && this.pencilGrainBuffer) {
      const source = this.ctx.createBufferSource();
      source.buffer = this.pencilGrainBuffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(3600, now);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.016);

      source.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);
      source.start(now);
      source.stop(now + 0.02);
    }
  }

  // 4. Stroke Commit: Satisfying physical ink seal / stamp confirmation
  strokeCommit() {
    this.unlock();
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    // Body thud
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.08);

    const oscGain = this.ctx.createGain();
    oscGain.gain.setValueAtTime(0.4, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(oscGain);
    oscGain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.13);

    // Ink slap texture
    if (this.noiseBuffer) {
      const source = this.ctx.createBufferSource();
      source.buffer = this.noiseBuffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(900, now);
      filter.Q.setValueAtTime(1.8, now);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.2, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

      source.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.masterGain);
      source.start(now);
      source.stop(now + 0.08);
    }
  }

  // 5. Stroke Retry / Erase: Quick paper rustle & sweep
  strokeRetry() {
    this.unlock();
    if (!this.ctx || this.isMuted || !this.noiseBuffer) return;
    const now = this.ctx.currentTime;

    const source = this.ctx.createBufferSource();
    source.buffer = this.noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2600, now);
    filter.frequency.exponentialRampToValueAtTime(700, now + 0.14);
    filter.Q.setValueAtTime(1.2, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.3, now + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    source.start(now);
    source.stop(now + 0.18);
  }

  // 6. Paper Rustle / Screen Transition: Atelier paper shifting
  screenTransition() {
    this.unlock();
    if (!this.ctx || this.isMuted || !this.noiseBuffer) return;
    const now = this.ctx.currentTime;

    const source = this.ctx.createBufferSource();
    source.buffer = this.noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(800, now);
    filter.frequency.linearRampToValueAtTime(2200, now + 0.12);
    filter.frequency.linearRampToValueAtTime(900, now + 0.26);
    filter.Q.setValueAtTime(1.1, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.24, now + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    source.start(now);
    source.stop(now + 0.3);
  }

  // 7. Countdown Tick: Woody antique clock pulse
  countdownTick() {
    this.unlock();
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(850, now);
    osc.frequency.exponentialRampToValueAtTime(320, now + 0.025);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.04);
  }

  // 8. Countdown Finish / Gong: Resonant brass gong
  countdownFinish() {
    this.unlock();
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    const freqs = [196, 294, 392, 587]; // G3 chord harmonics
    freqs.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      osc.type = idx === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      const gain = this.ctx.createGain();
      const initialGain = 0.28 / (idx + 1);
      gain.gain.setValueAtTime(initialGain, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2 - idx * 0.15);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 1.3);
    });
  }

  // 9. Role Reveal - Imposter: Suspenseful low drone
  roleRevealImposter() {
    this.unlock();
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    // Beating detuned low drone
    [62, 65.5].forEach((freq) => {
      const osc = this.ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(140, now);
      filter.frequency.linearRampToValueAtTime(340, now + 0.7);
      filter.frequency.exponentialRampToValueAtTime(100, now + 1.8);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.35, now + 0.25);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.9);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 2.0);
    });
  }

  // 10. Role Reveal - Artist: Uplifting warm bell chime
  roleRevealArtist() {
    this.unlock();
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    // Ascending major chord (C5, E5, G5)
    const notes = [523.25, 659.25, 783.99];
    notes.forEach((freq, i) => {
      const startTime = now + i * 0.11;
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.linearRampToValueAtTime(0.26, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.75);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(startTime);
      osc.stop(startTime + 0.8);
    });
  }

  // 11. Suspect Select: Card tap
  suspectSelect() {
    this.unlock();
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(180, now + 0.035);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.045);
  }

  // 12. Vote Cast: Heavy wax seal stamp & gavel thud
  voteCast() {
    this.unlock();
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    // Heavy bass punch
    const subOsc = this.ctx.createOscillator();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(130, now);
    subOsc.frequency.exponentialRampToValueAtTime(32, now + 0.15);

    const subGain = this.ctx.createGain();
    subGain.gain.setValueAtTime(0.55, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    subOsc.connect(subGain);
    subGain.connect(this.masterGain);
    subOsc.start(now);
    subOsc.stop(now + 0.24);

    // Wax seal crackle / impact transient
    if (this.noiseBuffer) {
      const source = this.ctx.createBufferSource();
      source.buffer = this.noiseBuffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1200, now);
      filter.Q.setValueAtTime(2.0, now);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.3, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

      source.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.masterGain);
      source.start(now);
      source.stop(now + 0.07);
    }
  }

  // 13. Stamp Reveal: Heavy "Caught" / "Forger" physical stamp impact
  stampReveal() {
    this.voteCast();
  }

  // 14. Victory: Celebratory warm atelier fanfare
  resultVictory() {
    this.unlock();
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    // Major celebratory chords (F4, A4, C5, F5)
    const chords = [
      { note: 349.23, time: 0 },
      { note: 440.00, time: 0.12 },
      { note: 523.25, time: 0.24 },
      { note: 698.46, time: 0.38, sustain: 1.1 }
    ];

    chords.forEach(({ note, time, sustain = 0.6 }) => {
      const startTime = now + time;
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(note, startTime);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.linearRampToValueAtTime(0.28, startTime + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + sustain);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(startTime);
      osc.stop(startTime + sustain + 0.05);
    });
  }

  // 15. Defeat: Melancholic subtle descending minor motif
  resultDefeat() {
    this.unlock();
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    const notes = [
      { note: 440.00, time: 0 },
      { note: 392.00, time: 0.22 },
      { note: 329.63, time: 0.48, sustain: 0.9 }
    ];

    notes.forEach(({ note, time, sustain = 0.5 }) => {
      const startTime = now + time;
      const osc = this.ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(note, startTime);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.linearRampToValueAtTime(0.25, startTime + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + sustain);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(startTime);
      osc.stop(startTime + sustain + 0.05);
    });
  }

  // 16. Color Select: Micro ink drop pop
  colorSelect() {
    this.unlock();
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(380, now);
    osc.frequency.exponentialRampToValueAtTime(620, now + 0.025);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.035);
  }

  // 17. Warning Buzz: Scribble vandalism alert
  warningBuzz() {
    this.unlock();
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(135, now);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.setValueAtTime(0.01, now + 0.08);
    gain.gain.setValueAtTime(0.25, now + 0.12);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.26);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.28);
  }

  // 18. Player Joined: Welcoming atelier entrance bell chime
  playerJoined() {
    this.unlock();
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    // Two warm bell notes (E5 659.25Hz -> A5 880Hz)
    const notes = [
      { freq: 659.25, time: 0 },
      { freq: 880.00, time: 0.11 }
    ];

    notes.forEach(({ freq, time }) => {
      const startTime = now + time;
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.linearRampToValueAtTime(0.22, startTime + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.65);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(startTime);
      osc.stop(startTime + 0.7);
    });
  }

  // 19. UI Tap: Crisp, subtle paper/wood click for buttons, toggles, and sliders
  uiTap() {
    this.unlock();
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(540, now);
    osc.frequency.exponentialRampToValueAtTime(220, now + 0.02);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.16, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.03);
  }
}

// Singleton instance
const soundEngine = new SoundEngine();

export default soundEngine;
