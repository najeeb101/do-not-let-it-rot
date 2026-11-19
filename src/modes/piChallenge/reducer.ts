import { gameRules } from '../../config/gameRules';
import { piDigits } from '../../config/piDigits';
import { shiftDeadline } from '../../engine/session';
import type { GameEvent } from '../../engine/types';
import { checkDigit, expectedDigit } from './checker';

export type PiPhase = 'idle' | 'countdown' | 'input' | 'ending' | 'gameover';
export type PiEnd = 'wrong' | 'time' | 'complete';

export type PiState = {
  phase: PiPhase;
  /** Digits typed correctly so far (after the "3."). */
  typed: string;
  /** True once the first digit has started the 30 s clock (D19). */
  started: boolean;
  /** Countdown end, then run end once started, then the end-hold end. */
  deadline: number;
  now: number;
  paused: boolean;
  pausedAt: number;
  endReason: PiEnd | null;
  /** Run time left when the run ended (frozen on the timer bar). */
  remainingAtEnd: number;
  /** The digit that ended the run (wrong ends only). */
  wrongDigit: string | null;
  expected: string | null;
  /** Score is the number of correct digits. */
  score: number;
  bestStreak: number;
  events: GameEvent[];
};

export type PiAction =
  | { type: 'start'; now: number; seed: number }
  | { type: 'tick'; now: number }
  | { type: 'digit'; digit: string; now: number }
  | { type: 'pause'; now: number }
  | { type: 'resume'; now: number };

export const initialState: PiState = {
  phase: 'idle',
  typed: '',
  started: false,
  deadline: 0,
  now: 0,
  paused: false,
  pausedAt: 0,
  endReason: null,
  remainingAtEnd: gameRules.piRunMs,
  wrongDigit: null,
  expected: null,
  score: 0,
  bestStreak: 0,
  events: [],
};

function end(s: PiState, reason: PiEnd, at: number, extra: Partial<PiState> = {}): PiState {
  const hold = reason === 'wrong' ? gameRules.piWrongHoldMs : gameRules.piTimeUpHoldMs;
  return {
    ...s,
    ...extra,
    phase: 'ending',
    endReason: reason,
    remainingAtEnd: s.started ? Math.max(0, s.deadline - at) : gameRules.piRunMs,
    deadline: at + hold,
    events: extra.events ?? [],
  };
}

/** Run-end and hold-end deadlines. Ticks expire at now >= deadline, input only at now > deadline. */
function advance(s: PiState, now: number, inclusive: boolean): PiState {
  let cur = s;
  for (let guard = 0; guard < 4; guard++) {
    const due = inclusive ? now >= cur.deadline : now > cur.deadline;
    if (!due) break;
    if (cur.phase === 'countdown') {
      cur = { ...cur, phase: 'input', started: false, deadline: 0, events: [] };
      break;
    }
    if (cur.phase === 'input' && cur.started) {
      cur = end(cur, 'time', cur.deadline);
    } else if (cur.phase === 'ending') {
      cur = { ...cur, phase: 'gameover', events: [{ type: 'gameover' }] };
    } else break;
  }
  return { ...cur, now };
}

export function reducer(state: PiState, action: PiAction): PiState {
  switch (action.type) {
    case 'start':
      return {
        ...initialState,
        phase: 'countdown',
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
      const running = state.phase === 'countdown' || state.phase === 'ending' || (state.phase === 'input' && state.started);
      const deadline = running ? (shiftDeadline(state.deadline, state.pausedAt, action.now) as number) : state.deadline;
      return { ...state, paused: false, deadline, now: action.now };
    }
    case 'digit': {
      if (state.paused) return state;
      if (!/^[0-9]$/.test(action.digit)) return state;
      const s = advance(state, action.now, false);
      if (s.phase !== 'input') return s;
      const first = !s.started;
      const run: PiState = first
        ? { ...s, started: true, deadline: action.now + gameRules.piRunMs }
        : s;
      const index = run.typed.length;
      if (!checkDigit(index, action.digit)) {
        return end(run, 'wrong', action.now, { wrongDigit: action.digit, expected: expectedDigit(index), events: [{ type: 'wrong' }] });
      }
      const typed = run.typed + action.digit;
      const next: PiState = { ...run, typed, score: typed.length, events: [{ type: 'tap' }] };
      return typed.length >= piDigits.length ? end(next, 'complete', action.now, { events: [{ type: 'tap' }] }) : next;
    }
  }
}
