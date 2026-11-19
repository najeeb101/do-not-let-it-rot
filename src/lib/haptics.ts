/** Vibration patterns in ms (docs/DESIGN.md section 9). Guarded: iOS has no Vibration API. */
export type HapticName = 'tap' | 'correct' | 'wrong' | 'streak' | 'gameover' | 'newBest';

const patterns: Record<HapticName, number | number[]> = {
  tap: 10,
  correct: 20,
  wrong: [60, 40, 60],
  streak: [15, 30, 15],
  gameover: 200,
  newBest: [30, 50, 30, 50, 80],
};

let enabled = true;

export function setVibrationEnabled(on: boolean): void {
  enabled = on;
}

export function vibrationSupported(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';
}

export function vibrate(name: HapticName): void {
  if (!enabled || !vibrationSupported()) return;
  try {
    navigator.vibrate(patterns[name]);
  } catch {
    /* ignore */
  }
}
