import { describe, expect, it } from 'vitest';
import { gameRules } from '../../config/gameRules';
import { piDigits } from '../../config/piDigits';
import { checkDigit, expectedDigit } from './checker';
import { initialState, reducer } from './reducer';
import type { PiState } from './reducer';

/** pi to `n` decimals as a string, via Machin: pi = 16 arccot(5) - 4 arccot(239), BigInt fixed point. */
function computePi(n: number): string {
  const guard = 30;
  const one = 10n ** BigInt(n + guard);
  const arccot = (x: number): bigint => {
    const X = BigInt(x);
    const x2 = X * X;
    let term = one / X;
    let sum = term;
    let k = 1n;
    let sign = -1n;
    while (term > 0n) {
      term /= x2;
      k += 2n;
      sum += sign * (term / k);
      sign = -sign;
    }
    return sum;
  };
  const pi = 16n * arccot(5) - 4n * arccot(239);
  return pi.toString().slice(1, 1 + n);
}

describe('stored pi digits', () => {
  it('has at least 1000 digits', () => {
    expect(piDigits.length).toBeGreaterThanOrEqual(gameRules.piMinDigits);
    expect(piDigits).toMatch(/^[0-9]+$/);
  });

  it('matches an independent Machin computation', () => {
    expect(piDigits).toBe(computePi(piDigits.length));
  });

  it('starts and has known landmarks', () => {
    expect(piDigits.slice(0, 50)).toBe('14159265358979323846264338327950288419716939937510');
    expect(piDigits[99]).toBe('9');
  });
});

describe('checker', () => {
  it('checks digits by position', () => {
    expect(checkDigit(0, '1')).toBe(true);
    expect(checkDigit(1, '1')).toBe(false);
    expect(expectedDigit(2)).toBe('1');
    expect(expectedDigit(piDigits.length)).toBeNull();
    expect(expectedDigit(-1)).toBeNull();
  });
});

const { countdownMs, piRunMs, piWrongHoldMs, piTimeUpHoldMs } = gameRules;

function ready(): PiState {
  let s = reducer(initialState, { type: 'start', now: 0, seed: 1 });
  s = reducer(s, { type: 'tick', now: countdownMs });
  expect(s.phase).toBe('input');
  return s;
}

const type = (s: PiState, digits: string, now: number): PiState =>
  [...digits].reduce((cur, digit) => reducer(cur, { type: 'digit', digit, now }), s);

describe('pi reducer', () => {
  it('does not start the clock until the first digit (D19)', () => {
    let s = ready();
    s = reducer(s, { type: 'tick', now: countdownMs + 90_000 });
    expect(s.phase).toBe('input');
    expect(s.started).toBe(false);
    s = reducer(s, { type: 'digit', digit: '1', now: countdownMs + 90_000 });
    expect(s.started).toBe(true);
    expect(s.deadline).toBe(countdownMs + 90_000 + piRunMs);
  });

  it('counts correct digits as the score', () => {
    const s = type(ready(), '14159', 5000);
    expect(s.typed).toBe('14159');
    expect(s.score).toBe(5);
    expect(s.phase).toBe('input');
    expect(s.events).toEqual([{ type: 'tap' }]);
  });

  it('ends at the first wrong digit without counting it and reports the right one', () => {
    const s = type(ready(), '1415', 5000);
    const bad = reducer(s, { type: 'digit', digit: '5', now: 6000 });
    expect(bad.phase).toBe('ending');
    expect(bad.endReason).toBe('wrong');
    expect(bad.score).toBe(4);
    expect(bad.typed).toBe('1415');
    expect(bad.wrongDigit).toBe('5');
    expect(bad.expected).toBe('9');
    expect(bad.events).toEqual([{ type: 'wrong' }]);
    const after = reducer(bad, { type: 'digit', digit: '9', now: 6100 });
    expect(after.typed).toBe('1415');
    const over = reducer(bad, { type: 'tick', now: 6000 + piWrongHoldMs });
    expect(over.phase).toBe('gameover');
  });

  it('a wrong first digit ends the run with score 0', () => {
    const s = reducer(ready(), { type: 'digit', digit: '7', now: 2000 });
    expect(s.endReason).toBe('wrong');
    expect(s.score).toBe(0);
    expect(s.expected).toBe('1');
  });

  it('ends when the 30 s are up', () => {
    let s = type(ready(), '141', 2000);
    s = reducer(s, { type: 'tick', now: 2000 + piRunMs });
    expect(s.phase).toBe('ending');
    expect(s.endReason).toBe('time');
    expect(s.score).toBe(3);
    s = reducer(s, { type: 'tick', now: 2000 + piRunMs + piTimeUpHoldMs });
    expect(s.phase).toBe('gameover');
  });

  it('accepts a digit exactly on the deadline but not after', () => {
    const s = type(ready(), '1', 2000);
    const dl = 2000 + piRunMs;
    expect(reducer(s, { type: 'digit', digit: '4', now: dl }).typed).toBe('14');
    const late = reducer(s, { type: 'digit', digit: '4', now: dl + 1 });
    expect(late.typed).toBe('1');
    expect(late.endReason).toBe('time');
  });

  it('has no lives, backspace or multiplier: ignores non-digits', () => {
    const s = reducer(ready(), { type: 'digit', digit: 'x', now: 2000 });
    expect(s.started).toBe(false);
  });

  it('pause freezes the clock and resume shifts the deadline', () => {
    let s = type(ready(), '14', 2000);
    s = reducer(s, { type: 'pause', now: 10_000 });
    s = reducer(s, { type: 'tick', now: 99_000 });
    expect(s.phase).toBe('input');
    s = reducer(s, { type: 'resume', now: 50_000 });
    expect(s.deadline).toBe(2000 + piRunMs + 40_000);
  });

  it('pause before the first digit does not touch the unstarted clock', () => {
    let s = reducer(ready(), { type: 'pause', now: 3000 });
    s = reducer(s, { type: 'resume', now: 9000 });
    expect(s.started).toBe(false);
    expect(s.deadline).toBe(0);
  });

  it('ends as complete when every stored digit is typed', () => {
    let s = ready();
    s = type(s, piDigits, 3000);
    expect(s.endReason).toBe('complete');
    expect(s.score).toBe(piDigits.length);
  });
});
