import { describe, expect, it } from 'vitest';
import { gameRules } from '../../config/gameRules';
import { createRng } from '../../engine/rng';
import { generateQuestion, tierFor } from './generator';
import { reducer, initialState } from './reducer';
import type { SmAction, SmState } from './reducer';

describe('tierFor', () => {
  it.each([
    [0, 0], [4, 0], [5, 1], [11, 1], [12, 2], [19, 2], [20, 3], [29, 3], [30, 4], [200, 4],
  ])('%i correct -> tier %i', (n, t) => expect(tierFor(n)).toBe(t));
});

describe('generator', () => {
  it('stays inside tier rules for many seeds', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const rng = createRng(seed);
      for (const total of [0, 5, 12, 20, 30, 60]) {
        const q = generateQuestion(rng, total, []);
        const tier = tierFor(total);
        expect(Number.isInteger(q.answer)).toBe(true);
        expect(q.answer).toBeGreaterThanOrEqual(0);
        expect(String(q.answer).length).toBeLessThanOrEqual(gameRules.mathMaxAnswerDigits);
        expect(gameRules.mathTiers[tier]?.ops).toContain(q.op);
        if (q.op === '-') expect(q.a).toBeGreaterThanOrEqual(q.b);
        if (q.op === '/') {
          expect(q.a % q.b).toBe(0);
          expect(q.a / q.b).toBe(q.answer);
        }
        if (tier === 0) {
          expect(q.a).toBeLessThanOrEqual(9);
          expect(q.b).toBeLessThanOrEqual(9);
        }
      }
    }
  });
  it('is deterministic per seed', () => {
    expect(generateQuestion(createRng(5), 0, [])).toEqual(generateQuestion(createRng(5), 0, []));
  });
  it('avoids recent questions when it can', () => {
    const rng = createRng(11);
    const recent: string[] = [];
    for (let i = 0; i < 30; i++) {
      const q = generateQuestion(rng, 0, recent);
      expect(recent).not.toContain(q.key);
      recent.push(q.key);
      if (recent.length > gameRules.mathRecentMemory) recent.shift();
    }
  });
});

function run(state: SmState, ...actions: SmAction[]): SmState {
  return actions.reduce(reducer, state);
}

function started(): SmState {
  const s = reducer(initialState, { type: 'start', now: 0, seed: 123 });
  return reducer(s, { type: 'tick', now: gameRules.countdownMs });
}

const wrong = (s: SmState): string => String((s.question?.answer ?? 0) + 1);

describe('reducer', () => {
  it('counts down then asks a question', () => {
    const s = reducer(initialState, { type: 'start', now: 0, seed: 1 });
    expect(s.phase).toBe('countdown');
    expect(reducer(s, { type: 'tick', now: 1499 }).phase).toBe('countdown');
    const q = reducer(s, { type: 'tick', now: 1500 });
    expect(q.phase).toBe('input');
    expect(q.deadline).toBe(1500 + 5000);
  });

  it('auto-submits a correct answer and scores base plus bonus', () => {
    const s = started();
    const answer = String(s.question?.answer);
    let cur = s;
    for (const d of answer) cur = reducer(cur, { type: 'digit', digit: d, now: 1500 });
    expect(cur.phase).toBe('feedback');
    expect(cur.result).toBe('correct');
    expect(cur.score).toBe(15);
    expect(cur.streak).toBe(1);
    expect(cur.totalCorrect).toBe(1);
    expect(reducer(cur, { type: 'tick', now: 1500 + 400 }).phase).toBe('input');
  });

  it('wrong OK costs a life and resets the streak', () => {
    let s = started();
    s = { ...s, streak: 6 };
    for (const d of wrong(s)) s = reducer(s, { type: 'digit', digit: d, now: 1600 });
    if (s.phase === 'input') s = reducer(s, { type: 'submit', now: 1600 });
    expect(s.result).toBe('wrong');
    expect(s.lives).toBe(2);
    expect(s.streak).toBe(0);
  });

  it('empty OK is ignored', () => {
    const s = started();
    expect(reducer(s, { type: 'submit', now: 1600 }).phase).toBe('input');
  });

  it('leading zero is replaced and extra digits are capped', () => {
    let s = started();
    s = { ...s, question: { a: 1, b: 1, op: '+', answer: 999, key: 'x' } };
    s = run(s, { type: 'digit', digit: '0', now: 1600 }, { type: 'digit', digit: '5', now: 1600 });
    expect(s.buffer).toBe('5');
    s = run(s, { type: 'digit', digit: '1', now: 1600 }, { type: 'digit', digit: '2', now: 1600 }, { type: 'digit', digit: '3', now: 1600 });
    expect(s.buffer).toBe('512');
  });

  it('backspace removes the last digit', () => {
    let s = started();
    s = { ...s, question: { a: 1, b: 1, op: '+', answer: 999, key: 'x' } };
    s = run(s, { type: 'digit', digit: '4', now: 1600 }, { type: 'digit', digit: '7', now: 1600 }, { type: 'backspace', now: 1600 });
    expect(s.buffer).toBe('4');
  });

  it('times out and discards the buffer', () => {
    let s = started();
    s = { ...s, question: { a: 1, b: 1, op: '+', answer: 999, key: 'x' } };
    s = reducer(s, { type: 'digit', digit: '4', now: 2000 });
    s = reducer(s, { type: 'tick', now: s.deadline });
    expect(s.result).toBe('timeout');
    expect(s.buffer).toBe('');
    expect(s.lives).toBe(2);
  });

  it('input exactly at the deadline is accepted, after it is a timeout', () => {
    const s = started();
    const answer = String(s.question?.answer);
    const onTime = answer.split('').reduce<SmState>((c, d) => reducer(c, { type: 'digit', digit: d, now: s.deadline }), s);
    expect(onTime.result).toBe('correct');
    const late = reducer(s, { type: 'digit', digit: answer[0] as string, now: s.deadline + 1 });
    expect(late.result).toBe('timeout');
  });

  it('pause freezes time and resume shifts the deadline', () => {
    const s = started();
    const paused = reducer(s, { type: 'pause', now: 2000 });
    expect(reducer(paused, { type: 'tick', now: 99999 })).toBe(paused);
    const resumed = reducer(paused, { type: 'resume', now: 7000 });
    expect(resumed.deadline).toBe(s.deadline + 5000);
    expect(reducer(resumed, { type: 'tick', now: 7000 }).phase).toBe('input');
  });

  it('three misses end the game after the delay', () => {
    let s = started();
    s = reducer(s, { type: 'tick', now: s.deadline });
    expect(s.lives).toBe(2);
    s = reducer(s, { type: 'tick', now: s.deadline });
    expect(s.phase).toBe('input');
    s = reducer(s, { type: 'tick', now: s.deadline });
    s = reducer(s, { type: 'tick', now: s.deadline });
    s = reducer(s, { type: 'tick', now: s.deadline });
    expect(s.lives).toBe(0);
    expect(s.fatal).toBe(true);
    expect(s.phase).toBe('feedback');
    s = reducer(s, { type: 'tick', now: s.deadline });
    expect(s.phase).toBe('gameover');
  });

  it('multiplier rises after five correct in a row', () => {
    let s = started();
    for (let i = 0; i < 6; i++) {
      const t = s.now;
      for (const d of String(s.question?.answer)) s = reducer(s, { type: 'digit', digit: d, now: t });
      s = reducer(s, { type: 'tick', now: s.deadline });
    }
    expect(s.streak).toBe(6);
    expect(s.totalCorrect).toBe(6);
    expect(tierFor(s.totalCorrect)).toBe(1);
  });

  it('is deterministic for a given seed', () => {
    expect(started().question).toEqual(started().question);
  });
});
