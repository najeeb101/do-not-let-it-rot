/**
 * Synthesized sound effects (docs/DESIGN.md section 8). No audio files: short
 * oscillator envelopes through Web Audio. The context is created and resumed
 * on the first user gesture (browser autoplay rules).
 */
export type SoundName = 'tap' | 'correct' | 'wrong' | 'streak' | 'tick' | 'gameover' | 'newBest';

type Note = {
  freq: number;
  /** Start offset in seconds. */
  at: number;
  dur: number;
  type?: OscillatorType;
  gain?: number;
  /** Glide to this frequency over the note. */
  to?: number;
};

const LEVEL = 0.12;

const recipes: Record<SoundName, Note[]> = {
  tap: [{ freq: 330, at: 0, dur: 0.04, type: 'triangle', gain: 0.7 }],
  correct: [
    { freq: 523, at: 0, dur: 0.075, type: 'triangle' },
    { freq: 659, at: 0.075, dur: 0.09, type: 'triangle' },
  ],
  wrong: [{ freq: 220, at: 0, dur: 0.25, type: 'sawtooth', gain: 0.6, to: 110 }],
  streak: [
    { freq: 523, at: 0, dur: 0.08, type: 'triangle' },
    { freq: 659, at: 0.08, dur: 0.08, type: 'triangle' },
    { freq: 784, at: 0.16, dur: 0.1, type: 'triangle' },
  ],
  tick: [{ freq: 880, at: 0, dur: 0.03, type: 'square', gain: 0.35 }],
  gameover: [
    { freq: 392, at: 0, dur: 0.5, type: 'triangle', to: 130 },
    { freq: 110, at: 0.55, dur: 0.3, type: 'sine', gain: 1.2, to: 60 },
  ],
  newBest: [
    { freq: 523, at: 0, dur: 0.12, type: 'triangle' },
    { freq: 659, at: 0.12, dur: 0.12, type: 'triangle' },
    { freq: 784, at: 0.24, dur: 0.12, type: 'triangle' },
    { freq: 1047, at: 0.36, dur: 0.3, type: 'triangle' },
    { freq: 1568, at: 0.5, dur: 0.25, type: 'sine', gain: 0.4 },
  ],
};

let enabled = true;
let ctx: AudioContext | null = null;

export function setSoundEnabled(on: boolean): void {
  enabled = on;
}

function getCtx(): AudioContext | null {
  if (ctx) return ctx;
  const Ctor: typeof AudioContext | undefined =
    typeof window === 'undefined'
      ? undefined
      : (window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext);
  if (!Ctor) return null;
  try {
    ctx = new Ctor();
  } catch {
    ctx = null;
  }
  return ctx;
}

/** Create/resume the audio context. Call from a user gesture. */
export function unlockAudio(): void {
  const c = getCtx();
  if (c && c.state === 'suspended') void c.resume().catch(() => undefined);
}

/** Install one-shot listeners that unlock audio on the first tap or key. */
export function unlockAudioOnFirstGesture(): void {
  const handler = () => {
    unlockAudio();
    window.removeEventListener('pointerdown', handler);
    window.removeEventListener('keydown', handler);
  };
  window.addEventListener('pointerdown', handler);
  window.addEventListener('keydown', handler);
}

export function playSound(name: SoundName): void {
  if (!enabled) return;
  // Never create the context here: that can stall the main thread mid-round.
  const c = ctx;
  if (!c || c.state !== 'running') return;
  const t0 = c.currentTime;
  for (const n of recipes[name]) {
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = n.type ?? 'sine';
    const start = t0 + n.at;
    osc.frequency.setValueAtTime(n.freq, start);
    if (n.to) osc.frequency.exponentialRampToValueAtTime(n.to, start + n.dur);
    const peak = LEVEL * (n.gain ?? 1);
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(peak, start + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, start + n.dur);
    osc.connect(g).connect(c.destination);
    osc.start(start);
    osc.stop(start + n.dur + 0.02);
  }
}
