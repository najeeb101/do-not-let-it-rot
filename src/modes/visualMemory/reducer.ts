import { gameRules } from '../../config/gameRules';
import { createRng } from '../../engine/rng';
import { getMultiplier, scoreAttempt } from '../../engine/scoring';
import { streakOnCorrect, streakOnMiss } from '../../engine/streak';
import { isRotten, loseLife } from '../../engine/rot';
import { shiftDeadline } from '../../engine/session';
import type { GameEvent } from '../../engine/types';
import { generatePattern, getLevel } from './generator';

export type VmPhase = 'idle' | 'countdown' | 'intro' | 'show' | 'input' | 'feedback' | 'gameover';
export type VmResult = 'correct' | 'wrong' | 'timeout';

export type VmState = {
  phase: VmPhase;
  rngState: number;
  lives: number;
  score: number;
  streak: number;
  bestStreak: number;
  level: number;
  grid: number;
  pattern: number[];
  previousPattern: number[];
  /** Lit tiles the player has found this round. */
  found: number[];
  /** The unlit tile that failed the round, if any. */
  wrongTile: number | null;
  timerMs: number;
  /** When the current phase ends. */
  deadline: number;
  now: number;
  paused: boolean;
  pausedAt: number;
  result: VmResult | null;
  lastPoints: number;
  /** Recall time left when the round was resolved (for the frozen timer bar). */
  lastRemaining: number;
  fatal: boolean;
  events: GameEvent[];
};

export type VmAction =
  | { type: 'start'; now: number; seed: number }
  | { type: 'tick'; now: number }
  | { type: 'tap'; index: number; now: number }
  | { type: 'pause'; now: number }
  | { type: 'resume'; now: number };

const first = getLevel(1);

export const initialState: VmState = {
  phase: 'idle',
  rngState: 1,
  lives: gameRules.startingLives,
  score: 0,
  streak: 0,
  bestStreak: 0,
  level: 1,
  grid: first.grid,
  pattern: [],
  previousPattern: [],
  found: [],
  wrongTile: null,
  timerMs: first.recallTimeoutMs,
  deadline: 0,
  now: 0,
  paused: false,
  pausedAt: 0,
  result: null,
  lastPoints: 0,
  lastRemaining: 0,
  fatal: false,
  events: [],
};

export function currentMultiplier(s: VmState): number {
  return getMultiplier(s.streak);
}

/** Begin a round: new pattern for the current level, intro phase. */
function startRound(s: VmState, at: number): VmState {
  const lv = getLevel(s.level);
  const rng = createRng(s.rngState);
  const pattern = generatePattern(lv.grid, lv.lit, rng, s.previousPattern);
  return {
    ...s,
    phase: 'intro',
    rngState: rng.state(),
    grid: lv.grid,
    pattern,
    previousPattern: pattern,
    found: [],
    wrongTile: null,
    timerMs: lv.recallTimeoutMs,
    deadline: at + gameRules.roundIntroMs,
    result: null,
    lastPoints: 0,
    lastRemaining: lv.recallTimeoutMs,
    fatal: false,
    events: [],
  };
}

function miss(s: VmState, result: 'wrong' | 'timeout', at: number, wrongTile: number | null): VmState {
  const lives = loseLife(s.lives);
  const fatal = isRotten(lives);
  const streak = streakOnMiss({ streak: s.streak, bestStreak: s.bestStreak });
  return {
    ...s,
    phase: 'feedback',
    lives,
    streak: streak.streak,
    wrongTile,
    deadline: at + gameRules.wrongFeedbackMs + (fatal ? gameRules.gameOverDelayMs : 0),
    result,
    lastPoints: 0,
    lastRemaining: Math.max(0, s.deadline - at),
    fatal,
    events: [{ type: result === 'timeout' ? 'timeout' : 'wrong' }, { type: 'lostLife', lives }],
  };
}

function succeed(s: VmState, found: number[], at: number): VmState {
  const lit = s.pattern.length;
  const remaining = Math.max(0, s.deadline - at);
  const points = scoreAttempt(
    lit * gameRules.memoryPointsPerTile,
    s.streak,
    lit * gameRules.memoryTimeBonusPerTile,
    remaining,
    s.timerMs,
  );
  const streak = streakOnCorrect({ streak: s.streak, bestStreak: s.bestStreak });
  const events: GameEvent[] = [{ type: 'correct', points }];
  const after = getMultiplier(streak.streak);
  if (after > getMultiplier(s.streak)) events.push({ type: 'multiplierUp', multiplier: after });
  return {
    ...s,
    phase: 'feedback',
    found,
    score: s.score + points,
    streak: streak.streak,
    bestStreak: streak.bestStreak,
    level: s.level + 1,
    deadline: at + gameRules.correctFeedbackMs,
    result: 'correct',
    lastPoints: points,
    lastRemaining: remaining,
    fatal: false,
    events,
  };
}

/**
 * Resolve every deadline that has passed. Ticks expire at now >= deadline,
 * input actions only at now > deadline so an input exactly on time counts.
 */
function advance(s: VmState, now: number, inclusive: boolean): VmState {
  let cur = s;
  for (let guard = 0; guard < 12; guard++) {
    const due = inclusive ? now >= cur.deadline : now > cur.deadline;
    if (!due) break;
    const at = cur.deadline;
    if (cur.phase === 'countdown') {
      cur = startRound(cur, at);
    } else if (cur.phase === 'intro') {
      cur = { ...cur, phase: 'show', deadline: at + getLevel(cur.level).displayMs, events: [] };
    } else if (cur.phase === 'show') {
      cur = { ...cur, phase: 'input', deadline: at + cur.timerMs, events: [] };
    } else if (cur.phase === 'input') {
      cur = miss(cur, 'timeout', at, null);
    } else if (cur.phase === 'feedback') {
      cur = cur.fatal ? { ...cur, phase: 'gameover', events: [{ type: 'gameover' }] } : startRound(cur, at);
    } else break;
  }
  return { ...cur, now };
}

export function reducer(state: VmState, action: VmAction): VmState {
  switch (action.type) {
    case 'start':
      return {
        ...initialState,
        phase: 'countdown',
        rngState: action.seed >>> 0,
        deadline: action.now + gameRules.countdownMs,
        now: action.now,
      };
    case 'tick':
      if (state.paused || state.phase === 'idle' || state.phase === 'gameover') return state;
      return advance(state, action.now, true);
    case 'pause':
      if (state.paused || state.phase === 'idle' || state.phase === 'gameover') return state;
      return { ...state, paused: true, pausedAt: action.now, now: action.now };
    case 'resume': {
      if (!state.paused) return state;
      // A pause never changes how long the pattern is visible: restart the
      // intro/show phase in full (GAME_RULES section 5).
      let deadline = shiftDeadline(state.deadline, state.pausedAt, action.now) as number;
      if (state.phase === 'intro') deadline = action.now + gameRules.roundIntroMs;
      if (state.phase === 'show') deadline = action.now + getLevel(state.level).displayMs;
      return { ...state, paused: false, deadline, now: action.now };
    }
    case 'tap': {
      if (state.paused) return state;
      const s = advance(state, action.now, false);
      if (s.phase !== 'input' || action.index < 0 || action.index >= s.grid * s.grid) return s;
      if (s.found.includes(action.index)) return s;
      if (!s.pattern.includes(action.index)) return miss({ ...s, events: [] }, 'wrong', action.now, action.index);
      const found = [...s.found, action.index];
      if (found.length === s.pattern.length) return succeed({ ...s, events: [] }, found, action.now);
      return { ...s, found, events: [{ type: 'tap' }] };
    }
  }
}
