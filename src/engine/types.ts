export type ModeId = 'speedMath' | 'visualMemory' | 'piChallenge';

export type Phase = 'idle' | 'countdown' | 'show' | 'input' | 'feedback' | 'next' | 'gameover';

/** Side-effect descriptors the screen can react to (sound, haptics, analytics). */
export type GameEvent =
  | { type: 'correct'; points: number }
  | { type: 'wrong' }
  | { type: 'timeout' }
  | { type: 'lostLife'; lives: number }
  | { type: 'multiplierUp'; multiplier: number }
  | { type: 'gameover' };

export type MissKind = 'wrong' | 'timeout';
