import { useCallback, useEffect, useReducer } from 'react';
import { realClock } from '../engine/clock';
import { initialState, reducer } from '../modes/speedMath/reducer';

const TICK_MS = 50;

/** Drives the pure Speed Math reducer with the real clock. */
export function useSpeedMath() {
  const [state, dispatch] = useReducer(reducer, initialState);

  const start = useCallback(() => {
    const seed = Math.floor(Math.random() * 4294967296);
    dispatch({ type: 'start', now: realClock.now(), seed });
  }, []);

  const digit = useCallback((d: string) => dispatch({ type: 'digit', digit: d, now: realClock.now() }), []);
  const backspace = useCallback(() => dispatch({ type: 'backspace', now: realClock.now() }), []);
  const submit = useCallback(() => dispatch({ type: 'submit', now: realClock.now() }), []);
  const pause = useCallback(() => dispatch({ type: 'pause', now: realClock.now() }), []);
  const resume = useCallback(() => dispatch({ type: 'resume', now: realClock.now() }), []);

  const live = state.phase !== 'idle' && state.phase !== 'gameover';

  useEffect(() => {
    if (!live || state.paused) return;
    const id = window.setInterval(() => dispatch({ type: 'tick', now: realClock.now() }), TICK_MS);
    return () => window.clearInterval(id);
  }, [live, state.paused]);

  useEffect(() => {
    if (!live) return;
    const onHide = () => {
      if (document.hidden) dispatch({ type: 'pause', now: realClock.now() });
    };
    document.addEventListener('visibilitychange', onHide);
    window.addEventListener('blur', onHide);
    return () => {
      document.removeEventListener('visibilitychange', onHide);
      window.removeEventListener('blur', onHide);
    };
  }, [live]);

  useEffect(() => {
    if (!live) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (/^[0-9]$/.test(e.key)) digit(e.key);
      else if (e.key === 'Backspace') backspace();
      else if (e.key === 'Enter') submit();
      else if (e.key === 'Escape') pause();
      else return;
      e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [live, digit, backspace, submit, pause]);

  return { state, start, digit, backspace, submit, pause, resume };
}
