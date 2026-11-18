# Game Rules

Exact, testable rules for the three v1 modes. Derived from `MASTER.md` section 6 and decisions D3, D4, D15, D16. If this file and MASTER disagree, MASTER wins until updated.

Conventions:
- Any number not stated in MASTER or the concept is marked **(proposed)**.
- Every tunable lives in `src/config/gameRules.ts` under the camelCase name in section 8. No magic numbers elsewhere.
- All times are milliseconds internally (`...Ms`). UI may show seconds.
- Game logic is pure functions (state in, state out) with an injected clock and an injected seeded RNG, so every rule below is unit testable.
- "Round" = one Visual Memory pattern. "Question" = one Speed Math question. Both are called an "attempt" in shared rules.

## 1. Shared mechanics (Visual Memory and Speed Math)

Pi Challenge uses none of this section (D15). See section 4.

### 1.1 Lives and Rot Meter

| Lives left | Rot stage | Meaning |
|---|---|---|
| 3 | 0 | Healthy brain |
| 2 | 1 | First rot |
| 1 | 2 | Heavy rot |
| 0 | 3 | Full rot, game over |

- Start with `startingLives` = 3. Rot stage = `startingLives - lives`.
- A miss (wrong answer, wrong tap, or timeout) costs exactly 1 life. Never more than 1 per attempt.
- When lives reach 0 the attempt's feedback plays, then the game over screen opens. There is no other way for these modes to end.
- Lives are never regained in v1 (proposed).

### 1.2 Streak and multiplier

- `streak` = consecutive correct attempts in the current game.
- Multiplier applied to an attempt uses the streak **before** that attempt:
  `multiplier = min(multiplierCap, 1 + floor(streakBefore / correctPerMultiplierStep))`
  with `multiplierCap` = 5 and `correctPerMultiplierStep` = 5 (proposed, from MASTER).
- On a correct attempt: score it using that multiplier, then `streak += 1`, `bestStreakThisGame = max(bestStreakThisGame, streak)`.
- So attempts 1 to 5 score at x1, attempts 6 to 10 at x2, and x5 starts at the 21st consecutive correct attempt.
- This is consistent with MASTER ("x1 at start, +1 every 5 correct in a row, capped at x5"). No contradiction found.

| streakBefore | multiplier |
|---|---|
| 0 to 4 | x1 |
| 5 to 9 | x2 |
| 10 to 14 | x3 |
| 15 to 19 | x4 |
| 20 or more | x5 |

### 1.3 What resets on a miss

| Item | On miss |
|---|---|
| streak | reset to 0 |
| multiplier | back to x1 (follows from streak) |
| lives | minus 1 |
| score | kept, no penalty |
| bestStreakThisGame | kept |
| Visual Memory level | kept (same level repeats, new pattern) |
| Speed Math tier | kept (tier depends on total correct, never drops) |

### 1.4 Time bonus

Each attempt has a timer of `timerMs` (Visual Memory: the recall timeout; Speed Math: the question timer). Timers run only while the player can act, never during show phase or feedback.

```
fractionLeft = clamp(remainingMs / timerMs, 0, 1)
timeBonus    = Math.round(timeBonusMax * fractionLeft)
```

- `remainingMs` = `timerMs` minus elapsed ms when the attempt was resolved, floored at 0, integer.
- `Math.round` rounds .5 up (JS behavior for positives). Result is a non-negative integer.
- Time bonus is **not** multiplied by the streak multiplier (reading of "Points x streak multiplier + time bonus").
- Time bonus is awarded only on a correct attempt. A miss scores 0.

### 1.5 Score formula

```
attemptScore = basePoints * multiplier + timeBonus      (correct attempt)
attemptScore = 0                                        (miss)
gameScore    = sum of attemptScore
```

`basePoints` and `timeBonusMax` per mode are in sections 2.3 and 3.3. Scores are integers.

Worked example (Speed Math, tier 2: basePoints 15, timeBonusMax 8, timerMs 4500):
- Player has 7 correct in a row, so multiplier = min(5, 1 + floor(7/5)) = x2.
- Answer submitted with 1800 ms elapsed, so remainingMs = 2700, fractionLeft = 0.6.
- timeBonus = round(8 * 0.6) = round(4.8) = 5.
- attemptScore = 15 * 2 + 5 = **35**. Streak becomes 8.

Worked example (Visual Memory, level 4, 5 lit tiles: basePoints 50, timeBonusMax 25, timerMs 10000):
- Streak before = 5, so x2. All tiles found with 2700 ms elapsed, remainingMs = 7300.
- timeBonus = round(25 * 0.73) = round(18.25) = 18.
- attemptScore = 50 * 2 + 18 = **118**. Streak becomes 6.

### 1.6 High score and save rules

Stored locally (D5). Schema is owned by ARCHITECTURE.md; the rules are:

| Stat | Scope | Rule |
|---|---|---|
| bestScore | per mode (memory, math, pi) | Updated at game over if `finalScore > bestScore`. Equal score is not a new best. No tie-breaking of any kind. |
| bestStreak | per mode, memory and math only | `max(stored, bestStreakThisGame)`. Pi has none. |
| gamesPlayed | per mode, plus a derived total | `+1` at every game over. |
| newPersonalBest | transient flag | true when `finalScore > bestScore` before saving and `finalScore > 0`. First game with a score above 0 is a new best. |

- A score of 0 is never saved as a best and never flags a new personal best.
- Quitting to the menu mid-game from the pause or back control counts as game over: score is saved, gamesPlayed +1 (proposed).
- Reload or tab close mid-game saves nothing; there is no resume of a run (proposed).
- Reset local data (settings) zeroes all stats.
- If storage is unavailable, the game still plays; saving fails silently and the game over screen omits the "saved" state.

### 1.7 Shared timing constants (proposed)

| Phase | Duration |
|---|---|
| Level intro (Visual Memory "Level N") | `roundIntroMs` 600 |
| Correct feedback | `correctFeedbackMs` 400 |
| Wrong or timeout feedback | `wrongFeedbackMs` 1100 (Visual Memory also reveals the answer, see 2.5) |
| Game over delay before screen | `gameOverDelayMs` 800 |

Feedback time does not count against any timer. Input is ignored during feedback.

### 1.8 Seeded RNG

`createRng(seed: number)` returns a deterministic generator `() => number` in [0, 1) (mulberry32 recommended). Each game gets a fresh seed (`crypto.getRandomValues`, fallback `Date.now()`). Tests pass fixed seeds. The seed is stored on the game state so a Daily Challenge (phase 3) can reuse it.

## 2. Visual Memory

### 2.1 Flow

1. Level intro (`roundIntroMs`).
2. Show phase: pattern lit for `displayMs`. Input ignored.
3. Recall phase: grid active, recall timer (`recallTimeoutMs`) starts at the first frame of the recall phase.
4. Resolve: success, wrong tap, or timeout. Feedback. Next round or game over.

### 2.2 Level table (proposed)

Lit tile cap: `memoryMaxLitTiles` = 12. Level 12 is the "plateau" level: 5x5 and 12 lit. After that only the display time shrinks, down to `memoryDisplayFloorMs` = 800. Beyond level 14 nothing changes (endless at the floor).

| Level | Grid | Lit tiles | displayMs | recallTimeoutMs |
|---|---|---|---|---|
| 1 | 3x3 | 3 | 1500 | 10000 |
| 2 | 3x3 | 4 | 1500 | 10000 |
| 3 | 3x3 | 5 | 1500 | 10000 |
| 4 | 4x4 | 5 | 1400 | 10000 |
| 5 | 4x4 | 6 | 1400 | 10000 |
| 6 | 4x4 | 7 | 1300 | 10000 |
| 7 | 4x4 | 8 | 1300 | 10000 |
| 8 | 5x5 | 8 | 1200 | 12000 |
| 9 | 5x5 | 9 | 1200 | 12000 |
| 10 | 5x5 | 10 | 1100 | 12000 |
| 11 | 5x5 | 11 | 1100 | 12000 |
| 12 | 5x5 | 12 | 1000 | 12000 |
| 13 | 5x5 | 12 | 900 | 12000 |
| 14 and up | 5x5 | 12 | 800 | 12000 |

Notes:
- Grid sizes 3x3, 4x4, 5x5 match MASTER. Lit-tile counts never exceed 55% of the grid.
- Display time runs 1500 down to 800, matching the MASTER range (1.5 s down to 0.8 s). MASTER's other line, "1-2 s", is covered by the top of this range.
- The table is data (`memoryLevels` array). Levels past the array end reuse the last row.

### 2.3 Points per round

| Name | Value (proposed) |
|---|---|
| `memoryPointsPerTile` | 10 |
| `memoryTimeBonusPerTile` | 5 |

```
basePoints   = litTiles * memoryPointsPerTile
timeBonusMax = litTiles * memoryTimeBonusPerTile
timerMs      = recallTimeoutMs of the level
```

Then use 1.2 to 1.5. Example: level 4 (5 lit) gives basePoints 50, timeBonusMax 25.

### 2.4 Round result rules (strict, D16)

| Event | Result |
|---|---|
| Player taps a lit tile not yet tapped | Tile marks as found. Not a resolve unless it was the last one. |
| Player taps all lit tiles | **Success**. Resolve immediately on the last correct tap. Score per 1.5. Level +1. |
| Player taps an unlit tile (first one) | **Fail**. Resolve immediately. Life -1. Streak reset. Same level repeats. |
| Player taps an already found tile | Ignored. No penalty, no sound. |
| Recall timer reaches 0 before all found | **Fail** (timeout). Life -1. Streak reset. Same level repeats. |

- Order of taps does not matter.
- After a failed round the **same level repeats with a new pattern** (proposed). Level only goes up on success, never down.
- A wrong tap does not wait for more taps. One wrong tap ends the round.
- Fail feedback shows the full pattern: the missed tiles pulse, and the wrong tile gets a distinct marker (shape change, not color alone, per MASTER constraints).
- The streak for the shared multiplier counts consecutive successful rounds.

### 2.5 Pattern generation

```
generatePattern(gridSize, litCount, rng, previousPattern?) -> number[]  // sorted tile indexes 0..gridSize*gridSize-1
```

- Choose `litCount` distinct indexes uniformly at random: partial Fisher-Yates shuffle of `[0 .. n*n-1]` with the injected RNG, take the first `litCount`, sort ascending.
- If the result equals `previousPattern` (same set), redraw. Max `patternRedrawAttempts` = 5 (proposed), then accept.
- Same seed and same call order must give the same pattern (determinism test).
- No other constraint (clusters, adjacency) in v1.

## 3. Speed Math

### 3.1 Flow

1. Question appears. Question timer starts immediately.
2. Player types digits on the on-screen pad (or keyboard on desktop) and submits.
3. Resolve: correct (auto or explicit submit), wrong submit, or timeout. Feedback. Next question or game over.

### 3.2 Difficulty tiers

**Choice: tier is chosen by `totalCorrect` (number of correct answers so far in this game).** Not by streak, not by question number.

Why:
- Streak resets on every miss, so a streak-based tier would drop difficulty and make the game see-saw.
- Question number advances on misses and timeouts, so a struggling player would be pushed into harder tiers.
- `totalCorrect` only moves up when the player succeeds ("harder as the player succeeds", MASTER), never goes down, and is trivially testable.

Tier table (proposed):

| Tier | totalCorrect | Operations | Operand rules | timerMs | basePoints | timeBonusMax |
|---|---|---|---|---|---|---|
| 1 | 0 to 4 | + and - | a, b in 1..9. For -, a >= b. | 5000 | 10 | 5 |
| 2 | 5 to 11 | + and - | a, b in 10..99. For -, a >= b. | 4500 | 15 | 8 |
| 3 | 12 to 19 | x and exact / | x: a, b in 2..9. /: divisor 2..9, quotient 2..9 (dividend = divisor * quotient). | 4000 | 20 | 10 |
| 4 | 20 to 29 | x | a in 11..99, b in 2..9 (e.g. 47 x 6). | 3500 | 25 | 13 |
| 5 | 30 and up | mixed: +, -, x, / with equal chance | + and -: tier 2 ranges. x: tier 4 ranges. /: divisor 2..9, quotient 2..30. | 3000 | 30 | 15 |

- In tiers with two operations (1, 2, 3), each operation has 50% chance. In tier 5 each of the four has 25%.
- Tier 5 timer (3000) is the floor and matches MASTER (5 s down to 3 s).
- Tier 1 matches MASTER's "7 + 5" example; tier 4 matches "47 x 6".

### 3.3 Answers

- **Integers only.** Division only when exact (no remainder). The generator builds division from `divisor * quotient`, never by filtering random pairs.
- **No negative results, ever** (decision, proposed). Subtraction always has a >= b (a = b gives 0, allowed). Reason: no minus key on the number pad, fewer edge cases, early tiers stay friendly.
- Maximum answer is 891 (99 x 9), so `mathMaxAnswerDigits` = 3.
- Question display format: `a + b`, `a - b`, `a x b`, `a / b` (UI may render the multiply and divide glyphs; the data uses `+ - * /`).

### 3.4 Answer entry and submit rules

| Rule | Detail |
|---|---|
| Input keys | Digits 0-9, Backspace (delete last digit), Submit. Desktop keyboard: digits, Backspace, Enter. |
| Max length | `mathMaxAnswerDigits` = 3 digits. Extra digits ignored. |
| Leading zeros | If the buffer is "0" and a digit is typed, the digit replaces it. |
| Auto-submit | As soon as `Number(buffer) === correctAnswer`, resolve as correct with no extra tap. |
| Explicit submit | Submit with a non-empty buffer that is not correct = **wrong answer** (miss). |
| Empty submit | Ignored. |
| Wrong partial | Typing a wrong prefix never resolves by itself. Only Submit or timeout can. |
| Timeout | Timer reaches 0 = miss. Any typed buffer is discarded, not graded. |

- Auto-submit means a correct answer is never delayed by a tap; wrong answers cost an explicit action, so a typo can be corrected with Backspace before Submit.
- The buffer is cleared at the start of every question.

### 3.5 Avoiding repeats

- Keep the last `mathRecentMemory` = 5 (proposed) questions in the history.
- A question's key is `op:a:b`, with `a` and `b` sorted ascending for the commutative operations + and x (so 3 + 8 and 8 + 3 are the same key).
- Redraw if the key is in history. Max `mathRedrawAttempts` = 20 (proposed), then accept whatever was drawn (small pools like tier 1 never deadlock).

### 3.6 Points per tier

Use the table in 3.2 with the formulas in 1.2 to 1.5. `timerMs` is the tier's timer.

## 4. Pi Challenge

### 4.1 Rules (D4, D15)

- Single run, `piRunMs` = 30000 (30 s).
- The input shows "3." pre-filled. It is not typed and not scored.
- **Timer start (proposed): the 30 s clock starts at the first digit the player enters**, so the player can get ready. The HUD shows 30.0 until then.
- The player enters digits 0-9. Each digit is checked immediately against the reference.
  - Typed digit at position `i` (0-based after the decimal) is correct iff it equals `piDigits[i]`.
  - Correct: `score += 1`, the digit stays in the display.
  - Wrong: the run ends immediately. That digit does not count. Score = digits correct before it.
- The run also ends when the 30 s run out (score = digits correct so far), or when the player has typed all `piDigits.length` digits (score = that length, practically unreachable).
- **No backspace, no lives, no multiplier, no time bonus** (D15). There is no correction after a keypress.
- Score = number of correct digits after the decimal point. High score = max digits (per mode, "bestScore" rule in 1.6). No bestStreak for Pi.
- A timeout at the instant the clock hits 0 with no digit typed in this tick: the run ends with the score so far.

### 4.2 End of run display

| Ending | Rot Meter | Shown |
|---|---|---|
| Wrong digit | Fills to stage 3 for the game over animation only (MASTER) | "3." + correct digits, the wrong digit marked (not color alone), the digit that was expected, and the next 10 reference digits |
| Time up | No rot animation | "3." + all typed digits and the score |
| Reached end of reference | No rot animation | Full string and the score |

- Always show: score (digits), personal best comparison, "new personal best" if applicable, Retry, Menu.

### 4.3 Digit source

- File: `src/config/piDigits.ts` exporting `piDigits: string`, the digits **after** the decimal point only (no "3." prefix), at least 1000 characters (`piMinDigits` = 1000).
- **The full string must be verified against a reputable source at build time** (for example the published pi digits of the Pi Day / NIST-style reference tables or a computed value by a trusted library such as `mpmath` / `y-cruncher` output). A unit test checks the length >= 1000, characters are all 0-9, and the fixtures below.
- Test fixtures, first 50 digits after the decimal point:

```
14159265358979323846264338327950288419716939937510
```

Grouped by ten for checking:

| Digits | Value |
|---|---|
| 1 to 10 | 1415926535 |
| 11 to 20 | 8979323846 |
| 21 to 30 | 2643383279 |
| 31 to 40 | 5028841971 |
| 41 to 50 | 6939937510 |

(Digit 100 is 9; the full first 100 digits are `1415926535 8979323846 2643383279 5028841971 6939937510 5820974944 5923078164 0628620899 8628034825 3421170679`. These must still be checked at build time.)

## 5. Edge cases

| Case | Rule |
|---|---|
| Tab hidden or app backgrounded (`visibilitychange`, `pagehide`) | The game **pauses**: all timers stop, input ignored, a pause overlay shows and hides the board. Resume is by tap on a Resume button (no auto-resume). |
| Pause during the Visual Memory show phase | On resume, the show phase restarts from the full `displayMs` with the same pattern (a pause never gives a shorter or longer-than-intended look). |
| Pause during recall, Speed Math, or Pi | Timers resume with exactly the remaining time. Pi: the run is paused, not ended (accepted: a player could look up digits while paused; no backend means no real anti-cheat in v1). |
| Window blur without hidden tab (desktop) | No pause (only the Page Visibility rule above). |
| Double tap / double submit | Each tile counts once per round (found tiles ignored). After a resolve, phase = feedback and all input is ignored until the next attempt starts. A second Submit on the same question is ignored. Engine rejects any action whose phase does not allow it. |
| Input during the Visual Memory show phase (and level intro) | Ignored. No penalty, no sound. |
| Input during feedback | Ignored. |
| Timer reaches zero mid-input | Timeout wins: Speed Math discards the buffer and counts a miss; Visual Memory fails the round; Pi ends the run keeping digits already scored. |
| Input event and timer expiry in the same tick | Decide by event timestamp: an input stamped at or before the deadline is accepted, after is a timeout. |
| Correct answer and timeout simultaneous (Speed Math) | Same timestamp rule. |
| Reduced motion (`prefers-reduced-motion`) | Only animations change (fades instead of motion, no shake, static rot stage swap). **All timings (displayMs, timers, feedback durations) stay identical.** Lit tiles still use a non-motion cue (shape or brightness). |
| Mute / vibration off | No effect on rules or timing. |
| Clock source | Use `performance.now()` deltas, not `Date.now()`. A system clock change must not affect timers. |
| Zero score game | gamesPlayed increments; nothing else is saved (1.6). |
| Window resize or rotation mid-round | Layout changes only; state and timers are untouched. |
| Returning to menu while paused | Counts as a quit (1.6). |

## 6. Rot Meter mapping (shared with DESIGN.md)

Four visual stages (0 to 3) as in 1.1. Pi uses stage 0 during the run and jumps to stage 3 only for a wrong-digit ending.

## 7. Test cases

Expected values are exact. Rounding is `Math.round`.

### 7.1 Multiplier (`getMultiplier(streakBefore)`)

| Input | Expected |
|---|---|
| 0 | 1 |
| 4 | 1 |
| 5 | 2 |
| 9 | 2 |
| 10 | 3 |
| 19 | 4 |
| 20 | 5 |
| 25 | 5 |
| 100 | 5 |

### 7.2 Time bonus (`getTimeBonus(max, remainingMs, timerMs)`)

| max | remainingMs | timerMs | Expected |
|---|---|---|---|
| 8 | 4500 | 4500 | 8 |
| 8 | 2700 | 4500 | 5 (4.8 rounds up) |
| 8 | 0 | 4500 | 0 |
| 8 | -20 | 4500 | 0 (clamped) |
| 8 | 5000 | 4500 | 8 (clamped) |
| 5 | 500 | 1000 | 3 (2.5 rounds up) |
| 25 | 7300 | 10000 | 18 (18.25) |
| 10 | 2250 | 4000 | 6 (5.625) |

### 7.3 Attempt score (`scoreAttempt(base, streakBefore, max, remainingMs, timerMs)`)

| base | streakBefore | max | remainingMs | timerMs | Expected |
|---|---|---|---|---|---|
| 10 | 0 | 5 | 5000 | 5000 | 15 |
| 10 | 0 | 5 | 0 | 5000 | 10 |
| 15 | 7 | 8 | 2700 | 4500 | 35 |
| 50 | 5 | 25 | 7300 | 10000 | 118 |
| 30 | 20 | 15 | 3000 | 3000 | 165 (30*5 + 15) |
| 30 | 99 | 15 | 0 | 3000 | 150 |

Streak and lives transitions:

| Start (streak, lives) | Event | Result (streak, lives, bestStreakThisGame updates) |
|---|---|---|
| (4, 3) | correct | (5, 3), next attempt x2 |
| (7, 3) | miss | (0, 2), next attempt x1 |
| (0, 1) | miss | (0, 0), game over |
| (12, 2) | correct | (13, 2), x3 until streak 15 |

### 7.4 Speed Math tiers (`getTier(totalCorrect)`)

| totalCorrect | Expected tier | timerMs |
|---|---|---|
| 0 | 1 | 5000 |
| 4 | 1 | 5000 |
| 5 | 2 | 4500 |
| 11 | 2 | 4500 |
| 12 | 3 | 4000 |
| 19 | 3 | 4000 |
| 20 | 4 | 3500 |
| 29 | 4 | 3500 |
| 30 | 5 | 3000 |
| 500 | 5 | 3000 |

A miss does not change `totalCorrect`, so the tier after a miss is unchanged.

Question generation properties (run 1000 questions per tier with a fixed seed):
- Every operand is inside its tier range.
- `a - b >= 0` for every subtraction.
- Every division has `a % b === 0` and the quotient is in range.
- Every answer is an integer between 0 and 891.
- No question equals any of the previous 5 (by key, commutative-aware).
- Same seed gives the same sequence.

Answer entry:

| Buffer / action | Question `47 * 6` (282) | Expected |
|---|---|---|
| "2", "8", "2" typed | | auto-submit correct on the third digit |
| "2", "8", "3", Submit | | wrong, miss |
| "28", Submit | | wrong, miss |
| Submit with empty buffer | | ignored |
| "0", "2" typed on question 2 | | buffer "2" (leading zero replaced) |
| "2828" typed | | 4th digit ignored |
| timeout with buffer "28" | | miss, buffer discarded |

### 7.5 Visual Memory

| Case | Expected |
|---|---|
| `getLevel(1)` | 3x3, 3 lit, 1500, 10000 |
| `getLevel(4)` | 4x4, 5 lit, 1400, 10000 |
| `getLevel(12)` | 5x5, 12 lit, 1000, 12000 |
| `getLevel(14)` and `getLevel(40)` | 5x5, 12 lit, 800, 12000 |
| Round success at level 3 | level becomes 4 |
| Wrong tap at level 3 | lives -1, level stays 3, new pattern |
| All lit tiles tapped in a shuffled order | success |
| Tapping the same lit tile twice | second tap ignored |
| One wrong tap after 2 of 3 found | fail immediately |
| Recall timeout with 2 of 3 found | fail, lives -1 |
| `generatePattern(4, 6, rng)` | 6 distinct sorted ints in 0..15 |
| `generatePattern` same seed twice | identical output |
| `generatePattern` equals previous | redrawn up to 5 times |

### 7.6 Pi checking (`checkDigit(index, digit)` and `runPi`)

| Typed digits | Expected score | Ending |
|---|---|---|
| "1415926535" | 10 | continues (running) |
| "14159" | 5 | running |
| "1415" then "8" | 4 | wrong (expected 5) |
| "2" as the first digit | 0 | wrong (expected 1) |
| the 50 digits from section 4.3 | 50 | running |
| 50 digits where digit 50 is 9 instead of 0 | 49 | wrong |
| "14159" then clock hits 30000 | 5 | time up |
| "14159" typed at 30001 ms | 0 added (rejected) | time up |
| no digits and clock expires | 0 | time up (clock only starts on the first digit, so this only happens after pause rules) |
| all `piDigits.length` digits typed | `piDigits.length` | complete |

Reference data checks: `piDigits.length >= 1000`, `/^[0-9]+$/.test(piDigits)`, `piDigits.slice(0, 50)` equals the fixture, `piDigits[99] === "9"`.

### 7.7 High score saving

| Before (best, games) | Final score | After | newPersonalBest |
|---|---|---|---|
| (0, 0) | 120 | best 120, games 1 | true |
| (120, 1) | 120 | best 120, games 2 | false (tie) |
| (120, 2) | 119 | best 120, games 3 | false |
| (120, 3) | 121 | best 121, games 4 | true |
| (0, 0) | 0 | best 0, games 1 | false |

bestStreak: stored 7, game streak 5 gives 7; game streak 9 gives 9. Pi games update only bestScore and gamesPlayed.

## 8. Constants table (`src/config/gameRules.ts`)

| Name | Value | Source |
|---|---|---|
| `startingLives` | 3 | MASTER |
| `multiplierCap` | 5 | MASTER (proposed there) |
| `correctPerMultiplierStep` | 5 | MASTER (proposed there) |
| `baseMultiplier` | 1 | MASTER |
| `roundIntroMs` | 600 | (proposed) |
| `correctFeedbackMs` | 400 | (proposed) |
| `wrongFeedbackMs` | 1100 | (proposed) |
| `gameOverDelayMs` | 800 | (proposed) |
| `memoryMaxLitTiles` | 12 | (proposed) |
| `memoryDisplayFloorMs` | 800 | MASTER range (proposed) |
| `memoryPointsPerTile` | 10 | (proposed) |
| `memoryTimeBonusPerTile` | 5 | (proposed) |
| `memoryLevels` | table in 2.2 (14 rows, last repeats) | (proposed) |
| `patternRedrawAttempts` | 5 | (proposed) |
| `mathTiers` | table in 3.2 (5 rows) | (proposed) |
| `mathTierStarts` | [0, 5, 12, 20, 30] | (proposed) |
| `mathTimerMsByTier` | [5000, 4500, 4000, 3500, 3000] | MASTER range (proposed) |
| `mathBasePointsByTier` | [10, 15, 20, 25, 30] | (proposed) |
| `mathTimeBonusMaxByTier` | [5, 8, 10, 13, 15] | (proposed) |
| `mathMaxAnswerDigits` | 3 | (proposed) |
| `mathRecentMemory` | 5 | (proposed) |
| `mathRedrawAttempts` | 20 | (proposed) |
| `piRunMs` | 30000 | MASTER |
| `piMinDigits` | 1000 | MASTER |
| `piShownNextDigits` | 10 | (proposed) |
| `piTimerStartsOnFirstDigit` | true | (proposed) |
| `pauseOnHidden` | true | (proposed) |
| `quitCountsAsGameOver` | true | (proposed) |

Tier operand ranges (3.2) are also constants: `mathRanges` with keys per tier (add and subtract 1..9 or 10..99, multiply 2..9 or 11..99 by 2..9, divide divisor 2..9 quotient 2..9 or 2..30).

## 9. Contradictions and gaps in MASTER.md

1. "Best streak" (section 5, item 7) is not scoped: per mode or global. This doc uses per mode (memory, math). Pi has no streak.
2. "Points x streak multiplier + time bonus" does not say whether the time bonus is multiplied. This doc: not multiplied.
3. Multiplier "x2, x3, ..." in the shared table vs "x1 at start, +1 every 5" in the bullet below it: consistent, but it does not say whether the multiplier applies to the attempt that reaches the threshold. This doc: applies from the next attempt.
4. "Lives: 3" and "full rot = game over" give 4 rot stages (healthy plus 3). DESIGN.md must draw 4 stages, not 3.
5. Pi Challenge: when the 30 s clock starts is not defined (this doc: first digit). Backspace is not defined (this doc: none). The rot meter on timeout (no mistake) is not defined (this doc: no rot).
6. Pi rot behavior: D3 says full rot = game over for all modes; D15 says no lives for Pi. Not a contradiction, but the "fills on the mistake" animation is only for wrong digits.
7. Visual Memory: "1-2 s" display and "1.5 s down to 0.8 s" overlap but do not agree (0.8 is below 1). This doc uses 1500 down to 800.
8. Visual Memory: what happens after a failed round (level repeat?), the grid size switch levels, and the lit tile counts are unspecified. All proposed here.
9. Speed Math: "adaptive" has no trigger. This doc chooses totalCorrect. Negative subtraction results and the number pad having no minus key are unspecified (this doc: never negative).
10. Speed Math: "3-5 s per question" vs "starts at 5 s, shrinks to 3 s": consistent, but the shrink schedule is not given (this doc: 5 tiers).
11. Quitting mid-game: whether the score is saved is unspecified (this doc: saved as a finished game).
12. Pause and background behavior is not in MASTER at all (this doc: pause, resume by tap).
13. Success criterion "one game round starts within 2 taps": Pi first-digit timer start does not conflict, but a "Go" or countdown screen would add a tap. This doc has no countdown.
14. Total games played: "total" only in MASTER; this doc also stores per mode so the home cards can show per-mode counts.
15. No pi digit source is named. Build-time verification against a reputable source is required (section 4.3).
16. No offline or storage-failure behavior for saves is specified (this doc: play continues, save fails silently).
17. The original concept PDF was not re-read for this doc; all concept-derived items come via MASTER.
