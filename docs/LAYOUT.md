# Layout: Do Not Let It Rot

Every screen and state. Derived from `docs/MASTER.md`. Anything not in MASTER is marked **(proposed)**. Visual tokens (accent, surface, mode card, pad key, and so on) are defined in `docs/DESIGN.md`; this file only names them.

## 0. Global rules

- Viewports: 360x640 minimum, 390x844 primary. Everything must fit without scrolling during play, with no overflow at 360 px wide.
- Use dynamic viewport height (`100dvh`) and safe-area insets (notch, home bar). Lock page scroll and overscroll during play (proposed).
- Desktop: one centered column, max width 480 px for play screens. Home may be wider (about 960 px, three mode cards in a row). Background outside the column is the plain surface color.
- Tap targets at least 44x44 px. Inputs live in the bottom third (thumb zone). Information lives at the top.
- Color is never the only signal: correct/wrong also use icon, shape or text. Lit tiles change shape or brightness too.
- Reduce motion: replace flashes, decay and pops with simple fades or instant changes.
- All text comes from one strings file (D9).
- Screen list (names are reused in `CANVA_BRIEF.md`): Home, Mode Intro, Countdown, Visual Memory (Show, Recall, Feedback), Speed Math, Pi Challenge, Pause, Game Over, Settings, Credits, Install Prompt.

Legend for wireframes: `[ ]` button or tile, `(( ))` Rot Meter, `===` timer bar.

## 1. Shared HUD (play screens)

Purpose: always-visible game state, one row, never scrolls.

Regions (top to bottom): safe-area inset, HUD row (56 px), play area, input area.

HUD row, left to right:
- Rot Meter (3 lives as brain stage, see section 11). Tap does nothing.
- Score (large, number pops on change).
- Streak with multiplier: "x3" badge with a flame or bolt icon, shown only when the multiplier is above x1 (proposed), streak count beside it.
- Pause button (proposed), 44 px, top right. Also reachable by Esc and by tab hide.

Timer: a full-width bar directly under the HUD row (Speed Math question timer, Visual Memory recall timer, Pi 30 s run timer) plus a seconds number at the end of the bar for readers who cannot judge the bar. Bar turns to its warning state in the last 25 percent (proposed), with a shape or text change, not color only.

Pi Challenge variant: no multiplier and no streak (D15). HUD shows Rot Meter (see gap list), correct count as score, and the 30 s bar.

```
390 x 844
+--------------------------------+
| ((brain))   SCORE 1240   x3  II|  HUD 56 px
| ================------- 3.2s   |  timer bar
+--------------------------------+
```

## 2. Home / Menu

Purpose: pick a mode in one tap.
Primary action: tap a mode card.

Regions top to bottom:
1. Top bar: settings button (gear, right). Credits link is in the footer, not here.
2. Hero: Rot Meter mascot (current stage 0 "fresh", idle animation), title "Do Not Let It Rot", tagline (rotating from the three concept taglines, proposed rotation, default "Keep your brain sharp.").
3. Mode cards, stacked, three: Visual Memory, Speed Math, Pi Challenge. Each card: icon, name, one-line hint, personal best ("Best: 12" or "No score yet"), and the card is one big tap target (min 88 px tall).
4. Footer: "Concept by [friend]" credits link, version (proposed).

Above the fold at 390x844: everything including all three cards and footer. At 360x640: top bar, mascot (shrinks to 96 px), title, tagline, all three cards in compact form (72 px tall), footer link. Tagline may drop to one line. If tight, the footer sits directly under the cards. No scrolling on home either (goal).

```
390 x 844                           
+--------------------------------+
|                          [gear]|
|          ((  brain  ))         |
|     DO NOT LET IT ROT           |
|     Keep your brain sharp.      |
|                                 |
| +----------------------------+  |
| | [grid]  Visual Memory      |  |
| |         Best: 8            |  |
| +----------------------------+  |
| +----------------------------+  |
| | [+x]    Speed Math         |  |
| |         Best: 1,240        |  |
| +----------------------------+  |
| +----------------------------+  |
| | [pi]    Pi Challenge       |  |
| |         Best: 21 digits    |  |
| +----------------------------+  |
|      Concept by [friend]        |
+--------------------------------+
```

Desktop (1440x900): centered block, max about 960 px wide. Mascot and title on the left half, three mode cards in a column on the right, or three cards in one row under the hero (proposed: row). Footer pinned bottom. Keyboard: 1, 2, 3 start the modes (proposed), Tab and Enter work on cards.

States: first visit (all bests show "No score yet"), returning (bests shown), install prompt banner may appear (section 10).

## 3. Mode Intro

Purpose: tell the rules in 1 to 2 lines. Skippable after first play of that mode (proposed: stored per mode; after the first completed or abandoned game the card goes straight to Countdown).
Primary action: Start.

Regions: back arrow (top left), mode icon and name, rules (1 to 2 lines), tiny preview (optional, proposed), Start button at the bottom (thumb zone), "Don't show again" is not needed because it auto-skips.

Rules copy examples (strings file):
- Visual Memory: "Watch the tiles light up. Tap them back. One wrong tap costs a life."
- Speed Math: "Solve fast. Wrong or too slow costs a life."
- Pi Challenge: "Type digits of pi. 30 seconds. First mistake ends it."

Above the fold: all of it.

```
+--------------------------------+
| [<]                            |
|                                |
|            [ icon ]            |
|         Speed Math             |
|   Solve fast. Wrong or too     |
|   slow costs a life.           |
|                                |
|                                |
|        [      START      ]     |  thumb zone
+--------------------------------+
```

Rule: keep it under 2 taps from opening the site. First open: Home, tap card (1), Start (2), game begins after the countdown. Second play of a mode: tap card (1), countdown starts.

Keyboard: Enter or Space starts, Esc goes back.

## 4. Countdown 3-2-1

Purpose: give 3 seconds to get ready. Input is disabled.
Regions: HUD in its zero state (dimmed), large centered numeral "3", "2", "1", then "Go" (proposed, 300 ms). Mode name small under the numeral. Number scales and fades each second (fade only if reduce motion). Tap does nothing, Esc returns to Home.
Primary action: none (automatic).
Above the fold: all.

```
+--------------------------------+
| ((brain))   SCORE 0        II  |
| ==============================  |
|                                |
|                                |
|              3                 |
|          Speed Math            |
|                                |
|     (pad or grid dimmed)       |
+--------------------------------+
```

## 5. Visual Memory

Purpose: remember and tap lit tiles. Grid 3x3 at the start, then 4x4, 5x5 (MASTER section 6).
Primary action: tap tiles in recall.

Common regions: HUD row, timer area, status line, grid (square, centered, fills width minus 16 px gutters, max 480 px), bottom padding. The grid sits in the lower-middle so thumbs reach it. Tiles are at least 44 px even at 5x5 on 360 px wide (360 - 32 gutters = 328 / 5 = 65 px less gaps, ok).

### 5a. Show phase
- Status line: "Watch" with an eye icon.
- Some tiles light up together for 1.5 s down to 0.8 s (proposed ranges are from MASTER). Lit tile = bright accent fill plus a shape change (inner ring or check mark shape).
- Taps are ignored. Timer bar shows display time (or is hidden, proposed: hidden, only the "Watch" label).
- Round number label: "Round 4" (proposed).

### 5b. Recall phase
- Status line: "Your turn: 4 left" showing the number of tiles still to find.
- Recall timer bar (proposed 10 s).
- Each correct tap: tile fills with the lit style, a small pop, vibration tick. Order does not matter (proposed, gap list).
- First wrong tap fails the round (D16): that tile shakes, shows an X icon, the missed lit tiles are revealed with an outline.
- Timeout: remaining correct tiles are revealed, a life is lost.

### 5c. Round feedback
- Success: all lit tiles pulse, "+120" score pop, streak and multiplier update, 600 ms, then the next round shows (proposed pause).
- Fail: Rot Meter advances one stage with a short decay animation, "Wrong tile" or "Too slow" text, the answer revealed for 1 s, then next round or Game Over if no lives are left.

```
Recall, 3x3
+--------------------------------+
| ((brain))   SCORE 360   x2   II|
| ============------------ 6s    |
|                                |
|      Your turn: 2 left         |
|                                |
|     +-----+-----+-----+        |
|     |     | ##  |     |        |
|     +-----+-----+-----+        |
|     | ##  |     |     |        |
|     +-----+-----+-----+        |
|     |     |     |     |        |
|     +-----+-----+-----+        |
|                                |
+--------------------------------+
```

Above the fold: all (no scrolling in any phase). Keyboard (desktop): grid tiles are focusable, arrow keys move focus, Space or Enter taps (proposed), Esc pauses.

## 6. Speed Math

Purpose: solve one integer question at a time under a per-question timer (5 s down to 3 s, proposed in MASTER).
Primary action: enter the answer, press submit.

Regions top to bottom:
1. HUD row.
2. Timer bar (per question, resets each question).
3. Question: large, centered ("47 x 6"), middle of the upper half.
4. Answer display: shows typed digits with a blinking caret, large, with an underline. Shows a minus sign if negative mode is used.
5. Feedback line: small, empty until an answer, then "Correct" / "Wrong, it was 282" (also tinted, with icon).
6. Number pad (bottom, thumb zone): 4 rows by 3 columns, keys at least 56 px tall.

Pad layout (proposed):
```
[ 1 ] [ 2 ] [ 3 ]
[ 4 ] [ 5 ] [ 6 ]
[ 7 ] [ 8 ] [ 9 ]
[ <x] [ 0 ] [ OK]
```
Backspace on the bottom left, Submit (OK) bottom right, larger and in the accent style. A minus key is **(proposed)** only if negative answers are enabled; the recommended v1 choice is to avoid negative answers (a - b with a >= b), so there is no minus key. If negatives are allowed, add a "+/-" toggle key above Backspace and make the pad 5 rows (needs about 280 px of pad height, still fits 640).

Submit rule (proposed): explicit OK, plus auto-submit is not used because the answer length is unknown. Empty submit does nothing.

Heights at 390x844: HUD 56, timer 24, question about 120, answer 72, feedback 32, pad 4 x 64 + gaps = about 280, margins; total fits. At 360x640: pad keys 52 px (min 44), question 88 px, same order; still no scroll.

```
390 x 844
+--------------------------------+
| ((brain))  SCORE 540   x2    II|
| ==========---------------- 3.1s|
|                                |
|            47 x 6              |
|                                |
|              28_               |
|           ----------           |
|        (feedback line)         |
|                                |
|   [ 1 ]   [ 2 ]   [ 3 ]        |
|   [ 4 ]   [ 5 ]   [ 6 ]        |
|   [ 7 ]   [ 8 ]   [ 9 ]        |
|   [ <x ]  [ 0 ]   [ OK ]       |
+--------------------------------+
```

Feedback (round feedback state): on correct, answer text flashes accent, score and multiplier pop, vibration tick, next question in about 300 ms. On wrong or timeout: answer shakes, correct answer shown for about 800 ms, Rot Meter advances a stage, then the next question (or Game Over).

Keyboard (desktop): digits 0-9 type, Backspace deletes, Enter submits, Esc pauses. The on-screen pad still shows and highlights keys on press. The pad is hidden on desktop widths with a fine pointer (proposed) but kept visible by default to keep one layout.

## 7. Pi Challenge

Purpose: type as many digits of pi as possible in 30 s. Score = correct digits after the decimal point (MASTER section 6). Single run, no lives, no multiplier (D15).
Primary action: tap digits.

Regions top to bottom:
1. HUD row (Rot Meter, correct count as score, Pause).
2. 30 s timer bar with seconds number.
3. Live count: "12 digits" (large).
4. Digit stream: a single row of the typed number, "3." prefilled and in the muted style, followed by the typed digits in the accent style. The row scrolls horizontally so the newest digit stays at the right edge, with a fade at the left edge (proposed: horizontal single-line stream is easier to implement and reads like a ticker; wrapping to several lines is the alternative). A blinking caret follows the last digit. Group digits in blocks of 5 with a thin gap for readability (proposed).
5. Number pad (bottom): digits 1-9 and 0 only. No backspace, no submit, no minus, because each digit is checked live and a wrong digit ends the run (proposed). Layout: 3x3 plus a centered 0 on the bottom row (or 0 spanning).
6. End state overlay (see below).

```
390 x 844
+--------------------------------+
| ((brain))   12 digits        II|
| ==============-------------- 18s|
|                                |
|        pi so far               |
|   3.14159 26535 8979_          |
|   (scrolls left as it grows)   |
|                                |
|                                |
|   [ 1 ]   [ 2 ]   [ 3 ]        |
|   [ 4 ]   [ 5 ]   [ 6 ]        |
|   [ 7 ]   [ 8 ]   [ 9 ]        |
|          [ 0 ]                 |
+--------------------------------+
```

States:
- Idle after countdown: timer starts on the first digit tap (proposed) or at countdown end. MASTER says 30 s but not the trigger; proposed: timer starts at countdown end, to keep every mode consistent.
- Typing: each correct digit is appended, tick sound and tiny vibration, count pops.
- Wrong digit: run ends immediately. The wrong digit appears in an error style with an X icon, and the correct digit is shown next to it ("You typed 5, it was 3"). Stream stays visible for about 1.5 s, then the Game Over screen appears. The Rot Meter fills to full rot in this beat (MASTER section 6, see gap list).
- Timeout: the stream freezes, "Time" label, then Game Over after about 1 s.

Keyboard: digits 0-9 type. No Backspace (a digit is never editable). Esc pauses. Enter is unused.

## 8. Pause (proposed)

MASTER has no pause. Proposed behavior:
- Auto pause when the tab hides or the app goes to the background (Page Visibility). Timers stop, and a Pause overlay is shown on return.
- Manual: the pause button in the HUD, or Esc on desktop.
- Overlay (dims play area, hides the grid and question so pausing cannot be used to study the board): title "Paused", Resume (primary), Quit to menu (secondary, with confirm only if a run is in progress, proposed). Resume goes through a short 3-2-1 (proposed: 1 s "Ready").
- Pause is not available during Countdown, and does not cost a life.
- Memory Show phase pause: the round restarts from the start of the Show phase (proposed) so the board is not leaked.

```
+--------------------------------+
|    (dimmed play area)          |
|                                |
|        PAUSED                  |
|                                |
|     [      RESUME      ]       |
|     [   Quit to menu   ]       |
+--------------------------------+
```

## 9. Game Over

Purpose: show the result, celebrate a new best, make Retry the easiest tap.
Primary action: Retry. Secondary: Menu.

Regions top to bottom:
1. Rot Meter at full rot (stage 4), decay animation then still.
2. Headline: "Brain rot" or a meme line (strings file; copy tone from D10). For Pi: "Wrong digit" with the correct digit repeated.
3. Final score (large, count-up animation).
4. Details: best streak this run (not for Pi), personal best line ("Best: 1,240").
5. New best moment (when beaten): badge "New personal best", confetti or pulse (fade only with reduce motion), score styled in accent.
6. Buttons at the bottom (thumb zone): Retry (large, primary, accent), Menu (secondary).
7. Share button is Phase 2, so not shown.

Above the fold: all. Retry loop: Retry goes straight to Countdown (skip Intro), no extra taps, so game over to next run is 1 tap plus 3 seconds.

```
+--------------------------------+
|                                |
|         ((  rotten  ))         |
|          BRAIN ROT             |
|                                |
|            1,240               |
|        NEW PERSONAL BEST       |
|                                |
|   Best streak     9            |
|   Previous best   980          |
|                                |
|     [       RETRY       ]      |
|     [       Menu        ]      |
+--------------------------------+
```

Keyboard: Enter or R retries, Esc or M goes to Menu.

## 10. Settings

Purpose: toggle preferences, reset data. Opened from the gear on Home. Full screen on mobile, a centered modal (max 480 px) on desktop.

Regions: header with back arrow and "Settings"; list of rows, each at least 56 px high:
- Sound (toggle).
- Vibration (toggle). Row is disabled with a hint "Not supported on this device" where the Vibration API is missing (iOS Safari, proposed).
- Theme: segmented control System / Light / Dark.
- Reset data: destructive-styled row. Tapping opens a confirm dialog: "Erase all scores and stats? This cannot be undone." Buttons: Cancel (primary focus) and Erase (destructive). Resets bests, best streak, total games (MASTER section 5 local saves), and also the intro-skip flags (proposed).
- Links: Credits, version (proposed).

Above the fold: all rows at both sizes. Changes apply instantly (no Save button).

```
+--------------------------------+
| [<]   Settings                 |
|--------------------------------|
| Sound                    [ on ]|
| Vibration                [ on ]|
| Theme   [System|Light|Dark]    |
| Reset data               [ > ] |
| Credits                  [ > ] |
|                                |
|                    v1.0.0      |
+--------------------------------+
```

## 11. Rot Meter (mascot and lives)

The Rot Meter is a brain mascot with 4 stages (D3: 3 lives, one stage per lost life):
- Stage 0 Fresh (3 lives left).
- Stage 1 Tired (2 lives left).
- Stage 2 Rotting (1 life left).
- Stage 3 Rotten (0 lives, game over).

Used at three sizes: Home hero (about 128 px), HUD (about 36 px, shows the stage only), Game Over (about 160 px). Decay animation plays between stages; with reduce motion it swaps instantly. Stage is also exposed as text for screen readers ("2 lives left").

The Canva brief lists the four stages as separate assets (stage names match the list above). MASTER does not name stages (DESIGN.md owns names); the list here is the layout contract: exactly 4 stages.

## 12. Credits / About

Purpose: credit the friend (D14), license, links.
Regions: back arrow, title, "Concept by [friend]" (name TBD, Q1), "Built by Najeeb" (proposed), GitHub link, MIT license line, short blurb about the idea, Vercel Analytics note (privacy line: only anonymous page analytics, no accounts, proposed).
Primary action: back. Fits the viewport without scrolling.

```
+--------------------------------+
| [<]   About                    |
|                                |
|   Do Not Let It Rot            |
|   Scroll less. Think more.     |
|                                |
|   Concept by [friend]          |
|   Built by Najeeb              |
|   GitHub  |  MIT license       |
+--------------------------------+
```

## 13. Install Prompt (PWA, proposed)

Non-intrusive. Rules:
- Never during play. Never on the first visit.
- Show only on Home, after the first completed game (or the second visit), once the browser has fired the install event (Chrome, Edge, Android).
- Form: a slim dismissible banner above the footer ("Install for offline play", Install button, small close X). It does not push cards out of view: it replaces the footer line on 360x640.
- Dismiss hides it for 30 days (proposed). Installing hides it for good.
- iOS Safari has no install event: show a one-line hint "Share, then Add to Home Screen" in Settings and in the same banner once (proposed).
- An offline-ready toast "Works offline now" after first service worker cache (proposed), auto-hides after 3 s.

```
+--------------------------------+
| Install for offline play  [Install] [x]|
+--------------------------------+
```

## 14. Flows

### First open to playing (at most 2 taps)
1. Open site, Home (no load screen).
2. Tap a mode card (tap 1) -> Mode Intro (first time only).
3. Tap Start (tap 2) -> Countdown -> play.
After the first play of a mode: tap card (1 tap) -> Countdown -> play.

### Retry loop
Game Over -> Retry (1 tap) -> Countdown -> play. Intro is never shown on Retry. Menu returns to Home, and the card shows the updated best.

### Pause flow
Play -> (tab hide, Esc or pause button) -> Pause -> Resume -> short Ready -> play. Quit goes to Home and the run is discarded (it still counts as a game played, proposed).

### Settings flow
Home -> gear -> Settings -> toggle or reset (confirm) -> back.

### Install flow
Home (after first completed game) -> banner -> Install -> browser dialog.

### Keyboard controls (desktop)
| Key | Action |
|---|---|
| 0-9 | Type a digit (Speed Math, Pi Challenge) |
| Enter | Submit answer (Speed Math), Start (Intro), Retry (Game Over), activate focused item |
| Backspace | Delete last digit (Speed Math only) |
| Esc | Pause during play, back from Intro and Settings, cancel dialogs, Menu from Game Over |
| Arrow keys, Space | Move focus and tap tiles in Visual Memory (proposed) |
| 1, 2, 3 | Pick a mode on Home (proposed) |
| R | Retry on Game Over (proposed) |

Focus is always visible (focus ring), and the page never scrolls on a key press.

## 15. Screen to frame map

Names to use verbatim in Canva: Home, Mode Intro, Countdown, Visual Memory Show, Visual Memory Recall, Visual Memory Feedback, Speed Math, Pi Challenge, Pi Challenge End, Pause, Game Over, Game Over New Best, Settings, Credits, Install Prompt, Reset Confirm.

## 16. Gaps and contradictions in MASTER

Listed in the report so they can be settled. See the end of the task report; also tracked below for the build.

1. Rot Meter in Pi Challenge: D3 says the Rot Meter is the lives display, D15 says Pi has no lives, but section 6 says the meter fills on the mistake. Layout treats it as a display that shows full rot only at the end of the run.
2. Multiplier: "x2, x3, ..." in shared mechanics vs "x1 at start, +1 every 5 correct, cap x5" (proposed). It is unclear if the first multiplier step happens at 5 or at the second correct.
3. Score formula ("points x multiplier + time bonus") never gives base points per correct answer or per Visual Memory round.
4. Visual Memory has no per-tile order rule (any order vs sequence), and no wrong-tap penalty detail beyond "fails the round".
5. Speed Math negatives: subtraction may go negative; MASTER says "integers only" but gives no rule and no minus key.
6. Pi timer start (countdown end vs first digit) is not stated.
7. Pi Backspace and submit are not stated; layout proposes none.
8. Best streak is stored once in "Local saves" but personal bests are per mode; unclear if streak is global or per mode.
9. Pause, mode intro screen and skip rule, install prompt and Credits layout details are not in MASTER.
10. "Round starts within 2 taps" is fine for first play, but there is no rule on whether the 3-2-1 countdown counts as a delay (kept at 3 s here).
11. Visual Memory personal best unit (level reached vs score) and Pi best unit (digits) are not stated.
12. Home screen is listed as "Home / main menu" and settings "button"; no mention of the credits link location (placed in the footer here).
13. Q1 friend's name is still unknown, so the credits string is a placeholder.
