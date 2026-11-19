import { describe, expect, it } from 'vitest';
import { gameRules } from '../../config/gameRules';
import { createRng } from '../../engine/rng';
import { generatePattern, getLevel } from './generator';
import { initialState, reducer } from './reducer';
import type { VmState } from './reducer';

const L1 = getLevel(1);
const { countdownMs, roundIntroMs, wrongFeedbackMs, gameOverDelayMs } = gameRules;

/** Start a game at t=0 and tick to the beginning of the recall phase of round 1. */
function toInput(seed = 7): VmState {
  let s = reducer(initialState, { type: 'start', now: 0, seed });
  s = reducer(s, { type: 'tick', now: countdownMs });
  expect(s.phase).toBe('intro');
  s = reducer(s, { type: 'tick', now: countdownMs + roundIntroMs });
  expect(s.phase).toBe('show');
  s = reducer(s, { type: 'tick', now: countdownMs + roundIntroMs + L1.displayMs });
  expect(s.phase).toBe('input');
  return s;
}

const unlit = (s: VmState): number =>
  Array.from({ length: s.grid * s.grid }, (_, i) => i).find((i) => !s.pattern.includes(i)) as number;

function tapAll(s: VmState, now: number): VmState {
  let cur = s;
  for (const index of s.pattern) cur = reducer(cur, { type: 'tap', index, now });
  return cur;
}

/** Advance from a finished feedback phase to the next recall phase. */
function nextInput(s: VmState): VmState {
  let cur = reducer(s, { type: 'tick', now: s.deadline });
  expect(cur.phase).toBe('intro');
  cur = reducer(cur, { type: 'tick', now: cur.deadline });
  expect(cur.phase).toBe('show');
  cur = reducer(cur, { type: 'tick', now: cur.deadline });
  expect(cur.phase).toBe('input');
  return cur;
}

describe('levels', () => {
  it('follows the table and reuses the last row', () => {
    expect(getLevel(1)).toEqual({ grid: 3, lit: 3, displayMs: 1500, recallTimeoutMs: 10000 });
    expect(getLevel(8).grid).toBe(5);
    expect(getLevel(14).displayMs).toBe(800);
    expect(getLevel(99)).toEqual(getLevel(14));
    expect(getLevel(0)).toEqual(getLevel(1));
  });

  it('never shows the pattern for less than 800 ms', () => {
    for (const row of gameRules.memoryLevels) expect(row.displayMs).toBeGreaterThanOrEqual(800);
  });
});

describe('patterns', () => {
  it('are seeded, sorted, distinct and in range', () => {
    for (let seed = 1; seed <= 100; seed++) {
      for (const lv of gameRules.memoryLevels) {
        const p = generatePattern(lv.grid, lv.lit, createRng(seed));
        expect(p).toEqual(generatePattern(lv.grid, lv.lit, createRng(seed)));
        expect(p).toHaveLength(lv.lit);
        expect(new Set(p).size).toBe(lv.lit);
        expect([...p].sort((a, b) => a - b)).toEqual(p);
        expect(Math.min(...p)).toBeGreaterThanOrEqual(0);
        expect(Math.max(...p)).toBeLessThan(lv.grid * lv.grid);
      }
    }
  });

  it('avoid repeating the previous pattern', () => {
    let repeats = 0;
    for (let seed = 1; seed <= 300; seed++) {
      const prev = generatePattern(3, 3, createRng(seed));
      const next = generatePattern(3, 3, createRng(seed), prev);
      if (next.join() === prev.join()) repeats++;
    }
    expect(repeats).toBe(0);
  });
});

describe('visual memory reducer', () => {
  it('runs countdown, intro, show, then recall', () => {
    const s = toInput();
    expect(s.pattern).toHaveLength(L1.lit);
    expect(s.found).toEqual([]);
  });

  it('scores a perfect round with the time bonus and advances the level', () => {
    const t = countdownMs + roundIntroMs + L1.displayMs;
    const s = tapAll(toInput(), t);
    expect(s.phase).toBe('feedback');
    expect(s.result).toBe('correct');
    expect(s.lastPoints).toBe(L1.lit * 10 + L1.lit * 5);
    expect(s.level).toBe(2);
    expect(s.streak).toBe(1);
    expect(s.lives).toBe(3);
  });

  it('ignores a tap on an already found tile', () => {
    const s = toInput();
    const t = countdownMs + roundIntroMs + L1.displayMs;
    const a = reducer(s, { type: 'tap', index: s.pattern[0] as number, now: t });
    const b = reducer(a, { type: 'tap', index: s.pattern[0] as number, now: t });
    expect(b.found).toEqual(a.found);
    expect(b.lives).toBe(3);
  });

  it('fails the round on one wrong tap, costs a life, and repeats the level with a new pattern', () => {
    const s0 = toInput();
    const t = countdownMs + roundIntroMs + L1.displayMs + 500;
    const bad = unlit(s0);
    const s = reducer(s0, { type: 'tap', index: bad, now: t });
    expect(s.phase).toBe('feedback');
    expect(s.result).toBe('wrong');
    expect(s.wrongTile).toBe(bad);
    expect(s.lives).toBe(2);
    expect(s.streak).toBe(0);
    expect(s.level).toBe(1);
    expect(s.events.map((e) => e.type)).toEqual(['wrong', 'lostLife']);

    const next = reducer(s, { type: 'tick', now: t + wrongFeedbackMs });
    expect(next.phase).toBe('intro');
    expect(next.level).toBe(1);
    expect(next.pattern).toHaveLength(L1.lit);
    expect(next.pattern.join()).not.toBe(s0.pattern.join());
  });

  it('times out as a miss when recall runs out', () => {
    const s0 = toInput();
    const s = reducer(s0, { type: 'tick', now: s0.deadline });
    expect(s.phase).toBe('feedback');
    expect(s.result).toBe('timeout');
    expect(s.wrongTile).toBeNull();
    expect(s.lives).toBe(2);
  });

  it('accepts a tap exactly on the deadline but not after it', () => {
    const s0 = toInput();
    const dl = s0.deadline;
    expect(reducer(s0, { type: 'tap', index: s0.pattern[0] as number, now: dl }).found).toHaveLength(1);
    expect(reducer(s0, { type: 'tap', index: s0.pattern[0] as number, now: dl + 1 }).result).toBe('timeout');
  });

  it('ends the game on the third miss', () => {
    let s = toInput();
    for (let i = 0; i < 3; i++) {
      const t = s.now;
      s = reducer(s, { type: 'tap', index: unlit(s), now: t });
      expect(s.phase).toBe('feedback');
      if (i < 2) s = nextInput(s);
    }
    expect(s.fatal).toBe(true);
    expect(s.deadline - s.now).toBe(wrongFeedbackMs + gameOverDelayMs);
    s = reducer(s, { type: 'tick', now: s.deadline });
    expect(s.phase).toBe('gameover');
  });

  it('restarts the show phase in full after a pause', () => {
    let s = reducer(initialState, { type: 'start', now: 0, seed: 3 });
    s = reducer(s, { type: 'tick', now: countdownMs + roundIntroMs });
    expect(s.phase).toBe('show');
    s = reducer(s, { type: 'pause', now: countdownMs + roundIntroMs + 700 });
    s = reducer(s, { type: 'resume', now: 50_000 });
    expect(s.deadline).toBe(50_000 + L1.displayMs);
  });

  it('ignores taps during the show phase', () => {
    let s = reducer(initialState, { type: 'start', now: 0, seed: 3 });
    s = reducer(s, { type: 'tick', now: countdownMs + roundIntroMs });
    const tapped = reducer(s, { type: 'tap', index: 0, now: countdownMs + roundIntroMs + 10 });
    expect(tapped.found).toEqual([]);
    expect(tapped.lives).toBe(3);
  });

  it('is deterministic for a seed', () => {
    expect(toInput(11).pattern).toEqual(toInput(11).pattern);
  });

  it('applies the streak multiplier from the sixth round', () => {
    let s = toInput();
    for (let i = 0; i < 5; i++) {
      s = tapAll(s, s.now);
      expect(s.result).toBe('correct');
      s = nextInput(s);
    }
    const before = s.score;
    const lit = getLevel(s.level).lit;
    s = tapAll(s, s.now);
    expect(s.streak).toBe(6);
    expect(s.score - before).toBe(lit * 10 * 2 + lit * 5);
  });
});
