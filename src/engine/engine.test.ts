import { describe, expect, it } from 'vitest';
import { createFakeClock } from './clock';
import { createRng } from './rng';
import { getMultiplier, getTimeBonus, scoreAttempt } from './scoring';
import { initialStreak, streakOnCorrect, streakOnMiss } from './streak';
import { isRotten, loseLife, rotStage } from './rot';
import { countdownNumeral, evaluateRecord, gameOverTier, shiftDeadline } from './session';

describe('rng', () => {
  it('is deterministic per seed', () => {
    const a = createRng(42);
    const b = createRng(42);
    expect([a.next(), a.next(), a.next()]).toEqual([b.next(), b.next(), b.next()]);
  });
  it('differs across seeds and stays in range', () => {
    expect(createRng(1).next()).not.toBe(createRng(2).next());
    const r = createRng(7);
    for (let i = 0; i < 500; i++) {
      const n = r.int(3, 6);
      expect(n).toBeGreaterThanOrEqual(3);
      expect(n).toBeLessThanOrEqual(6);
    }
  });
  it('resumes from saved state', () => {
    const a = createRng(9);
    a.next();
    const b = createRng(a.state());
    expect(b.next()).toBe(a.next());
  });
  it('shuffle keeps elements', () => {
    expect(createRng(3).shuffle([1, 2, 3, 4, 5]).sort()).toEqual([1, 2, 3, 4, 5]);
  });
});

describe('clock', () => {
  it('fake clock advances', () => {
    const c = createFakeClock(10);
    expect(c.advance(5)).toBe(15);
    c.set(100);
    expect(c.now()).toBe(100);
  });
});

describe('multiplier', () => {
  it.each([
    [0, 1], [4, 1], [5, 2], [9, 2], [10, 3], [15, 4], [20, 5], [100, 5],
  ])('streak %i -> x%i', (s, m) => expect(getMultiplier(s)).toBe(m));
});

describe('time bonus', () => {
  it('scales and clamps', () => {
    expect(getTimeBonus(5, 5000, 5000)).toBe(5);
    expect(getTimeBonus(5, 2500, 5000)).toBe(3);
    expect(getTimeBonus(5, 0, 5000)).toBe(0);
    expect(getTimeBonus(5, 9999, 5000)).toBe(5);
    expect(getTimeBonus(5, -10, 5000)).toBe(0);
  });
  it('attempt score = base * mult + bonus', () => {
    expect(scoreAttempt(10, 0, 5, 5000, 5000)).toBe(15);
    expect(scoreAttempt(10, 5, 5, 0, 5000)).toBe(20);
    expect(scoreAttempt(30, 25, 15, 3000, 3000)).toBe(30 * 5 + 15);
  });
});

describe('streak and rot', () => {
  it('tracks streaks', () => {
    let s = streakOnCorrect(streakOnCorrect(initialStreak));
    expect(s).toEqual({ streak: 2, bestStreak: 2 });
    s = streakOnMiss(s);
    expect(s).toEqual({ streak: 0, bestStreak: 2 });
    expect(streakOnCorrect(s).bestStreak).toBe(2);
  });
  it('lives and stages', () => {
    expect([3, 2, 1, 0].map(rotStage)).toEqual([0, 1, 2, 3]);
    expect(loseLife(0)).toBe(0);
    expect(isRotten(loseLife(1))).toBe(true);
    expect(isRotten(2)).toBe(false);
  });
});

describe('session helpers', () => {
  it('countdown numerals', () => {
    expect(countdownNumeral(1500)).toBe(3);
    expect(countdownNumeral(1001)).toBe(3);
    expect(countdownNumeral(1000)).toBe(2);
    expect(countdownNumeral(500)).toBe(1);
    expect(countdownNumeral(1)).toBe(1);
  });
  it('pause shifts deadlines', () => {
    expect(shiftDeadline(1000, 400, 900)).toBe(1500);
    expect(shiftDeadline(null, 0, 10)).toBeNull();
  });
  it('game over tiers', () => {
    expect(gameOverTier('speedMath', 0)).toBe('low');
    expect(gameOverTier('speedMath', 199)).toBe('low');
    expect(gameOverTier('speedMath', 200)).toBe('mid');
    expect(gameOverTier('speedMath', 799)).toBe('mid');
    expect(gameOverTier('speedMath', 800)).toBe('high');
    expect(gameOverTier('piChallenge', 10)).toBe('mid');
    expect(gameOverTier('visualMemory', 600)).toBe('high');
  });
  it('records', () => {
    expect(evaluateRecord(100, 3, 150, 5)).toMatchObject({ best: 150, bestStreak: 5, newPersonalBest: true, previousBest: 100 });
    expect(evaluateRecord(100, 7, 100, 2)).toMatchObject({ best: 100, bestStreak: 7, newPersonalBest: false });
    expect(evaluateRecord(0, 0, 0, 0).newPersonalBest).toBe(false);
  });
});
