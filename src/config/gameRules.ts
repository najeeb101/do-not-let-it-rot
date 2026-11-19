/**
 * Every tunable number lives here (docs/GAME_RULES.md section 8).
 * Times are milliseconds. Nothing outside this file hardcodes a rule value.
 */

export type Range = readonly [min: number, max: number];
export type MathOp = '+' | '-' | '*' | '/';

export type MathTierSpec = {
  ops: readonly MathOp[];
  /** Operand ranges for + and - (for -, the larger operand is placed first). */
  addSub?: { a: Range; b: Range };
  mul?: { a: Range; b: Range };
  /** Division is built as divisor * quotient so it is always exact. */
  div?: { divisor: Range; quotient: Range };
};

export type MemoryLevel = {
  grid: number;
  lit: number;
  displayMs: number;
  recallTimeoutMs: number;
};

export const gameRules = {
  startingLives: 3,
  countdownMs: 1500,
  countdownSteps: 3,

  baseMultiplier: 1,
  multiplierCap: 5,
  correctPerMultiplierStep: 5,

  roundIntroMs: 600,
  correctFeedbackMs: 400,
  wrongFeedbackMs: 1100,
  gameOverDelayMs: 800,

  /** Score below `low` is the low line, below `mid` the mid line, else high. */
  gameOverTiers: {
    speedMath: { low: 200, mid: 800 },
    visualMemory: { low: 150, mid: 600 },
    piChallenge: { low: 10, mid: 25 },
  },

  // Visual Memory
  memoryMaxLitTiles: 12,
  memoryDisplayFloorMs: 800,
  memoryPointsPerTile: 10,
  memoryTimeBonusPerTile: 5,
  patternRedrawAttempts: 5,
  /** Levels past the end of the table reuse the last row. */
  memoryLevels: [
    { grid: 3, lit: 3, displayMs: 1500, recallTimeoutMs: 10000 },
    { grid: 3, lit: 4, displayMs: 1500, recallTimeoutMs: 10000 },
    { grid: 3, lit: 5, displayMs: 1500, recallTimeoutMs: 10000 },
    { grid: 4, lit: 5, displayMs: 1400, recallTimeoutMs: 10000 },
    { grid: 4, lit: 6, displayMs: 1400, recallTimeoutMs: 10000 },
    { grid: 4, lit: 7, displayMs: 1300, recallTimeoutMs: 10000 },
    { grid: 4, lit: 8, displayMs: 1300, recallTimeoutMs: 10000 },
    { grid: 5, lit: 8, displayMs: 1200, recallTimeoutMs: 12000 },
    { grid: 5, lit: 9, displayMs: 1200, recallTimeoutMs: 12000 },
    { grid: 5, lit: 10, displayMs: 1100, recallTimeoutMs: 12000 },
    { grid: 5, lit: 11, displayMs: 1100, recallTimeoutMs: 12000 },
    { grid: 5, lit: 12, displayMs: 1000, recallTimeoutMs: 12000 },
    { grid: 5, lit: 12, displayMs: 900, recallTimeoutMs: 12000 },
    { grid: 5, lit: 12, displayMs: 800, recallTimeoutMs: 12000 },
  ] as readonly MemoryLevel[],

  // Speed Math. Tier is chosen by total correct answers (D23).
  mathTierStarts: [0, 5, 12, 20, 30] as readonly number[],
  mathTimerMsByTier: [5000, 4500, 4000, 3500, 3000] as readonly number[],
  mathBasePointsByTier: [10, 15, 20, 25, 30] as readonly number[],
  mathTimeBonusMaxByTier: [5, 8, 10, 13, 15] as readonly number[],
  mathTiers: [
    { ops: ['+', '-'], addSub: { a: [1, 9], b: [1, 9] } },
    { ops: ['+', '-'], addSub: { a: [10, 99], b: [10, 99] } },
    { ops: ['*', '/'], mul: { a: [2, 9], b: [2, 9] }, div: { divisor: [2, 9], quotient: [2, 9] } },
    { ops: ['*'], mul: { a: [11, 99], b: [2, 9] } },
    {
      ops: ['+', '-', '*', '/'],
      addSub: { a: [10, 99], b: [10, 99] },
      mul: { a: [11, 99], b: [2, 9] },
      div: { divisor: [2, 9], quotient: [2, 30] },
    },
  ] as readonly MathTierSpec[],
  mathMaxAnswerDigits: 3,
  mathRecentMemory: 5,
  mathRedrawAttempts: 20,

  // Pi Challenge
  piRunMs: 30000,
  piMinDigits: 1000,
  piShownNextDigits: 10,
  piTimerStartsOnFirstDigit: true,
  /** How long the stream stays visible after the run ends, before Game Over. */
  piWrongHoldMs: 1500,
  piTimeUpHoldMs: 1000,
  /** Digits are grouped in blocks of this size in the ticker. */
  piGroupSize: 5,

  pauseOnHidden: true,
  quitCountsAsGameOver: true,
} as const;

export type GameRules = typeof gameRules;
