// Game-specific audio synthesizer using Web Audio API
// Extends the base audio system with rhythm game sounds

let audioCtx: AudioContext | null = null;

const initAudio = () => {
  if (!audioCtx && typeof window !== "undefined") {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  return audioCtx;
};

// Helper to create oscillator with envelope
const createTone = (
  freq: number,
  type: OscillatorType,
  duration: number,
  volume: number = 0.1,
  attack: number = 0.01,
  decay: number = 0.1
) => {
  const ctx = initAudio();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime);

  // ADSR envelope
  gain.gain.setValueAtTime(0, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + attack);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start();
  osc.stop(ctx.currentTime + duration);
};

// Perfect hit - bright major chord arpeggio
export const playPerfectSound = () => {
  const ctx = initAudio();
  if (!ctx) return;

  // C major chord: C5, E5, G5
  createTone(523.25, "sine", 0.15, 0.08); // C5
  setTimeout(() => createTone(659.25, "sine", 0.12, 0.06), 30); // E5
  setTimeout(() => createTone(783.99, "sine", 0.1, 0.05), 60); // G5
  setTimeout(() => createTone(1046.5, "sine", 0.2, 0.04), 90); // C6
};

// Great hit - two-note chord
export const playGreatSound = () => {
  createTone(440, "sine", 0.12, 0.07); // A4
  setTimeout(() => createTone(554.37, "sine", 0.1, 0.05), 40); // C#5
};

// Good hit - single tone
export const playGoodSound = () => {
  createTone(329.63, "triangle", 0.1, 0.06); // E4
};

// Miss - low dissonant sound
export const playMissSound = () => {
  const ctx = initAudio();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(80, ctx.currentTime);
  osc.frequency.linearRampToValueAtTime(60, ctx.currentTime + 0.2);

  gain.gain.setValueAtTime(0.08, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start();
  osc.stop(ctx.currentTime + 0.3);
};

// Combo milestone sound (every 10 combo)
export const playComboSound = (combo: number) => {
  const ctx = initAudio();
  if (!ctx) return;

  // Pitch increases with combo level
  const baseFreq = 400 + Math.min(combo, 100) * 5;
  
  createTone(baseFreq, "square", 0.08, 0.04);
  setTimeout(() => createTone(baseFreq * 1.5, "square", 0.06, 0.03), 50);
  setTimeout(() => createTone(baseFreq * 2, "square", 0.05, 0.02), 100);
};

// Beat/metronome sound
export const playBeatSound = (isDownbeat: boolean = false) => {
  const freq = isDownbeat ? 1000 : 800;
  const vol = isDownbeat ? 0.04 : 0.02;
  createTone(freq, "sine", 0.05, vol);
};

// Game start fanfare
export const playStartSound = () => {
  const ctx = initAudio();
  if (!ctx) return;

  // Rising arpeggio
  const notes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
  notes.forEach((freq, i) => {
    setTimeout(() => createTone(freq, "sine", 0.2, 0.06), i * 100);
  });
};

// Game over sound
export const playGameOverSound = () => {
  const ctx = initAudio();
  if (!ctx) return;

  // Descending minor arpeggio
  const notes = [523.25, 415.30, 311.13, 261.63]; // C5, G#4, Eb4, C4
  notes.forEach((freq, i) => {
    setTimeout(() => createTone(freq, "sawtooth", 0.3, 0.05), i * 150);
  });
};

// Countdown beep (3, 2, 1)
export const playCountdownSound = (count: number) => {
  const freq = count === 0 ? 880 : 440; // Higher pitch for "GO!"
  const duration = count === 0 ? 0.3 : 0.15;
  createTone(freq, "sine", duration, 0.08);
};

// Background rhythm generator
let bgmInterval: ReturnType<typeof setInterval> | null = null;
let beatCount = 0;

export const startBGM = (bpm: number) => {
  stopBGM();
  
  const beatInterval = (60 / bpm) * 1000;
  beatCount = 0;
  
  bgmInterval = setInterval(() => {
    const isDownbeat = beatCount % 4 === 0;
    playBeatSound(isDownbeat);
    beatCount++;
  }, beatInterval);
};

export const stopBGM = () => {
  if (bgmInterval) {
    clearInterval(bgmInterval);
    bgmInterval = null;
  }
  beatCount = 0;
};

// Master volume control
export const setMasterVolume = (volume: number) => {
  const ctx = initAudio();
  if (!ctx) return;
  
  // Note: For proper volume control, we'd need a master gain node
  // This is a simplified version
  console.log("Volume set to:", volume);
};

