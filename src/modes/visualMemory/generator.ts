import { gameRules } from '../../config/gameRules';
import type { MemoryLevel } from '../../config/gameRules';
import type { Rng } from '../../engine/rng';

/** Level table row for a 1-based level. Levels past the table reuse the last row. */
export function getLevel(level: number): MemoryLevel {
  const rows = gameRules.memoryLevels;
  const i = Math.min(Math.max(1, Math.floor(level)), rows.length) - 1;
  return rows[i] as MemoryLevel;
}

const sameSet = (a: readonly number[], b: readonly number[]) =>
  a.length === b.length && a.every((v, i) => v === b[i]);

/**
 * Sorted, distinct tile indexes (partial Fisher-Yates). Redraws up to
 * patternRedrawAttempts times if it equals the previous pattern.
 */
export function generatePattern(
  gridSize: number,
  litCount: number,
  rng: Rng,
  previous?: readonly number[],
): number[] {
  const n = gridSize * gridSize;
  const count = Math.min(litCount, n);
  const draw = (): number[] => {
    const pool = Array.from({ length: n }, (_, i) => i);
    for (let i = 0; i < count; i++) {
      const j = rng.int(i, n - 1);
      [pool[i], pool[j]] = [pool[j] as number, pool[i] as number];
    }
    return pool.slice(0, count).sort((a, b) => a - b);
  };
  let out = draw();
  for (let k = 0; k < gameRules.patternRedrawAttempts && previous && sameSet(out, previous); k++) {
    out = draw();
  }
  return out;
}
