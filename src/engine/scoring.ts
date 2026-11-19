import { gameRules } from '../config/gameRules';

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/** Multiplier for an attempt, from the streak BEFORE it (D25). */
export function getMultiplier(streakBefore: number): number {
  const { baseMultiplier, multiplierCap, correctPerMultiplierStep } = gameRules;
  const steps = Math.floor(Math.max(0, streakBefore) / correctPerMultiplierStep);
  return Math.min(multiplierCap, baseMultiplier + steps);
}

/** Time bonus: proportional to the timer fraction left. Not multiplied (D25). */
export function getTimeBonus(max: number, remainingMs: number, timerMs: number): number {
  if (timerMs <= 0) return 0;
  const fractionLeft = clamp(remainingMs / timerMs, 0, 1);
  return Math.round(max * fractionLeft);
}

/** Score for one correct attempt: base x multiplier + time bonus. */
export function scoreAttempt(
  base: number,
  streakBefore: number,
  timeBonusMax: number,
  remainingMs: number,
  timerMs: number,
): number {
  return base * getMultiplier(streakBefore) + getTimeBonus(timeBonusMax, remainingMs, timerMs);
}
