import { gameRules } from '../../config/gameRules';
import { createRng } from '../../engine/rng';
import { getMultiplier, scoreAttempt } from '../../engine/scoring';
import { streakOnCorrect, streakOnMiss } from '../../engine/streak';
import { isRotten, loseLife } from '../../engine/rot';
import { shiftDeadline } from '../../engine/session';
import type { GameEvent } from '../../engine/types';
import { generateQuestion, tierFor } from './generator';
import type { MathQuestion } from './generator';

export type SmPhase = 'idle' | 'countdown' | 'input' | 'feedback' | 'gameover';
export type SmResult = 'correct' | 'wrong' | 'timeout';

export type SmState = {
  phase: SmPhase;
  rngState: number;
  lives: number;
  score: number;
  streak: number;
  bestStreak: number;
  totalCorrect: number;
  question: MathQuestion | null;
  recent: string[];
  buffer: string;
  /** Timer length for the current question (ms). */
  timerMs: number;
  /** When the current phase ends: countdown end, question deadline, feedback end. */
  deadline: number;
  now: number;
  paused: boolean;
  pausedAt: number;
  result: SmResult | null;
  lastPoints: number;
  fatal: boolean;
  events: GameEvent[];
};

export type SmAction =
  | { type: 'start'; now: number; seed: number }
  | { type: 'tick'; now: number }
  | { type: 'digit'; digit: string; now: number }
  | { type: 'backspace'; now: number }
  | { type: 'submit'; now: number }
  | { type: 'pause'; now: number }
  | { type: 'resume'; now: number };

export const initialState: SmState = {
  phase: 'idle',
  rngState: 1,
  lives: gameRules.startingLives,
  score: 0,
  streak: 0,
  bestStreak: 0,
  totalCorrect: 0,
  question: null,
  recent: [],
  buffer: '',
  timerMs: gameRules.mathTimerMsByTier[0] as number,
  deadline: 0,
  now: 0,
  paused: false,
  pausedAt: 0,
  result: null,
  lastPoints: 0,
  fatal: false,
  events: [],
};

export function currentMultiplier(s: SmState): number {
  return getMultiplier(s.streak);
}

function askNext(s: SmState, at: number): SmState {
  const rng = createRng(s.rngState);
  const q = generateQuestion(rng, s.totalCorrect, s.recent);
  const timerMs = gameRules.mathTimerMsByTier[tierFor(s.totalCorrect)] as number;
  return {
    ...s,
    phase: 'input',
    rngState: rng.state(),
    question: q,
    recent: [...s.recent, q.key].slice(-gameRules.mathRecentMemory),
    buffer: '',
    timerMs,
    deadline: at + timerMs,
    result: null,
    lastPoints: 0,
    fatal: false,
    events: [],
  };
}

function enterFeedback(s: SmState, result: SmResult, at: number, points: number): SmState {
  if (result === 'correct') {
    const streak = streakOnCorrect({ streak: s.streak, bestStreak: s.bestStreak });
    const events: GameEvent[] = [{ type: 'correct', points }];
    const after = getMultiplier(streak.streak);
    if (after > getMultiplier(s.streak)) events.push({ type: 'multiplierUp', multiplier: after });
    return {
      ...s,
      phase: 'feedback',
      score: s.score + points,
      streak: streak.streak,
      bestStreak: streak.bestStreak,
      totalCorrect: s.totalCorrect + 1,
      deadline: at + gameRules.correctFeedbackMs,
      result,
      lastPoints: points,
      fatal: false,
      events,
    };
  }
  const lives = loseLife(s.lives);
  const fatal = isRotten(lives);
  const streak = streakOnMiss({ streak: s.streak, bestStreak: s.bestStreak });
  return {
    ...s,
    phase: 'feedback',
    lives,
    streak: streak.streak,
    deadline: at + gameRules.wrongFeedbackMs + (fatal ? gameRules.gameOverDelayMs : 0),
    result,
    lastPoints: 0,
    fatal,
    events: [{ type: result === 'timeout' ? 'timeout' : 'wrong' }, { type: 'lostLife', lives }],
  };
}

/**
 * Resolve every deadline that has passed. Ticks expire at now >= deadline,
 * input actions only at now > deadline so an input exactly on time counts.
 */
function advance(s: SmState, now: number, inclusive: boolean): SmState {
  let cur = s;
  for (let guard = 0; guard < 10; guard++) {
    const due = inclusive ? now >= cur.deadline : now > cur.deadline;
    if (!due) break;
    if (cur.phase === 'countdown') {
      cur = askNext(cur, cur.deadline);
    } else if (cur.phase === 'input') {
      cur = enterFeedback({ ...cur, buffer: '' }, 'timeout', cur.deadline, 0);
    } else if (cur.phase === 'feedback') {
      cur = cur.fatal
        ? { ...cur, phase: 'gameover', events: [{ type: 'gameover' }] }
        : askNext(cur, cur.deadline);
    } else break;
  }
  return { ...cur, now };
}

function submitBuffer(s: SmState, now: number): SmState {
  if (s.phase !== 'input' || !s.question || s.buffer === '') return s;
  if (Number(s.buffer) === s.question.answer) {
    const tier = tierFor(s.totalCorrect);
    const points = scoreAttempt(
      gameRules.mathBasePointsByTier[tier] as number,
      s.streak,
      gameRules.mathTimeBonusMaxByTier[tier] as number,
      s.deadline - now,
      s.timerMs,
    );
    return enterFeedback(s, 'correct', now, points);
  }
  return enterFeedback(s, 'wrong', now, 0);
}

export function reducer(state: SmState, action: SmAction): SmState {
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
    case 'resume':
      if (!state.paused) return state;
      return {
        ...state,
        paused: false,
        deadline: shiftDeadline(state.deadline, state.pausedAt, action.now) as number,
        now: action.now,
      };
    case 'digit': {
      if (state.paused) return state;
      const s = advance(state, action.now, false);
      if (s.phase !== 'input' || !s.question || !/^[0-9]$/.test(action.digit)) return s;
      let buffer = s.buffer === '0' ? action.digit : s.buffer + action.digit;
      if (buffer.length > gameRules.mathMaxAnswerDigits) buffer = s.buffer;
      const next = { ...s, buffer, events: [] };
      return Number(buffer) === s.question.answer ? submitBuffer(next, action.now) : next;
    }
    case 'backspace': {
      if (state.paused) return state;
      const s = advance(state, action.now, false);
      if (s.phase !== 'input') return s;
      return { ...s, buffer: s.buffer.slice(0, -1), events: [] };
    }
    case 'submit': {
      if (state.paused) return state;
      const s = advance(state, action.now, false);
      return submitBuffer({ ...s, events: [] }, action.now);
    }
  }
}
