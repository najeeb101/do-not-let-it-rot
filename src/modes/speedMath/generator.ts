import { gameRules } from '../../config/gameRules';
import type { MathOp } from '../../config/gameRules';
import type { Rng } from '../../engine/rng';

export type MathQuestion = {
  a: number;
  b: number;
  op: MathOp;
  answer: number;
  key: string;
};

export const opGlyph: Record<MathOp, string> = { '+': '+', '-': '−', '*': '×', '/': '÷' };

export function questionText(q: MathQuestion): string {
  return `${q.a} ${opGlyph[q.op]} ${q.b}`;
}

/** Tier index (0-based) from total correct answers so far. */
export function tierFor(totalCorrect: number): number {
  const starts = gameRules.mathTierStarts;
  let tier = 0;
  for (let i = 0; i < starts.length; i++) {
    if (totalCorrect >= (starts[i] as number)) tier = i;
  }
  return tier;
}

function dedupeKey(op: MathOp, a: number, b: number): string {
  const [x, y] = op === '+' || op === '*' ? [Math.min(a, b), Math.max(a, b)] : [a, b];
  return `${op}:${x}:${y}`;
}

function draw(rng: Rng, tier: number): MathQuestion {
  const spec = gameRules.mathTiers[tier] as (typeof gameRules.mathTiers)[number];
  const op = rng.pick(spec.ops);
  let a: number;
  let b: number;
  let answer: number;
  if (op === '+' || op === '-') {
    const r = spec.addSub as NonNullable<typeof spec.addSub>;
    const x = rng.int(r.a[0], r.a[1]);
    const y = rng.int(r.b[0], r.b[1]);
    if (op === '+') {
      a = x;
      b = y;
      answer = x + y;
    } else {
      a = Math.max(x, y);
      b = Math.min(x, y);
      answer = a - b;
    }
  } else if (op === '*') {
    const r = spec.mul as NonNullable<typeof spec.mul>;
    a = rng.int(r.a[0], r.a[1]);
    b = rng.int(r.b[0], r.b[1]);
    answer = a * b;
  } else {
    const r = spec.div as NonNullable<typeof spec.div>;
    b = rng.int(r.divisor[0], r.divisor[1]);
    answer = rng.int(r.quotient[0], r.quotient[1]);
    a = b * answer;
  }
  return { a, b, op, answer, key: dedupeKey(op, a, b) };
}

/**
 * Draw a question for the current tier. Redraws up to mathRedrawAttempts times
 * to avoid repeating any of the recent keys.
 */
export function generateQuestion(rng: Rng, totalCorrect: number, recent: readonly string[]): MathQuestion {
  const tier = tierFor(totalCorrect);
  let q = draw(rng, tier);
  for (let i = 0; i < gameRules.mathRedrawAttempts && recent.includes(q.key); i++) {
    q = draw(rng, tier);
  }
  return q;
}
