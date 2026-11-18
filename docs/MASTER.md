# Do Not Let It Rot: Master Document

Single source of truth for the project. Every other doc (architecture, design, layout, phases) is derived from this one. If they disagree, this file wins until it is updated.

- Status: planning (no product code yet)
- Last updated: 2026-11-19
- Source concept: friend's PDF "Do Not Let It Rot" (3 pages, dark theme), kept at `docs/concept/do-not-let-it-rot-concept.pdf`

## 1. Idea

A fast, browser-based brain-training game that fights "brain rot" (endless scrolling, short attention span, mental laziness). Short timed challenges test memory, math and focus. Rounds take seconds, feedback is instant, and the loop is built around "one more try": score, streaks and personal bests.

Taglines (from the concept): "Keep your brain sharp." / "Scroll less. Think more." / "Your brain called. It wants a workout."

## 2. Problem

Short-form feeds train people to skim and switch. There is no quick, fun, phone-friendly counterweight that takes under a minute and still feels like real effort. This game is that counterweight: the same bite-size format as a feed, but every second asks you to remember, calculate or focus.

## 3. People

| Who | Role |
|---|---|
| Friend (name TBD) | Concept owner. Wrote the original PDF. |
| Najeeb | Builder: product, design, full stack. |
| Players | Students and young people on phones, the same audience that scrolls. Secondary: desktop players. |

## 4. Decisions made (2026-11-19)

| # | Decision |
|---|---|
| D1 | Repo `najeeb101/do-not-let-it-rot`, public, MIT license. Friend added as collaborator once we have their handle. |
| D2 | v1 = the concept's MVP: three modes, Visual Memory, Speed Math, Pi Challenge. |
| D3 | Rot Meter is in v1 and **is** the lives display: 3 lives shown as a brain that rots one stage per lost life. Full rot = game over. |
| D4 | Pi Challenge stops at the first wrong digit. |
| D5 | No backend, no accounts, no login in v1. High scores and stats saved locally in the browser. |
| D6 | Short sound effects and vibration (on supported phones), with a mute toggle. |
| D7 | Mobile-first installable web app (PWA, works offline), deployed on Vercel. Desktop supported. |
| D8 | Stack: Vite + React + TypeScript + Tailwind CSS. No server in v1. Supabase only later for leaderboards. Exact versions checked against current releases before coding (TypeScript pinned, D28). |
| D9 | English only in v1. All UI text kept in one strings file so Arabic (RTL) can be added later. |
| D10 | Visual identity: keep the friend's lime-on-near-black as the signature, add a light mode. Bold, minimal, high contrast. Humor lives in the copy (meme tone), gameplay stays serious. |
| D11 | UI designed in **Canva** (via the browser, see Q3), then built from those designs. |
| D12 | Feel reference: Human Benchmark (humanbenchmark.com): clean, one task per screen, instant result. We borrow the feel, not the look. |
| D13 | Analytics: Vercel Analytics (free tier) only. No other tracking. |
| D14 | Friend credited in README and on the site ("Concept by ..."). |
| D15 | Pi Challenge is a single 30 s run: no lives, no multiplier, no time bonus. Score = correct digits. |
| D16 | Visual Memory is strict: one wrong tap fails the round and costs a life. |
| D17 | Domain: free `*.vercel.app` subdomain for v1. |
| D18 | Countdown: one short 3-2-1 (1.5 s total) before each game, not between rounds. The "2 taps to play" criterion counts taps, not time. |
| D19 | Pi clock starts on the first digit typed (countdown still shown before). |
| D20 | Rot Meter only rots, no healing in v1 (concept's drain-on-success dropped; tell the friend). |
| D21 | Pi screen shows timer + digit count only, no Rot Meter, no streak/multiplier. |
| D22 | Best streak stored per mode (Visual Memory, Speed Math); none for Pi. Games played stored per mode. |
| D23 | Speed Math: no negative answers, no minus key; tier by total correct answers (GAME_RULES thresholds). |
| D24 | Visual Memory display time 1500 ms down to floor 800 ms at high levels (accepted although concept said 1-2 s). |
| D25 | Scoring: time bonus not multiplied; multiplier step applies from the attempt after reaching it. |
| D26 | Pause when tab hidden/app backgrounded; quitting mid-game saves the score as a finished game. |
| D27 | Game over lines chosen by score tier, not by rot stage. |
| D28 | TypeScript pinned to 6.0.3 until typescript-eslint supports 7. |
| D29 | Colors: lime #C6F24E and near-black #0E1116 are estimates; must be matched exactly to the concept PDF before UI build. |
| D30 | Privacy: Vercel Analytics only, no personal data, one-line privacy note on Credits screen. |

## 5. Features

### v1 (MVP)
1. **Home / main menu**: the three modes as cards, each showing its personal best. Tagline, Rot Meter mascot, settings button.
2. **Visual Memory**: a grid flashes some tiles; player taps them back from memory.
3. **Speed Math**: rapid-fire arithmetic, short timer per question.
4. **Pi Challenge**: type as many digits of pi as you can in 30 seconds.
5. **Shared game HUD**: score, streak + multiplier, timer, Rot Meter (lives). Pi Challenge shows timer and digit count only (D21).
6. **Game Over screen**: final score, best streak, "new personal best" moment, Retry and Menu buttons.
7. **Local saves**: best score per mode, best streak per mode (not Pi), games played per mode (D22).
8. **Settings**: sound on/off, vibration on/off, theme (system / light / dark), reset local data.
9. **PWA**: installable, works offline after the first visit.
10. **Credits**: "Concept by [friend]" plus a one-line privacy note (D30).

### Later A (after v1 ships, no backend; named to avoid clashing with build phases in PHASES.md)
- Sequence Memory, Number Recall, Odd One Out modes.
- Stats screen: accuracy, average reaction time, best streak, history.
- Share button: share a score card image or text.
- Mixed Mode: random mini-games chained together.

### Later B (needs backend)
- Daily Challenge: same seed for everyone each day.
- Leaderboards (Supabase, anonymous accounts first, like Taqriban).
- Optional Arabic version.

## 6. Mode rules (v1)

Numbers are starting values to tune in playtesting (all live in `src/config/gameRules.ts`). Not all come from the concept; the D-numbers record what was approved.

### Shared mechanics (from the concept)
| Element | Rule |
|---|---|
| Timer | Short per-question or per-round timer. |
| Lives | 3. A wrong answer or a timeout costs one. Shown as the Rot Meter. |
| Streak | Consecutive correct answers raise a multiplier (x2, x3, ...). A miss resets the streak. |
| Difficulty | Adaptive: harder as the player succeeds. |
| Score | Points x streak multiplier + time bonus. |
| High score | Saved per mode, locally. |

- Multiplier: x1 at start, +1 every 5 correct in a row, capped at x5. A new step applies from the attempt after reaching it (D25).
- Time bonus: proportional to the fraction of the timer left. Not multiplied (D25).
- Countdown: one 3-2-1 (1.5 s) before each game, not between rounds (D18).
- The Rot Meter only rots, no healing (D20).
- Pause when the tab is hidden; quitting mid-game saves the score as a finished game (D26).
- Game over lines are chosen by score tier (D27).

### Visual Memory
- Grid starts 3x3. Some tiles light up for 1500 ms (down to a floor of 800 ms at high levels, D24), then hide. The player taps the same tiles.
- One wrong tap fails the round and costs a life (D16).
- The recall phase has a timer (10 s). A timeout costs a life.
- Difficulty: more lit tiles each level, the grid grows (4x4, then 5x5), the display time shrinks (1500 ms down to 800 ms, D24).

### Speed Math
- One question at a time, 3-5 s per question (starts at 5 s, shrinks to 3 s).
- Difficulty ramps by total correct answers (thresholds in GAME_RULES, D23): single-digit + and - (7 + 5), then two-digit by one-digit x (47 x 6), then mixed operations.
- Answers are integers only. Division only when it comes out even. No negative answers, so no minus key (D23).
- A wrong answer or a timeout costs a life.
- On phones: a custom on-screen number pad (digits, backspace, submit, no minus key), so the system keyboard doesn't cover the game.

### Pi Challenge
- "How many digits of pi can you remember in 30 seconds?"
- "3." is pre-filled. The player types digits, and each is checked live against pi.
- The 30 s clock starts on the first digit typed. The 3-2-1 countdown is still shown before (D18, D19).
- The run ends at the first wrong digit or when 30 s run out.
- Score = number of correct digits after the decimal point.
- Lives, streak multiplier and time bonus **do not apply** to this mode (a single run). No Rot Meter: the HUD shows timer and digit count only (D21). See D15.
- A stored reference of at least 1,000 digits is enough (the record holders type far more, but not in 30 s).

## 7. Constraints

- Palette colors (D29) must be matched exactly to the concept PDF before the UI build.
- Budget: free tier only (Vercel Hobby, GitHub, Canva free).
- No accounts or personal data in v1. Local storage only.
- Must fit one phone screen per game state, with no scrolling during play. No overlap or overflow on small phones (360 px wide).
- Light and dark mode, respecting system preference by default.
- Animated: tile flashes, the Rot Meter decaying, number pops, game over moment. Must respect "reduce motion".
- Accessible: tap targets at least 44 px, color is never the only signal (the lit tiles also change shape or brightness), keyboard play on desktop.
- Repo hygiene: README, docs in `docs/`, `CLAUDE.md`, one-command setup (`npm install && npm run dev`), no secrets in git, no Claude co-author line in commits.

## 8. Success criteria (v1)

- All three modes playable start to finish on a phone and a desktop, offline after the first load.
- One game round of any mode starts within 2 taps from opening the site.
- Lighthouse: performance, accessibility and best practices all 90 or higher on mobile.
- Unit tests cover scoring, difficulty ramps, question generation and pi checking.
- Live on Vercel with the link shared with the friend.

## 9. Open questions

| # | Question | Owner |
|---|---|---|
| Q1 | Friend's name (for credits) and GitHub handle (for collaborator access)? | Najeeb |
| Q2 | Deadline, if any? | Najeeb |
| Q3 | Canva connector is not available; the Canva designs are being made via the browser instead. Confirm that route works. | Najeeb |

## 10. Documents to derive from this

- `docs/ARCHITECTURE.md`: stack, folder structure, game engine and state model, storage schema, PWA, testing.
- `docs/DESIGN.md`: identity, color and type tokens (light + dark), components, motion, sound, Rot Meter stages.
- `docs/LAYOUT.md`: every screen and flow, mobile and desktop, states (idle, show, recall, feedback, game over).
- `docs/GAME_RULES.md`: exact formulas and difficulty tables per mode (tunable constants in one place).
- `docs/PHASES.md`: build plan in phases with acceptance checks.
- `docs/CANVA_BRIEF.md`: what to design in Canva, frames and sizes, so the design maps 1:1 onto the layout doc.
