import { gameRules } from '../config/gameRules';

export type RotStage = 0 | 1 | 2 | 3;

/** Lives only go down (D20). Never below zero. */
export function loseLife(lives: number): number {
  return Math.max(0, lives - 1);
}

export function isRotten(lives: number): boolean {
  return lives <= 0;
}

/** Rot stage = starting lives minus lives left, clamped to 0..3. */
export function rotStage(lives: number): RotStage {
  const stage = gameRules.startingLives - lives;
  return Math.min(3, Math.max(0, stage)) as RotStage;
}
