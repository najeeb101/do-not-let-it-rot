export type StreakState = { streak: number; bestStreak: number };

export const initialStreak: StreakState = { streak: 0, bestStreak: 0 };

export function streakOnCorrect(s: StreakState): StreakState {
  const streak = s.streak + 1;
  return { streak, bestStreak: Math.max(s.bestStreak, streak) };
}

/** A miss resets the streak, the best of this game is kept. */
export function streakOnMiss(s: StreakState): StreakState {
  return { streak: 0, bestStreak: s.bestStreak };
}
