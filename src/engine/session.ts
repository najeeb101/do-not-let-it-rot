import { gameRules } from '../config/gameRules';
import type { ModeId } from './types';

/** Countdown numeral (3, 2, 1) from the time left in the countdown. */
export function countdownNumeral(remainingMs: number, totalMs = gameRules.countdownMs): number {
  const steps = gameRules.countdownSteps;
  const perStep = totalMs / steps;
  const n = Math.ceil(Math.max(0, remainingMs) / perStep);
  return Math.min(steps, Math.max(1, n));
}

/** Pause support: deadlines move forward by the time spent paused (D26). */
export function shiftDeadline(deadline: number | null, pausedAt: number, resumedAt: number): number | null {
  if (deadline === null) return null;
  return deadline + Math.max(0, resumedAt - pausedAt);
}

export type GameOverTier = 'low' | 'mid' | 'high';

/** Game over line tier by score, not by rot stage (D27). Zero is always low. */
export function gameOverTier(mode: ModeId, score: number): GameOverTier {
  const { low, mid } = gameRules.gameOverTiers[mode];
  if (score <= 0 || score < low) return 'low';
  if (score < mid) return 'mid';
  return 'high';
}

export type RecordResult = {
  best: number;
  bestStreak: number;
  newPersonalBest: boolean;
  previousBest: number;
};

/**
 * High score rules (GAME_RULES 1.6): ties are not a new best, a zero score is
 * never a best, best streak is the max seen.
 */
export function evaluateRecord(
  storedBest: number,
  storedBestStreak: number,
  finalScore: number,
  gameBestStreak: number,
): RecordResult {
  const newPersonalBest = finalScore > storedBest && finalScore > 0;
  return {
    best: newPersonalBest ? finalScore : storedBest,
    bestStreak: Math.max(storedBestStreak, gameBestStreak),
    newPersonalBest,
    previousBest: storedBest,
  };
}
