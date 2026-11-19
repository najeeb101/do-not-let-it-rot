import { useCallback, useEffect, useReducer, useRef } from 'react';
import { realClock } from '../engine/clock';
import type { GameEvent } from '../engine/types';

const TICK_MS = 50;

export type FinishedGame = {
  score: number;
  bestStreak: number;
  /** Pi only: how the run ended, for the game over detail line. */
  detail?: { typed: string; expected: string };
};

type CommonAction =
  | { type: 'start'; now: number; seed: number }
  | { type: 'tick'; now: number }
  | { type: 'pause'; now: number }
  | { type: 'resume'; now: number };

type BaseState = { phase: string; paused: boolean; score: number; bestStreak: number; events: GameEvent[] };

type Options<S, A> = {
  /** Map a key press to a reducer action, or null to ignore it. */
  keyAction?: (e: KeyboardEvent, now: number) => A | null;
  finished: (s: S) => FinishedGame;
  onFinish: (game: FinishedGame) => void;
  onQuit: () => void;
  /** Called for every new batch of engine events (sound, haptics). */
  onEvents?: (events: GameEvent[]) => void;
};

/**
 * Drives a pure mode reducer with the real clock: auto-start on mount, 50 ms
 * ticks, pause when the tab is hidden, Esc to pause, keyboard actions, and a
 * once-only finish when the game ends or the player quits.
 */
export function useRunner<S extends BaseState, A extends CommonAction | { type: string; now: number }>(
  reducer: (s: S, a: A) => S,
  initial: S,
  opts: Options<S, A>,
) {
  const [state, dispatch] = useReducer(reducer, initial);
  const optsRef = useRef(opts);
  useEffect(() => {
    optsRef.current = opts;
  });

  const send = useCallback((make: (now: number) => A) => dispatch(make(realClock.now())), []);
  const raw = useCallback((a: CommonAction) => dispatch(a as unknown as A), []);

  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    raw({ type: 'start', now: realClock.now(), seed: Math.floor(Math.random() * 4294967296) });
  }, [raw]);

  const pause = useCallback(() => raw({ type: 'pause', now: realClock.now() }), [raw]);
  const resume = useCallback(() => raw({ type: 'resume', now: realClock.now() }), [raw]);

  const live = state.phase !== 'idle' && state.phase !== 'gameover';

  useEffect(() => {
    if (!live || state.paused) return;
    const id = window.setInterval(() => raw({ type: 'tick', now: realClock.now() }), TICK_MS);
    return () => window.clearInterval(id);
  }, [live, state.paused, raw]);

  useEffect(() => {
    if (!live) return;
    const onHide = () => {
      if (document.hidden) pause();
    };
    document.addEventListener('visibilitychange', onHide);
    window.addEventListener('pagehide', pause);
    return () => {
      document.removeEventListener('visibilitychange', onHide);
      window.removeEventListener('pagehide', pause);
    };
  }, [live, pause]);

  useEffect(() => {
    if (!live) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === 'Escape') {
        pause();
        e.preventDefault();
        return;
      }
      const a = optsRef.current.keyAction?.(e, realClock.now());
      if (!a) return;
      dispatch(a);
      e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [live, pause]);

  useEffect(() => {
    if (state.events.length > 0) optsRef.current.onEvents?.(state.events);
  }, [state.events]);

  const finishedRef = useRef(false);
  const finishOnce = useCallback((s: S) => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    optsRef.current.onFinish(optsRef.current.finished(s));
  }, []);

  useEffect(() => {
    if (state.phase === 'gameover') finishOnce(state);
  }, [state, finishOnce]);

  /** Quit from the pause overlay: before play it just leaves, after it saves the game (D26). */
  const quit = useCallback(() => {
    if (state.phase === 'countdown' || state.phase === 'idle') optsRef.current.onQuit();
    else finishOnce(state);
  }, [state, finishOnce]);

  return { state, send, pause, resume, quit };
}
